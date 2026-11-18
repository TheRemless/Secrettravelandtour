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
const ANCIENS = /\b(5,?900|6,?400|7,?400|7,?900|9,?400)\b|\+500 THB/;

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return /^(_v4|design|images|fonts)$/.test(e.name) ? [] : files(full);
    return /\.(html|txt|json|xml)$/.test(e.name) ? [full] : [];
  });
}

test("aucun ancien prix de longtail privé ni « +500 THB » dans les pages, les données publiques et llms.txt", () => {
  const all = files(SITE);
  assert.ok(all.length > 50);
  for (const f of all) {
    const s = fs.readFileSync(f, "utf8").replace(/cc698212e79400cca1a404ad4bf10b5f/g, "");
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

test("méta-description de la 4 Islands : longtail privé « on request »", () => {
  assert.match(read(PAGES["4-islands"]), /<meta name="description" content="[^"]*private longtail on request[^"]*"/);
});
