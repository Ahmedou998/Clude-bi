import { z } from "zod";
import { isCurrency } from "./currency";
import { SHIPMENT_CATEGORY_IDS } from "./catalog";
import { normalizeIdentifier } from "./otp";

const place = z.string().trim().min(2, "Indiquez une ville et un pays.").max(80);
const currency = z.string().refine(isCurrency, "Devise non prise en charge.");
const futureDate = z.coerce.date().refine((date) => date.getTime() > Date.now(), {
  message: "La date doit être dans le futur.",
});
const differentPlaces = (d: { origin: string; destination: string }) =>
  d.origin.toLocaleLowerCase() !== d.destination.toLocaleLowerCase();

export const otpRequestSchema = z.object({
  identifier: z.string().trim().min(3, "Saisissez un numéro ou un e-mail.").max(120),
});

export const otpVerifySchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  code: z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres."),
  fullName: z.string().trim().min(2).max(80).optional(),
});

export const tripSchema = z.object({
  origin: place,
  destination: place,
  via: z.array(place).max(8).default([]),
  departureAt: futureDate,
  availableWeightKg: z.number().positive("Indiquez un poids.").max(100),
  pricePerKg: z.number().int("Prix entier uniquement.").positive("Indiquez un prix.").max(5_000_000),
  currency,
  notes: z.string().trim().max(500).optional(),
}).refine(differentPlaces, { message: "Le départ et la destination doivent être différents.", path: ["destination"] });

export const shipmentSchema = z.object({
  origin: place,
  destination: place,
  description: z.string().trim().min(5, "Décrivez le contenu (5 caractères minimum).").max(500),
  category: z.string().refine((v) => SHIPMENT_CATEGORY_IDS.includes(v), "Catégorie inconnue."),
  weightKg: z.number().positive("Indiquez un poids.").max(100),
  declaredValue: z.number().int().nonnegative().max(100_000_000).optional(),
  budget: z.number().int().positive().max(10_000_000).optional(),
  currency,
  desiredDate: z.coerce.date().optional(),
  recipientName: z.string().trim().min(2, "Nom du destinataire requis.").max(80),
  recipientPhone: z.string().trim().refine((v) => normalizeIdentifier(v)?.kind === "phone", "Numéro invalide (format international, ex. +221 77 123 45 67)."),
  prohibitedAck: z.boolean().refine((v) => v === true, { message: "Vous devez confirmer que le colis ne contient aucun objet interdit." }),
}).refine(differentPlaces, { message: "Le départ et la destination doivent être différents.", path: ["destination"] });

export const bookingRequestSchema = z.object({
  tripId: z.string().min(10).max(40),
  shipmentId: z.string().min(10).max(40),
});

export const bookingActionSchema = z.object({
  action: z.enum(["accept", "reject", "pay", "confirm_handover", "confirm_delivery", "cancel", "dispute", "review"]),
  code: z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres.").optional(),
  reason: z.string().trim().max(300).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(500).optional(),
});
export type BookingActionInput = z.infer<typeof bookingActionSchema>;

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Écrivez un message.").max(1000),
});

export const bookingLocationSchema = z.object({
  kind: z.enum(["meeting", "live"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().trim().max(120).optional(),
});
