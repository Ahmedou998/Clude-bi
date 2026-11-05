import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { HttpError, limitOrThrow, parse, readJson, route } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { bookingLocationSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const activeStatuses = ["ACCEPTED", "PAID", "HANDED_OVER"];

async function getBookingForParticipant(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      senderId: true, travelerId: true, status: true,
      meetingLatitude: true, meetingLongitude: true, meetingLabel: true, meetingUpdatedAt: true,
      liveLatitude: true, liveLongitude: true, liveLocationUpdatedAt: true,
    },
  });
  if (!booking || (booking.senderId !== userId && booking.travelerId !== userId)) {
    throw new HttpError(404, "Réservation introuvable.");
  }
  return booking;
}

export const GET = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const booking = await getBookingForParticipant(id, user.id);
  const locationIsFresh = booking.liveLocationUpdatedAt !== null
    && Date.now() - booking.liveLocationUpdatedAt.getTime() <= 120_000
    && booking.status === "HANDED_OVER";

  if (!locationIsFresh && booking.liveLocationUpdatedAt) {
    await prisma.booking.updateMany({
      where: { id, liveLocationUpdatedAt: booking.liveLocationUpdatedAt },
      data: { liveLatitude: null, liveLongitude: null, liveLocationUpdatedAt: null },
    });
  }

  const isActive = activeStatuses.includes(booking.status);
  return NextResponse.json({
    data: {
      meeting: isActive && booking.meetingLatitude !== null && booking.meetingLongitude !== null
        ? { latitude: booking.meetingLatitude, longitude: booking.meetingLongitude, label: booking.meetingLabel, updatedAt: booking.meetingUpdatedAt?.toISOString() ?? null }
        : null,
      live: locationIsFresh && booking.liveLatitude !== null && booking.liveLongitude !== null
        ? { latitude: booking.liveLatitude, longitude: booking.liveLongitude, updatedAt: booking.liveLocationUpdatedAt!.toISOString() }
        : null,
    },
  });
});

export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  limitOrThrow(rateLimit(`location:${user.id}`, 10, 60_000));
  const { id } = await params;
  const input = parse(bookingLocationSchema, await readJson(request));
  const booking = await getBookingForParticipant(id, user.id);

  if (input.kind === "meeting") {
    if (!activeStatuses.includes(booking.status)) throw new HttpError(409, "Le point de rendez-vous est disponible après acceptation.");
    await prisma.booking.update({
      where: { id },
      data: {
        meetingLatitude: input.latitude,
        meetingLongitude: input.longitude,
        meetingLabel: input.label || null,
        meetingUpdatedAt: new Date(),
      },
    });
    return NextResponse.json({ data: { ok: true } });
  }

  if (booking.travelerId !== user.id || booking.status !== "HANDED_OVER") {
    throw new HttpError(409, "Le suivi GPS du voyageur est disponible uniquement après la remise du colis.");
  }
  await prisma.booking.update({
    where: { id },
    data: { liveLatitude: input.latitude, liveLongitude: input.longitude, liveLocationUpdatedAt: new Date() },
  });
  return NextResponse.json({ data: { ok: true } });
});

export const DELETE = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const booking = await getBookingForParticipant(id, user.id);
  if (booking.travelerId !== user.id) throw new HttpError(404, "Réservation introuvable.");
  await prisma.booking.update({
    where: { id },
    data: { liveLatitude: null, liveLongitude: null, liveLocationUpdatedAt: null },
  });
  return NextResponse.json({ data: { ok: true } });
});