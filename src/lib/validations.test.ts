import { describe, expect, it } from "vitest";
import { bookingActionSchema, bookingLocationSchema, otpVerifySchema, shipmentSchema, tripSchema } from "./validations";

const future = new Date(Date.now() + 86_400_000).toISOString();

describe("tripSchema", () => {
  const base = { origin: "Dakar, Sénégal", destination: "Paris, France", departureAt: future, availableWeightKg: 12, pricePerKg: 7000, currency: "XOF" };
  it("accepte un trajet valide", () => expect(tripSchema.safeParse(base).success).toBe(true));
  it("refuse un départ identique à la destination", () => expect(tripSchema.safeParse({ ...base, destination: "dakar, sénégal" }).success).toBe(false));
  it("refuse une devise inconnue", () => expect(tripSchema.safeParse({ ...base, currency: "ABC" }).success).toBe(false));
  it("refuse une date passée", () => expect(tripSchema.safeParse({ ...base, departureAt: "2020-01-01" }).success).toBe(false));
});

describe("shipmentSchema", () => {
  const base = {
    origin: "Paris, France", destination: "Dakar, Sénégal", description: "Deux cartons de vêtements", category: "vetements",
    weightKg: 6, currency: "EUR", recipientName: "Awa Ndiaye", recipientPhone: "+221 77 123 45 67", prohibitedAck: true,
  };
  it("accepte une demande valide", () => expect(shipmentSchema.safeParse(base).success).toBe(true));
  it("exige la déclaration sur les objets interdits", () => expect(shipmentSchema.safeParse({ ...base, prohibitedAck: false }).success).toBe(false));
  it("exige un téléphone valide pour le destinataire", () => expect(shipmentSchema.safeParse({ ...base, recipientPhone: "abc" }).success).toBe(false));
});

describe("autres schémas", () => {
  it("valide un code à 6 chiffres", () => {
    expect(otpVerifySchema.safeParse({ identifier: "+221771234567", code: "123456" }).success).toBe(true);
    expect(otpVerifySchema.safeParse({ identifier: "+221771234567", code: "12" }).success).toBe(false);
  });
  it("valide une action de réservation", () => {
    expect(bookingActionSchema.safeParse({ action: "pay" }).success).toBe(true);
    expect(bookingActionSchema.safeParse({ action: "steal" }).success).toBe(false);
  });
  it("valide les coordonnées de partage et borne les positions", () => {
    expect(bookingLocationSchema.safeParse({ kind: "meeting", latitude: 14.7, longitude: -17.4, label: "Gare" }).success).toBe(true);
    expect(bookingLocationSchema.safeParse({ kind: "live", latitude: 91, longitude: 0 }).success).toBe(false);
  });
});
