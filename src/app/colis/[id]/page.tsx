import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RequestButton } from "@/components/book-trip";
import { Money } from "@/components/money";
import { Stars } from "@/components/trip-card";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { categoryLabel } from "@/lib/catalog";
import { formatDate, initials, splitPlace } from "@/lib/format";
import { matchesForShipment } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon colis" };

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/colis/${id}`)}`);
  const s = await prisma.shipment.findUnique({ where: { id }, include: { bookings: { select: { id: true, status: true, tripId: true } } } });
  if (!s || s.senderId !== user.id) notFound();
  const matches = s.status === "SEARCHING" ? await matchesForShipment(id, user.id) : [];
  const requested = new Set(s.bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "REJECTED").map((b) => b.tripId));
  const from = splitPlace(s.origin), to = splitPlace(s.destination);
  const active = s.bookings.find((b) => ["REQUESTED", "ACCEPTED", "PAID", "HANDED_OVER", "DELIVERED", "DISPUTED"].includes(b.status));

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBottom: 80 }}>
        <div className="page-head"><Link className="back" href="/espace"><Icon name="arrow-left" size={16} /> Mon espace</Link>
          <h1>{from.city} → {to.city}</h1>
          <p>{s.description}</p>
          <div className="row" style={{ marginTop: 14 }}><span className="badge">{categoryLabel(s.category)}</span><span className="badge">{s.weightKg} kg</span>{s.desiredDate && <span className="badge">avant le {formatDate(s.desiredDate)}</span>}{s.budget && <span className="badge">budget {s.budget} {s.currency}</span>}</div>
        </div>
        {active && <div className="form-note" style={{ marginBottom: 24 }}>Ce colis a une réservation en cours. <Link href={`/reservations/${active.id}`} style={{ textDecoration: "underline", fontWeight: 650 }}>Ouvrir la réservation</Link></div>}
        {s.status === "SEARCHING" && (
          <section className="stack" style={{ gap: 14 }}>
            <h2 style={{ fontSize: 26 }}>Voyageurs compatibles</h2>
            {matches.length ? matches.map(({ trip, match }) => (
              <article key={trip.id} className="card card-lift spread" style={{ gap: 18 }}>
                <div className="row" style={{ gap: 14, flex: 1, minWidth: 240 }}>
                  <div className="avatar">{initials(trip.traveler.name)}</div>
                  <div>
                    <Link href={`/trajets/${trip.id}`} style={{ fontWeight: 700, fontSize: 18 }}>{trip.traveler.name} · {formatDate(trip.departureAt)}</Link>
                    <div><Stars rating={trip.traveler.rating} count={trip.traveler.ratingCount} /> {trip.traveler.demo && <span className="badge badge-warn">Démo</span>}</div>
                    <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{match.reasons.join(" · ")}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 18 }}>
                  <span className="badge badge-ok">{match.score} % compatible</span>
                  <div className="price" style={{ textAlign: "right" }}><Money amount={trip.pricePerKg} currency={trip.currency} suffix="/kg" /></div>
                  {requested.has(trip.id) ? <span className="badge">Demande envoyée</span> : <RequestButton tripId={trip.id} shipmentId={s.id} />}
                </div>
              </article>
            )) : (
              <div className="empty"><h3>Pas encore de voyageur sur cette liaison</h3><p>Votre colis est visible des voyageurs. Vous le retrouvez ici et dans votre espace dès qu&apos;un trajet correspond.</p><Link className="btn btn-ink" href={`/trajets?origin=${encodeURIComponent(s.origin)}&destination=${encodeURIComponent(s.destination)}`}>Voir les trajets proches</Link></div>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
