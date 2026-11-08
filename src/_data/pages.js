// Données des pages refaites (étape 3) : trajet Krabi Airport, JSON-LD de l'accueil, de la 4 Islands et du hub, planches /design/.
// Les fiches produit v4 (bateaux, activités, location, speedboat) sont dans v4data.js (components/v4-product.js).
// Tout vient de site.json, home.json et products/** ; ce fichier met en forme avec components/view.js et
// produit les images AVIF/WebP. Les gabarits sont dans src/pages/.
const fs = require("node:fs");
const path = require("node:path");
const view = require("../_includes/components/view.js");
const site = require("./site.json");

const DATA = __dirname;
const P = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, "products", rel + ".json"), "utf8"));
const home = fs.existsSync(path.join(DATA, "home.json")) ? JSON.parse(fs.readFileSync(path.join(DATA, "home.json"), "utf8")) : {};

const BOATS = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu", "fishing-trip", "mangroves"].map((id) => "tours/" + id);
const ACTIVITIES = ["elephant-sanctuary", "atv", "batik", "kayak", "cooking-class", "scuba-diving", "go-kart"].map((id) => "activities/" + id);

// Adresses qui répondent aujourd'hui (pages refaites ou anciennes pages encore en place) : un lien vers une
// page qui n'existe pas encore (/transfers/) n'est pas affiché.
const LIVE = new Set(["/", "/taxi/", "/tours/speedboat/", "/tours/rental/", "/terms/", "/legal/", "/privacy/"]
  .concat(BOATS.concat(ACTIVITIES).map((r) => P(r).url))
  .concat(fs.readdirSync(path.join(DATA, "products", "taxi")).map((f) => P("taxi/" + f.replace(/\.json$/, "")).url)));
const live = (href) => (href && LIVE.has(href.split("#")[0]) ? href : "");

const card = (product) => view.card(product);

// Page produit (excursion bateau ou activité) : ordre de 00-BRIEF §6.2, frais de parc dits une fois (talon).
function productPage(product, related, transfer) {
  const opts = view.options(product);
  return {
    product,
    id: product.slug,
    url: product.url,
    name: product.name,
    seo: product.seo,
    h1: product.h1,
    lead: product.lead,
    price: view.price(product),
    ticket: view.ticket(product),
    options: opts.list,
    days: view.day(product),
    included: product.included || [],
    notIncluded: view.notIncluded(product, { skipParkFee: true }),
    beforeBook: view.beforeBook(product, site, { skipParkFee: true }),
    faq: product.faq || [],
    gallery: view.gallery(product),
    season: view.seasonRuler(product),
    fallback: view.fallbackText(product, site),
    related: related.map((r) => card(P(r))),
    transfer,
    booking: view.bookingTour(product, site),
    photo: (view.heroOf(product).photo || {}).src || ""
  };
}

module.exports = async function () {
  const four = P("tours/4-islands");
  const rental = P("rental");
  const route = P("taxi/krabi-airport-koh-lanta");
  const speedboat = P("secret-transfers/speedboat-ferry");

  const data = {
    contact: view.contact(site),
    emblem: { header: await view.emblem(48), footer: await view.emblem(64), small: await view.emblem(32) },
    who: view.whoRuns(site),
    home: {
      ...home,
      departures: view.departureBoard(speedboat),
      boatCards: BOATS.map((r) => card(P(r))),
      activityCards: ACTIVITIES.map((r) => card(P(r))),
      transfersTitle: (home.transfers || {}).title || "",
      transfers: ((home.transfers || {}).items || []).map((i) => ({ ...i, href: live(i.href) })),
      rentalPrice: view.price(rental)
    },
    fourIslands: productPage(four,
      ["tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/koh-talabeng-koh-bubu"],
      { href: "/taxi/krabi-airport-koh-lanta/", label: "Arriving at Krabi Airport? Private minivan to Koh Lanta" }),
    route: {
      product: route,
      url: route.url,
      name: route.name,
      seo: route.seo,
      h1: route.h1,
      lead: route.lead,
      parts: (() => {
        const parts = view.routeParts(route);
        // Sièges enfant : fait de la marque, mis dans le billet du trajet (00-BRIEF §6.4).
        parts.rows.forEach((r) => { if (r.key === "seats" && !r.value) r.value = site.brands.vip.childSeats; });
        return parts;
      })(),
      faq: route.faq || [],
      fallback: view.fallbackText(route, site),
      hero: view.photo((route.photos || []).find((p) => p.slot === "hero")),
      others: ["koh-lanta-krabi-town", "koh-lanta-ao-nang", "phuket-airport-koh-lanta", "surat-thani-koh-lanta"]
        .map((id) => P("taxi/" + id)).map((r) => ({ href: r.url, from: r.route.from, to: r.route.to, drive: (r.route.drive || "").replace(/(\d) to (\d)/, "$1–$2") })),
      tours: ["tours/4-islands", "tours/koh-rok-koh-haa", "activities/elephant-sanctuary"].map((r) => ({ href: P(r).url, name: P(r).name })),
      // Paiement VIP masqué tant que la question cash ou virement reste ouverte (site.json todo) ;
      // la photo du haut de page n'est pas répétée dans la galerie.
      vehicle: {
        photos: site.brands.vip.photos.filter((p) => p.slot === "gallery" && p.file !== ((route.photos || []).find((x) => x.slot === "hero") || {}).file)
          .map((p) => ({ photo: view.photo(p), slot: "" })).filter((p) => p.photo)
      },
      rating: view.rating(site.brands.vip.rating),
      booking: view.bookingRoute(route, site)
    }
  };
  // Données structurées (components/schema.js, agent SEO) : chaque page reçoit sa liste de JSON-LD.
  const schemaFile = path.join(__dirname, "..", "_includes", "components", "schema.js");
  if (fs.existsSync(schemaFile)) {
    const schema = require(schemaFile);
    const products = BOATS.concat(ACTIVITIES).map(P);
    data.jsonLd = {
      home: schema.home ? schema.home(site, products, { live: LIVE }) : [],
      fourIslands: schema.tour ? schema.tour(four, site) : [],
      route: schema.route ? schema.route(route, site) : [],
      hub: schema.hub ? schema.hub(site, products) : []
    };
  } else data.jsonLd = {};

  // Images Secret en AVIF/WebP, plafonnées à la moitié de leur taille native.
  await view.responsive([data.home, data.fourIslands], { only: (p) => p.src.startsWith("/images/secret/") });
  return data;
};
