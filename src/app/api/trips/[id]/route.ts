import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { HttpError, route } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Retire un trajet de la recherche. Refusé si des colis sont déjà engagés. */
export const DELETE = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id }, include: { bookings: { select: { status: true } } } });
  if (!trip || trip.travelerId !== user.id) throw new HttpError(404, "Trajet introuvable.");
  if (trip.bookings.some((b) => ["ACCEPTED", "PAID", "HANDED_OVER", "DISPUTED"].includes(b.status))) {
    throw new HttpError(409, "Des colis sont déjà engagés sur ce trajet. Annulez d'abord les réservations concernées.");
  }
  await prisma.$transaction([
    prisma.booking.updateMany({ where: { tripId: id, status: "REQUESTED" }, data: { status: "REJECTED" } }),
    prisma.trip.update({ where: { id }, data: { status: "CANCELLED" } }),
  ]);
  return NextResponse.json({ ok: true });
});
