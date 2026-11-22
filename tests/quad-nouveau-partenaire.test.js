// Quad : nouveau partenaire le 22.11.2026 (tarif et flyer transmis par Jérémy). Il fait le 30 minutes, le 1 heure et le
// nouveau 2 heures (Lung Sod Beach et Siri Lanta Bridge), quads de 250 cc (le flyer dit 150 cc, c'est périmé). La formule
// quad + kayak reste chez l'ancien partenaire, avec sa propre photo sur sa carte d'option. Aucun nom de partenaire, ni
// téléphone, adresse ou licence des brochures. Lancer `npm run build` avant.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const KEYS = require("../src/_data/gestion-keys.json");
const PHOTOS = require("../src/_data/photos-v3.json").photos;

const root = path.join(__dirname, "..");
const atv = JSON.parse(fs.readFileSync(path.join(root, "src/_data/products/activities/atv.json"), "utf8"));
const page = fs.readFileSync(path.join(root, "_site/tours/atv/index.html"), "utf8");
const text = page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const INTERDITS = /tiger|lanta atv|atv adventure|466.?7887|160.?7249|777.?5358|684.?958|pareena|33\/07935|33\/11367|344 moo|299 moo|354 moo|khun aek|nittaya/i;

const PRIX = {
  "track-30-min": [1200, 900, 900, 600],
  "forest-1-hr": [1800, 1300, 1500, 1000],
  "beach-bridge-2-hr": [2500, 1800, 2200, 1500],
  "atv-kayak-2-hr": [2800, 2000, 2500, 1700]
};

test("quatre options aux prix de vente des brochures, dans l'ordre 30 min, 1 h, 2 h, quad + kayak", () => {
  assert.deepEqual(atv.options.map((o) => o.id), Object.keys(PRIX));
  for (const o of atv.options) assert.deepEqual(o.prices.map((r) => r.amount), PRIX[o.id], o.id);
  assert.equal(atv.price.from, 1200);
});

test("âges : prix enfant de 4 à 12 ans ; sur quad + kayak, enfant pilote de 6 à 12 ans", () => {
  for (const o of atv.options) {
    const rider = o.prices.find((r) => r.label === "Child rider");
    const pass = o.prices.find((r) => r.label === "Child passenger");
    assert.deepEqual(rider.ages, { min: o.id === "atv-kayak-2-hr" ? 6 : 4, max: 12 }, o.id);
    assert.deepEqual(pass.ages, { min: 4, max: 12 }, o.id);
  }
});

test("250 cc partout, jamais la cylindrée du flyer", () => {
  // Les sources (notes internes, jamais affichées) citent le flyer ; tout le reste dit 250 cc.
  const shown = JSON.stringify({ ...atv, sources: [] });
  assert.match(shown, /250 cc/);
  assert.doesNotMatch(shown, /150 ?cc/i);
  assert.match(text, /250 cc/);
  assert.doesNotMatch(text, /150 ?cc/i);
});

test("la page ne nomme aucun partenaire et ne reprend aucun contact des brochures", () => {
  assert.doesNotMatch(text, INTERDITS);
  assert.doesNotMatch(JSON.stringify(atv.options), INTERDITS);
});

test("chaque ligne de prix a sa clé Gestion ; quad + kayak garde les tarifs de l'ancien partenaire", () => {
  for (const o of atv.options) for (const r of o.prices) assert.ok(KEYS[`atv|${o.label}|${r.label}`], `${o.label} / ${r.label}`);
  assert.equal(KEYS["atv|1 hour of ATV and 1 hour of kayak|Adult rider"].prestation, "2d5e7b44-47b2-5482-a65c-ac4f3479deb2");
  assert.equal(KEYS["atv|30 minutes on a closed track|Adult rider"].prestation, "423ac437-5ee2-46f5-878a-d04c49a8a76a");
});

test("photos : galerie et photo du haut du nouveau partenaire, photo de l'ancien seulement sur la carte quad + kayak", () => {
  const kayak = atv.options.find((o) => o.id === "atv-kayak-2-hr");
  assert.equal(kayak.photo, "opt-atv-kayak");
  assert.equal(PHOTOS.find((p) => p.id === "opt-atv-kayak").file, "secret/v3/atv-riders.jpg");
  assert.ok(atv.options.filter((o) => o.photo).length === 1);
  for (const id of ["card-atv", "gal-atv-water-splash", "gal-atv-forest-trail", "gal-atv-practice-track", "gal-atv-child-front", "gal-atv-sand-splash"]) {
    const p = PHOTOS.find((x) => x.id === id);
    assert.ok(p && /Facebook du partenaire quad/.test(p.source), id);
  }
  // La photo de l'option est dans le bloc de l'option quad + kayak, pas dans la galerie.
  const block = page.match(/<div class="po po--grid po--ph" data-po="atv-kayak-2-hr">([\s\S]*?)<\/div>\s*<\/div>/);
  assert.ok(block, "bloc de l'option quad + kayak avec sa photo");
  const alt = PHOTOS.find((p) => p.id === "opt-atv-kayak").alt;
  assert.ok(block[1].includes(alt));
  assert.ok(!page.replace(block[0], "").includes(alt), "la photo de l'ancien partenaire n'est que sur sa carte");
});
