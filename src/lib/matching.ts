// Rapprochement trajet ↔ colis et calcul du prix (pures, testées).
import { convert, isCurrency, type CurrencyCode } from "./currency";

export const SERVICE_FEE_RATE = 0.08; // commission de service payée par l'expéditeur — à valider avec le modèle économique.

export function normalizePlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ville seule (avant la virgule). « Dakar, Sénégal » → « dakar ». */
export function cityOf(value: string): string {
  return normalizePlace(value.split(",")[0] ?? value);
}

/** Deux lieux correspondent si leurs villes sont égales, ou si l'une contient l'autre (ex. « Paris » / « Paris, France »). */
export function samePlace(a: string, b: string): boolean {
  const ca = cityOf(a), cb = cityOf(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  const na = normalizePlace(a), nb = normalizePlace(b);
  return na.includes(nb) || nb.includes(na);
}

export function quote(pricePerKg: number, weightKg: number, rate = SERVICE_FEE_RATE) {
  const price = Math.max(0, Math.round(pricePerKg * weightKg));
  const fee = Math.round(price * rate);
  return { price, fee, total: price + fee };
}

export type TripLike = {
  origin: string; destination: string; departureAt: Date;
  remainingKg: number; pricePerKg: number; currency: string;
};
export type ShipmentLike = {
  origin: string; destination: string; weightKg: number;
  desiredDate?: Date | null; budget?: number | null; currency: string;
};

export type MatchResult = { score: number; reasons: string[]; withinBudget: boolean | null };

/** Retourne null si le trajet ne peut pas transporter le colis. Sinon un score 0–100 et les raisons. */
export function scoreMatch(trip: TripLike, shipment: ShipmentLike, now = new Date()): MatchResult | null {
  if (!samePlace(trip.origin, shipment.origin) || !samePlace(trip.destination, shipment.destination)) return null;
  if (trip.remainingKg < shipment.weightKg) return null;
  if (trip.departureAt.getTime() < now.getTime()) return null;

  let score = 55;
  const reasons = ["Même itinéraire"];

  const spare = trip.remainingKg - shipment.weightKg;
  score += Math.min(10, spare);
  reasons.push(`${shipment.weightKg} kg tiennent dans la capacité`);

  if (shipment.desiredDate) {
    const days = (shipment.desiredDate.getTime() - trip.departureAt.getTime()) / 86_400_000;
    if (days >= 0 && days <= 14) { score += 20; reasons.push("Part avant la date souhaitée"); }
    else if (days < 0 && days > -4) { score += 8; reasons.push("Part juste après la date souhaitée"); }
    else score -= 15;
  } else score += 8;

  let withinBudget: boolean | null = null;
  if (shipment.budget && isCurrency(shipment.currency) && isCurrency(trip.currency)) {
    const cost = convert(trip.pricePerKg * shipment.weightKg, trip.currency as CurrencyCode, shipment.currency as CurrencyCode);
    withinBudget = cost <= shipment.budget;
    if (withinBudget) { score += 15; reasons.push("Dans votre budget"); }
    else score -= 10;
  } else score += 5;

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, withinBudget };
}
