"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Icon } from "./icons";
import { useToast } from "./providers";

/** Suppression en deux temps (clic puis confirmation) via un appel DELETE. */
export function DeleteButton({ url, label, done }: { url: string; label: string; done: string }) {
  const router = useRouter();
  const toast = useToast();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { await api(url, { method: "DELETE" }); toast(done, "ok"); router.refresh(); }
    catch (e) { toast((e as Error).message, "error"); setBusy(false); setArmed(false); }
  }
  return armed ? (
    <span className="row" style={{ gap: 6 }}>
      <button className="btn btn-danger btn-sm" onClick={go} disabled={busy}>{busy ? <span className="spinner" /> : "Confirmer"}</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setArmed(false)}>Garder</button>
    </span>
  ) : (
    <button className="btn btn-ghost btn-sm" onClick={() => setArmed(true)}><Icon name="trash" size={15} /> {label}</button>
  );
}
