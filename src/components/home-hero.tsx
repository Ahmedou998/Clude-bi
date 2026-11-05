"use client";
import Link from "next/link";
import { useState } from "react";
import { HERO_CORRIDORS } from "@/lib/catalog";
import { HeroMap } from "./hero-map";
import { CityList } from "./place-input";
import { Icon } from "./icons";

export function HomeHero() {
  const [active, setActive] = useState(0);
  const [from, setFrom] = useState<string>(HERO_CORRIDORS[0].fromLabel);
  const [to, setTo] = useState<string>(HERO_CORRIDORS[0].toLabel);

  function select(i: number) {
    setActive(i);
    setFrom(HERO_CORRIDORS[i].fromLabel);
    setTo(HERO_CORRIDORS[i].toLabel);
  }
  function swap() {
    setFrom(to);
    setTo(from);
    const reversed = HERO_CORRIDORS.findIndex((c) => c.fromLabel === to && c.toLabel === from);
    if (reversed >= 0) setActive(reversed);
  }

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <h1 aria-label="Le colis voyage avec vous.">
            <span className="mask" aria-hidden="true"><span className="line">Le colis</span></span>
            <span className="mask" aria-hidden="true"><span className="line">voyage</span></span>
            <span className="mask" aria-hidden="true"><span className="line">avec vous.</span></span>
          </h1>
          <p className="hero-sub">Envoyez un colis ou rentabilisez votre bagage entre l&apos;Afrique et l&apos;Europe. L&apos;argent reste bloqué jusqu&apos;à ce que le destinataire donne son code.</p>

          <form className="search-card" action="/trajets" method="get">
            <CityList />
            <div className="search-row">
              <div className="field"><label htmlFor="h-from">Départ</label><input id="h-from" name="origin" list="cities" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Ville, pays" autoComplete="off" /></div>
              <button type="button" className="swap" onClick={swap} aria-label="Inverser départ et destination"><Icon name="swap" size={18} /></button>
              <div className="field"><label htmlFor="h-to">Destination</label><input id="h-to" name="destination" list="cities" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Ville, pays" autoComplete="off" /></div>
            </div>
            <div className="search-foot">
              <div className="field"><label htmlFor="h-kg">Poids du colis (kg)</label><input id="h-kg" name="minKg" type="number" inputMode="decimal" min="0.5" max="50" step="0.5" placeholder="Facultatif" /></div>
              <button className="btn btn-gold" type="submit">Trouver un voyageur <Icon name="arrow-right" size={18} /></button>
            </div>
          </form>

          <div className="corridor-chips" role="group" aria-label="Liaisons populaires">
            {HERO_CORRIDORS.map((c, i) => (
              <button key={c.from + c.to} type="button" className="chip" aria-pressed={i === active} onClick={() => select(i)}>
                {c.fromLabel.split(",")[0]} → {c.toLabel.split(",")[0]}
              </button>
            ))}
          </div>
          <p style={{ marginTop: 22, color: "#b8cbd5", fontSize: 15, animation: "fade .9s .9s var(--ease) both" }}>
            Vous voyagez bientôt ? <Link href="/publier/trajet" style={{ color: "var(--gold)", fontWeight: 650, textDecoration: "underline", textUnderlineOffset: 4 }}>Publiez votre trajet</Link> et choisissez votre prix au kilo.
          </p>
        </div>
        <HeroMap active={active} onSelect={select} />
      </div>
      <div className="hero-wave" aria-hidden="true" />
    </section>
  );
}
