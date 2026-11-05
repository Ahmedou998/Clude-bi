"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { SHIPMENT_CATEGORIES } from "@/lib/catalog";
import { CURRENCY_CODES } from "@/lib/currency";
import { Icon } from "./icons";
import { CityList } from "./place-input";
import { useToast } from "./providers";

export function ShipmentForm({ defaults }: { defaults: { origin?: string; destination?: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ origin: defaults.origin ?? "", destination: defaults.destination ?? "", description: "", category: "vetements", kg: "", value: "", budget: "", currency: "EUR", day: "", recipientName: "", recipientPhone: "" });
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const num = (v: string) => (v ? Math.round(Number(v)) : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await api<{ data: { id: string } }>("/api/shipments", { body: {
        origin: f.origin, destination: f.destination, description: f.description, category: f.category, weightKg: Number(f.kg),
        declaredValue: num(f.value), budget: num(f.budget), currency: f.currency, desiredDate: f.day ? `${f.day}T23:00:00.000Z` : undefined,
        recipientName: f.recipientName, recipientPhone: f.recipientPhone, prohibitedAck: ack,
      } });
      toast("Demande publiée. Voici les voyageurs compatibles.", "ok");
      router.push(`/colis/${r.data.id}`);
      router.refresh();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  return (
    <form className="stack" onSubmit={submit} style={{ gap: 20 }}>
      <CityList />
      <div className="grid-2">
        <div className="field"><label htmlFor="s-o">Ville et pays de départ</label><input id="s-o" list="cities" value={f.origin} onChange={set("origin")} placeholder="Ex. Paris, France" required /></div>
        <div className="field"><label htmlFor="s-d">Ville et pays d&apos;arrivée</label><input id="s-d" list="cities" value={f.destination} onChange={set("destination")} placeholder="Ex. Dakar, Sénégal" required /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="s-cat">Type de colis</label><select id="s-cat" value={f.category} onChange={set("category")}>{SHIPMENT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
        <div className="field"><label htmlFor="s-kg">Poids estimé (kg)</label><input id="s-kg" type="number" min="0.1" max="100" step="0.1" inputMode="decimal" value={f.kg} onChange={set("kg")} placeholder="Ex. 4" required /></div>
      </div>
      <div className="field"><label htmlFor="s-desc">Contenu du colis</label><textarea id="s-desc" value={f.description} onChange={set("description")} maxLength={500} placeholder="Ex. Deux cartons : vêtements d'enfant et chaussures, rien de fragile." required /><span className="hint">Soyez précis : le voyageur peut refuser ce qu&apos;il ne connaît pas.</span></div>
      <div className="grid-3" style={{ gap: 14 }}>
        <div className="field"><label htmlFor="s-b">Budget total (facultatif)</label><input id="s-b" type="number" min="1" inputMode="numeric" value={f.budget} onChange={set("budget")} /></div>
        <div className="field"><label htmlFor="s-c">Devise</label><select id="s-c" value={f.currency} onChange={set("currency")}>{CURRENCY_CODES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label htmlFor="s-day">À livrer avant le</label><input id="s-day" type="date" value={f.day} onChange={set("day")} /></div>
      </div>
      <div className="field"><label htmlFor="s-v">Valeur déclarée (facultatif, même devise)</label><input id="s-v" type="number" min="0" inputMode="numeric" value={f.value} onChange={set("value")} /></div>
      <fieldset style={{ border: "1.5px solid var(--line)", borderRadius: 16, padding: 18, display: "grid", gap: 14, margin: 0 }}>
        <legend style={{ fontWeight: 650, padding: "0 8px" }}>Destinataire</legend>
        <div className="grid-2">
          <div className="field"><label htmlFor="s-rn">Nom</label><input id="s-rn" value={f.recipientName} onChange={set("recipientName")} placeholder="Ex. Awa Ndiaye" required /></div>
          <div className="field"><label htmlFor="s-rp">Téléphone</label><input id="s-rp" value={f.recipientPhone} onChange={set("recipientPhone")} placeholder="+221 77 123 45 67" inputMode="tel" required /></div>
        </div>
        <span className="hint" style={{ fontSize: 12.5, color: "var(--muted)" }}>Visibles uniquement du voyageur dont le colis est payé.</span>
      </fieldset>
      <label className="check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> <span>Je confirme que ce colis ne contient aucun objet interdit (<Link href="/regles" target="_blank" style={{ textDecoration: "underline" }}>voir la liste</Link>) et que le voyageur peut en vérifier le contenu.</span></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn btn-ink" disabled={busy || !ack}>{busy ? <span className="spinner" /> : <>Publier ma demande <Icon name="arrow-right" size={18} /></>}</button>
    </form>
  );
}
