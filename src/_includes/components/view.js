// Mise en forme des données produit (src/_data/products/**, site.json) pour les composants de la refonte.
// Les macros Nunjucks ne reçoivent que des valeurs prêtes à afficher ; tout le formatage (prix, heures,
// photos, frais) se fait ici, une seule fois. À utiliser depuis un fichier *.11tydata.js.
const fs = require("node:fs");
const path = require("node:path");

const IMAGES = path.join(__dirname, "..", "..", "images");

// « 1000 » devient « 1,000 THB ».
function thb(amount) {
  return `${Number(amount).toLocaleString("en-GB")} THB`;
}

// Largeur et hauteur réelles d'un WebP (en-têtes VP8, VP8L, VP8X), pour width/height et zéro décalage de mise en page.
function webpSize(file) {
  const buf = fs.readFileSync(path.join(IMAGES, file));
  const type = buf.toString("ascii", 12, 16);
  if (type === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (type === "VP8L") {
    const b = buf.readUInt32LE(21);
    return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)];
  }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
}

// Une photo « keep » avec son fichier ; sinon null. `allowed` restreint aux fichiers autorisés (planche).
function photo(entry, allowed) {
  if (!entry || entry.status !== "keep" || !entry.file) return null;
  if (allowed && !allowed.includes(entry.file)) return null;
  const [width, height] = entry.file.endsWith(".webp") ? webpSize(entry.file) : [entry.width, entry.height];
  return { src: `/images/${entry.file}`, alt: entry.alt || "", width, height, position: entry.position || null };
}

// Nom d'un emplacement à remplir : la prise de vue demandée dans les données, et le format.
function slot(entry, ratio = "4:3") {
  if (!entry) return "";
  // Première phrase de la prise de vue, sans la parenthèse sur le fichier actuel.
  const shot = (entry.shot || entry.slot || "").split(/\.\s/)[0].split(" (")[0].replace(/\.\s*$/, "");
  return `${shot}, ${ratio}`;
}

function heroOf(product, allowed) {
  const entry = (product.photos || []).find((p) => p.slot === "hero");
  return { photo: photo(entry, allowed), slot: slot(entry) };
}

function price(product) {
  if (product.priceOnRequest || !product.price) return null;
  return { amount: thb(product.price.from), unit: product.price.unit || "" };
}

// Carte produit. `card` permet de donner la promesse et la ligne de faits propres à la carte.
function card(product, { promise, facts, allowed } = {}) {
  const hero = heroOf(product, allowed);
  return {
    href: product.url,
    title: product.name,
    promise: promise || "",
    facts: facts || [],
    price: price(product),
    photo: hero.photo,
    slot: hero.slot
  };
}

function priceText(row) {
  if (typeof row.amount === "number") {
    if (row.amount === 0) return "Free";
    return (row.supplement ? "+" : "") + thb(row.amount);
  }
  return row.text || "";
}

// Frais non inclus d'une option : « National park fee: adult 200 THB, child 100 THB… Cash, paid to the ranger on the island. »
function feesText(fees) {
  if (!fees || !fees.length) return "";
  const prefix = fees[0].label.split(", ")[0];
  const shared = fees.every((f) => f.label.startsWith(prefix + ", "));
  const list = fees.map((f) => `${shared ? f.label.slice(prefix.length + 2) : f.label} ${thb(f.amount)}`).join(", ");
  const note = fees[0].note && fees.every((f) => f.note === fees[0].note) ? ` ${fees[0].note}.` : "";
  return `${shared ? prefix + ": " : ""}${list}.${note}`;
}

function options(product) {
  const list = (product.options || []).map((o) => ({
    id: o.id,
    title: o.label,
    note: o.note || "",
    rows: (o.prices || []).map((r) => ({ label: r.label, price: priceText(r) })),
    fees: feesText(o.notIncludedFees)
  }));
  // Mêmes frais pour toutes les options : un seul bloc sous la liste, sinon une ligne dans chaque option.
  const all = list.map((o) => o.fees);
  const common = all.length && all.every((f) => f === all[0]) ? all[0] : "";
  if (common) list.forEach((o) => { o.fees = ""; });
  return { list, fees: common ? { label: "Not included", text: common } : null };
}

function day(product) {
  return (product.day || []).map((b) => ({
    title: b.title,
    options: b.options || [],
    steps: b.steps.map((s) => ({ t: s.time || s.label || "", text: s.text }))
  }));
}

const BEFORE = [
  ["pickup", "Pickup"],
  ["bring", "Bring"],
  ["children", "Children"],
  ["health", "Health"],
  ["weather", "Weather"],
  ["payment", "Payment"],
  ["cancellation", "Cancellation"]
];

// « Before you book » : valeurs du produit, à défaut celles de site.json (booking).
function beforeBook(product, site) {
  const own = product.beforeYouBook || {};
  const common = (site && site.booking) || {};
  const fallback = {
    weather: common.weather,
    payment: Array.isArray(common.payment) && common.payment.length
      ? common.payment.join(" or ").replace(/^./, (c) => c.toUpperCase()) + "."
      : ""
  };
  return BEFORE.map(([key, label]) => {
    let v = own[key] !== undefined ? own[key] : fallback[key];
    if (Array.isArray(v)) v = v.join(", ");
    return v ? { label, text: v } : null;
  }).filter(Boolean);
}

function gallery(product, allowed) {
  return (product.photos || [])
    .filter((p) => p.slot === "hero" || p.slot === "gallery")
    .map((p) => ({ photo: photo(p, allowed), slot: slot(p) }));
}

// « We usually reply within the hour, and within 6 hours at most. »
function replyTime(site) {
  const r = site.replyTime || {};
  if (!r.usual) return "";
  return `We usually reply ${r.usual}${r.maxHours ? `, and within ${r.maxHours} hours at most` : ""}.`;
}

// Faits du pied de page et de l'écran de confirmation de la feuille.
function contact(site) {
  return {
    number: site.whatsapp.number,
    phoneDisplay: site.whatsapp.display,
    replyTime: replyTime(site),
    languages: site.languages || []
  };
}

// Configuration de la feuille de réservation (src/js/booking.js).
function bookingTour(product, site) {
  return {
    variant: "tour",
    brand: site.brands[product.brand].name,
    product: product.name,
    productId: product.slug,
    page: site.url.replace(/^https?:\/\//, "") + product.url,
    whatsapp: site.whatsapp.number,
    pickupRequired: product.template !== "rental",
    options: options(product).list.map((o) => ({ id: o.id, title: o.title, rows: o.rows }))
  };
}

function bookingRoute(product, site) {
  const r = product.route || {};
  return {
    variant: "taxi",
    brand: site.brands[product.brand].name,
    product: product.name,
    productId: `taxi-${product.slug}`,
    from: r.from || "",
    to: r.to || "",
    page: site.url.replace(/^https?:\/\//, "") + product.url,
    whatsapp: site.whatsapp.number
  };
}

// Repli sans JavaScript des boutons « Check availability » : WhatsApp avec le produit et la page.
function fallbackText(product, site) {
  return `${product.template === "route" ? "Transfer request" : "Booking request"}: ${product.name}\nPage: ${site.url.replace(/^https?:\/\//, "")}${product.url}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Note Google : « 5.0 », nombre d'avis et date de lecture « 2 Nov 2026 ». Rien si la note manque.
function rating(r) {
  if (!r || r.value === undefined || !r.count) return null;
  const [y, m, d] = (r.readOn || "").split("-").map(Number);
  return {
    value: Number(r.value).toFixed(1),
    count: r.count,
    readOn: y ? `${d} ${MONTHS[m - 1]} ${y}` : "",
    url: r.url || ""
  };
}

module.exports = {
  rating,
  thb, webpSize, photo, slot, heroOf, price, card, options, feesText, day, beforeBook, gallery,
  replyTime, contact, bookingTour, bookingRoute, fallbackText
};
