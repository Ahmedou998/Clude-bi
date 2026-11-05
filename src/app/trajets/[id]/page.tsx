import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookTrip, type Candidate } from "@/components/book-trip";
import { Money } from "@/components/money";
import { RouteLine } from "@/components/route-line";
import { Stars } from "@/components/trip-card";
import { Icon } from "@/components/icons";
import { DeleteButton } from "@/components/confirm-button";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/catalog";
import { daysUntil, formatDateLong, initials, splitPlace } from "@/lib/format";
import { samePlace } from "@/lib/matching";
import { getTrip, getUserShipments, matchesForTrip } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Détail du trajet" };

export default async function TripPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id).catch(() => null);
  if (!trip) notFound();
  const user = await getCurrentUser();
  const isOwner = user?.id === trip.traveler.id;
  const justCreated = (await searchParams).new === "1" && isOwner;

  const mine = user && !isOwner ? await getUserShipments(user.id, true) : [];
  const candidates: Candidate[] = mine
    .filter((s) => samePlace(s.origin, trip.origin) && samePlace(s.destination, trip.destination))
    .map((s) => ({ id: s.id, description: s.description, weightKg: s.weightKg, origin: s.origin, destination: s.destination }));
  const demand = isOwner ? await matchesForTrip(trip.id, user!.id) : [];
  const pending = isOwner ? await prisma.booking.count({ where: { tripId: trip.id, status: "REQUESTED" } }) : 0;

  const from = splitPlace(trip.origin), to = splitPlace(trip.destination);
  const d = daysUntil(trip.departureAt);
  const q = new URLSearchParams({ origin: trip.origin, destination: trip.destination }).toString();
  const closed = trip.status !== "OPEN" || trip.remainingKg <= 0;

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBottom: 80 }}>
        <div className="page-head" style={{ paddingBottom: 18 }}><Link className="back" href="/trajets"><Icon name="arrow-left" size={16} /> Tous les trajets</Link></div>
        {justCreated && <div className="form-note" style={{ background: "var(--baobab-soft)", color: "var(--baobab)", marginBottom: 20 }}><b>Votre trajet est en ligne.</b> Les expéditeurs peuvent maintenant vous envoyer des demandes. Vous serez prévenu dans votre espace.</div>}
        <div className="two-col">
          <div className="stack" style={{ gap: 20 }}>
            <section className="panel stack" style={{ gap: 22 }}>
              <div className="route" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <div><div className="city" style={{ fontSize: 34 }}>{from.city}</div><div className="country">{from.country}</div></div>
                <RouteLine />
                <div style={{ textAlign: "right" }}><div className="city" style={{ fontSize: 34 }}>{to.city}</div><div className="country">{to.country}</div></div>
              </div>
              <div className="meta-row" style={{ fontSize: 15 }}>
                <span><Icon name="calendar" size={16} style={{ display: "inline", verticalAlign: "-3px" }} /> <b>{formatDateLong(trip.departureAt)}</b>{d > 0 && ` (dans ${d} jour${d > 1 ? "s" : ""})`}</span>
                <span><Icon name="weight" size={16} style={{ display: "inline", verticalAlign: "-3px" }} /> <b>{trip.remainingKg} kg</b> libres sur {trip.availableWeightKg}</span>
              </div>
              {trip.via.length > 0 && <p className="muted">Escales : {trip.via.join(", ")}</p>}
              {trip.notes && <p style={{ background: "var(--salt)", borderRadius: 12, padding: "12px 14px" }}>{trip.notes}</p>}
              <div className="price" style={{ fontSize: 34 }}><Money amount={trip.pricePerKg} currency={trip.currency} suffix=" par kilo" /></div>
            </section>

            <section className="panel stack" style={{ gap: 14 }}>
              <h2 style={{ fontSize: 22 }}>Le voyageur</h2>
              <div className="row" style={{ gap: 14 }}>
                <div className="avatar" style={{ width: 54, height: 54, fontSize: 20 }}>{initials(trip.traveler.name)}</div>
                <div><div style={{ fontWeight: 700, fontSize: 18 }}>{trip.traveler.name}</div><Stars rating={trip.traveler.rating} count={trip.traveler.ratingCount} /></div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                {trip.traveler.phoneVerified ? <span className="badge badge-ok"><Icon name="check" size={13} /> Téléphone vérifié</span> : <span className="badge">Téléphone non vérifié</span>}
                <span className="badge">{trip.traveler.deliveries} livraison{trip.traveler.deliveries > 1 ? "s" : ""} réussie{trip.traveler.deliveries > 1 ? "s" : ""}</span>
                <span className="badge">Identité par pièce : bientôt</span>
                {trip.traveler.demo && <span className="badge badge-warn">Compte de démonstration</span>}
              </div>
            </section>

            {isOwner && (
              <section className="panel stack" style={{ gap: 14 }}>
                <div className="spread"><h2 style={{ fontSize: 22 }}>Colis compatibles avec votre trajet</h2>{pending > 0 && <Link className="btn btn-gold btn-sm" href="/espace">{pending} demande{pending > 1 ? "s" : ""} à traiter</Link>}</div>
                {demand.length ? demand.map((s) => (
                  <div key={s.id} className="card spread" style={{ padding: 16 }}>
                    <div><b>{s.description.slice(0, 60)}</b><div className="muted" style={{ fontSize: 14 }}>{categoryLabel(s.category)} · {s.weightKg} kg · par {s.sender}</div></div>
                    <span className="badge">{s.weightKg} kg</span>
                  </div>
                )) : <p className="muted">Aucun colis en attente sur cette liaison pour l&apos;instant. Ils apparaîtront ici et vous pourrez leur écrire dès qu&apos;ils vous sollicitent.</p>}
                {(trip.status === "OPEN" || trip.status === "FULL") && <div><DeleteButton url={`/api/trips/${trip.id}`} label="Retirer ce trajet" done="Trajet retiré." /></div>}
              </section>
            )}
          </div>

          <aside className="panel stack" style={{ position: "sticky", top: 96 }}>
            {isOwner ? (
              <><h2 style={{ fontSize: 22 }}>C&apos;est votre trajet</h2><p className="muted">Vous serez payé uniquement à la livraison, quand le destinataire vous donne son code.</p><Link className="btn btn-ink" href="/espace">Mon espace</Link></>
            ) : closed ? (
              <><h2 style={{ fontSize: 22 }}>Trajet complet</h2><p className="muted">Il n&apos;y a plus de place sur ce trajet. Voyez les autres départs sur cette liaison.</p><Link className="btn btn-ink" href={`/trajets?${q}`}>Autres trajets</Link></>
            ) : (
              <>
                <h2 style={{ fontSize: 22 }}>Réserver de la place</h2>
                <BookTrip tripId={trip.id} pricePerKg={trip.pricePerKg} currency={trip.currency} remainingKg={trip.remainingKg} candidates={candidates} prefill={`?${q}`} nextUrl={`/trajets/${trip.id}`} loggedIn={!!user} />
              </>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
