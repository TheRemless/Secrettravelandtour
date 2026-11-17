// Page About et guides (aperçu du 16.11.2026, PR en brouillon). Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const G = require("../src/_data/guides.js");
const site = require("../src/_data/site.json");

const SITE = path.join(__dirname, "..", "_site");
const read = (u) => fs.readFileSync(path.join(SITE, u, "index.html"), "utf8");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "_data", "products", rel + ".json"), "utf8"));
const jsonLd = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const URLS = ["/about/", "/guides/"].concat(G.list.map((g) => g.url));

test("pages générées, dans le sitemap, avec leur titre et une description", () => {
  const map = fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8");
  for (const u of URLS) {
    const h = read(u);
    const title = h.match(/<title>([^<]+)<\/title>/)[1].replace(/&amp;/g, "&");
    assert.ok(title.length >= 20 && title.length <= 60, u + " : titre de " + title.length + " caractères");
    assert.match(h, /<meta name="description" content="[^"]{80,170}">/, u);
    assert.equal((h.match(/<h1\b/g) || []).length, 1, u);
    assert.ok(map.includes(`<loc>https://secrettravelandtour.com${u}</loc>`), "sitemap : " + u);
  }
  assert.equal(G.list.length, 4);
});

test("About : licence TAT, délai de réponse et langues lus dans site.json ; ni adresse, ni photo d'équipe, ni nom de partenaire", () => {
  const h = read("/about/"), t = text(h);
  assert.ok(t.includes(`licence ${site.brands.secret.licence}`));
  assert.ok(t.includes(`We reply ${site.replyTime.usual}.`));
  assert.ok(t.includes("Thai, English, German, Italian and French"));
  assert.ok(t.includes("Every trip we book is run by a partner we see every day on Koh Lanta."));
  assert.match(t, /no riding and no show/);
  const main = text(h.match(/<main[\s\S]*<\/main>/)[0]);
  assert.doesNotMatch(main, /292|Moo 2|Sala Dan/, "aucune adresse ni comptoir hors des pages légales");
  assert.doesNotMatch(h, /team-photo|data-slot="office"/);
  // Version de production (Jérémy, 17.11.2026) : aucune phrase sur qui reçoit le paiement ni comment.
  assert.doesNotMatch(t, /cash or by bank transfer|pay the partner|paid to the partner/i);
  assert.match(t, /There is no online payment on this site\./);
  // JSON-LD : AboutPage dont l'entité principale est l'agence de l'accueil.
  const ld = jsonLd(h);
  const page = ld.find((x) => x["@type"] === "AboutPage");
  assert.equal(page.mainEntity["@id"], "https://secrettravelandtour.com/#agency");
  const ag = ld.find((x) => x["@type"] === "TravelAgency");
  assert.equal(ag.hasCredential.name, site.brands.secret.licence);
  assert.equal(ag.address, undefined);
  assert.ok(ld.some((x) => x["@type"] === "BreadcrumbList"));
});

test("aucun fait en attente : ni [À CONFIRMER] ni [À VÉRIFIER] sur About, le hub et les guides", () => {
  for (const u of URLS) assert.doesNotMatch(read(u), /\[À CONFIRMER|\[À VÉRIFIER/, u);
});

test("guides : réponse d'abord, date de mise à jour, temps de lecture, Article et BreadcrumbList, FAQPage seulement avec des questions", () => {
  for (const g of G.list) {
    const h = read(g.url);
    assert.match(h, /<div class="art__answer">/, g.url);
    assert.match(h, new RegExp(`Updated <time datetime="${g.updated}">`), g.url);
    assert.match(h, /\d+ min read/, g.url);
    const ld = jsonLd(h);
    const art = ld.find((x) => x["@type"] === "Article");
    assert.equal(art.headline, g.title);
    assert.equal(art.dateModified, g.updated);
    const crumbs = ld.find((x) => x["@type"] === "BreadcrumbList");
    assert.deepEqual(crumbs.itemListElement.map((i) => i.name), ["Home", "Guides", g.short]);
    assert.equal(ld.some((x) => x["@type"] === "FAQPage"), Boolean(g.faq && g.faq.length), g.url);
  }
  const hub = jsonLd(read("/guides/")).find((x) => x["@type"] === "CollectionPage");
  assert.equal(hub.mainEntity.itemListElement.length, 4);
});

test("guides : chaque prix est celui de la fiche (données des produits, jamais recopié)", () => {
  const four = P("tours/4-islands"), rok = P("tours/koh-rok-koh-haa"), phi = P("tours/koh-phi-phi");
  const islands = text(read("/guides/4-islands-koh-rok-or-koh-phi-phi/"));
  assert.ok(islands.includes(`from ${four.price.from.toLocaleString("en-US")} THB by longtail`));
  for (const p of [rok, phi]) assert.ok(islands.includes(`${p.price.from.toLocaleString("en-US")} THB by speedboat`), p.slug);
  const child = four.options.find((o) => o.id === "join-in-longtail").prices.find((r) => /^Child, 4 to 11/.test(r.label));
  assert.ok(islands.includes(`${child.amount} THB by longtail`));
  // Prix d'appel du transfert : celui de la page /taxi/krabi-airport-koh-lanta/.
  const route = text(read("/taxi/krabi-airport-koh-lanta/"));
  const kbv = route.match(/From ([\d,]+) THB/)[1];
  assert.ok(text(read("/guides/krabi-airport-to-koh-lanta/")).includes(`from ${kbv} THB per vehicle`));
  // Enfants : prix du sanctuaire, programme A.
  const el = P("activities/elephant-sanctuary").options.find((o) => o.id === "programme-a").prices;
  const kids = text(read("/guides/koh-lanta-with-kids/"));
  assert.ok(kids.includes(`${el[0].amount.toLocaleString("en-US")} THB`) && kids.includes(`${el[1].amount.toLocaleString("en-US")} THB`));
});

test("intégration : pied de page et menu du téléphone, menu principal inchangé, « Good to know » sur les fiches liées", () => {
  const home = read("/");
  assert.match(home, /<li><a href="\/guides\/">Koh Lanta guides<\/a><\/li><li><a href="\/about\/">About us<\/a><\/li>/);
  assert.match(home, /class="wrap drawer__more"><a class="link" href="\/guides\/"/);
  const nav = home.match(/<nav class="nav" aria-label="Main">([\s\S]*?)<\/nav>/)[1];
  assert.equal((nav.match(/<li>/g) || []).length, 6);
  assert.doesNotMatch(nav, /guides|about/);
  for (const [u, list] of Object.entries(G.byPage)) {
    const h = read(u);
    assert.match(h, /<section class="sec sec--tight gtk"/, u);
    for (const g of list) assert.ok(h.includes(`href="${g.url}"`), u + " -> " + g.url);
    assert.ok(list.length <= 2, u);
  }
  // Une fiche qu'aucun guide ne cite n'a pas le bloc.
  assert.doesNotMatch(read("/tours/scuba-diving/"), /class="sec sec--tight gtk"/);
});
