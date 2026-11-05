import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { limitOrThrow, parse, readJson, route } from "@/lib/http";
import { normalizeIdentifier } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { listShipments } from "@/lib/queries";
import { shipmentSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const GET = route(async (request: NextRequest) => {
  const p = request.nextUrl.searchParams;
  const data = await listShipments({ origin: p.get("origin") || undefined, destination: p.get("destination") || undefined });
  return NextResponse.json({ data });
});

export const POST = route(async (request: NextRequest) => {
  const user = await requireUser();
  limitOrThrow(rateLimit(`shipment:${user.id}`, 10, 60 * 60_000));
  const { prohibitedAck, recipientPhone, ...input } = parse(shipmentSchema, await readJson(request));
  const shipment = await prisma.shipment.create({
    data: { ...input, recipientPhone: normalizeIdentifier(recipientPhone)!.value, senderId: user.id, prohibitedAckAt: new Date() },
  });
  void prohibitedAck;
  return NextResponse.json({ data: { id: shipment.id } }, { status: 201 });
});
