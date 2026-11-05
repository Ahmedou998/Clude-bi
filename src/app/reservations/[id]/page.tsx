import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingPanel } from "@/components/booking-panel";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { getBookingDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Réservation" };
export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/reservations/${id}`)}`);
  const booking = await getBookingDetail(user.id, id);
  if (!booking) notFound();
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ paddingBottom: 80 }}>
        <div className="page-head" style={{ paddingBottom: 18 }}><Link className="back" href="/espace"><Icon name="arrow-left" size={16} /> Mon espace</Link></div>
        <BookingPanel b={booking} />
      </main>
      <SiteFooter />
    </>
  );
}
