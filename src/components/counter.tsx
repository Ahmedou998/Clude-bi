"use client";
import { useEffect, useRef, useState } from "react";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Interpole doucement vers `target` (utilisé par le compteur et l'estimateur). */
export function useTween(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced()) { from.current = target; return; }
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = a + (target - a) * easeOut(t);
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return reduced() ? target : value;
}

/** Compte de 0 à `value` quand l'élément entre à l'écran. Sans JavaScript, la valeur finale reste affichée. */
export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    setShown(0);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setShown(Math.round(value * easeOut(t)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <strong ref={ref} className="num">{new Intl.NumberFormat("fr-FR").format(shown)}{suffix}</strong>;
}
