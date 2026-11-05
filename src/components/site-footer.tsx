import Link from "next/link";
import { BrandMark } from "./icons";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div style={{ maxWidth: 360 }}>
          <div className="brand" style={{ color: "var(--ink)", marginBottom: 10 }}><BrandMark className="brand-mark" /> <span className="word">teranga<b style={{ color: "var(--bissap)" }}>gp</b></span></div>
          <p>Le colis voyage avec vous. Afrique ↔ Europe, dans les deux sens.</p>
          <p style={{ marginTop: 10, fontSize: 13 }}>Version pilote. Conditions d&apos;utilisation et politique de confidentialité à publier avant l&apos;ouverture au public.</p>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <Link href="/publier/colis">Envoyer un colis</Link>
          <Link href="/publier/trajet">Publier un trajet</Link>
          <Link href="/trajets">Trouver un trajet</Link>
          <Link href="/regles">Colis interdits et règles</Link>
        </div>
      </div>
    </footer>
  );
}
