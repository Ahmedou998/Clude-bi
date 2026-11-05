// Données de démonstration. Tous les comptes sont marqués isDemo et affichés « Démo » dans l'interface.
// Usage : npm run db:seed        (ajoute si absent)
//         npm run db:seed -- --reset   (supprime puis recrée les données de démo)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const day = (offset: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + offset); d.setUTCHours(23, 0, 0, 0); return d; };
const code = () => String(Math.floor(100000 + Math.random() * 900000));

async function reset() {
  const users = await prisma.user.findMany({ where: { isDemo: true }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (!ids.length) return;
  const bookings = await prisma.booking.findMany({ where: { OR: [{ senderId: { in: ids } }, { travelerId: { in: ids } }] }, select: { id: true } });
  const bids = bookings.map((b) => b.id);
  await prisma.review.deleteMany({ where: { bookingId: { in: bids } } });
  await prisma.message.deleteMany({ where: { bookingId: { in: bids } } });
  await prisma.bookingEvent.deleteMany({ where: { bookingId: { in: bids } } });
  await prisma.payment.deleteMany({ where: { bookingId: { in: bids } } });
  await prisma.booking.deleteMany({ where: { id: { in: bids } } });
  await prisma.shipment.deleteMany({ where: { senderId: { in: ids } } });
  await prisma.trip.deleteMany({ where: { travelerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  if (process.argv.includes("--reset")) await reset();
  if ((await prisma.user.count({ where: { isDemo: true } })) > 0) { console.log("Données de démo déjà présentes (utilisez --reset pour les recréer)."); return; }

  const mk = (slug: string, fullName: string) => prisma.user.create({ data: { fullName, email: `demo+${slug}@teranga-gp.invalid`, phoneVerifiedAt: new Date(), isDemo: true } });
  const [moussa, aminata, ibrahima, khadija, kofi, sophie, awa] = await Promise.all([
    mk("moussa", "Moussa Diallo"), mk("aminata", "Aminata Sow"), mk("ibrahima", "Ibrahima Fall"),
    mk("khadija", "Khadija Benali"), mk("kofi", "Kofi Mensah"), mk("sophie", "Sophie Martin"), mk("awa", "Awa Ndiaye"),
  ]);

  const trip = (travelerId: string, origin: string, destination: string, offset: number, kg: number, price: number, currency: string, notes?: string, status: "OPEN" | "COMPLETED" = "OPEN") =>
    prisma.trip.create({ data: { travelerId, origin, destination, departureAt: day(offset), availableWeightKg: kg, pricePerKg: price, currency, notes, status } });

  await trip(moussa.id, "Dakar, Sénégal", "Paris, France", 4, 18, 6000, "XOF", "Remise possible à Yoff ou à l'aéroport. Pas de colis volumineux.");
  await trip(aminata.id, "Paris, France", "Dakar, Sénégal", 7, 15, 9, "EUR", "Départ de Paris Nord. Je peux récupérer dans Paris intra-muros.");
  await trip(ibrahima.id, "Abidjan, Côte d'Ivoire", "Paris, France", 9, 12, 5500, "XOF");
  await trip(khadija.id, "Casablanca, Maroc", "Dakar, Sénégal", 12, 10, 90, "MAD", "Vol direct. Documents et petits colis uniquement.");
  await trip(kofi.id, "Accra, Ghana", "Bruxelles, Belgique", 15, 20, 140, "GHS");
  await trip(sophie.id, "Paris, France", "Abidjan, Côte d'Ivoire", 20, 14, 10, "EUR", "Je voyage souvent sur cette ligne.");
  await trip(moussa.id, "Dakar, Sénégal", "Lisbonne, Portugal", 24, 8, 7000, "XOF");

  const ship = (senderId: string, origin: string, destination: string, description: string, category: string, weightKg: number, currency: string, budget: number | null, offset: number | null) =>
    prisma.shipment.create({ data: { senderId, origin, destination, description, category, weightKg, currency, budget, desiredDate: offset === null ? null : day(offset), recipientName: "Destinataire démo", recipientPhone: "+221770000000", prohibitedAckAt: new Date() } });

  await ship(awa.id, "Paris, France", "Dakar, Sénégal", "Deux cartons de vêtements d'enfants et des chaussures", "vetements", 6, "EUR", 70, 10);
  await ship(awa.id, "Dakar, Sénégal", "Paris, France", "Épices, bissap séché et karité pour la famille", "alimentaire-sec", 4, "XOF", 40000, 8);
  await ship(aminata.id, "Abidjan, Côte d'Ivoire", "Paris, France", "Tissus wax, 3 pagnes", "vetements", 3, "XOF", null, 14);
  await ship(sophie.id, "Paris, France", "Abidjan, Côte d'Ivoire", "Pièces de rechange pour un scooter (plaquettes, filtres)", "pieces", 5, "EUR", 60, 22);

  // Deux livraisons passées pour afficher une réputation réelle.
  const past = await trip(moussa.id, "Dakar, Sénégal", "Paris, France", -20, 15, 6000, "XOF", undefined, "COMPLETED");
  for (const [desc, kg, rating] of [["Boîte de cadeaux et épices", 3, 5], ["Documents et vêtements", 2, 4]] as const) {
    const s = await prisma.shipment.create({ data: { senderId: awa.id, origin: "Dakar, Sénégal", destination: "Paris, France", description: desc, category: "cadeaux", weightKg: kg, currency: "XOF", recipientName: "Destinataire démo", recipientPhone: "+33600000000", prohibitedAckAt: new Date(), status: "DELIVERED" } });
    const price = kg * 6000, fee = Math.round(price * 0.08);
    const b = await prisma.booking.create({ data: { tripId: past.id, shipmentId: s.id, travelerId: moussa.id, senderId: awa.id, status: "DELIVERED", weightKg: kg, agreedPrice: price, serviceFee: fee, currency: "XOF", handoverCode: code(), deliveryCode: code() } });
    await prisma.payment.create({ data: { bookingId: b.id, provider: "simulation", providerRef: `sim_seed_${b.id}`, amount: price + fee, currency: "XOF", status: "RELEASED", heldAt: day(-21), releasedAt: day(-19) } });
    await prisma.review.create({ data: { authorId: awa.id, recipientId: moussa.id, bookingId: b.id, rating, comment: rating === 5 ? "Ponctuel, très rassurant." : "Bonne communication." } });
  }
  console.log("Données de démo créées : 7 comptes, 8 trajets, 6 colis.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
