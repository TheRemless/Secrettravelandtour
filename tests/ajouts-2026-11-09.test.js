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

// ---------- Catamaran au départ d'Ao Nang (brochure publique, deux pages) ----------
for (const rel of ["tours/koh-rok-koh-haa", "tours/4-islands"]) {
  test(`catamaran d'Ao Nang sur ${rel} : prix, programme, enfants et message`, () => {
    const p = P(rel);
    const o = p.options.find((x) => x.id === "catamaran-ao-nang");
    assert.ok(o, "option catamaran-ao-nang");
    assert.equal(o.from, "Ao Nang");
    assert.deepEqual(o.prices.map((r) => [r.label, r.amount, r.ages || null]), [["Adult", 3800, null], ["Child, 4 to 11", 2800, { min: 4, max: 11 }]]);
    assert.ok(!o.notIncludedFees, "la brochure ne dit rien des frais de parc : aucun montant inventé");
    const day = p.day.find((b) => (b.options || []).includes(o.id));
    // Koh Rok : 13:00 sur la plage ; 4 Islands : déjeuner de 12:00 à 14:00 à Koh Kradan, pas d'étape à 13:00.
    const times = ["06:00", "07:30", "08:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "17:00"].filter((x) => x !== "13:00" || rel.endsWith("koh-rok-koh-haa"));
    assert.deepEqual(day.steps.map((s) => s.time), times);
    const doc = html(p.url), t = text(doc);
    for (const s of ["Catamaran from Ao Nang", "3,800 THB", "2,800 THB", "Not recommended for children under 4", "free GoPro photos", "a guide speaking English and Chinese"]) assert.ok(t.includes(s), `${rel} : « ${s} »`);
    assert.doesNotMatch(doc, /aquaman/i, "nom commercial du prestataire");
    const cfg = cfgOf(doc);
    const msg = B.buildMessage(cfg, state(o.id));
    assert.match(msg, new RegExp(`\\nBooking request: ${p.name} – Catamaran from Ao Nang\\nDeparture: from Ao Nang, pickup at your hotel in Ao Nang\\n`));
    assert.match(msg, /\nPrice on website: Adult: 3,800 THB per person \/ Child, 4 to 11: 2,800 THB per person\n/);
    // Les autres options ne disent pas de départ.
    const other = B.buildMessage(cfg, state(p.options[0].id));
    assert.doesNotMatch(other, /Departure:/);
  });
}

test("4 Islands : le catamaran a son parcours, sa journée, sa colonne et sa route sur la carte", () => {
  const doc = html("/tours/4-islands/");
  assert.match(doc, /<button type="button" value="catamaran-ao-nang"/);
  assert.match(doc, /data-tl="catamaran"/);
  assert.match(doc, /data-map-route="catamaran"/);
  assert.match(doc, /data-opt="catamaran-ao-nang"/);
  assert.match(doc, /<dt>Lunch<\/dt><dd>Buffet lunch on Koh Kradan<\/dd>/);
  const data = JSON.parse(doc.match(/<script type="application\/json" id="four-data">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(data.islands.catamaran.map((i) => i.name), ["Koh Chueak", "Koh Mook", "Koh Kradan", "Koh Ngai"]);
  assert.equal(data.lunch.catamaran, "Koh Kradan");
});
