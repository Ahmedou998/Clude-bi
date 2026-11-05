// Contenu de référence : catégories de colis, marchandises interdites, villes proposées, corridors.

export const SHIPMENT_CATEGORIES = [
  { id: "vetements", label: "Vêtements et tissus" },
  { id: "alimentaire-sec", label: "Produits alimentaires secs, épices" },
  { id: "cosmetiques", label: "Cosmétiques et soins" },
  { id: "electronique", label: "Électronique (à déclarer)" },
  { id: "documents", label: "Documents" },
  { id: "pieces", label: "Pièces et accessoires (auto, moto)" },
  { id: "cadeaux", label: "Cadeaux et objets personnels" },
  { id: "autre", label: "Autre (à décrire)" },
] as const;
export const SHIPMENT_CATEGORY_IDS = SHIPMENT_CATEGORIES.map((c) => c.id) as string[];
export const categoryLabel = (id: string) => SHIPMENT_CATEGORIES.find((c) => c.id === id)?.label ?? "Autre";

export const PROHIBITED_GOODS = [
  { title: "Stupéfiants et substances illicites", detail: "Toute drogue, y compris les produits « naturels » dont la détention est restreinte." },
  { title: "Armes, munitions, explosifs", detail: "Y compris répliques, couteaux de combat, aérosols de défense et pièces d'armes." },
  { title: "Argent liquide, titres et métaux précieux", detail: "Espèces, chèques, cartes bancaires, lingots. Pour envoyer de l'argent, utilisez un service de transfert agréé." },
  { title: "Contrefaçons et objets volés", detail: "Le voyageur engage sa responsabilité à la douane. Tout doute vaut refus." },
  { title: "Produits dangereux ou inflammables", detail: "Batteries lithium en vrac, gaz, carburants, solvants, produits chimiques." },
  { title: "Denrées périssables et produits animaux", detail: "Viande, poisson frais, produits laitiers, plantes et graines soumis à contrôle sanitaire." },
  { title: "Médicaments sans justificatif", detail: "Seuls les traitements personnels accompagnés d'une ordonnance peuvent circuler." },
  { title: "Espèces protégées et produits dérivés", detail: "Ivoire, peaux, coraux, bois précieux." },
] as const;

export const TRAVELER_RIGHTS = [
  "Demander à voir le contenu du colis avant de l'accepter.",
  "Refuser un colis sans avoir à se justifier, avant la remise.",
  "Connaître le nom et le numéro du destinataire avant le départ.",
  "Être payé uniquement sur confirmation du destinataire : le code de livraison libère les fonds.",
] as const;

export const CITY_SUGGESTIONS = [
  "Dakar, Sénégal", "Thiès, Sénégal", "Saint-Louis, Sénégal", "Touba, Sénégal", "Ziguinchor, Sénégal",
  "Abidjan, Côte d'Ivoire", "Bamako, Mali", "Conakry, Guinée", "Nouakchott, Mauritanie", "Banjul, Gambie",
  "Casablanca, Maroc", "Marrakech, Maroc", "Tunis, Tunisie", "Alger, Algérie", "Accra, Ghana", "Lagos, Nigéria",
  "Paris, France", "Lyon, France", "Marseille, France", "Lille, France", "Bordeaux, France", "Toulouse, France",
  "Bruxelles, Belgique", "Madrid, Espagne", "Barcelone, Espagne", "Lisbonne, Portugal", "Milan, Italie", "Rome, Italie",
  "Genève, Suisse", "Francfort, Allemagne", "Londres, Royaume-Uni", "Montréal, Canada",
] as const;

/** Liaisons mises en avant sur la carte d'accueil (identifiants de src/lib/map-data.ts). */
export const HERO_CORRIDORS = [
  { from: "dakar", to: "paris", fromLabel: "Dakar, Sénégal", toLabel: "Paris, France" },
  { from: "abidjan", to: "paris", fromLabel: "Abidjan, Côte d'Ivoire", toLabel: "Paris, France" },
  { from: "casablanca", to: "dakar", fromLabel: "Casablanca, Maroc", toLabel: "Dakar, Sénégal" },
  { from: "dakar", to: "lisbonne", fromLabel: "Dakar, Sénégal", toLabel: "Lisbonne, Portugal" },
  { from: "tunis", to: "lyon", fromLabel: "Tunis, Tunisie", toLabel: "Lyon, France" },
  { from: "accra", to: "bruxelles", fromLabel: "Accra, Ghana", toLabel: "Bruxelles, Belgique" },
  { from: "bamako", to: "marseille", fromLabel: "Bamako, Mali", toLabel: "Marseille, France" },
  { from: "alger", to: "milan", fromLabel: "Alger, Algérie", toLabel: "Milan, Italie" },
] as const;

/** Tarifs indicatifs (EUR/kg) affichés par l'estimateur tant qu'il n'y a pas assez d'annonces réelles. À valider sur le terrain. */
export const DEFAULT_RATES_EUR: Record<string, number> = {
  "dakar>paris": 9, "paris>dakar": 9, "abidjan>paris": 9, "paris>abidjan": 9,
  "casablanca>dakar": 8, "dakar>lisbonne": 9, "tunis>lyon": 8, "accra>bruxelles": 10,
  "bamako>marseille": 9, "alger>milan": 8,
};
