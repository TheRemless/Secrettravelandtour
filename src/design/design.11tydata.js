// Planches /design/ : jamais publiées en production (permalink false), hors collections et hors sitemap,
// noindex. Tout le contenu affiché vient de src/_data/site.json et src/_data/products/** ; ce fichier ne fait
// que le mettre en forme avec components/view.js, puis produit les images AVIF/WebP (view.responsive).
const view = require("../_includes/components/view.js");
const site = require("../_data/site.json");

const P = (rel) => require(`../_data/products/${rel}.json`);

// Seules photos autorisées sur les planches (décision du 02.11.2026) ; ailleurs, un emplacement « Photo to supply ».
const ALLOWED = [
  "secret/longtail-4x3.webp", "secret/fishing.webp", "secret/atv.webp", "secret/batik.webp",
  "secret/elephant-sanctuary.webp", "secret/lanta-old-town.webp",
  "taxi/van-exterior.webp", "taxi/van-seats.webp", "taxi/van-welcome.webp", "taxi/hero-ceiling-1800.webp"
];

const card = (product) => view.card(product, { allowed: ALLOWED });

const four = P("tours/4-islands");
const route = P("taxi/krabi-airport-koh-lanta");
const minivan = P("secret-transfers/shared-minivan");
const rental = P("rental");
const vip = site.brands.vip;
const BOATS = ["tours/4-islands", "tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/koh-talabeng-koh-bubu", "tours/fishing-trip", "tours/mangroves"];

// Page 4 Islands complète (/design/4-islands/) : ordre de 00-BRIEF §6.2, frais de parc dits une fois (talon).
function fourIslands() {
  const opts = view.options(four);
  return {
    id: four.slug,
    name: four.name,
    h1: four.h1,
    lead: four.lead,
    price: view.price(four),
    ticket: view.ticket(four),
    options: opts.list,
    day: view.day(four)[0],
    included: four.included,
    notIncluded: view.notIncluded(four, { skipParkFee: true }),
    beforeBook: view.beforeBook(four, site, { skipParkFee: true }),
    faq: four.faq,
    gallery: view.gallery(four, ALLOWED),
    fallback: view.fallbackText(four, site),
    related: ["tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/koh-talabeng-koh-bubu"].map((r) => card(P(r))),
    transfer: { href: "/taxi/krabi-airport-koh-lanta/", label: "Arriving at Krabi Airport? Private minivan to Koh Lanta" },
    booking: view.bookingTour({ ...four, refPrefix: "4IS" }, site)
  };
}

// Page transfert en habillage Secret (/design/transfer/) : feuille en version transfert, départ et arrivée libres.
function transfer() {
  return {
    name: minivan.name,
    h1: minivan.h1,
    lead: minivan.lead,
    facts: minivan.facts,
    options: view.options(minivan).list,
    fallback: view.fallbackText(minivan, site),
    booking: view.bookingRoute({ ...minivan, route: {} }, site, {
      refPrefix: "TRF",
      options: view.options(minivan).list.map((o) => ({ id: o.id, title: o.title, rows: [], from: "", unit: "" }))
    })
  };
}

module.exports = async function () {
  // En production, les planches ne sont pas publiées : aucune donnée ni image à produire.
  if (process.env.CONTEXT === "production") return { layout: null, eleventyExcludeFromCollections: true, permalink: false };
  const data = {
    layout: null,
    eleventyExcludeFromCollections: true,
    eleventyComputed: {
      permalink: (d) => (process.env.CONTEXT === "production" ? false : d.boardPermalink)
    },
    boardContact: view.contact(site),
    emblem: { header: await view.emblem(48), mobile: await view.emblem(40), footer: await view.emblem(64), small: await view.emblem(32) },
    page: fourIslands(),
    transferPage: transfer(),
    board: {
      cards: ["tours/4-islands", "tours/fishing-trip", "activities/atv", "activities/elephant-sanctuary", "activities/batik", "activities/kayak"].map((r) => card(P(r))),
      cardNoPhoto: card(P("tours/koh-rok-koh-haa")),
      cardNoPrice: card(P("tours/koh-talabeng-koh-bubu")),
      departures: view.departures(BOATS.map(P)),
      seasonKohRok: view.seasonRuler(P("tours/koh-rok-koh-haa")),
      seasonFour: view.seasonRuler(four),
      routeParts: view.routeParts(route),
      rental: view.rentalTable(rental),
      who: view.whoRuns(site)
    },
    taxiBoard: {
      route: {
        name: route.name,
        from: route.route.from,
        to: route.route.to,
        code: route.route.code,
        h1: route.h1,
        lead: route.lead,
        facts: route.facts,
        faq: route.faq,
        fallback: view.fallbackText(route, site)
      },
      routeCards: ["krabi-airport-koh-lanta", "koh-lanta-krabi-town", "koh-lanta-ao-nang", "phuket-airport-koh-lanta", "surat-thani-koh-lanta", "koh-lanta-trang"]
        .map((id) => P(`taxi/${id}`))
        .map((r) => ({ href: r.url, from: r.route.from, to: r.route.to, drive: r.route.drive || "" })),
      // brands.vip.vehicles est une note interne : pas affichée telle quelle.
      vehicle: {
        childSeats: vip.childSeats,
        payment: vip.payment,
        photos: vip.photos.filter((p) => p.slot === "gallery").map((p) => ({ photo: view.photo(p, ALLOWED), slot: view.slot(p) }))
          .concat(vip.photos.filter((p) => p.status === "missing").map((p) => ({ photo: null, slot: view.slot(p) })))
      },
      hero: view.photo(vip.photos.find((p) => p.slot === "hero"), ALLOWED),
      rating: view.rating(vip.rating),
      secret: site.brands.secret,
      vip,
      booking: view.bookingRoute(route, site)
    }
  };
  // Images Secret en AVIF/WebP (les pages VIP gardent leur propre traitement).
  await view.responsive([data.page, data.board], { only: (p) => p.src.startsWith("/images/secret/") });
  return data;
};
