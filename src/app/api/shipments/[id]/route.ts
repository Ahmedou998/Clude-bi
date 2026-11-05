import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { HttpError, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const DELETE = route(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment || shipment.senderId !== user.id) throw new HttpError(404, "Colis introuvable.");
  if (shipment.status !== "SEARCHING") throw new HttpError(409, "Ce colis est déjà pris en charge : annulez la réservation.");
  await prisma.$transaction([
    prisma.booking.updateMany({ where: { shipmentId: id, status: "REQUESTED" }, data: { status: "CANCELLED" } }),
    prisma.shipment.update({ where: { id }, data: { status: "CANCELLED" } }),
  ]);
  return NextResponse.json({ ok: true });
});
