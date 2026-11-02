// Planches de composants /design/ et /design/taxi/ : jamais publiées en production (permalink false),
// hors collections et hors sitemap, noindex. Tout le contenu affiché vient de src/_data/site.json et
// src/_data/products/** ; ce fichier ne fait que le mettre en forme avec components/view.js.
const view = require("../_includes/components/view.js");
const site = require("../_data/site.json");

const P = (rel) => require(`../_data/products/${rel}.json`);

// Seules photos autorisées sur la planche (décision du 02.11.2026) ; ailleurs, un emplacement « Photo to supply ».
const ALLOWED = [
  "secret/longtail-crop.webp", "secret/fishing.webp", "secret/atv.webp", "secret/batik.webp",
  "secret/elephant-sanctuary.webp", "secret/lanta-old-town.webp",
  "taxi/van-exterior.webp", "taxi/van-seats.webp", "taxi/van-welcome.webp", "taxi/hero-ceiling-1800.webp"
];

// Ligne de faits d'une carte : trois faits courts au plus, pris dans le bandeau de faits du produit.
const CARD_FACTS = ["Duration", "Boat", "Format", "Season", "Programmes", "Ride"];
function cardFacts(product) {
  return (product.facts || [])
    .filter((f) => CARD_FACTS.includes(f.label) && f.value.length <= 28)
    .slice(0, 3)
    .map((f) => f.value);
}

// La promesse d'une carte reprend l'accroche (lead) du produit, en attendant la réécriture des cartes.
function card(product) {
  return view.card(product, {
    promise: product.lead || "",
    facts: cardFacts(product),
    allowed: ALLOWED
  });
}

const four = P("tours/4-islands");
const fishing = P("tours/fishing-trip");
const route = P("taxi/krabi-airport-koh-lanta");
const vip = site.brands.vip;

const fourOptions = view.options(four);
const firstPrice = four.options[0].prices[0];

module.exports = {
  layout: null,
  eleventyExcludeFromCollections: true,
  eleventyComputed: {
    permalink: (data) => (process.env.CONTEXT === "production" ? false : data.boardPermalink)
  },
  boardContact: view.contact(site),
  board: {
    tour: {
      id: four.slug,
      name: four.name,
      h1: four.h1,
      lead: four.lead,
      price: view.price(four),
      // Bandeau : les faits du brief §6.2 (prix, prise en charge, durée, bateau, formule, saison).
      facts: view.keyFacts(four, ["Hotel pickup", "Duration", "Boat", "Format", "Season"]),
      options: fourOptions.list,
      fees: fourOptions.fees,
      included: four.included,
      notIncluded: four.notIncluded,
      beforeBook: view.beforeBook(four, site),
      faq: four.faq,
      gallery: view.gallery(four, ALLOWED),
      fallback: view.fallbackText(four, site),
      firstPrice: `${firstPrice.label} ${view.thb(firstPrice.amount)}`
    },
    // Le déroulé du 4 Islands contient encore « time to do nothing » (à réécrire) : la planche montre celui de la pêche.
    timeline: view.day(fishing)[0],
    cards: ["tours/4-islands", "tours/fishing-trip", "activities/atv", "activities/elephant-sanctuary", "activities/batik", "activities/kayak"].map((r) => card(P(r))),
    cardNoPhoto: card(P("tours/koh-rok-koh-haa")),
    cardNoPrice: card(P("tours/koh-talabeng-koh-bubu")),
    booking: view.bookingTour(four, site)
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
