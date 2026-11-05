import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeHero } from "@/components/home-hero";
import { ScrollProgress } from "@/components/scroll-progress";
import { Counter } from "@/components/counter";
import { Reveal } from "@/components/reveal";
import { TripCard } from "@/components/trip-card";
import { FlowSection } from "@/components/flow-section";
import { FaqTabs } from "@/components/faq-tabs";
import { Estimator } from "@/components/estimator";
import { Icon } from "@/components/icons";
import { HERO_CORRIDORS } from "@/lib/catalog";
import { corridorRates, listTrips, platformStats, type TripView } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function upcomingTrips(): Promise<TripView[]> {
  try { return (await listTrips({ sort: "date" })).slice(0, 3); } catch { return []; }
}

export default async function HomePage() {
  const [stats, rates, trips] = await Promise.all([platformStats(), corridorRates(), upcomingTrips()]);
  const route = HERO_CORRIDORS.map((c) => `${c.fromLabel.split(",")[0]} → ${c.toLabel.split(",")[0]}`);

  return (
    <>
      <ScrollProgress />
      <SiteHeader tone="dark" />
      <main>
        <HomeHero />

        <section className="container" style={{ marginTop: -14 }} aria-label="Chiffres du moment">
          <div className="stats">
            <div className="stat"><Counter value={stats.openTrips} /><span>trajets ouverts</span></div>
            <div className="stat"><Counter value={stats.availableKg} suffix=" kg" /><span>de place disponible</span></div>
            <div className="stat"><Counter value={stats.openShipments} /><span>colis en attente d&apos;un voyageur</span></div>
            <div className="stat"><Counter value={stats.countries} /><span>pays desservis</span></div>
          </div>
        </section>

        <div className="marquee" style={{ marginTop: 56 }} aria-hidden="true">
          <div className="marquee-track">
            {[...route, ...route].map((r, i) => <span key={i}>{r} <i>●</i></span>)}
          </div>
        </div>

        <section className="section" id="departs">
          <div className="container">
            <div className="spread" style={{ alignItems: "end", marginBottom: 32 }}>
              <div className="section-head" style={{ marginBottom: 0 }}>
                <h2>Les prochains départs</h2>
                <p>Des voyageurs réels, une place réservée en quelques clics.</p>
              </div>
              <Link href="/trajets" className="btn btn-ink">Voir tous les trajets <Icon name="arrow-right" size={18} /></Link>
            </div>
            {trips.length ? (
              <div className="grid-3">{trips.map((t, i) => <Reveal key={t.id} delay={i * 90}><TripCard trip={t} /></Reveal>)}</div>
            ) : (
              <div className="empty">
                <h3>Aucun départ pour l&apos;instant</h3>
                <p>Soyez le premier à publier un trajet : les expéditeurs vous trouveront dès aujourd&apos;hui.</p>
                <Link href="/publier/trajet" className="btn btn-ink">Publier mon trajet</Link>
              </div>
            )}
          </div>
        </section>

        <section className="section section-dark" id="fonctionnement">
          <div className="container"><div className="section-head"><h2>De la demande à la livraison, l&apos;argent attend.</h2><p>Chaque étape est datée et visible des deux côtés. Rien n&apos;est versé avant que le destinataire ait son colis.</p></div></div>
          <FlowSection />
        </section>

        <section className="section" id="confiance">
          <div className="container" style={{ maxWidth: 900 }}>
            <div className="section-head"><h2>Les questions qu&apos;on nous pose, sans détour.</h2><p>Nous disons aussi ce qui n&apos;existe pas encore : assurance et contrôle d&apos;identité par pièce arriveront avec des partenaires.</p></div>
            <FaqTabs />
          </div>
        </section>

        <section className="section-tight" id="estimateur">
          <div className="container">
            <div className="section-head"><h2>Combien ça coûte ?</h2><p>Faites glisser le poids. Vous voyez ce qui revient au voyageur et nos frais, à l&apos;euro près.</p></div>
            <Estimator rates={rates} />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta-band">
              <h2>Votre valise a de la place. Quelqu&apos;un en a besoin.</h2>
              <div className="row" style={{ position: "relative", zIndex: 1 }}>
                <Link href="/publier/trajet" className="btn btn-gold">Publier un trajet</Link>
                <Link href="/publier/colis" className="btn btn-ghost">Envoyer un colis</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
