// Lit les JSON du site et écrit ../data.js (window.STT), chargé par les trois prototypes.
// Aucune valeur n'est tapée à la main ici : tout vient de src/_data. Les vignettes floues (LQIP)
// et la couleur moyenne de chaque photo sont calculées avec sharp.
// Usage : node docs/refonte/design-v4/propositions/mouvement/_build/data.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../../../../..");
const require = createRequire(import.meta.url);
const sharp = require(join(root, "node_modules/sharp"));
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const IMG = "../../../../../src/images/";

const site = read("src/_data/site.json");
const home = read("src/_data/home.json");
const photosV3 = read("src/_data/photos-v3.json").photos;

const cardPhoto = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  "koh-talabeng-koh-bubu": "card-talabeng", mangroves: "card-mangroves", "fishing-trip": "card-fishing",
  "elephant-sanctuary": "card-elephant", atv: "card-atv", batik: "card-batik", kayak: "card-kayak",
  "cooking-class": "card-cooking", "scuba-diving": "card-scuba", "go-kart": "card-go-kart"
};
// Ordre d'affichage : celui de l'accueil v3 (bateaux puis activités).
const boatOrder = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu", "mangroves", "fishing-trip"];
const actOrder = ["elephant-sanctuary", "kayak", "cooking-class", "scuba-diving", "atv", "batik", "go-kart"];

async function photo(id) {
  const p = photosV3.find((x) => x.id === id);
  if (!p) throw new Error("photo absente de photos-v3.json : " + id);
  const file = join(root, "src/images", p.file);
  const img = sharp(file).rotate();
  const meta = await img.metadata();
  const { dominant } = await sharp(file).stats();
  const tiny = await sharp(file).rotate().resize(24).blur(1.2).webp({ quality: 42 }).toBuffer();
  return {
    id, src: IMG + p.file, alt: p.alt, ratio: p.ratio, position: p.position || "50% 50%",
    placeholder: !!p.placeholder, w: meta.width, h: meta.height,
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
    lqip: "data:image/webp;base64," + tiny.toString("base64")
  };
}

function product(kind, j) {
  const fact = (label) => (j.facts || []).find((f) => f.label === label);
  // Deux faits courts pour la carte, lus tels quels ; « All year » n'apprend rien sur une carte.
  const meta = ["Duration", "Season", "Boat", "Sessions"].map(fact)
    .filter((f) => f && f.value !== "All year" && f.value.length <= 40).slice(0, 2).map((f) => f.value);
  return {
    slug: j.slug, kind, name: j.name, h1: j.h1, lead: j.lead,
    line: j.promise || (j.legacyText && j.legacyText.cardDescription) || "",
    facts: j.facts || [], meta, price: j.price || null, priceOnRequest: !!j.priceOnRequest,
    options: (j.options || []).map((o) => ({
      id: o.id, label: o.label, kind: o.kind, boat: o.boat || null, note: o.note || "",
      priceOnRequest: !!o.priceOnRequest, prices: o.prices || [], fees: o.notIncludedFees || [], stub: o.stub || ""
    })),
    day: j.day || [], included: j.included || [], notIncluded: j.notIncluded || [],
    beforeYouBook: j.beforeYouBook || {}, faq: j.faq || [], related: j.related || [],
    refPrefix: j.refPrefix || "", todo: j.todo || [],
    page: j.slug === "4-islands" ? "4-islands.html" : null
  };
}

const products = [];
for (const slug of boatOrder) products.push(product("boat", read(`src/_data/products/tours/${slug}.json`)));
for (const slug of actOrder) products.push(product("activity", read(`src/_data/products/activities/${slug}.json`)));
const known = new Set(products.map((p) => p.slug));
for (const d of ["tours", "activities"]) for (const f of readdirSync(join(root, "src/_data/products", d))) {
  if (!known.has(f.replace(".json", ""))) throw new Error("produit non classé : " + f);
}

const photos = {};
for (const p of products) { p.photo = cardPhoto[p.slug]; photos[p.photo] = await photo(p.photo); }
for (const id of ["home-hero", "home-transfers", "home-final", "hub-final", "four-hero", "four-gallery-reef",
  "four-gallery-ngai", "four-gallery-kradan", "four-gallery-pier", "four-longtail"]) photos[id] = await photo(id);

const taxi = readdirSync(join(root, "src/_data/products/taxi")).map((f) => read("src/_data/products/taxi/" + f))
  .filter((t) => t.route && t.route.from && t.route.to)
  .map((t) => ({ slug: t.slug, name: t.name, url: t.url, from: t.route.from, to: t.route.to, drive: t.route.drive, code: t.route.code || "" }));

const rental = read("src/_data/products/rental.json");
const speedboat = read("src/_data/products/secret-transfers/speedboat-ferry.json");

const out = {
  generated: new Date().toISOString().slice(0, 10),
  site: {
    whatsapp: site.whatsapp, booking: site.booking,
    operator: site.operator.name, licence: site.brands.secret.licence, brand: site.brands.secret.name,
    vip: { name: site.brands.vip.name, owner: site.brands.vip.owner }
  },
  home: { h1: home.h1, transfers: home.transfers.items, rental: home.rental },
  products, photos, taxi,
  rental: { name: rental.name, lead: rental.lead, price: rental.price, facts: rental.facts },
  speedboat: { name: speedboat.name, lead: speedboat.lead, facts: speedboat.facts }
};

writeFileSync(join(here, "../data.js"),
  "/* Généré par _build/data.mjs depuis src/_data le " + out.generated + ". Ne pas modifier à la main. */\nwindow.STT = " + JSON.stringify(out) + ";\n");
console.log("data.js :", products.length, "produits,", Object.keys(photos).length, "photos,", taxi.length, "trajets");
