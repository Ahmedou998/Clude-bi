"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark, Icon } from "./icons";
import { useDisplayCurrency, useToast } from "./providers";
import { CURRENCY_CODES, isCurrency } from "@/lib/currency";
import { api } from "@/lib/client";

const LINKS = [
  { href: "/trajets", label: "Trouver un trajet" },
  { href: "/demandes", label: "Colis à transporter" },
  { href: "/#fonctionnement", label: "Comment ça marche" },
  { href: "/regles", label: "Règles et sécurité" },
];

export function HeaderBar({ tone, user }: { tone: "light" | "dark"; user: { name: string } | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { currency, setCurrency } = useDisplayCurrency();
  const [open, setOpen] = useState(false);

  async function logout() {
    try { await api("/api/auth/logout", { method: "POST", body: {} }); } catch { /* cookie déjà invalide */ }
    toast("Vous êtes déconnecté.", "info");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header" data-tone={tone}>
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Teranga GP, accueil">
          <BrandMark className="brand-mark" /> <span className="word">teranga<b>gp</b></span>
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          {LINKS.map((l) => <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>{l.label}</Link>)}
        </nav>
        <div className="header-actions">
          <select className="currency-select hide-sm" aria-label="Devise d'affichage" value={currency} onChange={(e) => isCurrency(e.target.value) && setCurrency(e.target.value)}>
            {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {user ? (
            <>
              <Link href="/espace" className="btn btn-gold btn-sm"><Icon name="user" size={16} /> {user.name.split(" ")[0]}</Link>
              <button className="btn btn-ghost btn-sm hide-sm" onClick={logout} aria-label="Se déconnecter"><Icon name="logout" size={16} /></button>
            </>
          ) : (
            <Link href="/connexion" className="btn btn-gold btn-sm">Se connecter</Link>
          )}
          <button className="menu-btn" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name={open ? "x" : "menu"} size={26} />
          </button>
        </div>
      </div>
      <div className="mobile-nav" data-open={open} onClick={() => setOpen(false)}>
        {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        <Link href="/publier">Publier une annonce</Link>
        {user && <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Se déconnecter</a>}
      </div>
    </header>
  );
}
