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
  assert.equal(price.estimate(opt("private-longtail"), 2, [7], []).total, 6400);
  assert.equal(price.estimate(opt("private-longtail"), 2, [2], []).total, 5900, "bateau privé : les moins de 4 ans ne comptent pas dans le groupe");
  assert.equal(price.parkCash({ adult: 200, child: 100, childAges: { min: 4, max: 11 } }, 2, [2, 7, 12]).total, 3 * 200 + 100, "frais de parc : gratuit sous 4 ans, enfant de 4 à 11, adulte dès 12");
  assert.equal(price.estimate(opt("private-longtail"), 5, [], []).total, 7400, "5 personnes : 7 400 (décision de Jérémy, 11.11.2026), plus de +400 par personne");
  assert.equal(price.estimate(opt("private-longtail"), 2, [], ["Add Koh Kradan, per boat"]).total, 5900 + 500);
  assert.equal(price.estimate({ priceOnRequest: true }, 2, [], []), null);
  assert.deepEqual(price.parkCash({ adult: 200, child: 100 }, 2, 1), { total: 500, text: "2 × 200 + 1 × 100 = 500 THB" });
  assert.equal(price.adultFrom(four.options), 12);
});

test("tours privés en longtail (11.11.2026) : prix jusqu'à 6 personnes, 7 et plus sur demande, rien de deviné", () => {
  const total = (o, n, ages) => { const e = price.estimate(o, n, ages || [], []); return e && e.total; };
  const four4 = opt("private-longtail");
  const rok = P("tours/koh-rok-koh-haa").options.find((o) => o.id === "private-longtail");
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => total(four4, n)), [5900, 5900, 6400, 6400, 7400, 7400]);
  assert.deepEqual([7, 8, 10, 12, 14, 16].map((n) => total(four4, n)), [null, null, null, null, null, null], "4 Îles : 7 personnes et plus sur demande");
  assert.ok(!four4.prices.some((r) => /extra person/i.test(r.label)), "plus de supplément par personne");
  assert.equal(four4.prices.filter((r) => typeof r.amount === "number" && r.amount > 7400 && !r.supplement).length, 0, "aucun prix pour 7 personnes et plus");
  assert.ok(four4.prices.some((r) => r.label === "7 people or more" && r.text === "On request"));
  assert.equal(price.estimate(four4, 2, [], ["Add Koh Kradan, per boat"]).total, 5900 + 500);
  assert.equal(price.estimate(four4, 6, [], ["Add Koh Kradan, per boat"]).total, 7400 + 500);
  // Les enfants de 4 ans et plus comptent dans le groupe, ceux de moins de 4 ans non.
  assert.equal(total(four4, 4, [5]), 7400);
  assert.equal(total(four4, 4, [2]), 6400);
  assert.equal(total(four4, 6, [5]), null, "7 avec l'enfant : sur demande");
  assert.deepEqual([1, 3, 4, 5, 6].map((n) => total(rok, n)), [7400, 7400, 7900, 7900, 7900]);
  for (const n of [7, 8, 10, 11]) assert.equal(total(rok, n), null, `Koh Rok, ${n} personnes : sur demande`);
  assert.ok(!rok.prices.some((r) => typeof r.amount === "number" && r.amount > 7900));
  assert.ok(rok.prices.some((r) => r.label === "7 people or more" && r.text === "On request"));
});

test("calculateur des radeaux Lacha Ru (11.11.2026) : base pour 1 ou 2 adultes, adulte en plus, enfant à son tarif", () => {
  const raft = (slug) => P("tours/" + slug).options[0];
  const A = raft("sunrise-raft"), B = raft("sunset-dinner-raft"), C = raft("fishing-trip");
  // A : 3 500 pour 1 ou 2, + 1 500 par adulte en plus, enfant 3 à 9 ans 1 200
  assert.equal(price.estimate(A, 1, [], []).total, 3500);
  assert.equal(price.estimate(A, 2, [], []).total, 3500);
  assert.equal(price.estimate(A, 3, [], []).total, 5000, "un groupe de 3 en A paie 5 000");
  assert.equal(price.estimate(A, 4, [], []).total, 6500);
  assert.equal(price.estimate(A, 2, [5], []).total, 3500 + 1200);
  assert.equal(price.estimate(A, 3, [5, 9], []).total, 5000 + 2 * 1200);
  // B et C : 3 900 pour 1 ou 2, + 1 800 par adulte en plus, enfant 3 à 9 ans 1 500
  for (const o of [B, C]) {
    assert.equal(price.estimate(o, 2, [], []).total, 3900);
    assert.equal(price.estimate(o, 3, [], []).total, 5700);
    assert.equal(price.estimate(o, 4, [], []).total, 7500);
    assert.equal(price.estimate(o, 2, [4], []).total, 3900 + 1500);
    assert.equal(price.estimate(o, 3, [3], []).total, 5700 + 1500);
  }
  // Un âge sans tarif (moins de 3 ans) n'est pas deviné ; le devis du formulaire redevient « on WhatsApp ».
  assert.deepEqual(price.estimate(A, 2, [2], []).unpriced, [2]);
  assert.equal(price.quote(A, { adults: 2, ages: [2] }).unpriced.length, 1);
  assert.equal(price.estimate(A, 0, [5], []), null);
});

test("fiches des radeaux : le prix de base dit pour combien de personnes, plus de « From 3 people, per person »", () => {
  const expect = { "sunrise-raft": [3500, 1500, 1200, 5000], "sunset-dinner-raft": [3900, 1800, 1500, 5700], "fishing-trip": [3900, 1800, 1500, 5700] };
  for (const [slug, [base, extra, child, three]] of Object.entries(expect)) {
    const o = P("tours/" + slug).options[0];
    const rows = Object.fromEntries(o.prices.map((r) => [r.label, r]));
    assert.equal(rows["1 or 2 people, the raft"].amount, base, slug);
    assert.equal(rows["1 or 2 people, the raft"].unit, "per raft", slug);
    assert.equal(rows["Each extra person"].amount, extra, slug);
    assert.equal(rows["Each extra person"].supplement, true, slug);
    assert.equal(rows["Child 3 to 9, per person"].amount, child, slug);
    assert.equal(base + extra, three, slug);
    const f = (n) => n.toLocaleString("en-GB");
    assert.ok(o.note.includes(`The price covers 1 or 2 people. Each extra person adds ${f(extra)} THB, so a group of 3 pays ${f(three)} THB. Children from 3 to 9 pay ${f(child)} THB each.`), slug);
    const h = site(`tours/${slug}/index.html`);
    assert.doesNotMatch(h, /From 3 people|3 or more people/, slug);
    assert.match(h, new RegExp(`a group of 3 pays ${f(three)} THB`), slug);
  }
});

test("batik : forfait journée complète à 2 200 et 1 600, cours du matin et de l'après-midi à 1 500 et 1 000", () => {
  const b = P("activities/batik");
  const amounts = (id) => Object.fromEntries(b.options.find((o) => o.id === id).prices.map((r) => [r.label, r.amount]));
  assert.deepEqual(amounts("kayak-and-painting"), { Adult: 2200, "Child, 3 to 10": 1600 });
  assert.deepEqual(amounts("morning-or-afternoon"), { Adult: 1500, "Child, 3 to 10": 1000 });
  assert.equal(b.price.from, 1500, "prix d'appel = cours du matin ou de l'après-midi");
  const kayak = b.options.find((o) => o.id === "kayak-and-painting");
  assert.equal(price.estimate(kayak, 2, [6], []).total, 2 * 2200 + 1600);
  const h = site("tours/batik/index.html");
  assert.match(h, /2,200 THB/);
  assert.match(h, /1,600 THB/);
});

test("bloc « Choose your boat » de la 4 Islands : chaque prix affiché vient des lignes de prix", () => {
  // Phase 1 (09.11.2026) : sélecteur, comparateur et calculateur fondus en un seul bloc ; chaque ligne y reste.
  const h = site("tours/4-islands/index.html");
  const pick = h.split('id="opt-h"')[1].split("</section>")[0];
  for (const o of four.options) for (const r of o.prices) {
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

test("message de réservation : un groupe de 7 sur un bateau privé donne « on request » et le nombre de personnes", () => {
  for (const slug of ["4-islands", "koh-rok-koh-haa"]) {
    const cfg = JSON.parse(site(`tours/${slug}/index.html`).match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
    const st = (n, kids) => Object.assign(B.emptyState(cfg), { dateChoice: "other", dateOther: "2026-11-20", today: "2026-11-08", adults: n, childAges: kids || [], option: "private-longtail" });
    assert.match(B.buildMessage(cfg, st(7)), /\nGuests: 7 adults\n[\s\S]*Price: on request, group of 7 people/, slug);
    assert.match(B.buildMessage(cfg, st(6, [5])), /Price: on request, group of 7 people/, `${slug} : enfant de 5 ans compté`);
    assert.doesNotMatch(B.buildMessage(cfg, st(6, [2])), /on request/, `${slug} : moins de 4 ans ne comptent pas`);
    assert.match(B.buildMessage(cfg, st(6)), /Estimated total: 7,[49]00 THB/, slug);
  }
});

test("liste de sorties : un message classé par jour, un prix par sortie, total de la liste, alerte le même jour", () => {
  const cat = JSON.parse(site("data/catalog.json"));
  assert.equal(Object.keys(cat).length, 15);
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
  assert.match(text, /\nFri 20 Nov 2026\n4 Islands – option to choose\n/);
  const v = B.validateTripList(cat, { ...list, items: list.items.map((it, i) => ({ ...it, id: "t" + i })) }, "2026-11-08");
  assert.deepEqual(v.items, { t1: { option: "Choose an option for 4 Islands." } });
  // Ni référence ni page par sortie (10.11.2026).
  assert.doesNotMatch(text, /Ref:|Page:/);
  // Phase 2 : chaque sortie de la liste porte son total estimé, calculé comme dans la feuille (2 adultes à 2 000 THB
  // et un enfant de 7 ans à 1 000 THB) ; une sortie sans option choisie n'en a pas.
  assert.match(text, /\nKoh Rok & Koh Haa – Join-in speedboat\nEstimated total: 5,000 THB$/);
  assert.match(text, /\nKoh Phi Phi – Join-in speedboat\nEstimated total: 5,000 THB\n/);
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
  // Sortie au coucher de soleil : 2 adultes à 2 500 et un enfant à 1 800 (décision du 10.11.2026).
  assert.ok(sunset.includes("\nKoh Rok & Koh Haa – Later trip, back at sunset\nEstimated total: 6,800 THB\n"));
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
  assert.match(site("tours/koh-rok-koh-haa/index.html"), /<dt>Guests per boat<\/dt><dd>Join-in speedboat and the later sunset trip: 25 to 45 guests<\/dd>/);
  assert.match(site("tours/koh-phi-phi/index.html"), /<dt>Guests per boat<\/dt><dd>Join-in speedboat: 25 to 45 guests<\/dd>/);
  // Aucune capacité sur les tours privés, les radeaux ni les sorties en mangrove.
  for (const s of ["fishing-trip", "sunrise-raft", "sunset-dinner-raft", "mangroves"]) assert.doesNotMatch(site(`tours/${s}/index.html`), /25 to (35|45) guests/, s);
});

test("go-kart : jamais de « minimum » de séances ou de programmes, prix par kart comme la brochure", () => {
  const h = site("tours/go-kart/index.html");
  assert.doesNotMatch(h, /minimum (of )?2|2 programmes|2 sessions/i);
  assert.doesNotMatch(JSON.stringify(P("activities/go-kart")), /minimum (of )?2|2 programmes|2 sessions/i);
  for (const o of P("activities/go-kart").options) for (const r of o.prices) assert.equal(r.unit, "per kart");
});
