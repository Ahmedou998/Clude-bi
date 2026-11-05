import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TripForm } from "@/components/trip-form";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Publier un trajet" };
export const dynamic = "force-dynamic";

export default async function PublishTripPage({ searchParams }: { searchParams: Promise<{ origin?: string; destination?: string }> }) {
  const p = await searchParams;
  if (!(await getCurrentUser())) {
    const back = `/publier/trajet${p.origin || p.destination ? `?${new URLSearchParams({ origin: p.origin ?? "", destination: p.destination ?? "" })}` : ""}`;
    redirect(`/connexion?next=${encodeURIComponent(back)}`);
  }
  return (
    <>
      <SiteHeader />
      <main className="container section-tight">
        <div className="narrow">
          <Link className="back" href="/publier"><Icon name="arrow-left" size={16} /> Retour</Link>
          <div className="page-head" style={{ paddingTop: 0 }}><h1>Publier mon trajet</h1><p>Vous fixez le prix au kilo. Vous êtes payé à la livraison, quand le destinataire vous donne son code.</p></div>
          <div className="panel"><TripForm defaults={{ origin: p.origin, destination: p.destination }} /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
