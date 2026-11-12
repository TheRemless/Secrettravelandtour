// Excursion privée d'une journée de Koh Lanta vers Krabi (12.11.2026) : une seule fiche à la place de visa run, Emerald Pool + sources
// chaudes et tour de Koh Lanta. Rien d'inventé : pas d'horaire, de durée ni de prix par stop. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SITE = path.join(__dirname, "..", "_site");
const html = (u) => fs.readFileSync(path.join(SITE, u, "index.html"), "utf8");
const D = require("../src/_data/krabiDayTrip.json");

test("la fiche : titre de 60 caractères au plus, description de 120 à 160, un h1, les trois stops, « from 3,500 THB »", () => {
  const h = html("taxi/koh-lanta-krabi-day-trip");
  assert.ok(D.title.length <= 60 && D.metaDescription.length >= 120 && D.metaDescription.length <= 160);
  assert.equal((h.match(/<h1[ >]/g) || []).length, 1);
  for (const s of ["Emerald Pool", "Tiger Cave Temple", "The hot springs"]) assert.match(h, new RegExp(`<li>${s}</li>`));
  assert.match(h, /From 3,500(?:\u00a0| )THB/);
  assert.match(h, /depending on the number of stops and the hours/);
});

test("rien d'inventé : aucun horaire, aucune durée, aucun prix par stop, aucun nom de prestataire", () => {
  const text = JSON.stringify(D).replace(/_source[^}]*/, "");
  assert.doesNotMatch(text, /\b\d{1,2}[:h]\d{2}\b|\b\d+\s?(hours?|hrs?|minutes?|min)\b/i, "pas d'horaire ni de durée");
  assert.deepEqual([...text.matchAll(/\d[\d,]*\s?THB/g)].map((m) => m[0].replace(/\s/g, "")).filter((x, i, a) => a.indexOf(x) === i), ["3,500THB"]);
  assert.doesNotMatch(text, /rattana|lacha|satun|bundhaya|noom|sukho|blue planet/i);
});

test("la demande WhatsApp demande les stops voulus, sans passer par la feuille de trajet", () => {
  const h = html("taxi/koh-lanta-krabi-day-trip");
  const m = h.match(/href="(https:\/\/wa\.me\/66958683846\?text=[^"]+)"/);
  assert.ok(m);
  const txt = decodeURIComponent(m[1].split("text=")[1].replace(/&amp;/g, "&"));
  assert.match(txt, /^Private day trip from Koh Lanta to Krabi\nStops I would like \(Emerald Pool, Tiger Cave Temple, hot springs\): \n/);
  assert.doesNotMatch(h, /data-book|booking\.js/);
});

test("JSON-LD : TaxiService avec le prix « from », FAQPage, fil d'Ariane, aucune note", () => {
  const h = html("taxi/koh-lanta-krabi-day-trip");
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const types = blocks.map((b) => b["@type"]);
  assert.deepEqual(types.sort(), ["BreadcrumbList", "FAQPage", "TaxiService"]);
  const main = blocks.find((b) => b["@type"] === "TaxiService");
  assert.equal(main.offers.priceSpecification.minPrice, 3500);
  assert.equal(main.offers.priceSpecification.priceCurrency, "THB");
  assert.doesNotMatch(JSON.stringify(blocks), /aggregateRating|ratingValue|"price"/);
});

test("rangée dans le hub /taxi/ et dans le plan du site ; la clé de prix pointe vers la prestation « Emerald Pool and Krabi Hot Springs »", () => {
  assert.match(html("taxi"), /href="\/taxi\/koh-lanta-krabi-day-trip\/"/);
  assert.match(fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8"), /\/taxi\/koh-lanta-krabi-day-trip\//);
  const k = require("../src/_data/gestion-keys.json")["taxi|koh-lanta-krabi-day-trip|from"];
  assert.match(k.gestion, /Emerald Pool and Krabi Hot Springs/);
});
