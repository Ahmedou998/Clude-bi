"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { CURRENCIES, CURRENCY_CODES, formatMoney } from "@/lib/currency";
import { departureFromDay } from "@/lib/format";
import { Icon } from "./icons";
import { CityList } from "./place-input";
import { useToast } from "./providers";

export function TripForm({ defaults }: { defaults: { origin?: string; destination?: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ origin: defaults.origin ?? "", destination: defaults.destination ?? "", day: "", kg: "", price: "", currency: "EUR", notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const potential = Number(f.kg) * Number(f.price);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await api<{ data: { id: string } }>("/api/trips", { body: {
        origin: f.origin, destination: f.destination, departureAt: departureFromDay(f.day),
        availableWeightKg: Number(f.kg), pricePerKg: Math.round(Number(f.price)), currency: f.currency, notes: f.notes || undefined,
      } });
      toast("Trajet publié. Les expéditeurs peuvent le voir.", "ok");
      router.push(`/trajets/${r.data.id}?new=1`);
      router.refresh();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return (
    <form className="stack" onSubmit={submit} style={{ gap: 20 }}>
      <CityList />
      <div className="grid-2">
        <div className="field"><label htmlFor="t-o">Ville et pays de départ</label><input id="t-o" list="cities" value={f.origin} onChange={set("origin")} placeholder="Ex. Paris, France" required /></div>
        <div className="field"><label htmlFor="t-d">Ville et pays d&apos;arrivée</label><input id="t-d" list="cities" value={f.destination} onChange={set("destination")} placeholder="Ex. Dakar, Sénégal" required /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="t-day">Date de départ</label><input id="t-day" type="date" min={today} value={f.day} onChange={set("day")} required /></div>
        <div className="field"><label htmlFor="t-kg">Place disponible (kg)</label><input id="t-kg" type="number" min="0.5" max="100" step="0.5" inputMode="decimal" value={f.kg} onChange={set("kg")} placeholder="Ex. 15" required /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="t-p">Votre prix par kilo</label><input id="t-p" type="number" min="1" step="1" inputMode="numeric" value={f.price} onChange={set("price")} placeholder="Ex. 9" required /></div>
        <div className="field"><label htmlFor="t-c">Devise</label>
          <select id="t-c" value={f.currency} onChange={set("currency")}>{CURRENCY_CODES.map((c) => <option key={c} value={c}>{c} · {CURRENCIES[c].label}</option>)}</select></div>
      </div>
      {potential > 0 && <div className="form-note" style={{ background: "var(--baobab-soft)", color: "var(--baobab)" }}>Si toute votre place est prise, vous recevez <b>{formatMoney(potential, f.currency)}</b>. Les frais de service sont payés par l&apos;expéditeur en plus.</div>}
      <div className="field"><label htmlFor="t-n">Informations utiles (facultatif)</label><textarea id="t-n" value={f.notes} onChange={set("notes")} maxLength={500} placeholder="Ex. Remise possible à la gare, pas de colis volumineux…" /></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn btn-ink" disabled={busy}>{busy ? <span className="spinner" /> : <>Publier mon trajet <Icon name="arrow-right" size={18} /></>}</button>
    </form>
  );
}
