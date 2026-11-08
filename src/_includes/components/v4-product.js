// Pages produit du design v4 (bateaux, activités, location, speedboat) : mise en forme des fiches
// src/_data/products/** pour les gabarits src/pages/product.njk, rental.njk et speedboat.njk.
// Même ordre partout que la 4 Islands : hero, photos, options et prix, déroulé, inclus, avant de réserver,
// questions, autres sorties. Une section sans donnée n'existe pas. Aucun fait n'est écrit ici : tout est lu
// dans la fiche (ou site.json) ; seuls les titres de section et les libellés de boutons sont du texte d'interface.
const view = require("./view.js");

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const listJoin = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
const fact = (p, label) => ((p.facts || []).find((f) => f.label === label) || {}).value || "";

// Notes internes laissées dans les données (« (legacy meta description) », « (page speedboat actuelle : …) ») :
// jamais affichées. Une note réduite à « Not included » ne dit rien de plus que le titre du bloc.
function publicText(s) {
  const t = String(s || "").replace(/\s*\((?:legacy|page |site actuel)[^)]*\)/gi, "").trim();
  return /^not included\.?$/i.test(t) ? "" : t;
}

// ---------- Faits : le haut de page ne garde que les faits courts, le reste va au déroulé ou à « Before you book » ----------
const HERO = ["Duration", "Hotel pickup", "Boat leaves", "Sessions", "Season", "Boat", "Start", "Raft pier", "Where", "Half days", "Full days", "One-day sites", "Riding"];
// Frais (affichés dans « Not in the price »), et faits redits par les lignes de prix.
const SKIP = ["National park fee", "Village entrance fee", "Not included", "Karts"];
// Faits pratiques : « Before you book », sauf si la fiche dit déjà la même chose (même clé).
const BEFORE = { Children: "children", Ages: "children", Cancellation: "cancellation", Transfer: "pickup", Also: "" };
const MAX_HERO = 4;

function sortFacts(p, { day }) {
  const facts = (p.facts || []).map((f) => ({ label: f.label, value: publicText(f.value) })).filter((f) => f.value);
  const hero = [];
  for (const label of HERO) {
    const f = facts.find((x) => x.label === label);
    if (f && f.value.length <= 40 && hero.length < MAX_HERO) hero.push(f);
  }
  const own = p.beforeYouBook || {};
  const rest = facts.filter((f) => !hero.includes(f) && !SKIP.includes(f.label));
  const before = [], side = [];
  for (const f of rest) {
    if (f.label in BEFORE) { if (!BEFORE[f.label] || own[BEFORE[f.label]] === undefined) before.push(f); }
    else if (day) side.push(f);
    else before.push(f);
  }
  return { hero, side, before };
}

// ---------- Prix : chaque ligne de chaque option, avec son unité ; les frais sur place à part ----------
function priceRow(r) {
  // « Per person : 1,900 THB per person » : l'unité qui redit le libellé n'est pas répétée.
  const unit = r.amount === 0 || !r.unit || r.unit.toLowerCase() === r.label.toLowerCase() ? "" : r.unit;
  return { label: r.label, amount: rowAmount(r), unit, raw: typeof r.amount === "number" ? r.amount : r.text };
}
function rowAmount(r) {
  if (typeof r.amount === "number") return r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + view.thb(r.amount);
  return r.text || "";
}
function feeRows(fees) {
  return (fees || []).map((f) => ({ label: f.label, amount: view.thb(f.amount), unit: f.unit || "", note: publicText(f.note), cash: /\bcash\b/i.test(f.note || "") }));
}
const sameFees = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);

function optionsOf(p) {
  const list = p.options || [];
  const common = list.length > 0 && list.every((o) => sameFees(o.notIncludedFees, list[0].notIncludedFees)) ? feeRows(list[0].notIncludedFees) : [];
  return {
    common,
    list: list.map((o) => ({
      id: o.id,
      label: o.label,
      note: publicText(o.note || o.stub || ""),
      rows: (o.prices || []).map(priceRow),
      onRequest: Boolean(o.priceOnRequest || !(o.prices || []).length),
      // « Rentals and discounts » (kind "extra") : des lignes à ajouter à une plongée, pas une sortie à réserver seule.
      bookable: o.kind !== "extra",
      fees: common.length ? [] : feeRows(o.notIncludedFees)
    }))
  };
}

// ---------- Sous-variantes que la feuille fait choisir (créneau, cours, karts, pilotes…) ----------
// Structure lue dans chaque option de la fiche (à remplir dans products/**, voir NOTES.md « Pages produit ») :
//   "choices": [{ "id": "session", "label": "Session", "type": "one" | "text", "required": true, "hint": "…",
//                 "values": [{ "id": "0730", "label": "07:30", "row": "libellé d'une ligne de prix", "days": ["Tuesday"] }] }],
//   "counts": { "label": "Karts", "rows": ["Small single seat", …] },   un nombre par ligne de prix
//   "extras": ["Extra dive, decided on the day"]                         lignes de prix à cocher
// Tant qu'une option n'en déclare pas, FALLBACK les déduit des faits et du déroulé déjà écrits dans la fiche :
// aucune valeur n'est inventée, seuls les noms des champs (« Session », « Class ») sont du texte d'interface.
const TIME_RE = /\b([01]\d|2[0-3]):([0-5]\d)\b/g;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timesIn = (str) => [...String(str || "").matchAll(TIME_RE)].map((m) => m[0]);
const daysIn = (str) => DAY_NAMES.map((d, i) => (new RegExp("\\b" + d + "\\b").test(str) ? i : -1)).filter((i) => i > -1);
const rowPrice = (r) => (r ? rowAmount(r) + (r.unit && r.amount !== 0 ? " " + r.unit : "") : "");
const dayText = (p, o) => (p.day || []).filter((b) => (b.options || []).includes(o.id)).flatMap((b) => b.steps.map((st) => st.text)).join(" ");
const lc = (v) => (v ? v.charAt(0).toLowerCase() + v.slice(1) : "");
const byWay = (p, o) => (/kayak or longtail/i.test(o.label + " " + dayText(p, o))
  ? [{ id: "way", label: "By", values: [{ id: "kayak", label: "Kayak" }, { id: "longtail", label: "Longtail" }] }] : []);
const EXTRA_RE = /^(Extra dive|Refresher|Nanny)/;
const pickRows = (o, id, label) => ({
  id, label,
  values: (o.prices || []).filter((r) => !EXTRA_RE.test(r.label)).map((r, i) => ({ id: "r" + i, label: r.label, row: r.label, price: rowPrice(r) }))
});
const extrasOf = (o) => (o.prices || []).filter((r) => EXTRA_RE.test(r.label)).map((r) => r.label);

const FALLBACK = {
  "elephant-sanctuary": (p, o) => {
    const own = timesIn(dayText(p, o));
    const times = own.length ? own : timesIn(fact(p, "Sessions"));
    return times.length > 1 ? { choices: [{ id: "session", label: "Session", values: times.map((t) => ({ id: t.replace(":", ""), label: t })) }] } : {};
  },
  kayak: (p, o) => {
    const slots = /half day/i.test(o.label) ? fact(p, "Half days").split(" or ").filter(Boolean) : [];
    const slot = slots.length > 1 ? [{
      id: "slot", label: "Time",
      values: slots.map((v) => { const t = timesIn(v)[0] || ""; const am = t && t < "12:00"; return { id: am ? "morning" : "afternoon", label: (am ? "Morning, " : "Afternoon, ") + v }; })
    }] : [];
    return { choices: slot.concat(byWay(p, o)) };
  },
  mangroves: (p, o) => ({ choices: byWay(p, o) }),
  batik: (p, o) => (o.id === "morning-or-afternoon" ? {
    choices: [{ id: "course", label: "Course", values: ["Morning course", "Afternoon course"].filter((l) => fact(p, l)).map((l) => ({ id: l.split(" ")[0].toLowerCase(), label: `${l}, ${lc(fact(p, l))}` })) }]
  } : {}),
  "cooking-class": (p, o) => {
    if (o.id === "carving") {
      const segs = fact(p, "Carving class").split(";").map((x) => x.trim()).filter(Boolean);
      return segs.length > 1 ? { choices: [{ id: "class", label: "Class", values: segs.map((v, i) => ({ id: "s" + i, label: v, days: daysIn(v) })) }] } : {};
    }
    const classes = ["Morning class", "Evening class"].filter((l) => fact(p, l));
    return classes.length > 1 ? { choices: [{ id: "class", label: "Class", values: classes.map((l) => ({ id: l.split(" ")[0].toLowerCase(), label: `${l}, ${fact(p, l)}`, days: daysIn(fact(p, l)) })) }] } : {};
  },
  "scuba-diving": (p, o) => {
    const cert = { id: "cert", label: "Certification and last dive", type: "text", hint: "Your level and the month of your last dive." };
    if (o.id === "one-day-experience") return { choices: [pickRows(o, "programme", "Programme")] };
    if (o.id === "fun-dives") return { choices: [pickRows(o, "sites", "Dive sites"), cert], extras: extrasOf(o) };
    if (o.id === "catamaran-special-trips") return { choices: [pickRows(o, "trip", "Trip"), cert] };
    if (o.id === "courses") return { choices: [pickRows(o, "course", "Course")] };
    if (o.id === "snorkelling-on-dive-boat") return { extras: extrasOf(o) };
    return {};
  },
  "go-kart": (p, o) => ({ counts: { label: "Karts", rows: (o.prices || []).map((r) => r.label) } }),
  atv: (p, o) => ({ counts: { label: "Riders and passengers", rows: (o.prices || []).map((r) => r.label) } })
};

// Forme finale pour booking.js : jours en numéros, prix des lignes affichés à côté des valeurs, rien de vide.
function formOf(p, o) {
  const declared = o.choices || o.counts || o.extras;
  const raw = declared ? { choices: o.choices, counts: o.counts, extras: o.extras } : (FALLBACK[p.slug] ? FALLBACK[p.slug](p, o) : {});
  const rowOf = (label) => (o.prices || []).find((r) => r.label === label);
  const out = {};
  const choices = (raw.choices || []).filter((c) => c.type === "text" || (c.values || []).length > 1).map((c) => ({
    id: c.id, label: c.label, type: c.type === "text" ? "text" : "one", required: c.required !== false, hint: c.hint || "",
    values: (c.values || []).map((v) => ({
      id: v.id, label: v.label, ...(v.row ? { row: v.row, price: v.price || rowPrice(rowOf(v.row)) } : {}),
      ...(v.days && v.days.length ? { days: v.days.map((d) => (typeof d === "number" ? d : DAY_NAMES.indexOf(d))).filter((d) => d > -1) } : {})
    }))
  }));
  if (choices.length) out.choices = choices;
  if (raw.counts && raw.counts.rows && raw.counts.rows.length) out.counts = { label: raw.counts.label, rows: raw.counts.rows, prices: raw.counts.rows.map((l) => rowPrice(rowOf(l))) };
  if (raw.extras && raw.extras.length) out.extras = raw.extras.map((l) => ({ label: l, price: rowPrice(rowOf(l)) }));
  return out;
}
// booking.js lit les suppléments comme des libellés (state.addons) et la feuille les affiche avec leur prix.
function withForms(p, options) {
  const extra = new Set((p.options || []).filter((o) => o.kind === "extra").map((o) => o.id));
  return options.filter((o) => !extra.has(o.id)).map((o) => {
    const src = (p.options || []).find((x) => x.id === o.id) || {};
    return { ...o, ...formOf(p, src) };
  });
}

// ---------- Déroulé : une journée (ligne de temps) ou un programme par option ----------
function programme(p, optLabels) {
  const blocks = view.day(p);
  if (!blocks.length) return null;
  const perOption = blocks.length > 1 && blocks.every((b) => b.options.length === 1);
  if (perOption) {
    return {
      mode: "list",
      title: "What you do, option by option",
      items: blocks.map((b) => ({
        id: b.options[0],
        title: optLabels[b.options[0]] || b.title,
        note: publicText(b.note),
        // Une seule ligne : son libellé (« A », « 1 day », « 30 min ») redit le nom de l'option, il disparaît.
        steps: b.steps.map((s) => ({ t: b.steps.length > 1 ? s.t : "", text: s.text }))
      }))
    };
  }
  return {
    mode: "day",
    title: "How the day goes",
    blocks: blocks.map((b) => ({
      title: b.options.length && b.options.length < Object.keys(optLabels).length ? "For " + listJoin(b.options.map((id) => optLabels[id]).filter(Boolean)) : "",
      note: publicText(b.note),
      steps: b.steps.map((s) => ({ t: s.t, approx: s.approx, fixed: s.fixed, text: s.text }))
    }))
  };
}

// ---------- Autres sorties : les fiches voisines écrites dans la donnée (related), en cartes ----------
const OTHER_LINKS = {
  "/tours/speedboat/": "Speedboat times from Koh Lanta",
  "/tours/rental/": "Car and scooter rental",
  "/taxi/": "Private minivan transfers with VIP Taxi Lanta"
};
function related(p, ctx) {
  const urls = p.related || [];
  const cards = urls.map((u) => ctx.cardsByUrl[u]).filter(Boolean).slice(0, 3);
  const taxi = urls.map((u) => ctx.taxi.find((t) => t.url === u)).find(Boolean);
  const links = urls.filter((u) => OTHER_LINKS[u] && ctx.live.has(u) && u !== p.url).map((u) => ({ href: u, label: OTHER_LINKS[u] }));
  const kinds = new Set(cards.map((c) => c.kind));
  const title = kinds.size === 1 ? (kinds.has("boat") ? "More boat trips" : "More activities") : "More trips and activities";
  const all = p.template === "boat" ? { href: "/tours/#boat-trips", label: "Compare all boat trips" }
    : p.template === "activity" ? { href: "/tours/#activities", label: "See all activities" }
    : { href: "/tours/", label: "See the boat trips and activities" };
  return cards.length || links.length || taxi ? {
    title, cards, links, all,
    transfer: taxi ? { from: taxi.from, href: taxi.url, name: taxi.name } : null
  } : null;
}

// ---------- WhatsApp : chaque lien dit de quel produit et de quelle page il vient ----------
function askText(name, page) {
  return `Question about ${name} (${page}): `;
}
function pageText(page) {
  return `Hello, a question from ${page}: `;
}

// Repli sans JavaScript d'un bouton d'option : la demande dit déjà le produit, l'option et la page.
function optionFallback(p, site, o) {
  return `Booking request: ${p.name}${o ? " – " + o.label : ""}\nPage: ${site.url.replace(/^https?:\/\//, "")}${p.url}`;
}

// ---------- Fiche bateau ou activité ----------
function productPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const opts = optionsOf(p);
  const optLabels = Object.fromEntries((p.options || []).map((o) => [o.id, o.label]));
  const prog = programme(p, optLabels);
  const facts = sortFacts(p, { day: Boolean(prog) });
  const pr = view.price(p);
  const single = opts.list.length === 1 ? opts.list[0].id : "";
  const fee = view.parkFee(p);
  const notIncluded = view.notIncluded(p, { skipParkFee: true }).filter((x) => !/village entrance fee/i.test(x));
  const feeNames = [...new Set(opts.common.map((f) => f.label.split(", ")[0]))].map((n, i) => (i ? n.charAt(0).toLowerCase() + n.slice(1) : n));
  if (feeNames.length) notIncluded.push(`${listJoin(feeNames)}: the amounts are under Options and prices`);
  const byb = view.beforeBook(p, site, { skipParkFee: true }).concat(facts.before.map((f) => ({ label: f.label, text: f.value })));
  return {
    slug: p.slug, kind: p.template, url: p.url, name: p.name,
    nav: p.template === "boat" ? "boats" : "activities",
    crumb: p.template === "boat" ? { label: "Boat trips", href: "/tours/#boat-trips" } : { label: "Activities", href: "/tours/#activities" },
    seo: p.seo, h1: p.h1.replace("Koh Lanta", "Koh Lanta"), lead: p.lead, promise: p.promise || "",
    keyFacts: facts.hero,
    price: pr ? { amount: pr.amount, unit: p.price.unit } : null,
    hero: ctx.hero,
    options: opts.list.map((o) => ({ ...o, fallback: optionFallback(p, site, o) })),
    fees: opts.common,
    feesCash: opts.common.some((f) => f.cash),
    programme: prog,
    sideFacts: facts.side,
    included: p.included || [],
    notIncluded,
    beforeBook: byb,
    faq: p.faq || [],
    related: related(p, ctx),
    single,
    ask: askText(p.name, host + p.url),
    fallback: single ? optionFallback(p, site, p.options[0]) : view.fallbackText(p, site),
    booking: (() => { const b = view.bookingTour(p, site); return { ...b, options: withForms(p, b.options), tripList: true }; })(),
    parkFee: fee,
    jsonLd: p.template === "boat" ? schema.tour(p, site) : schema.activity(p, site)
  };
}

// ---------- Location : une option par catégorie, chaque véhicule est une ligne qui ouvre la feuille ----------
function rentalPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const pr = view.price(p);
  const cats = (p.options || []).map((o) => {
    const amounts = (o.prices || []).map((r) => r.amount);
    return {
      id: o.id, label: o.label, count: (o.prices || []).length,
      lo: view.thb(Math.min(...amounts)), hi: view.thb(Math.max(...amounts)),
      unit: ((o.prices || [])[0] || {}).unit || "",
      rows: (o.prices || []).map((r) => ({ ...priceRow(r), fallback: `Rental request: ${o.label} – ${r.label}\nFrom: \nTo: \nPage: ${host}${p.url}` })),
      fallback: `Rental request: ${o.label}\nFrom: \nTo: \nPage: ${host}${p.url}`
    };
  });
  return {
    slug: p.slug, kind: "rental", url: p.url, name: p.name, nav: "rental",
    seo: p.seo, h1: p.h1.replace("Koh Lanta", "Koh Lanta"), lead: p.lead,
    keyFacts: (p.facts || []).filter((f) => f.label !== "Fleet").map((f) => ({ label: f.label, value: f.value })),
    fleet: fact(p, "Fleet"),
    price: pr ? { amount: pr.amount, unit: p.price.unit } : null,
    cats,
    beforeBook: view.beforeBook(p, site),
    faq: p.faq || [],
    related: related(p, ctx),
    ask: askText(p.name, host + p.url),
    fallback: `Rental request: ${p.name}\nFrom: \nTo: \nPage: ${host}${p.url}`,
    booking: { ...view.bookingTour(p, site), variant: "rental" },
    jsonLd: schema.rental(p, site)
  };
}

// ---------- Speedboat : la grille des départs ; chaque arrêt ouvre la feuille sur son trajet et son heure ----------
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function placeOf(raw) {
  const m = String(raw).match(/^(.*?) \((.*)\)$/);
  return m ? { name: m[1], note: m[2] } : { name: raw, note: "" };
}

function speedboatRoutes(p) {
  const tt = p.timetable || {};
  const routes = new Map();
  const add = (id, label, group, dep) => {
    if (!routes.has(id)) routes.set(id, { id, label, group, deps: [] });
    const r = routes.get(id);
    dep.id = dep.time.replace(":", "");
    if (!r.deps.some((d) => d.id === dep.id)) r.deps.push(dep);
  };
  const board = (tt.outbound || []).map((run) => {
    const langkawi = /Langkawi/.test(run.onward || "");
    const season = langkawi ? "" : publicText(run.season || "");
    const stops = run.stops.map((s) => {
      const pl = placeOf(s.place);
      const route = "to-" + slugify(pl.name);
      add(route, `Koh Lanta to ${pl.name}`, "out", { time: run.departs, arrives: s.time, detail: [pl.note, publicText(s.note || ""), season].filter(Boolean).join(". ") });
      return { place: pl.name, note: [pl.note, publicText(s.note || "")].filter(Boolean).join(", "), time: s.time, route, dep: run.departs.replace(":", "") };
    });
    let onward = null;
    if (langkawi) {
      // « From Koh Lipe a ferry goes on to Langkawi, arriving at 18:00 Malaysia time. » : l'arrivée est lue dans la phrase.
      const at = (run.onward.match(/arriving at (\d{2}:\d{2}[^.]*)/) || [])[1] || "";
      const lk = (run.season || "").replace(/^Langkawi:\s*/, "");
      add("to-langkawi", "Koh Lanta to Langkawi", "out", { time: run.departs, arrives: at, detail: ["Change of boat at Koh Lipe", lk ? "Runs " + lk : ""].filter(Boolean).join(". ") });
      onward = { text: run.onward, season: lk, route: "to-langkawi", dep: run.departs.replace(":", ""), checkIn: tt.checkIn && tt.checkIn.langkawi ? tt.checkIn.langkawi : "" };
    }
    return { time: run.departs, stops, season, onward };
  });
  const back = (tt.inbound || []).map((run) => {
    const origins = [{ name: run.from, times: run.departs }].concat((run.stops || []).map((s) => ({ name: s.place, times: s.times })));
    const season = publicText(run.season || "");
    const rows = origins.map((o) => {
      const route = "from-" + slugify(o.name);
      const deps = o.times.map((t, i) => {
        add(route, `${o.name} to Koh Lanta`, "in", { time: t, arrives: (run.arrivesKohLanta || [])[i] || "", detail: season });
        return { time: t, arrives: (run.arrivesKohLanta || [])[i] || "", dep: t.replace(":", "") };
      });
      return { place: o.name, route, deps };
    });
    return { from: run.from, via: run.via || [], season, rows };
  });
  const list = [...routes.values()];
  list.forEach((r) => r.deps.sort((a, b) => a.time.localeCompare(b.time)));
  return { board, back, routes: list };
}

function speedboatPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const tt = p.timetable || {};
  const sb = speedboatRoutes(p);
  // Trajet inverse (« to-koh-ngai » et « from-koh-ngai ») : il donne les bateaux du retour quand la grille les a.
  const ids = new Set(sb.routes.map((r) => r.id));
  const backOf = (id) => { const b = id.startsWith("to-") ? "from-" + id.slice(3) : "to-" + id.slice(5); return ids.has(b) ? b : ""; };
  const routes = sb.routes.map((r) => ({ id: r.id, label: r.label, back: backOf(r.id), deps: r.deps }));
  const groups = [
    { label: "From Koh Lanta", routes: sb.routes.filter((r) => r.group === "out") },
    { label: "To Koh Lanta", routes: sb.routes.filter((r) => r.group === "in") }
  ].filter((g) => g.routes.length);
  return {
    slug: p.slug, kind: "speedboat", url: p.url, name: p.name, nav: "transfers",
    seo: p.seo, h1: p.h1.replace("Koh Lanta", "Koh Lanta"), lead: p.lead,
    keyFacts: ["Departure pier", "Hotel pickup", "Check-in", "Timetable"].map((l) => ({ label: l, value: fact(p, l) })).filter((f) => f.value),
    board: sb.board, back: sb.back,
    seasons: (tt.seasons || []).map(publicText).filter(Boolean),
    checkIn: tt.checkIn && tt.checkIn.default ? "Check in " + tt.checkIn.default : "",
    beforeBook: view.beforeBook(p, site),
    faq: p.faq || [],
    related: related(p, ctx),
    ask: askText(p.name, host + p.url),
    fallback: `Speedboat request: \nDate: \nPage: ${host}${p.url}`,
    booking: {
      variant: "speedboat", brand: site.brands[p.brand].name, product: p.name, productId: p.slug,
      page: host + p.url, whatsapp: site.whatsapp.number, refPrefix: p.refPrefix || "",
      routes, groups: groups.map((g) => ({ label: g.label, routes: g.routes.map((r) => ({ id: r.id, label: r.label })) }))
    },
    jsonLd: schema.transfer(p, site)
  };
}

module.exports = { formOf, withForms, productPage, rentalPage, speedboatPage, speedboatRoutes, publicText, askText, pageText, sortFacts, optionsOf, programme };
