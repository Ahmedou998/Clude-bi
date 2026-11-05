import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Publier une annonce" };

export default function PublishPage() {
  return (
    <>
      <SiteHeader />
      <main className="container section-tight">
        <div className="narrow">
          <div className="page-head" style={{ paddingTop: 0 }}><h1>Que voulez-vous faire ?</h1><p>Deux minutes suffisent. Vous ne payez rien pour publier.</p></div>
          <div className="grid-2">
            <Link href="/publier/colis" className="panel card-lift stack"><Icon name="package" size={32} style={{ color: "var(--bissap)" }} /><h2 style={{ fontSize: 24 }}>J&apos;envoie un colis</h2><p className="muted">Décrivez-le, voyez les voyageurs compatibles et demandez-en un.</p><b>Décrire mon colis →</b></Link>
            <Link href="/publier/trajet" className="panel card-lift stack"><Icon name="plane" size={32} style={{ color: "var(--baobab)" }} /><h2 style={{ fontSize: 24 }}>Je voyage bientôt</h2><p className="muted">Indiquez votre trajet, votre place libre et votre prix au kilo.</p><b>Publier mon trajet →</b></Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
