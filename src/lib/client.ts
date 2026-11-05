"use client";
// Appel JSON vers nos routes API. Lève une Error avec le message affichable à l'utilisateur.
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers: options.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Connexion impossible. Vérifiez votre réseau et réessayez.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? "Une erreur est survenue.");
  return payload as T;
}
