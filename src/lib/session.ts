// Jeton de session signé (HMAC-SHA256), stocké dans un cookie httpOnly. Pur : aucune dépendance Next.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tgp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function appSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (32 caractères minimum) est obligatoire en production.");
  }
  return "dev-only-secret-do-not-use-in-production-0123456789";
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function signSession(userId: string, now = Date.now(), ttl = SESSION_TTL_SECONDS, secret = appSecret()): string {
  const payload = b64(JSON.stringify({ u: userId, e: Math.floor(now / 1000) + ttl }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySession(token: string | undefined | null, now = Date.now(), secret = appSecret()): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u?: string; e?: number };
    if (!data.u || !data.e || data.e * 1000 < now) return null;
    return data.u;
  } catch {
    return null;
  }
}
