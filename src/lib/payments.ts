import { randomUUID } from "node:crypto";
import { HttpError } from "./http";

/**
 * Séquestre : les fonds de l'expéditeur sont bloqués (hold), puis libérés au voyageur (release)
 * quand le destinataire confirme avec son code, ou remboursés (refund) en cas d'annulation.
 *
 * `simulation` : aucun argent ne circule. Sert au pilote et aux démonstrations.
 * Pour un vrai paiement (Wave, Orange Money, carte…), implémenter PaymentProvider avec le prestataire
 * agréé, vérifier ses webhooks signés et l'idempotence, puis déclarer PAYMENT_PROVIDER=<nom>.
 */
export interface PaymentProvider {
  name: string;
  hold(input: { bookingId: string; amount: number; currency: string }): Promise<{ providerRef: string }>;
  release(providerRef: string): Promise<void>;
  refund(providerRef: string): Promise<void>;
}

const simulation: PaymentProvider = {
  name: "simulation",
  async hold() { return { providerRef: `sim_${randomUUID()}` }; },
  async release() {},
  async refund() {},
};

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "simulation";
  if (name === "simulation") return simulation;
  throw new HttpError(503, `Prestataire de paiement « ${name} » non implémenté.`);
}

export const paymentsAreSimulated = () => (process.env.PAYMENT_PROVIDER ?? "simulation") === "simulation";
