// Fiches « plus court et plus vivant » (15.11.2026) : après les options, la journée avec ses photos puis les infos
// pratiques en onglets. Rien n'est retiré : chaque question, chaque photo de la galerie et chaque plat des menus reste
// sur la page ; les menus du cours de cuisine passent sous leur journée mais restent dans le FAQPage.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products", rel + ".json"), "utf8"));
const html = (url) => fs.readFileSync(path.join(root, "_site", url, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const nb = (s) => String(s).replace(/\b(Koh|Ko|Ao) (\S+)/g, "$1 $2");
// La question d'aide au choix va sous les options (helpOf) : même règle que la page.
const { helpOf } = require("../src/_includes/components/v4-product.js");

const FICHES = ["tours/4-islands", "tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/mangroves", "tours/fishing-trip", "tours/sunset-dinner-raft",
  "tours/sunrise-raft", "activities/mangrove-kayaking", "activities/elephant-sanctuary", "activities/kayak", "activities/cooking-class",
  "activities/scuba-diving", "activities/atv", "activities/batik", "activities/go-kart", "rental", "secret-transfers/speedboat-ferry"].map(P);

test("chaque question de la fiche est sur la page, dans les questions ou sous la journée de son cours", () => {
  // La location n'a jamais montré ses questions (rentalPage, faq vide) : elle reste ainsi.
  for (const p of FICHES.filter((x) => x.template !== "rental")) {
    const doc = html(p.url);
    const shown = (doc.split('id="faq-h"')[1] || "").split("</section>")[0];
    for (const f of p.faq || []) {
      if ((helpOf(p) || {}).q === f.q || /hotel pickup included|how do i book/i.test(f.q)) continue;
      const q = esc(nb(f.q));
      if (/^What is on the menu at the \w+ class\?$/.test(f.q)) {
        const menu = doc.split(`<h3 class="menu__q">${q}</h3>`)[1];
        assert.ok(menu, `${p.slug} : menu « ${f.q} » sous sa journée`);
        assert.ok(!shown.includes(q), `${p.slug} : « ${f.q} » pas répété dans les questions`);
        for (const dish of f.a.replace(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday): /g, "").replace(/\.$/, "").split(/, |\. /)) {
          assert.ok(menu.split("</div></div>")[0].includes(`<li>${esc(dish)}</li>`), `${p.slug} : plat « ${dish} »`);
        }
      } else {
        assert.ok(shown.includes(`<summary>${q}</summary>`), `${p.slug} : question « ${f.q} »`);
      }
    }
  }
});

test("les menus restent dans le FAQPage de la fiche", () => {
  const doc = html("/tours/cooking-class/");
  const faq = [...doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
    .flatMap((b) => b["@graph"] || [b]).find((b) => b["@type"] === "FAQPage");
  const names = faq.mainEntity.map((q) => q.name);
  assert.ok(names.includes("What is on the menu at the lunch class?"));
  assert.ok(names.includes("What is on the menu at the dinner class?"));
});

test("toutes les photos de la galerie sont sur la page, numérotées une fois pour la visionneuse", () => {
  for (const p of FICHES) {
    const doc = html(p.url);
    const idx = [...doc.matchAll(/data-gal-i="(\d+)"/g)].map((m) => Number(m[1]));
    assert.deepEqual(idx, idx.map((x, i) => i), `${p.slug} : vignettes 0 à ${idx.length - 1}`);
    if (idx.length) {
      assert.match(doc, /class="pc" data-gal(="")? data-gal-lb/, `${p.slug} : une seule visionneuse`);
      for (const n of idx) assert.match(doc, new RegExp(`aria-label="Open photo ${n + 1} of ${idx.length}: `), `${p.slug} : photo ${n + 1}`);
    }
  }
});

test("infos pratiques : onglets seulement quand il y a plusieurs blocs, « What the price covers » en premier", () => {
  for (const p of FICHES) {
    const doc = html(p.url);
    const know = doc.split('<section class="sec know')[1];
    assert.ok(know, `${p.slug} : infos pratiques`);
    const tabs = [...know.split("</section>")[0].matchAll(/role="tab" id="tab-(\w+)"/g)].map((m) => m[1]);
    const panels = [...know.split("</section>")[0].matchAll(/<div class="panel" id="p-(\w+)">/g)].map((m) => m[1]);
    assert.deepEqual(tabs, panels.length > 1 ? panels : [], p.slug);
    if (panels.includes("inc")) assert.equal(panels[0], "inc", p.slug);
  }
});
