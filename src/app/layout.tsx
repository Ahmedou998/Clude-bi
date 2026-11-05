import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { paymentsAreSimulated } from "@/lib/payments";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Teranga GP — Le colis voyage avec vous", template: "%s · Teranga GP" },
  description: "Envoyez un colis ou rentabilisez votre bagage entre l'Afrique et l'Europe, dans les deux sens. Paiement bloqué jusqu'à la livraison, codes de remise à usage unique.",
  applicationName: "Teranga GP",
  manifest: "/manifest.webmanifest",
  openGraph: { title: "Teranga GP", description: "Le colis voyage avec vous. Afrique ↔ Europe.", type: "website", locale: "fr_FR" },
};

export const viewport: Viewport = { themeColor: "#0b2536", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          {paymentsAreSimulated() && <div className="banner">Version pilote : les paiements sont simulés, aucun argent ne circule.</div>}
          {children}
        </Providers>
      </body>
    </html>
  );
}
