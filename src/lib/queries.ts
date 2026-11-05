// Lectures pour les pages serveur. Tout est sérialisé (dates en ISO) pour passer aux composants client.
import type { BookingStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { ACTIVE_BOOKING, allowedActions, type Actor, type BookingAction } from "./booking-flow";
import { cityOf, samePlace, scoreMatch } from "./matching";
import { convert, isCurrency, type CurrencyCode } from "./currency";
import { DEFAULT_RATES_EUR } from "./catalog";

export type Reputation = { rating: number | null; ratingCount: number; deliveries: number };
export type PersonView = { id: string; name: string; verified: boolean; phoneVerified: boolean; demo: boolean } & Reputation;

export type TripView = {
  id: string; origin: string; destination: string; via: string[]; departureAt: string;
  availableWeightKg: number; remainingKg: number; pricePerKg: number; currency: string;
  notes: string | null; status: string; traveler: PersonView;
};

export type ShipmentView = {
  id: string; origin: string; destination: string; description: string; category: string; weightKg: number;
  budget: number | null; currency: string; desiredDate: string | null; status: string; createdAt: string; sender: string;
};

const shortName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

async function reputations(ids: string[]): Promise<Map<string, Reputation>> {
  const map = new Map<string, Reputation>();
  if (!ids.length) return map;
  const [reviews, deliveries] = await Promise.all([
    prisma.review.groupBy({ by: ["recipientId"], where: { recipientId: { in: ids } }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["travelerId"], where: { travelerId: { in: ids }, status: "DELIVERED" }, _count: { _all: true } }),
  ]);
  for (const id of ids) map.set(id, { rating: null, ratingCount: 0, deliveries: 0 });
  for (const r of reviews) map.set(r.recipientId, { ...map.get(r.recipientId)!, rating: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null, ratingCount: r._count._all });
  for (const d of deliveries) map.set(d.travelerId, { ...map.get(d.travelerId)!, deliveries: d._count._all });
  return map;
}

type TripRow = Awaited<ReturnType<typeof fetchTripRows>>[number];
async function fetchTripRows(where: object, take: number) {
  return prisma.trip.findMany({
    where,
    include: { traveler: { select: { id: true, fullName: true, verification: true, phoneVerifiedAt: true, isDemo: true } } },
    orderBy: { departureAt: "asc" },
    take,
  });
}

async function toTripViews(rows: TripRow[]): Promise<TripView[]> {
  const ids = rows.map((r) => r.id);
  const [booked, reps] = await Promise.all([
    ids.length
      ? prisma.booking.groupBy({ by: ["tripId"], where: { tripId: { in: ids }, status: { in: ACTIVE_BOOKING as BookingStatus[] } }, _sum: { weightKg: true } })
      : Promise.resolve([]),
    reputations([...new Set(rows.map((r) => r.travelerId))]),
  ]);
  const bookedMap = new Map(booked.map((b) => [b.tripId, b._sum.weightKg ?? 0]));
  return rows.map((t) => ({
    id: t.id, origin: t.origin, destination: t.destination, via: t.via, departureAt: t.departureAt.toISOString(),
    availableWeightKg: t.availableWeightKg,
    remainingKg: Math.max(0, Math.round((t.availableWeightKg - (bookedMap.get(t.id) ?? 0)) * 10) / 10),
    pricePerKg: t.pricePerKg, currency: t.currency, notes: t.notes, status: t.status,
    traveler: {
      id: t.traveler.id, name: shortName(t.traveler.fullName), verified: t.traveler.verification === "VERIFIED",
      phoneVerified: !!t.traveler.phoneVerifiedAt, demo: t.traveler.isDemo, ...(reps.get(t.travelerId) ?? { rating: null, ratingCount: 0, deliveries: 0 }),
    },
  }));
}

export type TripFilters = { origin?: string; destination?: string; minKg?: number; sort?: "date" | "price" | "capacity" };

export async function listTrips(filters: TripFilters = {}): Promise<TripView[]> {
  const rows = await fetchTripRows({ status: "OPEN", departureAt: { gte: new Date() } }, 300);
  let views = await toTripViews(rows);
  if (filters.origin) views = views.filter((t) => samePlace(t.origin, filters.origin!));
  if (filters.destination) views = views.filter((t) => samePlace(t.destination, filters.destination!));
  if (filters.minKg) views = views.filter((t) => t.remainingKg >= filters.minKg!);
  views = views.filter((t) => t.remainingKg > 0);
  const eur = (t: TripView) => (isCurrency(t.currency) ? convert(t.pricePerKg, t.currency, "EUR") : t.pricePerKg);
  if (filters.sort === "price") views.sort((a, b) => eur(a) - eur(b));
  else if (filters.sort === "capacity") views.sort((a, b) => b.remainingKg - a.remainingKg);
  return views.slice(0, 60);
}

export async function getTrip(id: string): Promise<TripView | null> {
  const rows = await fetchTripRows({ id }, 1);
  return rows[0] ? (await toTripViews(rows))[0] : null;
}

function toShipmentView(s: { id: string; origin: string; destination: string; description: string; category: string; weightKg: number; budget: number | null; currency: string; desiredDate: Date | null; status: string; createdAt: Date; sender: { fullName: string } }): ShipmentView {
  return {
    id: s.id, origin: s.origin, destination: s.destination, description: s.description, category: s.category, weightKg: s.weightKg,
    budget: s.budget, currency: s.currency, desiredDate: s.desiredDate?.toISOString() ?? null, status: s.status,
    createdAt: s.createdAt.toISOString(), sender: shortName(s.sender.fullName),
  };
}

export async function listShipments(filters: { origin?: string; destination?: string } = {}): Promise<ShipmentView[]> {
  const rows = await prisma.shipment.findMany({
    where: { status: "SEARCHING" }, include: { sender: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: 200,
  });
  let views = rows.map(toShipmentView);
  if (filters.origin) views = views.filter((s) => samePlace(s.origin, filters.origin!));
  if (filters.destination) views = views.filter((s) => samePlace(s.destination, filters.destination!));
  return views.slice(0, 60);
}

export async function getUserShipments(userId: string, onlyOpen = false): Promise<ShipmentView[]> {
  const rows = await prisma.shipment.findMany({
    where: { senderId: userId, ...(onlyOpen ? { status: "SEARCHING" } : {}) },
    include: { sender: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: 50,
  });
  return rows.map(toShipmentView);
}

/** Trajets compatibles avec un colis (pour la mise en relation). */
export async function matchesForShipment(shipmentId: string, userId: string) {
  const s = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!s || s.senderId !== userId) return [];
  const trips = await listTrips({ origin: s.origin, destination: s.destination });
  return trips
    .map((t) => ({ trip: t, match: scoreMatch({ ...t, departureAt: new Date(t.departureAt) }, { ...s }) }))
    .filter((x): x is { trip: TripView; match: NonNullable<typeof x.match> } => x.match !== null)
    .sort((a, b) => b.match.score - a.match.score);
}

/** Colis en attente compatibles avec un trajet (côté voyageur). */
export async function matchesForTrip(tripId: string, userId: string) {
  const trip = await getTrip(tripId);
  if (!trip) return [];
  const owner = await prisma.trip.findUnique({ where: { id: tripId }, select: { travelerId: true } });
  if (owner?.travelerId !== userId) return [];
  const shipments = await listShipments({ origin: trip.origin, destination: trip.destination });
  return shipments.filter((s) => s.weightKg <= trip.remainingKg);
}

export async function platformStats() {
  try {
    const now = new Date();
    const [openTrips, openShipments, delivered, kg, travelers] = await Promise.all([
      prisma.trip.count({ where: { status: "OPEN", departureAt: { gte: now } } }),
      prisma.shipment.count({ where: { status: "SEARCHING" } }),
      prisma.booking.count({ where: { status: "DELIVERED" } }),
      prisma.trip.aggregate({ where: { status: "OPEN", departureAt: { gte: now } }, _sum: { availableWeightKg: true } }),
      prisma.trip.findMany({ where: { status: "OPEN", departureAt: { gte: now } }, select: { origin: true, destination: true } }),
    ]);
    const countries = new Set<string>();
    for (const t of travelers) for (const p of [t.origin, t.destination]) {
      const c = p.split(",")[1]?.trim().toLowerCase();
      if (c) countries.add(c);
    }
    return { openTrips, openShipments, delivered, availableKg: Math.round(kg._sum.availableWeightKg ?? 0), countries: countries.size, live: true };
  } catch {
    return { openTrips: 0, openShipments: 0, delivered: 0, availableKg: 0, countries: 0, live: false };
  }
}

export type CorridorRate = { key: string; from: string; to: string; eurPerKg: number; fromListings: boolean };

/** Tarifs au kg par corridor, en EUR : moyenne des annonces ouvertes, sinon tarif indicatif. */
export async function corridorRates(): Promise<CorridorRate[]> {
  const sums = new Map<string, { sum: number; n: number; from: string; to: string }>();
  try {
    const trips = await prisma.trip.findMany({ where: { status: "OPEN", departureAt: { gte: new Date() } }, select: { origin: true, destination: true, pricePerKg: true, currency: true }, take: 500 });
    for (const t of trips) {
      if (!isCurrency(t.currency)) continue;
      const key = `${cityOf(t.origin)}>${cityOf(t.destination)}`;
      const cur = sums.get(key) ?? { sum: 0, n: 0, from: t.origin, to: t.destination };
      cur.sum += convert(t.pricePerKg, t.currency as CurrencyCode, "EUR"); cur.n += 1;
      sums.set(key, cur);
    }
  } catch { /* base indisponible : tarifs indicatifs seulement */ }
  const out = new Map<string, CorridorRate>();
  for (const [key, v] of sums) out.set(key, { key, from: v.from, to: v.to, eurPerKg: v.sum / v.n, fromListings: true });
  const pretty = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);
  for (const [key, eur] of Object.entries(DEFAULT_RATES_EUR)) {
    if (out.has(key)) continue;
    const [a, b] = key.split(">");
    out.set(key, { key, from: pretty(a), to: pretty(b), eurPerKg: eur, fromListings: false });
  }
  return [...out.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export type DashboardBooking = {
  id: string; status: string; actor: Actor; origin: string; destination: string; weightKg: number;
  agreedPrice: number; serviceFee: number; currency: string; other: string; departureAt: string; updatedAt: string;
};

export async function userDashboard(userId: string) {
  const [trips, shipments, bookings] = await Promise.all([
    prisma.trip.findMany({ where: { travelerId: userId }, orderBy: { departureAt: "desc" }, take: 30, include: { bookings: { select: { status: true } } } }),
    getUserShipments(userId),
    prisma.booking.findMany({
      where: { OR: [{ senderId: userId }, { travelerId: userId }] }, orderBy: { updatedAt: "desc" }, take: 50,
      include: { trip: true, shipment: true, sender: { select: { fullName: true } }, traveler: { select: { fullName: true } } },
    }),
  ]);
  return {
    trips: trips.map((t) => ({
      id: t.id, origin: t.origin, destination: t.destination, departureAt: t.departureAt.toISOString(), availableWeightKg: t.availableWeightKg,
      pricePerKg: t.pricePerKg, currency: t.currency, status: t.status,
      pending: t.bookings.filter((b) => b.status === "REQUESTED").length, active: t.bookings.filter((b) => ["ACCEPTED", "PAID", "HANDED_OVER"].includes(b.status)).length,
    })),
    shipments,
    bookings: bookings.map<DashboardBooking>((b) => {
      const actor: Actor = b.senderId === userId ? "sender" : "traveler";
      return {
        id: b.id, status: b.status, actor, origin: b.trip.origin, destination: b.trip.destination, weightKg: b.weightKg,
        agreedPrice: b.agreedPrice, serviceFee: b.serviceFee, currency: b.currency,
        other: shortName(actor === "sender" ? b.traveler.fullName : b.sender.fullName),
        departureAt: b.trip.departureAt.toISOString(), updatedAt: b.updatedAt.toISOString(),
      };
    }),
  };
}

export type BookingDetail = {
  id: string; status: BookingStatus; actor: Actor; allowed: BookingAction[];
  trip: { id: string; origin: string; destination: string; departureAt: string; pricePerKg: number };
  shipment: { description: string; category: string; weightKg: number; recipientName: string | null; recipientPhone: string | null };
  money: { price: number; fee: number; total: number; currency: string };
  payment: { status: string; provider: string } | null;
  other: PersonView;
  codes: { handover: string; delivery: string } | null;
  codeAttempts: number;
  events: { id: string; type: string; note: string | null; at: string; mine: boolean }[];
  messages: { id: string; body: string; at: string; mine: boolean }[];
  reviewed: boolean;
};

export async function getBookingDetail(userId: string, id: string): Promise<BookingDetail | null> {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: true, shipment: true, payment: true,
      events: { orderBy: { createdAt: "asc" } }, messages: { orderBy: { createdAt: "asc" }, take: 200 },
      sender: { select: { id: true, fullName: true, verification: true, phoneVerifiedAt: true, isDemo: true } },
      traveler: { select: { id: true, fullName: true, verification: true, phoneVerifiedAt: true, isDemo: true } },
      reviews: { where: { authorId: userId }, select: { id: true } },
    },
  });
  if (!b || (b.senderId !== userId && b.travelerId !== userId)) return null;
  const actor: Actor = b.senderId === userId ? "sender" : "traveler";
  const otherUser = actor === "sender" ? b.traveler : b.sender;
  const reps = await reputations([otherUser.id]);
  const showRecipient = actor === "sender" || ["PAID", "HANDED_OVER", "DELIVERED"].includes(b.status);
  return {
    id: b.id, status: b.status, actor, allowed: allowedActions(b.status, actor),
    trip: { id: b.trip.id, origin: b.trip.origin, destination: b.trip.destination, departureAt: b.trip.departureAt.toISOString(), pricePerKg: b.trip.pricePerKg },
    shipment: {
      description: b.shipment.description, category: b.shipment.category, weightKg: b.weightKg,
      recipientName: showRecipient ? b.shipment.recipientName : null, recipientPhone: showRecipient ? b.shipment.recipientPhone : null,
    },
    money: { price: b.agreedPrice, fee: b.serviceFee, total: b.agreedPrice + b.serviceFee, currency: b.currency },
    payment: b.payment ? { status: b.payment.status, provider: b.payment.provider } : null,
    other: {
      id: otherUser.id, name: shortName(otherUser.fullName), verified: otherUser.verification === "VERIFIED",
      phoneVerified: !!otherUser.phoneVerifiedAt, demo: otherUser.isDemo, ...(reps.get(otherUser.id) ?? { rating: null, ratingCount: 0, deliveries: 0 }),
    },
    // Seul l'expéditeur voit les codes : il remet le premier au voyageur, le second au destinataire.
    codes: actor === "sender" ? { handover: b.handoverCode, delivery: b.deliveryCode } : null,
    codeAttempts: b.codeAttempts,
    events: b.events.map((e) => ({ id: e.id, type: e.type, note: e.note, at: e.createdAt.toISOString(), mine: e.actorId === userId })),
    messages: b.messages.map((m) => ({ id: m.id, body: m.body, at: m.createdAt.toISOString(), mine: m.senderId === userId })),
    reviewed: b.reviews.length > 0,
  };
}
