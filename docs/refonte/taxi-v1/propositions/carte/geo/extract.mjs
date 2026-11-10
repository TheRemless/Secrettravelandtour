// Extrait le trait de côte Natural Earth 10m (paquet world-atlas) sur le sud de la Thaïlande.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
const topo = JSON.parse(readFileSync(new URL("./node_modules/world-atlas/land-10m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);
const B = { w: 97.4, e: 101.2, s: 6.2, n: 10.1 };
function clip(ring) {
  const edges = [
    [p => p[0] >= B.w, (a, b) => inter(a, b, 0, B.w)],
    [p => p[0] <= B.e, (a, b) => inter(a, b, 0, B.e)],
    [p => p[1] >= B.s, (a, b) => inter(a, b, 1, B.s)],
    [p => p[1] <= B.n, (a, b) => inter(a, b, 1, B.n)],
  ];
  let out = ring;
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    if (!inp.length) break;
    let prev = inp[inp.length - 1];
    for (const cur of inp) {
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
      prev = cur;
    }
  }
  return out;
}
function inter(a, b, axis, v) {
  const t = (v - a[axis]) / (b[axis] - a[axis]);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}
const rings = [];
const geoms = land.features.flatMap(f => f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]);
for (const poly of geoms) for (const ring of poly) {
  const c = clip(ring);
  if (c.length > 3) rings.push(c.map(p => [+p[0].toFixed(4), +p[1].toFixed(4)]));
}
writeFileSync(new URL("./south-ne10m.json", import.meta.url), JSON.stringify(rings));
console.log(rings.length, "anneaux", rings.map(r => r.length).join(","));
