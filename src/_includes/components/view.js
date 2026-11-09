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
  // Taille d'affichage maximale en pixels CSS : la moitié de la largeur native, pour qu'un écran 2x
  // ne reçoive jamais une image agrandie. Les macros l'écrivent dans width/height ; le CSS (width: auto,
  // max-width: 100 %) laisse l'image rétrécir avec son conteneur, jamais grandir au-delà.
  const cssWidth = Math.floor(width / 2);
  return {
    src: `/images/${entry.file}`, file: entry.file, alt: entry.alt || "", width, height,
    cssWidth, cssHeight: Math.round((cssWidth * height) / width), position: entry.position || null
  };
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
  const unit = product.price.unit || "";
  const per = unit.match(/^per ([a-z]+)/);
  return { amount: thb(product.price.from), unit, short: per ? per[1] : "", option: optionOfPrice(product) };
}

// L'option dont le premier tarif est le prix d'appel : c'est celle que la barre mobile et le bouton du haut
// ouvrent déjà choisie (sinon la première option).
function optionOfPrice(product) {
  const list = product.options || [];
  const from = product.price && product.price.from;
  const hit = list.find((o) => o.prices && o.prices[0] && o.prices[0].amount === from)
    || list.find((o) => (o.prices || []).some((r) => r.amount === from));
  return (hit || list[0] || {}).id || "";
}

// Carte billet (maquette m1 de la critique) : ponton en tête, trois cases fixes Pickup, Boat, Day,
// talon avec le prix d'appel et, à droite, le liquide à prévoir pour le parc. Une case sans donnée reste absente.
const PIERS = ["Longtail pier", "Raft pier", "Pier", "Start", "Departure pier"];
const fact = (product, label) => ((product.facts || []).find((x) => x.label === label) || {}).value || "";
const cap = (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : "");

function cardFacts(product) {
  const out = [];
  const pickup = fact(product, "Hotel pickup");
  const sessions = fact(product, "Sessions");
  if (pickup) out.push({ label: "Pickup", value: pickup.replace(/^(\d{2}:\d{2})[–-]\d{2}:\d{2}$/, "$1") });
  else if (/^\d{2}:\d{2}/.test(sessions)) out.push({ label: "First session", value: sessions.split(/,| and /)[0].trim() });
  const opt = (product.options || []).find((o) => o.id === optionOfPrice(product));
  const boat = (opt && opt.boat) ? cap(opt.boat) : fact(product, "Boat");
  if (boat && boat.length <= 16) out.push({ label: "Boat", value: boat });
  const duration = fact(product, "Duration");
  const day = { "Full day": "Full", "Half day": "Half" }[duration] || "";
  if (day) out.push({ label: "Day", value: day });
  return out.filter((f) => f.value.length <= 16).slice(0, 3);
}

function card(product, { allowed } = {}) {
  const hero = heroOf(product, allowed);
  const pier = PIERS.map((l) => fact(product, l)).find(Boolean) || "";
  const fee = parkFee(product);
  return {
    href: product.url,
    title: product.name,
    pier: pier.split(", ")[0],
    promise: product.promise || "",
    facts: cardFacts(product),
    price: price(product),
    cash: fee ? { amount: thb(fee.adult), unit: "per adult" } : null,
    season: seasonRuler(product),
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

// Unité du premier tarif d'une option, pour la liste de la feuille : « per adult », « per boat, 1–2 people ».
function firstUnit(row) {
  if (!row) return "";
  if (row.group) return `${row.unit || ""}${row.unit ? ", " : ""}${row.group.min}–${row.group.max} people`;
  if (row.unit === "per person" && /^[A-Za-z ]+$/.test(row.label) && !/^per /i.test(row.label)) return `per ${row.label.toLowerCase()}`;
  return row.unit || "";
}

function options(product) {
  const list = (product.options || []).map((o) => ({
    id: o.id,
    title: o.label,
    note: o.note || "",
    rows: (o.prices || []).map((r) => ({ label: r.label, price: priceText(r), unit: r.unit || "", ...(typeof r.amount === "number" ? { amount: r.amount } : {}) })),
    from: o.prices && o.prices.length ? priceText(o.prices[0]) : "",
    pier: o.pier || "",
    stub: o.stub || "",
    unit: firstUnit(o.prices && o.prices[0]),
    fees: feesText(o.notIncludedFees)
  }));
  // Mêmes frais pour toutes les options : ils sont dits une seule fois, dans le talon du bandeau de faits
  // (ticket()). Des frais propres à une option restent sur sa ligne.
  // Une option dont les frais restent à confirmer (catamaran d'Ao Nang, `feesToConfirm`) n'entre pas dans la comparaison.
  const all = list.filter((o, i) => !product.options[i].feesToConfirm).map((o) => o.fees);
  const common = all.length && all.every((f) => f === all[0]) ? all[0] : "";
  if (common) list.forEach((o) => { o.fees = ""; });
  return { list, commonFees: common };
}

// Déroulé en ligne de route : les heures marquées `fixed` dans les données (prise en charge, départ) sont
// données telles quelles, les autres précédées de « ≈ » dès qu'au moins une heure est fixe.
function day(product) {
  return (product.day || []).map((b) => {
    const anyFixed = b.steps.some((s) => s.fixed);
    return {
      title: b.title,
      options: b.options || [],
      note: b.note || "",
      // place, detail et kind (road, pier, island) dessinent la ligne de route ; le tronçon qui suit un ponton
      // ou une île est en mer (pointillé), celui qui suit l'hôtel est la route (trait plein).
      steps: b.steps.map((s) => ({
        t: s.time || s.label || "", text: s.text, fixed: Boolean(s.fixed), approx: anyFixed && !s.fixed && Boolean(s.time),
        place: s.place || "", detail: s.detail || "", kind: s.kind || "", sea: Boolean(s.kind) && s.kind !== "road"
      }))
    };
  });
}

const BEFORE = [
  ["pickup", "Pickup"],
  ["deposit", "Deposit"],
  ["licence", "Driving licence"],
  ["insurance", "Insurance"],
  ["helmets", "Helmets"],
  ["delivery", "Delivery"],
  ["bring", "Bring"],
  ["children", "Children"],
  ["health", "Health"],
  ["weather", "Weather"],
  ["payment", "Payment"],
  ["cancellation", "Cancellation"]
];

// « Before you book » : valeurs du produit, à défaut celles de site.json (booking).
// La règle météo commune (report ou remboursement) s'affiche toujours, après la précision propre au produit.
function beforeBook(product, site, { skipParkFee = false } = {}) {
  const own = { ...(product.beforeYouBook || {}) };
  if (skipParkFee && Array.isArray(own.bring)) own.bring = own.bring.filter((b) => !/park fee/i.test(b));
  const common = (site && site.booking) || {};
  const fallback = {
    payment: Array.isArray(common.payment) && common.payment.length
      ? common.payment.join(" or ").replace(/^./, (c) => c.toUpperCase()) + "."
      : ""
  };
  return BEFORE.map(([key, label]) => {
    let v = own[key] !== undefined ? own[key] : fallback[key];
    // Une liste devient une phrase : « Clothes that can get dirty and wet, a towel, flip-flops ».
    if (Array.isArray(v)) v = v.map((x, i) => (i && /^(?:[A-Z][a-z]|A )/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x)).join(", ");
    // La règle météo vaut pour les sorties, pas pour la location.
    if (key === "weather" && product.template === "rental") return null;
    if (key === "weather" && common.weather) v = v ? `${v} ${common.weather}` : common.weather;
    const shown = key === "pickup" && product.template === "rental" ? "How to book" : label;
    return v ? { label: shown, text: v } : null;
  }).filter(Boolean);
}

function gallery(product, allowed) {
  return (product.photos || [])
    .filter((p) => p.slot === "hero" || p.slot === "gallery")
    .map((p) => ({ photo: photo(p, allowed), slot: slot(p) }));
}

// « We usually reply within the hour, and within 6 hours at most. » Rien tant que replyTime est null.
function replyTime(site) {
  const r = site.replyTime || {};
  if (!r.usual) return "";
  return `We usually reply ${r.usual}${r.maxHours ? `, and within ${r.maxHours} hours at most` : ""}.`;
}

// Faits du pied de page et de l'écran de confirmation de la feuille.
function contact(site) {
  return {
    number: site.whatsapp.number,
    e164: site.whatsapp.e164,
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
    refPrefix: product.refPrefix || "",
    parkFee: parkFee(product),
    // Location : le « from » d'une catégorie est son tarif le plus bas (les véhicules sont listés du plus cher au moins cher).
    options: options(product).list.map((o, i) => {
      const src = product.options[i];
      const amounts = (src.prices || []).map((r) => r.amount).filter((a) => typeof a === "number");
      const from = product.template === "rental" && amounts.length ? thb(Math.min(...amounts)) : o.from;
      // Départ ailleurs qu'à Koh Lanta (catamaran d'Ao Nang) : le message le dit sur sa propre ligne.
      return { id: o.id, title: o.title, rows: o.rows, from, unit: product.template === "rental" ? ((src.prices || [])[0] || {}).unit || "" : o.unit, ...(src.from ? { departure: src.from } : {}), ...(src.feesToConfirm ? { feesToConfirm: true } : {}) };
    })
  };
}

// Frais de parc par adulte et par enfant (visiteurs étrangers), lus dans les frais de la première option.
// Sert au talon du bandeau et au calcul du cash sur la fiche d'aperçu. Null si le produit n'en a pas.
function parkFee(product) {
  const fees = ((product.options || [])[0] || {}).notIncludedFees || [];
  const adult = fees.find((f) => /, adult$/.test(f.label) && !/Thai/.test(f.label));
  const child = fees.find((f) => /, child$/.test(f.label) && !/Thai/.test(f.label));
  if (!adult) return null;
  // Âges du tarif enfant (4 à 11 ans) : plus jeune, gratuit ; plus âgé, tarif adulte.
  const thaiA = fees.find((f) => /Thai national adult/.test(f.label));
  const thaiC = fees.find((f) => /Thai national child/.test(f.label));
  return {
    label: adult.label.split(", ")[0],
    adult: adult.amount,
    child: child ? child.amount : null,
    childAges: child && child.ages ? { min: child.ages.min || 0, max: child.ages.max } : null,
    thai: thaiA ? { adult: thaiA.amount, child: thaiC ? thaiC.amount : null } : null,
    note: adult.note || ""
  };
}

function bookingRoute(product, site, extra = {}) {
  const r = product.route || {};
  return {
    ...extra,
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

// Bandeau de faits, façon billet de ferry (00-BRIEF §6.2, retour du 03.11.2026) : prise en charge, départ
// du bateau, ponton, bateau, join-in ou privé, saison si connue. Le prix d'appel et les frais de parc vont
// dans le talon. Une ligne sans valeur dans les données n'existe pas.
const TICKET = [
  ["Hotel pickup", "Pickup"], ["Sessions", "Sessions"], ["Boat leaves", "Boat leaves"],
  ["Longtail pier", "Longtail pier"], ["Raft pier", "Raft pier"], ["Pier", "Pier"], ["Start", "Start"],
  ["Boat", "Boat"], ["Format", "Format"], ["Season", "Season"]
];
const isTime = (v) => /^\d{2}:\d{2}(?:[–-]\d{2}:\d{2})?$/.test(v);

// Activités : pas de bateau ni de ponton ; sessions, durée, saison, règles d'âge et ce qui compte pour l'activité.
const TICKET_ACTIVITY = [
  ["Hotel pickup", "Pickup"], ["Sessions", "Sessions"], ["Duration", "Duration"], ["Season", "Season"],
  ["Riding", "Riding"], ["Children", "Children"], ["Ages", "Ages"]
];

function ticket(product) {
  const rows = [];
  for (const [label, shown] of (product.template === "boat" ? TICKET : TICKET_ACTIVITY)) {
    const f = (product.facts || []).find((x) => x.label === label);
    if (f && f.value) rows.push({ label: shown, value: f.value, time: isTime(f.value) });
  }
  const fee = parkFee(product);
  const p = price(product);
  return {
    rows,
    stub: {
      price: p ? { amount: p.amount, unit: product.price.unit } : null,
      fee: fee ? {
        label: fee.label,
        adult: thb(fee.adult),
        child: fee.child !== null ? thb(fee.child) : "",
        thai: fee.thai ? `Thai nationals ${fee.thai.adult}${fee.thai.child !== null ? ` and ${fee.thai.child}` : ""} THB` : "",
        note: fee.note
      } : null
    }
  };
}

// « Not included » sans la ligne des frais de parc quand le talon les donne déjà.
function notIncluded(product, { skipParkFee = false } = {}) {
  return (product.notIncluded || []).filter((i) => !(skipParkFee && /park fee/i.test(i)));
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

// ---------- Saisons ----------
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// « October to April » ou « Mid-October to mid-May » → les mois entamés ; « All year » → les 12 mois ;
// autre chose → null (rien d'affiché).
function seasonMonths(product) {
  const f = (product.facts || []).find((x) => x.label === "Season");
  if (!f) return null;
  if (/^all year$/i.test(f.value.trim())) return MONTH_NAMES.map((_, i) => i + 1);
  const m = f.value.match(/^(?:Mid-)?([A-Z][a-z]+) to (?:mid-)?([A-Z][a-z]+)$/);
  if (!m) return null;
  const a = MONTH_NAMES.indexOf(m[1]) + 1, b = MONTH_NAMES.indexOf(m[2]) + 1;
  if (!a || !b) return null;
  const out = [];
  for (let i = a; ; i = (i % 12) + 1) { out.push(i); if (i === b) break; }
  return out;
}

// Réglette des saisons : 12 cases, mois ouverts marqués. Null si la saison n'est pas dans les données.
function seasonRuler(product) {
  const months = seasonMonths(product);
  if (!months) return null;
  const f = product.facts.find((x) => x.label === "Season");
  return { label: f.value, months: MONTH_NAMES.map((n, i) => ({ letter: n.charAt(0), short: n.slice(0, 3), name: n, n: i + 1, open: months.includes(i + 1) })) };
}

// Mois en cours à Koh Lanta (1–12), pour « Runs today ».
function bangkokMonth(now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", month: "numeric" }).format(now));
}

// Tableau des départs : une ligne par excursion, heure de prise en charge, départ, bateau, prix d'appel.
// « Runs today » seulement si la saison est dans les données et couvre le mois en cours ; sinon la case reste vide.
function departures(products, now = new Date()) {
  const month = bangkokMonth(now);
  return products.map((p) => {
    const fact = (label) => ((p.facts || []).find((x) => x.label === label) || {}).value || "";
    const months = seasonMonths(p);
    const pr = price(p);
    return {
      href: p.url,
      name: p.name,
      pickup: fact("Hotel pickup"),
      leaves: fact("Boat leaves"),
      boat: fact("Boat"),
      from: pr ? pr.amount : "",
      today: months ? months.includes(month) : null
    };
  });
}

// Tableau des départs de Sala Dan (maquette m1) : la grille des speedboats, heure, destination, arrêts.
// La saison (seasonRange) donne « Runs today » côté navigateur, à l'heure de Bangkok (ui.js) ; sans saison, rien.
function departureBoard(product) {
  const tt = product.timetable || {};
  const rows = (tt.outbound || []).map((r) => {
    const last = r.stops[r.stops.length - 1];
    const langkawi = /Langkawi/.test(r.onward || "");
    return {
      time: r.departs,
      to: last.place.replace(/ \(.*\)$/, "") + (langkawi ? ", Langkawi" : ""),
      via: r.stops.map((x) => `${x.place} ${x.time}`).join(", "),
      onward: r.onward || "",
      checkIn: langkawi && tt.checkIn && tt.checkIn.langkawi ? `Langkawi: check in ${tt.checkIn.langkawi}.` : "",
      season: r.seasonRange ? { ...r.seasonRange, scope: langkawi ? "Langkawi" : "" } : null
    };
  });
  return {
    title: "Departures from Koh Lanta",
    pier: fact(product, "Departure pier"),
    season: tt.season ? `${tt.season.replace("-", "–")} season` : "",
    checkIn: tt.checkIn && tt.checkIn.default ? `check in ${tt.checkIn.default}` : "",
    note: (tt.seasons || [])[0] || "",
    rows
  };
}

// « Who runs this trip » (03-audit-contenu §6.2.9) : le comptoir et la société. Ni partenaire (Q17), ni horaires (aucun).
function whoRuns(site) {
  const b = site.brands.secret;
  return {
    desk: b.address.display,
    maps: b.maps || "",
    operator: site.operator.name,
    registration: site.operator.registration,
    licence: b.licence || ""
  };
}

// Pièces d'une page trajet (00-BRIEF §6.4). Chaque ligne sans donnée vaut null et n'est pas affichée.
function routeParts(route) {
  const r = route.route || {};
  const fact = (label) => ((route.facts || []).find((x) => x.label === label) || {}).value || null;
  return {
    from: r.from, to: r.to, code: r.code || "", both: Boolean(r.bothDirections),
    rows: [
      { label: "Price", value: route.priceOnRequest ? "Price on WhatsApp" : null, key: "price" },
      { label: "Drive time", value: fact("Drive time"), key: "drive" },
      { label: "Distance", value: fact("Distance"), key: "distance" },
      { label: "Ferry", value: fact("Ferry"), key: "ferry" },
      { label: "Meeting point", value: fact("Meeting point"), key: "meeting" },
      { label: "Seats and bags", value: fact("Capacity"), key: "capacity" },
      { label: "If your flight is late", value: fact("Waiting time"), key: "waiting" },
      { label: "Child seats", value: fact("Child seats"), key: "seats" }
    ],
    faq: route.faq || []
  };
}

// Tableau de location (00-BRIEF §6.3) : un groupe par catégorie, véhicule et prix par jour.
function rentalTable(product) {
  return (product.options || []).map((o) => ({
    id: o.id,
    title: o.label,
    rows: (o.prices || []).map((r) => ({ label: r.label, price: priceText(r), unit: r.unit || "" }))
  }));
}

// ---------- Images responsives ----------
// AVIF et WebP de 400 à 1 600 px (00-BRIEF §12), jamais au-delà de la largeur native. À appeler depuis un
// fichier de données asynchrone : chaque objet { src: "/images/…", width } reçoit `avif` et `webp` (srcset).
async function responsive(root, { widths = [400, 800, 1200, 1600], only, avif = 55, webp = 74 } = {}) {
  const { default: Image } = await import("@11ty/eleventy-img");
  const seen = new Set();
  const visit = async (v) => {
    if (Array.isArray(v)) { for (const x of v) await visit(x); return; }
    if (!v || typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (typeof v.src === "string" && v.src.startsWith("/images/") && v.width && !v.webp && (!only || only(v))) {
      const w = widths.filter((x) => x < v.width).concat(v.width);
      const meta = await Image(path.join(IMAGES, v.src.slice("/images/".length)), {
        widths: w, formats: ["avif", "webp"], outputDir: "_site/img/", urlPath: "/img/",
        sharpWebpOptions: { quality: webp }, sharpAvifOptions: { quality: avif }
      });
      v.avif = meta.avif.map((m) => m.srcset).join(", ");
      v.webp = meta.webp.map((m) => m.srcset).join(", ");
      v.fallback = meta.webp[meta.webp.length - 1].url;
    }
    for (const x of Object.values(v)) await visit(x);
  };
  await visit(root);
  return root;
}

// Emblème d'origine (images/secret/emblem.webp, 240 × 198), en srcset 1x à 3x pour une hauteur donnée.
async function emblem(height) {
  const { default: Image } = await import("@11ty/eleventy-img");
  const [w0, h0] = webpSize("secret/emblem.webp");
  const w = Math.round((height * w0) / h0);
  const widths = [w, w * 2, w * 3].filter((x) => x <= w0);
  const meta = await Image(path.join(IMAGES, "secret/emblem.webp"), {
    widths, formats: ["avif", "webp"], outputDir: "_site/img/", urlPath: "/img/"
  });
  const set = (list) => list.map((m, i) => `${m.url} ${i + 1}x`).join(", ");
  return { width: w, height, avif: set(meta.avif), webp: set(meta.webp), src: meta.webp[0].url };
}

module.exports = {
  rating, ticket, notIncluded, parkFee, cardFacts, optionOfPrice,
  seasonMonths, seasonRuler, departures, departureBoard, whoRuns, routeParts, rentalTable, responsive, emblem,
  thb, webpSize, photo, slot, heroOf, price, card, options, feesText, day, beforeBook, gallery,
  replyTime, contact, bookingTour, bookingRoute, fallbackText
};
