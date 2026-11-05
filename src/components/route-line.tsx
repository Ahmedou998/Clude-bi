/** Tracé d'un voyage : se dessine et fait avancer un avion au survol de la carte parente (.card-lift). */
export function RouteLine() {
  return (
    <svg viewBox="0 0 120 22" preserveAspectRatio="none" aria-hidden="true">
      <path className="route-line" d="M6 11H114" pathLength={1} style={{ strokeDasharray: "3 5" }} />
      <path className="route-line-fill" d="M6 11H114" pathLength={1} />
      <circle className="dot" cx="6" cy="11" r="4" />
      <circle className="dot-end" cx="114" cy="11" r="4" />
      <g className="plane" style={{ ["--run" as string]: "88px" }}>
        <path d="M6 5l8 6-8 6 2-6z" fill="#b3213f" />
      </g>
    </svg>
  );
}
