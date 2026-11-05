"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_CURRENCY, isCurrency, type CurrencyCode } from "@/lib/currency";
import { Icon } from "./icons";

type ToastKind = "info" | "ok" | "error";
type Toast = { id: number; kind: ToastKind; text: string };
const ToastContext = createContext<(text: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastContext);

const CurrencyContext = createContext<{ currency: CurrencyCode; setCurrency: (c: CurrencyCode) => void }>({ currency: DEFAULT_CURRENCY, setCurrency: () => {} });
export const useDisplayCurrency = () => useContext(CurrencyContext);

export function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tgp_currency");
      if (isCurrency(saved)) setCurrencyState(saved);
    } catch { /* stockage indisponible */ }
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try { localStorage.setItem("tgp_currency", c); } catch { /* ignoré */ }
  }, []);

  const push = useCallback((text: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
  }, []);

  const currencyValue = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return (
    <CurrencyContext.Provider value={currencyValue}>
      <ToastContext.Provider value={push}>
        {children}
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast" data-kind={t.kind}>
              <Icon name={t.kind === "error" ? "alert" : t.kind === "ok" ? "check" : "info"} size={18} />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </CurrencyContext.Provider>
  );
}
