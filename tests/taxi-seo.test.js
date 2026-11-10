const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const taxi = require("../src/_data/taxi.json");
const taxiView = require("../src/_data/taxiView.js");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const njk = read("src/taxi.njk");
const decode = (s) => s.replace(/&amp;/g, "&");

test("/taxi/ : la page est indexable", () => {
  assert.doesNotMatch(njk, /noindex/i);
  assert.match(njk, /<meta name="robots" content="index, follow/);
});

test("/taxi/ : balise title de 60 caractères au plus, avec le mot-clé, la zone et la marque", () => {
  const title = decode(njk.match(/<title>(.*?)<\/title>/)[1]);
  assert.ok(title.length <= 60, `${title.length} caractères : ${title}`);
  assert.match(title, /Taxi/i);
  assert.match(title, /Southern Thailand/);
  assert.match(title, /VIP Taxi Lanta/);
});

test("/taxi/ : meta description de 120 à 160 caractères, avec un appel à l'action", () => {
  const description = decode(njk.match(/<meta name="description" content="(.*?)">/)[1]);
  assert.ok(description.length >= 120 && description.length <= 160, `${description.length} caractères`);
  assert.match(description, /Request|Book|Send/);
  assert.match(description, /Southern Thailand/);
  assert.match(description, /Koh Lanta/);
});

test("/taxi/ : un seul h1, qui contient le mot-clé principal", () => {
  assert.equal((njk.match(/<h1[ >]/g) || []).length, 1);
  assert.match(taxi.hero.title, /taxi/i);
  assert.match(taxi.hero.title, /Southern Thailand/);
});

test("/taxi/ : le service couvre tout le sud de la Thaïlande, Koh Lanta est la base", () => {
  assert.match(taxi.hero.lead, /Southern Thailand/);
  // Jérémy, 11.11.2026 : la phrase des songthaews ne redit pas où on est basé ; le titre le dit.
  assert.match(taxi.hero.title, /Koh Lanta/);
  assert.match(taxi.hero.lead, /songthaew/);
  assert.match(njk, /h-routes">[^<]*Southern Thailand/);
  // Aucune question ne présente l'offre comme limitée au départ de Koh Lanta.
  // Exceptions : « to and from Koh Lanta » (les deux sens) et « Do you only drive from Koh Lanta? » (réponse : No).
  const restrictive = taxi.faq.filter((f) => /(?<!to and )from Koh Lanta/i.test(f.q) && !/only drive from Koh Lanta/i.test(f.q));
  assert.deepEqual(restrictive.map((f) => f.q), [], "question trop restrictive dans la FAQ");
  const where = taxi.faq.find((f) => /Southern Thailand/.test(f.q));
  assert.ok(where, "question sur la zone couverte");
  assert.match(where.a, /Phuket/);
});

test("/taxi/ : le sitemap la liste une seule fois", () => {
  // Le sitemap est généré par Eleventy (src/sitemap.njk) : lancer `npm run build` avant les tests.
  const sitemap = read("_site/sitemap.xml");
  const hits = sitemap.match(/<loc>https:\/\/secrettravelandtour\.com\/taxi\/<\/loc>/g) || [];
  assert.equal(hits.length, 1);
});

test("liens internes : l'accueil pointe vers /taxi/ et /taxi/ vers l'accueil", () => {
  assert.match(fs.readFileSync(path.join(__dirname, "..", "_site", "index.html"), "utf8"), /href="\/taxi\/"/);
  assert.equal(taxi.tours.link.href, "/");
});

test("/taxi/ : questions fréquentes tirées du site de VIP Taxi Lanta, chacune avec confirmed", () => {
  assert.ok(taxi.faq.length >= 3);
  for (const item of taxi.faq) {
    assert.ok(item.q.endsWith("?"), item.q);
    assert.ok(item.a.length > 20, item.q);
    assert.equal(typeof item.confirmed, "boolean", item.q);
  }
});

test("données structurées : TaxiService, zone desservie, aucun fait non vérifié", () => {
  const graph = taxiView().jsonLd;
  assert.equal(graph["@context"], "https://schema.org");
  // Un @id par nœud : #vip pour l'entreprise (LocalBusiness), #service pour le service (TaxiService).
  const biz = graph["@graph"].find((n) => n["@type"] === "LocalBusiness");
  const ld = graph["@graph"].find((n) => n["@type"] === "TaxiService");
  assert.equal(biz["@id"], "https://secrettravelandtour.com/taxi/#vip");
  assert.equal(ld["@id"], "https://secrettravelandtour.com/taxi/#service");
  assert.equal(ld.provider["@id"], biz["@id"]);
  assert.equal(biz.url, "https://secrettravelandtour.com/taxi/");
  const area = JSON.stringify(ld.areaServed);
  for (const place of ["Southern Thailand", "Koh Lanta", "Krabi", "Phuket", "Surat Thani"]) assert.match(area, new RegExp(place));
  // Pas de note ni d'avis inventés, pas de téléphone ni d'e-mail (décision : le formulaire est le canal unique).
  assert.doesNotMatch(JSON.stringify(graph), /aggregateRating|"review"|ratingValue|telephone|email|priceRange/i);
  // Le JSON-LD doit rester du JSON valide une fois sérialisé pour la page.
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(graph)));
});

test("la page insère les données structurées", () => {
  assert.match(njk, /application\/ld\+json/);
  assert.match(njk, /taxiView\.jsonLd/);
});

test("FAQ : aucune durée, distance ni prix inventé", () => {
  // Seul montant permis : le ferry, 60 THB par personne au-delà de 4 (grille VIP Taxi Lanta, Jérémy 11.11.2026).
  const all = JSON.stringify(taxi.faq.filter((f) => !/ferry to Koh Lanta included/.test(f.q)));
  assert.match(taxi.faq.find((f) => /ferry to Koh Lanta included/.test(f.q)).a, /up to 4 people.*From the 5th person, the ferry is 60 THB per person/);
  assert.doesNotMatch(all, /\b\d+\s?(h|hr|hrs|hours?|min|minutes?|km|kms|baht|thb)\b|฿|€|\$/i);
});

test("FAQ : précise que l'offre ne se limite pas à Koh Lanta et qu'elle couvre les aéroports", () => {
  const notOnly = taxi.faq.find((f) => /only drive from Koh Lanta/i.test(f.q));
  assert.ok(notOnly, "question « seulement depuis Koh Lanta »");
  assert.match(notOnly.a, /Southern Thailand/);
  const airports = taxi.faq.find((f) => /airport transfers?/i.test(f.q));
  assert.ok(airports, "question sur les transferts aéroport");
  assert.match(airports.a, /Krabi/);
  assert.match(airports.a, /Phuket/);
  assert.match(airports.a, /Surat Thani/);
});

// Jérémy, 10.11.2026 : « (also written Ko Lanta) » ne sert à rien, retiré de la FAQ.
test("pas de variante d'orthographe « Ko Lanta » dans les données taxi", () => {
  assert.doesNotMatch(JSON.stringify(taxi), /\bKo Lanta/);
});

test("From et To sont des listes déroulantes de lieux populaires où l'on peut aussi écrire librement", () => {
  // Refonte taxi v1 (10.11.2026) : les champs From et To de la feuille du hub, liste ajoutée par vip-taxi.js.
  assert.doesNotMatch(njk, /class="chips"|<datalist|list="places"|Popular private transfers/);
  assert.match(njk, /<script type="application\/json" id="taxi-places">\{\{ taxi\.places \| dump \| safe \}\}<\/script>/);
  const js = read("src/js/vip-taxi.js");
  for (const part of ['"combobox"', '"aria-autocomplete", "list"', '"aria-expanded"', 'role="listbox"', 'role="option"', '"book-from"', '"book-to"']) {
    assert.ok(js.includes(part), part);
  }
  const built = read("_site/taxi/index.html");
  assert.match(built, /<input id="book-from"[^>]*type="text"/);
  assert.match(built, /<input id="book-to"[^>]*type="text"/);
});

test("données structurées : catalogue des services sans prix", () => {
  const ld = taxiView().jsonLd["@graph"].find((n) => n["@type"] === "TaxiService");
  assert.equal(ld.hasOfferCatalog["@type"], "OfferCatalog");
  const items = ld.hasOfferCatalog.itemListElement;
  assert.ok(items.length >= 3);
  assert.doesNotMatch(JSON.stringify(ld), /"price"|priceCurrency/i);
});

// Ce plafond en nombre d'occurrences empêche d'ajouter de la répétition sans y penser.
test("répétition de « Koh Lanta » plafonnée à 24 occurrences dans les textes de la page", () => {
  const shown = ["title", "text", "lead", "note", "q", "a"];
  const dataText = [taxi.hero, taxi.tours, taxi.rating, taxi.payment].concat(taxi.services, taxi.why, taxi.steps, taxi.faq)
    .map((item) => shown.map((k) => item[k]).filter(Boolean).join(" ")).join(" ");
  const hits = (dataText.match(/Koh Lanta/g) || []).length;
  assert.ok(hits <= 24, `${hits} occurrences de « Koh Lanta »`);
});

test("services : les aéroports sont nommés avec leurs codes, dans les deux sens", () => {
  const text = taxi.services.map((s) => s.text).join(" ");
  for (const code of ["KBV", "HKT", "URT"]) assert.match(text, new RegExp(code));
  assert.match(text, /both directions/);
});

test("FAQ : questions précises sur les trajets depuis les aéroports, le retour et les enfants", () => {
  const questions = taxi.faq.map((f) => f.q).join(" | ");
  assert.match(questions, /Krabi Airport to Koh Lanta/);
  assert.match(questions, /Phuket Airport/);
  assert.match(questions, /leave Koh Lanta/);
  assert.match(questions, /children or babies/);
  assert.ok(taxi.faq.length >= 10, `${taxi.faq.length} questions`);
  assert.equal(new Set(taxi.faq.map((f) => f.q)).size, taxi.faq.length, "pas de question en double");
});

test("mise en page : la FAQ vient après le formulaire", () => {
  assert.ok(njk.indexOf('id="h-faq"') > njk.indexOf('id="request"'), "FAQ sous le formulaire");
  assert.ok(njk.indexOf('id="h-faq"') < njk.indexOf("</main>"), "FAQ dans <main>");
});

test("bloc Secret : encart à part, dans l'identité v4 de Secret, avec son emblème d'origine", () => {
  // Refonte taxi v1 (10.11.2026) : plus de pastille « Our partner », de script ni de polaroïd.
  const comp = read("src/_includes/components/taxi.njk");
  const route = read("src/taxi-route.njk");
  for (const page of [njk, route]) assert.match(page, /tx\.secretAside\(taxi\.tours/);
  assert.match(comp, /<aside class="stt[^"]*"[^>]*aria-labelledby="stt-h"/);
  assert.match(comp, /class="stt-emblem" src="\/images\/secret\/emblem\.webp"/);
  assert.doesNotMatch(comp, /partner-tag|Our partner/);
  const css = read("src/css/vip-taxi.css");
  assert.match(css, /\.stt \{ background: #0B3B3C/);
  assert.match(css, /"Cormorant Garamond"/);
  assert.doesNotMatch(css, /Concert One|Kaushan/);
});
