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

test("« What runs on … » : chaque horaire affiché est écrit dans la fiche de la sortie", () => {
  const h = site("index.html");
  const runs = [...h.matchAll(/<li class="run" data-slug="([^"]+)"[^>]*>\s*<span class="run__t">([^<]+)<\/span>[\s\S]*?<span class="run__l">([^<]+)<\/span>/g)];
  assert.ok(runs.length >= 12, String(runs.length));
  for (const [, slug, t, label] of runs) {
    const rel = SLUGS.find((s) => s.endsWith("/" + slug));
    const raw = JSON.stringify(P(rel));
    for (const time of [t].concat(label.match(/\b\d{2}:\d{2}\b/g) || [])) assert.ok(raw.includes(time), `${slug} : ${time}`);
  }
  // Règles écrites : saison de Koh Rok, jours des cours de cuisine.
  assert.match(h, /data-slug="koh-rok-koh-haa"[^>]*data-months="10,11,12,1,2,3,4"/);
  const cooking = P("activities/cooking-class").facts.find((f) => f.label === "Morning class").value;
  assert.match(cooking, /Monday, Wednesday, Saturday/);
  assert.match(h, /data-slug="cooking-class" data-days="1,3,6"/);
  // Sans horaire dans les données : listées à part, jamais placées sur la frise.
  const none = h.split("No set time on the site")[1].split("</ul>")[0];
  for (const n of ["Koh Talabeng &amp; Koh Bubu", "Scuba diving", "ATV (quad bike)", "Electric go-kart"]) assert.ok(none.includes(n), n);
  for (const s of ["koh-talabeng-koh-bubu", "scuba-diving", "atv", "go-kart"]) assert.doesNotMatch(h, new RegExp(`class="run" data-slug="${s}"`));
});

test("calculateur 4 Islands : total ligne par ligne, rien de deviné", () => {
  const a = price.estimate(opt("join-in-longtail"), 2, [7, 2], []);
  assert.equal(a.total, 2 * 1000 + 700 + 0);
  assert.deepEqual(a.unpriced, []);
  const s = price.estimate(opt("join-in-speedboat"), 2, [2], []);
  assert.equal(s.total, 4000);
  assert.deepEqual(s.unpriced, [2], "moins de 4 ans en speedboat : pas de tarif sur le site");
  assert.equal(price.estimate(opt("private-longtail"), 2, [7], []).total, 6400);
  assert.equal(price.estimate(opt("private-longtail"), 5, [], []).total, 6400 + 400);
  assert.equal(price.estimate(opt("private-longtail"), 2, [], ["Add Koh Kradan, per boat"]).total, 5900 + 500);
  assert.equal(price.estimate({ priceOnRequest: true }, 2, [], []), null);
  assert.deepEqual(price.parkCash({ adult: 200, child: 100 }, 2, 1), { total: 500, text: "2 × 200 + 1 × 100 = 500 THB" });
  assert.equal(price.adultFrom(four.options), 12);
});

test("comparateur 4 Islands : chaque prix affiché vient des lignes de prix", () => {
  const h = site("tours/4-islands/index.html");
  const cmp = h.split('class="cmp4"')[1].split("</section>")[0];
  for (const o of four.options) for (const r of o.prices.filter((x) => !/Koh Kradan/.test(x.label))) {
    const shown = r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + r.amount.toLocaleString("en-GB") + " THB";
    assert.ok(cmp.includes(`<span>${r.label}</span><span>${shown}</span>`), `${o.id} : ${r.label}`);
  }
  assert.match(h, /Sketch map, not for navigation/);
  assert.match(h, /© OpenStreetMap contributors/);
  assert.match(h, /id="h-prices"/);
});

test("message de réservation : les suppléments ne suivent que l'option qui les propose", () => {
  const cfg = { variant: "tour", product: "4 Islands", page: "secrettravelandtour.com/tours/4-islands/", refPrefix: "4I",
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
  assert.match(text, /Ref: 4I-2011-2A1C\n4 Islands – Join-in longtail\n/, "option par défaut : la première de la fiche");
  assert.match(text, /Ref: PP-2011-2A1C/);
  assert.match(text, /Ref: KR-2111-2A1C/);
  assert.match(text, /Page: secrettravelandtour\.com\/tours\/koh-rok-koh-haa\//);
  assert.deepEqual(B.sameDayClashes(cat, list.items), [{ date: "2026-11-20", names: ["4 Islands", "Koh Phi Phi"] }]);
  // Les prix du catalogue sont ceux des fiches.
  for (const s of SLUGS) {
    const p = P(s);
    for (const o of p.options || []) {
      const c = cat[p.slug].options.find((x) => x.id === o.id);
      assert.equal(c.rows.length, (o.prices || []).length, `${p.slug} ${o.id}`);
    }
  }
});
