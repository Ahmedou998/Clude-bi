// Machine à états d'une réservation (pure, sans dépendance, testée).
//
// REQUESTED → ACCEPTED → PAID (fonds bloqués) → HANDED_OVER (code de remise) → DELIVERED (code destinataire, fonds libérés)
// Sorties : REJECTED, CANCELLED (remboursement si payé), DISPUTED (fonds maintenus, traitement par le support).

export type BookingStatus =
  | "REQUESTED" | "ACCEPTED" | "PAID" | "HANDED_OVER" | "DELIVERED" | "REJECTED" | "CANCELLED" | "DISPUTED";

export type Actor = "sender" | "traveler";

export type BookingAction =
  | "accept" | "reject" | "pay" | "confirm_handover" | "confirm_delivery" | "cancel" | "dispute";

const RULES: Record<BookingStatus, Partial<Record<Actor, BookingAction[]>>> = {
  REQUESTED: { traveler: ["accept", "reject"], sender: ["cancel"] },
  ACCEPTED: { sender: ["pay", "cancel"], traveler: ["cancel"] },
  PAID: { traveler: ["confirm_handover", "cancel"], sender: ["cancel"] },
  HANDED_OVER: { traveler: ["confirm_delivery", "dispute"], sender: ["dispute"] },
  DELIVERED: {},
  REJECTED: {},
  CANCELLED: {},
  DISPUTED: {},
};

const NEXT: Record<BookingAction, BookingStatus> = {
  accept: "ACCEPTED",
  reject: "REJECTED",
  pay: "PAID",
  confirm_handover: "HANDED_OVER",
  confirm_delivery: "DELIVERED",
  cancel: "CANCELLED",
  dispute: "DISPUTED",
};

export function allowedActions(status: BookingStatus, actor: Actor): BookingAction[] {
  return RULES[status]?.[actor] ?? [];
}

export function canAct(status: BookingStatus, actor: Actor, action: BookingAction): boolean {
  return allowedActions(status, actor).includes(action);
}

export function nextStatus(status: BookingStatus, actor: Actor, action: BookingAction): BookingStatus {
  if (!canAct(status, actor, action)) {
    throw new Error(`Action « ${action} » impossible à l'état ${status} pour ${actor}.`);
  }
  return NEXT[action];
}

export const TIMELINE: { status: BookingStatus; title: string; hint: string }[] = [
  { status: "REQUESTED", title: "Demande envoyée", hint: "Le voyageur examine votre colis." },
  { status: "ACCEPTED", title: "Accord conclu", hint: "Prix et capacité sont réservés." },
  { status: "PAID", title: "Paiement bloqué", hint: "L'argent est gardé en sécurité jusqu'à la livraison." },
  { status: "HANDED_OVER", title: "Colis remis", hint: "Le voyageur a saisi votre code de remise." },
  { status: "DELIVERED", title: "Livré", hint: "Le destinataire a donné son code. Le voyageur est payé." },
];

export function timelineIndex(status: BookingStatus): number {
  const i = TIMELINE.findIndex((s) => s.status === status);
  return i === -1 ? -1 : i;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  REQUESTED: "En attente de réponse",
  ACCEPTED: "Acceptée, à payer",
  PAID: "Payée, remise à venir",
  HANDED_OVER: "En route",
  DELIVERED: "Livrée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
  DISPUTED: "Litige en cours",
};

export const ACTION_LABEL: Record<BookingAction, string> = {
  accept: "Accepter la demande",
  reject: "Refuser",
  pay: "Payer et bloquer les fonds",
  confirm_handover: "Confirmer la remise",
  confirm_delivery: "Confirmer la livraison",
  cancel: "Annuler",
  dispute: "Signaler un problème",
};

export const ACTIVE_BOOKING: BookingStatus[] = ["ACCEPTED", "PAID", "HANDED_OVER", "DELIVERED"];

/** Ce que l'utilisateur doit faire maintenant (null = rien). Alimente la section « À faire » du tableau de bord. */
export function needsMe(status: BookingStatus, actor: Actor): string | null {
  if (actor === "traveler" && status === "REQUESTED") return "Répondre à la demande";
  if (actor === "sender" && status === "ACCEPTED") return "Payer pour bloquer les fonds";
  if (actor === "traveler" && status === "PAID") return "Saisir le code de remise à la prise en charge";
  if (actor === "traveler" && status === "HANDED_OVER") return "Saisir le code du destinataire à la livraison";
  return null;
}
