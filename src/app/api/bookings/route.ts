import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { limitOrThrow, parse, readJson, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { bookingRequestSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  limitOrThrow(rateLimit(`booking:${user.id}`, 20, 60 * 60_000));
  const input = parse(bookingRequestSchema, await readJson(request));
  const booking = await createBooking(user, input);
  return NextResponse.json({ data: booking }, { status: 201 });
});
