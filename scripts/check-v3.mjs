// Critères vérifiables du design v3 (PROMPT-DESIGN-V3.md §6) sur _site : couleurs, rayons, polices,
// photos (un usage, aucun aplat), défilement horizontal, mots interdits, points d'exclamation.
import fs from "node:fs";
const CSS = ["css/tokens.css", "css/v3.css", "css/booking.css"].map((f) => [f, fs.readFileSync("_site/" + f, "utf8")]);
const PAGES = ["index.html", "tours/4-islands/index.html", "tours/index.html"];
const ALLOWED = ["#14262B", "#3B5551", "#546A65", "#0B3B3C", "#124B4C", "#0F6B61", "#F6EFE4", "#EFE2D0", "#E3DACB", "#7A8884", "#EEF3F1", "#B5CBC6", "#FFFFFF", "#25D366"];
const out = [];
const ok = (n, cond, detail) => out.push(`${cond ? "OK  " : "ÉCHEC"} ${n}${detail ? " : " + detail : ""}`);

const hex = new Set();
for (const [, c] of CSS) for (const m of c.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) hex.add(m[0].toUpperCase());
const extra = [...hex].filter((h) => !ALLOWED.includes(h));
ok("3. Palette : seuls les hex de §2.1, blanc et #25D366", !extra.length, extra.join(", ") || [...hex].length + " couleurs");

const radii = new Set();
for (const [, c] of CSS) for (const m of c.matchAll(/border-radius:\s*([^;}]+)/g)) radii.add(m[1].trim());
const badR = [...radii].filter((r) => !/^(var\(--radius(-btn)?\)|12px|14px|999px|0|50%|var\(--radius\) 0 0 var\(--radius\)|0 var\(--radius\) var\(--radius\) 0|12px 12px 0 0)$/.test(r));
ok("2. Rayons : 12 px, 14 px (boutons), 999 px (pastilles)", !badR.length, badR.join(" | ") || [...radii].join(" | "));

const woff = fs.readdirSync("_site/css/fonts").filter((f) => /cormorant|manrope/.test(f));
const fontRefs = new Set();
for (const [, c] of CSS) for (const m of c.matchAll(/url\("\/css\/fonts\/([^"]+)"\)/g)) fontRefs.add(m[1]);
const html = PAGES.map((p) => fs.readFileSync("_site/" + p, "utf8"));
ok("4. Polices : Cormorant 600, Manrope 400 et 600, pas de Google Fonts", [...fontRefs].length <= 4 && !html.some((h) => /fonts\.googleapis/.test(h)), [...fontRefs].join(", "));

for (const [i, h] of html.entries()) {
  const imgs = [...h.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/favicon|emblem|\/img\/[^"]*-(?:58|116|174|53|106|159|69|138|207)\./.test(s));
  const dup = imgs.filter((s, k) => imgs.indexOf(s) !== k);
  ok(`6. Une image = un usage (${PAGES[i]})`, !dup.length, dup.join(", ") || imgs.length + " images");
  ok(`1. Aucun aplat à la place d'une photo (${PAGES[i]})`, !/card-plain|class="tone-/.test(h));
  const text = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  ok(`10. Pas de point d'exclamation (${PAGES[i]})`, !/!/.test(text.replace(/<!--[\s\S]*?-->/g, "")));
  ok(`10. Pas de TODO(client) ni [À CONFIRMER] (${PAGES[i]})`, !/TODO\(client\)|À CONFIRMER/.test(h));
}
const overflow = CSS.map(([f, c]) => [f, (c.match(/overflow-x:\s*auto/g) || []).length]).filter(([, n]) => n);
ok("7. overflow-x: auto seulement pour la galerie", overflow.every(([f]) => f === "css/v3.css") && (fs.readFileSync("_site/css/v3.css", "utf8").match(/overflow-x:\s*auto/g) || []).length === 1, JSON.stringify(overflow));
console.log(out.join("\n"));
