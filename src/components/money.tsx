"use client";
import { convert, formatMoney, isCurrency, type CurrencyCode } from "@/lib/currency";
import { useDisplayCurrency } from "./providers";

/** Montant dans sa devise réelle ; si l'utilisateur affiche une autre devise, une conversion indicative suit. */
export function Money({ amount, currency, suffix, approx = true }: { amount: number; currency: string; suffix?: string; approx?: boolean }) {
  const { currency: shown } = useDisplayCurrency();
  const main = formatMoney(amount, currency);
  const showApprox = approx && isCurrency(currency) && shown !== currency;
  return (
    <span className="num">
      {main}{suffix}
      {showApprox && (
        <small className="muted" style={{ display: "block", fontSize: ".6em", fontWeight: 500, letterSpacing: 0, fontFamily: "var(--font-body)" }}>
          ≈ {formatMoney(convert(amount, currency as CurrencyCode, shown), shown)}{suffix}
        </small>
      )}
    </span>
  );
}
