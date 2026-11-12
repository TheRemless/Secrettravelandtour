// Page /cancellation/ et ligne « Cancellation » des fiches (12.11.2026) : une seule règle par fiche, la même sur la page et sur la fiche,
// aucun nom de prestataire, passeport Langkawi sur la page du speedboat. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SITE = path.join(__dirname, "..", "_site");
const html = (u) => fs.readFileSync(path.join(SITE, u, "index.html"), "utf8").replace(/&#39;/g, "'");
const C = require("../src/_data/cancellation.js")();
const site = require("../src/_data/site.json");
const PARTENAIRES = /rattana|lacha ?ru|sukho|lanta ?atv|atv adventure|lanta elephant|lanta longtail|lanta batik|lanta kayaking|lanta ?e-?gokart|noom|bundhaya|satun|pakbara speed|blue ?planet|octopusea|at lanta|mr\.? nan/i;

test("la page donne la règle de chaque fiche Secret, la même que la ligne Cancellation de la fiche, avec le lien vers la page", () => {
  const items = C.groups.flatMap((g) => g.items).filter((i) => i.slug !== "taxi");
  assert.ok(items.length >= 18, String(items.length)); // snorkeling remis dans la plongée le 12.11.2026
  const page = html("cancellation");
  for (const i of items) {
    const rule = i.rule.replace(/&/g, "&amp;");
    assert.ok(page.includes(rule), `page : ${i.slug}`);
    const fiche = html(i.url.replace(/^\/|\/$/g, ""));
    assert.ok(fiche.includes(`<dt>Cancellation</dt><dd>${rule} <a class="link" href="/cancellation/">All cancellation rules</a>`), `fiche : ${i.slug}`);
  }
  assert.match(page, /Please tell us at least 2 hours before your pickup time\./, "éléphant : prévenir 2 heures avant");
});

test("aucun nom de prestataire, aucune règle interne (retenue, paiement du prestataire) sur la page ni dans la politique", () => {
  const all = html("cancellation") + JSON.stringify(site.booking.cancellationPolicy) + JSON.stringify(C);
  assert.doesNotMatch(all, PARTENAIRES);
  assert.doesNotMatch(all, /commission|net price|retention|retenue|early bird/i);
  assert.equal(site.booking.cancellationPolicy.url, "/cancellation/");
});

test("lien « Cancellation » dans les pieds de page Secret et VIP", () => {
  assert.match(html("tours/batik"), /<a href="\/cancellation\/">Cancellation<\/a>/);
  assert.match(html("taxi/krabi-airport-koh-lanta"), /<a href="\/cancellation\/">Cancellation<\/a>/);
});

test("Langkawi : passeport valable 6 mois, voucher et passeport de chaque passager, check-in 1 h 30 avant", () => {
  const h = html("tours/speedboat");
  assert.match(h, /<dt>Passport<\/dt><dd>For Langkawi, your passport must be valid for at least 6 months\. Bring your voucher and your passport, for every passenger, and check in 1 hour 30 minutes before departure for the immigration check\.<\/dd>/);
  assert.match(h, /Your passport must be valid for at least 6 months, and check-in is 1 hour 30 minutes before departure/);
  const src = require("../src/_data/products/secret-transfers/speedboat-ferry.json").sources.map((s) => s.from).join(" ");
  assert.match(src, /Langkawi, passeport et check-in/);
});
