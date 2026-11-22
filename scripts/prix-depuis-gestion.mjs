#!/usr/bin/env node
// Prix de vente de Gestion au build (22.11.2026). Lancé avant Eleventy par `npm run build`.
//
// Pour chaque ligne de prix du site reliée à un tarif de Gestion (src/_data/gestion-keys.json, mêmes clés que scripts/prix-gestion.mjs),
// le script lit le prix de vente dans Gestion (fonction publique prix_publics_site, clé publique de Gestion, aucun secret) et remplace
// celui du fichier. Gestion ne rend que le prix de vente des tarifs actifs de Secret et de Taxi qu'on lui demande : ni net, ni commission,
// ni partenaire, ni libellé.
//
// Règles :
//   * la source ne répond pas, répond mal ou trop lentement : le build garde les prix des fichiers, l'écrit dans le journal et continue ;
//   * un tarif absent (inactif, sans prix, hors Secret et Taxi), un prix qui n'est pas un entier positif, ou un prix plus de deux fois
//     plus haut ou plus bas que celui du fichier (faute de frappe probable) : la ligne garde son prix et le journal le dit ;
//   * une clé marquée « auto »: false (la ligne du site n'a pas la même unité que le tarif) n'est jamais remplacée ;
//   * le prix d'appel (price.from) et les textes de la fiche qui citent l'ancien montant (« From 1,000 THB ») suivent, sauf si une autre
//     ligne de la même fiche garde ce montant (le texte pourrait parler d'elle) : le journal le signale alors.
//
// Modes (STT_PRIX_GESTION) : « ecrire » (par défaut sur Netlify, NETLIFY=true) réécrit les fichiers du build ; « lire » (par défaut
// ailleurs : poste de travail, CI) dit seulement ce qui changerait ; « 0 » ne lit rien. Le script sort toujours avec le code 0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
// Adresse et clé publique de Gestion : celles que l'outil Gestion sert déjà à tout navigateur (src/gestion/js/config.mjs de Site_Anais).
// La clé « anon » ne donne accès à aucune table : seulement aux fonctions ouvertes au public, ici prix_publics_site.
const URL_DEFAUT = "https://lkxqcmzeidlyssoqmqkh.supabase.co";
const CLE_PUBLIQUE_DEFAUT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHFjbXplaWRseXNzb3FtcWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzI1MDcsImV4cCI6MjEwODc0ODUwN30.tbal77PSChfoyzNx1-RBRIqgmZbxZY33DHxl7WT8a7U";
const DELAI_MS = 10_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TEXTES_IGNORES = new Set(["sources", "todo", "notes", "legacyText"]);

const lireJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const jsonDe = (dossier) => fs.readdirSync(dossier).filter((n) => n.endsWith(".json")).sort();

// Les fichiers qui portent des prix, lus depuis <data>/ : { "products/tours/4-islands.json": {...}, ..., "krabiDayTrip.json": {...} }.
export function chargerFichiers(data) {
  const f = {};
  for (const dossier of ["tours", "activities", "taxi"]) for (const n of jsonDe(path.join(data, "products", dossier))) f[`products/${dossier}/${n}`] = lireJson(path.join(data, "products", dossier, n));
  f["products/rental.json"] = lireJson(path.join(data, "products", "rental.json"));
  f["krabiDayTrip.json"] = lireJson(path.join(data, "krabiDayTrip.json"));
  return f;
}

// Les lignes de prix, avec l'objet et le champ à remplacer. Mêmes clés, même ordre et mêmes filtres que siteRows() de prix-gestion.mjs
// (un test le vérifie) : « slug|option|ligne », « taxi|slug|from », « taxi|slug|point ».
export function lignes(fichiers) {
  const out = [];
  const dans = (d) => Object.keys(fichiers).filter((k) => k.startsWith(`products/${d}/`)).sort();
  const produits = [...dans("tours"), ...dans("activities"), "products/rental.json"];
  for (const fichier of produits) {
    const p = fichiers[fichier];
    for (const o of p.options || []) for (const r of o.prices || []) {
      if (typeof r.amount !== "number" || r.amount <= 0) continue;
      out.push({ key: `${p.slug}|${o.label}|${r.label}`, fichier, objet: r, champ: "amount" });
    }
  }
  for (const fichier of Object.keys(fichiers).filter((k) => k.startsWith("products/taxi/")).sort()) {
    const p = fichiers[fichier];
    const pages = p.slug === "southern-thailand" ? p.routes.map((r) => ({ slug: r.id, t: r })) : [{ slug: p.slug, t: p }];
    for (const { slug, t } of pages) {
      if (t.pricePoints && t.pricePoints.length) for (const x of t.pricePoints) out.push({ key: `taxi|${slug}|${x.label}`, fichier, objet: x, champ: "thb" });
      else if (t.priceFrom && t.priceFrom.thb) out.push({ key: `taxi|${slug}|from`, fichier, objet: t.priceFrom, champ: "thb" });
    }
  }
  const day = fichiers["krabiDayTrip.json"];
  out.push({ key: `taxi|${day.slug}|from`, fichier: "krabiDayTrip.json", objet: day.priceFrom, champ: "thb" });
  return out;
}

// Identifiants des tarifs à demander à Gestion : ceux des clés remplaçables qui ont une ligne sur le site.
export function tarifsDemandes(fichiers, keys) {
  const ids = new Set();
  for (const l of lignes(fichiers)) { const k = keys[l.key]; if (k && k.prestation && k.auto !== false) ids.add(k.prestation); }
  return [...ids].sort();
}

const montant = (n) => n.toLocaleString("en-US");
// « 1,000 THB », « 1,000 THB », « 1000 THB » : le montant suivi de THB, jamais au milieu d'un autre nombre (« 11,000 », « 1,0001 »).
const motif = (n) => new RegExp(`(?<![\\d.,])(${montant(n).replace(/,/g, ",?")})(?=[\\s\\u00a0]?THB)`, "g");

function remplacerTextes(objet, ancien, nouveau, chemin = "", vus = []) {
  if (Array.isArray(objet)) { objet.forEach((v, i) => { if (typeof v === "string") { const s = v.replace(motif(ancien), montant(nouveau)); if (s !== v) { objet[i] = s; vus.push(`${chemin}[${i}]`); } } else remplacerTextes(v, ancien, nouveau, `${chemin}[${i}]`, vus); }); return vus; }
  if (!objet || typeof objet !== "object") return vus;
  for (const [k, v] of Object.entries(objet)) {
    if (TEXTES_IGNORES.has(k)) continue;
    if (typeof v === "string") { const s = v.replace(motif(ancien), montant(nouveau)); if (s !== v) { objet[k] = s; vus.push(chemin ? `${chemin}.${k}` : k); } }
    else remplacerTextes(v, ancien, nouveau, chemin ? `${chemin}.${k}` : k, vus);
  }
  return vus;
}

// Remplace en place, dans `fichiers`, les prix que Gestion donne (`prix` : Map identifiant → prix de vente). Rend le compte rendu.
export function appliquer({ fichiers, keys, prix }) {
  const changements = [];
  const gardes = [];
  const textes = [];
  const touches = new Set();
  const toutes = lignes(fichiers);
  for (const l of toutes) {
    const k = keys[l.key];
    if (!k || !k.prestation || k.auto === false) continue;
    const ancien = l.objet[l.champ];
    if (!prix.has(k.prestation)) { gardes.push({ key: l.key, ancien, motif: "tarif absent de Gestion (inactif, sans prix ou hors Secret et Taxi)" }); continue; }
    const brut = prix.get(k.prestation);
    const nouveau = Number(brut);
    if (!Number.isInteger(nouveau) || nouveau <= 0) { gardes.push({ key: l.key, ancien, motif: `prix de Gestion inutilisable (${brut})` }); continue; }
    if (nouveau === ancien) continue;
    if (nouveau > ancien * 2 || nouveau * 2 < ancien) { gardes.push({ key: l.key, ancien, motif: `Gestion donne ${nouveau}, plus du double ou moins de la moitié : à vérifier dans Gestion` }); continue; }
    l.objet[l.champ] = nouveau;
    changements.push({ key: l.key, fichier: l.fichier, ancien, nouveau });
    touches.add(l.fichier);
  }
  // Prix d'appel et textes de chaque fiche changée, montant par montant.
  for (const fichier of touches) {
    const j = fichiers[fichier];
    const restes = new Set(toutes.filter((l) => l.fichier === fichier).map((l) => l.objet[l.champ]));
    const parAncien = new Map();
    for (const c of changements.filter((c) => c.fichier === fichier)) parAncien.set(c.ancien, [...(parAncien.get(c.ancien) || []), c.nouveau]);
    for (const [ancien, nouveaux] of parAncien) {
      const cible = new Set(nouveaux);
      if (restes.has(ancien) || cible.size > 1) { textes.push({ fichier, ancien, motif: "texte et prix d'appel non changés : une autre ligne garde ce montant ou le montant se sépare en deux" }); continue; }
      const nouveau = nouveaux[0];
      if (j.price && j.price.from === ancien) j.price.from = nouveau;
      for (const champ of remplacerTextes(j, ancien, nouveau)) textes.push({ fichier, ancien, nouveau, champ });
    }
  }
  return { changements, gardes, textes, fichiers: [...touches].sort() };
}

// Lit les prix dans Gestion. Lève une erreur si la réponse n'a pas la forme attendue : l'appelant garde alors les prix des fichiers.
export async function lirePrix({ ids, url = URL_DEFAUT, cle = CLE_PUBLIQUE_DEFAUT, fetchFn = fetch, delai = DELAI_MS }) {
  const rep = await fetchFn(`${url.replace(/\/$/, "")}/rest/v1/rpc/prix_publics_site`, {
    method: "POST",
    headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ p_ids: ids }),
    signal: AbortSignal.timeout(delai)
  });
  if (!rep.ok) throw new Error(`HTTP ${rep.status}`);
  const rows = await rep.json();
  if (!Array.isArray(rows)) throw new Error("réponse qui n'est pas une liste");
  const prix = new Map();
  for (const r of rows) {
    if (!r || typeof r !== "object" || !UUID.test(String(r.prestation))) throw new Error("ligne sans identifiant de tarif");
    const cles = Object.keys(r).sort().join(",");
    if (cles !== "prestation,prix_vente") throw new Error(`colonnes inattendues (${cles})`);
    prix.set(r.prestation, r.prix_vente);
  }
  return prix;
}

const journal = (m) => console.log(`[prix Gestion] ${m}`);

export async function principal({ env = process.env, data = path.join(ROOT, "src", "_data"), fetchFn = fetch, log = journal } = {}) {
  const mode = env.STT_PRIX_GESTION || (env.NETLIFY === "true" ? "ecrire" : "lire");
  if (mode === "0" || mode === "non") { log("lecture coupée (STT_PRIX_GESTION=0) : prix des fichiers."); return { mode, statut: "coupe" }; }
  try {
    const keys = lireJson(path.join(data, "gestion-keys.json"));
    const fichiers = chargerFichiers(data);
    const ids = tarifsDemandes(fichiers, keys);
    let prix;
    try { prix = await lirePrix({ ids, url: env.GESTION_SUPABASE_URL || URL_DEFAUT, cle: env.GESTION_SUPABASE_ANON_KEY || CLE_PUBLIQUE_DEFAUT, fetchFn }); }
    catch (e) { log(`source indisponible (${e.name === "TimeoutError" ? "pas de réponse en 10 s" : e.message}) : le site garde les prix des fichiers.`); return { mode, statut: "indisponible" }; }
    const rep = appliquer({ fichiers, keys, prix });
    log(`${prix.size} tarifs lus sur ${ids.length} demandés, ${rep.changements.length} prix ${mode === "ecrire" ? "remplacés" : "à remplacer (mode lecture, rien n'est écrit)"}.`);
    for (const c of rep.changements) log(`  ${c.key} : ${c.ancien} → ${c.nouveau}`);
    for (const g of rep.gardes) log(`  gardé ${g.key} (${g.ancien}) : ${g.motif}`);
    for (const t of rep.textes) log(t.champ ? `  texte ${t.fichier} ${t.champ} : ${t.ancien} → ${t.nouveau}` : `  à relire ${t.fichier}, montant ${t.ancien} : ${t.motif}`);
    if (mode === "ecrire") for (const f of rep.fichiers) fs.writeFileSync(path.join(data, f), JSON.stringify(fichiers[f], null, 2) + "\n");
    return { mode, statut: "lu", ...rep };
  } catch (e) {
    log(`erreur inattendue (${e.message}) : le site garde les prix des fichiers.`);
    return { mode, statut: "erreur" };
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) principal().finally(() => process.exit(0));
