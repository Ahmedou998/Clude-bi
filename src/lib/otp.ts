// Fonctions pures pour les codes à usage unique (connexion, remise, livraison).
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export type Identifier = { kind: "phone" | "email"; value: string };

/** Normalise un téléphone (format international) ou un e-mail. Retourne null si invalide. */
export function normalizeIdentifier(raw: string): Identifier | null {
  const input = raw.trim();
  if (!input) return null;
  if (input.includes("@")) {
    const email = input.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120 ? { kind: "email", value: email } : null;
  }
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (!digits.startsWith("+")) {
    // Numéro sénégalais saisi en local : 7X XXX XX XX (9 chiffres).
    if (/^7[0-9]{8}$/.test(digits)) digits = "+221" + digits;
    else return null;
  }
  return /^\+[1-9]\d{7,14}$/.test(digits) ? { kind: "phone", value: digits } : null;
}

export function generateNumericCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += String(randomInt(0, 10));
  return out;
}

export function hashCode(secret: string, scope: string, code: string): string {
  return createHmac("sha256", secret).update(`${scope}:${code}`).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function maskIdentifier(id: Identifier): string {
  if (id.kind === "email") {
    const [user, domain] = id.value.split("@");
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  return `${id.value.slice(0, 4)} ••• •• ${id.value.slice(-2)}`;
}
