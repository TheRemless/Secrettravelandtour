// Bateaux privés sur demande en haute saison (décision de Jérémy du 18.11.2026) : plus aucun montant pour les longtails
// privés de 4 Islands, Koh Phi Phi et Koh Rok, ni pour un speedboat privé, nulle part dans _site. L'option reste visible et
// réservable (« Price on WhatsApp »). Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const SITE = path.join(root, "_site");
const P = (slug) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products/tours", slug + ".json"), "utf8"));
const read = (rel) => fs.readFileSync(path.join(SITE, rel), "utf8");
const PAGES = { "4-islands": "tours/4-islands/index.html", "koh-phi-phi": "tours/koh-phi-phi/index.html", "koh-rok-koh-haa": "tours/koh-rok-koh-haa/index.html" };
// Anciens prix des longtails privés (et supplément Koh Kradan) sous toutes leurs formes.
const RADEAUX = ["sunrise-raft", "fishing-trip", "sunset-dinner-raft"];
const ANCIENS = /\b(5,?900|6,?400|7,?400|7,?900|9,?400)\b|\+500 THB/;

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return /^(_v4|design|images|fonts)$/.test(e.name) ? [] : files(full);
    return /\.(html|txt|json|xml)$/.test(e.name) ? [full] : [];
  });
}

// Les pages et données qui montraient ces prix : les trois fiches, les listes de sorties, les guides, les données publiques et llms.
// « index.html » prend toutes les pages : les fiches des radeaux, dont les tranches valent 5,900 et 7,900 THB, en sont retirées.
const CIBLES = () => files(SITE).filter((f) => !RADEAUX.some((r) => f.replace(SITE, "") === `/tours/${r}/index.html`)).filter((f) => /\/(tours\/(4-islands|koh-phi-phi|koh-rok-koh-haa)\/index\.html|tours\/index\.html|index\.html|guides\/[^/]+\/index\.html|cancellation\/index\.html|data\/catalog\.json|llms(-full)?\.txt)$/.test(f.replace(SITE, "")));

test("aucun ancien prix de longtail privé ni « +500 THB » dans les pages, les données publiques et llms.txt", () => {
  const all = CIBLES();
  assert.ok(all.length >= 8, String(all.length));
  for (const f of all) {
    let s = fs.readFileSync(f, "utf8").replace(/cc698212e79400cca1a404ad4bf10b5f/g, "");
    // Radeaux privés (grille du 27.11.2026) : leurs tranches dans les données publiques et llms.txt sont hors de ce contrôle.
    if (f.endsWith("catalog.json")) { const c = JSON.parse(s); for (const k of RADEAUX) delete c[k]; s = JSON.stringify(c); }
    s = s.replace(/\b\d+ to \d+ people: [\d,]+ THB per raft/g, "");
    assert.doesNotMatch(s, ANCIENS, path.relative(SITE, f));
  }
});

test("aucun montant à côté d'un bateau privé dans le texte lu par les visiteurs et les assistants : speedboat ou longtail", () => {
  for (const f of files(SITE).filter((x) => /\.(html|txt)$/.test(x))) {
    const s = fs.readFileSync(f, "utf8").replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    // « Private longtail: 9,400 THB », « private speedboat from 24,000 THB », « 7,400 THB for a private longtail ».
    // La carte dit « Shared speedboat or private longtail » puis le prix d'appel des sorties partagées : pas un prix du privé.
    assert.doesNotMatch(s, /(?<!or )private (longtail|speed ?boat)s?\s*(:|,|from|for|costs?|is|at)\s*[^.]{0,30}?\d[\d,]* ?THB/i, path.relative(SITE, f));
    assert.doesNotMatch(s, /\d[\d,]* ?THB( per boat)?[^.]{0,20}\b(for|on|by) (a|the|your) private (longtail|speed ?boat)/i, path.relative(SITE, f));
  }
});

for (const [slug, rel] of Object.entries(PAGES)) {
  test(`${slug} : l'option privée reste réservable, « Price on WhatsApp », sans offre JSON-LD ni ligne de prix`, () => {
    const o = P(slug).options.find((x) => x.id === "private-longtail");
    assert.equal(o.priceOnRequest, true);
    assert.equal(o.prices, undefined);
    const doc = read(rel);
    const block = doc.split('data-po="private-longtail"')[1].split('class="po"')[0].split("</fieldset>")[0];
    assert.match(block, /Price on WhatsApp/);
    assert.doesNotMatch(block, /\d[\d,]* THB/);
    const cfg = JSON.parse(doc.match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
    const c = cfg.options.find((x) => x.id === "private-longtail");
    assert.ok(c, "option absente de la feuille");
    assert.ok(!(c.rows || []).some((r) => /\d/.test(r.price || "")), "ligne de prix dans la feuille");
    const ld = [...doc.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => m[1]).join(" ");
    assert.doesNotMatch(ld, /Private longtail/);
    // Le prix d'appel reste celui des sorties partagées.
    assert.ok(P(slug).price.from <= 2000);
  });
}

test("méta-description de la 4 Islands : bateaux privés « on request » (longtail et speedboat, 18.11.2026)", () => {
  assert.match(read(PAGES["4-islands"]), /<meta name="description" content="[^"]*private boats on request[^"]*"/);
});

test("4 Islands : Koh Kradan se demande dans la feuille, sans montant", () => {
  const B = require("../src/js/booking.js");
  const cfg = JSON.parse(read(PAGES["4-islands"]).match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
  const o = cfg.options.find((x) => x.id === "private-longtail");
  const c = (o.choices || []).find((x) => x.id === "kradan");
  assert.ok(c, "choix Koh Kradan absent");
  assert.ok(!c.values.some((v) => /\d/.test(v.price || "")));
  const st = Object.assign(B.emptyState(cfg), { dateChoice: "other", dateOther: "2026-11-28", today: "2026-11-18", adults: 2, option: "private-longtail", pickup: "Lanta Sand Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" });
  assert.deepEqual(B.validate(cfg, st), {}, "le choix reste facultatif");
  st.choices = { "private-longtail/kradan": "add" };
  const msg = B.buildMessage(cfg, st);
  assert.match(msg, /\nKoh Kradan: Add Koh Kradan to the day\n/);
  assert.doesNotMatch(msg, /THB/);
});

// Jérémy, 18.11.2026 : la raison interne (hausse des prix en haute saison) ne s'affiche jamais au client.
test("bateaux privés : aucune mention de hausse de prix ni de haute saison dans les notes des options privées", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  for (const slug of ["4-islands", "koh-phi-phi", "koh-rok-koh-haa"]) {
    const p = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "_data", "products", "tours", `${slug}.json`), "utf8"));
    for (const o of p.options.filter((x) => x.kind === "private" || /private/i.test(x.id))) {
      assert.doesNotMatch(o.note || "", /high season|go up/i, `${slug} ${o.id}`);
    }
    for (const f of p.faq || []) assert.doesNotMatch(f.a || "", /prices? for private boats go up/i, slug);
  }
});
