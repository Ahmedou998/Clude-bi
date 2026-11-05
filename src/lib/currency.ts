// Devises prises en charge et conversion INDICATIVE.
// Les taux ci-dessous sont des valeurs d'affichage approximatives (XOF est fixe à l'EUR : 655,957).
// Les paiements sont toujours facturés dans la devise du trajet ; la conversion ne sert qu'à comparer.
// Avant la mise en production, brancher un fournisseur de taux de change.

export const CURRENCIES = {
  XOF: { label: "Franc CFA (BCEAO)", perEur: 655.957, decimals: 0 },
  EUR: { label: "Euro", perEur: 1, decimals: 0 },
  USD: { label: "Dollar US", perEur: 1.1, decimals: 0 },
  GBP: { label: "Livre sterling", perEur: 0.85, decimals: 0 },
  CAD: { label: "Dollar canadien", perEur: 1.5, decimals: 0 },
  MAD: { label: "Dirham marocain", perEur: 10.8, decimals: 0 },
  TND: { label: "Dinar tunisien", perEur: 3.4, decimals: 0 },
  GHS: { label: "Cedi ghanéen", perEur: 15, decimals: 0 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = "XOF";

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  return (amount / CURRENCIES[from].perEur) * CURRENCIES[to].perEur;
}

export function formatMoney(amount: number, currency: string, locale = "fr-FR"): string {
  const code = isCurrency(currency) ? currency : DEFAULT_CURRENCY;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: CURRENCIES[code].decimals,
  }).format(Math.round(amount));
}
