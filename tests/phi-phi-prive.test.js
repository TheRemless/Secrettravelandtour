// Koh Phi Phi en longtail privé (12.11.2026), sur demande depuis le 18.11.2026 (haute saison) : aucun prix, programme du flyer,
// « Included » limité à ce que dit le flyer, une offre JSON-LD par option, clé Gestion. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const P = require("../src/_data/products/tours/koh-phi-phi.json");
const KEYS = require("../src/_data/gestion-keys.json");
const html = fs.readFileSync(path.join(ROOT, "_site", "tours", "koh-phi-phi", "index.html"), "utf8");
const priv = P.options.find((o) => o.id === "private-longtail");

test("l'option privée : sur demande en haute saison (18.11.2026), frais de parc en plus", () => {
  assert.equal(priv.kind, "private");
  assert.equal(priv.priceOnRequest, true);
  assert.equal(priv.prices, undefined);
  assert.deepEqual(priv.notIncludedFees.map((f) => f.amount), [400, 200, 40, 20]);
  assert.match(priv.note, /Children from 4 count/);
  assert.match(priv.note, /when the national park is open/i);
  assert.match(priv.note, /we send you the price on WhatsApp/);
});

test("le calculateur ne donne aucun total pour le privé, quelle que soit la taille du groupe", () => {
  const price = require(path.join(ROOT, "src", "js", "v4-price.js"));
  for (const [a, ages] of [[1, []], [5, []], [4, [3]], [6, []]]) assert.equal(price.estimate(priv, a, ages, []), null);
});

test("« Included » du privé : seulement ce que dit le flyer ; les éléments du speedboat restent sous leur titre", () => {
  assert.deepEqual(P.includedByOption["private-longtail"], ["Hotel pickup and return, by car or by boat", "Thai buffet lunch on Bamboo Island", "Snorkelling at the stops in the programme"]);
  const block = html.split('id="inc-h"')[1].split("</section>")[0];
  const [shared, own] = block.split('<h4 class="inc__for">Private longtail</h4>');
  assert.match(shared, /<h4 class="inc__for">Day trip<\/h4>/);
  assert.match(shared, /Masks, snorkels and life jackets/);
  assert.match(shared, /Light breakfast at the pier on the day trip/);
  assert.doesNotMatch(own.split("Not included")[0], /Masks|breakfast|Guide|Insurance|life jackets/i);
  assert.match(own, /Thai buffet lunch on Bamboo Island/);
});

test("le programme du privé a ses horaires approximatifs et la mention de la marée et de la météo", () => {
  const b = P.day.find((x) => x.options.join() === "private-longtail");
  assert.deepEqual(b.steps.map((s) => s.time), ["08:00", "09:00", "10:00", "12:00", "13:30", "14:15"]);
  assert.match(b.note, /approximate/);
  assert.match(b.note, /tide and the weather/);
  assert.match(html, /Times are approximate\. The programme can change with the tide and the weather\./);
});

test("annulation : 12 heures pour les deux formules, sur la fiche et sur /cancellation/", () => {
  assert.match(P.beforeYouBook.cancellation, /^Day trip and private longtail: .*at least 12 hours/);
  const page = fs.readFileSync(path.join(ROOT, "_site", "cancellation", "index.html"), "utf8");
  assert.match(page, /Day trip and private longtail: tell us at least 12 hours before departure/);
});

test("JSON-LD : une offre par option à prix, aucune pour le privé sur demande, aucun nom de prestataire", () => {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
  const trip = ld.flatMap((b) => (b["@graph"] ? b["@graph"] : [b])).find((x) => x["@type"] === "TouristTrip");
  const offers = trip.offers;
  // Petit groupe au coucher du soleil (brochure du 17.11.2026) : troisième offre, entre le join-in et le privé.
  assert.equal(offers.length, 2);
  assert.deepEqual(offers.map((o) => [o.name, o.priceSpecification.minPrice]), [["Day trip", 2000], ["Full-day sunset trip", 3900]]);
  assert.doesNotMatch(JSON.stringify(trip), /Private longtail|9,?400/);
  assert.doesNotMatch(JSON.stringify(P) + html, /monkey lanta|monkey-lanta|\+66 ?95 ?540|3179|rattana/i);
});

test("contrôle mensuel : plus de clé pour le privé, son groupe Gestion est déclaré hors site", () => {
  assert.ok(!Object.keys(KEYS).some((k) => k.startsWith("koh-phi-phi|Private longtail|")));
  const hors = require("../src/_data/gestion-hors-site.json");
  assert.ok(hors.regles.some((r) => r.groupe === "Private Koh Phi Phi charter" && /18\.11\.2026/.test(r.raison)));
});
