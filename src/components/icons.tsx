import type { SVGProps } from "react";

const PATHS = {
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-up-right": "M7 17 17 7M8 7h9v9",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z",
  shield: "M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3zM9 12l2.2 2.2L15.5 10",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  wallet: "M4 7a2 2 0 0 1 2-2h11v3M4 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6a2 2 0 0 1-2-2zM16 13.5h.01",
  pin: "M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10zM12 11.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5",
  swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
  weight: "M6.5 8h11l2 11h-15l2-11zM12 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  package: "M12 3 4 7v10l8 4 8-4V7l-8-4zM4 7l8 4 8-4M12 11v10",
  plane: "M3 13l18-8-6 15-3-6-9-1zM12 14l9-9",
  key: "M14.5 9.5a4 4 0 1 1-1 2.6L4 21v-3l2-.5V15l2.5-.5L13 10",
  message: "M4 5h16v11H9l-5 4V5z",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8L12 3.5z",
  send: "M4 12l16-8-6 16-2.5-6.5L4 12z",
  phone: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  logout: "M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9",
  calendar: "M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4",
  alert: "M12 4 3 20h18L12 4zM12 10v5M12 17.5h.01",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  // Un colis dont le ruban dessine un arc de voyage.
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#f2b134" />
      <path d="M8 26c3-10 13-14 24-9" fill="none" stroke="#0b2536" strokeWidth="3" strokeLinecap="round" />
      <circle cx="8.5" cy="26" r="3.2" fill="#0b2536" />
      <circle cx="32" cy="17" r="3.2" fill="#fff" stroke="#b3213f" strokeWidth="2.4" />
    </svg>
  );
}
