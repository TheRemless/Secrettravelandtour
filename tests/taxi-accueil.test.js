// Bloc taxi de l'accueil, « plafond éclairé » (choix de Jérémy, 23.11.2026). Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const home = fs.readFileSync(path.join(root, "_site", "index.html"), "utf8");
const block = (home.match(/<section class="tx tx-a"[\s\S]*?<\/section>/) || [""])[0];
const { routes, ferry, meet } = require("../src/_data/taxiPages.js")();
const esc = (t) => t.replace(/&/g, "&amp;");

test("le bloc taxi est sur l'accueil, avec la photo du plafond et le logo de VIP Taxi Lanta", () => {
  assert.ok(block, "bloc .tx-a absent");
  assert.match(block, /<img [^>]*alt="Lit ceiling with gold patterns[^"]*"/);
  assert.match(block, /<img [^>]*alt="VIP Taxi Lanta logo"/);
  assert.match(block, /href="\/taxi\/"/);
});

test("les trois trajets affichent le prix de la grille VIP (taxiPages.js)", () => {
  const links = [...block.matchAll(/<a href="(\/taxi\/[^"]+\/)"[^>]*>[\s\S]*?<\/a>/g)];
  assert.strictEqual(links.length, 3);
  for (const [a, href] of links) {
    const r = routes.find((x) => x.url === href);
    assert.ok(r && r.price, "trajet sans prix : " + href);
    assert.ok(a.includes(r.price.thb.toLocaleString("en-US") + " THB"), "prix faux : " + href);
  }
  assert.match(block, new RegExp(`See all ${routes.length} routes`));
});

test("les faits viennent des textes de /taxi/ (ferry, accueil à l'aéroport, places)", () => {
  for (const t of [ferry.text, meet.text]) assert.ok(block.includes(esc(t)), "fait absent : " + t);
  assert.match(block, /6 to 8 seats depending on luggage\./);
});

test("plus d'interrupteur de variantes ni d'ancienne colonne Private transfers", () => {
  assert.ok(!/TAXI_VARIANT|tx tx-[bc]"|data-board|road__/.test(home));
  assert.ok(!/id="tr-h"/.test(home));
});

test("le mouvement de la photo respecte prefers-reduced-motion", () => {
  const css = fs.readFileSync(path.join(root, "src", "css", "v4.css"), "utf8");
  const i = css.indexOf("tx-lights");
  assert.ok(i > 0);
  assert.ok(css.lastIndexOf("@media (prefers-reduced-motion: no-preference)", i) > css.indexOf(".tx-a {"));
});
