// Sorties qui rentrent au coucher du soleil, flyer du partenaire transmis par Jérémy le 22.11.2026 (départ de Koh Lanta) :
// « Phi Phi Bamboo Island + Sunset » et « Rok Haa Island + Sunset », 2 900 adulte et 1 900 enfant de 4 à 11 ans. Elles
// remplacent les sorties Lazy Day du 17.11.2026 (option « Full-day sunset trip », autre ponton) et, sur Koh Rok, l'ancienne
// affiche à 2 500 / 1 800. Rien d'inventé (ni prix sous 4 ans, ni jours), frais de parc repris de la fiche, clés Gestion
// vers les nouveaux tarifs. Lancer `npm run build` avant.
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
const state = (over = {}) => Object.assign(B.emptyState({}), { today: "2026-11-22", option: "sunset", dateChoice: "other", dateOther: "2026-11-28", adults: 2, childAges: [7], pickup: "Lanta Sand Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" }, over);

const ID = "sunset";
const LABEL = "Sunset trip";
// Nom du partenaire, noms commerciaux des sorties et des flyers, nom du bateau, téléphones et adresse des brochures.
const INTERDITS = /rattana|lazy ?day|amazing island|aquaman|king of the ocean|063.?672.?4262|084.?129.?5333|065.?872.?6256|288\/8 Moo 1/i;

const PAGES = {
  "koh-phi-phi": {
    keys: { Adult: "133fe67c-74c4-4b4b-a8a9-a1e7aa927d1e", "Child, 4 to 11": "ef164c6d-7244-4f59-8c3e-59d8563e18d0" },
    times: ["10:00", "11:00", "13:50", "15:00", "17:00", "17:50"],
    feesFrom: "join-in-speedboat",
    included: ["Hotel pickup and return by car", "Snacks on the boat", "Thai buffet lunch on Bamboo Island", "Soft drinks and dinner on the way back"]
  },
  "koh-rok-koh-haa": {
    keys: { Adult: "494841cb-8693-46c4-8dcc-1a7ba51a4b1e", "Child, 4 to 11": "5a90e9ef-a6c4-4dd3-9ca4-59a68df5716a" },
    times: ["10:00", "10:40", "12:00", "13:30", "15:30", "16:30", "17:50"],
    feesFrom: "join-in-speedboat",
    included: ["Hotel pickup and return by car", "Snacks on the boat", "Thai buffet lunch on the beach of Koh Rok", "Soft drinks on board on the way back"]
  }
};

for (const [slug, want] of Object.entries(PAGES)) {
  const p = P(slug);
  const o = p.options.find((x) => x.id === ID);

  test(`${slug} : 2 900 THB adulte, 1 900 THB enfant de 4 à 11 ans, aucun prix sous 4 ans, frais de parc de la fiche`, () => {
    assert.ok(o, "option absente");
    assert.equal(o.label, LABEL);
    assert.equal(o.kind, "join-in");
    assert.deepEqual(o.prices, [
      { label: "Adult", amount: 2900, unit: "per person" },
      { label: "Child, 4 to 11", amount: 1900, ages: { min: 4, max: 11 }, unit: "per person" }
    ]);
    assert.deepEqual(o.notIncludedFees, p.options.find((x) => x.id === want.feesFrom).notIncludedFees);
    assert.match(o.note, /^Pickup at 10:00, sunset cruise home\. By car from your hotel,.* back to Koh Lanta at 17:50/);
    assert.equal(p.price.from, 2000);
  });

  test(`${slug} : plus de sortie Lazy Day (option, programme, compris, clés)`, () => {
    assert.ok(!p.options.some((x) => x.id === "small-group-sunset"));
    assert.ok(!p.day.some((b) => (b.options || []).includes("small-group-sunset")));
    assert.ok(!("small-group-sunset" in p.includedByOption));
    assert.ok(!Object.keys(KEYS).some((k) => k.startsWith(slug + "|Full-day sunset trip|")));
    const doc = html(p.url);
    assert.doesNotMatch(text(doc), /Full-day sunset|Hua Hin|08:30|wine/i);
  });

  test(`${slug} : programme du flyer, horaires approximatifs selon la marée et la météo, compris limité au flyer`, () => {
    const day = p.day.find((b) => (b.options || []).join() === ID);
    assert.deepEqual(day.steps.map((s) => s.time), want.times);
    assert.match(day.steps[0].text, /^Pickup at your hotel by car\.$/);
    assert.match(day.steps[day.steps.length - 1].text, /sunset.*soft drinks.*your hotel/);
    assert.equal(day.note, "Times are approximate and change with the tide and the weather.");
    assert.deepEqual(p.includedByOption[ID], want.included);
  });

  test(`${slug} : la page montre l'option, son programme et ses prix, sans nom de prestataire`, () => {
    const doc = html(p.url), t = text(doc);
    const help = p.faq.find((f) => f.q === "Which trip should I pick?");
    for (const s of [LABEL, "2,900 THB", "1,900 THB", "17:50", help.a]) assert.ok(t.includes(s), s);
    assert.doesNotMatch(doc, INTERDITS);
    assert.doesNotMatch(JSON.stringify(p), INTERDITS);
  });

  test(`${slug} : la feuille connaît l'option, le message et la copie Gestion portent son nom et le total`, () => {
    const cfg = cfgOf(html(p.url));
    assert.ok(cfg.options.some((x) => x.id === ID && x.title === LABEL), "option absente de la feuille");
    const msg = B.buildMessage(cfg, state());
    assert.match(msg, new RegExp(`^Booking request: ${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} – ${LABEL}\\n`));
    // 2 adultes à 2 900 et un enfant de 7 ans à 1 900.
    assert.match(msg, /\nEstimated total: 7,700 THB$/);
    const body = B.demandeBody(cfg, state(), msg, "", "https://secrettravelandtour.com" + p.url);
    assert.equal(body.option, ID);
    assert.equal(body.option_label, LABEL);
    assert.equal(body.estimated_total, 7700);
  });

  test(`${slug} : un enfant de moins de 4 ans n'a pas de prix inventé`, () => {
    const q = price.estimate(o, 2, [2], []);
    assert.deepEqual(q.unpriced, [2]);
    assert.equal(q.total, 5800);
  });

  test(`${slug} : clés Gestion vers les nouveaux tarifs pour le contrôle mensuel`, () => {
    for (const [row, id] of Object.entries(want.keys)) {
      const k = KEYS[`${slug}|${LABEL}|${row}`];
      assert.ok(k, row);
      assert.equal(k.prestation, id, row);
    }
  });
}

test("Koh Phi Phi : Maya Bay dite absente du programme, sans affirmer plus que le flyer", () => {
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
