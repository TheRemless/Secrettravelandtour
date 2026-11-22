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
const SLUGS = ["tours/4-islands", "tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/mangroves", "tours/fishing-trip", "tours/sunset-dinner-raft", "tours/sunrise-raft", "activities/mangrove-kayaking", 
  "activities/elephant-sanctuary", "activities/kayak", "activities/cooking-class", "activities/scuba-diving", "activities/atv", "activities/batik", "activities/go-kart"];

test("v4 : aucune donnée manquante affichée, un seul H1, ni adresse ni comptoir sur les trois pages", () => {
  for (const f of ["index.html", "tours/4-islands/index.html", "tours/index.html"]) {
    const h = site(f);
    assert.doesNotMatch(h, /DONNÉE À FOURNIR|PHOTO À FOURNIR|TODO\(client\)/, f);
    assert.equal((h.match(/<h1\b/g) || []).length, 1, f);
    assert.doesNotMatch(h.replace(/<script[\s\S]*?<\/script>/g, ""), /292\s*Moo|our desk/i, f);
  }
});

test("v4 : l'accueil et le hub mènent aux 15 fiches (découpage du 11.11.2026)", () => {
  for (const f of ["index.html", "tours/index.html"]) {
    const h = site(f);
    for (const s of SLUGS) assert.match(h, new RegExp(`href="${P(s).url}"`), `${f} : ${s}`);
  }
  assert.equal((site("tours/index.html").match(/<article class="card[ "]/g) || []).length, 15);
});

test("accueil : plus de bloc « What runs on … » (client, 09.11.2026), la fiche cuisine garde ses jours", () => {
  const h = site("index.html");
  assert.doesNotMatch(h, /id="runs"|class="run"|data-ribbon|Set times, trip by trip|No set time on the site|Not on this day/);
  assert.doesNotMatch(site("js/v4-home.js"), /runs|ribbon/);
  // Fait gardé de l'ancien test : jours du cours du midi (ex « Morning class »), lus dans la fiche.
  const cooking = P("activities/cooking-class").facts.find((f) => f.label === "Lunch class").value;
  assert.match(cooking, /Monday, Wednesday, Saturday/);
});

test("calculateur 4 Islands : total ligne par ligne, rien de deviné", () => {
  const a = price.estimate(opt("join-in-longtail"), 2, [7, 2], []);
  assert.equal(a.total, 2 * 1000 + 600 + 0, "enfant 600 THB, brochure Lanta Longtail (08.11.2026)");
  assert.deepEqual(a.unpriced, []);
  const s = price.estimate(opt("join-in-speedboat"), 2, [2], []);
  assert.equal(s.total, 4000);
  assert.deepEqual(s.unpriced, [], "moins de 4 ans gratuits en speedboat join-in (client, 08.11.2026)");
  assert.equal(price.parkCash({ adult: 200, child: 100, childAges: { min: 4, max: 11 } }, 2, [2, 7, 12]).total, 3 * 200 + 100, "frais de parc : gratuit sous 4 ans, enfant de 4 à 11, adulte dès 12");
  assert.equal(price.estimate({ priceOnRequest: true }, 2, [], []), null);
  assert.equal(price.estimate(opt("private-longtail"), 2, [], []), null, "bateau privé sur demande (18.11.2026)");
  assert.deepEqual(price.parkCash({ adult: 200, child: 100 }, 2, 1), { total: 500, text: "2 × 200 + 1 × 100 = 500 THB" });
  assert.equal(price.adultFrom(four.options), 12);
});

test("bateaux privés sur demande en haute saison (18.11.2026) : aucun prix, aucun total, l'option reste réservable", () => {
  for (const rel of ["tours/4-islands", "tours/koh-phi-phi", "tours/koh-rok-koh-haa"]) {
    const o = P(rel).options.find((x) => x.id === "private-longtail");
    assert.equal(o.priceOnRequest, true, rel);
    assert.equal(o.prices, undefined, rel);
    for (const n of [1, 2, 5, 7]) assert.equal(price.estimate(o, n, [], []), null, `${rel}, ${n} personnes`);
    assert.match(o.note, /we reply with the price for your day/, rel);
    assert.match(o.note, /Children from 4 count in the group size, under 4 do not\./, rel);
  }
  assert.match(opt("private-longtail").note, /Koh Kradan can be added/);
});

test("bloc « Choose your boat » de la 4 Islands : chaque prix affiché vient des lignes de prix", () => {
  // Phase 1 (09.11.2026) : sélecteur, comparateur et calculateur fondus en un seul bloc ; chaque ligne y reste.
  const h = site("tours/4-islands/index.html");
  const pick = h.split('id="opt-h"')[1].split("</section>")[0];
  for (const o of four.options) for (const r of o.prices || []) {
    const shown = typeof r.amount !== "number" ? r.text : r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + r.amount.toLocaleString("en-GB") + " THB";
    const block = pick.split(`data-po="${o.id}"`)[1].split('class="po"')[0];
    // Le libellé affiché perd la fin qui redit l'unité (« Add Koh Kradan, per boat » devient « Add Koh Kradan »).
    const tail = r.unit ? ", " + r.unit.toLowerCase() : "";
    const label = tail && r.label.toLowerCase().endsWith(tail) ? r.label.slice(0, -tail.length) : r.label;
    assert.ok(block.includes(`<span>${label}</span>`) && block.includes(`<b>${shown}</b>`), `${o.id} : ${r.label}`);
  }
  assert.doesNotMatch(h, /class="cmp4"|The boats side by side/, "plus de comparateur à part");
  assert.match(h, /Sketch map, not for navigation/);
  assert.match(h, /© OpenStreetMap contributors/);
  assert.match(h, /id="h-prices"/);
  // Le speedboat part de Lanta Old Town, comme les longtails (décision de Jérémy du 10.11.2026).
  assert.doesNotMatch(h, /data-lbl="To Koh Lanta Noi pier"/, "le speedboat part de Lanta Old Town");
});

test("message de réservation : les suppléments ne suivent que l'option qui les propose", () => {
  const cfg = { variant: "tour", product: "4 Islands", page: "secrettravelandtour.com/tours/4-islands/", refPrefix: "FOUR",
    options: [{ id: "private-longtail", title: "Private longtail", rows: [{ label: "Add Koh Kradan, per boat", price: "+500 THB" }] }, { id: "join-in-longtail", title: "Join-in longtail", rows: [] }] };
  const base = Object.assign(B.emptyState(cfg), { dateChoice: "other", dateOther: "2026-11-20", today: "2026-11-08", adults: 2, addons: ["Add Koh Kradan, per boat"] });
  assert.match(B.buildMessage(cfg, Object.assign({}, base, { option: "private-longtail" })), /\nExtras: Add Koh Kradan, per boat\n/);
  assert.doesNotMatch(B.buildMessage(cfg, Object.assign({}, base, { option: "join-in-longtail" })), /Extras/);
});

test("message de réservation : un bateau privé ne porte aucun prix ni total, comme toute option sur demande (18.11.2026)", () => {
  for (const slug of ["4-islands", "koh-phi-phi", "koh-rok-koh-haa"]) {
    const cfg = JSON.parse(site(`tours/${slug}/index.html`).match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
    const st = (n, kids) => Object.assign(B.emptyState(cfg), { dateChoice: "other", dateOther: "2026-11-20", today: "2026-11-08", adults: n, childAges: kids || [], option: "private-longtail" });
    for (const [n, kids] of [[2], [6, [5]], [7]]) {
      const msg = B.buildMessage(cfg, st(n, kids));
      assert.match(msg, /^Booking request: .* – Private longtail\n/, `${slug}, ${n}`);
      assert.doesNotMatch(msg, /THB|Estimated total|^Price/m, `${slug}, ${n}`);
    }
  }
});

test("liste de sorties : un message classé par jour, un prix par sortie, total de la liste, alerte le même jour", () => {
  const cat = JSON.parse(site("data/catalog.json"));
  assert.equal(Object.keys(cat).length, 15);
  const list = {
    adults: 2, childAges: [7], pickup: "Lanta Sand Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123",
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
  assert.match(text, /\nFri 20 Nov 2026\n4 Islands – option to choose\n/);
  const v = B.validateTripList(cat, { ...list, items: list.items.map((it, i) => ({ ...it, id: "t" + i })) }, "2026-11-08");
  assert.deepEqual(v.items, { t1: { option: "Choose an option for 4 Islands." } });
  // Ni référence ni page par sortie (10.11.2026).
  assert.doesNotMatch(text, /Ref:|Page:/);
  // Phase 2 : chaque sortie de la liste porte son total estimé, calculé comme dans la feuille (2 adultes à 2 000 THB
  // et un enfant de 7 ans à 1 000 THB) ; une sortie sans option choisie n'en a pas.
  assert.match(text, /\nKoh Rok & Koh Haa – Day trip\nEstimated total: 5,000 THB$/);
  assert.match(text, /\nKoh Phi Phi – Day trip\nEstimated total: 5,000 THB\n/);
  assert.match(text, /\n4 Islands – option to choose\n\n/, "sans option, ni prix ni total");
  // Une sortie sans total : pas de total de la liste.
  assert.doesNotMatch(text, /all trips/);
  // Deux sorties le même jour (4 Islands et Koh Phi Phi le 20) : une ligne vide les sépare (E-11).
  assert.match(text, /\nFri 20 Nov 2026\n4 Islands – option to choose\n\nKoh Phi Phi – /);
  // Toutes les options choisies : le total de la liste suit une ligne vide (4 Islands en longtail : 2 × 1 000 + 600).
  const full = B.buildTripList(cat, { ...list, items: list.items.map((it) => it.slug === "4-islands" ? { ...it, option: "join-in-longtail" } : it) });
  assert.match(full, /\n4 Islands – Join-in longtail\nEstimated total: 2,600 THB\n/);
  assert.ok(full.endsWith("\nEstimated total: 5,000 THB\n\nEstimated total, all trips: 12,600 THB"));
  // Une seule sortie : son total suffit. Une sortie sans total (coucher de soleil, pas de prix enfant) : son prix, pas de total de la liste.
  assert.doesNotMatch(B.buildTripList(cat, { ...list, items: [list.items[0]] }), /all trips/);
  const sunset = B.buildTripList(cat, { ...list, items: [list.items[0], { slug: "koh-rok-koh-haa", option: "sunset", date: "2026-11-22" }] });
  // Sortie au coucher de soleil : 2 adultes à 2 900 et un enfant à 1 900 (flyer du 22.11.2026).
  assert.ok(sunset.includes("\nKoh Rok & Koh Haa – Sunset trip\nEstimated total: 7,700 THB\n"));
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

test("capacité des bateaux des tours partagés (11.11.2026) : speedboat 25 à 45, longtail 25 à 35, jamais sur un tour privé", () => {
  const four = site("tours/4-islands/index.html");
  const block = (h, id) => h.split(`data-po="${id}"`)[1].split('class="po"')[0];
  assert.match(block(four, "join-in-speedboat"), /<dt>Guests<\/dt><dd>25 to 45 guests<\/dd>/);
  assert.match(block(four, "join-in-longtail"), /<dt>Guests<\/dt><dd>25 to 35 guests<\/dd>/);
  assert.doesNotMatch(block(four, "private-longtail"), /<dt>Guests<\/dt>|25 to (35|45)/);
  assert.match(site("tours/koh-rok-koh-haa/index.html"), /<dt>Guests per boat<\/dt><dd>Day trip and sunset trip: 25 to 45 guests<\/dd>/);
  assert.match(site("tours/koh-phi-phi/index.html"), /<dt>Guests per boat<\/dt><dd>Day trip: 25 to 45 guests<\/dd>/);
  // Aucune capacité sur les tours privés, les radeaux ni les sorties en mangrove.
  for (const s of ["fishing-trip", "sunrise-raft", "sunset-dinner-raft", "mangroves"]) assert.doesNotMatch(site(`tours/${s}/index.html`), /25 to (35|45) guests/, s);
});

test("go-kart : jamais de « minimum » de séances ou de programmes, prix par kart comme la brochure", () => {
  const h = site("tours/go-kart/index.html");
  assert.doesNotMatch(h, /minimum (of )?2|2 programmes|2 sessions/i);
  assert.doesNotMatch(JSON.stringify(P("activities/go-kart")), /minimum (of )?2|2 programmes|2 sessions/i);
  for (const o of P("activities/go-kart").options) for (const r of o.prices) assert.equal(r.unit, "per kart");
});
