// Retour de Jérémy sur la planche (03.11.2026) : règles vérifiables dans les données et les helpers.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const view = require("../src/_includes/components/view.js");

const DATA = path.join(__dirname, "..", "src", "_data", "products");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, rel + ".json"), "utf8"));
const four = P("tours/4-islands");

test("logo : plus aucune piste redessinée, favicons tirés de l'emblème d'origine", () => {
  assert.ok(!fs.existsSync(path.join(__dirname, "..", "src", "images", "brand")));
  for (const n of [32, 180, 512]) assert.ok(fs.existsSync(path.join(__dirname, "..", "src", "images", "secret", `favicon-${n}.png`)), `favicon ${n}`);
  const macros = fs.readFileSync(path.join(__dirname, "..", "src", "_includes", "components", "stt.njk"), "utf8");
  assert.doesNotMatch(macros, /stt-(?:a|b|bv)-/);
  assert.match(macros, /Secret Travel &amp; Tour<\/span><span class="brand-place">Sala Dan, Koh Lanta/);
});

test("barre mobile et bouton du haut : l'option du prix d'appel", () => {
  assert.equal(view.price(four).option, "join-in-longtail");
  assert.equal(view.price(four).short, "adult");
});

test("bandeau : prise en charge, départ, ponton, bateau, formule ; prix et frais de parc dans le talon", () => {
  const t = view.ticket(four);
  assert.deepEqual(t.rows.map((r) => r.label), ["Pickup", "Boat leaves", "Longtail pier", "Boat", "Format"]);
  assert.equal(t.stub.price.amount, "1,000 THB");
  assert.equal(t.stub.fee.adult, "200 THB");
  assert.equal(t.stub.fee.child, "100 THB");
});

test("frais de parc dits une fois : ni sous les options, ni dans « Not included », ni dans « Bring »", () => {
  assert.ok(view.options(four).list.every((o) => !o.fees));
  assert.deepEqual(view.notIncluded(four, { skipParkFee: true }), []);
  assert.ok(!view.beforeBook(four, { booking: {} }, { skipParkFee: true }).some((b) => /park fee/i.test(b.text)));
});

test("déroulé : heures fixes sans ≈, les autres avec ≈ ; plus de « time to do nothing »", () => {
  const steps = view.day(four)[0].steps;
  assert.deepEqual(steps.filter((s) => s.fixed).map((s) => s.t), ["07:45", "09:00"]);
  assert.ok(steps.filter((s) => !s.fixed).every((s) => s.approx));
  assert.doesNotMatch(JSON.stringify(four.day), /time to do nothing/i);
});

test("cartes : promesse de 60 caractères au plus, distincte de l'accroche ; trois cases de faits au plus", () => {
  for (const f of fs.readdirSync(path.join(DATA, "tours")).concat(fs.readdirSync(path.join(DATA, "activities")).map((x) => "../activities/" + x))) {
    const p = P("tours/" + f.replace(/\.json$/, ""));
    if (!p.promise) continue;
    assert.ok(p.promise.length <= 60, `${p.slug} : ${p.promise.length}`);
    assert.notEqual(p.promise, p.lead);
    assert.ok(view.cardFacts(p).length <= 3);
  }
  assert.ok(four.promise);
});

test("saisons : réglette seulement si la saison est connue", () => {
  assert.equal(view.seasonRuler(four), null);
  const rok = view.seasonRuler(P("tours/koh-rok-koh-haa"));
  assert.deepEqual(rok.months.filter((m) => m.open).map((m) => m.short), ["Jan", "Feb", "Mar", "Apr", "Oct", "Nov", "Dec"]);
  const deps = view.departures([four, P("tours/koh-rok-koh-haa")], new Date("2026-06-15T05:00:00Z"));
  assert.equal(deps[0].today, null);
  assert.equal(deps[1].today, false);
});

test("photos : jamais affichées au-delà de la moitié de leur taille native", () => {
  const ph = view.photo(four.photos[0]);
  assert.equal(ph.width, 900);
  assert.equal(ph.cssWidth, 450);
  assert.equal(ph.cssHeight, 338);
});

test("une seule graphie : Thung Yee Peng", () => {
  const all = fs.readdirSync(path.join(DATA, "activities")).map((f) => fs.readFileSync(path.join(DATA, "activities", f), "utf8")).join("");
  assert.doesNotMatch(all, /Tungyeepeng/);
});

test("tableau des départs : grille des speedboats, saison seulement quand elle est donnée", () => {
  const b = view.departureBoard(P("secret-transfers/speedboat-ferry"));
  assert.deepEqual(b.rows.map((r) => r.time), ["09:00", "10:30", "13:00", "14:30", "14:30", "15:00"]);
  assert.equal(b.rows[1].to, "Koh Lipe, Langkawi");
  assert.deepEqual(b.rows[1].season, { from: "11-01", to: "04-15", label: "1 Nov – 15 Apr" });
  assert.equal(b.rows[0].season, null);
});

test("carte billet : ponton, trois cases Pickup, Boat, Day, liquide du parc", () => {
  const c = view.card(four, {});
  assert.equal(c.pier, "Lanta Old Town pier");
  assert.deepEqual(c.facts, [{ label: "Pickup", value: "07:45" }, { label: "Boat", value: "Longtail" }, { label: "Day", value: "Full" }]);
  assert.equal(c.cash.amount, "200 THB");
});

test("ligne de route : lieux, pontons et tronçons en mer", () => {
  const steps = view.day(four)[0].steps;
  assert.deepEqual(steps.map((s) => s.place), ["Your hotel", "Old Town pier", "Koh Chueak", "Koh Mook", "Koh Ngai", "Koh Ma", "Koh Lanta"]);
  assert.equal(steps[0].sea, false);
  assert.ok(steps.slice(1).every((s) => s.sea));
});
