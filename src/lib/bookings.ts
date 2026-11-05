// Logique métier des réservations : création, transitions, codes, séquestre, avis, messages.
import { Prisma, type BookingStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import { ACTIVE_BOOKING, nextStatus, type Actor } from "./booking-flow";
import { quote, samePlace } from "./matching";
import { generateNumericCode, safeEqual } from "./otp";
import { getPaymentProvider } from "./payments";
import type { BookingActionInput } from "./validations";

type Tx = Prisma.TransactionClient;
type UserRef = { id: string };

const MAX_CODE_ATTEMPTS = 5;

export async function bookedKg(tx: Tx, tripId: string, excludeBookingId?: string): Promise<number> {
  const result = await tx.booking.aggregate({
    where: {
      tripId,
      status: { in: ACTIVE_BOOKING as BookingStatus[] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    _sum: { weightKg: true },
  });
  return result._sum.weightKg ?? 0;
}

const event = (tx: Tx, bookingId: string, actorId: string | null, type: string, note?: string) =>
  tx.booking.update({ where: { id: bookingId }, data: { events: { create: { type, actorId, note } } }, select: { id: true } });

async function lock(tx: Tx, table: "Trip" | "Booking", id: string) {
  // Verrou de ligne : évite deux acceptations simultanées qui dépasseraient la capacité.
  if (table === "Trip") await tx.$queryRaw`SELECT id FROM "Trip" WHERE id = ${id} FOR UPDATE`;
  else await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${id} FOR UPDATE`;
}

export async function createBooking(user: UserRef, input: { tripId: string; shipmentId: string }) {
  return prisma.$transaction(async (tx) => {
    await lock(tx, "Trip", input.tripId);
    const trip = await tx.trip.findUnique({ where: { id: input.tripId } });
    if (!trip || trip.status !== "OPEN" || trip.departureAt.getTime() <= Date.now()) {
      throw new HttpError(404, "Ce trajet n'est plus disponible.");
    }
    if (trip.travelerId === user.id) throw new HttpError(400, "Vous ne pouvez pas réserver votre propre trajet.");

    const shipment = await tx.shipment.findUnique({ where: { id: input.shipmentId } });
    if (!shipment || shipment.senderId !== user.id) throw new HttpError(404, "Colis introuvable.");
    if (shipment.status !== "SEARCHING") throw new HttpError(409, "Ce colis est déjà pris en charge.");
    if (!samePlace(trip.origin, shipment.origin) || !samePlace(trip.destination, shipment.destination)) {
      throw new HttpError(400, "Le colis et le trajet n'ont pas le même itinéraire.");
    }

    const remaining = trip.availableWeightKg - (await bookedKg(tx, trip.id));
    if (shipment.weightKg > remaining + 0.001) {
      throw new HttpError(409, `Capacité insuffisante : il reste ${Math.max(0, Math.round(remaining * 10) / 10)} kg sur ce trajet.`);
    }
    const already = await tx.booking.findUnique({ where: { tripId_shipmentId: { tripId: trip.id, shipmentId: shipment.id } } });
    if (already) throw new HttpError(409, "Vous avez déjà envoyé une demande pour ce trajet.");

    const q = quote(trip.pricePerKg, shipment.weightKg);
    return tx.booking.create({
      data: {
        tripId: trip.id,
        shipmentId: shipment.id,
        travelerId: trip.travelerId,
        senderId: user.id,
        weightKg: shipment.weightKg,
        agreedPrice: q.price,
        serviceFee: q.fee,
        currency: trip.currency,
        handoverCode: generateNumericCode(6),
        deliveryCode: generateNumericCode(6),
        events: { create: { type: "REQUESTED", actorId: user.id } },
      },
      select: { id: true },
    });
  });
}

function actorOf(booking: { senderId: string; travelerId: string }, userId: string): Actor {
  if (booking.senderId === userId) return "sender";
  if (booking.travelerId === userId) return "traveler";
  throw new HttpError(404, "Réservation introuvable."); // 404 plutôt que 403 : on ne révèle pas l'existence
}

/** Vérifie le code AVANT la transaction : un mauvais essai doit être compté même si l'action échoue. */
async function checkCode(user: UserRef, bookingId: string, action: "confirm_handover" | "confirm_delivery", code?: string) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!b) throw new HttpError(404, "Réservation introuvable.");
  const actor = actorOf(b, user.id);
  try { nextStatus(b.status, actor, action); } catch { throw new HttpError(409, "Cette action n'est plus possible à cette étape."); }
  if (!code) throw new HttpError(400, "Saisissez le code à 6 chiffres.");
  if (b.codeAttempts >= MAX_CODE_ATTEMPTS) {
    throw new HttpError(429, "Trop d'essais incorrects. Signalez un problème pour que le support vous aide.");
  }
  const expected = action === "confirm_handover" ? b.handoverCode : b.deliveryCode;
  if (!safeEqual(code, expected)) {
    await prisma.booking.update({ where: { id: b.id }, data: { codeAttempts: { increment: 1 } } });
    throw new HttpError(400, `Code incorrect. Il vous reste ${MAX_CODE_ATTEMPTS - b.codeAttempts - 1} essai(s).`);
  }
}

export async function applyBookingAction(user: UserRef, bookingId: string, input: BookingActionInput) {
  if (input.action === "review") return addReview(user, bookingId, input);
  if (input.action === "confirm_handover" || input.action === "confirm_delivery") {
    await checkCode(user, bookingId, input.action, input.code);
  }

  return prisma.$transaction(async (tx) => {
    await lock(tx, "Booking", bookingId);
    const b = await tx.booking.findUnique({ where: { id: bookingId }, include: { trip: true, shipment: true, payment: true } });
    if (!b) throw new HttpError(404, "Réservation introuvable.");
    const actor = actorOf(b, user.id);
    let to: BookingStatus;
    try { to = nextStatus(b.status, actor, input.action as Exclude<typeof input.action, "review">) as BookingStatus; }
    catch { throw new HttpError(409, "Cette action n'est plus possible à cette étape."); }

    const provider = getPaymentProvider();
    let note: string | undefined = input.reason;

    switch (input.action) {
      case "accept": {
        await lock(tx, "Trip", b.tripId);
        if (b.shipment.status !== "SEARCHING") throw new HttpError(409, "Ce colis n'est plus disponible.");
        const booked = await bookedKg(tx, b.tripId, b.id);
        if (booked + b.weightKg > b.trip.availableWeightKg + 0.001) throw new HttpError(409, "La capacité restante ne suffit plus pour ce colis.");
        await tx.shipment.update({ where: { id: b.shipmentId }, data: { status: "MATCHED" } });
        await tx.booking.updateMany({ where: { shipmentId: b.shipmentId, id: { not: b.id }, status: "REQUESTED" }, data: { status: "CANCELLED" } });
        if (booked + b.weightKg >= b.trip.availableWeightKg - 0.001) await tx.trip.update({ where: { id: b.tripId }, data: { status: "FULL" } });
        break;
      }
      case "pay": {
        const amount = b.agreedPrice + b.serviceFee;
        const { providerRef } = await provider.hold({ bookingId: b.id, amount, currency: b.currency });
        await tx.payment.upsert({
          where: { bookingId: b.id },
          create: { bookingId: b.id, provider: provider.name, providerRef, amount, currency: b.currency, status: "HELD", heldAt: new Date() },
          update: { provider: provider.name, providerRef, amount, status: "HELD", heldAt: new Date() },
        });
        note = `${amount} ${b.currency} bloqués`;
        break;
      }
      case "confirm_handover":
        await tx.shipment.update({ where: { id: b.shipmentId }, data: { status: "IN_TRANSIT" } });
        await tx.booking.update({ where: { id: b.id }, data: { codeAttempts: 0 } });
        break;
      case "confirm_delivery":
        await tx.shipment.update({ where: { id: b.shipmentId }, data: { status: "DELIVERED" } });
        if (b.payment?.providerRef) await provider.release(b.payment.providerRef);
        if (b.payment) await tx.payment.update({ where: { id: b.payment.id }, data: { status: "RELEASED", releasedAt: new Date() } });
        break;
      case "cancel": {
        if (b.payment?.status === "HELD") {
          if (b.payment.providerRef) await provider.refund(b.payment.providerRef);
          await tx.payment.update({ where: { id: b.payment.id }, data: { status: "REFUNDED" } });
        }
        if (b.shipment.status === "MATCHED") await tx.shipment.update({ where: { id: b.shipmentId }, data: { status: "SEARCHING" } });
        if (b.trip.status === "FULL") await tx.trip.update({ where: { id: b.tripId }, data: { status: "OPEN" } });
        break;
      }
      case "dispute":
        await tx.shipment.update({ where: { id: b.shipmentId }, data: { status: "DISPUTED" } });
        break;
      case "reject":
        break;
    }

    const clearLocations = ["DELIVERED", "REJECTED", "CANCELLED", "DISPUTED"].includes(to);
    await tx.booking.update({
      where: { id: b.id },
      data: {
        status: to,
        ...(clearLocations ? {
          meetingLatitude: null, meetingLongitude: null, meetingLabel: null, meetingUpdatedAt: null,
          liveLatitude: null, liveLongitude: null, liveLocationUpdatedAt: null,
        } : {}),
      },
    });
    await event(tx, b.id, user.id, to, note);
    await tx.auditLog.create({ data: { actorId: user.id, action: `booking.${input.action}`, entityType: "Booking", entityId: b.id, metadata: { from: b.status, to } } });
    return { id: b.id, status: to };
  });
}

async function addReview(user: UserRef, bookingId: string, input: BookingActionInput) {
  if (!input.rating) throw new HttpError(400, "Choisissez une note de 1 à 5.");
  const b = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!b) throw new HttpError(404, "Réservation introuvable.");
  const actor = actorOf(b, user.id);
  if (b.status !== "DELIVERED") throw new HttpError(409, "Vous pourrez noter après la livraison.");
  try {
    await prisma.review.create({
      data: { authorId: user.id, recipientId: actor === "sender" ? b.travelerId : b.senderId, bookingId, rating: input.rating, comment: input.comment || null },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Vous avez déjà donné votre avis.");
    throw e;
  }
  return { id: b.id, status: b.status };
}

export async function postMessage(user: UserRef, bookingId: string, body: string) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, select: { senderId: true, travelerId: true, status: true } });
  if (!b) throw new HttpError(404, "Réservation introuvable.");
  actorOf(b, user.id);
  if (b.status === "REJECTED" || b.status === "CANCELLED") throw new HttpError(409, "Cette réservation est close.");
  return prisma.message.create({ data: { bookingId, senderId: user.id, body }, select: { id: true, body: true, senderId: true, createdAt: true } });
}
