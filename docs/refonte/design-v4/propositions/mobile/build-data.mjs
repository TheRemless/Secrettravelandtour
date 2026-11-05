// Lit les JSON du site et écrit data.js pour les prototypes (aucune valeur saisie à la main).
// Usage : node docs/refonte/design-v4/propositions/mobile/build-data.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const data = join(here, "../../../../../src/_data");
const read = (p) => JSON.parse(readFileSync(join(data, p), "utf8"));

const site = read("site.json");
const home = read("home.json");
const photos = Object.fromEntries(
  read("photos-v3.json").photos.map((p) => [p.id, { file: p.file, alt: p.alt, position: p.position, placeholder: p.placeholder }])
);

const cardPhoto = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  "koh-talabeng-koh-bubu": "card-talabeng", mangroves: "card-mangroves", "fishing-trip": "card-fishing",
  "elephant-sanctuary": "card-elephant", atv: "card-atv", batik: "card-batik", kayak: "card-kayak",
  "cooking-class": "card-cooking", "scuba-diving": "card-scuba", "go-kart": "card-go-kart",
};

const keep = ["slug", "url", "name", "h1", "lead", "promise", "price", "priceOnRequest", "facts", "options",
  "day", "included", "notIncluded", "beforeYouBook", "faq", "related", "todo", "refPrefix"];
const pick = (d, folder) => {
  const o = { folder };
  for (const k of keep) if (d[k] !== undefined) o[k] = d[k];
  o.photo = cardPhoto[d.slug] || null;
  return o;
};
const products = [];
for (const folder of ["tours", "activities"]) {
  for (const f of readdirSync(join(data, "products", folder)).filter((f) => f.endsWith(".json")).sort()) {
    products.push(pick(read(`products/${folder}/${f}`), folder));
  }
}
const rental = pick(read("products/rental.json"), "rental");
const transfers = ["shared-minivan", "speedboat-ferry"].map((s) => pick(read(`products/secret-transfers/${s}.json`), "transfers"));

const out = {
  generated: new Date().toISOString().slice(0, 10),
  site: {
    url: site.url,
    whatsapp: site.whatsapp,
    booking: site.booking,
    operator: { name: site.operator.name, registration: site.operator.registration },
    secret: { name: site.brands.secret.name, licence: site.brands.secret.licence, offer: site.brands.secret.offer },
    vip: { name: site.brands.vip.name, owner: site.brands.vip.owner, url: site.brands.vip.url },
    replyTime: site.replyTime, languages: site.languages,
  },
  home: { h1: home.h1, boats: home.boats, activities: home.activities, transfers: home.transfers,
    transfersLead: home.transfersLead, rental: home.rental, faq: home.faq },
  photos, products, rental, transfers,
};
writeFileSync(join(here, "data.js"), "window.STT = " + JSON.stringify(out) + ";\n");
console.log("data.js:", products.length, "produits,", Object.keys(photos).length, "photos");
