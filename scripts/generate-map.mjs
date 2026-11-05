// Génère src/lib/map-data.ts : carte Afrique–Europe en points (aucune dépendance).
// Les contours sont volontairement simplifiés : ils servent à rastériser une carte « dot matrix ».
// Usage : node scripts/generate-map.mjs
import { writeFileSync } from "node:fs";

const BOX = { lon0: -22, lon1: 30, lat0: -2, lat1: 54 };
const W = 520;

const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const y0 = merc(BOX.lat0), y1 = merc(BOX.lat1);
const H = Math.round((W * (y1 - y0)) / (((BOX.lon1 - BOX.lon0) * Math.PI) / 180));
const project = (lon, lat) => [
  ((lon - BOX.lon0) / (BOX.lon1 - BOX.lon0)) * W,
  H - ((merc(lat) - y0) / (y1 - y0)) * H,
];

const africa = [[-5.9,35.8],[-2.2,35.1],[-0.6,35.8],[3.0,36.8],[8.0,37.0],[10.2,37.3],[11.1,37.0],[10.5,36.0],[10.1,34.0],[11.2,33.2],[13.0,32.9],[15.2,32.3],[17.5,31.0],[19.0,30.3],[20.1,32.2],[22.0,32.9],[25.1,31.6],[29.0,30.9],[32.3,31.3],[34.2,31.3],[34.9,29.5],[32.6,29.9],[34.0,27.8],[35.5,24.0],[37.2,21.0],[38.5,18.0],[40.0,15.5],[42.7,13.0],[43.3,11.8],[51.2,11.8],[48.5,8.0],[47.0,5.0],[44.0,1.5],[42.0,-1.0],[40.0,-4.0],[40.6,-10.0],[13.2,-10.0],[12.5,-6.0],[9.0,-1.5],[9.3,0.4],[9.4,2.0],[9.7,4.0],[8.5,4.6],[6.0,4.3],[3.4,6.4],[1.2,6.1],[-0.2,5.5],[-4.0,5.2],[-7.5,4.4],[-10.8,6.3],[-13.2,8.5],[-13.7,9.5],[-15.0,10.9],[-16.8,12.3],[-16.7,13.5],[-17.5,14.7],[-16.5,16.0],[-16.2,18.1],[-16.5,19.5],[-17.0,20.8],[-16.3,23.0],[-14.5,26.1],[-13.2,27.7],[-10.2,29.0],[-9.6,30.4],[-9.8,31.5],[-8.5,33.2],[-6.8,34.0],[-5.9,35.8]];

const eurasia = [[-5.4,36.1],[-6.3,36.5],[-7.4,37.2],[-8.9,37.0],[-8.9,38.4],[-9.5,38.7],[-8.9,40.2],[-8.8,41.9],[-9.3,43.0],[-8.0,43.7],[-5.0,43.5],[-1.8,43.4],[-1.2,45.5],[-1.2,46.2],[-2.3,47.2],[-4.5,47.8],[-4.8,48.4],[-3.0,48.8],[-1.6,48.7],[-1.9,49.7],[-1.3,49.7],[0.1,49.5],[1.6,50.9],[3.3,51.4],[4.2,52.0],[4.8,53.0],[7.0,53.5],[7.0,56.0],[44.0,56.0],[44.0,16.0],[42.0,16.0],[39.1,21.5],[36.5,26.0],[35.0,29.4],[34.3,31.3],[35.1,33.0],[35.9,34.5],[36.0,36.0],[35.8,36.8],[34.5,36.7],[32.5,36.1],[30.5,36.6],[29.0,36.6],[27.3,37.0],[26.3,38.3],[26.8,39.5],[26.2,40.0],[26.0,40.7],[24.5,40.9],[23.7,40.5],[22.9,40.5],[22.6,39.5],[24.0,38.0],[23.9,37.9],[23.2,36.5],[22.5,36.4],[21.6,36.9],[21.1,38.0],[21.0,39.2],[19.4,40.4],[19.5,41.8],[18.5,42.4],[16.0,43.5],[14.0,45.0],[13.7,45.6],[12.3,45.4],[12.4,44.2],[13.6,43.6],[14.0,42.5],[16.2,41.9],[18.5,40.1],[17.0,39.0],[16.0,38.0],[15.7,37.9],[16.0,39.3],[15.5,40.0],[14.0,40.8],[12.3,41.5],[10.5,42.9],[9.0,44.4],[7.5,43.8],[6.0,43.1],[4.8,43.4],[3.2,43.2],[3.1,42.4],[3.2,41.8],[2.2,41.4],[0.9,41.0],[-0.3,39.5],[0.2,38.8],[-0.7,37.6],[-2.1,36.8],[-4.4,36.7]];

const blackSea = [[27.9,43.2],[28.7,44.5],[29.7,45.2],[30.5,46.5],[31.8,46.4],[33.5,45.0],[33.5,44.5],[35.0,45.0],[36.5,45.3],[37.5,44.7],[38.0,44.3],[39.7,43.4],[41.6,41.6],[39.7,41.0],[36.3,41.3],[33.5,42.0],[31.2,41.1],[29.0,41.2],[28.0,42.0]];

const britain = [[-5.7,50.1],[-3.5,50.3],[-1.0,50.7],[1.4,51.2],[1.7,52.7],[0.3,53.5],[-0.2,54.5],[-1.6,55.6],[-2.0,56.0],[-3.0,56.0],[-4.5,55.0],[-3.0,54.2],[-3.1,53.3],[-4.5,52.8],[-4.2,52.0],[-5.2,51.7],[-3.3,51.4],[-4.2,51.1],[-5.7,50.1]];
const ireland = [[-10.0,51.8],[-8.0,51.6],[-6.0,52.2],[-6.1,54.0],[-5.8,55.0],[-7.5,55.2],[-9.8,54.0],[-10.0,51.8]];
const sicily = [[12.4,37.8],[15.6,38.2],[15.2,36.7],[12.5,37.6]];
const sardinia = [[8.2,41.0],[9.7,41.1],[9.6,39.2],[8.5,39.0]];
const corsica = [[8.6,42.5],[9.5,43.0],[9.5,41.4],[8.8,41.6]];
const canaries = [[-18.0,28.8],[-13.5,29.0],[-13.5,27.8],[-18.0,27.7]];
const land = [africa, eurasia, britain, ireland, sicily, sardinia, corsica, canaries];
const water = [blackSea];

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const isLand = (lon, lat) => land.some((p) => inside(p, lon, lat)) && !water.some((p) => inside(p, lon, lat));

// Grille en quinconce, pas constant en pixels (donc points réguliers à l'écran).
const STEP = 7.2;
let d = "";
let count = 0;
for (let row = 0, py = 4; py < H - 2; row++, py += STEP * 0.866) {
  for (let px = 4 + (row % 2 ? STEP / 2 : 0); px < W - 2; px += STEP) {
    const lon = BOX.lon0 + (px / W) * (BOX.lon1 - BOX.lon0);
    const my = y0 + ((H - py) / H) * (y1 - y0);
    const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * (180 / Math.PI);
    if (isLand(lon, lat)) { d += `M${px.toFixed(1)} ${py.toFixed(1)}h0`; count++; }
  }
}

const cities = {
  dakar: ["Dakar", -17.4, 14.7], abidjan: ["Abidjan", -4.0, 5.3], casablanca: ["Casablanca", -7.6, 33.6],
  accra: ["Accra", -0.2, 5.6], tunis: ["Tunis", 10.2, 36.8], bamako: ["Bamako", -8.0, 12.6],
  paris: ["Paris", 2.35, 48.85], lisbonne: ["Lisbonne", -9.1, 38.7], madrid: ["Madrid", -3.7, 40.4],
  lyon: ["Lyon", 4.8, 45.8], bruxelles: ["Bruxelles", 4.35, 50.85], milan: ["Milan", 9.2, 45.5],
  marseille: ["Marseille", 5.4, 43.3], alger: ["Alger", 3.06, 36.75],
};
const out = {};
for (const [id, [name, lon, lat]] of Object.entries(cities)) {
  const [x, y] = project(lon, lat);
  out[id] = { id, name, x: +x.toFixed(1), y: +y.toFixed(1) };
}

const ts = `// Fichier généré par scripts/generate-map.mjs — ne pas modifier à la main.
export const MAP_W = ${W};
export const MAP_H = ${H};
export const LAND_PATH = ${JSON.stringify(d)};
export const MAP_CITIES = ${JSON.stringify(out, null, 2)} as const;
export type CityId = keyof typeof MAP_CITIES;
`;
writeFileSync(new URL("../src/lib/map-data.ts", import.meta.url), ts);
console.log(`Carte générée : ${W}x${H}, ${count} points`);
