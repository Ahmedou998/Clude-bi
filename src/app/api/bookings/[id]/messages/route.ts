import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { postMessage } from "@/lib/bookings";
import { HttpError, limitOrThrow, parse, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { messageSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const GET = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const b = await prisma.booking.findUnique({ where: { id }, select: { senderId: true, travelerId: true } });
  if (!b || (b.senderId !== user.id && b.travelerId !== user.id)) throw new HttpError(404, "Réservation introuvable.");
  const after = new URL(request.url).searchParams.get("after");
  const rows = await prisma.message.findMany({
    where: { bookingId: id, ...(after ? { createdAt: { gt: new Date(after) } } : {}) },
    orderBy: { createdAt: "asc" }, take: 200,
  });
  return NextResponse.json({ data: rows.map((m) => ({ id: m.id, body: m.body, at: m.createdAt.toISOString(), mine: m.senderId === user.id })) });
});

export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  limitOrThrow(rateLimit(`msg:${user.id}`, 30, 60_000));
  const { id } = await params;
  const { body } = parse(messageSchema, await readJson(request));
  const m = await postMessage(user, id, body);
  return NextResponse.json({ data: { id: m.id, body: m.body, at: m.createdAt.toISOString(), mine: true } }, { status: 201 });
});
