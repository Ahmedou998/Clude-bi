import { HttpError } from "./http";
import type { Identifier } from "./otp";

export const demoOtpEnabled = () => process.env.ALLOW_DEMO_OTP === "true";

/**
 * Envoie un code de connexion.
 * - OTP_WEBHOOK_URL : relai HTTP vers votre fournisseur SMS / e-mail / WhatsApp (Make, n8n, Twilio Function, etc.).
 *   Reçoit { channel: "phone" | "email", to, message } en POST JSON.
 * - ALLOW_DEMO_OTP=true : mode pilote/démonstration, le code est renvoyé à l'écran. À DÉSACTIVER avant tout usage réel.
 */
export async function deliverOtp(id: Identifier, code: string): Promise<{ demoCode?: string }> {
  const webhook = process.env.OTP_WEBHOOK_URL;
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.OTP_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.OTP_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ channel: id.kind, to: id.value, message: `Teranga GP : votre code est ${code}. Valable 10 minutes. Ne le partagez jamais.` }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (!response || !response.ok) throw new HttpError(502, "Impossible d'envoyer le code pour le moment. Réessayez.");
  }
  if (demoOtpEnabled()) {
    console.info(`[OTP démo] ${id.value} → ${code}`);
    return { demoCode: code };
  }
  if (!webhook) throw new HttpError(503, "L'envoi de codes n'est pas configuré (OTP_WEBHOOK_URL).");
  return {};
}
