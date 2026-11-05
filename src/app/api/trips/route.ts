import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { limitOrThrow, parse, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { listTrips } from "@/lib/queries";
import { tripSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const GET = route(async (request: NextRequest) => {
  const p = request.nextUrl.searchParams;
  const minKg = Number(p.get("minKg")) || undefined;
  const sort = p.get("sort");
  const data = await listTrips({
    origin: p.get("origin") || undefined, destination: p.get("destination") || undefined, minKg,
    sort: sort === "price" || sort === "capacity" ? sort : "date",
  });
  return NextResponse.json({ data });
});

export const POST = route(async (request: NextRequest) => {
  const user = await requireUser();
  limitOrThrow(rateLimit(`trip:${user.id}`, 10, 60 * 60_000));
  const input = parse(tripSchema, await readJson(request));
  const trip = await prisma.trip.create({ data: { ...input, travelerId: user.id } });
  return NextResponse.json({ data: { id: trip.id } }, { status: 201 });
});
