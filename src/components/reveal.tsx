"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Apparition à l'entrée dans l'écran. À réserver aux blocs d'information, pas à chaque carte. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} data-in={on} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
