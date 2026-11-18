// Sorties en petit groupe qui rentrent au coucher du soleil (brochure du partenaire transmise par Jérémy le 17.11.2026) :
// une option de plus sur Koh Phi Phi et sur Koh Rok & Koh Haa, distincte du join-in, de la sortie « Later trip, back at
// sunset » et du longtail privé. Prix de la brochure, rien d'inventé (ni prix sous 4 ans, ni taille de groupe, ni jours),
// frais de parc repris de la fiche, clés Gestion vers les tarifs créés en production. Lancer `npm run build` avant.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");
const price = require("../src/js/v4-price.js");
const KEYS = require("../src/_data/gestion-keys.json");

const root = path.join(__dirname, "..");
const P = (slug) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products/tours", slug + ".json"), "utf8"));
const html = (url) => fs.readFileSync(path.join(root, "_site", url, "index.html"), "utf8");
const cfgOf = (doc) => JSON.parse(doc.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);
const text = (doc) => doc.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const state = (over = {}) => Object.assign(B.emptyState({}), { today: "2026-11-17", option: "small-group-sunset", dateChoice: "other", dateOther: "2026-11-28", adults: 2, childAges: [7], pickup: "Lanta Sand Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" }, over);

const ID = "small-group-sunset";
const LABEL = "Full-day sunset trip"; // « Small group, back at sunset » jusqu'au 18.11.2026 (libellés validés par Jérémy)
// Nom du partenaire, nom commercial de la sortie, nom du bateau, téléphones et site de la brochure.
const INTERDITS = /rattana|lazy ?day|aquaman|king of the ocean|063.?672.?4262|084.?129.?5333|065.?872.?6256|288\/8 Moo 1/i;

const PAGES = {
  "koh-phi-phi": {
    keys: { Adult: "c0a0922b-e30c-44bc-b029-a131f65e36ba", "Child, 4 to 11": "5f4e4bfa-7bd3-4fef-9b82-c76d419ec1d6" },
    times: ["08:30", "10:00", "11:00", "13:50", "15:00", "17:00", "17:50", "18:30"],
    feesFrom: "join-in-speedboat",
    untouched: { "join-in-speedboat": [2000, 1000, 0], "private-longtail": [9400] }
  },
  "koh-rok-koh-haa": {
    keys: { Adult: "2558da12-6885-45f5-8d1a-3737389b1183", "Child, 4 to 11": "44294cf2-7e04-4b1b-8c3c-273c9f917187" },
    times: ["08:30", "10:00", "12:00", "13:30", "15:30", "16:30", "17:50", "18:30"],
    feesFrom: "sunset",
    untouched: { "join-in-speedboat": [2000, 1000, 0], sunset: [2500, 1800], "private-longtail": [7400, 7900] }
  }
};

for (const [slug, want] of Object.entries(PAGES)) {
  const p = P(slug);
  const o = p.options.find((x) => x.id === ID);

  test(`${slug} : 3 900 THB adulte, 2 900 THB enfant de 4 à 11 ans, aucun prix sous 4 ans, frais de parc de la fiche`, () => {
    assert.ok(o, "option absente");
    assert.equal(o.label, LABEL);
    assert.equal(o.kind, "join-in");
    assert.deepEqual(o.prices, [
      { label: "Adult", amount: 3900, unit: "per person" },
      { label: "Child, 4 to 11", amount: 2900, ages: { min: 4, max: 11 }, unit: "per person" }
    ]);
    assert.deepEqual(o.notIncludedFees, p.options.find((x) => x.id === want.feesFrom).notIncludedFees);
    assert.match(o.note, /^Pickup at 08:30, lunch with wine, home after sunset\. .*back at your hotel between 18:30 and 20:00\./);
    assert.doesNotMatch(JSON.stringify(o) + JSON.stringify(p.includedByOption[ID]), /\b\d+ (to \d+ )?(guests|people)\b|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|daily|every day/i);
  });

  test(`${slug} : les autres options ne bougent pas`, () => {
    for (const [id, amounts] of Object.entries(want.untouched)) {
      assert.deepEqual(p.options.find((x) => x.id === id).prices.filter((r) => "amount" in r).map((r) => r.amount), amounts, id);
    }
    assert.equal(p.price.from, 2000);
  });

  test(`${slug} : programme minuté de 08:30 à 18:30, horaires approximatifs selon la marée et la météo`, () => {
    const day = p.day.find((b) => (b.options || []).join() === ID);
    assert.deepEqual(day.steps.map((s) => s.time), want.times);
    assert.match(day.steps[0].text, /Hua Hin Pier/);
    assert.match(day.steps[day.steps.length - 1].text, /between 18:30 and 20:00/);
    assert.equal(day.note, "Times are approximate and change with the tide and the weather.");
    assert.deepEqual(p.includedByOption[ID], ["Hotel transfer both ways, by van", "Lunch, soft drinks, wine and fruit", "Snorkelling equipment", "An experienced local guide who speaks English or Chinese", "Insurance"]);
  });

  test(`${slug} : la page montre l'option, son programme et ses prix, sans nom de prestataire`, () => {
    const doc = html(p.url), t = text(doc);
    // La réponse à « Which trip should I pick? » va près du sélecteur d'options (helpOf de v4-product.js).
    const help = p.faq.find((f) => f.q === "Which trip should I pick?");
    for (const s of [LABEL, "3,900 THB", "2,900 THB", "Hua Hin Pier", "between 18:30 and 20:00", help.a]) assert.ok(t.includes(s), s);
    assert.doesNotMatch(doc, INTERDITS);
    assert.doesNotMatch(JSON.stringify(p), INTERDITS);
  });

  test(`${slug} : la feuille connaît l'option, le message et la copie Gestion portent son nom et le total`, () => {
    const cfg = cfgOf(html(p.url));
    assert.ok(cfg.options.some((x) => x.id === ID && x.title === LABEL), "option absente de la feuille");
    const msg = B.buildMessage(cfg, state());
    assert.match(msg, new RegExp(`^Booking request: ${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} – ${LABEL}\\n`));
    // 2 adultes à 3 900 et un enfant de 7 ans à 2 900.
    assert.match(msg, /\nEstimated total: 10,700 THB$/);
    const body = B.demandeBody(cfg, state(), msg, "", "https://secrettravelandtour.com" + p.url);
    assert.equal(body.option, ID);
    assert.equal(body.option_label, LABEL);
    assert.equal(body.estimated_total, 10700);
  });

  test(`${slug} : un enfant de moins de 4 ans n'a pas de prix inventé`, () => {
    // L'enfant de 2 ans reste « sans prix » (réponse sur WhatsApp) : le total ne compte que les adultes.
    const q = price.estimate(o, 2, [2], []);
    assert.deepEqual(q.unpriced, [2]);
    assert.equal(q.total, 7800);
  });

  test(`${slug} : clés Gestion vers les tarifs « Lazy Day sunset trips (small group) » pour le contrôle mensuel`, () => {
    for (const [row, id] of Object.entries(want.keys)) {
      const k = KEYS[`${slug}|${LABEL}|${row}`];
      assert.ok(k, row);
      assert.equal(k.prestation, id, row);
    }
  });
}

test("Koh Phi Phi : Maya Bay dite absente du programme, sans affirmer plus que la brochure", () => {
  const p = P("koh-phi-phi");
  const o = p.options.find((x) => x.id === ID);
  const help = p.faq.find((f) => f.q === "Which trip should I pick?");
  for (const t of [o.note, help.a]) {
    assert.match(t, /Maya Bay is not on this programme\./);
    assert.doesNotMatch(t, /does not (stop at|go to) Maya Bay/);
  }
});

test("Koh Rok : la saison reste celle de la fiche (mi-octobre à mi-mai)", () => {
  const p = P("koh-rok-koh-haa");
  assert.equal(p.facts.find((f) => f.label === "Season").value, "Mid-October to mid-May");
});
