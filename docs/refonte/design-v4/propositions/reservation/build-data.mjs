// Lit les fichiers de données du site et écrit data.js pour les prototypes (file:// ne permet pas fetch).
// Relancer : node build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const site = read("src/_data/site.json");
const photos = read("src/_data/photos-v3.json").photos;
// Photo du comptoir de Sala Dan exclue : plus aucune mention du comptoir (décision du 05.11.2026).
const photoById = Object.fromEntries(photos.filter((p) => p.id !== "home-desk").map((p) => [p.id, p]));

// Photo de carte de chaque produit (ids de photos-v3.json).
const cardPhoto = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  "koh-talabeng-koh-bubu": "card-talabeng", mangroves: "card-mangroves", "fishing-trip": "card-fishing",
  "elephant-sanctuary": "card-elephant", atv: "card-atv", batik: "card-batik", kayak: "card-kayak",
  "cooking-class": "card-cooking", "scuba-diving": "card-scuba", "go-kart": "card-go-kart",
};

// Classement de durée pour le filtre. Chaque tag renvoie au fait qui le justifie (champ facts du produit).
const duration = {
  "4-islands": { tags: ["full"], from: "Duration" },
  "koh-rok-koh-haa": { tags: ["full"], from: "Duration" },
  "koh-phi-phi": { tags: ["full"], from: "Duration" },
  "koh-talabeng-koh-bubu": { tags: ["half"], from: "Duration" },
  "fishing-trip": { tags: ["half"], from: "Duration" },
  mangroves: { tags: ["half", "short"], from: "Duration" },
  atv: { tags: ["short"], from: "Rides" },
  batik: { tags: ["half", "full"], from: "Morning course" },
  "cooking-class": { tags: ["half", "short"], from: "Morning class" },
  "elephant-sanctuary": { tags: ["short", "full"], from: "Duration" },
  "go-kart": { tags: ["short"], from: "Sessions" },
  kayak: { tags: ["half", "full"], from: "Half days" },
  "scuba-diving": { tags: ["full"], from: "One-day sites" },
};

// Saison : seulement quand un fait « Season » existe. Absent = inconnu (jamais « toute l'année » par défaut).
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function seasonFrom(facts) {
  const f = facts.find((x) => x.label === "Season");
  if (!f) return null;
  if (/all year/i.test(f.value)) return { text: f.value, months: [1,2,3,4,5,6,7,8,9,10,11,12] };
  const m = f.value.match(/(\w+) to (\w+)/);
  if (!m) return { text: f.value, months: null };
  const a = MONTHS.indexOf(m[1]) + 1, b = MONTHS.indexOf(m[2]) + 1;
  const months = [];
  for (let i = a; ; i = (i % 12) + 1) { months.push(i); if (i === b) break; }
  return { text: f.value, months };
}

function product(file, kind) {
  const p = read(file);
  const bfb = Object.assign({}, p.beforeYouBook || {});
  return {
    slug: p.slug, kind, url: p.url, name: p.name, h1: p.h1, lead: p.lead, promise: p.promise || null,
    facts: p.facts, price: p.price || null, priceOnRequest: !!p.priceOnRequest,
    options: p.options || [], day: p.day || [], included: p.included || [], notIncluded: p.notIncluded || [],
    beforeYouBook: bfb, faq: p.faq || [], related: p.related || [], refPrefix: p.refPrefix || null,
    todo: p.todo || [],
    photo: cardPhoto[p.slug] ? photoById[cardPhoto[p.slug]] : null,
    duration: duration[p.slug] || null,
    season: seasonFrom(p.facts),
  };
}

const list = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(".json")).sort();
const tourOrder = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu", "mangroves", "fishing-trip"];
const tours = tourOrder.map((s) => product(`src/_data/products/tours/${s}.json`, "boat"));
const activities = list("src/_data/products/activities").map((f) => product(`src/_data/products/activities/${f}`, "activity"));
const rental = product("src/_data/products/rental.json", "rental");

const data = {
  generated: new Date().toISOString().slice(0, 10),
  site: { whatsapp: site.whatsapp, booking: site.booking, operator: { name: site.operator.name }, brand: site.brands.secret.name, licence: site.brands.secret.licence, url: site.url, replyTime: site.replyTime },
  products: [...tours, ...activities],
  rental,
  photos: photoById,
};
fs.writeFileSync(path.join(here, "data.js"), "window.STT = " + JSON.stringify(data) + ";\n");
console.log("data.js:", data.products.length, "produits");
