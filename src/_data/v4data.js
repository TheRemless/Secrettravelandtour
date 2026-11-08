// Données des pages du design v4 (accueil, 4 Islands, hub /tours/, /_components/, /credits/).
// Base : prototype « mouvement » (docs/refonte/design-v4/propositions/mouvement/), plus quatre ajouts : liste de
// sorties, « What runs on … », comparateur des trois bateaux, carte du trajet.
// Faits, prix, horaires, saisons : src/_data/products/** et site.json, lus ici et nulle part ailleurs.
// Photos : src/_data/photos-v3.json (une entrée = un usage). Contours des îles : © OpenStreetMap contributors (ODbL).
const fs = require("node:fs");
const path = require("node:path");
const view = require("../_includes/components/view.js");
const price = require("../js/v4-price.js");
const booking = require("../js/booking.js");
const site = require("./site.json");
const vp = require("../_includes/components/v4-product.js");
const schema = require("../_includes/components/schema.js");

const DATA = __dirname;
const IMAGES = path.join(DATA, "..", "images");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, "products", rel + ".json"), "utf8"));
const home = JSON.parse(fs.readFileSync(path.join(DATA, "home.json"), "utf8"));
const PHOTOS = JSON.parse(fs.readFileSync(path.join(DATA, "photos-v3.json"), "utf8")).photos;

const BOATS = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu", "mangroves", "fishing-trip"];
const ACTIVITIES = ["elephant-sanctuary", "kayak", "cooking-class", "scuba-diving", "atv", "batik", "go-kart"];
const CARD_PHOTO = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  "koh-talabeng-koh-bubu": "card-talabeng", mangroves: "card-mangroves", "fishing-trip": "card-fishing",
  "scuba-diving": "card-scuba", atv: "card-atv", kayak: "card-kayak", "elephant-sanctuary": "card-elephant",
  "cooking-class": "card-cooking", batik: "card-batik", "go-kart": "card-go-kart"
};
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const fact = (p, label) => ((p.facts || []).find((f) => f.label === label) || {}).value || "";
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");
const host = site.url.replace(/^https?:\/\//, "");
const listJoin = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);

// ---------- Photos : dimensions réelles, vignette floue (LQIP) et couleur moyenne ----------
let sharp = null;
try { sharp = require("sharp"); } catch (e) { sharp = null; }

function jpegSize(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length;) {
    const len = b.readUInt16BE(i + 2);
    if (b[i + 1] >= 0xc0 && b[i + 1] <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error("taille JPEG illisible : " + file);
}

async function photo(id) {
  const p = PHOTOS.find((x) => x.id === id);
  if (!p) throw new Error("photo inconnue dans photos-v3.json : " + id);
  const file = path.join(IMAGES, p.file);
  const [width, height] = p.file.endsWith(".webp") ? view.webpSize(p.file) : jpegSize(file);
  let lq = "", color = "";
  if (sharp) {
    const tiny = await sharp(file).rotate().resize(20).blur(1).webp({ quality: 40 }).toBuffer();
    const { dominant } = await sharp(file).stats();
    lq = "data:image/webp;base64," + tiny.toString("base64");
    color = `rgb(${dominant.r} ${dominant.g} ${dominant.b})`;
  }
  return { id: p.id, src: `/images/${p.file}`, width, height, alt: p.alt, position: p.position || "50% 50%", placeholder: Boolean(p.placeholder), lq, color };
}

// ---------- Cartes ----------
function product(slug) {
  return BOATS.includes(slug) ? P("tours/" + slug) : P("activities/" + slug);
}

// « Koh Chueak, snorkelling over the reef » sous le titre « Koh Chueak » : le nom n'est pas répété.
const dropPlace = (text, place) => (place && text.startsWith(place + ", ") ? text.charAt(place.length + 2).toUpperCase() + text.slice(place.length + 3) : text);

// Deux faits courts lus tels quels ; « All year » n'apprend rien sur une carte, ni un fait déjà dit par la promesse.
function cardMeta(p) {
  const promise = (p.promise || "").toLowerCase();
  return ["Duration", "Season", "Boat", "Sessions"].map((l) => fact(p, l))
    .filter((v) => v && v !== "All year" && v.length <= 40 && !promise.includes(v.toLowerCase())).slice(0, 2);
}

async function card(slug) {
  const p = product(slug);
  const pr = view.price(p);
  return {
    slug, kind: BOATS.includes(slug) ? "boat" : "activity",
    href: p.url, title: p.name, promise: p.promise || "",
    meta: cardMeta(p),
    price: pr ? { amount: pr.amount, unit: p.price.unit, from: p.price.from } : null,
    photo: await photo(CARD_PHOTO[slug])
  };
}

// ---------- Catalogue (liste de sorties, comparateur du hub, composeur de message de l'accueil) ----------
// Servi en /data/catalog.json, chargé seulement quand la liste, le comparateur ou le composeur sont utilisés.
function catalogEntry(p, kind) {
  const opts = view.options(p).list;
  const compare = [["Price", view.price(p) ? `from ${view.price(p).amount}, ${p.price.unit}` : "Price on WhatsApp"]]
    .concat(["Duration", "Season", "Hotel pickup", "Boat", "Crossing", "Sessions", "Children", "Ages", "National park fee", "Village entrance fee"]
      .map((l) => [l, fact(p, l)]).filter((r) => r[1]))
    .concat([["Options", opts.map((o) => o.title).join(", ")], ["Included", (p.included || []).slice(0, 4).join(", ")]].filter((r) => r[1]));
  return {
    slug: p.slug, kind, name: p.name, url: p.url, page: host + p.url, refPrefix: p.refPrefix || "",
    fullDay: fact(p, "Duration") === "Full day",
    season: view.seasonMonths(p) && fact(p, "Season") !== "All year" ? { text: fact(p, "Season"), months: view.seasonMonths(p) } : null,
    from: view.price(p) ? view.price(p).amount : "",
    // Sous-variantes (créneau, cours, karts…) : la liste de sorties les fait choisir comme la feuille.
    options: opts.filter((o) => ((p.options || []).find((x) => x.id === o.id) || {}).kind !== "extra")
      .map((o) => ({ id: o.id, title: o.title, rows: o.rows, ...vp.formOf(p, (p.options || []).find((x) => x.id === o.id) || {}) })),
    compare
  };
}

// ---------- « What runs on … » : horaires écrits dans les fiches, jamais déduits ----------
const TIME = /\b([01]\d|2[0-3]):([0-5]\d)\b/g;
const minutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const timesIn = (s) => [...String(s).matchAll(TIME)].map((m) => m[0]);
function span(texts) {
  const all = texts.flatMap(timesIn).map(minutes);
  return all.length ? { start: Math.min(...all), end: Math.max(...all) } : null;
}
const daysIn = (s) => DAY_NAMES.map((d, i) => (new RegExp("\\b" + d + "\\b").test(s) ? i : -1)).filter((i) => i > -1);
const stripDays = (s) => s.replace(new RegExp("\\b(" + DAY_NAMES.join("|") + ")\\b,?\\s*", "g"), "").replace(/^[,;\s]+/, "").trim();
const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

// Pour chaque sortie : quels faits donnent ses horaires. Les valeurs sont lues dans les fiches.
const RUNS = {
  "4-islands": (p) => [{ label: `Pickup ${fact(p, "Hotel pickup")}, boat leaves ${fact(p, "Boat leaves")}`, src: p.day[0].steps.map((s) => s.range || s.time) }],
  "koh-rok-koh-haa": (p) => [{ label: `Pickup ${lc(fact(p, "Hotel pickup"))}`, src: p.day[0].steps.map((s) => s.time || "") }],
  "koh-phi-phi": (p) => [{ label: `Pickup ${fact(p, "Hotel pickup")}`, src: p.day[0].steps.map((s) => s.time || "") }],
  "fishing-trip": (p) => [{ label: fact(p, "Raft"), src: [fact(p, "Raft")] }],
  mangroves: (p) => p.day.filter((b) => (b.options || []).length === 1 && b.steps.length === 1).map((b) => {
    const o = p.options.find((x) => x.id === b.options[0]);
    return { label: o.label, src: [b.steps[0].time, b.steps[0].text], at: b.steps[0].time };
  }),
  "elephant-sanctuary": (p) => [{ label: `Sessions ${fact(p, "Sessions")}`, src: [fact(p, "Sessions")], dots: timesIn(fact(p, "Sessions")) }],
  "cooking-class": (p) => ["Morning class", "Evening class", "Carving class"].flatMap((l) => fact(p, l).split(";").map((seg) => ({
    label: `${l}, ${stripDays(seg.trim())}`, src: [stripDays(seg)], days: daysIn(seg)
  }))),
  batik: (p) => ["Morning course", "Afternoon course", "Kayak and painting"].map((l) => ({ label: `${l}, ${lc(fact(p, l))}`, src: [fact(p, l)] })),
  kayak: (p) => fact(p, "Half days").split(" or ").map((seg) => ({ label: `Half day, ${seg}`, src: [seg] }))
    .concat([{ label: `Full day, ${fact(p, "Full days")}`, src: [fact(p, "Full days")] }])
};
const AXIS = { from: 4 * 60, to: 22 * 60 };

function runs(products) {
  const entries = [];
  const noTime = [];
  for (const p of products) {
    const make = RUNS[p.slug];
    const months = view.seasonMonths(p);
    const season = months && fact(p, "Season") !== "All year" ? { text: fact(p, "Season"), months } : null;
    if (!make) { noTime.push({ name: p.name, href: p.url, season: season ? season.text : "" }); continue; }
    for (const e of make(p)) {
      const s = span(e.src);
      if (!s) throw new Error(`horaire illisible pour ${p.slug} : ${e.label}`);
      const start = e.at ? minutes(e.at) : s.start;
      const part = start < 12 * 60 ? "morning" : start < 16 * 60 ? "afternoon" : "evening";
      const pct = (m) => Math.round(((m - AXIS.from) / (AXIS.to - AXIS.from)) * 1000) / 10;
      entries.push({
        slug: p.slug, name: p.name, href: p.url, label: e.label, time: hhmm(start), start, part,
        a: pct(start), b: pct(Math.max(s.end, start)), dots: (e.dots || []).map((t) => pct(minutes(t))),
        days: e.days && e.days.length ? e.days : null,
        daysText: e.days && e.days.length ? listJoin(e.days.map((d) => DAY_NAMES[d])) : "",
        months: season ? season.months : null, seasonText: season ? season.text : ""
      });
    }
  }
  entries.sort((x, y) => x.start - y.start || x.name.localeCompare(y.name));
  const parts = [["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"]]
    .map(([id, title]) => ({ id, title, entries: entries.filter((e) => e.part === id) })).filter((g) => g.entries.length);
  const ticks = [];
  for (let h = AXIS.from / 60; h <= AXIS.to / 60; h += 2) ticks.push({ label: String(h).padStart(2, "0") + ":00", at: Math.round(((h * 60 - AXIS.from) / (AXIS.to - AXIS.from)) * 1000) / 10 });
  return { parts, noTime, ticks, count: entries.length };
}

// ---------- 4 Islands : parcours, comparateur, journée, carte ----------
function islandsOf(four, boat) {
  return fact(four, boat === "speedboat" ? "Islands, speedboat" : "Islands, longtail").split(", ").map((raw) => {
    const m = raw.match(/^(.*?) \((.*)\)$/);
    return { name: m ? m[1] : raw, tag: m ? m[2] : "" };
  });
}
function lunchOf(four, boat) {
  return (fact(four, "Lunch").match(new RegExp("(Koh \\w+) by " + boat)) || [])[1] || "";
}

function routeNodes(four, opt, kradan) {
  const list = islandsOf(four, opt.boat);
  if (opt.kind === "private" && kradan) list.push({ name: "Koh Kradan", tag: "" });
  const lunch = lunchOf(four, opt.boat);
  // Ponton de chaque bateau, lu dans son option (Lanta Old Town pier, Koh Lanta Noi pier).
  return [{ name: "Koh Lanta", tag: opt.pier || "", end: true }]
    .concat(list.map((i) => ({ ...i, lunch: i.name === lunch })))
    .concat([{ name: "Koh Lanta", tag: "Back to your hotel", end: true }]);
}

// Projection équirectangulaire corrigée de la latitude : un schéma, pas une carte marine.
const MAP = { lon0: 99.0, lon1: 99.335, lat0: 7.29, lat1: 7.555, W: 640 };
function fourMap(four) {
  const osm = JSON.parse(fs.readFileSync(path.join(DATA, "..", "_includes", "geo", "osm-islands.json"), "utf8"));
  const k = Math.cos(((MAP.lat0 + MAP.lat1) / 2) * Math.PI / 180);
  const H = Math.round((MAP.W * (MAP.lat1 - MAP.lat0)) / ((MAP.lon1 - MAP.lon0) * k));
  const P = ([lon, lat]) => [((lon - MAP.lon0) / (MAP.lon1 - MAP.lon0)) * MAP.W, ((MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0)) * H];
  const f = (n) => n.toFixed(1);
  const rings = (g) => (g.type === "Polygon" ? [g.coordinates[0]] : g.coordinates.map((x) => x[0]));
  const KEEP = ["lanta-yai", "lanta-noi", "ngai", "muk", "kradan", "ma", "chueak-nai", "chueak-nok", "talabeng", "bubu"];
  const land = KEEP.flatMap((key) => rings(osm[key].geo).map((r) => ({ main: key.startsWith("lanta"), d: r.map((pt, i) => (i ? "L" : "M") + f(P(pt)[0]) + " " + f(P(pt)[1])).join("") + "Z" })));
  const G = (key) => [osm[key].lon, osm[key].lat];
  const chueak = [(osm["chueak-nai"].lon + osm["chueak-nok"].lon) / 2, (osm["chueak-nai"].lat + osm["chueak-nok"].lat) / 2];
  const pier = [99.0985, 7.5305];
  const at = { "Koh Chueak": chueak, "Koh Mook": G("muk"), "Koh Ngai": G("ngai"), "Koh Ma": G("ma"), "Koh Kradan": G("kradan") };
  const curve = (pts) => {
    const p = pts.map(P);
    let d = "M" + f(p[0][0]) + " " + f(p[0][1]);
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += "C" + [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]].map(f).join(" ");
    }
    return d;
  };
  // Un tronçon par arrivée : ponton → 1re île, puis île à île, puis retour. Points de passage au large pour ne pas couper les terres.
  const lane = (names) => {
    const stops = names.map((n) => at[n]);
    const segs = [[pier, [99.19, 7.475], stops[0]]];
    for (let i = 1; i < stops.length; i++) segs.push([stops[i - 1], stops[i]]);
    segs.push([stops[stops.length - 1], [99.135, 7.49], pier]);
    return segs.map(curve);
  };
  const routes = {};
  for (const boat of ["longtail", "speedboat"]) {
    const names = islandsOf(four, boat).map((i) => i.name);
    routes[boat] = { segs: lane(names), stops: names.map((n) => ({ name: n, x: f(P(at[n])[0]), y: f(P(at[n])[1]) })) };
  }
  const label = (text, pt, dx, dy, anchor = "start", big = false) => ({ text, x: f(P(pt)[0] + dx), y: f(P(pt)[1] + dy), anchor, big });
  const labels = [
    label("Koh Lanta", [99.05, 7.505], 0, 0, "middle", true),
    label("Lanta Old Town", pier, 12, -10),
    label("Koh Chueak", chueak, 12, 18),
    label("Koh Mook", G("muk"), 0, -28, "middle"),
    label("Koh Ngai", G("ngai"), -14, 5, "end"),
    label("Koh Kradan", G("kradan"), -14, 5, "end"),
    label("Koh Ma", G("ma"), 4, -16)
  ];
  // Échelle de 5 km (1° de latitude ≈ 110,6 km).
  const km = (5 / 110.6 / (MAP.lat1 - MAP.lat0)) * H;
  return { W: MAP.W, H, land, routes, labels, pier: { x: f(P(pier)[0]), y: f(P(pier)[1]) }, scale: { x1: f(MAP.W - km - 24), x2: f(MAP.W - 24), y: H - 26, km: 5 } };
}

module.exports = async function () {
  const four = P("tours/4-islands");
  const products = BOATS.map((s) => P("tours/" + s)).concat(ACTIVITIES.map((s) => P("activities/" + s)));
  const boats = await Promise.all(BOATS.map(card));
  const activities = await Promise.all(ACTIVITIES.map(card));
  const bySlug = Object.fromEntries(boats.concat(activities).map((c) => [c.slug, c]));
  const contact = view.contact(site);
  const fee = view.parkFee(four);

  // Catalogue complet (JSON servi à part) et version réduite pour le message d'essai de l'accueil.
  const catalog = {};
  BOATS.forEach((s) => { catalog[s] = catalogEntry(P("tours/" + s), "boat"); });
  ACTIVITIES.forEach((s) => { catalog[s] = catalogEntry(P("activities/" + s), "activity"); });

  // ----- Accueil -----
  const payment = site.booking.payment.map((x) => ({ cash: "in cash", "bank transfer": "by bank transfer" }[x] || x));
  const rentalP = P("rental");
  const rentalCats = rentalP.options.map((o) => {
    const amounts = o.prices.map((r) => r.amount);
    const factLabel = { "cars-and-pick-ups": "Cars", "big-bikes": "Big bikes", "scooters-and-small-bikes": "Scooters" }[o.id];
    const models = (fact(rentalP, factLabel).match(/per day, (.+)$/) || [])[1] || "";
    return {
      id: o.id, label: factLabel, title: o.label, count: o.prices.length, models,
      lo: Math.min(...amounts), hi: Math.max(...amounts),
      lo$: view.thb(Math.min(...amounts)).replace(" THB", ""), hi$: view.thb(Math.max(...amounts)).replace(" THB", ""),
      message: `Rental request: ${o.label}\nVehicle: \nFrom: \nTo: \nName: \nPage: ${host}/`
    };
  }).reverse();
  const taxi = fs.readdirSync(path.join(DATA, "products", "taxi")).map((f) => P("taxi/" + f.replace(/\.json$/, "")))
    .filter((t) => t.route && t.route.from && t.route.to)
    .map((t) => ({ url: t.url, name: t.name, from: t.route.from, to: t.route.to, drive: t.route.drive || "" }));
  const places = [...new Set(taxi.flatMap((t) => [t.from, t.to]))].sort((a, b) => (a === "Koh Lanta" ? -1 : b === "Koh Lanta" ? 1 : a.localeCompare(b)));
  const LIVE = new Set(["/", "/taxi/", "/tours/speedboat/", "/tours/rental/"].concat(taxi.map((t) => t.url)));
  const sampleCfg = { variant: "tour", product: four.name, page: host + four.url, refPrefix: four.refPrefix, options: catalog["4-islands"].options };
  const sample = booking.buildMessage(sampleCfg, { ...booking.emptyState(), option: four.options[0].id, adults: 2, childAges: [] });

  const firstRoute = taxi.find((t) => t.from === "Krabi Airport" && t.to === "Koh Lanta") || taxi[0];
  const homeData = {
    seo: {
      title: "Koh Lanta Boat Trips, Activities and Transfers | Secret Travel & Tour",
      metaDescription: `Boat trips, island activities and transfers on Koh Lanta. 4 Islands from ${bySlug["4-islands"].price.amount}, Koh Rok from ${bySlug["koh-rok-koh-haa"].price.amount}. Book on WhatsApp.`
    },
    h1: home.h1.replace("Koh Lanta", "Koh\u00a0Lanta"),
    // home.json lead sans le comptoir de Sala Dan (décision client) ; réservation WhatsApp et paiement : site.json booking.
    lead: `Koh Rok, Phi Phi and the 4 Islands by boat, the elephant sanctuary, cooking classes and your transfers. You book on ${site.booking.channel}${site.booking.onlinePayment === false ? " and nothing is paid online" : ""}.`,
    // Les trois sorties du haut : photos de leurs cartes, en plus grand (elles ne reparaissent pas plus bas).
    heroTrips: await Promise.all(["4-islands", "koh-rok-koh-haa", "koh-phi-phi"].map(async (s) => ({ ...bySlug[s], photo: await photo(CARD_PHOTO[s]) }))),
    moreBoats: ["koh-talabeng-koh-bubu", "mangroves", "fishing-trip"].map((s) => bySlug[s]),
    activities,
    runs: runs(products),
    transfers: {
      lead: `Private minivans across Southern Thailand are run by ${site.brands.vip.name}. Pick the two ends of your trip.`,
      places, routes: taxi,
      first: { ...firstRoute, drive: cap(firstRoute.drive) },
      ways: home.transfers.items.map((i) => ({ ...i, href: LIVE.has(i.href) ? i.href : "", link: i.href === "/taxi/" ? `See ${site.brands.vip.name}` : i.href === "/tours/speedboat/" ? "See the speedboat timetable" : "" }))
    },
    rental: { title: home.rental.title, text: home.rental.text, href: rentalP.url, cats: rentalCats },
    how: {
      payment: `Pay ${payment.join(" or ")}. Nothing is paid online.`,
      sample, sampleTrip: "4-islands",
      trips: BOATS.concat(ACTIVITIES).map((s) => ({ slug: s, name: catalog[s].name }))
    },
    final: { photo: await photo("home-final"), title: "Not sure which trip?", text: "Send us your dates and who is coming, on WhatsApp.", message: `Hello, we are not sure which trip to choose.\nOur dates: \nWho is coming: \nPage: ${host}/` }
  };

  // ----- 4 Islands -----
  const opts = four.options.map((o) => ({ id: o.id, label: o.label, kind: o.kind, boat: o.boat, note: o.note || "", stub: o.stub || "", pier: o.pier || "", prices: o.prices || [] }));
  const kradan = four.options.map((o) => (o.prices || []).find((r) => r.supplement && /Koh Kradan/.test(r.label))).find(Boolean) || null;
  const adultFrom = price.adultFrom(four.options);
  const group = { adults: 2, ages: [] };
  const groupTotal = (o) => {
    const e = price.estimate(o, group.adults, group.ages, []);
    return e ? { amount: view.thb(e.total), lines: e.lines.map(([l, a]) => ({ label: l, amount: view.thb(a) })) } : null;
  };
  const day = four.day[0];
  // Journée du speedboat join-in : son propre déroulé (brochure du prestataire), heures approximatives.
  const speedDay = four.day.find((b) => (b.options || []).includes("join-in-speedboat"));
  const fourData = {
    product: four,
    seo: {
      title: `4 Islands Tour from Koh Lanta, from ${view.thb(four.price.from)} | Secret Travel & Tour`,
      metaDescription: `Emerald Cave, Koh Ngai and two snorkelling stops, by longtail or speedboat. Join-in from ${view.thb(four.price.from)}, private longtail from ${view.thb(four.options.find((o) => o.kind === "private").prices[0].amount)}, hotel pickup included.`
    },
    h1: four.h1.replace("Koh Lanta", "Koh\u00a0Lanta"),
    lead: four.lead,
    keyFacts: ["Duration", "Hotel pickup", "Boat leaves"].map((l) => ({ label: l, value: fact(four, l) })).filter((f) => f.value),
    price: { amount: view.thb(four.price.from), unit: four.price.unit, option: view.optionOfPrice(four) },
    hero: await photo("four-hero"),
    gallery: await Promise.all(["four-gallery-reef", "four-gallery-ngai", "four-gallery-kradan", "four-gallery-pier"].map(photo)),
    longtail: await photo("four-longtail"),
    boatIntro: four.faq[0].a,
    options: opts.map((o) => ({ ...o, from: R0(o) })),
    route: routeNodes(four, opts[0], false),
    kradan: kradan ? { label: kradan.label, text: `Add Koh Kradan to the private longtail, +${view.thb(kradan.amount)} ${kradan.unit}` } : null,
    calc: { adultFrom, kidMax: adultFrom - 1, default: groupTotal(opts[0]), park: price.parkCash(fee, group.adults, []) },
    compare: {
      cols: opts.map((o) => {
        const islands = islandsOf(four, o.boat).map((i) => i.name).join(", ");
        return {
          id: o.id, label: o.label,
          rows: [
            ["Boat", cap(o.boat)],
            ["On board", o.kind === "private" ? o.note : "A shared boat with other travellers"],
            ["Islands", islands + (o.kind === "private" && kradan ? `, Koh Kradan as an extra (+${view.thb(kradan.amount)} ${kradan.unit})` : "")],
            ["Lunch", `Thai buffet on the beach of ${lunchOf(four, o.boat)}`],
            ["Pier", o.pier || ""]
          ].filter((r) => r[1]),
          prices: (o.prices || []).filter((r) => !(r.supplement && /Koh Kradan/.test(r.label))).map((r) => ({ label: r.label, amount: r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + view.thb(r.amount) })),
          group: groupTotal(o)
        };
      }),
      groupLabel: booking.guestsLine(group.adults, group.ages)
    },
    day: {
      title: "How the day goes",
      longtailTitle: day.title.replace(/^The day, /, "Times for the "),
      note: day.note,
      steps: day.steps.map((s) => ({ t: s.range || s.time, fixed: Boolean(s.fixed), place: s.place, text: dropPlace(s.text, s.place), kind: s.kind })),
      speedboat: speedDay ? speedDay.steps.map((s) => ({ t: s.range || s.time, fixed: Boolean(s.fixed), place: s.place, text: dropPlace(s.text, s.place), kind: s.kind })) : [],
      speedboatTitle: speedDay ? speedDay.title.replace(/^The day, /, "Times for the ") : "",
      speedboatNote: speedDay ? speedDay.note || "" : ""
    },
    map: fourMap(four),
    included: four.included,
    notIncluded: view.notIncluded(four, { skipParkFee: true }),
    parkFee: fee ? `${view.thb(fee.adult)} per adult, ${view.thb(fee.child)} per child${fee.childAges ? ` from ${fee.childAges.min} to ${fee.childAges.max}, free under ${fee.childAges.min}` : ""}, ${fee.thai.adult} and ${view.thb(fee.thai.child)} for Thai nationals. ${fee.note}.` : "",
    beforeBook: view.beforeBook(four, site, { skipParkFee: true }),
    faq: four.faq,
    related: ["koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu"].map((s) => bySlug[s]),
    transfer: (() => {
      const u = (four.related || []).find((x) => x.startsWith("/taxi/"));
      const t = taxi.find((x) => x.url === u);
      return t ? { from: t.from, href: t.url, name: t.name } : null;
    })(),
    booking: { ...view.bookingTour(four, site), tripList: true },
    fallback: view.fallbackText(four, site),
    json: {
      slug: four.slug, name: four.name, adultFrom, fee: fee ? { adult: fee.adult, child: fee.child, childAges: fee.childAges } : null,
      kradan: kradan ? kradan.label : "",
      options: opts.map((o) => ({ id: o.id, label: o.label, kind: o.kind, boat: o.boat, note: o.note, stub: o.stub, pier: o.pier, prices: o.prices })),
      islands: { longtail: islandsOf(four, "longtail"), speedboat: islandsOf(four, "speedboat") },
      lunch: { longtail: lunchOf(four, "longtail"), speedboat: lunchOf(four, "speedboat") }
    }
  };
  function R0(o) {
    const r = (o.prices || []).find((x) => !x.supplement && x.amount);
    if (!r) return "Price on WhatsApp";
    return `${view.thb(r.amount)} ${r.group ? "per boat, " + r.label.toLowerCase() : r.label === "Adult" ? "per adult" : r.label.toLowerCase()}`;
  }

  // ----- Hub -----
  const nBoats = boats.length, nActs = activities.length;
  const hubData = {
    seo: { title: "Boat Trips and Activities from Koh Lanta | Secret Travel & Tour", metaDescription: "All the boat trips and island activities we book on Koh Lanta, with prices: 4 Islands, Koh Rok, Phi Phi, kayak, diving, elephants." },
    h1: "Boat trips and activities on Koh\u00a0Lanta",
    lead: `${cap(WORDS[nBoats])} boat trips and ${WORDS[nActs]} activities, with their prices. Tick up to three to compare them.`,
    final: { photo: await photo("hub-final"), title: "Not sure which trip?", text: "Send us your dates and who is coming, on WhatsApp.", message: homeData.final.message.replace(/Page: .*$/, `Page: ${host}/tours/`) }
  };

  // ----- Pages produit (bateaux et activités sauf la 4 Islands, location, speedboat) -----
  // Photo du haut : celle de la carte de la sortie (photos-v3.json n'en déclare pas d'autre), en plus grand.
  const cardsByUrl = Object.fromEntries(boats.concat(activities).map((c) => [c.href, c]));
  const ctx = { site, schema, cardsByUrl, taxi, live: new Set([...LIVE, ...boats.concat(activities).map((c) => c.href)]) };
  const productPages = [];
  for (const slug of BOATS.concat(ACTIVITIES).filter((x) => x !== "4-islands")) {
    productPages.push(vp.productPage(product(slug), { ...ctx, hero: await photo(CARD_PHOTO[slug]) }));
  }
  const rentalPage = vp.rentalPage(rentalP, ctx);
  const speedboatPage = vp.speedboatPage(P("secret-transfers/speedboat-ferry"), ctx);

  const data = {
    productPages, rentalPage, speedboatPage,
    contact,
    emblem: await view.emblem(44),
    whatsapp: site.whatsapp,
    boats, activities,
    counts: { boats: nBoats, activities: nActs, all: nBoats + nActs },
    catalog,
    home: homeData,
    four: fourData,
    hub: hubData,
    credits: PHOTOS.filter((p) => p.placeholder).map((p) => ({ usage: p.usage, author: p.author, licence: p.licence, url: p.url, source: p.source }))
  };

  // AVIF et WebP, jamais au-delà de la largeur native. Cartes plus petites que les photos du haut.
  await view.responsive([data.boats, data.activities], { widths: [400, 560, 720, 960], avif: 40, webp: 68 });
  await view.responsive([homeData.heroTrips], { widths: [480, 640, 768, 960, 1280, 1600], avif: 45, webp: 68 });
  await view.responsive([homeData.final, hubData.final, fourData.hero, fourData.gallery, fourData.longtail], { widths: [480, 640, 768, 960, 1280, 1600, 2000], avif: 45, webp: 68 });
  await view.responsive(productPages.map((x) => x.hero), { widths: [480, 640, 768, 960, 1280, 1600], avif: 45, webp: 68 });
  return data;
};
