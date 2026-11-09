// Design v4 (accueil, 4 Islands, hub) : faits lus dans les données, calculs de prix, liste de sorties.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const site = (f) => fs.readFileSync(path.join(root, "_site", f), "utf8");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products", rel + ".json"), "utf8"));
const price = require("../src/js/v4-price.js");
const B = require("../src/js/booking.js");
const four = P("tours/4-islands");
const opt = (id) => four.options.find((o) => o.id === id);
const SLUGS = ["tours/4-islands", "tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/koh-talabeng-koh-bubu", "tours/mangroves", "tours/fishing-trip",
  "activities/elephant-sanctuary", "activities/kayak", "activities/cooking-class", "activities/scuba-diving", "activities/atv", "activities/batik", "activities/go-kart"];

test("v4 : aucune donnée manquante affichée, un seul H1, ni adresse ni comptoir sur les trois pages", () => {
  for (const f of ["index.html", "tours/4-islands/index.html", "tours/index.html"]) {
    const h = site(f);
    assert.doesNotMatch(h, /DONNÉE À FOURNIR|PHOTO À FOURNIR|TODO\(client\)/, f);
    assert.equal((h.match(/<h1\b/g) || []).length, 1, f);
    assert.doesNotMatch(h.replace(/<script[\s\S]*?<\/script>/g, ""), /292\s*Moo|our desk/i, f);
  }
});

test("v4 : l'accueil et le hub mènent aux 13 fiches", () => {
  for (const f of ["index.html", "tours/index.html"]) {
    const h = site(f);
    for (const s of SLUGS) assert.match(h, new RegExp(`href="${P(s).url}"`), `${f} : ${s}`);
  }
  assert.equal((site("tours/index.html").match(/<article class="card"/g) || []).length, 13);
});

test("accueil : plus de bloc « What runs on … » (client, 09.11.2026), la fiche cuisine garde ses jours", () => {
  const h = site("index.html");
  assert.doesNotMatch(h, /id="runs"|class="run"|data-ribbon|Set times, trip by trip|No set time on the site|Not on this day/);
  assert.doesNotMatch(site("js/v4-home.js"), /runs|ribbon/);
  // Fait gardé de l'ancien test : jours du cours de cuisine du matin, lus dans la fiche.
  const cooking = P("activities/cooking-class").facts.find((f) => f.label === "Morning class").value;
  assert.match(cooking, /Monday, Wednesday, Saturday/);
});

test("calculateur 4 Islands : total ligne par ligne, rien de deviné", () => {
  const a = price.estimate(opt("join-in-longtail"), 2, [7, 2], []);
  assert.equal(a.total, 2 * 1000 + 600 + 0, "enfant 600 THB, brochure Lanta Longtail (08.11.2026)");
  assert.deepEqual(a.unpriced, []);
  const s = price.estimate(opt("join-in-speedboat"), 2, [2], []);
  assert.equal(s.total, 4000);
  assert.deepEqual(s.unpriced, [], "moins de 4 ans gratuits en speedboat join-in (client, 08.11.2026)");
  assert.equal(price.estimate(opt("private-longtail"), 2, [7], []).total, 6400);
  assert.equal(price.estimate(opt("private-longtail"), 2, [2], []).total, 5900, "bateau privé : les moins de 4 ans ne comptent pas dans le groupe");
  assert.equal(price.parkCash({ adult: 200, child: 100, childAges: { min: 4, max: 11 } }, 2, [2, 7, 12]).total, 3 * 200 + 100, "frais de parc : gratuit sous 4 ans, enfant de 4 à 11, adulte dès 12");
  assert.equal(price.estimate(opt("private-longtail"), 5, [], []).total, 6400 + 400);
  assert.equal(price.estimate(opt("private-longtail"), 2, [], ["Add Koh Kradan, per boat"]).total, 5900 + 500);
  assert.equal(price.estimate({ priceOnRequest: true }, 2, [], []), null);
  assert.deepEqual(price.parkCash({ adult: 200, child: 100 }, 2, 1), { total: 500, text: "2 × 200 + 1 × 100 = 500 THB" });
  assert.equal(price.adultFrom(four.options), 12);
});

test("bloc « Choose your boat » de la 4 Islands : chaque prix affiché vient des lignes de prix", () => {
  // Phase 1 (09.11.2026) : sélecteur, comparateur et calculateur fondus en un seul bloc ; chaque ligne y reste.
  const h = site("tours/4-islands/index.html");
  const pick = h.split('id="opt-h"')[1].split("</section>")[0];
  for (const o of four.options) for (const r of o.prices) {
    const shown = r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + r.amount.toLocaleString("en-GB") + " THB";
    const block = pick.split(`data-po="${o.id}"`)[1].split('class="po"')[0];
    assert.ok(block.includes(`<span>${r.label}</span>`) && block.includes(`<b>${shown}</b>`), `${o.id} : ${r.label}`);
  }
  assert.doesNotMatch(h, /class="cmp4"|The boats side by side/, "plus de comparateur à part");
  assert.match(h, /Sketch map, not for navigation/);
  assert.match(h, /© OpenStreetMap contributors/);
  assert.match(h, /id="h-prices"/);
  assert.match(h, /data-lbl="To Koh Lanta Noi pier"/, "le speedboat part de Koh Lanta Noi, pas de Lanta Old Town");
});

test("message de réservation : les suppléments ne suivent que l'option qui les propose", () => {
  const cfg = { variant: "tour", product: "4 Islands", page: "secrettravelandtour.com/tours/4-islands/", refPrefix: "FOUR",
    options: [{ id: "private-longtail", title: "Private longtail", rows: [{ label: "Add Koh Kradan, per boat", price: "+500 THB" }] }, { id: "join-in-longtail", title: "Join-in longtail", rows: [] }] };
  const base = Object.assign(B.emptyState(cfg), { dateChoice: "other", dateOther: "2026-11-20", today: "2026-11-08", adults: 2, addons: ["Add Koh Kradan, per boat"] });
  assert.match(B.buildMessage(cfg, Object.assign({}, base, { option: "private-longtail" })), /\nExtras: Add Koh Kradan, per boat\n/);
  assert.doesNotMatch(B.buildMessage(cfg, Object.assign({}, base, { option: "join-in-longtail" })), /Extras/);
});

test("liste de sorties : un message classé par jour, une référence par sortie, alerte le même jour", () => {
  const cat = JSON.parse(site("data/catalog.json"));
  assert.equal(Object.keys(cat).length, 13);
  const list = {
    adults: 2, childAges: [7], pickup: "Lanta Sand Resort", name: "Anna",
    items: [
      { slug: "koh-rok-koh-haa", option: "join-in-speedboat", date: "2026-11-21" },
      { slug: "4-islands", option: "", date: "2026-11-20" },
      { slug: "koh-phi-phi", option: "join-in-speedboat", date: "2026-11-20" }
    ]
  };
  const text = B.buildTripList(cat, list);
  const lines = text.split("\n");
  assert.equal(lines[0], "Trip list: 3 trips");
  assert.equal(lines[1], "Guests: 2 adults, 1 child (age 7)");
  assert.ok(text.indexOf("Fri 20 Nov 2026") < text.indexOf("Sat 21 Nov 2026"));
  // Plus d'option par défaut (demande du client, 08.11.2026) : la sortie à trois bateaux attend son choix et la liste ne part pas.
  assert.match(text, /Ref: FOUR-2011-2A1C\n4 Islands – option to choose\n/);
  const v = B.validateTripList(cat, { ...list, items: list.items.map((it, i) => ({ ...it, id: "t" + i })) }, "2026-11-08");
  assert.deepEqual(v.items, { t1: { option: "Choose an option for 4 Islands." } });
  assert.match(text, /Ref: PP-2011-2A1C/);
  assert.match(text, /Ref: ROK-2111-2A1C/);
  assert.match(text, /Page: secrettravelandtour\.com\/tours\/koh-rok-koh-haa\//);
  assert.deepEqual(B.sameDayClashes(cat, list.items), [{ date: "2026-11-20", names: ["4 Islands", "Koh Phi Phi"] }]);
  // Les prix du catalogue sont ceux des fiches.
  for (const s of SLUGS) {
    const p = P(s);
    // « Rentals and discounts » de la plongée (kind "extra") n'est pas une sortie de la liste : affiché sur la fiche seulement.
    for (const o of (p.options || []).filter((x) => x.kind !== "extra")) {
      const c = cat[p.slug].options.find((x) => x.id === o.id);
      assert.equal(c.rows.length, (o.prices || []).length, `${p.slug} ${o.id}`);
    }
  }
});
