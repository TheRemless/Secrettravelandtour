// Page /transfers/ (11.11.2026, demande de Jérémy) : « What kind of transfer are you looking for? », trois choix.
// Minivan privé et songthaew mènent aux pages de VIP Taxi Lanta ; le minivan partagé est une demande WhatsApp au nom de
// Secret Travel & Tour, sans tarif, sans nom de prestataire, jamais présenté comme VIP Taxi Lanta.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = (url) => read(path.join("_site", url, "index.html"));
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const ldOf = (doc) => [...doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const doc = html("transfers");
const taxi = html("taxi");
const meta = (d, re) => decode((d.match(re) || [])[1] || "");
const section = (id) => (doc.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`)) || [""])[0];

test("transfers : title de 60 caractères au plus, description de 120 à 160, un h1, canonical, indexée", () => {
  const title = meta(doc, /<title>(.*?)<\/title>/);
  const desc = meta(doc, /<meta name="description" content="(.*?)">/);
  assert.ok(title.length <= 60, `title ${title.length}`);
  assert.ok(desc.length >= 120 && desc.length <= 160, `description ${desc.length}`);
  assert.equal((doc.match(/<h1[ >]/g) || []).length, 1);
  assert.match(doc, /<h1[^>]*>What kind of transfer are you looking for\?<\/h1>/);
  assert.match(doc, /<link rel="canonical" href="https:\/\/secrettravelandtour.com\/transfers\/">/);
  assert.match(doc, /<meta name="robots" content="index, follow/);
  assert.match(doc, /<html lang="en-GB"/);
});

test("transfers : title et description différents de ceux de /taxi/ (pas de doublon)", () => {
  assert.notEqual(meta(doc, /<title>(.*?)<\/title>/), meta(taxi, /<title>(.*?)<\/title>/));
  assert.notEqual(meta(doc, /<meta name="description" content="(.*?)">/), meta(taxi, /<meta name="description" content="(.*?)">/));
  assert.notEqual(meta(doc, /<h1[^>]*>(.*?)<\/h1>/), meta(taxi, /<h1[^>]*>([\s\S]*?)<\/h1>/));
});

test("transfers : dans le plan du site, une seule fois", () => {
  const sitemap = read("_site/sitemap.xml");
  assert.equal((sitemap.match(/<loc>https:\/\/secrettravelandtour.com\/transfers\/<\/loc>/g) || []).length, 1);
});

test("transfers : trois choix, le privé en premier et vers /taxi/, le songthaew vers /taxi/songthaew/", () => {
  const order = ["id=\"private\"", "id=\"shared\"", "id=\"local\""].map((s) => doc.indexOf(s));
  assert.ok(order.every((i) => i > 0) && order[0] < order[1] && order[1] < order[2], order.join(","));
  assert.match(section("private"), /href="\/taxi\/">See all private routes/);
  assert.match(section("local"), /href="\/taxi\/songthaew\/"/);
  assert.match(section("private"), /Our recommendation/);
  // Trois trajets privés en exemple, avec le prix d'appel de la grille VIP Taxi Lanta, par véhicule.
  assert.equal((section("private").match(/class="trow__a/g) || []).length, 3);
  assert.match(section("private"), /From [\d,]+\sTHB/); // espace insécable avant THB
  assert.match(section("private"), /price per vehicle/);
});

test("transfers : le minivan partagé n'a ni tarif, ni nom de prestataire, et n'est pas VIP Taxi Lanta", () => {
  const shared = section("shared");
  assert.ok(shared.length > 200);
  assert.doesNotMatch(shared, /THB|฿|\d[\d,]*\s?(baht|bath)|From \d/i);
  assert.doesNotMatch(shared, /VIP|Taxi Lanta|Brown/i);
  assert.match(shared, /Price on WhatsApp/);
  assert.match(shared, /data-book/);
  assert.match(shared, /Request a shared minivan/);
  // Aucun prestataire nommé nulle part sur la page, ni At Lanta.
  assert.doesNotMatch(doc, /at ?lanta vacation|at ?lanta travel|\bAt Lanta\b/i);
});

test("transfers : JSON-LD sans offre ni prix, avec fil d'Ariane, liste des choix et questions", () => {
  const ld = ldOf(doc);
  const text = JSON.stringify(ld);
  assert.doesNotMatch(text, /"offers"|"@type":"Offer"|"price"|priceSpecification|priceCurrency|THB/);
  const types = ld.map((b) => b["@type"]);
  for (const t of ["Service", "ItemList", "BreadcrumbList", "FAQPage"]) assert.ok(types.includes(t), t);
  const crumbs = ld.find((b) => b["@type"] === "BreadcrumbList").itemListElement.map((i) => i.name);
  assert.deepEqual(crumbs, ["Home", "Transfers"]);
  const service = ld.find((b) => b["@type"] === "Service");
  assert.equal(service.provider.name, "Secret Travel & Tour");
  assert.doesNotMatch(JSON.stringify(service), /VIP/);
});

test("transfers : fil d'Ariane visible, accessibilité de base", () => {
  assert.match(doc, /<nav class="wrap crumbs" aria-label="Breadcrumb">[\s\S]*?<a href="\/">Home<\/a>[\s\S]*?<span aria-current="page">Transfers<\/span>/);
  assert.match(doc, /<a class="skip" href="#main">/);
  assert.match(doc, /<main id="main">/);
  // Chaque section de choix est nommée par son titre.
  for (const id of ["private", "shared", "local"]) assert.match(section(id), /aria-labelledby="[a-z-]+"/);
  assert.doesNotMatch(doc, /<img(?![^>]*\balt=)[^>]*>/);
});

test("transfers : le menu et le pied de page mènent à /transfers/ sur toutes les pages du design v4", () => {
  for (const url of ["", "tours", "tours/4-islands", "tours/speedboat", "tours/rental", "tours/kayak", "transfers"]) {
    const d = html(url);
    assert.match(d, /<a href="\/transfers\/" data-nav="transfers"/, `${url || "accueil"} : menu`);
    assert.doesNotMatch(d, /<a href="\/taxi\/" data-nav="transfers"/, `${url || "accueil"} : menu vers /taxi/`);
    assert.match(d, /<li><a href="\/transfers\/">Transfers<\/a><\/li>/, `${url || "accueil"} : pied de page`);
  }
  assert.match(doc, /<a href="\/transfers\/" data-nav="transfers" aria-current="page">/);
});

test("/taxi/ : « Private only » n'est plus dit comme une règle de tout le site, et ne cite pas le minivan partagé", () => {
  assert.doesNotMatch(taxi, /Private only/);
  assert.doesNotMatch(taxi, /shared minivan|\/transfers\//i);
  assert.match(taxi, /Always private/);
  assert.match(html("taxi/krabi-airport-koh-lanta"), /Always private/);
  assert.doesNotMatch(html("taxi/krabi-airport-koh-lanta"), /Private only|Every transfer is private/);
});

test("feuille : la demande de minivan partagé est au nom de Secret Travel & Tour, sans prix, sans mot VIP", () => {
  const cfg = { variant: "taxi", shared: true, brand: "Secret Travel & Tour", product: "Shared minivan", productId: "transfers-shared", page: "secrettravelandtour.com/transfers/", from: "", to: "" };
  const st = Object.assign(B.emptyState(cfg), {
    today: "2026-11-03", dateChoice: "other", dateOther: "2026-11-10", time: "14:30", flight: "FD3xxx",
    adults: 2, childAges: [], bags: 2, pickupAt: "Krabi Airport arrivals", dropoffAt: "Hotel on Klong Dao", name: "Anna"
  });
  const msg = B.buildMessage(cfg, st);
  assert.equal(msg.split("\n")[0], "Shared minivan request (Secret Travel & Tour): Krabi Airport arrivals to Hotel on Klong Dao");
  assert.match(msg, /Preferred pickup time: 14:30 \(landing\)/);
  assert.doesNotMatch(msg, /VIP|THB|Price on the site|Transfer request/);
  assert.deepEqual(B.validate(cfg, st), {});
  // La demande VIP de /taxi/ ne change pas.
  const vip = Object.assign({}, cfg, { shared: false, brand: "VIP Taxi Lanta", product: "Private transfer" });
  assert.match(B.buildMessage(vip, st).split("\n")[0], /^Transfer request: Krabi Airport arrivals to Hotel on Klong Dao/);
});
