// Sortie au coucher du soleil en longtail privé puis kayak au plancton (brochure du 23.11.2026).
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const P = require("../src/js/v4-price.js");
const product = require("../src/_data/products/tours/sunset-plankton-kayak.json");
const { groupOf } = require("../src/_includes/components/groups.js");

const opt = product.options[0];
const total = (a, k) => (P.estimate(opt, a, k) || {}).total;

test("plancton : 6 000 pour 1 à 4, adulte en plus 1 200, enfant de 4 à 11 ans en plus 600", () => {
  assert.equal(total(1, []), 6000);
  assert.equal(total(4, []), 6000);
  assert.equal(total(2, [6, 8]), 6000);
  assert.equal(total(5, []), 7200);
  assert.equal(total(4, [6]), 6600);
  assert.equal(total(4, [13]), 7200, "un enfant de 12 ans ou plus paie l'adulte");
  assert.equal(total(2, [2]), 6000, "moins de 4 ans : gratuit (Jérémy, 26.11.2026)");
  assert.equal(P.estimate(opt, 3, [6, 8]), null, "qui est « en plus » n'est pas écrit : prix sur WhatsApp");
});

test("plancton : fiche du groupe mangrove, page avec prix, déroulé et galerie", () => {
  assert.equal((groupOf("sunset-plankton-kayak") || {}).id, "mangrove");
  const html = fs.readFileSync(path.join(__dirname, "..", "_site", "tours", "sunset-plankton-kayak", "index.html"), "utf8");
  for (const s of ["6,000", "1,200", "600", "16:30", "20:00", "Ko Kwang", "flower garlands", "sharing a meal", "Children under 4 come free"]) assert.ok(html.includes(s), s);
});
