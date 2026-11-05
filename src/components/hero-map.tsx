"use client";
import { useEffect, useMemo, useRef } from "react";
import { LAND_PATH, MAP_CITIES, MAP_H, MAP_W } from "@/lib/map-data";
import { HERO_CORRIDORS } from "@/lib/catalog";

type Pt = { x: number; y: number };
function arc(a: Pt, b: Pt): string {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (ny > 0) { nx = -nx; ny = -ny; } // l'arc se courbe toujours vers le nord, comme un vol
  const lift = len * 0.3;
  return `M${a.x} ${a.y}Q${(mx + nx * lift).toFixed(1)} ${(my + ny * lift).toFixed(1)} ${b.x} ${b.y}`;
}

const LEG_MS = 4200;
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/** Carte en points Afrique–Europe. Les arcs se dessinent à l'arrivée, le colis fait des allers-retours sur la liaison choisie. */
export function HeroMap({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const parcel = useRef<SVGGElement>(null);

  const corridors = useMemo(
    () => HERO_CORRIDORS.map((c) => ({ ...c, a: MAP_CITIES[c.from], b: MAP_CITIES[c.to] })).map((c) => ({ ...c, d: arc(c.a, c.b) })),
    [],
  );
  const cityIds = useMemo(() => [...new Set(HERO_CORRIDORS.flatMap((c) => [c.from, c.to]))], []);
  const activeCorridor = corridors[active];

  useEffect(() => {
    const el = pathRefs.current[active];
    const g = parcel.current;
    if (!el || !g) return;
    const length = el.getTotalLength();
    const place = (k: number) => {
      const p = el.getPointAtLength(ease(k) * length);
      g.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { place(0.5); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) % (LEG_MS * 2)) / LEG_MS;
      place(t < 1 ? t : 2 - t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className="hero-map">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label={`Carte Afrique–Europe. Liaison affichée : ${activeCorridor.fromLabel} vers ${activeCorridor.toLabel}.`}>
        <path className="map-land" d={LAND_PATH} />
        {corridors.map((c, i) => (
          <g key={c.from + c.to}>
            <path
              ref={(el) => { pathRefs.current[i] = el; }}
              className="map-arc"
              d={c.d}
              pathLength={1}
              data-active={i === active}
              style={{ animationDelay: `${0.7 + i * 0.28}s` }}
            />
            <path className="map-hit" d={c.d} onClick={() => onSelect(i)} />
          </g>
        ))}
        {cityIds.map((id) => {
          const c = MAP_CITIES[id];
          const on = id === activeCorridor.from || id === activeCorridor.to;
          const left = c.x > MAP_W * 0.55;
          return (
            <g key={id} className="map-city" data-active={on}>
              <circle className="ring" cx={c.x} cy={c.y} r={5} />
              <circle className="core" cx={c.x} cy={c.y} r={on ? 5 : 3} fillOpacity={on ? 1 : 0.7} />
              <text x={left ? c.x - 9 : c.x + 9} y={c.y + 4} textAnchor={left ? "end" : "start"}>{c.name}</text>
            </g>
          );
        })}
        <g ref={parcel}>
          <g className="map-parcel">
            <circle r="10" fill="#f2b134" opacity=".22" />
            <rect x="-5" y="-5" width="10" height="10" rx="2.5" fill="#b3213f" stroke="#fff" strokeWidth="1.6" />
            <path d="M-5 0H5M0 -5V5" stroke="#fff" strokeWidth="1" opacity=".8" />
          </g>
        </g>
      </svg>
    </div>
  );
}
