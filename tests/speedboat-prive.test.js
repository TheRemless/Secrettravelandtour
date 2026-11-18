// Speedboat privé à journée libre (message d'Anaïs et décisions de Jérémy du 18.11.2026) : une option « Private speedboat »
// sur 4 Islands, Koh Phi Phi et Koh Rok & Koh Haa, prix sur WhatsApp, frais de parc de chaque page, aucun nom de partenaire
// ni de bateau, rien d'inventé (ni groupe minimum, ni jours, ni prix). Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");
const price = require("../src/js/v4-price.js");

const root = path.join(__dirname, "..");
const P = (slug) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products/tours", slug + ".json"), "utf8"));
const html = (slug) => fs.readFileSync(path.join(root, "_site/tours", slug, "index.html"), "utf8");
const text = (doc) => doc.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const ID = "private-speedboat";
const SUB = "Your own day: you choose the departure time, back by 16:00 at the latest";
const INTERDITS = /octopus ?sea|maryz|aquaman/i;

for (const slug of ["4-islands", "koh-phi-phi", "koh-rok-koh-haa"]) {
  const p = P(slug);
  const o = p.options.find((x) => x.id === ID);

  test(`${slug} : « Private speedboat » juste après le longtail privé, sur demande, frais de parc de la page`, () => {
    assert.ok(o, "option absente");
    assert.equal(o.label, "Private speedboat");
    assert.equal(o.kind, "private");
    assert.equal(o.boat, "speedboat");
    assert.equal(o.priceOnRequest, true);
    assert.equal(o.prices, undefined);
    const ids = p.options.map((x) => x.id);
    assert.equal(ids.indexOf(ID), ids.indexOf("private-longtail") + 1);
    assert.deepEqual(o.notIncludedFees, p.options.find((x) => x.id === "private-longtail").notIncludedFees);
    assert.ok(o.note.startsWith(SUB + "."));
    assert.match(o.note, /two 200 hp Yamaha engines and takes up to 20 passengers plus the crew/);
    assert.match(o.note, /we reply with the price for your day/);
    // Rien d'inventé : ni groupe minimum, ni jours, ni saison propre.
    assert.doesNotMatch(o.note + p.includedByOption[ID].join(" "), /minimum|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|daily|October|May\b/i);
    assert.equal(price.estimate(o, 2, [], []), null);
  });

  test(`${slug} : la page montre l'option, ses inclus et « Price on WhatsApp », sans nom de partenaire`, () => {
    const doc = html(slug);
    const block = doc.split(`data-po="${ID}"`)[1].split('class="po"')[0].split("</fieldset>")[0];
    assert.match(block, /Private speedboat/);
    assert.match(block, /Price on WhatsApp/);
    assert.ok(text(block).includes(SUB), "ligne courte");
    assert.doesNotMatch(block, /\d[\d,]* THB(?![^<]*per person)/, "aucun montant hors frais de parc");
    const t = text(doc);
    for (const s of ["A cup of ice cream", "Oxygen kit and first-aid kit", "a snorkelling guide if you want one", "Lunch from a menu"]) assert.ok(t.includes(s), s);
    assert.doesNotMatch(doc, INTERDITS);
    const ld = [...doc.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => m[1]).join(" ");
    assert.doesNotMatch(ld, /Private speedboat/, "pas d'offre JSON-LD pour une option sans prix");
  });

  test(`${slug} : la feuille réserve le speedboat privé, le message ne porte aucun prix`, () => {
    const cfg = JSON.parse(html(slug).match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
    assert.ok(cfg.options.some((x) => x.id === ID && x.title === "Private speedboat"));
    const st = Object.assign(B.emptyState(cfg), { today: "2026-11-18", option: ID, dateChoice: "other", dateOther: "2026-11-28", adults: 6, childAges: [], pickup: "Lanta Sand Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" });
    assert.deepEqual(B.validate(cfg, st), {});
    const msg = B.buildMessage(cfg, st);
    assert.ok(msg.startsWith(`Booking request: ${p.name} – Private speedboat\n`));
    assert.doesNotMatch(msg, /THB|Estimated total|^Price/m);
  });
}

test("Koh Rok : la saison reste celle de la page", () => {
  assert.equal(P("koh-rok-koh-haa").facts.find((f) => f.label === "Season").value, "Mid-October to mid-May");
});

test("4 Islands : journée libre, ni îles ni déjeuner du tour partagé sous le nom, la journée ne suit pas l'option", () => {
  const doc = html("4-islands");
  const head = doc.split(`data-po="${ID}"`)[1].split('class="po__detail"')[0];
  assert.doesNotMatch(head, /lunch on Koh|Koh Kradan/);
  const four = JSON.parse(doc.match(/<script type="application\/json" id="four-data">([\s\S]*?)<\/script>/)[1]);
  assert.equal(four.options.find((o) => o.id === ID).boat, "");
});

test("4 Islands : la ligne « On a private boat » reste mise en avant quand un bateau privé est choisi", () => {
  assert.match(html("4-islands"), /<li data-private(="")?>On a private boat: /);
});
