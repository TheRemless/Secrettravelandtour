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

test("19 trajets, toutes les adresses d'avant gardées", () => {
  const before = require("../src/_data/taxiRoutes.json").routes.map((r) => `/taxi/${r.id}/`);
  assert.equal(T.routes.length, 19);
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

test("donnée absente, rien d'affiché : Krabi Airport → Khao Lak n'a pas de durée", () => {
  const r = T.byId["krabi-airport-khao-lak"];
  assert.equal(r.drive, "");
  const doc = page(r.url);
  assert.doesNotMatch(doc, /class="c-drive"/);
  assert.match(page("/taxi/krabi-airport-koh-lanta/"), /<p class="c-drive">About 2 to 3 hours/);
});

test("aucun téléphone, aucun prix inventé, plus de « Minivan Taxi » sur le taxi", () => {
  for (const url of ["/taxi/"].concat(T.routes.map((r) => r.url))) {
    const doc = page(url);
    assert.doesNotMatch(doc, /href="tel:|mailto:/, url);
    assert.doesNotMatch(doc, /\d+\s?(THB|฿|CHF|€)/, url);
    assert.doesNotMatch(doc, /minivan taxi/i, url);
    assert.match(doc, /Price on WhatsApp/, url);
  }
});

test("hub : les 17 trajets en liens, une feuille libre From et To, la liste des lieux", () => {
  const doc = page("/taxi/");
  for (const r of T.routes) assert.match(doc, new RegExp(`<a class="rr" href="${r.url}"`), r.id);
  const cfg = config(doc);
  assert.equal(cfg.variant, "taxi");
  assert.ok(!cfg.from && !cfg.to);
  assert.match(doc, /<input id="book-from"/);
  assert.match(doc, /<input id="book-to"/);
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
