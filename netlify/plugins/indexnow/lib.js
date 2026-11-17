// IndexNow (demande de Jérémy, 17.11.2026) : fonctions pures partagées par le script de build
// (scripts/indexnow-manifest.mjs, qui écrit /indexnow-manifest.json) et le plugin Netlify (index.js, qui envoie).
// Aucune dépendance : Node 22 fournit fetch, AbortSignal.timeout et crypto.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ENDPOINT = "https://api.indexnow.org/indexnow";
const MANIFEST = "indexnow-manifest.json";
const MAX_URLS = 10000; // limite d'un envoi IndexNow
const TIMEOUT_MS = 10000;

// Adresses du sitemap, et seulement elles (ni /design/, ni /_v4/, ni pages non indexées).
function sitemapUrls(xml) {
  return [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}

// Fichier HTML servi pour une adresse du site (« /tours/kayak/ » → tours/kayak/index.html).
function fileFor(siteDir, url) {
  const p = decodeURIComponent(new URL(url).pathname);
  return path.join(siteDir, p.endsWith("/") ? p + "index.html" : p);
}

// Contenu qui compte pour un moteur : titre, description, canonical, robots, JSON-LD et <main>.
// L'en-tête et le pied (communs à toutes les pages) restent dehors : un lien du menu changé ne signale pas 47 pages.
// Retirés aussi : la version du build sur les CSS et JS (« ?v=… », change à chaque build) et les espaces (entre balises aussi).
function significant(html) {
  const s = String(html);
  const pick = (re) => [...s.matchAll(re)].map((m) => m[0]);
  const main = s.match(/<main\b[\s\S]*<\/main>/i);
  const parts = [
    ...pick(/<title\b[\s\S]*?<\/title>/gi),
    ...pick(/<meta\s[^>]*name="(?:description|robots)"[^>]*>/gi),
    ...pick(/<link\s[^>]*rel="canonical"[^>]*>/gi),
    ...pick(/<script\s[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi),
    main ? main[0] : (s.match(/<body\b[\s\S]*<\/body>/i) || [s])[0]
  ];
  return parts.join("\n").replace(/(\.(?:css|js))\?v=[a-z0-9]+/gi, "$1?v=").replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
}

function hash(html) {
  return crypto.createHash("sha256").update(significant(html)).digest("hex").slice(0, 16);
}

// Manifeste : adresse du sitemap → empreinte du contenu. Les clés sont triées : deux builds identiques donnent le même fichier.
function buildManifest(siteDir) {
  const urls = sitemapUrls(fs.readFileSync(path.join(siteDir, "sitemap.xml"), "utf8"));
  const pages = {};
  for (const u of [...new Set(urls)].sort()) {
    const f = fileFor(siteDir, u);
    if (fs.existsSync(f)) pages[u] = hash(fs.readFileSync(f, "utf8"));
  }
  return { version: 1, pages };
}

// Nouvelles, modifiées et supprimées. Sans manifeste précédent (premier envoi) : toutes les adresses comptent comme nouvelles.
function diff(prev, next) {
  const a = (prev && prev.pages) || {};
  const b = (next && next.pages) || {};
  const added = Object.keys(b).filter((u) => !(u in a));
  const changed = Object.keys(b).filter((u) => u in a && a[u] !== b[u]);
  const removed = Object.keys(a).filter((u) => !(u in b));
  return { added, changed, removed, urls: [...added, ...changed, ...removed] };
}

// Corps de l'envoi IndexNow (format de api.indexnow.org) : un seul POST, 10 000 adresses au plus, toutes sur l'hôte du site.
function payload(siteUrl, key, urls) {
  const host = new URL(siteUrl).host;
  return {
    host,
    key,
    keyLocation: new URL("/" + key + ".txt", siteUrl).href,
    urlList: urls.filter((u) => new URL(u).host === host).slice(0, MAX_URLS)
  };
}

module.exports = { ENDPOINT, MANIFEST, MAX_URLS, TIMEOUT_MS, sitemapUrls, fileFor, significant, hash, buildManifest, diff, payload };
