"use client";
import { useMemo, useState } from "react";
import type { CorridorRate } from "@/lib/queries";
import { convert, formatMoney } from "@/lib/currency";
import { SERVICE_FEE_RATE } from "@/lib/matching";
import { useTween } from "./counter";
import { useDisplayCurrency } from "./providers";

export function Estimator({ rates }: { rates: CorridorRate[] }) {
  const { currency } = useDisplayCurrency();
  const [key, setKey] = useState(rates[0]?.key ?? "");
  const [kg, setKg] = useState(5);
  const rate = rates.find((r) => r.key === key) ?? rates[0];

  const { price, fee, total } = useMemo(() => {
    const eur = (rate?.eurPerKg ?? 0) * kg;
    const p = convert(eur, "EUR", currency);
    return { price: p, fee: p * SERVICE_FEE_RATE, total: p * (1 + SERVICE_FEE_RATE) };
  }, [rate, kg, currency]);
  const tweened = useTween(total);

  if (!rate) return null;
  return (
    <div className="estimator">
      <div className="stack" style={{ gap: 22 }}>
        <div className="field">
          <label htmlFor="est-route">Liaison</label>
          <select id="est-route" value={key} onChange={(e) => setKey(e.target.value)}>
            {rates.map((r) => <option key={r.key} value={r.key}>{r.from} → {r.to}{r.fromListings ? " · annonces" : " · tarif indicatif"}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="est-kg">Poids : <b className="num">{kg} kg</b></label>
          <input id="est-kg" type="range" min={0.5} max={30} step={0.5} value={kg} onChange={(e) => setKg(Number(e.target.value))} />
        </div>
        <p className="muted" style={{ fontSize: 14 }}>
          {rate.fromListings ? "Moyenne des trajets ouverts sur cette liaison." : "Tarif indicatif, en attendant des annonces sur cette liaison."} Le prix réel est fixé par chaque voyageur. Les montants sont affichés dans la devise choisie en haut de page.
        </p>
      </div>
      <div className="estimator-result" aria-live="polite">
        <span style={{ color: "#b8cbd5" }}>Vous payez environ</span>
        <div className="estimator-total num">{formatMoney(tweened, currency)}</div>
        <div className="ledger" style={{ color: "#d6e4eb" }}>
          <div><span>Revient au voyageur</span><b>{formatMoney(price, currency)}</b></div>
          <div><span>Frais de service ({Math.round(SERVICE_FEE_RATE * 100)} %)</span><b>{formatMoney(fee, currency)}</b></div>
        </div>
      </div>
    </div>
  );
}
