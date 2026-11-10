// Données des pages du design v4 (accueil, 4 Islands, hub /tours/, /_components/, /credits/).
// Base : prototype « mouvement » (docs/refonte/design-v4/propositions/mouvement/), plus trois ajouts : liste de
// sorties, comparateur des bateaux, carte du trajet (« What runs on … » retiré de l'accueil, client, 09.11.2026).
// Faits, prix, horaires, saisons : src/_data/products/** et site.json, lus ici et nulle part ailleurs.
// Photos : src/_data/photos-v3.json (une entrée = un usage). Contours des îles : © OpenStreetMap contributors (ODbL).
const fs = require("node:fs");
const path = require("node:path");
const view = require("../_includes/components/view.js");
const booking = require("../js/booking.js");
const site = require("./site.json");
const vp = require("../_includes/components/v4-product.js");
const schema = require("../_includes/components/schema.js");

const DATA = __dirname;
const IMAGES = path.join(DATA, "..", "images");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, "products", rel + ".json"), "utf8"));
const home = JSON.parse(fs.readFileSync(path.join(DATA, "home.json"), "utf8"));
const PHOTOS = JSON.parse(fs.readFileSync(path.join(DATA, "photos-v3.json"), "utf8")).photos;

const BOATS = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "mangroves", "fishing-trip"];
const ACTIVITIES = ["elephant-sanctuary", "kayak", "cooking-class", "scuba-diving", "atv", "batik", "go-kart"];
const CARD_PHOTO = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  mangroves: "card-mangroves", "fishing-trip": "card-fishing",
  "scuba-diving": "card-scuba", atv: "card-atv", kayak: "card-kayak", "elephant-sanctuary": "card-elephant",
  "cooking-class": "card-cooking", batik: "card-batik", "go-kart": "card-go-kart"
};
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];

const fact = (p, label) => ((p.facts || []).find((f) => f.label === label) || {}).value || "";
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");
const host = site.url.replace(/^https?:\/\//, "");

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

// Deux faits courts lus tels quels, toujours dans le même ordre (durée, puis bateau, saison ou format) ; « All year »
// n'apprend rien sur une carte, ni un fait déjà dit par la promesse. Des heures de séance (« 09:00, 12:00 and 15:00 »)
// restent sur la fiche : une carte dit combien de temps, pas à quelle heure.
function cardMeta(p) {
  const promise = (p.promise || "").toLowerCase().replace(/\bhalf a day\b/g, "half day");
  return ["Duration", "Boat", "Season", "Sessions"].map((l) => fact(p, l))
    .filter((v) => v && v !== "All year" && v.length <= 40 && !/\d{2}:\d{2}/.test(v) && !promise.includes(v.toLowerCase())).slice(0, 2);
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
  const book = vp.bookingOf(p, site);
  const compare = [["Price", view.price(p) ? `from ${view.price(p).amount}, ${p.price.unit}` : "Price on WhatsApp"]]
    .concat(["Duration", "Season", "Hotel pickup", "Boat", "Crossing", "Sessions", "Children", "Ages", "National park fee", "Village entrance fee"]
      .map((l) => [l, fact(p, l)]).filter((r) => r[1]))
    .concat([["Options", opts.map((o) => o.title).join(", ")], ["Included", (p.included || []).slice(0, 4).join(", ")]].filter((r) => r[1]));
  return {
    slug: p.slug, kind, name: p.name, url: p.url, page: host + p.url, refPrefix: p.refPrefix || "",
    fullDay: fact(p, "Duration") === "Full day",
    season: view.seasonMonths(p) && fact(p, "Season") !== "All year" ? { text: fact(p, "Season"), months: view.seasonMonths(p) } : null,
    from: view.price(p) ? view.price(p).amount : "",
    // Sous-variantes (créneau, cours, karts…) : la liste de sorties les fait choisir comme la feuille. Lignes de prix
    // brutes et frais en espèces de chaque option (vp.bookingOf) : la liste calcule le même total estimé que la feuille.
    parkFee: book.parkFee || null,
    options: opts.filter((o) => ((p.options || []).find((x) => x.id === o.id) || {}).kind !== "extra")
      .map((o) => {
        const b = book.options.find((x) => x.id === o.id) || {};
        return { id: o.id, title: o.title, rows: o.rows, ...vp.formOf(p, (p.options || []).find((x) => x.id === o.id) || {}),
          prices: b.prices || [], ...(b.priceOnRequest ? { priceOnRequest: true } : {}), ...("cash" in b ? { cash: b.cash } : {}), ...(b.feesToConfirm ? { feesToConfirm: true } : {}), ...("people" in b ? { people: b.people } : {}) };
      }),
    compare
  };
}

// ---------- 4 Islands : parcours, comparateur, journée, carte ----------
// Bateaux de la 4 Islands, dans l'ordre des options (longtail, speedboat, catamaran d'Ao Nang).
const boatsOf = (four) => [...new Set(four.options.map((o) => o.boat))];
function islandsOf(four, boat) {
  return fact(four, "Islands, " + boat).split(", ").map((raw) => {
    const m = raw.match(/^(.*?) \((.*)\)$/);
    return { name: m ? m[1] : raw, tag: m ? m[2] : "" };
  });
}
// Île du déjeuner : le fait « Lunch » (longtail, speedboat) ou le déjeuner écrit dans l'option (catamaran).
function lunchOf(four, boat) {
  const own = four.options.find((o) => o.boat === boat && o.lunch);
  if (own) return (own.lunch.match(/Koh \w+/) || [])[0] || "";
  return (fact(four, "Lunch").match(new RegExp("(Koh \\w+) by " + boat)) || [])[1] || "";
}

// Projection équirectangulaire corrigée de la latitude : un schéma, pas une carte marine.
// Cadre élargi le 10.11.2026 : Koh Lanta Yai et Koh Lanta Noi entières (Jérémy trouvait l'île coupée en haut).
const MAP = { lon0: 98.93, lon1: 99.42, lat0: 7.285, lat1: 7.705, W: 640 };
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
  // Le catamaran vient d'Ao Nang, au nord, hors du cadre : il entre et sort par le haut de la carte, par le chenal
  // à l'est de Koh Lanta (tracé de la brochure).
  const north = [99.185, MAP.lat1];
  // Speedboat join-in parti de Koh Lanta Noi (une option dont le ponton cite Lanta Noi) : le tracé entre par le haut,
  // sous l'étiquette « To Koh Lanta Noi pier ». Depuis le 10.11.2026, le speedboat 4 Islands part de Lanta Old Town.
  const noi = [99.155, MAP.lat1];
  // Premier tronçon par l'est de Koh Ma, pour qu'il ne passe pas sur Koh Ma avant Koh Chueak.
  const lane = (names, start) => {
    const stops = names.map((n) => at[n]);
    // Départ par le haut du cadre (Ao Nang, Lanta Noi) : aller et retour à l'est de Koh Talabeng et de Koh Bubu.
    const top = start[1] === MAP.lat1;
    const segs = [[start, ...(top ? [[99.18, 7.6]] : []), [99.2, 7.47], [99.25, 7.43], stops[0]]];
    for (let i = 1; i < stops.length; i++) segs.push([stops[i - 1], stops[i]]);
    segs.push([stops[stops.length - 1], ...(top ? [[99.165, 7.5], [99.168, 7.6]] : [[99.135, 7.49]]), start]);
    return segs.map(curve);
  };
  const routes = {};
  for (const boat of boatsOf(four)) {
    const names = islandsOf(four, boat).map((i) => i.name);
    const away = four.options.some((o) => o.boat === boat && o.from);
    const fromNoi = !away && four.options.some((o) => o.boat === boat && /Lanta Noi/.test(o.pier || ""));
    const start = away ? north : fromNoi ? noi : pier;
    routes[boat] = { segs: lane(names, start), stops: names.map((n) => ({ name: n, x: f(P(at[n])[0]), y: f(P(at[n])[1]) })), start: { x: f(P(start)[0]), y: f(P(start)[1]) }, away, noi: fromNoi };
  }
  const label = (text, pt, dx, dy, anchor = "start", big = false) => ({ text, x: f(P(pt)[0] + dx), y: f(P(pt)[1] + dy), anchor, big });
  const labels = [
    label("Koh Lanta", [99.05, 7.505], 0, 0, "middle", true),
    label("Lanta Old Town", pier, 12, -10),
    label("Koh Chueak", chueak, -8, 26, "end"),
    label("Koh Mook", G("muk"), 0, -28, "middle"),
    label("Koh Ngai", G("ngai"), -14, 5, "end"),
    label("Koh Kradan", G("kradan"), -14, 5, "end"),
    label("Koh Ma", G("ma"), 8, -14)
  ].concat(Object.values(routes).some((r) => r.away) ? [{ ...label("To Ao Nang", north, 8, 18), gone: true }] : [])
    .concat(Object.values(routes).some((r) => r.noi) ? [{ ...label("To Koh Lanta Noi pier", noi, -8, 18, "end"), gone: true }] : []);
  // Échelle de 5 km (1° de latitude ≈ 110,6 km).
  const km = (5 / 110.6 / (MAP.lat1 - MAP.lat0)) * H;
  return { W: MAP.W, H, land, routes, labels, pier: { x: f(P(pier)[0]), y: f(P(pier)[1]) }, scale: { x1: f(MAP.W - km - 24), x2: f(MAP.W - 24), y: H - 26, km: 5 } };
}

module.exports = async function () {
  const four = P("tours/4-islands");
  const boats = await Promise.all(BOATS.map(card));
  const activities = await Promise.all(ACTIVITIES.map(card));
  const bySlug = Object.fromEntries(boats.concat(activities).map((c) => [c.slug, c]));
  const contact = view.contact(site);

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
    const models = (fact(rentalP, factLabel).match(/per (?:day|24 hours), (.+)$/) || [])[1] || "";
    return {
      id: o.id, label: factLabel, title: o.label, count: o.prices.length, models,
      lo: Math.min(...amounts), hi: Math.max(...amounts),
      lo$: view.thb(Math.min(...amounts)).replace(" THB", ""), hi$: view.thb(Math.max(...amounts)).replace(" THB", ""),
      message: `Rental request: ${o.label}\nVehicle: \nFrom: \nTo: \nName: `
    };
  }).reverse();
  const taxi = fs.readdirSync(path.join(DATA, "products", "taxi")).map((f) => P("taxi/" + f.replace(/\.json$/, "")))
    .filter((t) => t.route && t.route.from && t.route.to)
    .map((t) => ({ url: t.url, name: t.name, from: t.route.from, to: t.route.to, drive: t.route.drive || "" }));
  const LIVE = new Set(["/", "/taxi/", "/tours/speedboat/", "/tours/rental/"].concat(taxi.map((t) => t.url)));
  // Unité de la location : « per 24 hours », celle des lignes de prix (réponse du client), dite une seule fois.
  const rentalUnit = rentalP.options[0].prices[0].unit;

  // Les trois trajets les plus demandés vers ou depuis Koh Lanta (aéroports de Krabi et de Phuket, Ao Nang).
  const MAIN_ROUTES = ["/taxi/krabi-airport-koh-lanta/", "/taxi/phuket-airport-koh-lanta/", "/taxi/koh-lanta-ao-nang/"];
  const vehFact = (label) => fact(rentalP, label);
  const homeData = {
    seo: {
      title: "Secret Travel & Tour | Koh Lanta Trips and Transfers",
      metaDescription: `Boat trips, island activities and transfers on Koh Lanta. 4 Islands from ${bySlug["4-islands"].price.amount}, Koh Rok from ${bySlug["koh-rok-koh-haa"].price.amount}. Book on WhatsApp.`
    },
    h1: home.h1.replace("Koh Lanta", "Koh\u00a0Lanta"),
    // Une phrase : le comment (site.json booking). Le quoi est dans le titre et dans les trois sorties juste dessous.
    lead: `You book on ${site.booking.channel}.`,
    // Les trois sorties du haut : photos de leurs cartes, en plus grand (elles ne reparaissent pas plus bas).
    heroTrips: await Promise.all(["4-islands", "koh-rok-koh-haa", "koh-phi-phi"].map(async (s) => ({ ...bySlug[s], photo: await photo(CARD_PHOTO[s]) }))),
    // Toutes les sorties en bateau en bande, comme les activités (demande de Jérémy du 10.11.2026).
    boats,
    activities,
    // Transferts et location réunis : trois trajets en liens, le speedboat, puis les trois fourchettes de la location.
    around: {
      transfers: {
        lead: `Private minivans for your group only, run by ${site.brands.vip.name}.`,
        vip: site.brands.vip.name,
        routes: MAIN_ROUTES.map((u) => taxi.find((t) => t.url === u)).filter(Boolean).map((t) => ({ href: t.url, name: t.name, drive: cap(t.drive) })),
        // Le texte de home.json sans sa dernière phrase (la prise en charge est dite sur la page du speedboat).
        speedboat: LIVE.has("/tours/speedboat/") ? (({ title, text }) => ({ href: "/tours/speedboat/", title, text: text.split(". ")[0].replace(/, on the [^,]*$/, "") }))(home.transfers.items.find((i) => i.href === "/tours/speedboat/")) : null
      },
      rental: {
        title: "Scooter and car rental", href: rentalP.url, unit: rentalUnit,
        cats: rentalCats.map((k) => ({ label: k.label, lo: k.lo$, hi: k.hi$, models: k.models }))
      }
    },
    final: { photo: await photo("home-final"), title: "Still deciding?", text: "Tell us your dates and a little about your group: ages, what you enjoy, how much time you have. We'll suggest the trips that suit you best.", message: `Hello, we are not sure which trip to choose.\nOur dates: \nWho is coming: ` }
  };

  // ----- 4 Islands -----
  const opts = four.options.map((o) => ({ id: o.id, label: o.label, kind: o.kind, boat: o.boat, note: o.note || "", stub: o.stub || "", pier: o.pier || "", from: o.from || "", onBoard: o.onBoard || "", lunch: o.lunch || "", feesToConfirm: Boolean(o.feesToConfirm), prices: o.prices || [] }));
  const day = four.day[0];
  // Journée de chaque autre bateau (speedboat join-in, catamaran d'Ao Nang) : son propre déroulé, heures approximatives.
  const stepsOf = (b) => b.steps.map((s) => ({ t: s.range || s.time, fixed: Boolean(s.fixed), place: s.place, text: dropPlace(s.text, s.place), kind: s.kind }));
  const dayOf = (boat) => {
    const ids = four.options.filter((o) => o.boat === boat).map((o) => o.id);
    const b = boat === "longtail" ? day : four.day.find((x) => (x.options || []).some((id) => ids.includes(id)));
    return b ? { boat, title: b.title.replace(/^The day, /, "Times for the "), note: b.note || "", steps: stepsOf(b) } : null;
  };
  const fourData = {
    product: four,
    seo: {
      title: "4 Islands Tour from Koh Lanta | Secret Travel & Tour",
      metaDescription: `Emerald Cave, Koh Ngai and two snorkelling stops, by longtail or speedboat. Join-in from ${view.thb(four.price.from)}, private longtail from ${view.thb(four.options.find((o) => o.kind === "private").prices[0].amount)}, hotel pickup included.`
    },
    hero: await photo("four-hero"),
    gallery: await Promise.all(["four-gallery-reef", "four-gallery-ngai", "four-longtail", "four-gallery-kradan", "four-gallery-pier"].map(photo)),
    day: {
      title: "How the day goes",
      note: day.note,
      boats: boatsOf(four).map(dayOf).filter(Boolean)
    },
    map: fourMap(four),
    // Données du script de la page (v4-four.js) : bateau de chaque option, îles et île du déjeuner, pour la journée et la carte.
    json: {
      slug: four.slug,
      options: opts.map((o) => ({ id: o.id, boat: o.boat })),
      islands: Object.fromEntries(boatsOf(four).map((b) => [b, islandsOf(four, b)])),
      lunch: Object.fromEntries(boatsOf(four).map((b) => [b, lunchOf(four, b)]))
    }
  };

  // ----- Hub -----
  const nBoats = boats.length, nActs = activities.length;
  const hubData = {
    seo: { title: "Koh Lanta Boat Trips and Activities | Secret Travel & Tour", metaDescription: "All the boat trips and island activities we book on Koh Lanta, with prices: 4 Islands, Koh Rok, Phi Phi, kayak, diving, elephants." },
    h1: "Boat trips and activities on Koh\u00a0Lanta",
    lead: `Each trip with its price. You book on ${site.booking.channel}.`,
    final: { photo: await photo("hub-final"), title: "Still deciding?", text: "Tell us your dates and a little about your group: ages, what you enjoy, how much time you have. We'll suggest the trips that suit you best.", message: homeData.final.message }
  };

  // ----- Pages produit (bateaux et activités sauf la 4 Islands, location, speedboat) -----
  // Photo du haut : celle de la carte de la sortie (photos-v3.json n'en déclare pas d'autre), en plus grand.
  const cardsByUrl = Object.fromEntries(boats.concat(activities).map((c) => [c.href, c]));
  const ctx = { site, schema, cardsByUrl, taxi, live: new Set([...LIVE, ...boats.concat(activities).map((c) => c.href)]) };
  const productPages = [];
  for (const slug of BOATS.concat(ACTIVITIES).filter((x) => x !== "4-islands")) {
    productPages.push(vp.productPage(product(slug), { ...ctx, hero: await photo(CARD_PHOTO[slug]) }));
  }
  // 4 Islands : même gabarit de fiche, bloc « Choose your boat » ; la ligne de chaque bateau dit l'île qui change et
  // l'île du déjeuner, son détail le ponton (et ce que la brochure du catamaran dit du bord et du déjeuner).
  {
    const sets = boatsOf(four).map((b) => islandsOf(four, b).map((i) => i.name));
    const shared = sets[0].filter((n) => sets.every((l) => l.includes(n)));
    const help = vp.helpOf(four);
    const page = vp.productPage(four, { ...ctx, hero: fourData.hero });
    page.pick = vp.pickOf(four, site, {
      title: "Choose your boat", help: help ? help.a : "",
      sub: (o) => {
        const own = islandsOf(four, o.boat).map((i) => i.name).filter((n) => !shared.includes(n));
        const lunch = lunchOf(four, o.boat);
        return cap([own.length ? "with " + own.join(" and ") : "", lunch ? "lunch on " + lunch : ""].filter(Boolean).join(", "));
      },
      facts: (o) => [["Pier", o.pier || ""], ["On board", o.onBoard || ""], ["Lunch", o.lunch || ""]].filter((r) => r[1])
    });
    page.single = page.pick.sel;
    Object.assign(fourData, { page, booking: page.booking });
    // Accueil : le message d'exemple est celui que la feuille de la 4 Islands écrit pour son prix d'appel (join-in
    // longtail, 2 adultes), total estimé compris. Ni date ni référence : l'exemple ne vieillit pas.
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
  await view.responsive([homeData.final, hubData.final, fourData.hero, fourData.gallery], { widths: [480, 640, 768, 960, 1280, 1600, 2000], avif: 45, webp: 68 });
  await view.responsive(productPages.map((x) => x.hero), { widths: [480, 640, 768, 960, 1280, 1600], avif: 45, webp: 68 });
  return data;
};
