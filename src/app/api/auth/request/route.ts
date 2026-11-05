import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appSecret } from "@/lib/session";
import { HttpError, clientIp, limitOrThrow, parse, readJson, route } from "@/lib/http";
import { generateNumericCode, hashCode, maskIdentifier, normalizeIdentifier } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { deliverOtp } from "@/lib/notify";
import { otpRequestSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = route(async (request: Request) => {
  const { identifier } = parse(otpRequestSchema, await readJson(request));
  const id = normalizeIdentifier(identifier);
  if (!id) throw new HttpError(400, "Numéro (format international) ou e-mail invalide.");

  limitOrThrow(rateLimit(`otp:ip:${clientIp(request)}`, 8, 10 * 60_000));
  limitOrThrow(rateLimit(`otp:id:${id.value}`, 3, 10 * 60_000));

  const code = generateNumericCode(6);
  await prisma.otpCode.create({
    data: { identifier: id.value, codeHash: hashCode(appSecret(), `login:${id.value}`, code), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  const { demoCode } = await deliverOtp(id, code);
  return NextResponse.json({ ok: true, masked: maskIdentifier(id), demoCode });
});
