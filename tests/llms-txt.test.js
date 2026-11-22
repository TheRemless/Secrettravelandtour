// /llms.txt et /llms-full.txt pour les assistants IA (16.11.2026), générés au build par src/_data/llms.js.
// Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const view = require("../src/_includes/components/view.js");
const site = require("../src/_data/site.json");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const short = fs.readFileSync(path.join(SITE, "llms.txt"), "utf8");
const full = fs.readFileSync(path.join(SITE, "llms-full.txt"), "utf8");
const DIR = path.join(ROOT, "src", "_data", "products");
const products = ["tours", "activities"].flatMap((f) => fs.readdirSync(path.join(DIR, f)).filter((n) => n.endsWith(".json")).map((n) => JSON.parse(fs.readFileSync(path.join(DIR, f, n), "utf8"))))
  .concat(["rental.json", "secret-transfers/speedboat-ferry.json", "secret-transfers/shared-minivan.json"].map((n) => JSON.parse(fs.readFileSync(path.join(DIR, n), "utf8"))));
const routes = require("../src/_data/taxiPages.js")();
// Même liste que tests/partenaires.test.js.
const PARTENAIRES = /rattana|lacha ?ru|sukho|lanta ?atv|atv adventure|tiger ?atv|lanta elephant|lanta longtail|lanta batik|lanta kayaking|lanta ?e-?gokart|noom|bundhaya|satun|pakbara|at ?lanta vacation|blue ?planet/i;

test("llms.txt au format llmstxt.org : H1, résumé en citation, sections H2 de liens absolus, date de mise à jour", () => {
  const lines = short.split("\n");
  assert.equal(lines[0], "# Secret Travel & Tour");
  const quote = lines.find((l) => l.startsWith("> "));
  assert.ok(quote, "résumé en citation");
  assert.ok(quote.includes("Koh Lanta, Krabi province, Thailand"));
  assert.ok(quote.includes(`TAT licence ${site.brands.secret.licence}`));
  assert.ok(quote.includes(site.whatsapp.display) && quote.includes(site.replyTime.usual));
  assert.match(short, /^Updated: \d{4}-\d{2}-\d{2}\./m);
  assert.deepEqual(lines.filter((l) => l.startsWith("## ")), ["## Boat trips", "## Activities", "## Transfers and taxi", "## Practical info", "## Optional"]);
  for (const l of lines.filter((x) => x.startsWith("- "))) assert.match(l, /^- \[[^\]]+\]\(https:\/\/secrettravelandtour\.com\/[^)]*\): \S/, l);
});

test("chaque fiche et chaque trajet sont dans les deux fichiers", () => {
  for (const p of products) {
    assert.ok(short.includes(`(${site.url}${p.url})`), "llms.txt : " + p.slug);
    assert.ok(full.includes(`URL: ${site.url}${p.url}`), "llms-full.txt : " + p.slug);
  }
  for (const r of routes.routes.concat([routes.dayTrip])) {
    assert.ok(short.includes(`[${r.name}](${site.url}${r.url})`), "llms.txt : " + r.url);
    assert.ok(full.includes(`- ${r.name}: `) && full.includes(site.url + r.url), "llms-full.txt : " + r.url);
  }
});

test("llms-full.txt : chaque ligne de prix est celle du JSON de la fiche, et chaque prix d'appel de trajet celui de la page", () => {
  for (const p of products) {
    const block = full.slice(full.indexOf(`URL: ${site.url}${p.url}`));
    for (const o of view.options(p).list) {
      for (const r of o.rows) {
        if (typeof r.amount === "number" && r.amount > 0) {
          const raw = (p.options.find((x) => x.id === o.id).prices || []).find((x) => x.label === r.label);
          assert.equal(r.amount, raw.amount, `${p.slug} ${o.id} ${r.label}`);
          assert.ok(block.includes(`${r.label}: ${(r.price.startsWith("+") ? "+" : "")}${raw.amount.toLocaleString("en-US")} THB`), `${p.slug} : ${r.label} ${raw.amount}`);
        }
      }
    }
    // Location : une fourchette par catégorie (comme l'accueil) ; les autres fiches : le prix d'appel.
    if (p.template === "rental") for (const o of p.options) assert.ok(short.includes(`${o.label}: ${Math.min(...o.prices.map((r) => r.amount)).toLocaleString("en-US")} to ${Math.max(...o.prices.map((r) => r.amount)).toLocaleString("en-US")} THB`), o.label);
    else if (p.price && p.price.from) assert.ok(short.includes(`From ${p.price.from.toLocaleString("en-US")} THB`), "prix d'appel " + p.slug);
  }
  for (const r of routes.routes) assert.ok(full.includes(`${r.price.label.replace(/^F/, "f").replace(/^A/, "a")} per vehicle. ${site.url}${r.url}`), r.url);
});

test("aucun nom de prestataire, aucune adresse de bureau, aucune note Google ; WhatsApp au format international", () => {
  for (const [name, text] of [["llms.txt", short], ["llms-full.txt", full]]) {
    assert.doesNotMatch(text, PARTENAIRES, name);
    assert.doesNotMatch(text, /292|Moo 2|Sala Dan, Koh Lanta Yai|81150/, name);
    assert.doesNotMatch(text, /Rated|reviews|\b5\.0\b/, name);
    assert.doesNotMatch(text, /\[À CONFIRMER|\[À VÉRIFIER|TODO/, name);
  }
  assert.ok(full.includes(`WhatsApp: ${site.whatsapp.e164}`));
});

test("chaque URL absolue mène à une page ou un fichier du site généré", () => {
  const urls = new Set([...(short + full).matchAll(/https:\/\/secrettravelandtour\.com(\/[^\s)]*)/g)].map((m) => m[1].replace(/[.,;]$/, "")));
  assert.ok(urls.size > 40);
  for (const u of urls) {
    const file = u.endsWith("/") ? path.join(SITE, u, "index.html") : path.join(SITE, u);
    assert.ok(fs.existsSync(file), u);
  }
});

test("robots.txt garde tout ouvert (robots des IA compris) et cite llms.txt en commentaire", () => {
  const robots = fs.readFileSync(path.join(SITE, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*\nAllow: \/$/m);
  assert.doesNotMatch(robots, /Disallow/);
  assert.match(robots, /^# .*https:\/\/secrettravelandtour\.com\/llms\.txt$/m);
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  assert.match(toml, /for = "\/llms\.txt"\n\s+\[headers\.values\]\n\s+Content-Type = "text\/plain; charset=utf-8"/);
});
