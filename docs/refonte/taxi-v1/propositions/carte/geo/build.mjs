// Construit les trois maquettes « carte » à partir des données du dépôt. Usage : node geo/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { PLACES, PLACE_OF, SEAS, makeView, landPath, arc, routeBox } from "./map.mjs";

const REPO = new URL("../../../../../../", import.meta.url);
const OUT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, REPO), "utf8");
const json = (p) => JSON.parse(read(p));

const TR = json("src/_data/taxiRoutes.json");
const TAXI = json("src/_data/taxi.json");
const VIP = json("src/_data/site.json").brands.vip;
const ROUTES = TR.routes;
const byId = Object.fromEntries(ROUTES.map((r) => [r.id, r]));
const WA = "66958683846";
const DIR = "/docs/refonte/taxi-v1/propositions/carte";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const waIcon = (() => { const h = read("_site/taxi/krabi-airport-koh-lanta/index.html"); const k = h.indexOf("data-send"); return h.slice(h.indexOf("<svg", k), h.indexOf("</svg>", k) + 6); })();

// ---------- Carte ----------
// Placement des étiquettes : jamais hors du cadre, jamais l'une sur l'autre. On garde la place prévue
// si elle est libre, sinon on essaie l'autre côté, dessus, dessous. Les bouts du trajet passent en premier,
// du côté opposé à l'autre bout. Largeur estimée à la taille du téléphone (la plus grande en unités).
function labelBox(view, x, y, size, w, { a, dx, dy }) {
  const lx = x + dx * size, ly = y + dy * size;
  const left = a === "start" ? lx : a === "end" ? lx - w : lx - w / 2;
  return { l: left, r: left + w, t: ly - 0.78 * size, b: ly + 0.22 * size };
}
const labelW = (p, size, codes) => (p.name.length + (codes && p.code ? p.code.length + 1 : 0)) * 0.45 * size;
const overlaps = (A, B) => A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b;
function layoutLabels(view, items, pre = []) {
  const placed = [...pre];
  const inside = (b) => b.l > 6 && b.r < view.width - 6 && b.t > 4 && b.b < view.height - 4;
  for (const it of items) {
    const right = { a: "start", dx: 0.6, dy: 0.35 }, left = { a: "end", dx: -0.6, dy: 0.35 };
    const side = it.toward == null ? [it.p.lab, left, right] : [it.toward > it.x ? left : right];
    const tries = [...side, { a: "middle", dx: 0, dy: -0.85 }, { a: "middle", dx: 0, dy: 1.5 }, ...(it.toward == null ? [] : [it.toward > it.x ? right : left])];
    it.lab = null;
    for (const t of tries) {
      const b = labelBox(view, it.x, it.y, it.size, it.w, t);
      if (inside(b) && !placed.some((q) => overlaps(q, b))) { it.lab = t; placed.push(b); break; }
    }
    if (!it.lab && !it.optional) { it.lab = it.p.lab; placed.push(labelBox(view, it.x, it.y, it.size, it.w, it.lab)); }
  }
}

function placeText(p, cls, x, y, lab, codes) {
  const code = codes && p.code ? `<tspan class="pl-code"> ${p.code}</tspan>` : "";
  return `<text class="${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" dx="${lab.dx}em" dy="${lab.dy}em" text-anchor="${lab.a}">${esc(p.name)}${code}</text>`;
}

function mapSvg({ view, mode, focus }) {
  const land = landPath(view, mode === "hub" ? 1.1 : 0.7);
  const inView = (p) => p.lon > view.w && p.lon < view.e && p.lat > view.s && p.lat < view.n;
  // Les plus longues d'abord : au doigt, les courtes (là où tout se croise) restent au-dessus et se touchent.
  const list = mode === "hub" ? [...ROUTES].sort((a, b) => arc(view, b).len - arc(view, a).len) : [focus];
  const lines = list.map((r, i) => {
    const a = arc(view, r);
    return `<g class="rt" data-route="${r.id}" style="--i:${i}"><path class="rt-hit" d="${a.d}"/><path class="rt-line" d="${a.d}" pathLength="1"/></g>`;
  }).join("");
  let drive = "", driveBox = null;
  if (mode === "route" && focus.drive) {
    const a = arc(view, focus);
    // Durée posée à l'extérieur de la courbe : à côté d'un trait plutôt vertical, dessous ou dessus d'un trait plutôt horizontal.
    const [nx, ny] = a.normal, side = Math.abs(nx) > 0.5;
    const x = a.mid[0] + nx * (side ? 22 : 10), y = a.mid[1] + ny * (side ? 10 : 40) + (side ? 10 : 0);
    const anchor = side ? (nx > 0 ? "start" : "end") : "middle";
    driveBox = labelBox(view, x, y, 30, focus.drive.length * 0.45 * 30, { a: anchor, dx: 0, dy: 0 });
    drive = `<text class="drive" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}">${esc(focus.drive)}</text>`;
  }
  const ends = focus ? [PLACE_OF[focus.from], PLACE_OF[focus.to]] : [];
  const codes = mode === "route";
  const items = Object.entries(PLACES).filter(([, p]) => inView(p)).map(([id, p]) => {
    const isEnd = ends.includes(id);
    const size = mode === "hub" ? (p.minor ? 25 : p.base ? 36 : 31) : isEnd ? 40 : 29;
    const o = isEnd ? PLACES[ends[0] === id ? ends[1] : ends[0]] : null;
    return { id, p, isEnd, size, x: view.x(p.lon), y: view.y(p.lat), w: labelW(p, size, codes), toward: o ? view.x(o.lon) : null, optional: mode === "route" && !isEnd };
  });
  const rank = (it) => (it.isEnd ? 0 : it.p.base ? 1 : it.p.minor ? 3 : 2);
  // Sur une page trajet, la ligne elle-même est un obstacle pour les étiquettes de contexte.
  const lineBoxes = [];
  if (mode === "route") {
    const [ax, ay, cx, cy, bx, by] = arc(view, focus).d.match(/-?[\d.]+/g).map(Number);
    for (let t = 0.04; t < 1; t += 0.04) {
      const x = (1 - t) ** 2 * ax + 2 * (1 - t) * t * cx + t * t * bx, y = (1 - t) ** 2 * ay + 2 * (1 - t) * t * cy + t * t * by;
      lineBoxes.push({ l: x - 8, r: x + 8, t: y - 8, b: y + 8 });
    }
  }
  layoutLabels(view, [...items].sort((a, b) => rank(a) - rank(b)), [...(driveBox ? [driveBox] : []), ...lineBoxes]);
  const places = items.map(({ id, p, isEnd, x, y, lab }) => {
    const cls = ["pl", p.base ? "pl--base" : "", p.minor ? "pl--minor" : "", isEnd ? "pl--end" : "", mode === "route" && !isEnd ? "pl--ctx" : ""].filter(Boolean).join(" ");
    const mark = p.base
      ? `<circle class="pl-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16"/><circle class="pl-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"/>`
      : `<circle class="pl-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.minor ? 5 : 7}"/>`;
    return `<g class="${cls}" data-place="${id}">${mark}${lab ? placeText(p, "pl-name", x, y, lab, codes) : ""}</g>`;
  }).join("");
  const seas = SEAS.filter((s) => s.lon > view.w && s.lon < view.e && s.lat > view.s && s.lat < view.n)
    .map((s) => `<text class="sea${s.size < 1.1 ? " sea--small" : ""}" x="${view.x(s.lon).toFixed(1)}" y="${view.y(s.lat).toFixed(1)}">${s.name}</text>`).join("");
  let extra = "";
  if (mode === "hub") {
    // Plus loin, sur demande (taxiRoutes.json « further ») : une flèche qui sort du cadre vers le nord.
    const x = view.x(98.78), y0 = view.y(9.2), y1 = 18;
    extra = `<g class="further"><path d="M${x.toFixed(1)} ${y0.toFixed(1)}V${y1 + 10}"/><path d="M${(x - 12).toFixed(1)} ${y1 + 24}l12 -16 12 16"/><text x="${(x + 22).toFixed(1)}" y="${y1 + 30}">Hua Hin, Bangkok</text><text x="${(x + 22).toFixed(1)}" y="${y1 + 30}" dy="1.15em">on request</text></g>`;
  }
  return `<svg class="map-svg" viewBox="0 0 ${view.width} ${view.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<defs><path id="land-${mode}" d="${land}"/></defs>
<rect class="map-sea" width="${view.width}" height="${view.height}"/>
<use class="wl wl-1" href="#land-${mode}"/><use class="wl wl-2" href="#land-${mode}"/><use class="wl wl-3" href="#land-${mode}"/>
<use class="map-land" href="#land-${mode}"/>
${seas}${extra}
<g class="routes">${lines}</g>${drive}
<g class="places">${places}</g>
</svg>`;
}

// ---------- Morceaux de page ----------
const head = ({ title, desc }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preload" as="font" type="font/woff2" href="${DIR}/fonts/sofia-sans-condensed-latin-wght-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${DIR}/fonts/sofia-sans-latin-wght-normal.woff2" crossorigin>
<link rel="stylesheet" href="/_site/css/booking.css">
<link rel="stylesheet" href="${DIR}/taxi.css">
<link rel="icon" type="image/png" sizes="32x32" href="/src/images/taxi/icon-32.png">
<script>document.documentElement.classList.add("js");</script>
</head>
<body data-brand="vip">
<a class="skip" href="#main">Skip to content</a>`;

const header = (cta) => `<header class="top">
  <a class="brand" href="/taxi/"><span class="brand-logo"><img src="/src/images/taxi/logo.webp" width="640" height="640" alt=""></span><span class="brand-name">VIP Taxi Lanta<small>by Mr. Brown</small></span></a>
  ${cta ? `<a class="btn btn--small" href="https://wa.me/${WA}" data-book>Request a transfer</a>` : `<a class="top-link" href="/taxi/">All routes</a>`}
</header>`;

const glyph = `<span class="glyph" aria-hidden="true"></span>`;
const row = (r, extra = "") => `<li><a class="row" href="/taxi/${r.id}/" data-route="${r.id}">${glyph}<span class="row-ends"><span class="row-from">${esc(r.from)}</span><span class="row-to">${esc(r.to)}</span></span>${r.drive ? `<span class="row-time">${esc(r.drive)}</span>` : ""}${extra}</a></li>`;

const faqList = (items) => `<div class="faq">${items.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>`;

const secret = () => `<section class="secret" aria-labelledby="secret-h">
  <div class="secret-in">
    <img class="secret-photo" src="/src/images/secret/v3/card-4-islands.jpg" width="1421" height="1066" alt="Snorkellers in turquoise water at the foot of a limestone cliff" loading="lazy">
    <div class="secret-text">
      <img class="secret-emblem" src="/src/images/secret/emblem.webp" width="240" height="200" alt="" loading="lazy">
      <h2 id="secret-h">Day tours and boat trips with Secret Travel &amp; Tour</h2>
      <p>${esc(TAXI.tours.text)}</p>
      <ul class="secret-links">
        <li><a href="/tours/4-islands/">4 Islands boat tour from Koh Lanta</a></li>
        <li><a href="/tours/koh-rok-koh-haa/">Koh Rok and Koh Haa snorkelling day trip</a></li>
        <li><a href="/tours/elephant-sanctuary/">Elephant sanctuary on Koh Lanta</a></li>
      </ul>
      <a class="secret-all" href="/">${esc(TAXI.tours.link.label)}</a>
    </div>
  </div>
</section>`;

const footer = () => `<footer class="foot">
  <div class="foot-in">
    <span class="foot-logo"><img src="/src/images/taxi/logo.webp" width="640" height="640" alt="VIP Taxi Lanta, Mr. Brown" loading="lazy"></span>
    <div class="foot-col">
      <p class="foot-name">VIP Taxi Lanta</p>
      <p>Mr. Brown, based on Koh Lanta.</p>
      <p><a href="${VIP.maps}">Google Maps listing</a></p>
    </div>
    <div class="foot-col">
      <p class="foot-name">WhatsApp</p>
      <p><a href="https://wa.me/${WA}">+66 95 868 38 46</a></p>
      <p>We usually reply within 6 hours, Thailand time.</p>
    </div>
    <div class="foot-col foot-legal">
      <p>Bookings sold by Zwald Travel Planner Co., Ltd.</p>
      <p><a href="/terms/">Booking terms</a><a href="/legal/">Legal notice</a><a href="/privacy/">Privacy</a></p>
    </div>
  </div>
</footer>`;

// ---------- Feuille de réservation : balisage rendu par le site, inchangé ----------
// Seule la page Krabi Airport–Koh Lanta a déjà la feuille dans _site : pour un autre trajet, on y met ses lieux,
// exactement comme booking.njk le fait avec cfg.from et cfg.to.
function sheetFrom(id) {
  const h = read("_site/taxi/krabi-airport-koh-lanta/index.html");
  let dialog = h.slice(h.indexOf('<dialog class="sheet"'), h.indexOf("</dialog>") + 9);
  const tpl = h.slice(h.indexOf('<template id="book-age-tpl">'), h.indexOf("</template>") + 11);
  const cfg = JSON.parse(h.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);
  if (id && id !== cfg.productId.replace("taxi-", "")) {
    const r = byId[id];
    dialog = dialog.replaceAll("Krabi Airport to Koh Lanta", `${r.from} to ${r.to}`).replaceAll("Koh Lanta to Krabi Airport", `${r.to} to ${r.from}`);
    Object.assign(cfg, { product: `${r.from} to ${r.to}`, productId: `taxi-${id}`, from: r.from, to: r.to, page: `secrettravelandtour.com/taxi/${id}/` });
  }
  return { dialog, tpl, data: `<script type="application/json" id="book-data">${JSON.stringify(cfg)}</script>` };
}
// Mode libre du hub : ce que booking.njk rend sans from/to (deux champs From et To, adresse « Hotel or address »).
function freeSheet() {
  const { dialog, tpl } = sheetFrom();
  const field = (n, l) => `<div class="f">
  <label for="book-${n}">${l}</label>
  <input id="book-${n}" name="${n}" type="text" autocomplete="off" required aria-required="true" aria-describedby="book-e-${n}">
  <p class="err" id="book-e-${n}" hidden></p>
</div>`;
  const product = "Private transfer";
  const d = dialog
    .replace(/<fieldset class="f">\s*<legend>Direction<\/legend>[\s\S]*?<\/fieldset>/, field("from", "From") + "\n" + field("to", "To"))
    .replaceAll("Krabi Airport to Koh Lanta", product)
    .replace(/(data-address-label="" data-out="[^"]*" data-back="[^"]*">)[^<]*/, "$1Hotel or address");
  const cfg = { variant: "taxi", brand: "VIP Taxi Lanta", product, productId: "taxi-request", page: "secrettravelandtour.com/taxi/", whatsapp: WA };
  return { dialog: d, tpl, data: `<script type="application/json" id="book-data">${JSON.stringify(cfg)}</script>` };
}

const scripts = (s) => `${s.dialog}
${s.tpl}
${s.data}
<script src="/_site/js/booking.js" defer></script>
<script src="${DIR}/taxi.js" defer></script>
</body>
</html>
`;

// ---------- Hub ----------
function hub() {
  const view = makeView({ w: 97.55, e: 100.7, s: 6.82, n: 9.55 });
  const mapData = Object.fromEntries(ROUTES.map((r) => [r.id, { name: `${r.from} to ${r.to}`, drive: r.drive || "", ends: [PLACE_OF[r.from], PLACE_OF[r.to]] }]));
  const regions = TR.regions.map((g, gi) => `<section class="region" aria-labelledby="rg-${gi}">
      <h3 id="rg-${gi}">${esc(g.name)}</h3>
      <p class="region-intro">${esc(g.intro)}</p>
      <ul class="rows">${g.routes.map((id) => row(byId[id])).join("")}</ul>
    </section>`).join("\n    ");
  const steps = TAXI.steps.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("");
  const how = TR.common.how.filter((h) => h.title !== "Confirmed on WhatsApp").map((h) => `<div><dt>${esc(h.title)}</dt><dd>${esc(h.text)}</dd></div>`).join("");
  const r = VIP.rating;
  const g = TAXI.gallery.photos;
  return `${head({ title: VIP.legacyText.title, desc: VIP.legacyText.metaDescription })}
${header(true)}
<main id="main">
  <div class="atlas">
    <div class="atlas-map" data-map>
      ${mapSvg({ view, mode: "hub" })}
      <p class="readout" data-readout aria-hidden="true"><span class="readout-hint">Choose a line to see the route.</span></p>
      <script type="application/json" id="map-data">${JSON.stringify(mapData)}</script>
    </div>
    <div class="atlas-side">
      <div class="intro">
        <h1>${esc(TAXI.hero.title)}</h1>
        <p class="lead">${esc(TAXI.hero.lead)}</p>
        <p class="rating"><a href="${r.url}"><span class="rating-num">${r.value.toFixed(1)}</span> on Google, ${r.count} reviews</a></p>
      </div>
      <section class="routes-list" aria-labelledby="routes-h">
        <h2 id="routes-h">${ROUTES.length} routes across the south</h2>
        ${regions}
        <div class="further-box">
          <p><b>Somewhere else?</b> ${esc(TR.further)}</p>
          <a class="btn btn--line" href="https://wa.me/${WA}" data-book>Ask for another trip</a>
        </div>
      </section>
    </div>
  </div>

  <section class="van" aria-labelledby="van-h">
    <div class="van-text">
      <h2 id="van-h">${esc(TAXI.gallery.title)}</h2>
      <p>${esc(VIP.faq.find((f) => f.q.startsWith("Is it a taxi")).a)}</p>
    </div>
    <figure class="van-main"><img src="/src/images/taxi/hero-ceiling-1800.webp" srcset="/src/images/taxi/hero-ceiling-900.webp 900w, /src/images/taxi/hero-ceiling-1800.webp 1800w" sizes="(min-width: 64rem) 60vw, 100vw" width="1800" height="1350" alt="${esc(TAXI.hero.photo.alt)}" loading="lazy"></figure>
    <figure class="van-a"><img src="${g[0].src.replace("/images", "/src/images")}" width="900" height="675" alt="${esc(g[0].alt)}" loading="lazy"></figure>
    <figure class="van-b"><img src="${g[2].src.replace("/images", "/src/images")}" width="900" height="675" alt="${esc(g[2].alt)}" loading="lazy"></figure>
  </section>

  <section class="how" aria-labelledby="how-h">
    <h2 id="how-h">How booking works</h2>
    <ol class="stops">${steps}</ol>
    <dl class="terms">${how}</dl>
    <a class="btn" href="https://wa.me/${WA}" data-book>${waIcon}<span>Request a transfer</span></a>
  </section>

  <section class="questions" aria-labelledby="faq-h">
    <h2 id="faq-h">Questions</h2>
    ${faqList(VIP.faq)}
  </section>

  ${secret()}
</main>
${footer()}
${scripts(freeSheet())}`;
}

// ---------- Page trajet (un gabarit pour les 17) ----------
// Le cadre s'élargit du côté où l'étiquette d'un bout du trajet déborderait, puis garde son rapport.
function routeView(r) {
  const box = routeBox(r);
  const COS = Math.cos((8 * Math.PI) / 180);
  for (let k = 0; k < 4; k++) {
    const v = makeView(box);
    let growE = 0, growW = 0;
    const A = PLACES[PLACE_OF[r.from]], B = PLACES[PLACE_OF[r.to]];
    for (const [P, O] of [[A, B], [B, A]]) {
      const x = v.x(P.lon), w = labelW(P, 40, true) + 0.6 * 40 + 10;
      if (v.x(O.lon) <= x) growE = Math.max(growE, x + w - v.width); else growW = Math.max(growW, w - x);
    }
    if (growE <= 0 && growW <= 0) return v;
    const deg = (u) => Math.max(0, u) / v.k / COS;
    const addW = deg(growW), addE = deg(growE);
    box.w -= addW; box.e += addE;
    const addH = ((addW + addE) * COS) / 1.1 / 2;
    box.s -= addH; box.n += addH;
  }
  return makeView(box);
}
function routePage(id) {
  const r = byId[id];
  const view = routeView(r);
  const A = PLACES[PLACE_OF[r.from]], B = PLACES[PLACE_OF[r.to]];
  const fromLabel = r.code ? `${r.from} (${r.code})` : r.from;
  // Autres trajets : même départ ou même arrivée, ceux qui partagent un lieu avec celui-ci d'abord.
  const shares = (x) => [x.from, x.to].filter((n) => [r.from, r.to].includes(n)).length;
  const others = ROUTES.filter((x) => x.id !== id && shares(x)).sort((a, b) => (a.from === r.from || a.to === r.from ? -1 : 0) - (b.from === r.from || b.to === r.from ? -1 : 0)).slice(0, 6);
  const facts = [
    ["From", fromLabel], ["To", r.to], r.drive ? ["Drive", r.drive] : null,
    ["Price", "Confirmed on WhatsApp"], ["Payment", "Cash to the driver on the day"],
  ].filter(Boolean).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
  const sheet = sheetFrom(id);
  return `${head({ title: r.title, desc: r.metaDescription })}
${header(false)}
<main id="main" class="route">
  <div class="atlas atlas--route">
    <div class="atlas-map atlas-map--route" data-map data-focus="${id}">
      ${mapSvg({ view, mode: "route", focus: r })}
    </div>
    <div class="atlas-side">
      <div class="intro">
        <p class="crumb"><a href="/taxi/">All ${ROUTES.length} routes</a></p>
        <h1>${esc(r.h1)}</h1>
        <p class="lead">${esc(r.lead)}</p>
      </div>
      <dl class="legend">${facts}</dl>
      <a class="btn btn--wide btn--side" href="https://wa.me/${WA}?text=${encodeURIComponent("Transfer request: " + r.from + " to " + r.to)}" data-book>${waIcon}<span>Request this transfer</span></a>
      <div class="body">${r.body.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      <section class="questions questions--route" aria-labelledby="faq-h">
        <h2 id="faq-h">Questions about this route</h2>
        ${faqList([...r.faq, ...TR.common.faq.filter((c) => !r.faq.some((f) => f.a.split(" ").slice(0, 4).join(" ") === c.a.split(" ").slice(0, 4).join(" ")))])}
      </section>
    </div>
  </div>

  <section class="near" aria-labelledby="near-h">
    <div class="near-text">
      <h2 id="near-h">More routes from ${esc(r.from)} and ${esc(r.to)}</h2>
      <p><a href="/taxi/">See all ${ROUTES.length} routes on the map</a></p>
    </div>
    <ul class="rows rows--near">${others.map((x) => row(x)).join("")}</ul>
    <figure class="near-photo"><img src="/src/images/taxi/van-exterior.webp" width="900" height="675" alt="Silver minivan seen from the side, parked on the street" loading="lazy"></figure>
  </section>

  ${secret()}
</main>
${footer()}
<aside class="bar" aria-label="Book this route">
  <p class="bar-route"><span>${esc(r.from)}</span> <span>to ${esc(r.to)}</span></p>
  <a class="btn" href="https://wa.me/${WA}?text=${encodeURIComponent("Transfer request: " + r.from + " to " + r.to)}" data-book>Request this transfer</a>
</aside>
${scripts(sheet)}`;
}

writeFileSync(new URL("hub.html", OUT), hub());
for (const id of ["krabi-airport-koh-lanta", "krabi-airport-khao-lak"]) writeFileSync(new URL(`${id}.html`, OUT), routePage(id));
// Les 17 pages tiennent dans le gabarit : on les génère aussi, hors livrable, pour contrôle.
if (process.argv.includes("--all")) mkdirSync(new URL("all/", OUT), { recursive: true });
if (process.argv.includes("--all")) for (const r of ROUTES) writeFileSync(new URL(`all/${r.id}.html`, OUT), routePage(r.id));
console.log("ok");
