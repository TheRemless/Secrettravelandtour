// Radeaux privés de Thung Yee Peng : prix par radeau pour 1 à 2, 3 à 4, 5 à 6 et 7 à 8 personnes (grille du 27.11.2026),
// enfants comptés comme une personne, rien au-delà de 8 (prix sur WhatsApp). Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const P = require("../src/js/v4-price.js");
const B = require("../src/js/booking.js");
const KEYS = require("../src/_data/gestion-keys.json");

const GRID = {
  "sunrise-raft": [3500, 4500, 5500, 6500],
  "fishing-trip": [3900, 5900, 7900, 9900],
  "sunset-dinner-raft": [3900, 5900, 7900, 9900]
};
const product = (slug) => require(`../src/_data/products/tours/${slug}.json`);

for (const [slug, amounts] of Object.entries(GRID)) {
  const opt = product(slug).options[0];
  const total = (a, k) => (P.quote(opt, { adults: a, ages: k }) || {}).total;

  test(`${slug} : quatre tranches, ni supplément ni tarif enfant`, () => {
    assert.deepEqual(opt.prices.map((r) => [r.label, r.amount, r.group.min, r.group.max]), amounts.map((a, i) => [`${2 * i + 1} to ${2 * i + 2} people, the raft`, a, 2 * i + 1, 2 * i + 2]));
    assert.ok(opt.prices.every((r) => !r.supplement && !r.ages));
    assert.doesNotMatch(JSON.stringify(product(slug).beforeYouBook) + opt.note, /extra person|child rate|3 to 9|whatever their age/i);
  });

  test(`${slug} : 2, 3, 5 et 8 personnes, enfants comptés, au-delà de 8 sur demande`, () => {
    assert.equal(total(2, []), amounts[0]);
    assert.equal(total(3, []), amounts[1]);
    assert.equal(total(5, []), amounts[2]);
    assert.equal(total(8, []), amounts[3]);
    assert.equal(opt.groupFrom, 3);
    assert.equal(total(2, [1]), amounts[0], "moins de 3 ans : gratuit, hors du groupe (Jérémy, 27.11.2026)");
    assert.equal(total(2, [3]), amounts[1], "dès 3 ans, l'enfant compte comme une personne");
    assert.equal(total(8, [0, 2]), amounts[3], "deux bébés ne font pas passer au-delà de 8");
    assert.equal(total(4, [2, 10]), amounts[2]);
    assert.equal(total(2, [""]), amounts[1], "un enfant compte dès qu'il est ajouté, âge pas encore choisi");
    assert.equal(P.overTiers(opt, 8, [""]), 9);
    assert.match(opt.note + product(slug).beforeYouBook.children, /Under 3 free\. From 3 years, each child counts as one person\./);
    assert.equal(P.quote(opt, { adults: 9, ages: [] }), null);
    assert.equal(P.overTiers(opt, 7, [3, 5]), 9);
    assert.equal(P.overTiers(opt, 8, []), 0);
  });

  test(`${slug} : chaque tranche a sa prestation Gestion, plus d'anciennes clés`, () => {
    const mine = Object.keys(KEYS).filter((k) => k.startsWith(slug + "|"));
    assert.deepEqual(mine, opt.prices.map((r) => `${slug}|${opt.label}|${r.label}`));
    for (const k of mine) assert.match(KEYS[k].prestation, /^[0-9a-f-]{36}$/);
  });

  test(`${slug} : la page montre les quatre prix et plus l'ancien calcul`, () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "_site", "tours", slug, "index.html"), "utf8");
    for (const a of amounts) assert.ok(html.includes(a.toLocaleString("en-US")), String(a));
    assert.doesNotMatch(html, /Each extra person|Child 3 to 9|child rate/i);
  });
}

test("message de réservation : la tranche et le total, ou le prix sur demande au-delà de 8", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "_site", "tours", "fishing-trip", "index.html"), "utf8");
  const cfg = JSON.parse(html.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);
  const base = { option: cfg.options[0].id, today: "2026-11-27", dateChoice: "tomorrow", childAges: [], pickup: "Hotel", firstName: "A", lastName: "B", phoneCode: "TH", phone: "081 234 5678" };
  assert.match(B.buildMessage(cfg, { ...base, adults: 3 }), /Estimated total: 5,900 THB \(3 to 4 people, the raft\)/);
  assert.match(B.buildMessage(cfg, { ...base, adults: 8 }), /Estimated total: 9,900 THB \(7 to 8 people, the raft\)/);
  assert.match(B.buildMessage(cfg, { ...base, adults: 9 }), /Price: on request, group of 9 people/);
  const bebe = B.buildMessage(cfg, { ...base, adults: 2, children: 1, childAges: [1] });
  assert.match(bebe, /Guests: 2 adults, 1 child \(age 1\)/);
  assert.match(bebe, /Estimated total: 3,900 THB \(1 to 2 people, the raft\)/);
});
