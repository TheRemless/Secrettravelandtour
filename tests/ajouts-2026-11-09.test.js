// Ajouts décidés par le client le 09.11.2026 (docs/refonte/design-v4/build/NOTES.md, « Ajouts du 09.11.2026 ») :
// catamaran au départ d'Ao Nang (Koh Rok et 4 Islands), Koh Rok avec coucher de soleil, départs d'une seconde
// compagnie sur /tours/speedboat/, accueil sans « What runs on … ». Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");

const root = path.join(__dirname, "..");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products", rel + ".json"), "utf8"));
const html = (url) => fs.readFileSync(path.join(root, "_site", url, "index.html"), "utf8");
const cfgOf = (doc) => JSON.parse(doc.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);
const text = (doc) => doc.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const state = (option, over = {}) => Object.assign(B.emptyState({}), { today: "2026-11-09", option, dateChoice: "other", dateOther: "2026-11-21", adults: 2, childAges: [7], pickup: "Ao Nang Cliff Resort", name: "Anna" }, over);

// ---------- Catamaran au départ d'Ao Nang : retiré du site (décision de Jérémy du 11.11.2026) ----------
for (const rel of ["tours/koh-rok-koh-haa", "tours/4-islands"]) {
  test(`catamaran d'Ao Nang retiré de ${rel} : ni option, ni journée, ni texte`, () => {
    const p = P(rel);
    assert.ok(!p.options.some((o) => o.id === "catamaran-ao-nang" || o.boat === "catamaran"));
    assert.ok(!(p.day || []).some((b) => (b.options || []).includes("catamaran-ao-nang")));
    assert.doesNotMatch(text(html(p.url)), /catamaran|Ao Nang/i);
  });
}

// ---------- Koh Rok & Koh Haa avec coucher de soleil (affiche « Rok Haa Island + Sunset ») ----------
test("Koh Rok, coucher de soleil : 2 500 THB adulte, 1 800 THB enfant de 4 à 11 ans (décision du 10.11.2026), 10:00 à 17:50, frais de parc à part", () => {
  const p = P("tours/koh-rok-koh-haa");
  const o = p.options.find((x) => x.id === "sunset");
  assert.ok(!o.priceOnRequest);
  assert.deepEqual(o.prices.map((r) => [r.label, r.amount, r.unit]), [["Adult", 2500, "per person"], ["Child, 4 to 11", 1800, "per person"]]);
  assert.deepEqual(o.prices[1].ages, { min: 4, max: 11 });
  assert.ok(o.notIncludedFees.length > 0, "« Not including National park fee »");
  const day = p.day.find((b) => (b.options || []).includes("sunset"));
  assert.equal(day.steps[0].time, "10:00");
  assert.equal(day.steps[day.steps.length - 1].time, "17:50");
  const doc = html(p.url), t = text(doc);
  assert.doesNotMatch(t, /exists on some days|Ask us\./, "l'ancienne phrase est remplacée par l'option");
  for (const s of ["Later trip, back at sunset", "2,500 THB", "1,800 THB", "17:50"]) assert.ok(t.includes(s), s);
  assert.ok(!t.includes("No child price on the site"));
  const msg = B.buildMessage(cfgOf(doc), state("sunset", { pickup: "Lanta Sand Resort" }));
  assert.match(msg, /^Booking request: Koh Rok & Koh Haa – Later trip, back at sunset\n/);
  // 2 adultes à 2 500 et un enfant de 7 ans à 1 800 : le total se calcule et termine le message.
  assert.match(msg, /\nEstimated total: 6,800 THB$/);
  assert.doesNotMatch(msg, /Ref:|Page:/);
  assert.doesNotMatch(msg, /Departure:/);
});

// ---------- Speedboat : départs d'une seconde compagnie, fusionnés par destination ----------
test("speedboat : les départs de la seconde compagnie sont sur leur destination, réservables, sans prix ni compagnie", () => {
  const sb = P("secret-transfers/speedboat-ferry");
  const other = sb.timetable.otherDepartures;
  // Depuis le 10.11.2026 : arrivées et saisons de la base partenaires, jamais de ponton ni de prix.
  assert.deepEqual(other.map((o) => [o.place, o.deps.map((d) => d.time).join(" ")]), [["Koh Phi Phi", "10:00 13:00 15:30"], ["Phuket", "10:00 13:00 15:30"], ["Koh Lipe", "10:30 12:30"], ["Ao Nang", "09:00 13:30 15:30"]]);
  assert.ok(other.every((o) => o.deps.every((d) => Object.keys(d).every((k) => ["time", "arrives", "season"].includes(k)))), "ni ponton, ni prix");
  const doc = html(sb.url);
  const cfg = cfgOf(doc);
  // Phase 2 : la grille a une bascule « From / To Koh Lanta » ; les départs sont dans data-board="out".
  const board = doc.split('data-board="out"')[1].split('data-board="in"')[0];
  // Une seule ligne par destination : pas de second tableau.
  for (const place of ["Koh Phi Phi", "Phuket", "Koh Lipe", "Ao Nang"]) assert.equal((board.match(new RegExp(`<b>${place}</b>`, "g")) || []).length, 1, place);
  for (const o of other) for (const place of [o.place]) for (const t of o.deps.map((d) => d.time)) {
    const id = "to-" + place.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const route = cfg.routes.find((r) => r.id === id);
    assert.ok(route && route.deps.some((d) => d.time === t), `${place} ${t} dans la feuille`);
    assert.match(board, new RegExp(`data-sb-route="${id}" data-sb-dep="${id}@${t.replace(":", "")}"`), `${place} ${t} : bouton`);
  }
  // Une heure déjà dans la grille complète garde son arrivée (13:00 vers Phi Phi, 10:30 vers Koh Lipe).
  assert.equal(cfg.routes.find((r) => r.id === "to-koh-phi-phi").deps.find((d) => d.time === "13:00").arrives, "13:30");
  assert.equal(cfg.routes.find((r) => r.id === "to-koh-lipe").deps.find((d) => d.time === "10:30").arrives, "13:30");
  assert.doesNotMatch(board, /\d\s?THB/);
  assert.doesNotMatch(doc, /bundhaya/i);
  const st = Object.assign(B.emptyState({}), { today: "2026-11-09", route: "to-ao-nang", departure: "to-ao-nang@0900", dateChoice: "other", dateOther: "2026-11-20", adults: 2, childAges: [], tripType: "one-way", pickup: "Lanta Sand Resort", name: "Anna" });
  assert.deepEqual(B.validate(cfg, st), {});
  const sbMsg = B.buildMessage(cfg, st);
  assert.match(sbMsg, /^Speedboat request: Koh Lanta to Ao Nang\nDeparture: 09:00, arrives 10:30\nDate: Fri 20 Nov 2026\nSeason: 1 Nov – 4 May\nTicket: one way\n/);
  assert.doesNotMatch(sbMsg, /Ref:|Page:/);
});
