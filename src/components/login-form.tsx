"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Icon } from "./icons";
import { useToast } from "./providers";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"id" | "code">("id");
  const [identifier, setIdentifier] = useState("");
  const [masked, setMasked] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [fullName, setFullName] = useState("");
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await api<{ masked: string; demoCode?: string }>("/api/auth/request", { body: { identifier } });
      setMasked(r.masked); setDemoCode(r.demoCode); setStep("code");
      setTimeout(() => inputs.current[0]?.focus(), 80);
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  }

  async function verify(code: string) {
    setBusy(true); setError("");
    try {
      await api("/api/auth/verify", { body: { identifier, code, fullName: fullName || undefined } });
      toast("Connexion réussie.", "ok");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setShake(true); setTimeout(() => setShake(false), 450);
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
    }
    setBusy(false);
  }

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) { // collage du code complet
      const next = clean.slice(0, 6).split("");
      setDigits([...next, ...Array(6 - next.length).fill("")]);
      if (next.length === 6) verify(next.join(""));
      else inputs.current[next.length]?.focus();
      return;
    }
    const copy = [...digits]; copy[i] = clean; setDigits(copy);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
    if (copy.every(Boolean)) verify(copy.join(""));
  }

  if (step === "id") {
    return (
      <form className="stack" onSubmit={requestCode}>
        <div className="field">
          <label htmlFor="identifier">Numéro de téléphone ou e-mail</label>
          <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="+221 77 123 45 67" autoComplete="username" inputMode="email" required />
          <span className="hint">Format international pour l&apos;étranger. Au Sénégal, 77 123 45 67 suffit.</span>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-ink btn-block" disabled={busy || identifier.trim().length < 3}>{busy ? <span className="spinner" /> : <>Recevoir mon code <Icon name="arrow-right" size={18} /></>}</button>
      </form>
    );
  }

  return (
    <div className="stack">
      <p>Code envoyé à <b>{masked}</b>. Il est valable 10 minutes.</p>
      {demoCode && (
        <div className="form-note">
          <b>Mode démonstration :</b> aucun message n&apos;est envoyé. Votre code est <b className="num">{demoCode}</b>.{" "}
          <button type="button" className="btn btn-sm btn-ink" style={{ marginLeft: 6 }} onClick={() => { setDigits(demoCode.split("")); verify(demoCode); }}>Remplir</button>
        </div>
      )}
      <div className={`code-input ${shake ? "shake" : ""}`} role="group" aria-label="Code à 6 chiffres">
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { inputs.current[i] = el; }} value={d} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6} aria-label={`Chiffre ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus(); }} />
        ))}
      </div>
      <div className="field">
        <label htmlFor="fullName">Votre nom (première connexion uniquement)</label>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prénom Nom" autoComplete="name" />
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="row">
        <button className="btn btn-ink" disabled={busy || digits.some((d) => !d)} onClick={() => verify(digits.join(""))}>{busy ? <span className="spinner" /> : "Valider"}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setStep("id"); setError(""); setDigits(Array(6).fill("")); }}>Changer de numéro</button>
        <button className="btn btn-ghost btn-sm" onClick={() => requestCode()} disabled={busy}>Renvoyer le code</button>
      </div>
    </div>
  );
}
