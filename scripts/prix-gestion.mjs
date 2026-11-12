#!/usr/bin/env node
// Contrôle des prix du site et de Gestion (12.11.2026), à lancer le 1er du mois (veille) et avant toute PR qui touche un prix.
//
//   node scripts/prix-gestion.mjs <dossier-export> [--json]
//
// <dossier-export> contient prestations.json, lu en LECTURE SEULE dans la base de Gestion par celui qui lance le contrôle
// (supabase db query --remote --read-only), avec la forme de l'export du 12.11.2026 :
// [{ id, partenaire, famille, groupe, libelle_en, prix_vente, unite, actif }].
// Le script ne se connecte à rien : il lit ces fichiers, le site (src/_data/products) et les clés src/_data/gestion-keys.json.
//
// Une clé peut porter « aussi » (autres prestations couvertes par la même ligne) ou une prestation null avec une note (remise du prestataire hors Gestion).
// Chaque ligne de prix du site porte une clé « slug|option|ligne » vers une prestation de Gestion (src/_data/gestion-keys.json,
// la page taxi « slug|from » ou « slug|libellé du point »). Le script sort :
//   1. les écarts : prix du site différent du prix de vente de Gestion, prestation inactive, clé vers une prestation disparue,
//      prix « About » (approximatif) du site face à un prix absent de la base ;
//   2. les lignes de prix du site sans clé (frais de parc exclus : payés sur place, un seul tarif adulte en base) ;
//   3. les prestations actives de Gestion sans page sur le site (hors décisions de src/_data/gestion-hors-site.json) ;
//   4. les clés qui ne correspondent plus à aucune ligne de prix du site.
// Code de sortie 1 s'il y a un écart ou une ligne sans clé, 0 sinon (prestations sans page : information, pas un échec).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS = path.join(ROOT, "src", "_data", "products");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ---------- site ----------
const list = (folder) => fs.readdirSync(path.join(PRODUCTS, folder)).filter((n) => n.endsWith(".json")).sort().map((n) => readJson(path.join(PRODUCTS, folder, n)));

// Lignes de prix du site : { key, page, label, amount, approx }. Les frais de parc (notIncludedFees) n'en font pas partie.
export function siteRows() {
  const rows = [];
  const products = [...list("tours"), ...list("activities"), readJson(path.join(PRODUCTS, "rental.json"))];
  for (const p of products) {
    for (const o of p.options || []) {
      for (const r of o.prices || []) {
        if (typeof r.amount !== "number" || r.amount <= 0) continue;
        rows.push({ key: `${p.slug}|${o.label}|${r.label}`, page: p.url, label: `${o.label} : ${r.label}`, amount: r.amount, approx: false });
      }
    }
  }
  // Taxis : prix d'appel de chaque page, et un prix par point quand la page en a.
  for (const p of list("taxi")) {
    const pages = p.slug === "southern-thailand" ? p.routes.map((r) => ({ slug: r.id, url: p.url, priceFrom: r.priceFrom, pricePoints: r.pricePoints })) : [p];
    for (const t of pages) {
      if (t.pricePoints && t.pricePoints.length) for (const x of t.pricePoints) rows.push({ key: `taxi|${t.slug}|${x.label}`, page: t.url, label: x.label, amount: x.thb, approx: false });
      else if (t.priceFrom && t.priceFrom.thb) rows.push({ key: `taxi|${t.slug}|from`, page: t.url, label: "from", amount: t.priceFrom.thb, approx: Boolean(t.priceFrom.approx) });
    }
  }
  // Excursion privée d'une journée vers Krabi (krabiDayTrip.json) : son prix « from ».
  const day = readJson(path.join(ROOT, "src", "_data", "krabiDayTrip.json"));
  rows.push({ key: `taxi|${day.slug}|from`, page: day.url, label: "from", amount: day.priceFrom.thb, approx: false });
  return rows;
}

// ---------- contrôle ----------
export function controle({ site, keys, prestations, horsSite }) {
  const byId = new Map(prestations.map((p) => [p.id, p]));
  const ecarts = [];
  const sansCle = [];
  const used = new Set();
  for (const r of site) {
    const k = keys[r.key];
    if (!k) { sansCle.push(r); continue; }
    for (const id of k.aussi || []) used.add(id); // autres prestations couvertes par la même ligne du site (matin et après-midi, déjeuner et dîner)
    if (k.prestation === null) continue; // pas une prestation de Gestion : la note de la clé dit pourquoi
    const p = byId.get(k.prestation);
    if (!p) { ecarts.push({ ...r, motif: "prestation disparue de Gestion", gestion: k.gestion }); continue; }
    used.add(p.id);
    const vente = p.prix_vente === null || p.prix_vente === undefined || p.prix_vente === "None" ? null : Number(p.prix_vente);
    if (vente === null) ecarts.push({ ...r, motif: r.approx ? "prix « About » sur le site, aucun prix en base" : "aucun prix de vente en base", gestion: p.libelle_en });
    else if (vente !== r.amount) ecarts.push({ ...r, motif: `site ${r.amount}, Gestion ${vente} (${p.unite || "sans unité"})`, gestion: p.libelle_en });
    else if (r.approx) ecarts.push({ ...r, motif: "prix « About » sur le site, la base donne un prix exact : " + vente, gestion: p.libelle_en });
    if (!p.actif) ecarts.push({ ...r, motif: "prestation inactive dans Gestion", gestion: p.libelle_en });
  }
  const masque = (p) => horsSite.regles.some((x) => (!x.partenaire || x.partenaire === p.partenaire) && (!x.groupe || x.groupe === p.groupe) && (!x.famille || x.famille === p.famille));
  // Une prestation à 0 (enfant gratuit) n'a pas de page : elle est dite « Free » sur la ligne enfant voisine.
  const siteKeys = new Set(site.map((r) => r.key));
  const orphelines = Object.keys(keys).filter((k) => !siteKeys.has(k));
  const sansPage = prestations.filter((p) => p.actif && !used.has(p.id) && !masque(p) && Number(p.prix_vente) !== 0);
  return { ecarts, sansCle, sansPage, orphelines };
}

const fmt = (rep) => {
  const out = [];
  out.push("# Contrôle des prix, site et Gestion", "");
  out.push(`## 1. Écarts (${rep.ecarts.length})`);
  for (const e of rep.ecarts) out.push(`- ${e.page} : ${e.label} : ${e.motif} [${e.gestion}]`);
  if (!rep.ecarts.length) out.push("Aucun.");
  out.push("", `## 2. Lignes du site sans clé (${rep.sansCle.length})`);
  for (const r of rep.sansCle) out.push(`- ${r.page} : ${r.label} (${r.amount}) → ajouter « ${r.key} » à src/_data/gestion-keys.json`);
  if (!rep.sansCle.length) out.push("Aucune.");
  out.push("", `## 3. Prestations actives de Gestion sans page (${rep.sansPage.length})`);
  const g = new Map();
  for (const p of rep.sansPage) { const k = `${p.partenaire || "Sans partenaire"} | ${p.groupe || ""}`; g.set(k, [...(g.get(k) || []), p]); }
  for (const [k, v] of g) out.push(`- ${k} : ${v.length} ligne${v.length > 1 ? "s" : ""}, par exemple « ${v[0].libelle_en} » ${v[0].prix_vente || "sans prix"}`);
  if (!rep.sansPage.length) out.push("Aucune.");
  out.push("", `## 4. Clés sans ligne de prix sur le site (${rep.orphelines.length})`);
  for (const k of rep.orphelines) out.push(`- ${k} → retirer de src/_data/gestion-keys.json si la ligne n'existe plus`);
  if (!rep.orphelines.length) out.push("Aucune.");
  return out.join("\n");
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const dir = process.argv[2];
  if (!dir || dir.startsWith("--")) { console.error("Usage : node scripts/prix-gestion.mjs <dossier-export> [--json]"); process.exit(2); }
  const prestations = readJson(path.join(dir, "prestations.json"));
  const keys = readJson(path.join(ROOT, "src", "_data", "gestion-keys.json"));
  const horsSite = readJson(path.join(ROOT, "src", "_data", "gestion-hors-site.json"));
  const rep = controle({ site: siteRows(), keys, prestations, horsSite });
  console.log(process.argv.includes("--json") ? JSON.stringify(rep, null, 2) : fmt(rep));
  process.exit(rep.ecarts.length || rep.sansCle.length ? 1 : 0);
}
