// Les pages trajet de VIP Taxi Lanta et le hub /taxi/, sur un seul gabarit (refonte taxi v1, 10.11.2026).
// Source des faits : products/taxi/*.json (10 fiches) et products/taxi/southern-thailand.json (7 trajets regroupés),
// dans l'ordre et avec les régions de taxiRoutes.json. Une donnée absente reste absente : pas de durée inventée.
const fs = require("node:fs");
const path = require("node:path");
const view = require("../_includes/components/view.js");
const site = require("./site.json");
const legacy = require("./taxiRoutes.json");

const DIR = path.join(__dirname, "products", "taxi");
const read = (id) => JSON.parse(fs.readFileSync(path.join(DIR, id + ".json"), "utf8"));
const south = read("southern-thailand");

// Jérémy, 10.11.2026 : à l'aéroport, le chauffeur attend aux arrivées avec une pancarte au nom du client.
const MEET = { title: "Met at arrivals", text: "For an airport pickup, your driver waits in the arrivals hall with a sign showing your name." };

// Prix d'appel de la grille VIP Taxi Lanta (1 ou 2 personnes) : « From 2,300 THB », ou « About 5,000 THB » si la grille dit « environ ».
function priceOf(p) {
  const f = p.priceFrom;
  if (!f || !f.thb) return null;
  const amount = `${f.thb.toLocaleString("en-US")}\u00a0THB`;
  return { thb: f.thb, approx: Boolean(f.approx), label: `${f.approx ? "About" : "From"} ${amount}`, people: f.people || "" };
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// Un trajet regroupé dans southern-thailand.json prend la forme d'une fiche produit.
function fromSouth(r) {
  const text = `${r.lead} ${(r.seo || {}).metaDescription || ""}`;
  return {
    slug: r.id,
    url: `/taxi/${r.id}/`,
    brand: "vip",
    template: "route",
    name: `${r.from} to ${r.to}`,
    seo: r.seo,
    h1: r.h1,
    lead: r.lead,
    route: {
      from: r.from,
      to: r.to,
      code: r.code || undefined,
      bothDirections: /both directions|or the other way|either direction/i.test(text),
      drive: r.drive || undefined,
      points: r.points || [],
      region: r.region
    },
    facts: r.drive ? [{ label: "Drive time", value: cap(r.drive) }] : [],
    priceOnRequest: true,
    faq: r.faq || [],
    body: r.body || [],
    photos: [],
    schema: { type: "TaxiService", serviceType: "Private minivan transfer", areaServed: [r.from, r.to] },
    priceFrom: r.priceFrom
  };
}

function product(id) {
  if (fs.existsSync(path.join(DIR, id + ".json"))) {
    const p = read(id);
    return { ...p, body: (p.legacyText || {}).body || [] };
  }
  const r = (south.routes || []).find((x) => x.id === id);
  if (!r) throw new Error(`[taxiPages] trajet introuvable : ${id}`);
  return fromSouth(r);
}

module.exports = function () {
  const schema = require("../_includes/components/schema.js");
  const ids = legacy.routes.map((r) => r.id);
  const regionOf = {};
  (legacy.regions || []).forEach((g) => g.routes.forEach((id) => { regionOf[id] = g.name; }));

  const routes = ids.map((id) => {
    const p = product(id);
    const r = p.route || {};
    const price = priceOf(p);
    // La méta dit le prix d'appel quand la grille en donne un.
    const seo = price && p.seo ? { ...p.seo, metaDescription: p.seo.metaDescription.replace("Price on WhatsApp.", `${price.label.replace(/\u00a0/g, " ")}.`) } : p.seo;
    return {
      id,
      product: p,
      url: p.url,
      name: p.name,
      seo,
      price,
      h1: p.h1,
      lead: p.lead,
      body: p.body,
      from: r.from,
      to: r.to,
      code: r.code || "",
      both: Boolean(r.bothDirections),
      drive: r.drive || "",
      points: r.points || [],
      region: regionOf[id] || r.region || "",
      // Le titre se compose du trajet et de la suite du h1 (« by private minivan »).
      h1Tail: p.h1.startsWith(`${r.from} to ${r.to}`) ? p.h1.slice(`${r.from} to ${r.to}`.length).replace(/^[,\s]+/, "") : null,
      faq: p.faq || [],
      how: /Airport/.test(`${r.from} ${r.to}`) ? (legacy.common.how || []).concat([MEET]) : legacy.common.how || [],
      booking: view.bookingRoute(p, site, price ? { priceNote: `${price.label.replace(/\u00a0/g, " ")} for ${price.people} people` } : {}),
      fallback: view.fallbackText(p, site),
      jsonLd: schema.route(p, site)
    };
  });
  const byId = Object.fromEntries(routes.map((r) => [r.id, r]));
  // Autres trajets de la même région, dans l'ordre des régions.
  routes.forEach((r) => {
    const g = (legacy.regions || []).find((x) => x.routes.includes(r.id));
    r.others = g ? g.routes.filter((id) => id !== r.id).map((id) => byId[id]).filter(Boolean).map((o) => ({ url: o.url, from: o.from, to: o.to, drive: o.drive, price: o.price })) : [];
  });
  const regions = (legacy.regions || []).map((g) => ({ name: g.name, intro: g.intro, routes: g.routes.map((id) => byId[id]).filter(Boolean) }));

  // Feuille du hub : From et To libres (aucun trajet imposé).
  const hubBooking = {
    variant: "taxi",
    brand: site.brands.vip.name,
    product: "Private transfer",
    kicker: "Request a transfer",
    productId: "taxi-hub",
    page: site.url.replace(/^https?:\/\//, "") + "/taxi/",
    whatsapp: site.whatsapp.number,
    from: "",
    to: ""
  };

  return {
    routes,
    byId,
    regions,
    further: legacy.further,
    commonFaq: (legacy.common || {}).faq || [],
    how: (legacy.common || {}).how || [],
    hubBooking,
    rating: view.rating(site.brands.vip.rating),
    contact: view.contact(site)
  };
};
