// JSON-LD des pages refaites (accueil, excursion bateau, activité, location, trajet VIP Taxi Lanta).
// Module pur : il ne lit aucun fichier, il reçoit site.json et les données produit et rend un tableau
// d'objets prêts pour <script type="application/ld+json"> (un objet par balise, chacun avec @context).
//
// Décisions déjà prises, vérifiées par tests/schema.test.js :
// - aucun prix (ni price, ni priceCurrency, ni priceRange) : l'Offer ne porte que url et availability ;
// - aucune note, aucun avis (AggregateRating déclaré par l'entreprise proscrit, 02-audit-seo §6.3) ;
// - jamais TouristAttraction ; pas de nom de prestataire, d'e-mail, de réseau social, d'horaires ;
// - licence absente tant que site.brands.secret.licence vaut null ;
// - VIP Taxi Lanta : pas de téléphone (le formulaire est le canal unique, comme l'ancien /taxi/) et
//   une adresse réduite à la localité, la région et le pays ;
// - un fait absent des données = propriété absente ; image seulement pour une photo « keep » ;
// - description = product.lead (la meta description cite des prix « from … THB », hors JSON-LD).

const CONTEXT = "https://schema.org";
const IN_STOCK = "https://schema.org/InStock";

const { groupOf } = require("./groups.js");
// Groupe de la vignette (Islands, Mangroves, On land) quand la fiche en a un, sinon la section du gabarit.
const sectionOf = (product, fallback) => { const g = groupOf(product.slug); return g ? { name: g.nav, path: "/tours/#" + g.hash } : fallback; };
// Fil d'Ariane : niveau 2 par gabarit, vers des adresses qui existent (hub /tours/ et ses sections, /taxi/).
// Mêmes adresses que le fil visible des pages v4 (08.11.2026 : sections du hub, plus les ancres de l'accueil).
// La location n'a pas de rubrique parente distincte (elle est elle-même la rubrique « Rental » du menu) :
// fil sur 2 niveaux, Accueil > page.
const SECTIONS = {
  boat: { name: "Boat trips", path: "/tours/#boat-trips" },
  activity: { name: "Activities", path: "/tours/#activities" },
  route: { name: null, path: "/taxi/" } // nom : celui de la marque VIP (site.brands.vip.name)
};

// Rubriques du catalogue de l'accueil, dans l'ordre du menu.
const CATALOG = [
  { template: "boat", name: "Boat trips" },
  { template: "activity", name: "Island activities" },
  { template: "transfer", name: "Transfers" },
  { template: "rental", name: "Car and scooter rental" }
];

const ANCHOR = { TouristTrip: "trip", Service: "service", TaxiService: "service", Course: "course" };

// ---------- utilitaires ----------

// Retire récursivement undefined, null, chaînes vides, tableaux et objets vides.
function clean(value) {
  if (Array.isArray(value)) {
    const out = value.map(clean).filter((v) => v !== undefined);
    return out.length ? out : undefined;
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    }
    // Un objet réduit à son @type (ou vide) ne dit rien.
    const keys = Object.keys(out).filter((k) => k !== "@type");
    return keys.length ? out : undefined;
  }
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

function block(obj) {
  return clean({ "@context": CONTEXT, ...obj });
}

const origin = (site) => String(site.url || "").replace(/\/+$/, "");
const abs = (site, p) => (p ? (/^https?:\/\//.test(p) ? p : origin(site) + (p.startsWith("/") ? p : "/" + p)) : undefined);

const ids = (site) => ({
  agency: `${origin(site)}/#agency`,
  website: `${origin(site)}/#website`,
  operator: `${origin(site)}/#operator`,
  vip: `${origin(site)}/taxi/#vip`
});

// Photo d'un emplacement, en URL absolue, seulement si elle est gardée telle quelle.
function photoUrl(site, photos, slot) {
  const entry = (photos || []).find((p) => p.slot === slot);
  if (!entry || entry.status !== "keep" || !entry.file) return undefined;
  return abs(site, `/images/${entry.file}`);
}

// Type Schema.org de l'entité principale d'une page produit. TouristAttraction est proscrit (lieu, pas prestation).
function typeOf(product) {
  const t = (product.schema && product.schema.type) || defaultType(product.template);
  return t === "TouristAttraction" ? "TouristTrip" : t;
}
function defaultType(template) {
  return { boat: "TouristTrip", activity: "TouristTrip", rental: "Service", transfer: "Service", route: "TaxiService" }[template] || "Service";
}

// @id stable de l'entité principale d'une page produit (réutilisé par le catalogue de l'accueil).
function mainId(product, site) {
  return `${abs(site, product.url)}#${ANCHOR[typeOf(product)] || "item"}`;
}

const place = (name) => ({ "@type": "Place", name });

function offer(site, product) {
  // Pas de prix sur les fiches (décision de Jérémy) : l'offre dit où demander et que c'est disponible.
  const o = { "@type": "Offer", url: abs(site, product.url), availability: IN_STOCK };
  // Taxi (10.11.2026) : prix d'appel de la grille VIP Taxi Lanta, seulement s'il n'est pas « environ ».
  const f = product.priceFrom;
  if (f && f.thb && !f.approx) o.priceSpecification = { "@type": "PriceSpecification", minPrice: f.thb, priceCurrency: "THB" };
  return o;
}

function itinerary(places) {
  if (!places || !places.length) return undefined;
  return {
    "@type": "ItemList",
    itemListElement: places.map((name, i) => ({ "@type": "ListItem", position: i + 1, item: place(name) }))
  };
}

// Nœud compact de l'agence, pour `provider` sur les pages produit : même @id que sur l'accueil.
function agencyRef(site) {
  const b = site.brands.secret;
  return { "@type": "TravelAgency", "@id": ids(site).agency, name: b.name, url: abs(site, b.url) };
}

// `root` : la page de VIP Taxi Lanta commence son fil à /taxi/, pas à l'accueil de Secret (marque à part, Q1).
function breadcrumb(site, product, section, root = { name: "Home", path: "/" }) {
  const url = abs(site, product.url);
  const items = [{ name: root.name, item: abs(site, root.path) }];
  if (section) items.push({ name: section.name, item: abs(site, section.path) });
  items.push({ name: product.name, item: url });
  return block({
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.item }))
  });
}

// FAQPage uniquement à partir des questions propres à la page, et seulement s'il y en a.
function faqPage(site, product) {
  const faq = (product.faq || []).filter((f) => f && f.q && f.a);
  if (!faq.length) return undefined;
  return block({
    "@type": "FAQPage",
    "@id": `${abs(site, product.url)}#faq`,
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
  });
}

// Entité principale commune aux pages Secret (excursion, activité, location).
function secretMain(product, site, extra) {
  const type = typeOf(product);
  return block({
    "@type": type,
    "@id": mainId(product, site),
    name: product.h1 || product.name,
    description: product.lead,
    url: abs(site, product.url),
    image: photoUrl(site, product.photos, "hero"),
    provider: agencyRef(site),
    ...extra(type),
    offers: offer(site, product)
  });
}

const pageBlocks = (...blocks) => blocks.filter(Boolean);

// ---------- pages ----------

// Accueil : l'agence (TravelAgency, @id …/#agency), le site (WebSite) et le catalogue des prestations Secret.
// `products` : l'objet global Eleventy `products` (tours, activities, rental, secret-transfers, taxi) ou un tableau.
// `options.live` (facultatif) : adresses qui répondent aujourd'hui ; un produit dont l'URL n'y est pas reste
// hors du catalogue (ex. /transfers/ tant que la page n'existe pas).
function home(site, products, options = {}) {
  const b = site.brands.secret;
  const id = ids(site);
  const op = site.operator || {};
  const isLive = liveFilter(options.live);
  const list = flatten(products).filter((p) => p.brand === "secret" && isLive(p.url));

  const catalog = CATALOG.map((section) => {
    const items = list.filter((p) => p.template === section.template);
    return {
      "@type": "OfferCatalog",
      name: section.name,
      itemListElement: items.map((p) => ({
        "@type": "Offer",
        url: abs(site, p.url),
        availability: IN_STOCK,
        itemOffered: {
          "@type": typeOf(p),
          "@id": mainId(p, site),
          name: p.name,
          url: abs(site, p.url),
          serviceType: p.schema && p.schema.serviceType,
          areaServed: p.schema && p.schema.areaServed ? p.schema.areaServed.map(place) : undefined
        }
      }))
    };
  });

  const agency = block({
    "@type": "TravelAgency",
    "@id": id.agency,
    name: b.name,
    url: abs(site, b.url),
    logo: photoUrl(site, b.photos, "logo"),
    image: photoUrl(site, b.photos, "office"),
    telephone: b.phone,
    address: b.address && {
      "@type": "PostalAddress",
      streetAddress: b.address.street,
      addressLocality: b.address.locality,
      addressRegion: b.address.region,
      postalCode: b.address.postalCode,
      addressCountry: b.address.country
    },
    geo: b.geo && { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng },
    hasMap: b.maps,
    sameAs: [b.maps].concat(b.social || []).filter(Boolean),
    email: b.email || undefined,
    foundingDate: b.opened ? String(b.opened) : undefined,
    paymentAccepted: (site.booking && site.booking.payment || []).map(cap).join(", "),
    // Licence TAT : seulement quand elle existe (null aujourd'hui).
    hasCredential: b.licence ? { "@type": "EducationalOccupationalCredential", credentialCategory: "licence", name: String(b.licence) } : undefined,
    parentOrganization: op.name && {
      "@type": "Organization",
      "@id": id.operator,
      name: op.name,
      address: op.address,
      identifier: op.registration && { "@type": "PropertyValue", propertyID: "Thai company registration number", value: op.registration }
    },
    hasOfferCatalog: { "@type": "OfferCatalog", name: b.name, itemListElement: catalog }
  });

  const website = block({
    "@type": "WebSite",
    "@id": id.website,
    name: b.name,
    url: abs(site, "/"),
    inLanguage: site.language,
    publisher: { "@id": id.agency }
  });

  return pageBlocks(agency, website);
}

// Excursion en bateau : TouristTrip avec l'itinéraire des îles (product.schema.places).
function tour(product, site) {
  const main = secretMain(product, site, () => ({ itinerary: itinerary(product.schema && product.schema.places) }));
  return pageBlocks(main, breadcrumb(site, product, sectionOf(product, SECTIONS.boat)), faqPage(site, product));
}

// Activité : type de product.schema.type (TouristTrip par défaut, Course pour le cours de cuisine).
function activity(product, site) {
  const places = product.schema && product.schema.places;
  const main = secretMain(product, site, (type) => {
    if (type === "TouristTrip") return { itinerary: itinerary(places) };
    if (type === "Course") return { location: places && places.length ? places.map(place) : undefined };
    return { areaServed: places && places.length ? places.map(place) : undefined };
  });
  return pageBlocks(main, breadcrumb(site, product, sectionOf(product, SECTIONS.activity)), faqPage(site, product));
}

// Location : Service + catalogue des véhicules (noms seulement, aucun tarif).
function rental(product, site) {
  const s = product.schema || {};
  const url = abs(site, product.url);
  const catalog = (product.options || []).map((o) => ({
    "@type": "OfferCatalog",
    name: o.label,
    itemListElement: (o.prices || []).filter((p) => p.label).map((p) => ({ "@type": "Offer", name: p.label, url, availability: IN_STOCK }))
  }));
  const main = secretMain(product, site, () => ({
    serviceType: s.serviceType || product.name,
    areaServed: (s.areaServed || s.places || []).map(place),
    hasOfferCatalog: catalog.length ? { "@type": "OfferCatalog", name: product.name, itemListElement: catalog } : undefined
  }));
  return pageBlocks(main, breadcrumb(site, product, null), faqPage(site, product));
}

// Speedboat (et futurs transferts Secret) : Service, zones desservies lues dans schema.places, fil sur 2 niveaux.
function transfer(product, site) {
  const s = product.schema || {};
  const main = secretMain(product, site, () => ({
    serviceType: s.serviceType || product.name,
    areaServed: (s.areaServed || s.places || []).map(place)
  }));
  return pageBlocks(main, breadcrumb(site, product, null), faqPage(site, product));
}

// Page d'orientation /transfers/ : le minivan partagé de Secret (Service sans offre : aucun prix sur le site), la liste
// des trois choix (les pages privées et songthaew sont celles de VIP Taxi Lanta), fil d'Ariane et questions.
function transferHub(product, site, links) {
  const s = product.schema || {};
  const url = abs(site, product.url);
  const ch = product.choices || {};
  const main = block({
    "@type": "Service",
    "@id": `${url}#service`,
    name: "Shared minivan transfer",
    serviceType: s.serviceType || "Shared minivan transfer",
    description: ch.shared && ch.shared.text,
    url,
    provider: agencyRef(site),
    areaServed: (s.areaServed || []).map(place)
  });
  const list = block({
    "@type": "ItemList",
    "@id": `${url}#options`,
    name: "Transfer options",
    itemListElement: [
      { name: "Private minivan across Southern Thailand", url: abs(site, links.privateUrl) },
      { name: "Shared minivan", url: `${url}#shared` },
      { name: "Local taxi (songthaew) on Koh Lanta", url: abs(site, links.localUrl) }
    ].map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: it.url }))
  });
  return pageBlocks(main, list, breadcrumb(site, { ...product, name: "Transfers" }, null), faqPage(site, product));
}

// Trajet VIP Taxi Lanta : TaxiService (les deux extrémités en areaServed), fourni par l'organisation VIP
// (@id …/taxi/#vip), décrite en entier ici puisque aucune page Secret ne la définit.
// Adresse et coordonnées de la fiche Google de VIP Taxi Lanta (10.11.2026) : JSON-LD seulement, jamais affichées.
function vipPlace(site) {
  const v = site.brands.vip;
  return clean({
    address: v.address && {
      "@type": "PostalAddress",
      streetAddress: v.address.street,
      addressLocality: v.address.locality,
      addressRegion: v.address.region,
      postalCode: v.address.postalCode,
      addressCountry: v.address.country
    },
    geo: v.geo && { "@type": "GeoCoordinates", latitude: v.geo.lat, longitude: v.geo.lng },
    hasMap: v.maps
  });
}

function route(product, site) {
  const v = site.brands.vip;
  const s = product.schema || {};
  const r = product.route || {};
  const url = abs(site, product.url);
  const area = s.areaServed || [r.from, r.to].filter(Boolean);
  const provider = {
    "@type": "LocalBusiness",
    "@id": ids(site).vip,
    name: v.name,
    alternateName: v.byline ? `${v.name} ${v.byline}` : undefined,
    url: abs(site, v.url),
    logo: photoUrl(site, v.photos, "logo"),
    image: photoUrl(site, v.photos, "hero"),
    ...vipPlace(site),
    areaServed: (v.areaServed || []).map(place),
    sameAs: v.sameAs
  };
  const main = block({
    "@type": typeOf(product),
    "@id": mainId(product, site),
    name: product.h1 || product.name,
    description: product.lead,
    url,
    image: photoUrl(site, product.photos, "hero"),
    serviceType: s.serviceType,
    areaServed: area.map(place),
    provider,
    offers: offer(site, product)
  });
  return pageBlocks(main, breadcrumb(site, product, null, { name: v.name, path: SECTIONS.route.path }), faqPage(site, product));
}

// ---------- divers ----------

function cap(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function liveFilter(live) {
  if (!live) return () => true;
  if (typeof live === "function") return live;
  const set = live instanceof Set ? live : new Set(live);
  return (url) => set.has(String(url).split("#")[0]);
}

// Aplatit l'objet `products` d'Eleventy (dossiers imbriqués) ou un tableau en une liste de produits.
function flatten(products) {
  const out = [];
  const visit = (v) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(visit);
    if (typeof v.slug === "string" && typeof v.url === "string") return out.push(v);
    Object.values(v).forEach(visit);
  };
  visit(products);
  return out;
}

// Sérialisation sûre pour une balise <script> : « < » échappé, aucune fin de balise possible dans un texte.
function toScript(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

// Hub /tours/ : fil d'Ariane et liste des fiches, noms et adresses seulement (rien d'autre n'est affirmé).
function hub(site, products) {
  const url = abs(site, "/tours/");
  return [
    block({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [{ name: "Home", item: abs(site, "/") }, { name: "Trips", item: url }]
        .map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.item }))
    }),
    block({
      "@type": "ItemList",
      "@id": `${url}#list`,
      itemListElement: products.map((pr, i) => ({ "@type": "ListItem", position: i + 1, name: pr.name, url: abs(site, pr.url) }))
    })
  ];
}

module.exports = { home, tour, activity, rental, transfer, transferHub, route, hub, toScript, clean, mainId, ids, vipPlace };
