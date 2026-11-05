import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Enveloppe les handlers : erreurs métier → JSON propre, erreurs inattendues → 500 sans fuite d'information. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
      }
      console.error("[api]", error);
      return NextResponse.json({ error: "Erreur interne. Réessayez dans un instant." }, { status: 500 });
    }
  };
}

/** Lit un corps JSON. Exiger application/json bloque les envois de formulaires inter-sites (CSRF). */
export async function readJson(request: Request): Promise<unknown> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    throw new HttpError(415, "Content-Type application/json requis.");
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Corps de requête invalide.");
  }
}

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path?.join(".");
    throw new HttpError(400, issue ? (field ? `${issue.message} (${field})` : issue.message) : "Données invalides.", result.error.flatten());
  }
  return result.data;
}

export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

export function limitOrThrow(check: { ok: boolean; retryAfter: number }) {
  if (!check.ok) throw new HttpError(429, `Trop de tentatives. Réessayez dans ${check.retryAfter} s.`);
}
