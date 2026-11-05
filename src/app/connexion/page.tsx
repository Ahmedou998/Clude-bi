import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/format";
import { Icon } from "@/components/icons";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <>
      <SiteHeader />
      <main className="container section-tight">
        <div className="narrow" style={{ maxWidth: 480 }}>
          <div className="panel stack" style={{ gap: 22 }}>
            <div><h1 style={{ fontSize: 34 }}>Connexion</h1><p className="muted" style={{ marginTop: 8 }}>Pas de mot de passe : un code à 6 chiffres suffit. Votre compte se crée à la première connexion.</p></div>
            <LoginForm next={next} />
            <p className="muted" style={{ fontSize: 13 }}><Icon name="shield" size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Votre numéro n&apos;est jamais affiché publiquement.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
