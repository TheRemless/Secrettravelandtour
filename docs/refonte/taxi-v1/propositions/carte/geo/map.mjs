// Carte du sud : trait de côte Natural Earth 10m (world-atlas) + îles OSM du dépôt, projeté en SVG statique.
// Le tracé d'un trajet est un schéma (arc simple), pas l'itinéraire routier.
import { readFileSync } from "node:fs";

const here = (p) => new URL(p, import.meta.url);
const NE = JSON.parse(readFileSync(here("./south-ne10m.json")));
const OSM = JSON.parse(readFileSync(here("../../../../../../src/_includes/geo/osm-islands.json")));

// Lanta Yai et Lanta Noi sont trop grossières dans Natural Earth : on prend celles d'OSM.
const inLanta = (ring) => ring.every(([x, y]) => x > 98.95 && x < 99.2 && y > 7.4 && y < 7.75);
const RINGS = [
  ...NE.filter((r) => !inLanta(r)),
  ...Object.values(OSM).map((v) => v.geo.coordinates[0]),
];

// Lieux : coordonnées publiques (OpenStreetMap Nominatim, relevé du 10.11.2026 ; aéroport de Surat Thani et Khao Sok : Wikipedia).
// lab : position de l'étiquette, a = ancre, dx/dy en em.
export const PLACES = {
  "krabi-airport": { name: "Krabi Airport", code: "KBV", lon: 98.9851, lat: 8.0964, lab: { a: "start", dx: 0.55, dy: -0.15 } },
  "krabi-town": { name: "Krabi Town", lon: 98.9162, lat: 8.0635, lab: { a: "end", dx: -0.2, dy: -0.75 } },
  "ao-nang": { name: "Ao Nang", lon: 98.8219, lat: 8.0311, lab: { a: "end", dx: -0.55, dy: 0.35 } },
  "phuket-airport": { name: "Phuket Airport", code: "HKT", lon: 98.3058, lat: 8.1101, lab: { a: "end", dx: -0.55, dy: 0.35 } },
  phuket: { name: "Phuket", lon: 98.3922, lat: 7.8869, lab: { a: "end", dx: -0.55, dy: 0.35 } },
  "khao-lak": { name: "Khao Lak", lon: 98.25, lat: 8.66, lab: { a: "end", dx: -0.55, dy: 0.35 } },
  "khao-sok": { name: "Khao Sok", lon: 98.53, lat: 8.92, lab: { a: "end", dx: -0.55, dy: -0.2 } },
  "cheow-lan": { name: "Cheow Lan Pier", lon: 98.8058, lat: 8.9721, minor: true, lab: { a: "start", dx: 0.5, dy: 0.35 } },
  "surat-airport": { name: "Surat Thani Airport", code: "URT", lon: 99.1356, lat: 9.1326, lab: { a: "end", dx: -0.5, dy: -0.35 } },
  "surat-thani": { name: "Surat Thani", lon: 99.33, lat: 9.14, lab: { a: "start", dx: 0.15, dy: 1.15 } },
  donsak: { name: "Donsak Pier", lon: 99.6801, lat: 9.3382, lab: { a: "start", dx: 0.55, dy: 0.35 } },
  "koh-lanta": { name: "Koh Lanta", lon: 99.05, lat: 7.6, base: true, lab: { a: "start", dx: 0.75, dy: 0.4 } },
  trang: { name: "Trang", lon: 99.6045, lat: 7.5544, lab: { a: "start", dx: 0.55, dy: 0.35 } },
  "hat-yai": { name: "Hat Yai", lon: 100.469, lat: 7.0075, lab: { a: "end", dx: 0.3, dy: 1.3 } },
};

// Nom dans taxiRoutes.json → lieu de la carte.
export const PLACE_OF = {
  "Krabi Airport": "krabi-airport", "Krabi Town": "krabi-town", Krabi: "krabi-town", "Ao Nang": "ao-nang",
  "Phuket Airport": "phuket-airport", Phuket: "phuket", "Khao Lak": "khao-lak", "Khao Sok": "khao-sok",
  "Surat Thani Airport": "surat-airport", "Surat Thani": "surat-thani", "Donsak Pier": "donsak",
  "Koh Lanta": "koh-lanta", Trang: "trang", "Hat Yai": "hat-yai",
};

// Courbure de chaque arc (part de la longueur, signe = côté) : choisie pour que les 17 lignes ne se couvrent pas.
const BEND = {
  "krabi-airport-koh-lanta": 0.16, "phuket-airport-koh-lanta": 0.14, "surat-thani-koh-lanta": 0.1,
  "koh-lanta-krabi-town": 0.14, "koh-lanta-ao-nang": 0.13, "koh-lanta-khao-sok": 0.1, "koh-lanta-trang": 0.22,
  "koh-lanta-khao-lak": 0.12, "koh-lanta-donsak-pier": 0.1, "hat-yai-koh-lanta": 0.12,
  "krabi-airport-ao-nang": -0.4, "phuket-airport-khao-lak": -0.3, "krabi-khao-sok": -0.12, "phuket-khao-sok": 0.12,
  "surat-thani-khao-sok": 0.2, "phuket-airport-ao-nang": -0.2, "krabi-airport-khao-lak": -0.14,
};

const COS = Math.cos((8 * Math.PI) / 180);

export function makeView({ w, e, s, n }, width = 1000) {
  const k = width / ((e - w) * COS);
  const height = Math.round((n - s) * k);
  return { w, e, s, n, k, width, height, x: (lon) => (lon - w) * COS * k, y: (lat) => (n - lat) * k };
}

// Douglas-Peucker ; un anneau fermé est coupé en deux à son point le plus éloigné du premier.
function simplify(pts, tol) {
  const [fx, fy] = pts[0], [lx, ly] = pts[pts.length - 1];
  if (fx !== lx || fy !== ly) return dp(pts, tol);
  let far = 1, max = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.hypot(pts[i][0] - fx, pts[i][1] - fy); if (d > max) { max = d; far = i; } }
  return [...dp(pts.slice(0, far + 1), tol), ...dp(pts.slice(far), tol).slice(1, -1)];
}

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const r1 = (v) => Math.round(v * 10) / 10;

export function landPath(v, tol = 1) {
  const pad = 0.6;
  let d = "";
  for (const ring of RINGS) {
    if (ring.every(([x]) => x < v.w - pad) || ring.every(([x]) => x > v.e + pad) || ring.every(([, y]) => y < v.s - pad) || ring.every(([, y]) => y > v.n + pad)) continue;
    const pts = simplify(ring.map(([lon, lat]) => [v.x(lon), v.y(lat)]), tol);
    if (pts.length < 3) continue;
    d += "M" + pts.map(([x, y]) => r1(x) + " " + r1(y)).join("L") + "Z";
  }
  return d;
}

export function arc(v, route) {
  // Les trajets de Koh Lanta partent tous de l'île et tournent du même côté : un éventail, pas une pelote.
  const lanta = route.to === "Koh Lanta";
  const A = PLACES[PLACE_OF[lanta ? route.to : route.from]], B = PLACES[PLACE_OF[lanta ? route.from : route.to]];
  const ax = v.x(A.lon), ay = v.y(A.lat), bx = v.x(B.lon), by = v.y(B.lat);
  const mx = (ax + bx) / 2, my = (ay + by) / 2, len = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / len, ny = (bx - ax) / len, bend = BEND[route.id] ?? 0.15;
  const cx = mx + nx * len * bend, cy = my + ny * len * bend;
  // Point au milieu de la courbe et normale, pour poser la durée le long de la ligne.
  const px = 0.25 * ax + 0.5 * cx + 0.25 * bx, py = 0.25 * ay + 0.5 * cy + 0.25 * by;
  return {
    d: `M${r1(ax)} ${r1(ay)}Q${r1(cx)} ${r1(cy)} ${r1(bx)} ${r1(by)}`,
    mid: [px, py], normal: [nx * Math.sign(bend || 1), ny * Math.sign(bend || 1)], len,
  };
}

// Cadre resserré sur un trajet : les deux bouts, une marge, un rapport largeur/hauteur fixe.
export function routeBox(route, ratio = 1.1) {
  const A = PLACES[PLACE_OF[route.from]], B = PLACES[PLACE_OF[route.to]];
  let w = Math.min(A.lon, B.lon), e = Math.max(A.lon, B.lon), s = Math.min(A.lat, B.lat), n = Math.max(A.lat, B.lat);
  const span = Math.max((e - w) * COS, n - s, 0.5);
  const padX = span * 0.42, padY = span * 0.36;
  let cx = (w + e) / 2, cy = (s + n) / 2;
  let halfW = ((e - w) * COS) / 2 + padX, halfH = (n - s) / 2 + padY;
  if (halfW / halfH < ratio) halfW = halfH * ratio; else halfH = halfW / ratio;
  return { w: cx - halfW / COS, e: cx + halfW / COS, s: cy - halfH, n: cy + halfH };
}

export const SEAS = [
  { name: "Andaman Sea", lon: 98.2, lat: 7.25, size: 1.2 },
  { name: "Gulf of Thailand", lon: 100.18, lat: 9.44, size: 1.0 },
];
