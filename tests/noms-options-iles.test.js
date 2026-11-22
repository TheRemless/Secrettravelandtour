// Noms des options de Koh Phi Phi et de Koh Rok & Koh Haa validés par Jérémy le 18.11.2026 : un libellé court et une ligne
// courte sous le nom (première phrase de la note). « Day trip » : pas d'heure de retour (décision du 08.11.2026). Les détails des anciennes notes restent sur la page. Ids et prix inchangés.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");
const KEYS = require("../src/_data/gestion-keys.json");

const root = path.join(__dirname, "..");
const P = (slug) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products/tours", slug + ".json"), "utf8"));
const html = (url) => fs.readFileSync(path.join(root, "_site", url, "index.html"), "utf8");
const text = (doc) => doc.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const cfgOf = (doc) => JSON.parse(doc.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);

const NOMS = {
  "koh-phi-phi": {
    "join-in-speedboat": ["Day trip", "Shared speedboat, back in the afternoon"],
    sunset: ["Sunset trip", "Pickup at 10:00, sunset cruise home"],
    "private-longtail": ["Private longtail", "The whole boat for your group"]
  },
  "koh-rok-koh-haa": {
    "join-in-speedboat": ["Day trip", "Shared speedboat, back in the afternoon"],
    sunset: ["Sunset trip", "Pickup at 10:00, sunset cruise home"],
    "private-longtail": ["Private longtail", "The whole boat for your group"]
  }
};
const PRIX = {
  "koh-phi-phi": { "join-in-speedboat": [2000, 1000, 0], sunset: [2900, 1900], "private-longtail": [] },
  "koh-rok-koh-haa": { "join-in-speedboat": [2000, 1000, 0], sunset: [2900, 1900], "private-longtail": [] }
};
const ANCIENS = /small[ -]group|join-in speedboat|later trip|later sunset|private longtail to koh rok/i;

for (const [slug, noms] of Object.entries(NOMS)) {
  const p = P(slug);

  test(`${slug} : libellés et ligne courte validés, ids et prix inchangés`, () => {
    // « Private speedboat » (18.11.2026) vient après : nom à part, testé dans tests/speedboat-prive.test.js.
    const own = p.options.filter((o) => o.id !== "private-speedboat");
    assert.deepEqual(own.map((o) => o.id), Object.keys(noms));
    for (const o of own) {
      const [label, sub] = noms[o.id];
      assert.equal(o.label, label, o.id);
      assert.equal(o.note.split(/(?<=\.)\s+/)[0], sub + ".", o.id);
      assert.deepEqual((o.prices || []).filter((r) => "amount" in r).map((r) => r.amount), PRIX[slug][o.id], o.id);
    }
  });

  test(`${slug} : la page montre chaque nom et sa ligne, plus aucun ancien nom`, () => {
    const doc = html(p.url);
    const t = text(doc);
    for (const [label, sub] of Object.values(noms)) {
      assert.ok(t.includes(label), label);
      assert.ok(t.includes(sub), sub);
    }
    // Contrôle sur toute la page, JSON-LD compris (l'option « small-group-sunset » est retirée le 22.11.2026).
    assert.doesNotMatch(doc, ANCIENS);
  });

  test(`${slug} : la feuille, le message WhatsApp et la copie Gestion portent les nouveaux noms`, () => {
    const cfg = cfgOf(html(p.url));
    for (const [id, [label]] of Object.entries(noms)) {
      assert.equal(cfg.options.find((o) => o.id === id).title, label, id);
      const st = Object.assign(B.emptyState(cfg), { today: "2026-11-18", option: id, dateChoice: "other", dateOther: "2026-11-28", adults: 2, childAges: [], pickup: "Lanta Sand Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" });
      const msg = B.buildMessage(cfg, st);
      assert.ok(msg.startsWith(`Booking request: ${p.name} – ${label}\n`), id);
      assert.equal(B.demandeBody(cfg, st, msg, "", "https://secrettravelandtour.com" + p.url).option_label, label, id);
    }
  });

  test(`${slug} : chaque ligne de prix garde sa clé Gestion sous le nouveau nom`, () => {
    for (const o of p.options) {
      for (const r of (o.prices || []).filter((x) => x.amount > 0)) assert.ok(KEYS[`${slug}|${o.label}|${r.label}`], `${o.label} / ${r.label}`);
    }
    assert.ok(!Object.keys(KEYS).some((k) => k.startsWith(slug + "|") && ANCIENS.test(k)), "clé à l'ancien nom");
  });
}

test("rien n'est perdu des anciennes notes : groupe, enfants, ponton, Koh Rok seul, Maya Bay", () => {
  const phi = P("koh-phi-phi"), rok = P("koh-rok-koh-haa");
  const note = (p, id) => p.options.find((o) => o.id === id).note;
  for (const s of ["Children from 4 count in the group size, under 4 do not.", "we reply with the price for your day", "Available when the national park is open."]) assert.ok(note(phi, "private-longtail").includes(s), s);
  assert.match(note(phi, "sunset"), /Maya Bay is not on this programme\./);
  for (const s of ["From Lanta Old Town pier.", "Koh Rok by longtail only runs as a private trip.", "Koh Rok only, 08:00 to 16:00, about 1 hr 30 min each way.", "Children from 4 count in the group size, under 4 do not.", "we reply with the price for your day"]) assert.ok(note(rok, "private-longtail").includes(s), s);
  for (const p of [phi, rok]) assert.match(note(p, "sunset"), /By car from your hotel.*17:50/);
  // Le détail de l'option choisie s'affiche dans le sélecteur.
  assert.ok(text(html("/tours/koh-rok-koh-haa/")).includes("Koh Rok only, 08:00 to 16:00"));
  assert.ok(text(html("/tours/koh-phi-phi/")).includes("Maya Bay is not on this programme."));
  assert.match(phi.lead, /the sunset trip/);
});
