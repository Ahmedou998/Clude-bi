"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { quote } from "@/lib/matching";
import { formatMoney } from "@/lib/currency";
import { Icon } from "./icons";
import { useToast } from "./providers";

export type Candidate = { id: string; description: string; weightKg: number; origin: string; destination: string };

export function BookTrip({ tripId, pricePerKg, currency, remainingKg, candidates, prefill, nextUrl, loggedIn }: {
  tripId: string; pricePerKg: number; currency: string; remainingKg: number; candidates: Candidate[]; prefill: string; nextUrl: string; loggedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const fits = candidates.filter((c) => c.weightKg <= remainingKg);
  const [shipmentId, setShipmentId] = useState(fits[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chosen = fits.find((c) => c.id === shipmentId);
  const q = chosen ? quote(pricePerKg, chosen.weightKg) : null;

  if (!loggedIn) {
    return (
      <div className="stack">
        <p className="muted">Connectez-vous pour réserver de la place. Cela prend une minute, avec un code reçu par SMS.</p>
        <Link className="btn btn-ink btn-block" href={`/connexion?next=${encodeURIComponent(nextUrl)}`}>Se connecter pour réserver</Link>
      </div>
    );
  }
  if (!fits.length) {
    return (
      <div className="stack">
        <p className="muted">{candidates.length ? "Aucun de vos colis ne tient dans la place restante." : "Décrivez d'abord votre colis : poids, contenu, destinataire. Puis revenez réserver."}</p>
        <Link className="btn btn-ink btn-block" href={`/publier/colis${prefill}`}>Décrire mon colis <Icon name="arrow-right" size={18} /></Link>
      </div>
    );
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      const r = await api<{ data: { id: string } }>("/api/bookings", { body: { tripId, shipmentId } });
      toast("Demande envoyée. Le voyageur va vous répondre.", "ok");
      router.push(`/reservations/${r.data.id}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="shipment">Quel colis envoyer ?</label>
        <select id="shipment" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
          {fits.map((c) => <option key={c.id} value={c.id}>{c.description.slice(0, 40)} · {c.weightKg} kg</option>)}
        </select>
      </div>
      {q && (
        <div className="ledger">
          <div><span className="muted">{chosen!.weightKg} kg × {formatMoney(pricePerKg, currency)}</span><b>{formatMoney(q.price, currency)}</b></div>
          <div><span className="muted">Frais de service</span><b>{formatMoney(q.fee, currency)}</b></div>
          <div className="total"><span>Total à payer après accord</span><b>{formatMoney(q.total, currency)}</b></div>
        </div>
      )}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn btn-ink btn-block" onClick={submit} disabled={busy}>{busy ? <span className="spinner" /> : "Envoyer la demande"}</button>
      <small className="muted">Rien n&apos;est débité maintenant. Vous payez uniquement si le voyageur accepte.</small>
    </div>
  );
}

/** Bouton direct depuis la fiche d'un colis : le colis est déjà choisi. */
export function RequestButton({ tripId, shipmentId }: { tripId: string; shipmentId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const r = await api<{ data: { id: string } }>("/api/bookings", { body: { tripId, shipmentId } });
      toast("Demande envoyée. Le voyageur va vous répondre.", "ok");
      router.push(`/reservations/${r.data.id}`);
    } catch (e) { toast((e as Error).message, "error"); setBusy(false); }
  }
  return <button className="btn btn-ink btn-sm" onClick={go} disabled={busy}>{busy ? <span className="spinner" /> : "Demander ce voyageur"}</button>;
}
