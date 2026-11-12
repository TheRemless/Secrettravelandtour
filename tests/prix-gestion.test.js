// Contrôle mensuel des prix, site et Gestion (scripts/prix-gestion.mjs, 12.11.2026) : chaque ligne de prix du site a une clé,
// le contrôle voit un écart, une prestation inactive ou disparue, une prestation sans page. Jeu de données écrit ici : le test
// ne lit jamais la base ni l'export.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const KEYS = require("../src/_data/gestion-keys.json");
const HORS = require("../src/_data/gestion-hors-site.json");
const load = () => import(pathToFileURL(path.join(__dirname, "..", "scripts", "prix-gestion.mjs")).href);

test("chaque ligne de prix du site (hors frais de parc) porte une clé vers Gestion", async () => {
  const { siteRows } = await load();
  const rows = siteRows();
  assert.ok(rows.length > 150, String(rows.length));
  const missing = rows.filter((r) => !KEYS[r.key]).map((r) => r.key);
  assert.ok(rows.some((r) => r.key === "taxi|koh-lanta-krabi-day-trip|from" && r.amount === 3500), "l'excursion vers Krabi est contrôlée");
  assert.deepEqual(missing, []);
  for (const [k, v] of Object.entries(KEYS)) {
    assert.ok(v.prestation === null ? Boolean(v.note) : /^[0-9a-f-]{36}$/.test(v.prestation), k);
  }
});

test("le contrôle sort les écarts, les prestations inactives ou disparues et les prestations sans page", async () => {
  const { controle } = await load();
  const site = [
    { key: "a", page: "/a/", label: "A", amount: 1000, approx: false },
    { key: "b", page: "/b/", label: "B", amount: 2000, approx: false },
    { key: "c", page: "/c/", label: "C", amount: 3000, approx: false },
    { key: "d", page: "/d/", label: "D", amount: 4000, approx: true },
    { key: "e", page: "/e/", label: "E", amount: 500, approx: false },
    { key: "f", page: "/f/", label: "F", amount: 700, approx: false }
  ];
  const keys = {
    a: { prestation: "p1", gestion: "A", aussi: ["p1b"] },
    b: { prestation: "p2", gestion: "B" },
    c: { prestation: "p3", gestion: "C" },
    d: { prestation: "p4", gestion: "D" },
    e: { prestation: "p-disparue", gestion: "E" },
    f: { prestation: null, gestion: null, note: "hors Gestion" }
  };
  const pr = (id, extra) => ({ id, partenaire: "P", famille: "activite", groupe: "G", libelle_en: id, prix_vente: "1000.00", unite: "pp", actif: true, ...extra });
  const prestations = [pr("p1"), pr("p1b"), pr("p2", { prix_vente: "2100.00" }), pr("p3", { actif: false, prix_vente: "3000.00" }), pr("p4", { prix_vente: null }), pr("p5"), pr("p6", { prix_vente: "0.00" }), pr("p7", { partenaire: "Masqué" })];
  const rep = controle({ site, keys, prestations, horsSite: { regles: [{ partenaire: "Masqué", raison: "x" }] } });
  const motifs = rep.ecarts.map((e) => `${e.key}:${e.motif.split(" ")[0]}`);
  assert.deepEqual(motifs.sort(), ["b:site", "c:prestation", "d:prix", "e:prestation"].sort());
  assert.deepEqual(rep.sansCle, []);
  assert.deepEqual(rep.sansPage.map((p) => p.id), ["p5"], "p1b est couverte par « aussi », p6 vaut 0, p7 est masquée");
  assert.equal(controle({ site: [{ key: "zz", page: "/z/", label: "Z", amount: 1, approx: false }], keys, prestations, horsSite: { regles: [] } }).sansCle.length, 1);
});

test("les prestations hors site portent une raison, jamais un prix", () => {
  for (const r of HORS.regles) assert.ok(r.raison && !/THB|baht|฿|prix_vente|amount/i.test(JSON.stringify(r)), JSON.stringify(r));
});
