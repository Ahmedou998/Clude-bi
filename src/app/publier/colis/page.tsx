import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShipmentForm } from "@/components/shipment-form";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Envoyer un colis" };
export const dynamic = "force-dynamic";

export default async function PublishShipmentPage({ searchParams }: { searchParams: Promise<{ origin?: string; destination?: string }> }) {
  const p = await searchParams;
  if (!(await getCurrentUser())) {
    const back = `/publier/colis${p.origin || p.destination ? `?${new URLSearchParams({ origin: p.origin ?? "", destination: p.destination ?? "" })}` : ""}`;
    redirect(`/connexion?next=${encodeURIComponent(back)}`);
  }
  return (
    <>
      <SiteHeader />
      <main className="container section-tight">
        <div className="narrow">
          <Link className="back" href="/publier"><Icon name="arrow-left" size={16} /> Retour</Link>
          <div className="page-head" style={{ paddingTop: 0 }}><h1>Décrire mon colis</h1><p>Ces informations aident le voyageur à décider. Le nom et le numéro du destinataire ne lui sont montrés qu&apos;une fois le paiement bloqué.</p></div>
          <div className="panel"><ShipmentForm defaults={{ origin: p.origin, destination: p.destination }} /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
