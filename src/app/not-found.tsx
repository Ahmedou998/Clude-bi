import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container section-tight"><div className="empty"><h3>Page introuvable</h3><p>Ce lien n&apos;existe plus ou ne vous est pas accessible.</p><Link className="btn btn-ink" href="/">Retour à l&apos;accueil</Link></div></main>
    </>
  );
}
