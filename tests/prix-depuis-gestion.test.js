// Prix de vente de Gestion au build (scripts/prix-depuis-gestion.mjs, 22.11.2026) : mêmes lignes que le contrôle mensuel, remplacement
// des seules lignes reliées, garde-fous, source muette sans échec ni prix vide, et comparaison du résultat avec les prix de Gestion.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "src", "_data");
const charger = () => import("../scripts/prix-depuis-gestion.mjs");
const keysReelles = () => JSON.parse(fs.readFileSync(path.join(DATA, "gestion-keys.json"), "utf8"));
const copie = (o) => JSON.parse(JSON.stringify(o));

// Une copie de src/_data dans un dossier temporaire : le test écrit dedans, jamais dans le dépôt.
function dataTemporaire() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stt-prix-"));
  fs.cpSync(path.join(DATA, "products"), path.join(dir, "products"), { recursive: true });
  for (const f of ["gestion-keys.json", "krabiDayTrip.json"]) fs.copyFileSync(path.join(DATA, f), path.join(dir, f));
  return dir;
}

// Prix de Gestion simulés : chaque tarif relié, +10 % arrondi à la centaine (sous le garde-fou du double).
function gestionSimulee(fichiers, keys, L) {
  const prix = new Map();
  for (const l of L.lignes(fichiers)) { const k = keys[l.key]; if (k && k.prestation && !prix.has(k.prestation)) prix.set(k.prestation, `${Math.round((l.objet[l.champ] * 1.1) / 100) * 100}.00`); }
  return prix;
}

test("mêmes lignes et mêmes clés que le contrôle mensuel (siteRows de prix-gestion.mjs)", async () => {
  const L = await charger();
  const { siteRows } = await import("../scripts/prix-gestion.mjs");
  const fichiers = L.chargerFichiers(DATA);
  assert.deepEqual(L.lignes(fichiers).map((l) => [l.key, l.objet[l.champ]]), siteRows().map((r) => [r.key, r.amount]));
  const ids = L.tarifsDemandes(fichiers, keysReelles());
  assert.ok(ids.length > 50 && ids.every((id) => /^[0-9a-f-]{36}$/.test(id)), "seuls des identifiants de tarifs partent vers Gestion");
});

test("comparaison : après le build, chaque ligne reliée porte le prix de Gestion, les autres gardent le prix du fichier", async () => {
  const L = await charger();
  const keys = keysReelles();
  const avant = L.chargerFichiers(DATA);
  const fichiers = copie(avant);
  const prix = gestionSimulee(avant, keys, L);
  const rep = L.appliquer({ fichiers, keys, prix });
  assert.ok(rep.changements.length > 50);
  const lAvant = L.lignes(avant);
  L.lignes(fichiers).forEach((l, i) => {
    const k = keys[l.key];
    const attendu = k && k.prestation && k.auto !== false ? Number(prix.get(k.prestation)) : lAvant[i].objet[lAvant[i].champ];
    assert.equal(l.objet[l.champ], attendu, l.key);
    assert.ok(Number.isInteger(l.objet[l.champ]) && l.objet[l.champ] > 0, `jamais un prix vide : ${l.key}`);
  });
  const chef = fichiers["products/activities/cooking-class.json"].options.find((o) => o.label === "Partner chef").prices.find((p) => p.label === "Per person");
  assert.equal(chef.amount, 1650, "Partner chef par personne : clé auto: false, tarif de Gestion au groupe de 2");
});

test("prix d'appel et textes suivent ; un montant partagé avec une ligne inchangée ne touche pas au texte", async () => {
  const L = await charger();
  const fiche = (o) => ({ "products/tours/t.json": { slug: "t", price: { from: 1000 }, seo: { metaDescription: "Boat trip. From 1,000 THB per adult." }, options: o, sources: [{ from: "1,000 THB" }], todo: ["TODO(client): 1,000 THB ?"] }, "products/rental.json": { slug: "rental", options: [] }, "krabiDayTrip.json": { slug: "krabi-day-trip", priceFrom: { thb: 3500 }, metaDescription: "From 3,500 THB per vehicle." } });
  const keys = { "t|A|Adult": { prestation: "a" }, "t|A|Child": { prestation: "b" }, "t|B|Adult": { prestation: "c" }, "taxi|krabi-day-trip|from": { prestation: "k" } };
  const f1 = fiche([{ label: "A", prices: [{ label: "Adult", amount: 1000 }, { label: "Child", amount: 800 }], note: "11,000 THB for the group, 1000 THB each." }]);
  const r1 = L.appliquer({ fichiers: f1, keys, prix: new Map([["a", "1200.00"], ["b", "800.00"], ["k", "3700"]]) });
  const t = f1["products/tours/t.json"];
  assert.equal(t.price.from, 1200);
  assert.equal(t.seo.metaDescription, "Boat trip. From 1,200 THB per adult.");
  assert.equal(t.options[0].note, "11,000 THB for the group, 1,200 THB each.", "11,000 n'est pas 1,000");
  assert.equal(t.sources[0].from, "1,000 THB", "les sources gardent l'historique");
  assert.equal(t.todo[0], "TODO(client): 1,000 THB ?");
  assert.equal(f1["krabiDayTrip.json"].priceFrom.thb, 3700);
  assert.equal(f1["krabiDayTrip.json"].metaDescription, "From 3,700 THB per vehicle.");
  assert.deepEqual(r1.fichiers, ["krabiDayTrip.json", "products/tours/t.json"]);

  const f2 = fiche([{ label: "A", prices: [{ label: "Adult", amount: 1000 }] }, { label: "B", prices: [{ label: "Adult", amount: 1000 }] }]);
  const r2 = L.appliquer({ fichiers: f2, keys, prix: new Map([["a", "1200.00"], ["c", "1000.00"]]) });
  assert.equal(f2["products/tours/t.json"].options[0].prices[0].amount, 1200);
  assert.equal(f2["products/tours/t.json"].price.from, 1000, "l'option B garde 1 000 : le prix d'appel ne bouge pas");
  assert.equal(f2["products/tours/t.json"].seo.metaDescription, "Boat trip. From 1,000 THB per adult.");
  assert.match(r2.textes[0].motif, /une autre ligne garde ce montant/);
});

test("garde-fous : tarif absent, prix inutilisable, plus du double ou moins de la moitié, clé sans prestation ou auto: false", async () => {
  const L = await charger();
  const fichiers = { "products/tours/t.json": { slug: "t", options: [{ label: "A", prices: ["a", "b", "c", "d", "e", "f", "g", "h"].map((x) => ({ label: x, amount: 2000 })) }] }, "products/rental.json": { slug: "rental", options: [] }, "krabiDayTrip.json": { slug: "k", priceFrom: { thb: 3500 } } };
  const keys = Object.fromEntries(["a", "b", "c", "d", "e", "f", "g"].map((x) => [`t|A|${x}`, { prestation: x }]));
  keys["t|A|f"] = { prestation: null, note: "hors Gestion" };
  keys["t|A|g"] = { prestation: "g", auto: false };
  const prix = new Map([["b", null], ["c", "0.00"], ["d", "4100.00"], ["e", "999.00"], ["f", "2500"], ["g", "2500"]]);
  const rep = L.appliquer({ fichiers, keys, prix });
  assert.deepEqual(rep.changements, []);
  assert.deepEqual(fichiers["products/tours/t.json"].options[0].prices.map((p) => p.amount), Array(8).fill(2000));
  assert.deepEqual(rep.gardes.map((g) => g.key), ["t|A|a", "t|A|b", "t|A|c", "t|A|d", "t|A|e"]);
  assert.match(rep.gardes[0].motif, /absent/);
  assert.match(rep.gardes[3].motif, /plus du double/);
  // Dans les bornes : 4 000 (double) et 1 000 (moitié) passent.
  const ok = L.appliquer({ fichiers, keys, prix: new Map([["a", "4000.00"], ["b", "1000"]]) });
  assert.deepEqual(ok.changements.map((c) => c.nouveau), [4000, 1000]);
});

test("lecture : seules les colonnes prestation et prix_vente sont acceptées ; toute autre forme est refusée", async () => {
  const L = await charger();
  const rep = (body, status = 200) => async (url, opts) => { rep.dernier = { url, opts }; return { ok: status < 300, status, json: async () => body }; };
  const id = "f7a3e657-dcc7-567c-a79d-fb8ea9a1f15c";
  const f = rep([{ prestation: id, prix_vente: 1000 }]);
  const prix = await L.lirePrix({ ids: [id], fetchFn: f });
  assert.equal(prix.get(id), 1000);
  assert.match(rep.dernier.url, /\/rest\/v1\/rpc\/prix_publics_site$/);
  assert.deepEqual(JSON.parse(rep.dernier.opts.body), { p_ids: [id] });
  assert.match(rep.dernier.opts.headers.apikey, /^eyJ/, "clé publique (anon) de Gestion, déjà servie par l'outil à tout navigateur");
  assert.equal(JSON.parse(Buffer.from(rep.dernier.opts.headers.apikey.split(".")[1], "base64url")).role, "anon", "jamais une clé de service");
  await assert.rejects(L.lirePrix({ ids: [id], fetchFn: rep([{ prestation: id, prix_vente: 1000, net: 600 }]) }), /colonnes inattendues/);
  await assert.rejects(L.lirePrix({ ids: [id], fetchFn: rep({ message: "x" }) }), /pas une liste/);
  await assert.rejects(L.lirePrix({ ids: [id], fetchFn: rep([], 404) }), /HTTP 404/);
});

test("source muette : le build garde les fichiers, l'écrit au journal et ne lève rien", async () => {
  const L = await charger();
  const dir = dataTemporaire();
  const avant = fs.readFileSync(path.join(dir, "products/tours/4-islands.json"), "utf8");
  for (const fetchFn of [async () => { throw Object.assign(new Error("timeout"), { name: "TimeoutError" }); }, async () => { throw new Error("getaddrinfo ENOTFOUND"); }, async () => ({ ok: false, status: 503, json: async () => ({}) }), async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("Unexpected token <"); } })]) {
    const lignes = [];
    const r = await L.principal({ env: { NETLIFY: "true" }, data: dir, fetchFn, log: (m) => lignes.push(m) });
    assert.equal(r.statut, "indisponible");
    assert.match(lignes.join("\n"), /source indisponible \(.+\) : le site garde les prix des fichiers\./);
  }
  assert.equal(fs.readFileSync(path.join(dir, "products/tours/4-islands.json"), "utf8"), avant);
  const coupe = await L.principal({ env: { STT_PRIX_GESTION: "0" }, data: dir, fetchFn: async () => { throw new Error("ne doit pas être appelé"); }, log: () => {} });
  assert.equal(coupe.statut, "coupe");
});

test("Netlify écrit les fichiers du build, le poste de travail et la CI lisent seulement ; le script sort toujours avec 0", async () => {
  const L = await charger();
  const dir = dataTemporaire();
  const keys = JSON.parse(fs.readFileSync(path.join(dir, "gestion-keys.json"), "utf8"));
  const idAdulte = keys["koh-phi-phi|Day trip|Adult"].prestation;
  const serveur = http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { const ids = JSON.parse(b).p_ids; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(ids.includes(idAdulte) ? [{ prestation: idAdulte, prix_vente: 2200 }] : [])); }); });
  await new Promise((r) => serveur.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${serveur.address().port}`;
  try {
    const fichier = path.join(dir, "products/tours/koh-phi-phi.json");
    const lu = await L.principal({ env: { GESTION_SUPABASE_URL: url }, data: dir, log: () => {} });
    assert.equal(lu.mode, "lire");
    assert.equal(JSON.parse(fs.readFileSync(fichier, "utf8")).options[0].prices[0].amount, 2000, "mode lecture : rien n'est écrit");
    const ecrit = await L.principal({ env: { NETLIFY: "true", GESTION_SUPABASE_URL: url }, data: dir, log: () => {} });
    assert.equal(ecrit.mode, "ecrire");
    const j = JSON.parse(fs.readFileSync(fichier, "utf8"));
    assert.equal(j.options[0].prices[0].amount, 2200);
    assert.equal(j.price.from, 2200);
    assert.match(j.seo.metaDescription, /Join-in from 2,200 THB\./);
    assert.ok(ecrit.gardes.length > 0, "les tarifs que Gestion ne rend pas gardent leur prix et sont nommés au journal");
    // Le script lancé seul : code 0, même quand Gestion ne répond pas (adresse fermée).
    const { spawnSync } = require("node:child_process");
    const p = spawnSync(process.execPath, [path.join(ROOT, "scripts/prix-depuis-gestion.mjs")], { env: { ...process.env, NETLIFY: "", STT_PRIX_GESTION: "lire", GESTION_SUPABASE_URL: "http://127.0.0.1:9" }, encoding: "utf8" });
    assert.equal(p.status, 0);
    assert.match(p.stdout, /\[prix Gestion\] source indisponible/);
  } finally { serveur.close(); }
});

test("npm run build lit les prix de Gestion avant Eleventy", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.match(pkg.scripts.build, /^node scripts\/prix-depuis-gestion\.mjs && eleventy /);
});
