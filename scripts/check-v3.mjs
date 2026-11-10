// Critères vérifiables du design (v3, repris pour la v4) sur _site : couleurs, rayons, polices,
// photos (un usage, aucun aplat), défilement horizontal, mots interdits, points d'exclamation, textes provisoires.
// v4 (08.11.2026) : les feuilles lues sont tokens.css, v4.css et booking.css (v3.css supprimée) ; les rayons
// acceptent aussi les jetons --r (12 px) et --r-btn (14 px) ; overflow-x: auto est permis dans v4.css pour les
// trois défilements horizontaux internes (rail des activités, ruban de dates, galerie sur mobile) et nulle part
// ailleurs. Palette, polices, mots et faits : règles inchangées.
import fs from "node:fs";
const CSS = ["css/tokens.css", "css/v4.css", "css/booking.css"].map((f) => [f, fs.readFileSync("_site/" + f, "utf8")]);
// Pages produit v4 (08.11.2026) : toutes les fiches /tours/<slug>/, la location et le speedboat.
const PRODUCT_PAGES = ["koh-rok-koh-haa", "koh-phi-phi", "mangroves", "fishing-trip", "sunrise-raft", "sunset-dinner-raft", "elephant-sanctuary", "kayak", "mangrove-kayaking", "snorkelling",
  "cooking-class", "scuba-diving", "atv", "batik", "go-kart", "rental", "speedboat"].map((s) => `tours/${s}/index.html`);
const PAGES = ["index.html", "tours/4-islands/index.html", "tours/index.html"].concat(PRODUCT_PAGES);
const ALLOWED = ["#14262B", "#3B5551", "#546A65", "#0B3B3C", "#124B4C", "#0F6B61", "#F6EFE4", "#EFE2D0", "#E3DACB", "#7A8884", "#EEF3F1", "#B5CBC6", "#FFFFFF", "#25D366"];
const out = [];
let failed = false;
const ok = (n, cond, detail) => { if (!cond) failed = true; out.push(`${cond ? "OK  " : "ÉCHEC"} ${n}${detail ? " : " + detail : ""}`); };

const hex = new Set();
for (const [, c] of CSS) for (const m of c.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) hex.add(m[0].toUpperCase());
const extra = [...hex].filter((h) => !ALLOWED.includes(h));
ok("3. Palette : seuls les hex de §2.1, blanc et #25D366", !extra.length, extra.join(", ") || [...hex].length + " couleurs");

const R = "(?:var\\(--radius(?:-btn)?\\)|var\\(--r(?:-btn)?\\)|12px|14px|0)";
const RADIUS = new RegExp(`^(${R}|999px|50%|${R}( ${R}){1,3})$`);
const radii = new Set();
for (const [, c] of CSS) for (const m of c.matchAll(/border-radius:\s*([^;}]+)/g)) radii.add(m[1].trim());
const badR = [...radii].filter((r) => !RADIUS.test(r));
ok("2. Rayons : 12 px, 14 px (boutons), 999 px (pastilles), 50 % (cercles)", !badR.length, badR.join(" | ") || [...radii].join(" | "));

const fontRefs = new Set();
for (const [, c] of CSS) for (const m of c.matchAll(/url\("\/css\/fonts\/([^"]+)"\)/g)) fontRefs.add(m[1]);
const html = PAGES.map((p) => fs.readFileSync("_site/" + p, "utf8"));
ok("4. Polices : Cormorant 600, Manrope 400 et 600, pas de Google Fonts", [...fontRefs].length <= 4 && !html.some((h) => /fonts\.googleapis/.test(h)), [...fontRefs].join(", "));

for (const [i, h] of html.entries()) {
  // Photos du contenu : <img> hors emblème (les variantes du logo ont des largeurs fixes) ; une photo de la page
  // ne doit pas apparaître deux fois, gabarits <template> compris.
  const imgs = [...h.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/favicon|emblem|\/img\/[^"]*-(?:53|106|159|58|116|174|69|138|207)\./.test(s));
  const dup = imgs.filter((s, k) => imgs.indexOf(s) !== k);
  ok(`6. Une image = un usage (${PAGES[i]})`, !dup.length, dup.join(", ") || imgs.length + " images");
  ok(`1. Aucun aplat à la place d'une photo (${PAGES[i]})`, !/card-plain|class="tone-/.test(h));
  const text = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ");
  ok(`10. Pas de point d'exclamation (${PAGES[i]})`, !/!/.test(text));
  ok(`10. Pas de TODO(client), [À CONFIRMER] ni [DONNÉE À FOURNIR] (${PAGES[i]})`, !/TODO\(client\)|À CONFIRMER|DONNÉE À FOURNIR|PHOTO À FOURNIR/.test(h));
  ok(`10. Un seul H1 (${PAGES[i]})`, (h.match(/<h1\b/g) || []).length === 1);
  ok(`11. Ni adresse ni comptoir de Sala Dan (${PAGES[i]})`, !/292\s*Moo|our desk|Sala Dan(?! pier)/i.test(text));
}
const overflow = CSS.map(([f, c]) => [f, (c.match(/overflow-x:\s*auto/g) || []).length]).filter(([, n]) => n);
const v4 = fs.readFileSync("_site/css/v4.css", "utf8");
const scrollers = [...v4.matchAll(/([.\w-]+)\s*\{[^}]*overflow-x:\s*auto/g)].map((m) => m[1]);
ok("7. overflow-x: auto seulement pour le rail et la galerie mobile", overflow.every(([f]) => f === "css/v4.css") && scrollers.every((s) => [".rail", ".gal"].includes(s)), JSON.stringify(scrollers));
console.log(out.join("\n"));
if (failed) process.exit(1);
