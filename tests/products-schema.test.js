// Données produit de la refonte (src/_data/products/** et site.json) : structure, faits repris
// de l'ancien site sans perte, aucun nom de prestataire, aucune affirmation fausse sur les frais de parc.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const DATA = path.join(__dirname, "..", "src", "_data");
const DIR = path.join(DATA, "products");
const IMAGES = path.join(__dirname, "..", "src", "images");

const FOLDERS = { tours: "boat", activities: "activity", "": "rental", "secret-transfers": "transfer", taxi: "route" };
const BRANDS = ["secret", "vip"];
const STATUS = ["keep", "replace", "missing"];
const BYB = ["pickup", "bring", "children", "health", "weather", "payment", "cancellation"];
// Pages existantes ou prévues (décisions client du 02.11.2026) vers lesquelles related[] peut pointer.
const PLANNED = ["/", "/tours/", "/transfers/", "/taxi/", "/about/", "/contact/", "/faq/"];
// Même liste que tests/partenaires.test.js.
const PARTENAIRES = /rattana|lacha ?ru|sukho|lanta ?atv|atv adventure|lanta elephant|lanta longtail|lanta batik|lanta kayaking|lanta ?e-?gokart|noom|bundhaya|satun|pakbara|blue ?planet|octopusea/i;

function load() {
  const out = [];
  for (const folder of Object.keys(FOLDERS)) {
    const dir = path.join(DIR, folder);
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
      out.push({ folder, name, rel: path.join(folder, name), data: JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) });
    }
  }
  return out;
}
const files = load();

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isAges = (a) => a && typeof a === "object" && Object.keys(a).every((k) => ["min", "max"].includes(k) && Number.isInteger(a[k]) && a[k] >= 0) && (a.min === undefined || a.max === undefined || a.min <= a.max) && Object.keys(a).length > 0;

// Parcourt toutes les valeurs : pas de null, pas de chaîne ni de tableau vide (« absent quand inconnu »).
function walk(value, where, visit) {
  visit(value, where);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${where}[${i}]`, visit));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, `${where}.${k}`, visit);
}

test("produits : 27 fichiers dans les bons dossiers", () => {
  const count = (f) => files.filter((x) => x.folder === f).length;
  assert.equal(count("tours"), 6);
  assert.equal(count("activities"), 7);
  assert.equal(count(""), 1);
  assert.equal(count("secret-transfers"), 2);
  assert.equal(count("taxi"), 11);
});

test("produits : champs obligatoires, marque, gabarit et slug cohérents", () => {
  const urls = new Set();
  for (const { folder, name, rel, data: p } of files) {
    assert.equal(p.slug, name.replace(/\.json$/, ""), rel);
    assert.match(p.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, rel);
    assert.equal(p.template, FOLDERS[folder], rel);
    assert.ok(BRANDS.includes(p.brand), rel);
    assert.equal(p.brand, folder === "taxi" ? "vip" : "secret", rel);
    assert.match(p.url, /^\/([a-z0-9-]+\/)*$/, rel);
    assert.ok(!urls.has(p.url), `${rel} : URL en double ${p.url}`);
    urls.add(p.url);
    for (const k of ["name", "h1", "lead"]) assert.ok(isStr(p[k]), `${rel} : ${k}`);
    assert.ok(p.seo && isStr(p.seo.title) && isStr(p.seo.metaDescription), `${rel} : seo`);
    if ("ogImage" in p.seo) assert.ok(isStr(p.seo.ogImage), `${rel} : seo.ogImage`);
    assert.ok(Array.isArray(p.facts) && p.facts.length > 0, `${rel} : facts`);
    for (const f of p.facts) assert.ok(isStr(f.label) && isStr(f.value) && Object.keys(f).length === 2, `${rel} : fact ${JSON.stringify(f)}`);
    assert.ok(Array.isArray(p.sources) && p.sources.length > 0, `${rel} : sources`);
    for (const s of p.sources) assert.ok(isStr(s.field) && isStr(s.from), `${rel} : source`);
    assert.ok(p.schema && isStr(p.schema.type), `${rel} : schema.type`);
    assert.notEqual(p.schema.type, "TouristAttraction", `${rel} : TouristAttraction proscrit (02-audit-seo §6.3)`);
  }
});

test("produits : aucune valeur nulle, vide ou tableau vide", () => {
  for (const { rel, data } of files) {
    walk(data, rel, (v, where) => {
      assert.notEqual(v, null, `${where} est null : laisser le champ absent`);
      if (typeof v === "string") assert.ok(v.trim().length > 0, `${where} est vide`);
      if (Array.isArray(v)) assert.ok(v.length > 0, `${where} est un tableau vide`);
    });
  }
});

test("produits : prix d'appel ou « Price on WhatsApp », jamais les deux", () => {
  for (const { rel, data: p } of files) {
    assert.ok(Boolean(p.price) !== Boolean(p.priceOnRequest), `${rel} : price XOR priceOnRequest`);
    if (p.priceOnRequest) assert.equal(p.priceOnRequest, true, rel);
    if (p.price) {
      assert.ok(Number.isInteger(p.price.from) && p.price.from > 0, `${rel} : price.from`);
      assert.equal(p.price.currency, "THB", rel);
      assert.ok(isStr(p.price.unit), `${rel} : price.unit`);
      const amounts = (p.options || []).flatMap((o) => (o.prices || []).map((r) => r.amount));
      assert.ok(amounts.includes(p.price.from), `${rel} : price.from absent des options`);
    }
  }
});

test("produits : options, lignes de prix, âges et frais non inclus", () => {
  for (const { rel, data: p } of files) {
    if (!p.options) continue;
    const ids = p.options.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, `${rel} : id d'option en double`);
    for (const o of p.options) {
      const where = `${rel} > ${o.id}`;
      assert.match(o.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, where);
      assert.ok(isStr(o.label), where);
      if (o.ages) assert.ok(isAges(o.ages), `${where} : ages`);
      assert.ok(Boolean(o.prices) !== Boolean(o.priceOnRequest), `${where} : prices XOR priceOnRequest`);
      for (const r of o.prices || []) {
        assert.ok(isStr(r.label), where);
        assert.ok((Number.isInteger(r.amount) && r.amount >= 0) !== isStr(r.text), `${where} : ${r.label} amount XOR text`);
        if (r.ages) assert.ok(isAges(r.ages), `${where} : ${r.label} ages`);
        if (r.group) assert.ok(isAges(r.group), `${where} : ${r.label} group`);
      }
      for (const f of o.notIncludedFees || []) {
        assert.ok(isStr(f.label) && (Number.isInteger(f.amount) || isStr(f.text)), `${where} : frais ${JSON.stringify(f)}`);
      }
    }
  }
});

test("produits : déroulé relié à des options existantes, heures au format 24 h", () => {
  for (const { rel, data: p } of files) {
    for (const block of p.day || []) {
      const ids = (p.options || []).map((o) => o.id);
      for (const id of block.options || []) assert.ok(ids.includes(id), `${rel} : day vers une option inconnue ${id}`);
      assert.ok(Array.isArray(block.steps) && block.steps.length, `${rel} : day.steps`);
      for (const s of block.steps) {
        assert.ok(isStr(s.text), `${rel} : étape sans texte`);
        if (s.time) assert.match(s.time, /^([01]\d|2[0-3]):[0-5]\d$/, `${rel} : ${s.time}`);
      }
    }
  }
});

test("produits : inclus, before you book, FAQ", () => {
  for (const { rel, data: p } of files) {
    for (const k of ["included", "notIncluded"]) if (p[k]) for (const s of p[k]) assert.ok(isStr(s), `${rel} : ${k}`);
    if (p.beforeYouBook) {
      for (const [k, v] of Object.entries(p.beforeYouBook)) {
        assert.ok(BYB.includes(k), `${rel} : beforeYouBook.${k} inconnu`);
        assert.ok(isStr(v) || (Array.isArray(v) && v.every(isStr)), `${rel} : beforeYouBook.${k}`);
      }
    }
    for (const f of p.faq || []) assert.ok(isStr(f.q) && isStr(f.a), `${rel} : FAQ`);
  }
});

test("produits : photos avec statut, fichier existant pour keep et replace", () => {
  for (const { rel, data: p } of files) {
    for (const ph of p.photos || []) {
      assert.ok(isStr(ph.slot) && STATUS.includes(ph.status), `${rel} : photo ${JSON.stringify(ph)}`);
      if (ph.status === "missing") assert.ok(!ph.file && isStr(ph.shot), `${rel} : photo manquante sans description`);
      else assert.ok(fs.existsSync(path.join(IMAGES, ph.file)), `${rel} : ${ph.file} introuvable`);
    }
  }
});

test("produits : related pointe vers une page produit ou une page prévue", () => {
  const urls = new Set(files.map((f) => f.data.url).concat(PLANNED));
  for (const { rel, data: p } of files) {
    for (const u of p.related || []) assert.ok(urls.has(u), `${rel} : related inconnu ${u}`);
    assert.ok(!(p.related || []).includes(p.url), `${rel} : se cite lui-même`);
  }
});

test("produits : TODO(client) bien formés", () => {
  for (const { rel, data: p } of files) {
    for (const t of p.todo || []) assert.match(t, /^TODO\(client\): \S/, rel);
  }
});

test("produits : toutes les pages /tours/ actuelles sont reprises", () => {
  const content = require("../src/_data/secretPagesContent.json");
  const urls = new Set(files.map((f) => f.data.url));
  for (const id of Object.keys(content.pages)) assert.ok(urls.has(`/tours/${id}/`), id);
  assert.equal(Object.keys(content.pages).length, 15);
});

test("produits : les 17 trajets taxi sont repris (10 pages Koh Lanta + 7 regroupés)", () => {
  const old = require("../src/_data/taxiRoutes.json").routes;
  const taxi = files.filter((f) => f.folder === "taxi").map((f) => f.data);
  const south = taxi.find((p) => p.slug === "southern-thailand");
  const own = taxi.filter((p) => p !== south);
  assert.equal(own.length, 10);
  assert.equal(south.routes.length, 7);
  for (const r of old) {
    const page = own.find((p) => p.slug === r.id);
    const grouped = south.routes.find((x) => x.id === r.id);
    assert.ok(Boolean(page) !== Boolean(grouped), r.id);
    const facts = page ? page.route : grouped;
    assert.equal(facts.from, r.from, r.id);
    assert.equal(facts.to, r.to, r.id);
    if (r.drive) assert.equal(facts.drive, r.drive, r.id);
    if (grouped) assert.equal(grouped.legacyUrl, `/taxi/${r.id}/`, r.id);
    // Aucun des 7 trajets regroupés ne touche Koh Lanta, les 10 autres oui.
    assert.equal(/Koh Lanta/.test(`${r.from} ${r.to}`), Boolean(page), r.id);
  }
  for (const p of own) assert.ok(p.route && isStr(p.route.from) && isStr(p.route.to) && p.route.points.length, p.slug);
});

test("produits : tous les prix de l'ancien site sont repris à l'identique", () => {
  const content = require("../src/_data/secretPagesContent.json");
  const byUrl = Object.fromEntries(files.map((f) => [f.data.url, f.data]));
  for (const [id, page] of Object.entries(content.pages)) {
    const p = byUrl[`/tours/${id}/`];
    const rows = (p.options || []).flatMap((o) => (o.prices || []).map((r) => `${o.label}|${r.label}|${r.amount !== undefined ? r.amount : r.text}`));
    for (const g of page.prices || []) {
      for (const r of g.rows) {
        const m = /^\+?([\d,]+) THB$/.exec(r.price);
        const value = m ? Number(m[1].replace(/,/g, "")) : r.price === "Free" ? 0 : r.price;
        assert.ok(rows.includes(`${g.title}|${r.label}|${value}`), `${id} : ${g.title} / ${r.label}`);
      }
    }
  }
});

test("produits et site.json : aucun nom de prestataire, aucun tarif interne, pas de fausse règle sur les frais de parc", () => {
  const all = files.map((f) => JSON.stringify(f.data)).join("\n") + fs.readFileSync(path.join(DATA, "site.json"), "utf8");
  assert.doesNotMatch(all, PARTENAIRES);
  assert.doesNotMatch(all, /commission|net price|agent price|selling price|contract rate/i);
  assert.doesNotMatch(all, /never included by any boat operator|No operator on Koh Lanta includes it/i);
  assert.doesNotMatch(all, /\bour (long-?tail|speedboat|boat)s?\b/i);
});

test("site.json : deux marques, WhatsApp commun, note VIP datée, licence encore absente", () => {
  const site = require("../src/_data/site.json");
  assert.equal(site.whatsapp.number, "66958683846");
  assert.equal(site.operator.name, "Zwald Travel Planner Co., Ltd.");
  for (const b of BRANDS) assert.ok(isStr(site.brands[b].name) && isStr(site.brands[b].url), b);
  const s = site.brands.secret;
  assert.ok(s.licence === null || isStr(s.licence));
  assert.equal(s.email, null);
  assert.equal(s.googleRating, null);
  const r = site.brands.vip.rating;
  assert.equal(typeof r.value, "number");
  assert.ok(Number.isInteger(r.count) && r.count > 0);
  assert.match(r.readOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(r.url, /^https:\/\//);
  // Délai de réponse et langues retirés le 03.11.2026 (faits à reconfirmer) : rien ne s'affiche tant qu'ils sont null.
  assert.equal(site.replyTime, null);
  assert.equal(site.languages, null);
  for (const t of site.todo) assert.match(t, /^TODO\(client\): \S/);
  for (const b of BRANDS) {
    for (const ph of site.brands[b].photos || []) {
      assert.ok(STATUS.includes(ph.status), ph.slot);
      if (ph.file) assert.ok(fs.existsSync(path.join(IMAGES, ph.file)), ph.file);
    }
  }
});
