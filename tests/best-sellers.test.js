// Badges « Best seller » (22.11.2026) : la liste ne porte que des ids d'options existantes, une par fiche, sans chiffre.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const DATA = path.join(__dirname, "..", "src", "_data");
const raw = fs.readFileSync(path.join(DATA, "bestSellers.json"), "utf8");
const best = JSON.parse(raw).options;
const fiche = (slug) => ["tours", "activities"].map((d) => path.join(DATA, "products", d, slug + ".json")).find((p) => fs.existsSync(p));

test("chaque option badgée existe sur sa fiche", () => {
  for (const [slug, id] of Object.entries(best)) {
    const p = fiche(slug);
    assert.ok(p, "fiche introuvable : " + slug);
    const ids = JSON.parse(fs.readFileSync(p, "utf8")).options.map((o) => o.id);
    assert.ok(ids.includes(id), `${slug} : option ${id} introuvable`);
  }
});

test("la liste ne contient aucun chiffre (ni prix, ni net, ni commission)", () => {
  assert.doesNotMatch(raw.replace(/"(4-islands)"/g, ""), /\d/);
});
