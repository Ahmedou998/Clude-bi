import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Icon } from "@/components/icons";
import { PROHIBITED_GOODS, TRAVELER_RIGHTS } from "@/lib/catalog";
import { SERVICE_FEE_RATE } from "@/lib/matching";

export const metadata: Metadata = { title: "Règles et sécurité" };

export default function RulesPage() {
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBottom: 80 }}>
        <div className="page-head"><h1>Règles et sécurité</h1><p>Ce qui protège l&apos;expéditeur, le voyageur et le destinataire, et ce qui ne doit jamais voyager.</p></div>
        <div className="stack" style={{ gap: 28, maxWidth: 900 }}>
          <section className="panel stack">
            <h2 style={{ fontSize: 26 }}>Comment circule l&apos;argent</h2>
            <div className="ledger" style={{ fontSize: 16 }}>
              <div><span>1. L&apos;expéditeur paie à l&apos;accord</span><b>prix + {Math.round(SERVICE_FEE_RATE * 100)} % de frais</b></div>
              <div><span>2. Les fonds sont bloqués</span><b>personne n&apos;y touche</b></div>
              <div><span>3. Le destinataire donne son code</span><b>le voyageur est payé</b></div>
              <div><span>Annulation avant la remise</span><b>remboursement complet</b></div>
              <div><span>Problème signalé</span><b>fonds maintenus, support saisi</b></div>
            </div>
            <p className="muted">Pendant la version pilote, les paiements sont simulés. Un prestataire de paiement agréé sera branché avant toute transaction réelle.</p>
          </section>
          <section className="panel stack">
            <h2 style={{ fontSize: 26 }}>Ce qui ne voyage jamais</h2>
            <div className="grid-2">{PROHIBITED_GOODS.map((g) => (
              <div key={g.title} className="stack" style={{ gap: 4 }}><b><Icon name="x" size={16} style={{ display: "inline", color: "var(--bissap)", verticalAlign: "-3px" }} /> {g.title}</b><span className="muted" style={{ fontSize: 14.5 }}>{g.detail}</span></div>
            ))}</div>
            <p className="muted">Chaque pays a ses propres règles douanières. L&apos;expéditeur déclare le contenu ; le voyageur reste libre de refuser. En cas de doute, ne transportez pas.</p>
          </section>
          <section className="panel stack">
            <h2 style={{ fontSize: 26 }}>Les droits du voyageur</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>{TRAVELER_RIGHTS.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>
          <section className="panel stack">
            <h2 style={{ fontSize: 26 }}>Ce qui n&apos;existe pas encore</h2>
            <p>Pour ne rien vous cacher : pas d&apos;assurance des colis, pas de contrôle d&apos;identité par pièce, et un support qui traite les litiges à la main. Ne confiez pas d&apos;objet de grande valeur pendant la version pilote.</p>
            <div className="row"><Link className="btn btn-ink" href="/publier/colis">Envoyer un colis</Link><Link className="btn btn-ghost" href="/publier/trajet">Publier un trajet</Link></div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
