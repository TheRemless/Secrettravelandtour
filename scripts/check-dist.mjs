// Contrôle du site généré (_site/), lancé après Eleventy par `npm run build`.
//
// 1. Pages de la refonte (balise <html data-refonte>, posée par le nouveau gabarit quand la page
//    a `refonte: true` en front matter ou dans ses données) : le build ÉCHOUE sur tout mot ou
//    tournure bannis (03-audit-contenu §6.6), toute classe ou ressource interdite (00-BRIEF §7)
//    et toute image marquée « replace » dans les données. Même contrôle, strict, sur les CSS et
//    JS que ces pages chargent.
// 2. Anciennes pages : mêmes contrôles, en simple avertissement (le build reste vert jusqu'à
//    leur remplacement).
// 3. `TODO(client)` ou `[À CONFIRMER]` n'importe où dans _site : échec si CONTEXT=production
//    (Netlify, site en ligne), sinon avertissement avec le nombre d'occurrences.
// Les planches /design/ sont exclues.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "_site");
const PRODUCTS = path.join(ROOT, "src", "_data", "products");
const PRODUCTION = process.env.CONTEXT === "production";

// Mots et tournures bannis (03-audit-contenu §6.6), plus « Book now » (00-BRIEF §3).
const BANNED_TEXT = [
  ["discover", /\bdiscover\w*/i],
  ["explore", /\bexplor(?:e|es|ed|ing|ation)\b/i],
  ["unforgettable", /\bunforgettable\b/i],
  ["breathtaking", /\bbreathtaking\b/i],
  ["stunning", /\bstunning\b/i],
  ["paradise", /\bparadise\b/i],
  ["hidden gem", /\bhidden gems?\b/i],
  ["nestled", /\bnestled\b/i],
  ["crystal-clear", /\bcrystal[- ]clear\b/i],
  ["vibrant", /\bvibrant\b/i],
  ["immerse", /\bimmers(?:e|es|ed|ing|ive|ion)\b/i],
  ["embark", /\bembark\w*/i],
  ["curated", /\bcurated\b/i],
  ["seamless", /\bseamless\w*/i],
  ["hassle-free", /\bhassle[- ]free\b/i],
  ["stress-free", /\bstress[- ]free\b/i],
  ["world-class", /\bworld[- ]class\b/i],
  ["memories", /\bmemories\b/i],
  ["dream", /\bdream\w*/i],
  ["Whether you're…", /\bwhether you(?:'|’)re\b/i],
  ["Look no further", /\blook no further\b/i],
  ["Ready to…?", /\bready to [^?.!<]{1,60}\?/i],
  ["Planning a…?", /\bplanning a [^?.!<]{1,60}\?/i],
  ["Something else in mind?", /\bsomething else in mind\b/i],
  ["a bit of everything", /\ba bit of everything\b/i],
  ["time to do nothing", /\btime to do nothing\b/i],
  ["the way the island does it", /\bthe way the island does it\b/i],
  ["Nobody…", /\bnobody\b/i],
  ["Learn more", /\blearn more\b/i],
  ["Questions we get about this trip", /\bquestions we get about this trip\b/i],
  ["Minivan Taxi", /\bminivan taxi\b/i],
  ["1h30", /\b\d{1,2}h\d{2}\b/],
  ["in Koh Lanta", /\bin Koh Lanta\b/i],
  ["Book now", /\bbook now\b/i],
  ["flèche décorative →", /→/],
  ["ornement ——", /——/]
];
// « no hidden fees » toléré une fois par page.
const HIDDEN_FEES = /\bno hidden fees\b/gi;

// Classes et ressources interdites (00-BRIEF §7, 01-audit-design §3) dans le HTML.
const BANNED_CLASSES = ["pol", "page-pol", "brush", "note-park", "learn"];
const BANNED_HTML = [
  ["brush.webp", /brush\.webp/i],
  ["polices de l'ancien site", /concert-one|sniglet|kaushan|marcellus|figtree/i],
  ["AggregateRating auto-déclaré", /"@type"\s*:\s*"AggregateRating"|"aggregateRating"/],
  ["TouristAttraction", /"@type"\s*:\s*"TouristAttraction"/]
];
// Dans les CSS : faux gras, polices bannies (00-BRIEF §5), coups de pinceau, flèches en pseudo-élément,
// photos inclinées de quelques degrés façon polaroïd.
const BANNED_CSS = [
  ["text-stroke", /text-stroke/i],
  ["brush.webp", /brush\.webp/i],
  ["police interdite", /font-family\s*:[^;}]*\b(?:Inter|Poppins|Montserrat|DM Sans|Space Grotesk|Fraunces|Playfair|Sniglet|Concert One|Kaushan|Marcellus|Figtree)\b/i],
  ["police script", /font-family\s*:[^;}]*\bcursive\b/i],
  ["flèche décorative", /content\s*:\s*"[^"]*(?:\\2192|→)/i],
  ["photo inclinée", /rotate\(\s*-?(?:[1-4](?:\.\d+)?|0?\.\d+)deg\s*\)/i]
];
const BANNED_JS = BANNED_TEXT.filter(([name]) => !["flèche décorative →", "1h30"].includes(name)).concat([["« Hi …! » en tête de message", /["'`]Hi [^"'`\n]{0,40}!/]]);

const PLACEHOLDERS = /TODO\(client\)|\[À CONFIRMER\]/g;

// Images marquées « replace » dans les données : interdites sur les nouvelles pages (01-audit-design §4).
// Limite : une image passée par eleventy-img prend un nom haché ; le contrôle voit les références
// directes (/images/…), les attributs eleventy:ignore, les og:image et les fonds CSS.
function replacedImages() {
  const files = new Set();
  const visit = (v) => {
    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      if (v.status === "replace" && typeof v.file === "string") files.add(v.file);
      Object.values(v).forEach(visit);
    }
  };
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".json")) visit(JSON.parse(fs.readFileSync(full, "utf8")));
    }
  };
  walk(PRODUCTS);
  visit(JSON.parse(fs.readFileSync(path.join(ROOT, "src", "_data", "site.json"), "utf8")));
  return [...files];
}

function listFiles(dir, exts, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const rel = path.relative(SITE, full).split(path.sep).join("/");
    if (rel === "design" || rel.startsWith("design/")) continue;
    if (e.isDirectory()) listFiles(full, exts, acc);
    else if (exts.includes(path.extname(e.name))) acc.push(rel);
  }
  return acc;
}

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&#8217;/g, "’").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&mdash;/g, "—").replace(/&rarr;/g, "→");

// Texte lu par le visiteur ou par Google : texte visible, title, meta, alt, aria-label, placeholder, JSON-LD.
function readableText(html) {
  const jsonLd = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const attrs = [...html.matchAll(/\s(?:alt|title|content|aria-label|placeholder)="([^"]*)"/gi)].map((m) => m[1]);
  const body = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ");
  return decode([body, ...attrs, ...jsonLd].join("\n")).replace(/[ \t]+/g, " ");
}

function excerpt(text, re) {
  const m = new RegExp(re.source, re.flags.replace("g", "")).exec(text);
  if (!m) return "";
  return text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, " ").trim();
}

function checkHtml(html, replaced) {
  const found = [];
  const text = readableText(html);
  for (const [name, re] of BANNED_TEXT) if (re.test(text)) found.push([name, excerpt(text, re)]);
  const fees = text.match(HIDDEN_FEES) || [];
  if (fees.length > 1) found.push(["« no hidden fees » plus d'une fois", `${fees.length} fois`]);
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (BANNED_CLASSES.includes(c)) found.push([`classe .${c}`, m[0].trim()]);
  }
  for (const [name, re] of BANNED_HTML) if (re.test(html)) found.push([name, ""]);
  for (const file of replaced) if (html.includes(`/images/${file}`)) found.push(["image à remplacer", file]);
  for (const m of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)) {
    const t = decode(m[1].replace(/<[^>]+>/g, "")).trim();
    if ((t.match(/[A-Za-z]/g) || []).length >= 4 && t === t.toUpperCase()) found.push(["titre H2 en capitales dans le HTML", t]);
  }
  return found;
}

function checkAsset(content, rules) {
  return rules.filter(([, re]) => re.test(content)).map(([name, re]) => [name, excerpt(content, re)]);
}

if (!fs.existsSync(SITE)) {
  console.error("[check-dist] _site/ introuvable : lancer Eleventy d'abord.");
  process.exit(1);
}

const replaced = replacedImages();
const htmlFiles = listFiles(SITE, [".html"]);
const assetFiles = listFiles(SITE, [".css", ".js"]);
const errors = [];
const warnings = [];
const strictAssets = new Set();
let refonteCount = 0;

for (const rel of htmlFiles) {
  const html = fs.readFileSync(path.join(SITE, rel), "utf8");
  const isRefonte = /<html\b[^>]*\sdata-refonte\b/i.test(html);
  if (isRefonte) {
    refonteCount++;
    // CSS et JS chargés par une page de la refonte : contrôle strict.
    for (const m of html.matchAll(/<(?:link[^>]+href|script[^>]+src)="\/([^"?#]+\.(?:css|js))(?:[?#][^"]*)?"/gi)) strictAssets.add(m[1]);
  }
  for (const [rule, detail] of checkHtml(html, replaced)) (isRefonte ? errors : warnings).push({ file: rel, rule, detail });
}

for (const rel of assetFiles) {
  const content = fs.readFileSync(path.join(SITE, rel), "utf8");
  const rules = rel.endsWith(".css") ? BANNED_CSS : BANNED_JS;
  for (const [rule, detail] of checkAsset(content, rules)) (strictAssets.has(rel) ? errors : warnings).push({ file: rel, rule, detail });
}

// TODO(client) et [À CONFIRMER] : partout dans _site (hors /design/).
let placeholderCount = 0;
const placeholderFiles = [];
for (const rel of htmlFiles.concat(assetFiles)) {
  const n = (fs.readFileSync(path.join(SITE, rel), "utf8").match(PLACEHOLDERS) || []).length;
  if (n) {
    placeholderCount += n;
    placeholderFiles.push(`${rel} (${n})`);
  }
}

console.log(`[check-dist] ${htmlFiles.length} pages HTML, dont ${refonteCount} de la refonte ; ${assetFiles.length} CSS/JS, dont ${strictAssets.size} contrôlés strictement.`);

if (warnings.length) {
  const byFile = {};
  for (const w of warnings) (byFile[w.file] ||= {})[w.rule] = ((byFile[w.file] || {})[w.rule] || 0) + 1;
  console.log(`[check-dist] Avertissement : ${warnings.length} éléments interdits dans ${Object.keys(byFile).length} anciens fichiers (à supprimer lors de leur remplacement) :`);
  for (const [file, rules] of Object.entries(byFile)) console.log(`  - ${file} : ${Object.entries(rules).map(([r, n]) => (n > 1 ? `${r} ×${n}` : r)).join(", ")}`);
}

if (placeholderCount) {
  const msg = `${placeholderCount} TODO(client) ou [À CONFIRMER] dans _site : ${placeholderFiles.join(", ")}`;
  if (PRODUCTION) errors.push({ file: "_site", rule: "texte provisoire en production", detail: msg });
  else console.log(`[check-dist] Avertissement : ${msg} (bloquant en production).`);
}

if (errors.length) {
  console.error(`[check-dist] ÉCHEC : ${errors.length} problèmes dans les pages de la refonte :`);
  for (const e of errors) console.error(`  - ${e.file} : ${e.rule}${e.detail ? ` (${e.detail})` : ""}`);
  process.exit(1);
}
console.log("[check-dist] OK.");
