import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, verifySession } from "./session";

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const id = verifySession(token);
    if (!id) return null;
    return await prisma.user.findUnique({ where: { id } });
  } catch {
    return null; // base indisponible ou secret manquant : visiteur anonyme
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Connectez-vous pour continuer.");
  return user;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export type SessionUser = { id: string; fullName: string; phoneVerified: boolean };
