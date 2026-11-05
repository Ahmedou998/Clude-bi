"use client";
import { useState } from "react";
import { Icon } from "./icons";

const GROUPS = [
  { id: "send", label: "J'envoie un colis", items: [
    { q: "Comment connaître le voyageur ?", a: "Son téléphone est vérifié par un code, et vous voyez son nombre de livraisons et ses avis. Vous pouvez lui écrire dans l'application avant de décider. La vérification d'identité par pièce justificative est prévue avec un partenaire ; elle n'est pas encore active." },
    { q: "Et si le colis disparaît ?", a: "Le voyageur n'est payé qu'avec le code du destinataire. Si le colis n'arrive pas, vous signalez un problème : l'argent reste bloqué pendant que le support examine la situation. Il n'y a pas d'assurance dans cette version, donc évitez les objets de grande valeur." },
    { q: "Le colis peut-il être ouvert ?", a: "Le voyageur a le droit de voir le contenu avant d'accepter. Photographiez le colis scellé à la remise et gardez les photos : les messages de la réservation font office de trace." },
    { q: "Le prix peut-il changer ?", a: "Non. Le prix est calculé à la demande (prix au kilo × poids, plus 8 % de frais de service) et figure sur la réservation. Vous payez ce montant, pas un euro de plus." },
    { q: "Pourquoi ne pas tout faire sur WhatsApp ?", a: "Sur WhatsApp, rien ne prouve ce qui a été convenu et l'argent circule sans protection. Ici, le paiement est bloqué, deux codes datent la remise et la livraison, et le support peut intervenir." },
  ] },
  { id: "travel", label: "Je voyage", items: [
    { q: "Quand suis-je payé ?", a: "À l'arrivée. Dès que le destinataire vous donne son code, les fonds bloqués vous sont versés. Vous pouvez voir qu'ils sont réservés avant même de partir." },
    { q: "Que contient le colis ?", a: "L'expéditeur le décrit et déclare par écrit qu'il ne contient rien d'interdit. Vous pouvez demander à voir le contenu, et refuser sans vous justifier avant la remise." },
    { q: "Et si le colis est interdit ?", a: "Refusez-le. Avant la remise, vous pouvez annuler la réservation : l'expéditeur est remboursé. La liste des objets interdits se trouve sur la page Règles et sécurité." },
    { q: "Qui répond en cas de dommage ?", a: "Il n'y a pas d'assurance dans cette version. Photographiez le colis à la remise et ne prenez que ce que vous pouvez transporter l'esprit tranquille." },
    { q: "Le destinataire est absent ?", a: "Écrivez dans la réservation pour convenir d'une nouvelle heure. Les fonds restent bloqués tant que la livraison n'est pas confirmée." },
  ] },
  { id: "receive", label: "Je reçois un colis", items: [
    { q: "Comment prouver que j'ai reçu le colis ?", a: "L'expéditeur vous communique un code à 6 chiffres. Vous le donnez au voyageur à la livraison. Il ne fonctionne qu'une fois et la livraison est horodatée." },
    { q: "Dois-je payer quelque chose ?", a: "Non. Le paiement est fait par l'expéditeur, avant le départ." },
    { q: "Mes données sont-elles protégées ?", a: "Votre nom et votre numéro ne sont visibles que de l'expéditeur et du voyageur dont le colis est payé. Nous ne les utilisons pas pour autre chose." },
  ] },
] as const;

export function FaqTabs() {
  const [tab, setTab] = useState<string>(GROUPS[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const group = GROUPS.find((g) => g.id === tab) ?? GROUPS[0];
  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Questions par profil">
        {GROUPS.map((g) => (
          <button key={g.id} role="tab" id={`tab-${g.id}`} aria-selected={tab === g.id} aria-controls="faq-panel" className="tab" onClick={() => { setTab(g.id); setOpen(null); }}>{g.label}</button>
        ))}
      </div>
      <div className="faq" role="tabpanel" id="faq-panel" aria-labelledby={`tab-${tab}`}>
        {group.items.map((item) => {
          const key = `${group.id}:${item.q}`;
          const isOpen = open === key;
          return (
            <div className="faq-item" key={key}>
              <button className="faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}>
                {item.q}<Icon name="plus" size={22} />
              </button>
              <div className="faq-a" data-open={isOpen}><div><p>{item.a}</p></div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
