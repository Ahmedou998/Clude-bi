import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appSecret, signSession } from "@/lib/session";
import { setSessionCookie } from "@/lib/auth";
import { HttpError, clientIp, limitOrThrow, parse, readJson, route } from "@/lib/http";
import { hashCode, normalizeIdentifier, safeEqual } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { otpVerifySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
const MAX_ATTEMPTS = 5;

export const POST = route(async (request: Request) => {
  const input = parse(otpVerifySchema, await readJson(request));
  const id = normalizeIdentifier(input.identifier);
  if (!id) throw new HttpError(400, "Identifiant invalide.");
  limitOrThrow(rateLimit(`verify:ip:${clientIp(request)}`, 20, 10 * 60_000));

  const otp = await prisma.otpCode.findFirst({
    where: { identifier: id.value, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= MAX_ATTEMPTS) throw new HttpError(400, "Code expiré. Demandez-en un nouveau.");

  const ok = safeEqual(otp.codeHash, hashCode(appSecret(), `login:${id.value}`, input.code));
  if (!ok) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "Code incorrect.");
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const where = id.kind === "phone" ? { phone: id.value } : { email: id.value };
  let user = await prisma.user.findUnique({ where });
  if (!user) {
    if (!input.fullName) throw new HttpError(400, "Indiquez votre nom pour créer votre compte.");
    user = await prisma.user.create({
      data: { ...where, fullName: input.fullName, ...(id.kind === "phone" ? { phoneVerifiedAt: new Date() } : { emailVerifiedAt: new Date() }) },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: id.kind === "phone" ? { phoneVerifiedAt: user.phoneVerifiedAt ?? new Date() } : { emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
    });
  }

  const response = NextResponse.json({ ok: true, user: { id: user.id, fullName: user.fullName } });
  setSessionCookie(response, signSession(user.id));
  return response;
});
