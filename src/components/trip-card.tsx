import Link from "next/link";
import type { TripView } from "@/lib/queries";
import { daysUntil, formatDate, initials, splitPlace } from "@/lib/format";
import { Icon } from "./icons";
import { Money } from "./money";
import { RouteLine } from "./route-line";

export function Stars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) return <span className="muted" style={{ fontSize: 13 }}>Nouveau voyageur</span>;
  return <span style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="star" size={14} style={{ color: "var(--gold)", fill: "var(--gold)" }} /> <b>{rating.toFixed(1)}</b> <span className="muted">({count})</span></span>;
}

export function TripCard({ trip }: { trip: TripView }) {
  const from = splitPlace(trip.origin), to = splitPlace(trip.destination);
  const d = daysUntil(trip.departureAt);
  const used = Math.max(0, Math.min(100, ((trip.availableWeightKg - trip.remainingKg) / trip.availableWeightKg) * 100));
  return (
    <Link href={`/trajets/${trip.id}`} className="card card-lift trip-card">
      <div className="spread" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 6 }}>
          {trip.traveler.demo && <span className="badge badge-warn" title="Annonce d'exemple, non réservable pour de vrai">Démo</span>}
          {trip.traveler.phoneVerified && <span className="badge badge-ok"><Icon name="check" size={13} /> Tél. vérifié</span>}
        </div>
        <span className="muted" style={{ fontSize: 13 }}>{d <= 0 ? "Part aujourd'hui" : d === 1 ? "Part demain" : `Dans ${d} jours`}</span>
      </div>
      <div className="route">
        <div><div className="city">{from.city}</div><div className="country">{from.country}</div></div>
        <RouteLine />
        <div style={{ textAlign: "right" }}><div className="city">{to.city}</div><div className="country">{to.country}</div></div>
      </div>
      <div>
        <div className="spread" style={{ marginBottom: 6, fontSize: 14 }}>
          <span className="muted"><Icon name="calendar" size={15} style={{ display: "inline", verticalAlign: "-3px" }} /> {formatDate(trip.departureAt)}</span>
          <span><b className="num">{trip.remainingKg} kg</b> <span className="muted">disponibles</span></span>
        </div>
        <div className="capacity-bar" aria-hidden="true"><i style={{ width: `${100 - used}%` }} /></div>
      </div>
      <div className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{initials(trip.traveler.name)}</div>
          <div><div style={{ fontWeight: 650, lineHeight: 1.2 }}>{trip.traveler.name}</div><Stars rating={trip.traveler.rating} count={trip.traveler.ratingCount} /></div>
        </div>
        <div className="price" style={{ textAlign: "right" }}><Money amount={trip.pricePerKg} currency={trip.currency} suffix=" /kg" /></div>
      </div>
    </Link>
  );
}
