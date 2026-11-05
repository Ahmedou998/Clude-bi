"use client";

import { Icon } from "./icons";

export function PrintContractButton() {
  return <button className="btn btn-ink" onClick={() => window.print()}><Icon name="download" size={16} /> Imprimer / enregistrer en PDF</button>;
}