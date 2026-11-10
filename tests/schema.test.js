// JSON-LD des pages refaites (src/_includes/components/schema.js) : structure valide, aucun prix, aucune note
// ni avis, @id cohérents, fil d'Ariane vers des adresses existantes, FAQPage seulement avec des questions,
// aucun nom de prestataire, image seulement pour une photo « keep ». Module pur : pas besoin du build.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const schema = require("../src/_includes/components/schema.js");
const site = require("../src/_data/site.json");

const DIR = path.join(__dirname, "..", "src", "_data", "products");
const SITE = site.url.replace(/\/+$/, "");
const AGENCY = `${SITE}/#agency`;
const VIP = `${SITE}/taxi/#vip`;
// Même liste que tests/products-schema.test.js (elle-même reprise de tests/partenaires.test.js).
const PARTENAIRES = /rattana|lacha ?ru|sukho|lanta ?atv|atv adventure|lanta elephant|lanta longtail|lanta batik|lanta kayaking|lanta ?e-?gokart|noom|bundhaya|satun|pakbara|blue ?planet|octopusea/i;
// Adresses de niveau 1 et 2 du fil d'Ariane qui existent (accueil, sections du hub /tours/, /taxi/).
const CRUMB_URLS = ["/", "/tours/#boat-trips", "/tours/#activities", "/taxi/"].map((p) => SITE + p);

const read = (rel) => JSON.parse(fs.readFileSync(path.join(DIR, rel), "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));

// L'objet `products` tel qu'Eleventy le construit à partir des dossiers.
function loadProducts() {
  const out = { rental: read("rental.json") };
  for (const folder of ["tours", "activities", "secret-transfers", "taxi"]) {
    out[folder] = {};
    for (const name of fs.readdirSync(path.join(DIR, folder)).filter((n) => n.endsWith(".json")).sort()) {
      out[folder][name.replace(/\.json$/, "")] = read(path.join(folder, name));
    }
  }
  return out;
}
const products = loadProducts();
const all = [products.rental].concat(...["tours", "activities", "secret-transfers", "taxi"].map((f) => Object.values(products[f])));

const BUILDER = { boat: schema.tour, activity: schema.activity, rental: schema.rental, transfer: schema.transfer, route: schema.route };
const pages = all.filter((p) => BUILDER[p.template]).map((p) => ({ product: p, blocks: BUILDER[p.template](p, site) }));

const five = {
  tour: products.tours["4-islands"],
  activity: products.activities["elephant-sanctuary"],
  rental: products.rental,
  route: products.taxi["krabi-airport-koh-lanta"]
};
const homeBlocks = schema.home(site, products);

const byType = (blocks, type) => blocks.find((b) => b["@type"] === type);
const mainOf = (blocks) => blocks.find((b) => !["BreadcrumbList", "FAQPage"].includes(b["@type"]));

function walk(value, where, visit) {
  visit(value, where);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${where}[${i}]`, visit));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, `${where}.${k}`, visit);
}
function keysOf(value) {
  const keys = [];
  walk(value, "", (v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...Object.keys(v));
  });
  return keys;
}

const everything = [{ name: "home", blocks: homeBlocks }].concat(pages.map((p) => ({ name: p.product.url, blocks: p.blocks })));

test("structure : chaque page rend un tableau d'objets JSON-LD avec @context et @type, sans valeur vide", () => {
  for (const { name, blocks } of everything) {
    assert.ok(Array.isArray(blocks) && blocks.length >= 1, name);
    for (const b of blocks) {
      assert.equal(b["@context"], "https://schema.org", name);
      assert.ok(typeof b["@type"] === "string" && b["@type"].length, name);
      assert.deepEqual(JSON.parse(JSON.stringify(b)), b, `${name} : JSON non sérialisable`);
      walk(b, name, (v, where) => {
        assert.notEqual(v, undefined, `${where} : undefined`);
        assert.notEqual(v, null, `${where} : null`);
        if (typeof v === "string") assert.ok(v.trim().length > 0, `${where} : chaîne vide`);
        if (Array.isArray(v)) assert.ok(v.length > 0, `${where} : tableau vide`);
        if (v && typeof v === "object" && !Array.isArray(v)) assert.ok(Object.keys(v).length > 0, `${where} : objet vide`);
        if (typeof v === "string" && /^\//.test(v)) assert.fail(`${where} : URL relative ${v}`);
      });
    }
  }
});

test("types attendus sur les cinq pages, jamais TouristAttraction", () => {
  assert.deepEqual(homeBlocks.map((b) => b["@type"]), ["TravelAgency", "WebSite"]);
  assert.deepEqual(schema.tour(five.tour, site).map((b) => b["@type"]), ["TouristTrip", "BreadcrumbList", "FAQPage"]);
  assert.equal(mainOf(schema.activity(five.activity, site))["@type"], five.activity.schema.type);
  assert.equal(mainOf(schema.rental(five.rental, site))["@type"], "Service");
  assert.equal(mainOf(schema.route(five.route, site))["@type"], "TaxiService");
  for (const { name, blocks } of everything) assert.doesNotMatch(JSON.stringify(blocks), /TouristAttraction/, name);
  // Même si une donnée le demandait encore.
  const legacy = clone(five.activity);
  legacy.schema.type = "TouristAttraction";
  assert.equal(mainOf(schema.activity(legacy, site))["@type"], "TouristTrip");
});

test("aucun prix : ni price, ni priceCurrency, ni priceRange, ni montant en THB hors FAQ", () => {
  for (const { name, blocks } of everything) {
    const keys = keysOf(blocks);
    // Trajets taxi (10.11.2026) : prix d'appel de la grille VIP Taxi Lanta en PriceSpecification.minPrice, rien d'autre.
    const taxi = /^\/taxi\//.test(name);
    for (const k of keys) if (!(taxi && /^(priceSpecification|minPrice|priceCurrency)$/.test(k))) assert.doesNotMatch(k, /price|lowPrice|highPrice/i, `${name} : ${k}`);
    // Les réponses de FAQ reprennent le texte de la page (frais de parc, par exemple) ; tout le reste est sans montant.
    const rest = blocks.filter((b) => b["@type"] !== "FAQPage");
    if (!taxi) assert.doesNotMatch(JSON.stringify(rest), /\d[\d,.]*\s?(THB|baht)|฿/i, name);
  }
  for (const { blocks } of everything) {
    walk(blocks, "", (v) => {
      if (v && v["@type"] === "Offer") {
        assert.ok(v.url && v.url.startsWith(SITE), "Offer sans url");
        assert.equal(v.availability, "https://schema.org/InStock");
      }
    });
  }
});

test("aucune note ni avis (Secret n'en a pas, celle de VIP reste en texte sur la page)", () => {
  for (const { name, blocks } of everything) {
    const text = JSON.stringify(blocks);
    assert.doesNotMatch(text, /aggregateRating|AggregateRating|"review"|"Review"|ratingValue|reviewCount|bestRating/, name);
    assert.ok(!text.includes(String(site.brands.vip.rating.count)), `${name} : nombre d'avis VIP`);
  }
});

test("aucun nom de prestataire, e-mail, réseau social, horaire ni licence absente", () => {
  for (const { name, blocks } of everything) {
    const text = JSON.stringify(blocks);
    assert.doesNotMatch(text, PARTENAIRES, name);
    assert.doesNotMatch(text, /"email"|openingHours|facebook|instagram|tripadvisor/i, name);
  }
  // Licence TAT 34/04000 (donnée le 06.11.2026) : présente sur l'agence ; rien quand elle vaut null.
  assert.equal(site.brands.secret.licence, "34/04000");
  assert.match(JSON.stringify(homeBlocks), /34\/04000/);
  const unlicensed = clone(site);
  unlicensed.brands.secret.licence = null;
  assert.doesNotMatch(JSON.stringify(schema.home(unlicensed, products)), /hasCredential/);
});

test("accueil : TravelAgency @id stable, WebSite publié par l'agence, opérateur en parentOrganization", () => {
  const agency = byType(homeBlocks, "TravelAgency");
  const website = byType(homeBlocks, "WebSite");
  const b = site.brands.secret;
  assert.equal(agency["@id"], AGENCY);
  assert.equal(agency.name, b.name);
  assert.equal(agency.url, `${SITE}/`);
  assert.equal(agency.telephone, b.phone);
  assert.equal(agency.address.streetAddress, b.address.street);
  assert.equal(agency.address.postalCode, b.address.postalCode);
  assert.equal(agency.geo.latitude, b.geo.lat);
  assert.ok(agency.sameAs.includes(b.maps));
  assert.equal(agency.parentOrganization.name, site.operator.name);
  assert.equal(website["@id"], `${SITE}/#website`);
  assert.equal(website.name, b.name);
  assert.equal(website.inLanguage, site.language);
  assert.equal(website.publisher["@id"], AGENCY);
  // Catalogue : uniquement des prestations Secret, aucun trajet VIP.
  assert.doesNotMatch(JSON.stringify(agency.hasOfferCatalog), /\/taxi\//);
});

test("@id cohérents : provider des pages Secret = agence de l'accueil, catalogue = entités des pages, VIP à part", () => {
  const catalogIds = new Map();
  walk(byType(homeBlocks, "TravelAgency").hasOfferCatalog, "", (v) => {
    if (v && v.itemOffered) catalogIds.set(v.itemOffered.url, v.itemOffered["@id"]);
  });
  for (const { product, blocks } of pages) {
    const main = mainOf(blocks);
    const url = SITE + product.url;
    assert.ok(main["@id"].startsWith(url + "#"), main["@id"]);
    assert.equal(main.url, url);
    if (product.brand === "secret") {
      assert.equal(main.provider["@id"], AGENCY, product.url);
      assert.equal(catalogIds.get(url), main["@id"], `${product.url} : @id du catalogue`);
    } else {
      assert.equal(main.provider["@id"], VIP, product.url);
      assert.equal(main.provider.name, site.brands.vip.name);
      assert.deepEqual(main.provider.sameAs, site.brands.vip.sameAs);
      assert.deepEqual(Object.keys(main.provider.address).sort(), ["@type", "addressCountry", "addressLocality", "addressRegion"]);
      assert.doesNotMatch(JSON.stringify(blocks), /telephone|streetAddress|postalCode|"geo"/, product.url);
    }
  }
});

test("fil d'Ariane : positions 1 à 3 (2 pour la location), adresses existantes, dernière = la page", () => {
  for (const { product, blocks } of pages) {
    const crumbs = byType(blocks, "BreadcrumbList");
    assert.ok(crumbs, product.url);
    const items = crumbs.itemListElement;
    // Location : 2 niveaux ; trajet VIP : 2 niveaux, le fil commence à /taxi/ (marque de Mr. Brown, Q1).
    assert.equal(items.length, ["rental", "transfer", "route"].includes(product.template) ? 2 : 3, product.url);
    items.forEach((it, i) => {
      assert.equal(it.position, i + 1);
      assert.ok(it.name, `${product.url} : nom du niveau ${i + 1}`);
    });
    assert.equal(items[0].item, product.template === "route" ? `${SITE}/taxi/` : `${SITE}/`);
    assert.equal(items.at(-1).item, SITE + product.url);
    for (const it of items.slice(0, -1)) assert.ok(CRUMB_URLS.includes(it.item), `${product.url} : ${it.item}`);
  }
  const level2 = (p) => byType(BUILDER[p.template](p, site), "BreadcrumbList").itemListElement[1].item;
  assert.equal(level2(five.tour), `${SITE}/tours/#boat-trips`);
  assert.equal(level2(five.activity), `${SITE}/tours/#activities`);
  assert.equal(byType(BUILDER.route(five.route, site), "BreadcrumbList").itemListElement[0].item, `${SITE}/taxi/`);
});

test("FAQPage : seulement avec les questions propres à la page, et seulement s'il y en a", () => {
  for (const { product, blocks } of pages) {
    const faq = byType(blocks, "FAQPage");
    const own = product.faq || [];
    if (!own.length) {
      assert.equal(faq, undefined, product.url);
      continue;
    }
    assert.deepEqual(faq.mainEntity.map((q) => q.name), own.map((f) => f.q), product.url);
    assert.deepEqual(faq.mainEntity.map((q) => q.acceptedAnswer.text), own.map((f) => f.a), product.url);
  }
  // Le trajet ne reprend pas la FAQ commune de VIP (site.brands.vip.faq).
  const routeFaq = byType(schema.route(five.route, site), "FAQPage");
  assert.equal(routeFaq.mainEntity.length, five.route.faq.length);
  for (const [name, p] of Object.entries(five)) {
    const empty = clone(p);
    delete empty.faq;
    assert.equal(byType(schema[name](empty, site), "FAQPage"), undefined, name);
    empty.faq = [];
    assert.equal(byType(schema[name](empty, site), "FAQPage"), undefined, name);
  }
});

test("image : URL absolue de la photo principale seulement quand elle est « keep »", () => {
  for (const { product, blocks } of pages) {
    const hero = (product.photos || []).find((p) => p.slot === "hero");
    const main = mainOf(blocks);
    if (hero && hero.status === "keep" && hero.file) assert.equal(main.image, `${SITE}/images/${hero.file}`, product.url);
    else assert.equal(main.image, undefined, product.url);
  }
  assert.ok(mainOf(schema.tour(five.tour, site)).image);
  assert.equal(mainOf(schema.rental(five.rental, site)).image, undefined, "photo de location à remplacer");
  const replaced = clone(five.tour);
  replaced.photos.find((p) => p.slot === "hero").status = "replace";
  assert.equal(mainOf(schema.tour(replaced, site)).image, undefined);
  // Accueil : le logo gardé, pas de photo du bureau (manquante).
  const agency = byType(homeBlocks, "TravelAgency");
  assert.match(agency.logo, /\/images\/secret\/emblem\.webp$/);
  assert.equal(agency.image, undefined);
});

test("contenu propre à chaque type : itinéraire, zones desservies, type de service", () => {
  const trip = mainOf(schema.tour(five.tour, site));
  assert.deepEqual(trip.itinerary.itemListElement.map((l) => l.item.name), five.tour.schema.places);
  trip.itinerary.itemListElement.forEach((l, i) => assert.equal(l.position, i + 1));

  const taxi = mainOf(schema.route(five.route, site));
  assert.deepEqual(taxi.areaServed.map((p) => p.name), [five.route.route.from, five.route.route.to]);
  assert.equal(taxi.serviceType, five.route.schema.serviceType);

  const service = mainOf(schema.rental(five.rental, site));
  assert.ok(service.serviceType);
  assert.equal(service.provider["@id"], AGENCY);
  const vehicles = [];
  walk(service.hasOfferCatalog, "", (v) => v && v["@type"] === "Offer" && vehicles.push(v.name));
  assert.equal(vehicles.length, five.rental.options.reduce((n, o) => n + o.prices.length, 0));

  // Un champ absent = propriété absente.
  const bare = clone(five.tour);
  delete bare.schema.places;
  assert.equal(mainOf(schema.tour(bare, site)).itinerary, undefined);
});

test("accueil : option live pour écarter une page qui n'existe pas encore", () => {
  const live = ["/tours/4-islands/", "/tours/speedboat/"];
  const text = JSON.stringify(schema.home(site, products, { live }));
  assert.match(text, /\/tours\/4-islands\/#trip/);
  assert.match(text, /\/tours\/speedboat\/#service/);
  assert.doesNotMatch(text, /\/transfers\//);
  // Sans option, tous les produits Secret, y compris les transferts.
  assert.match(JSON.stringify(homeBlocks), /\/transfers\/#service/);
});

test("toScript : aucune fin de balise </script> possible dans le JSON sérialisé", () => {
  const out = schema.toScript({ text: "</script><b>" });
  assert.ok(!out.includes("<"));
  assert.deepEqual(JSON.parse(out), { text: "</script><b>" });
});
