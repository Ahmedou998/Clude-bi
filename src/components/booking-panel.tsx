"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import type { BookingDetail } from "@/lib/queries";
import { ACTION_LABEL, STATUS_LABEL, TIMELINE, timelineIndex, type BookingAction } from "@/lib/booking-flow";
import { formatMoney } from "@/lib/currency";
import { formatDate, initials, splitPlace } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog";
import { Icon } from "./icons";
import { useToast } from "./providers";
import { Stars } from "./trip-card";
import { BookingLocation } from "./booking-location";

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayTime = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Digits({ code }: { code: string }) {
  return <div className="code-digits">{code.split("").map((d, i) => <span key={i}>{d}</span>)}</div>;
}

export function BookingPanel({ b }: { b: BookingDetail }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<BookingAction | "review" | null>(null);
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [shake, setShake] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const idx = timelineIndex(b.status);
  const closed = ["REJECTED", "CANCELLED", "DISPUTED"].includes(b.status);
  const from = splitPlace(b.trip.origin), to = splitPlace(b.trip.destination);
  const can = (a: BookingAction) => b.allowed.includes(a);

  // Rafraîchit l'état de la réservation toutes les 20 s tant que l'onglet est visible.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 20_000);
    return () => clearInterval(t);
  }, [router]);

  async function act(action: BookingAction) {
    setBusy(action);
    try {
      await api(`/api/bookings/${b.id}/action`, { body: { action, code: code || undefined, reason: reason || undefined } });
      if (action === "confirm_delivery") { setCelebrate(true); toast("Livraison confirmée. Le paiement est libéré.", "ok"); }
      else toast(`${ACTION_LABEL[action]} : c'est fait.`, "ok");
      setCode(""); setReason(""); setShowDispute(false); setConfirmCancel(false);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
      if (action.startsWith("confirm")) { setShake(true); setTimeout(() => setShake(false), 450); }
    }
    setBusy(null);
  }

  async function review() {
    setBusy("review");
    try { await api(`/api/bookings/${b.id}/action`, { body: { action: "review", rating, comment: comment || undefined } }); toast("Merci pour votre avis.", "ok"); router.refresh(); }
    catch (e) { toast((e as Error).message, "error"); }
    setBusy(null);
  }

  return (
    <div className="two-col">
      <div className="stack" style={{ gap: 20 }}>
        <section className={`panel ${celebrate ? "burst" : ""}`}>
          <div className="spread" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 26 }}>{from.city} → {to.city}</h2>
              <p className="muted">Départ le {formatDate(b.trip.departureAt)} · {b.shipment.weightKg} kg · {categoryLabel(b.shipment.category)}</p>
            </div>
            <span className={`badge ${b.status === "DELIVERED" ? "badge-ok" : closed ? "badge-bad" : "badge-gold"}`}>{STATUS_LABEL[b.status]}</span>
          </div>
          <p style={{ marginBottom: 22 }}>{b.shipment.description}</p>
          {closed ? (
            <div className={b.status === "DISPUTED" ? "form-note" : "form-error"}>
              {b.status === "DISPUTED" ? "Un problème a été signalé. Les fonds restent bloqués le temps que le support examine la situation." : b.status === "REJECTED" ? "Le voyageur a refusé cette demande." : "Cette réservation a été annulée." + (b.payment?.status === "REFUNDED" ? " Le paiement a été remboursé." : "")}
            </div>
          ) : (
            <div className="steps" aria-label="Avancement">
              {TIMELINE.map((s, i) => {
                const done = i <= idx, current = i === idx + 1;
                const ev = b.events.find((e) => e.type === s.status);
                return (
                  <div className="step" key={s.status} data-done={done} data-current={current} data-future={i > idx + 1}>
                    <span className="node">{done && <Icon name="check" size={15} />}</span>
                    <div><span className="t">{s.title}</span><small>{ev ? dayTime(ev.at) : s.hint}</small></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <BookingLocation bookingId={b.id} status={b.status} actor={b.actor} />

        {["ACCEPTED", "PAID", "HANDED_OVER", "DELIVERED"].includes(b.status) && (
          <section className="panel spread contract-link">
            <div>
              <h3 style={{ fontSize: 18 }}>Protocole de transport</h3>
              <p className="muted" style={{ fontSize: 14 }}>Récapitulatif des engagements, prêt à imprimer et à signer.</p>
            </div>
            <Link className="btn btn-ghost btn-sm" href={`/reservations/${b.id}/contrat`}><Icon name="shield" size={16} /> Voir le contrat</Link>
          </section>
        )}

        {/* Actions de la prochaine étape */}
        {!closed && b.status !== "DELIVERED" && (
          <section className="panel stack">
            <h3 style={{ fontSize: 20 }}>À faire maintenant</h3>

            {b.actor === "traveler" && b.status === "REQUESTED" && (
              <div className="row">
                <button className="btn btn-ink" disabled={!!busy} onClick={() => act("accept")}>{busy === "accept" ? <span className="spinner" /> : "Accepter la demande"}</button>
                <button className="btn btn-ghost" disabled={!!busy} onClick={() => act("reject")}>Refuser</button>
                <p className="muted" style={{ flexBasis: "100%", fontSize: 14 }}>Demandez à voir le contenu dans la messagerie avant d&apos;accepter. Vous pouvez refuser sans vous justifier.</p>
              </div>
            )}
            {b.actor === "sender" && b.status === "REQUESTED" && <p className="muted">En attente de la réponse du voyageur. Vous recevrez la suite ici. Vous pouvez lui écrire en attendant.</p>}

            {b.actor === "sender" && b.status === "ACCEPTED" && (
              <div className="stack">
                <p>Le voyageur a accepté. Payez pour bloquer les fonds : il ne les reçoit qu&apos;à la livraison.</p>
                <button className="btn btn-gold" disabled={!!busy} onClick={() => act("pay")}>{busy === "pay" ? <span className="spinner" /> : <><Icon name="lock" size={18} /> Payer {formatMoney(b.money.total, b.money.currency)}</>}</button>
                <small className="muted">Paiement simulé en version pilote : aucun argent ne circule.</small>
              </div>
            )}
            {b.actor === "traveler" && b.status === "ACCEPTED" && <p className="muted">En attente du paiement de l&apos;expéditeur. Ne prenez pas le colis avant que les fonds soient bloqués.</p>}

            {b.status === "PAID" && b.actor === "sender" && b.codes && (
              <div className="stack">
                <div className="code-box"><span>Code de remise : à donner au voyageur quand vous lui confiez le colis</span><Digits code={b.codes.handover} /></div>
                <div className="code-box"><span>Code de livraison : à donner à {b.shipment.recipientName ?? "votre destinataire"}, qui le donnera au voyageur à l&apos;arrivée</span><Digits code={b.codes.delivery} /></div>
              </div>
            )}
            {b.status === "HANDED_OVER" && b.actor === "sender" && b.codes && (
              <div className="code-box"><span>Code de livraison : transmettez-le à {b.shipment.recipientName ?? "votre destinataire"}</span><Digits code={b.codes.delivery} /></div>
            )}
            {b.status === "PAID" && b.actor === "traveler" && (
              <CodeEntry label="Code de remise de l'expéditeur" hint="Saisissez-le au moment où il vous remet le colis. Photographiez le colis à cet instant." cta="Confirmer la remise" code={code} setCode={setCode} busy={busy === "confirm_handover"} shake={shake} onSubmit={() => act("confirm_handover")} />
            )}
            {b.status === "HANDED_OVER" && b.actor === "traveler" && (
              <>
                {b.shipment.recipientName && <div className="form-note"><b>Destinataire :</b> {b.shipment.recipientName}{b.shipment.recipientPhone && <> · <a href={`tel:${b.shipment.recipientPhone}`} style={{ textDecoration: "underline" }}>{b.shipment.recipientPhone}</a></>}</div>}
                <CodeEntry label="Code du destinataire" hint="Le destinataire vous le donne à la réception. Dès la saisie, vous êtes payé." cta="Confirmer la livraison" code={code} setCode={setCode} busy={busy === "confirm_delivery"} shake={shake} onSubmit={() => act("confirm_delivery")} />
              </>
            )}
            {b.status === "PAID" && b.actor === "sender" && <p className="muted" style={{ fontSize: 14 }}>Les fonds sont bloqués. Le voyageur ne les reçoit qu&apos;après la livraison.</p>}
          </section>
        )}

        {b.status === "DELIVERED" && (
          <section className="panel stack">
            <h3 style={{ fontSize: 20 }}>{b.actor === "traveler" ? "Vous avez été payé" : "Colis livré"}</h3>
            <p className="muted">{b.actor === "traveler" ? `${formatMoney(b.money.price, b.money.currency)} ont été libérés à votre profit.` : "Le destinataire a confirmé la réception avec son code."}</p>
            {b.reviewed ? <p><Icon name="check" size={16} style={{ display: "inline", color: "var(--baobab)" }} /> Merci, votre avis est enregistré.</p> : (
              <div className="stack">
                <span className="label">Comment s&apos;est passée la livraison ?</span>
                <div className="stars" role="radiogroup" aria-label="Note">
                  {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} sur 5`} data-on={n <= rating} onClick={() => setRating(n)}><Icon name="star" size={30} style={n <= rating ? { fill: "currentColor" } : undefined} /></button>)}
                </div>
                <div className="field"><textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder="Un mot pour les prochains utilisateurs (facultatif)" aria-label="Commentaire" /></div>
                <button className="btn btn-ink" disabled={!rating || busy === "review"} onClick={review}>{busy === "review" ? <span className="spinner" /> : "Publier mon avis"}</button>
              </div>
            )}
          </section>
        )}

        {/* Annuler / signaler */}
        {(can("cancel") || can("dispute")) && (
          <section className="row" style={{ justifyContent: "flex-end" }}>
            {can("dispute") && !showDispute && <button className="btn btn-ghost btn-sm" onClick={() => setShowDispute(true)}><Icon name="alert" size={15} /> Signaler un problème</button>}
            {can("cancel") && !confirmCancel && <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(true)}>Annuler la réservation</button>}
            {confirmCancel && (
              <span className="row" style={{ gap: 8 }}>
                <span className="muted" style={{ fontSize: 14 }}>{b.payment?.status === "HELD" ? "Les fonds bloqués seront remboursés." : "Annuler cette réservation ?"}</span>
                <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => act("cancel")}>{busy === "cancel" ? <span className="spinner" /> : "Oui, annuler"}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>Non</button>
              </span>
            )}
            {showDispute && (
              <div className="stack" style={{ flexBasis: "100%" }}>
                <div className="field"><label htmlFor="reason">Que s&apos;est-il passé ?</label><textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Retard important, colis abîmé, destinataire injoignable…" /></div>
                <div className="row"><button className="btn btn-danger btn-sm" disabled={!!busy || reason.trim().length < 5} onClick={() => act("dispute")}>Signaler et garder les fonds bloqués</button><button className="btn btn-ghost btn-sm" onClick={() => setShowDispute(false)}>Retour</button></div>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="stack" style={{ gap: 20 }}>
        <section className="panel stack" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="avatar">{initials(b.other.name)}</div>
            <div>
              <div style={{ fontWeight: 650 }}>{b.other.name} <span className="muted" style={{ fontWeight: 400 }}>· {b.actor === "sender" ? "voyageur" : "expéditeur"}</span></div>
              <Stars rating={b.other.rating} count={b.other.ratingCount} />
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {b.other.phoneVerified && <span className="badge badge-ok"><Icon name="check" size={13} /> Tél. vérifié</span>}
            {b.other.deliveries > 0 && <span className="badge">{b.other.deliveries} livraison{b.other.deliveries > 1 ? "s" : ""}</span>}
            {b.other.demo && <span className="badge badge-warn">Compte démo</span>}
          </div>
          <div className="ledger">
            <div><span className="muted">Transport</span><b>{formatMoney(b.money.price, b.money.currency)}</b></div>
            <div><span className="muted">Frais de service</span><b>{formatMoney(b.money.fee, b.money.currency)}</b></div>
            <div className="total"><span>Total</span><b>{formatMoney(b.money.total, b.money.currency)}</b></div>
            {b.payment && <div><span className="muted">Paiement</span><span className={`badge ${b.payment.status === "RELEASED" ? "badge-ok" : b.payment.status === "REFUNDED" ? "" : "badge-gold"}`}>{{ HELD: "Bloqué", RELEASED: "Versé", REFUNDED: "Remboursé", PENDING: "En attente", FAILED: "Échec" }[b.payment.status] ?? b.payment.status}</span></div>}
          </div>
          <Link className="btn btn-ghost btn-sm" href={`/trajets/${b.trip.id}`}>Voir le trajet</Link>
        </section>
        <Chat bookingId={b.id} initial={b.messages} disabled={closed && b.status !== "DISPUTED"} />
      </aside>
    </div>
  );
}

function CodeEntry({ label, hint, cta, code, setCode, busy, shake, onSubmit }: { label: string; hint: string; cta: string; code: string; setCode: (v: string) => void; busy: boolean; shake: boolean; onSubmit: () => void }) {
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="code">{label}</label>
        <div className={`code-input ${shake ? "shake" : ""}`}>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="off" placeholder="••••••" style={{ letterSpacing: ".4em" }} />
        </div>
        <span className="hint">{hint}</span>
      </div>
      <button className="btn btn-ink" disabled={busy || code.length !== 6} onClick={onSubmit}>{busy ? <span className="spinner" /> : cta}</button>
    </div>
  );
}

function Chat({ bookingId, initial, disabled }: { bookingId: string; initial: BookingDetail["messages"]; disabled: boolean }) {
  const toast = useToast();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(initial[initial.length - 1]?.at);

  useEffect(() => { last.current = messages[messages.length - 1]?.at; box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await api<{ data: BookingDetail["messages"] }>(`/api/bookings/${bookingId}/messages${last.current ? `?after=${encodeURIComponent(last.current)}` : ""}`);
        if (r.data.length) setMessages((m) => [...m, ...r.data.filter((x) => !m.some((y) => y.id === x.id))]);
      } catch { /* silencieux : on réessaie au prochain tour */ }
    }, 8000);
    return () => clearInterval(t);
  }, [bookingId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await api<{ data: BookingDetail["messages"][number] }>(`/api/bookings/${bookingId}/messages`, { body: { body: text } });
      setMessages((m) => [...m, r.data]); setText("");
    } catch (err) { toast((err as Error).message, "error"); }
    setBusy(false);
  }

  return (
    <section className="panel stack" style={{ gap: 12 }}>
      <h3 style={{ fontSize: 18 }}>Messages</h3>
      <div className="chat" ref={box} aria-live="polite">
        {messages.length === 0 && <p className="muted" style={{ fontSize: 14 }}>Posez vos questions ici : contenu du colis, lieu de remise, horaires. Gardez les échanges dans l&apos;application, ils servent de preuve.</p>}
        {messages.map((m) => <div key={m.id} className={`bubble ${m.mine ? "mine" : ""}`}>{m.body}<small>{hhmm(m.at)}</small></div>)}
      </div>
      {!disabled && (
        <form className="row" style={{ flexWrap: "nowrap" }} onSubmit={send}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message" maxLength={1000} aria-label="Votre message" />
          <button className="btn btn-ink btn-sm" disabled={busy || !text.trim()} aria-label="Envoyer"><Icon name="send" size={16} /></button>
        </form>
      )}
    </section>
  );
}
