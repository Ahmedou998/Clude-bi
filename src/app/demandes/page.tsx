import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CityList } from "@/components/place-input";
import { Money } from "@/components/money";
import { RouteLine } from "@/components/route-line";
import { Icon } from "@/components/icons";
import { categoryLabel } from "@/lib/catalog";
import { formatDate, splitPlace } from "@/lib/format";
import { listShipments, type ShipmentView } from "@/lib/queries";

export const metadata: Metadata = { title: "Colis à transporter" };
export const dynamic = "force-dynamic";

export default async function DemandsPage({ searchParams }: { searchParams: Promise<{ origin?: string; destination?: string }> }) {
  const p = await searchParams;
  let items: ShipmentView[] = [], failed = false;
  try { items = await listShipments({ origin: p.origin?.trim() || undefined, destination: p.destination?.trim() || undefined }); } catch { failed = true; }
  return (
    <>
      <SiteHeader />
      <main className="container">
        <div className="page-head"><h1>Colis qui attendent un voyageur</h1><p>Vous partez bientôt ? Voyez ce que vous pouvez transporter sur votre liaison et fixez votre prix.</p></div>
        <form className="filters" action="/demandes" method="get" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <CityList />
          <div className="field"><label htmlFor="d-o">Départ</label><input id="d-o" name="origin" list="cities" defaultValue={p.origin} placeholder="Ville, pays" autoComplete="off" /></div>
          <div className="field"><label htmlFor="d-d">Destination</label><input id="d-d" name="destination" list="cities" defaultValue={p.destination} placeholder="Ville, pays" autoComplete="off" /></div>
          <button className="btn btn-ink">Filtrer</button>
        </form>
        <section style={{ padding: "28px 0 80px" }}>
          {failed ? <div className="empty"><h3>Les colis ne se chargent pas</h3><p>Réessayez dans un instant.</p></div>
            : items.length ? (
              <div className="grid-3">{items.map((s) => {
                const from = splitPlace(s.origin), to = splitPlace(s.destination);
                return (
                  <article key={s.id} className="card stack" style={{ gap: 14 }}>
                    <div className="route"><div><div className="city">{from.city}</div><div className="country">{from.country}</div></div><RouteLine /><div style={{ textAlign: "right" }}><div className="city">{to.city}</div><div className="country">{to.country}</div></div></div>
                    <p>{s.description.length > 110 ? s.description.slice(0, 110) + "…" : s.description}</p>
                    <div className="row"><span className="badge">{categoryLabel(s.category)}</span><span className="badge">{s.weightKg} kg</span>{s.desiredDate && <span className="badge">avant le {formatDate(s.desiredDate)}</span>}</div>
                    <div className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 12, fontSize: 14 }}>
                      <span className="muted">Par {s.sender}</span>
                      {s.budget ? <span>Budget <b><Money amount={s.budget} currency={s.currency} approx={false} /></b></span> : <span className="muted">Budget libre</span>}
                    </div>
                    <Link className="btn btn-ghost btn-sm" href={`/publier/trajet?${new URLSearchParams({ origin: s.origin, destination: s.destination })}`}>Je fais ce trajet <Icon name="arrow-right" size={16} /></Link>
                  </article>
                );
              })}</div>
            ) : <div className="empty"><h3>Aucun colis en attente</h3><p>Publiez votre trajet : dès qu&apos;un colis correspond, il apparaîtra ici et dans votre espace.</p><Link className="btn btn-ink" href="/publier/trajet">Publier mon trajet</Link></div>}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
