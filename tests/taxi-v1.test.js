// Refonte taxi v1 (10.11.2026) : /taxi/ et les 17 trajets sur un seul gabarit « Laque et or ».
// Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SITE = path.join(__dirname, "..", "_site");
const T = require("../src/_data/taxiPages.js")();
const page = (url) => fs.readFileSync(path.join(SITE, url, "index.html"), "utf8");
const config = (doc) => JSON.parse(doc.match(/<script type="application\/json" id="book-data">(.*?)<\/script>/)[1]);

test("18 trajets, toutes les adresses d'avant gardées sauf Krabi Airport → Khao Lak, redirigé", () => {
  const before = require("../src/_data/taxiRoutes.json").routes.map((r) => `/taxi/${r.id}/`);
  assert.equal(T.routes.length, 18);
  assert.deepEqual(T.routes.map((r) => r.url), before);
  for (const url of before) assert.ok(fs.existsSync(path.join(SITE, url, "index.html")), url);
});

test("un seul gabarit : chaque trajet a la même structure et réserve par la feuille", () => {
  for (const r of T.routes) {
    const doc = page(r.url);
    assert.match(doc, /<html lang="en-GB" data-refonte="?"? data-brand="vip">/, r.id);
    assert.match(doc, /href="\/css\/vip-taxi\.css/, r.id);
    assert.doesNotMatch(doc, /taxi-form\.js|class="ticket"|Request this transfer/, r.id);
    assert.equal((doc.match(/<h1[ >]/g) || []).length, 1, r.id);
    assert.match(doc, /<div class="cart" data-frame/, r.id);
    assert.match(doc, /<dialog class="sheet" id="book"/, r.id);
    const cfg = config(doc);
    assert.equal(cfg.variant, "taxi", r.id);
    assert.equal(cfg.from, r.from, r.id);
    assert.equal(cfg.to, r.to, r.id);
    assert.match(doc, /class="vbar"/, r.id);
    assert.match(doc, /<aside class="stt stt--compact"/, r.id);
  }
});

test("Krabi Airport → Khao Lak retiré (Jérémy, 10.11.2026) : plus de page, plus de lien, redirection 301 vers /taxi/", () => {
  assert.ok(!T.byId["krabi-airport-khao-lak"]);
  assert.ok(!fs.existsSync(path.join(SITE, "taxi/krabi-airport-khao-lak/index.html")));
  for (const url of ["/taxi/"].concat(T.routes.map((r) => r.url))) assert.doesNotMatch(page(url), /krabi-airport-khao-lak/, url);
  const toml = fs.readFileSync(path.join(__dirname, "..", "netlify.toml"), "utf8");
  assert.match(toml, /from = "\/taxi\/krabi-airport-khao-lak\/"\s+to = "\/taxi\/"\s+status = 301/);
  assert.match(page("/taxi/krabi-airport-koh-lanta/"), /<p class="c-drive">About 2 to 3 hours/);
});

test("aucun téléphone, aucun prix inventé, plus de « Minivan Taxi » sur le taxi", () => {
  for (const url of ["/taxi/"].concat(T.routes.map((r) => r.url))) {
    const doc = page(url);
    assert.doesNotMatch(doc, /href="tel:|mailto:/, url);
    assert.doesNotMatch(doc, /minivan taxi/i, url);
  }
  // Prix d'appel (10.11.2026) : le montant de la grille sur la page, dans la barre et dans le message ; sinon « Price on WhatsApp ».
  for (const r of T.routes) {
    const doc = page(r.url).replace(/<script[\s\S]*?<\/script>/g, "");
    const amounts = [...doc.matchAll(/(\d[\d,]*)\u00a0THB/g)].map((m) => Number(m[1].replace(/,/g, "")));
    if (!r.price) { assert.match(doc, /Price on WhatsApp<small>/, r.url); assert.ok(!r.booking.priceNote, r.url); }
    else assert.ok(amounts.includes(r.price.thb), r.url);
    // 60 THB : le ferry au-delà de 4 personnes, seulement sur les trajets qui passent par Koh Lanta.
    assert.ok(amounts.every((n) => (n === 60 && /Koh Lanta/.test(r.from + r.to)) || T.routes.some((x) => x.price && x.price.thb === n)), `${r.url} : montant hors grille`);
    assert.equal(/Ferry included/.test(doc), /Koh Lanta/.test(r.from + r.to), `${r.url} : ferry`);
    if (r.price) assert.match(r.booking.priceNote, new RegExp(`${r.price.approx ? "About" : "From"} ${r.price.thb.toLocaleString("en-US")} THB per vehicle`), r.url);
  }
  assert.equal(T.byId["krabi-airport-koh-lanta"].price.thb, 2300);
  assert.equal(T.byId["koh-lanta-khao-sok"].price.label, "About 5,000\u00a0THB");
  // Prix de Mr. Brown (11.11.2026) ; Krabi → Khao Sok reste sans prix (seul Ao Nang est connu).
  assert.equal(T.byId["phuket-khao-sok"].price.thb, 3000);
  assert.equal(T.byId["phuket-airport-khao-lak"].price.thb, 1800);
  assert.equal(T.byId["krabi-khao-sok"].price.thb, 2800); // Jérémy, 12.11.2026
});

test("hub : les 17 trajets en liens, une feuille libre Pickup et Drop-off, la liste des lieux", () => {
  const doc = page("/taxi/");
  for (const r of T.routes) assert.match(doc, new RegExp(`<a class="rr" href="${r.url}"`), r.id);
  const cfg = config(doc);
  assert.equal(cfg.variant, "taxi");
  assert.ok(!cfg.from && !cfg.to);
  assert.match(doc, /<input id="book-pickupAt"/);
  assert.match(doc, /<input id="book-dropoffAt"/);
  assert.doesNotMatch(doc, /<input id="book-from"|<input id="book-to"/);
  assert.match(doc, /id="taxi-places"/);
  assert.match(doc, /<aside class="stt"/);
});

test("anciens liens du hub : ?from=…&to=… et #request ouvrent la feuille préremplie", () => {
  const js = fs.readFileSync(path.join(__dirname, "../src/js/vip-taxi.js"), "utf8");
  assert.match(js, /q\.get\("from"\)/);
  assert.match(js, /q\.get\("to"\)/);
  assert.match(js, /#request/);
});

test("feuille partagée : seul le taxi perd le téléphone de l'écran final, Secret le garde", () => {
  assert.doesNotMatch(page("/taxi/"), /class="done-num"/);
  assert.match(page("/tours/4-islands/"), /class="done-num" href="tel:/);
});

test("encart Secret : identité v4 et emblème d'origine, liens vers des pages qui existent", () => {
  const doc = page("/taxi/");
  assert.match(doc, /class="stt-emblem" src="\/images\/secret\/emblem\.webp"/);
  for (const href of [...doc.matchAll(/<aside class="stt"[\s\S]*?<\/aside>/g)][0][0].matchAll(/href="([^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(SITE, href[1], "index.html")), href[1]);
  }
});

test("sitemap : /taxi/ et les 17 trajets, une fois chacun", () => {
  const xml = fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8");
  for (const url of ["/taxi/"].concat(T.routes.map((r) => r.url))) {
    const n = (xml.match(new RegExp(`<loc>https://secrettravelandtour\\.com${url}</loc>`, "g")) || []).length;
    assert.equal(n, 1, url);
  }
});

// Jérémy, 10.11.2026 : Secret Travel & Tour toujours en lien, songthaew expliqué, pancarte à l'aéroport, deux trajets ajoutés.
test("taxi : chaque « Secret Travel & Tour » écrit dans le texte est un lien vers leur site", () => {
  const pages = ["taxi/index.html", ...T.routes.map((r) => r.url.slice(1) + "index.html"), "taxi/songthaew/index.html"];
  for (const rel of pages) {
    const html = fs.readFileSync(path.join(SITE, rel), "utf8").replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/\s(alt|content|aria-label)="[^"]*"/g, "");
    const text = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, "").replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(text, /Secret Travel (&amp;|&) Tour/, rel);
  }
});

test("taxi : page songthaew liée depuis le hub, pancarte aux arrivées, Phuket et Pak Bara Pier", () => {
  const hub = fs.readFileSync(path.join(SITE, "taxi", "index.html"), "utf8");
  assert.match(hub, /href="\/taxi\/songthaew\/"/);
  assert.match(hub, /arrivals hall with a sign showing your name/);
  const song = fs.readFileSync(path.join(SITE, "taxi", "songthaew", "index.html"), "utf8");
  assert.match(song, /<h1[^>]*>What is a songthaew\?<\/h1>/);
  for (const id of ["koh-lanta-phuket", "koh-lanta-pak-bara-pier"]) assert.ok(T.byId[id], id);
  const krabi = fs.readFileSync(path.join(SITE, "taxi", "krabi-airport-koh-lanta", "index.html"), "utf8");
  assert.match(krabi, /Met at arrivals/);
  const trang = fs.readFileSync(path.join(SITE, "taxi", "koh-lanta-trang", "index.html"), "utf8");
  assert.doesNotMatch(trang, /Met at arrivals/);
});

test("adresse de la fiche Google : dans le JSON-LD, jamais dans le texte visible des pages taxi", () => {
  const urls = ["/taxi/", "/taxi/songthaew/"].concat(T.routes.map((r) => r.url));
  for (const url of urls) {
    const doc = page(url);
    const visible = doc.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(visible, /292|Moo 2|81150|Sala ?Dan|7\.582|99\.035/i, url);
    assert.doesNotMatch(doc.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ""), /292 Moo|81150|7\.5821418/, `${url} : hors JSON-LD`);
  }
  const hub = JSON.parse(page("/taxi/").match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const biz = hub["@graph"].find((n) => n["@type"] === "LocalBusiness");
  assert.equal(biz.address.streetAddress, "292 Moo 2, Sala Dan");
  assert.equal(biz.geo.latitude, 7.5821418);
});

test("lot du 11.11.2026 : feuille songthaew, préremplissage, prix de la ligne, durée d'un seul tenant", () => {
  const sg = T.songthaewBooking;
  assert.equal(sg.productId, "taxi-songthaew");
  assert.equal(sg.product, "Songthaew");
  assert.equal(sg.vehicle, "songthaew");
  const cfg = config(page("/taxi/songthaew/"));
  assert.equal(cfg.productId, "taxi-songthaew");
  // Surat Thani : aéroport, gare routière ou Donsak, rien de prérempli ; Krabi Airport reste prérempli.
  assert.deepEqual(T.byId["surat-thani-koh-lanta"].booking.ends, { from: "", to: "" });
  assert.equal(T.byId["krabi-airport-koh-lanta"].booking.ends.from, "Krabi Airport (KBV)");
  assert.match(T.byId["phuket-airport-khao-lak"].drive, /1\u00a0hr\u00a030\u00a0min/);
  // Le titre de la feuille et l'en-tête de l'aperçu suivent le sens du trajet.
  assert.equal((page("/taxi/krabi-airport-koh-lanta/").match(/data-route-title/g) || []).length, 2);
  // Encart Secret : photo passée par l'optimiseur d'images, plus le JPEG brut de 411 Ko.
  assert.doesNotMatch(page("/taxi/"), /card-4-islands\.jpg/);
  // Toutes les pages trajet ont la question sur les zones.
  for (const r of T.routes) assert.match(r.faq.at(-1).q, /^Do you cover every part of /, r.url);
});

test("prix par lieu (11.11.2026) : Donsak Pier à 5 000 sur la page Surat Thani, Patong, Kata et Karon à 5 000 sur la page Phuket", () => {
  const doc = (u) => fs.readFileSync(path.join(__dirname, "..", "_site", u, "index.html"), "utf8").replace(/ /g, " ");
  const rows = (u) => [...doc(u).matchAll(/<div><dt>(?:<a href="[^"]+">)?([^<]+)(?:<\/a>)?<\/dt><dd><b>From ([\d,]+) THB<\/b> per vehicle<\/dd><\/div>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(rows("taxi/surat-thani-koh-lanta"), [["Surat Thani Airport and bus terminal", "4,500"], ["Donsak Pier", "5,000"]]);
  assert.deepEqual(rows("taxi/koh-lanta-phuket"), [["Phuket Town", "4,500"], ["Patong, Kata and Karon", "5,000"]]);
  assert.deepEqual(rows("taxi/koh-lanta-donsak-pier"), [], "une page à un seul prix n'a pas de liste par lieu");
  // Donsak Pier (12.11.2026) : une seule page le vise ; la page Surat Thani vise l'aéroport et la gare routière, titre et h1 alignés.
  const st = doc("taxi/surat-thani-koh-lanta");
  assert.match(st, /<title>Surat Thani Airport to Koh Lanta Minivan \| VIP Taxi Lanta<\/title>/);
  assert.match(st, /Surat Thani Airport<\/span> <span class="c-word">to<\/span> <span class="c-to">Koh Lanta/);
  assert.doesNotMatch(st.match(/<meta name="description" content="([^"]*)"/)[1] + st.match(/<p class="lead">([^<]*)/)[1], /Donsak/);
  assert.match(st, /<dt><a href="\/taxi\/koh-lanta-donsak-pier\/">Donsak Pier<\/a><\/dt>/, "la ligne Donsak renvoie à sa page");
  assert.match(doc("taxi/koh-lanta-donsak-pier"), /<span class="c-from">Koh Lanta<\/span> <span class="c-word">to<\/span> <span class="c-to">Donsak Pier<\/span>/);
});

test("note Google de VIP Taxi Lanta (12.11.2026) : une ligne sur les 19 pages trajet et sur /transfers/, lien vers la fiche, jamais dans le JSON-LD", () => {
  const r = require("../src/_data/site.json").brands.vip.rating;
  const line = new RegExp(`<a class="grate" href="${r.url.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")}" rel="noopener">[\\s\\S]*?Rated <b>${r.value.toFixed(1)}</b> on Google, ${r.count} reviews</span></a>`);
  const html = (u) => fs.readFileSync(path.join(__dirname, "..", "_site", u, "index.html"), "utf8");
  let n = 0;
  for (const x of T.routes) { n++; assert.match(html(x.url), line, x.url); }
  assert.equal(n, 18);
  assert.match(html("taxi/songthaew"), line, "la page songthaew est la 19e page trajet");
  assert.match(html("transfers"), line);
  for (const u of ["", "tours/4-islands", "taxi"]) assert.doesNotMatch(html(u), /class="grate"/, `${u || "accueil"} : pas de note de VIP hors des pages privées`);
  for (const x of T.routes.concat([{ url: "/transfers/" }, { url: "/taxi/songthaew/" }])) for (const m of html(x.url).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotMatch(m[1], /aggregateRating|ratingValue|reviewCount/, x.url);
});

test("encart Secret des pages taxi (12.11.2026) : photo en largeurs 480, 800 et 1100, plus le fichier de 1 421 px", () => {
  const h = fs.readFileSync(path.join(__dirname, "..", "_site", "taxi", "krabi-airport-koh-lanta", "index.html"), "utf8");
  const img = h.match(/<img[^>]*alt="Snorkellers in turquoise water[^>]*>/)[0];
  assert.match(img, /srcset="[^"]*-480\.webp 480w, [^"]*-800\.webp 800w, [^"]*-1100\.webp 1100w"/);
  assert.doesNotMatch(img, /-1421\.webp/);
});

test("day trip vers Krabi : feuille avec le nombre de stops et leur nom (Jérémy, 12.11.2026)", () => {
  const D = T.dayTrip;
  assert.equal(D.booking.dayTrip, true);
  assert.equal(D.booking.productId, "taxi-koh-lanta-krabi-day-trip");
  assert.deepEqual(D.booking.stops, D.stops);
  const doc = page(D.url);
  assert.match(doc, /id="book-data"/);
  assert.match(doc, /data-stop-list/);
  assert.match(doc, /name="stopCount"/);
  for (const st of D.stops) assert.match(doc, new RegExp(`data-stop-add="${st}"`));
  // Pas de sens aller-retour, pas de bagages, pas de drop-off : l'hôtel du départ est aussi le retour.
  assert.doesNotMatch(doc, /name="direction"/);
  assert.doesNotMatch(doc, /name="bags"/);
  assert.doesNotMatch(doc, /name="dropoffAt"/);
  assert.match(doc, /data-book="">Check availability/);
});
