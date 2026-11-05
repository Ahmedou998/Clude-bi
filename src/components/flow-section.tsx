"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { quote } from "@/lib/matching";

const STEPS = [
  { title: "Vous décrivez votre colis", text: "Contenu, poids, destinataire. Vous déclarez qu'il ne contient rien d'interdit." },
  { title: "Un voyageur accepte", text: "Le prix au kilo est affiché d'avance et la place est réservée. Aucune surprise sur le montant." },
  { title: "Vous payez, l'argent est bloqué", text: "Le voyageur sait qu'il sera payé. Vous savez qu'il ne touche rien avant la livraison." },
  { title: "Vous remettez le colis avec un code", text: "Le voyageur saisit votre code de remise. Le colis est suivi à partir de cet instant." },
  { title: "Le destinataire donne son code", text: "À l'arrivée, son code libère le paiement. Le voyageur est payé, vous pouvez le noter." },
];

const EXAMPLE = quote(9, 4); // 4 kg à 9 €/kg

function Screen({ step }: { step: number }) {
  if (step === 0) return (
    <div className="phone-screen" key={0}>
      <span className="badge">Demande envoyée</span>
      <div><div className="label">Paris → Dakar</div><div style={{ fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 700 }}>2 cartons de vêtements</div></div>
      <div className="ledger"><div><span className="muted">Poids</span><b>4 kg</b></div><div><span className="muted">Destinataire</span><b>Awa N.</b></div><div><span className="muted">Objets interdits</span><b style={{ color: "var(--baobab)" }}>Déclaré absent</b></div></div>
    </div>
  );
  if (step === 1) return (
    <div className="phone-screen" key={1}>
      <span className="badge badge-ok"><Icon name="check" size={13} /> Voyageur accepté</span>
      <div className="ledger">
        <div><span className="muted">4 kg × 9 €</span><b>{EXAMPLE.price} €</b></div>
        <div><span className="muted">Frais de service 8 %</span><b>{EXAMPLE.fee} €</b></div>
        <div className="total"><span>Vous payez</span><b>{EXAMPLE.total} €</b></div>
      </div>
      <small className="muted">Prix figé dès l&apos;accord.</small>
    </div>
  );
  if (step === 2) return (
    <div className="phone-screen" key={2} style={{ justifyItems: "start" }}>
      <div className="lock-pulse"><Icon name="lock" size={28} /></div>
      <div style={{ fontSize: 22, fontFamily: "var(--font-display)", fontWeight: 700 }}>{EXAMPLE.total} € bloqués</div>
      <p className="muted" style={{ fontSize: 14.5 }}>Personne n&apos;y touche : ni le voyageur, ni nous. L&apos;argent attend la livraison.</p>
    </div>
  );
  if (step === 3) return (
    <div className="phone-screen" key={3}>
      <span className="badge badge-gold">Code de remise</span>
      <div className="code-digits">{"482917".split("").map((d, i) => <span key={i}>{d}</span>)}</div>
      <p className="muted" style={{ fontSize: 14.5 }}>Donnez ce code au voyageur quand vous lui remettez le colis. Il ne sert qu&apos;une fois.</p>
    </div>
  );
  return (
    <div className="phone-screen" key={4}>
      <span className="badge badge-ok"><Icon name="check" size={13} /> Livré</span>
      <div className="code-digits">{"650318".split("").map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="ledger"><div><span className="muted">Versé au voyageur</span><b>{EXAMPLE.price} €</b></div></div>
    </div>
  );
}

export function FlowSection() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }, { rootMargin: "-42% 0px -48% 0px" });
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="container flow">
      <div className="flow-steps">
        <div className="flow-rail" aria-hidden="true"><i style={{ ["--p" as string]: `${((active + 0.5) / STEPS.length) * 100}%` }} /></div>
        {STEPS.map((s, i) => (
          <div key={s.title} ref={(el) => { refs.current[i] = el; }} data-i={i} className="flow-step" data-on={i <= active}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      <div className="flow-sticky" aria-hidden="true">
        <div className="phone">
          <div className="phone-top"><span>Réservation</span><span>Exemple illustratif</span></div>
          <Screen step={active} />
        </div>
      </div>
    </div>
  );
}
