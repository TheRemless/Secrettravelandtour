// Lit les fichiers de données du site et écrit assets/data.js pour les prototypes (qui tournent en file://, sans fetch).
// Lancer depuis n'importe où : node docs/refonte/design-v4/propositions/recit/tools/build-data.mjs
// Aucune valeur de produit n'est écrite à la main ici : seules les étiquettes de durée (filtre du hub) sont
// déduites des faits, avec la ligne de faits qui les justifie dans `lengthFrom`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../../..");
const data = (p) => JSON.parse(fs.readFileSync(path.join(repo, "src/_data", p), "utf8"));

const site = data("site.json");
const photos = data("photos-v3.json").photos;
const rental = data("products/rental.json");
const minivan = data("products/secret-transfers/shared-minivan.json");
const speedboat = data("products/secret-transfers/speedboat-ferry.json");

const tourSlugs = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu", "mangroves", "fishing-trip"];
const activitySlugs = ["elephant-sanctuary", "kayak", "cooking-class", "scuba-diving", "atv", "batik", "go-kart"];

// Photo de carte, d'après le champ `usage` de photos-v3.json.
const cardPhoto = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  "koh-talabeng-koh-bubu": "card-talabeng", "mangroves": "card-mangroves", "fishing-trip": "card-fishing",
  "elephant-sanctuary": "card-elephant", "kayak": "card-kayak", "cooking-class": "card-cooking",
  "scuba-diving": "card-scuba", "atv": "card-atv", "batik": "card-batik", "go-kart": "card-go-kart"
};

// Durée : « short » = quelques heures, « half » = demi-journée, « full » = journée. Chaque étiquette cite le fait lu.
const lengths = {
  "4-islands": [["full"], "facts Duration: Full day"],
  "koh-rok-koh-haa": [["full"], "facts Duration: Full day"],
  "koh-phi-phi": [["full"], "facts Duration: Full day"],
  "koh-talabeng-koh-bubu": [["half"], "facts Duration: Half day"],
  "mangroves": [["short", "half"], "facts Duration: Half day, or a sunrise (sunrise raft 04:40 to 07:30)"],
  "fishing-trip": [["half"], "facts Duration: Half day"],
  "elephant-sanctuary": [["short", "full"], "options: Programme A about 2 hours, B about 3 hours, C full day"],
  "kayak": [["half", "full"], "facts Half days 09:30–12:30 or 14:00–17:00, Full days 09:00–15:00"],
  "cooking-class": [["half"], "facts Morning class 09:00 to about 14:00, Evening class 16:00–21:00"],
  "scuba-diving": [["full"], "options: One-day experience, courses of 2 to 3 days"],
  "atv": [["short"], "facts Rides: 30 min, 1 hr, or 1 hr ATV plus 1 hr kayak"],
  "batik": [["half", "full"], "facts Morning course back around 13:00; Kayak and painting back 17:00"],
  "go-kart": [["short"], "facts Sessions: 10 or 15 minutes"]
};

// Lieux de chaque sortie pour la carte du hub : uniquement des lieux écrits dans les données du produit.
const places = {
  "4-islands": ["chueak", "muk", "ngai", "ma", "kradan"],
  "koh-rok-koh-haa": ["rok", "haa"],
  "koh-phi-phi": ["phiphi-le", "phiphi-don", "bamboo"],
  "koh-talabeng-koh-bubu": ["talabeng", "bubu"],
  "mangroves": ["thung-yee-peng"],
  "fishing-trip": ["thung-yee-peng"],
  "kayak": ["thung-yee-peng", "talabeng"],
  "scuba-diving": ["haa", "bida"],
  "batik": ["talabeng"]
};

const slim = (p, kind) => ({
  slug: p.slug, url: p.url, kind, name: p.name, h1: p.h1, lead: p.lead, promise: p.promise || null,
  facts: p.facts || [], price: p.price || null, included: p.included || [], notIncluded: p.notIncluded || [],
  options: (p.options || []).map((o) => ({ id: o.id, label: o.label, kind: o.kind || null, boat: o.boat || null, note: o.note || null, stub: o.stub || null, pier: o.pier || null, prices: o.prices || [], fees: o.notIncludedFees || [] })),
  season: ((p.facts || []).find((f) => f.label === "Season") || {}).value || null,
  photo: cardPhoto[p.slug] || null,
  length: (lengths[p.slug] || [[]])[0], lengthFrom: (lengths[p.slug] || [null, null])[1],
  places: places[p.slug] || [],
  refPrefix: p.refPrefix || null
});

const products = [
  ...tourSlugs.map((s) => slim(data(`products/tours/${s}.json`), "boat")),
  ...activitySlugs.map((s) => slim(data(`products/activities/${s}.json`), "activity"))
];

const four = data("products/tours/4-islands.json");

// Contours OpenStreetMap (© OpenStreetMap contributors, ODbL), simplifiés par Nominatim, relevés le 05.11.2026.
const osm = JSON.parse(fs.readFileSync(path.join(here, "osm-islands.json"), "utf8"));
const ring = (g) => (g.type === "Polygon" ? [g.coordinates[0]] : g.coordinates.map((p) => p[0]));
const round = (n) => Math.round(n * 10000) / 10000;
const geo = {};
for (const [k, v] of Object.entries(osm)) geo[k] = { lat: v.lat, lon: v.lon, rings: ring(v.geo).map((r) => r.map(([x, y]) => [round(x), round(y)])) };
// Koh Chueak = Koh Chueak Nai + Koh Chueak Nok ; Koh Rok = Ko Rok Yai dans OSM (le produit cite Koh Rok Nok et Koh Rok Nai).
geo.chueak = { lat: geo["chueak-nai"].lat, lon: geo["chueak-nai"].lon, rings: [...geo["chueak-nai"].rings, ...geo["chueak-nok"].rings] };
geo.rok = geo["rok-yai"];
delete geo["chueak-nai"]; delete geo["chueak-nok"]; delete geo["rok-yai"];
// Points sans contour : Thung Yee Peng (Nominatim, « Tung Yi Peng Natural Study & Eco Tourism Centre »), Koh Bida Nok, Lanta Old Town.
geo["thung-yee-peng"] = { lat: 7.5952, lon: 99.0714, rings: [] };
geo["bida"] = { lat: 7.6544, lon: 98.7676, rings: [] };
geo["old-town"] = { lat: 7.531, lon: 99.0943, rings: [] };

const photoMap = Object.fromEntries(photos.map((p) => [p.id, { file: p.file, alt: p.alt, position: p.position, ratio: p.ratio, placeholder: !!p.placeholder }]));

const out = {
  builtAt: new Date().toISOString().slice(0, 10),
  site: {
    whatsapp: site.whatsapp, licence: site.brands.secret.licence, operator: site.operator.name,
    payment: site.booking.payment, onlinePayment: site.booking.onlinePayment, weather: site.booking.weather,
    pickup: site.booking.pickup, logo: "secret/emblem.webp", name: site.brands.secret.name
  },
  products, four,
  rental: { name: rental.name, url: rental.url, promise: rental.promise, price: rental.price, facts: rental.facts },
  transfers: [
    { name: minivan.name, url: minivan.url, lead: minivan.lead, facts: minivan.facts },
    { name: speedboat.name, url: speedboat.url, lead: speedboat.lead, facts: speedboat.facts }
  ],
  taxi: { name: site.brands.vip.name, byline: site.brands.vip.byline, offer: site.brands.vip.offer, url: "/taxi/" },
  photos: photoMap, geo
};

fs.writeFileSync(path.join(here, "../assets/data.js"),
  "/* Généré par tools/build-data.mjs depuis src/_data. Ne pas modifier à la main. */\nwindow.STT = " + JSON.stringify(out) + ";\n");
console.log("data.js:", products.length, "produits,", Object.keys(geo).length, "lieux");
