export const formatDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso));

export const formatDateLong = (iso: string | Date) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

export function daysUntil(iso: string | Date, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

export function splitPlace(value: string): { city: string; country: string } {
  const [city, ...rest] = value.split(",");
  return { city: city.trim(), country: rest.join(",").trim() };
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

/** Date de départ saisie (AAAA-MM-JJ) → instant stable, sans décalage de fuseau à l'affichage. */
export const departureFromDay = (day: string) => `${day}T23:00:00.000Z`;

/** N'accepte que des chemins internes pour les redirections (évite les redirections ouvertes). */
export function safeNext(value: string | undefined | null, fallback = "/espace"): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}
