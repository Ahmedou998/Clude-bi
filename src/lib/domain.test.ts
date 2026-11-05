import { describe, expect, it } from "vitest";
import { allowedActions, canAct, nextStatus, timelineIndex } from "./booking-flow";
import { cityOf, quote, samePlace, scoreMatch } from "./matching";
import { generateNumericCode, hashCode, maskIdentifier, normalizeIdentifier, safeEqual } from "./otp";
import { signSession, verifySession } from "./session";
import { convert, formatMoney } from "./currency";
import { rateLimit } from "./rate-limit";

const SECRET = "x".repeat(40);

describe("booking-flow", () => {
  it("suit le parcours nominal", () => {
    let s = nextStatus("REQUESTED", "traveler", "accept");
    expect(s).toBe("ACCEPTED");
    s = nextStatus(s, "sender", "pay");
    expect(s).toBe("PAID");
    s = nextStatus(s, "traveler", "confirm_handover");
    expect(s).toBe("HANDED_OVER");
    s = nextStatus(s, "traveler", "confirm_delivery");
    expect(s).toBe("DELIVERED");
  });
  it("interdit les raccourcis", () => {
    expect(canAct("REQUESTED", "sender", "accept")).toBe(false);
    expect(canAct("ACCEPTED", "traveler", "pay")).toBe(false);
    expect(canAct("PAID", "traveler", "confirm_delivery")).toBe(false);
    expect(() => nextStatus("DELIVERED", "sender", "cancel")).toThrow();
    expect(allowedActions("DISPUTED", "sender")).toEqual([]);
  });
  it("seul le voyageur confirme la remise et la livraison", () => {
    expect(canAct("PAID", "sender", "confirm_handover")).toBe(false);
    expect(canAct("HANDED_OVER", "sender", "confirm_delivery")).toBe(false);
  });
  it("calcule l'index de timeline", () => {
    expect(timelineIndex("PAID")).toBe(2);
    expect(timelineIndex("CANCELLED")).toBe(-1);
  });
});

describe("matching", () => {
  const future = new Date(Date.now() + 5 * 86_400_000);
  const trip = { origin: "Dakar, Sénégal", destination: "Paris, France", departureAt: future, remainingKg: 12, pricePerKg: 7000, currency: "XOF" };
  it("normalise les lieux", () => {
    expect(cityOf("Thiès, Sénégal")).toBe("thies");
    expect(samePlace("dakar", "Dakar, Sénégal")).toBe(true);
    expect(samePlace("Paris, France", "Lyon, France")).toBe(false);
  });
  it("calcule le prix et la commission", () => {
    expect(quote(7000, 3)).toEqual({ price: 21000, fee: 1680, total: 22680 });
  });
  it("rapproche un colis compatible", () => {
    const r = scoreMatch(trip, { origin: "dakar", destination: "paris", weightKg: 4, currency: "XOF", budget: 40000, desiredDate: new Date(future.getTime() + 3 * 86_400_000) });
    expect(r).toBeTruthy();
    expect(r!.withinBudget).toBe(true);
    expect(r!.score).toBeGreaterThan(80);
  });
  it("écarte les colis trop lourds ou sur un autre itinéraire", () => {
    expect(scoreMatch(trip, { origin: "Dakar", destination: "Paris", weightKg: 20, currency: "XOF" })).toBeNull();
    expect(scoreMatch(trip, { origin: "Dakar", destination: "Lyon", weightKg: 2, currency: "XOF" })).toBeNull();
  });
  it("convertit le budget entre devises", () => {
    const r = scoreMatch({ ...trip, pricePerKg: 10, currency: "EUR" }, { origin: "Dakar", destination: "Paris", weightKg: 2, currency: "XOF", budget: 5000 });
    expect(r!.withinBudget).toBe(false); // 20 € ≈ 13 119 FCFA
  });
});

describe("otp", () => {
  it("normalise téléphones et e-mails", () => {
    expect(normalizeIdentifier("77 123 45 67")).toEqual({ kind: "phone", value: "+221771234567" });
    expect(normalizeIdentifier("0033 6 12 34 56 78")).toEqual({ kind: "phone", value: "+33612345678" });
    expect(normalizeIdentifier("+221 77 123 45 67")?.value).toBe("+221771234567");
    expect(normalizeIdentifier("Moussa@Mail.com")).toEqual({ kind: "email", value: "moussa@mail.com" });
    expect(normalizeIdentifier("12")).toBeNull();
    expect(normalizeIdentifier("pas un email@")).toBeNull();
  });
  it("génère et compare des codes", () => {
    const code = generateNumericCode(6);
    expect(code).toHaveLength(6);
    const h = hashCode(SECRET, "login:+221771234567", code);
    expect(safeEqual(h, hashCode(SECRET, "login:+221771234567", code))).toBe(true);
    expect(safeEqual(h, hashCode(SECRET, "login:+221771234567", "000000" === code ? "111111" : "000000"))).toBe(false);
  });
  it("masque l'identifiant", () => {
    expect(maskIdentifier({ kind: "email", value: "moussa@mail.com" })).toBe("mo•••@mail.com");
  });
});

describe("session", () => {
  it("signe et vérifie", () => {
    const t = signSession("user_1", Date.now(), 60, SECRET);
    expect(verifySession(t, Date.now(), SECRET)).toBe("user_1");
  });
  it("rejette un jeton falsifié ou expiré", () => {
    const t = signSession("user_1", Date.now(), 60, SECRET);
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "admin", e: 9_999_999_999 })).toString("base64url") + "." + s;
    expect(verifySession(forged, Date.now(), SECRET)).toBeNull();
    expect(verifySession(p + "." + s.slice(0, -2) + "xx", Date.now(), SECRET)).toBeNull();
    expect(verifySession(t, Date.now() + 120_000, SECRET)).toBeNull();
    expect(verifySession(null, Date.now(), SECRET)).toBeNull();
  });
});

describe("devises et limitation", () => {
  it("convertit XOF ↔ EUR", () => {
    expect(Math.round(convert(655.957, "XOF", "EUR"))).toBe(1);
    expect(formatMoney(1500, "EUR")).toContain("€");
  });
  it("limite le débit", () => {
    const k = "test:" + Math.random();
    expect(rateLimit(k, 2, 1000, 0).ok).toBe(true);
    expect(rateLimit(k, 2, 1000, 10).ok).toBe(true);
    expect(rateLimit(k, 2, 1000, 20).ok).toBe(false);
    expect(rateLimit(k, 2, 1000, 1500).ok).toBe(true);
  });
});
