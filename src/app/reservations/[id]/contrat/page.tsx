import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintContractButton } from "@/components/print-contract-button";
import { categoryLabel } from "@/lib/catalog";
import { formatMoney } from "@/lib/currency";
import { formatDateLong } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Protocole de transport" };
export const dynamic = "force-dynamic";

const printableStatuses = ["ACCEPTED", "PAID", "HANDED_OVER", "DELIVERED"];

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/reservations/${id}/contrat`)}`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: true,
      shipment: true,
      sender: { select: { id: true, fullName: true, phone: true, email: true } },
      traveler: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!booking || (booking.senderId !== user.id && booking.travelerId !== user.id) || !printableStatuses.includes(booking.status)) notFound();

  const total = booking.agreedPrice + booking.serviceFee;
  const showRecipient = booking.senderId === user.id || ["PAID", "HANDED_OVER", "DELIVERED"].includes(booking.status);

  return (
    <main className="container contract-page">
      <div className="contract-actions">
        <Link className="back" href={`/reservations/${id}`}>← Retour à la réservation</Link>
        <PrintContractButton />
      </div>
      <article className="contract-document">
        <header className="contract-heading">
          <p className="contract-kicker">TERANGA GP · PROJET INDIVIDUALISÉ</p>
          <h1>Protocole de transport de colis entre particuliers</h1>
          <p>Trajet {booking.trip.origin} → {booking.trip.destination}</p>
          <small>Réservation {booking.id} · Généré le {new Date().toLocaleDateString("fr-FR")}</small>
        </header>

        <div className="form-note contract-warning">
          Document de pilote à relire et faire signer par les deux parties. Ce modèle ne constitue pas un avis juridique et sa conformité au Sénégal, en France, aux règles douanières et aux règles de transport doit être validée par un professionnel avant usage réel.
        </div>

        <section className="contract-section">
          <h2>1. Parties</h2>
          <div className="contract-parties">
            <div><b>Expéditeur</b><strong>{booking.sender.fullName}</strong><span>{booking.sender.phone || booking.sender.email || "Coordonnée non renseignée"}</span></div>
            <div><b>Voyageur</b><strong>{booking.traveler.fullName}</strong><span>{booking.traveler.phone || booking.traveler.email || "Coordonnée non renseignée"}</span></div>
          </div>
        </section>

        <section className="contract-section">
          <h2>2. Colis et transport</h2>
          <dl className="contract-data">
            <div><dt>Départ</dt><dd>{booking.trip.origin}</dd></div>
            <div><dt>Destination</dt><dd>{booking.trip.destination}</dd></div>
            <div><dt>Date prévue</dt><dd>{formatDateLong(booking.trip.departureAt)}</dd></div>
            <div><dt>Poids déclaré</dt><dd>{booking.weightKg} kg</dd></div>
            <div><dt>Contenu déclaré</dt><dd>{booking.shipment.description} · {categoryLabel(booking.shipment.category)}</dd></div>
            <div><dt>Destinataire</dt><dd>{showRecipient ? `${booking.shipment.recipientName} · ${booking.shipment.recipientPhone}` : "Coordonnées communiquées après confirmation du paiement"}</dd></div>
          </dl>
        </section>

        <section className="contract-section">
          <h2>3. Prix et paiement</h2>
          <dl className="contract-data">
            <div><dt>Transport</dt><dd>{formatMoney(booking.agreedPrice, booking.currency)}</dd></div>
            <div><dt>Frais de service</dt><dd>{formatMoney(booking.serviceFee, booking.currency)}</dd></div>
            <div><dt>Total convenu</dt><dd><strong>{formatMoney(total, booking.currency)}</strong></dd></div>
          </dl>
          <p className="contract-warning-text">En version pilote, le paiement est simulé: aucun fonds n&apos;est effectivement encaissé, séquestré ou versé par Teranga GP.</p>
        </section>

        <section className="contract-section">
          <h2>4. Engagements convenus</h2>
          <ol className="contract-clauses">
            <li>L&apos;expéditeur déclare l&apos;exactitude des informations du colis, assure un emballage adapté et confirme que son contenu est autorisé au départ, en transit et à destination. Il ne remet aucun objet interdit ou dangereux.</li>
            <li>Le voyageur accepte le transport décrit ci-dessus, prend soin du colis pendant le trajet et prévient rapidement l&apos;expéditeur en cas de retard, d&apos;incident ou d&apos;impossibilité de livraison.</li>
            <li>Les parties vérifient ensemble l&apos;état du colis lors de la remise et de la réception. Les codes à usage unique de l&apos;application ne sont communiqués qu&apos;au moment de l&apos;échange correspondant.</li>
            <li>Les parties conservent leurs justificatifs et utilisent la messagerie de la réservation pour signaler tout désaccord. Elles peuvent contacter le support Teranga GP; ce dernier ne remplace ni les autorités ni les recours prévus par la loi.</li>
            <li>Le partage de localisation est facultatif, limité aux participants et désactivable par le voyageur. Il ne remplace pas la confirmation de remise ou de livraison par code.</li>
          </ol>
        </section>

        <section className="contract-section">
          <h2>5. Signatures</h2>
          <p>En signant, chaque partie confirme avoir lu les informations de cette réservation et les engagements ci-dessus. Les parties complètent la date et signent chacune un exemplaire.</p>
          <div className="contract-signatures">
            <div><b>Expéditeur · {booking.sender.fullName}</b><span>Date et lieu</span><i /><span>Signature</span><i /></div>
            <div><b>Voyageur · {booking.traveler.fullName}</b><span>Date et lieu</span><i /><span>Signature</span><i /></div>
          </div>
        </section>

        <footer className="contract-footer">Document généré depuis les données de réservation Teranga GP. La génération n&apos;est pas une signature électronique et ne garantit pas à elle seule la validité juridique du document.</footer>
      </article>
    </main>
  );
}