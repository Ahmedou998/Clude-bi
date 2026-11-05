import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { applyBookingAction } from "@/lib/bookings";
import { limitOrThrow, parse, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { bookingActionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  limitOrThrow(rateLimit(`action:${user.id}`, 60, 10 * 60_000));
  const { id } = await params;
  const input = parse(bookingActionSchema, await readJson(request));
  const result = await applyBookingAction(user, id, input);
  return NextResponse.json({ data: result });
});
