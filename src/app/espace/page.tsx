import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Dashboard } from "@/components/dashboard";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { userDashboard } from "@/lib/queries";

export const metadata: Metadata = { title: "Mon espace" };
export const dynamic = "force-dynamic";

export default async function SpacePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/espace");
  const data = await userDashboard(user.id);
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBottom: 80 }}>
        <div className="page-head spread" style={{ alignItems: "end" }}>
          <div>
            <h1>Bonjour {user.fullName.split(" ")[0]}</h1>
            <p className="row" style={{ marginTop: 12 }}>
              {user.phoneVerifiedAt ? <span className="badge badge-ok"><Icon name="check" size={13} /> Téléphone vérifié</span> : <span className="badge">Téléphone non vérifié</span>}
              <span className="badge">Identité par pièce : bientôt</span>
            </p>
          </div>
          <div className="row"><Link className="btn btn-ink" href="/publier/colis">Envoyer un colis</Link><Link className="btn btn-ghost" href="/publier/trajet">Publier un trajet</Link></div>
        </div>
        <Dashboard bookings={data.bookings} shipments={data.shipments} trips={data.trips} />
      </main>
      <SiteFooter />
    </>
  );
}
