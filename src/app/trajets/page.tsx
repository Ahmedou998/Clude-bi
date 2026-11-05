import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TripCard } from "@/components/trip-card";
import { CityList } from "@/components/place-input";
import { Icon } from "@/components/icons";
import { listTrips, type TripView } from "@/lib/queries";

export const metadata: Metadata = { title: "Trouver un trajet" };
export const dynamic = "force-dynamic";

type Params = { origin?: string; destination?: string; minKg?: string; sort?: string };

export default async function TripsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const sort = p.sort === "price" || p.sort === "capacity" ? p.sort : "date";
  let trips: TripView[] = [], failed = false;
  try { trips = await listTrips({ origin: p.origin?.trim() || undefined, destination: p.destination?.trim() || undefined, minKg: Number(p.minKg) || undefined, sort }); }
  catch { failed = true; }
  const filtered = !!(p.origin || p.destination || p.minKg);
  const prefill = new URLSearchParams({ ...(p.origin ? { origin: p.origin } : {}), ...(p.destination ? { destination: p.destination } : {}) }).toString();

  return (
    <>
      <SiteHeader />
      <main className="container">
        <div className="page-head spread" style={{ alignItems: "end" }}>
          <div><h1>Trajets disponibles</h1><p>Des voyageurs qui partent bientôt, dans les deux sens entre l&apos;Afrique et l&apos;Europe. Toute ville du monde est acceptée.</p></div>
          <Link className="btn btn-ink" href="/publier/trajet">Publier mon trajet <Icon name="arrow-right" size={18} /></Link>
        </div>
        <form className="filters" action="/trajets" method="get">
          <CityList />
          <div className="field"><label htmlFor="f-o">Départ</label><input id="f-o" name="origin" list="cities" defaultValue={p.origin} placeholder="Ville, pays" autoComplete="off" /></div>
          <div className="field"><label htmlFor="f-d">Destination</label><input id="f-d" name="destination" list="cities" defaultValue={p.destination} placeholder="Ville, pays" autoComplete="off" /></div>
          <div className="field"><label htmlFor="f-k">Poids (kg)</label><input id="f-k" name="minKg" type="number" min="0.5" step="0.5" defaultValue={p.minKg} placeholder="Ex. 5" /></div>
          <div className="field"><label htmlFor="f-s">Trier par</label><select id="f-s" name="sort" defaultValue={sort}><option value="date">Départ le plus proche</option><option value="price">Prix le plus bas</option><option value="capacity">Plus de place</option></select></div>
          <button className="btn btn-ink">Rechercher</button>
        </form>
        <section style={{ padding: "28px 0 80px" }} aria-live="polite">
          {failed ? (
            <div className="empty"><h3>Les trajets ne se chargent pas</h3><p>La base de données ne répond pas pour le moment. Réessayez dans un instant.</p></div>
          ) : trips.length ? (
            <>
              <p className="muted" style={{ marginBottom: 18 }}>{trips.length} trajet{trips.length > 1 ? "s" : ""}{filtered ? " correspondent à votre recherche" : ""}</p>
              <div className="grid-3">{trips.map((t) => <TripCard key={t.id} trip={t} />)}</div>
            </>
          ) : (
            <div className="empty">
              <h3>{filtered ? "Aucun trajet pour cette recherche" : "Aucun trajet publié pour l'instant"}</h3>
              <p>{filtered ? "Élargissez la recherche, ou publiez votre colis : les voyageurs de cette liaison le verront." : "Les premiers départs apparaîtront ici dès leur publication."}</p>
              <div className="row" style={{ justifyContent: "center" }}>
                <Link className="btn btn-ink" href={`/publier/colis${prefill ? `?${prefill}` : ""}`}>Publier mon colis</Link>
                {filtered && <Link className="btn btn-ghost" href="/trajets">Voir tous les trajets</Link>}
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
