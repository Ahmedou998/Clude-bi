import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Teranga GP",
    short_name: "Teranga GP",
    description: "Le colis voyage avec vous. Afrique ↔ Europe.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b2536",
    theme_color: "#0b2536",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
