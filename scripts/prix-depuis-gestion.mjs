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
//   * un tarif absent (inactif, sans prix, non publié, hors Secret et Taxi), un prix qui n'est pas un entier positif, ou un prix plus de deux fois
//     plus haut ou plus bas que celui du fichier (faute de frappe probable) : la ligne garde son prix et le journal le dit ;
//   * une clé marquée « auto »: false (la ligne du site n'a pas la même unité que le tarif) n'est jamais remplacée ;
//   * un écart de plus de 25 % est appliqué et signalé « à relire » au journal ;
//   * le prix d'appel (price.from) suit SA ligne (la première ligne adulte qui le porte : « per adult rider » de l'ATV, petit monoplace
//     10 minutes du go-kart), et « From X THB » le suit ; les autres textes qui citent l'ancien montant suivent, sauf si une autre ligne de
//     la fiche garde ce montant ; une ligne de même libellé moins chère dans une autre option est signalée « à relire » ;
//   * un total écrit (« Each extra person adds 1,800 THB, so a group of 3 pays 5,700 THB », radeaux) est recalculé avec la ligne du groupe
//     et le supplément, si la formule tient sur le fichier, et signalé « à relire » ; une fiche qui porte un autre total écrit garde tous
//     ses prix (aucun chiffre incohérent en ligne).
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

const enfant = (r) => /child|kid|infant|baby|nanny/i.test(r.label || "") || Boolean(r.ages && typeof r.ages.max === "number" && r.ages.max < 12);
const adulte = (r) => typeof r.amount === "number" && r.amount > 0 && !r.supplement && !enfant(r);

// Ligne du prix d'appel : la première ligne adulte de la fiche (ni enfant, ni supplément) qui porte price.from. Le prix d'appel suit CETTE
// ligne, pas le montant : 4 Islands a deux lignes à 1 000 (adulte longtail, enfant speedboat), l'ATV dit « per adult rider » à 1 200 alors
// que le passager adulte paie 900, le go-kart « small single-seat kart, 10 minutes » à 399 à côté de deux lignes à 499.
function ligneDuPrixDappel(j) {
  if (!j.price || typeof j.price.from !== "number") return null;
  for (const o of j.options || []) for (const r of o.prices || []) if (adulte(r) && r.amount === j.price.from) return { option: o, ligne: r };
  return null;
}

// Total écrit dans une phrase : « Each extra person adds 1,800 THB, so a group of 3 pays 5,700 THB. » Formule connue : la ligne du groupe
// (group.max) plus le supplément (supplement) par personne au-delà. Toute autre phrase de total est inconnue.
const TOTAL = /Each extra person adds ([\d,]+)[\s\u00a0]?THB, so a group of (\d+) pays ([\d,]+)[\s\u00a0]?THB/;
const TOTAL_QUELCONQUE = /\b(pays|total|in all|altogether|for the group)\b[^.]*?\d[\d,]*[\s\u00a0]?THB/i;
const nombre = (t) => Number(String(t).replace(/,/g, ""));
function totaux(j) {
  const connus = [];
  const inconnus = [];
  const visite = (v, chemin, option) => {
    if (typeof v === "string") {
      const m = v.match(TOTAL);
      if (m) {
        const base = option && (option.prices || []).find((r) => r.group && typeof r.group.max === "number" && typeof r.amount === "number");
        const sup = option && (option.prices || []).filter((r) => r.supplement && typeof r.amount === "number");
        const n = Number(m[2]);
        if (base && sup.length === 1 && nombre(m[1]) === sup[0].amount && nombre(m[3]) === base.amount + sup[0].amount * (n - base.group.max)) connus.push({ chemin, parent: null, base, sup: sup[0], n });
        else inconnus.push(chemin);
      } else if (TOTAL_QUELCONQUE.test(v)) inconnus.push(chemin);
      return;
    }
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (TEXTES_IGNORES.has(k)) continue;
      visite(x, chemin ? `${chemin}.${k}` : k, option || (Array.isArray(v) && v === j.options ? x : null));
    }
  };
  for (const [k, x] of Object.entries(j)) if (!TEXTES_IGNORES.has(k)) visite(x, k, null);
  return { connus, inconnus };
}
const lireChemin = (j, chemin) => chemin.split(".").reduce((o, k) => (o == null ? o : o[k]), j);
const ecrireChemin = (j, chemin, v) => { const c = chemin.split("."); const d = c.pop(); c.reduce((o, k) => o[k], j)[d] = v; };

// Remplace en place, dans `fichiers`, les prix que Gestion donne (`prix` : Map identifiant → prix de vente). Rend le compte rendu.
export function appliquer({ fichiers, keys, prix }) {
  const changements = [];
  const gardes = [];
  const textes = [];
  const alertes = [];
  const toutes = lignes(fichiers);
  // Avant tout remplacement : ligne du prix d'appel et totaux écrits, fiche par fiche.
  const avant = new Map();
  for (const [fichier, j] of Object.entries(fichiers)) avant.set(fichier, { appel: ligneDuPrixDappel(j), totaux: totaux(j), from: j.price && j.price.from });
  for (const l of toutes) {
    const k = keys[l.key];
    if (!k || !k.prestation || k.auto === false) continue;
    const ancien = l.objet[l.champ];
    if (!prix.has(k.prestation)) { gardes.push({ key: l.key, ancien, motif: "tarif absent de Gestion (inactif, sans prix ou non publié)" }); continue; }
    const brut = prix.get(k.prestation);
    const nouveau = Number(brut);
    if (!Number.isInteger(nouveau) || nouveau <= 0) { gardes.push({ key: l.key, ancien, motif: `prix de Gestion inutilisable (${brut})` }); continue; }
    if (nouveau === ancien) continue;
    if (nouveau > ancien * 2 || nouveau * 2 < ancien) { gardes.push({ key: l.key, ancien, motif: `Gestion donne ${nouveau}, plus du double ou moins de la moitié : à vérifier dans Gestion` }); continue; }
    l.objet[l.champ] = nouveau;
    changements.push({ key: l.key, fichier: l.fichier, ancien, nouveau, ligne: l });
    const ecart = Math.abs(nouveau - ancien) / ancien;
    if (ecart > 0.25) alertes.push({ key: l.key, fichier: l.fichier, motif: `à relire : ${ancien} → ${nouveau}, écart de ${Math.round(ecart * 100)} % (appliqué)` });
  }
  // Une fiche qui a changé et porte un total écrit que la formule ne sait pas refaire : aucun de ses prix ne change (rien d'incohérent en ligne).
  for (const fichier of new Set(changements.map((c) => c.fichier))) {
    const { inconnus } = avant.get(fichier).totaux;
    if (!inconnus.length) continue;
    for (const c of changements.filter((c) => c.fichier === fichier)) { c.ligne.objet[c.ligne.champ] = c.ancien; gardes.push({ key: c.key, ancien: c.ancien, motif: `fiche avec un total écrit non recalculable (${inconnus.join(", ")}) : prix du fichier gardé, à relire` }); }
    for (let i = changements.length - 1; i >= 0; i--) if (changements[i].fichier === fichier) changements.splice(i, 1);
    for (let i = alertes.length - 1; i >= 0; i--) if (alertes[i].fichier === fichier) alertes.splice(i, 1);
  }
  const touches = new Set(changements.map((c) => c.fichier));
  for (const fichier of touches) {
    const j = fichiers[fichier];
    const a = avant.get(fichier);
    // 1. Le prix d'appel suit sa ligne ; « From 1,000 THB » suit le prix d'appel.
    if (a.appel && a.appel.ligne.amount !== a.from) {
      j.price.from = a.appel.ligne.amount;
      const re = new RegExp(`(\\bfrom[\\s\\u00a0]+)(${montant(a.from).replace(/,/g, ",?")})(?=[\\s\\u00a0]?THB)`, "gi");
      const vus = [];
      const parcours = (o, chemin) => { for (const [k, v] of Object.entries(o)) { if (TEXTES_IGNORES.has(k)) continue; const c = chemin ? `${chemin}.${k}` : k; if (typeof v === "string") { const s2 = v.replace(re, `$1${montant(j.price.from)}`); if (s2 !== v) { o[k] = s2; vus.push(c); } } else if (v && typeof v === "object") parcours(v, c); } };
      parcours(j, "");
      for (const champ of vus) textes.push({ fichier, ancien: a.from, nouveau: j.price.from, champ });
      const plusBas = (j.options || []).flatMap((o) => (o.prices || []).filter((r) => adulte(r) && r.label === a.appel.ligne.label && r.amount < j.price.from));
      if (plusBas.length) alertes.push({ key: "price.from", fichier, motif: `à relire : prix d'appel ${j.price.from}, une ligne « ${a.appel.ligne.label} » d'une autre option est à ${Math.min(...plusBas.map((r) => r.amount))}` });
    }
    // 2. Les autres montants cités, sauf si une autre ligne de la fiche garde ce montant.
    const restes = new Set(toutes.filter((l) => l.fichier === fichier).map((l) => l.objet[l.champ]));
    const parAncien = new Map();
    for (const c of changements.filter((c) => c.fichier === fichier)) parAncien.set(c.ancien, [...(parAncien.get(c.ancien) || []), c.nouveau]);
    for (const [ancien, nouveaux] of parAncien) {
      if (restes.has(ancien) || new Set(nouveaux).size > 1) { textes.push({ fichier, ancien, motif: "montant cité non changé : une autre ligne garde ce montant ou il se sépare en deux" }); continue; }
      for (const champ of remplacerTextes(j, ancien, nouveaux[0])) textes.push({ fichier, ancien, nouveau: nouveaux[0], champ });
    }
    // 3. Les totaux écrits, recalculés avec la formule vérifiée avant le remplacement.
    for (const t of a.totaux.connus) {
      const v = lireChemin(j, t.chemin);
      const total = t.base.amount + t.sup.amount * (t.n - t.base.group.max);
      const s2 = v.replace(TOTAL, `Each extra person adds ${montant(t.sup.amount)} THB, so a group of ${t.n} pays ${montant(total)} THB`);
      if (s2 !== v) ecrireChemin(j, t.chemin, s2);
      alertes.push({ key: t.chemin, fichier, motif: `à relire : total écrit recalculé, un groupe de ${t.n} paie ${montant(total)} THB` });
    }
  }
  for (const c of changements) delete c.ligne;
  return { changements, gardes, textes, alertes, fichiers: [...touches].sort() };
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
    for (const a of rep.alertes) log(`  ${a.fichier} ${a.key} : ${a.motif}`);
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
