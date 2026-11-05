"use client";
import Link from "next/link";
import { useState } from "react";
import type { DashboardBooking, ShipmentView } from "@/lib/queries";
import { STATUS_LABEL, needsMe, type BookingStatus, type Actor } from "@/lib/booking-flow";
import { formatMoney } from "@/lib/currency";
import { formatDate, splitPlace } from "@/lib/format";
import { Icon } from "./icons";
import { DeleteButton } from "./confirm-button";

type DashTrip = { id: string; origin: string; destination: string; departureAt: string; availableWeightKg: number; pricePerKg: number; currency: string; status: string; pending: number; active: number };

const city = (v: string) => splitPlace(v).city;
const tone = (s: string) => (s === "DELIVERED" ? "badge-ok" : ["REJECTED", "CANCELLED", "DISPUTED"].includes(s) ? "badge-bad" : "badge-gold");
const SHIP_LABEL: Record<string, string> = { SEARCHING: "Cherche un voyageur", MATCHED: "Voyageur trouvé", IN_TRANSIT: "En route", DELIVERED: "Livré", DISPUTED: "Litige", CANCELLED: "Annulé" };
const TRIP_LABEL: Record<string, string> = { OPEN: "En ligne", FULL: "Complet", COMPLETED: "Terminé", CANCELLED: "Retiré" };

export function Dashboard({ bookings, shipments, trips }: { bookings: DashboardBooking[]; shipments: ShipmentView[]; trips: DashTrip[] }) {
  const [tab, setTab] = useState<"bookings" | "shipments" | "trips">("bookings");
  const todo = bookings.map((b) => ({ b, label: needsMe(b.status as BookingStatus, b.actor as Actor) })).filter((x) => x.label);
  return (
    <div className="stack" style={{ gap: 28 }}>
      {todo.length > 0 && (
        <section className="stack" style={{ gap: 10 }} aria-label="À faire">
          <h2 style={{ fontSize: 22 }}>À faire maintenant</h2>
          {todo.map(({ b, label }) => (
            <Link key={b.id} href={`/reservations/${b.id}`} className="todo">
              <span><b>{label}</b> <span className="muted">· {city(b.origin)} → {city(b.destination)} · {b.other}</span></span>
              <Icon name="arrow-right" size={18} />
            </Link>
          ))}
        </section>
      )}
      <div className="tabs" role="tablist" aria-label="Mon espace">
        {([["bookings", `Réservations (${bookings.length})`], ["shipments", `Mes colis (${shipments.length})`], ["trips", `Mes trajets (${trips.length})`]] as const).map(([k, l]) => (
          <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "bookings" && (bookings.length ? (
        <div className="stack">{bookings.map((b) => (
          <Link key={b.id} href={`/reservations/${b.id}`} className="card card-lift spread">
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>{city(b.origin)} → {city(b.destination)}</div>
              <div className="muted" style={{ fontSize: 14 }}>{b.actor === "sender" ? "Voyageur" : "Expéditeur"} : {b.other} · {b.weightKg} kg · départ {formatDate(b.departureAt)}</div>
            </div>
            <div className="row"><b className="num">{formatMoney(b.actor === "sender" ? b.agreedPrice + b.serviceFee : b.agreedPrice, b.currency)}</b><span className={`badge ${tone(b.status)}`}>{STATUS_LABEL[b.status as BookingStatus]}</span></div>
          </Link>))}</div>
      ) : <div className="empty"><h3>Aucune réservation</h3><p>Dès qu&apos;un voyageur et un colis se rencontrent, la réservation apparaît ici.</p><Link className="btn btn-ink" href="/trajets">Trouver un trajet</Link></div>)}

      {tab === "shipments" && (shipments.length ? (
        <div className="stack">{shipments.map((s) => (
          <div key={s.id} className="card spread">
            <Link href={`/colis/${s.id}`} style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>{city(s.origin)} → {city(s.destination)}</div>
              <div className="muted" style={{ fontSize: 14 }}>{s.description.slice(0, 60)} · {s.weightKg} kg</div>
            </Link>
            <div className="row"><span className={`badge ${s.status === "DELIVERED" ? "badge-ok" : s.status === "SEARCHING" ? "" : "badge-gold"}`}>{SHIP_LABEL[s.status]}</span>
              {s.status === "SEARCHING" && <><Link className="btn btn-ink btn-sm" href={`/colis/${s.id}`}>Voir les voyageurs</Link><DeleteButton url={`/api/shipments/${s.id}`} label="Retirer" done="Colis retiré." /></>}</div>
          </div>))}</div>
      ) : <div className="empty"><h3>Aucun colis</h3><p>Décrivez votre colis pour voir les voyageurs compatibles.</p><Link className="btn btn-ink" href="/publier/colis">Envoyer un colis</Link></div>)}

      {tab === "trips" && (trips.length ? (
        <div className="stack">{trips.map((t) => (
          <div key={t.id} className="card spread">
            <Link href={`/trajets/${t.id}`} style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>{city(t.origin)} → {city(t.destination)}</div>
              <div className="muted" style={{ fontSize: 14 }}>{formatDate(t.departureAt)} · {t.availableWeightKg} kg · {formatMoney(t.pricePerKg, t.currency)}/kg</div>
            </Link>
            <div className="row">
              {t.pending > 0 && <span className="badge badge-gold">{t.pending} demande{t.pending > 1 ? "s" : ""}</span>}
              <span className={`badge ${t.status === "OPEN" ? "badge-ok" : ""}`}>{TRIP_LABEL[t.status]}</span>
              {(t.status === "OPEN" || t.status === "FULL") && t.active === 0 && <DeleteButton url={`/api/trips/${t.id}`} label="Retirer" done="Trajet retiré." />}
            </div>
          </div>))}</div>
      ) : <div className="empty"><h3>Aucun trajet</h3><p>Vous voyagez bientôt ? Publiez votre trajet, les expéditeurs vous trouveront.</p><Link className="btn btn-ink" href="/publier/trajet">Publier un trajet</Link></div>)}
    </div>
  );
}
