// Gestion en ligne (17.11.2026) : copie des demandes de la feuille vers demande-site, bandeau d'information lu sur
// bandeau-site, politique de confidentialité. Contrats : Site_Anais docs/gestion/demandes-site.md et bandeau-site.md.
// Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");
const N = require("../src/js/notice.js");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const read = (rel) => fs.readFileSync(path.join(SITE, rel, "index.html"), "utf8");
const bookData = (rel) => JSON.parse(read(rel).match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
const FIELDS = ["brand", "product_id", "product", "option", "option_label", "date", "time", "adults", "children", "pickup", "name", "estimated_total", "currency", "ref", "page_url", "message", "website", B.PHONE_FIELD];

// ---------- Demandes ----------
test("corps de la demande : exactement les champs du contrat, marque secret ou taxi, message WhatsApp inchangé", () => {
  const today = "2026-11-17";
  const cases = [
    ["tours/4-islands", "secret", (c) => ({ option: c.options[0].id, dateChoice: "other", dateOther: "2026-11-20", adults: 2, childAges: [7], pickup: "Pimalai Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" })],
    ["transfers", "secret", () => ({ dateChoice: "tomorrow", time: "09:30", adults: 3, pickupAt: "Krabi Airport", dropoffAt: "Lanta Sand Resort", firstName: "Ben", lastName: "Okafor", phoneCode: "DE", phone: "0151 23456789" })],
    ["taxi/krabi-airport-koh-lanta", "taxi", () => ({ dateChoice: "other", dateOther: "2026-12-01", time: "14:35", adults: 2, flight: "FD3129", pickupAt: "Krabi Airport", dropoffAt: "Pimalai Resort", firstName: "Chloé", lastName: "Martin", phoneCode: "FR", phone: "06 12 34 56 78" })],
    ["tours/rental", "secret", (c) => ({ option: c.options[0].id, dateFrom: "2026-11-20", dateTo: "2026-11-23", firstName: "Dan", lastName: "Levi", phoneCode: "other", phoneOther: "+972", phone: "50 123 4567", pickup: "Long Beach" })]
  ];
  for (const [rel, brand, fill] of cases) {
    const cfg = bookData(rel);
    const state = Object.assign(B.emptyState(cfg), fill(cfg), { today });
    const message = B.buildMessage(cfg, state);
    const body = B.demandeBody(cfg, state, message, "", "https://secrettravelandtour.com/" + rel + "/#book");
    assert.deepEqual(Object.keys(body), FIELDS, rel);
    assert.equal(body.brand, brand, rel);
    assert.equal(body.product_id, cfg.productId);
    assert.match(body.product_id, /^[a-z0-9-]{1,60}$/);
    assert.equal(body.message, message, "le texte exact envoyé à WhatsApp");
    assert.doesNotMatch(body.message, /\nRef: /, "pas de ligne Ref tant que Jérémy n'a pas décidé");
    assert.equal(body.ref, "");
    assert.equal(body.website, "");
    assert.equal(body.currency, "THB");
    assert.equal(body.page_url, "https://secrettravelandtour.com/" + rel + "/", "sans le #");
    assert.ok(body.date === "" || /^\d{4}-\d{2}-\d{2}$/.test(body.date), rel);
    assert.ok(body.time === "" || /^\d{2}:\d{2}$/.test(body.time), rel);
    assert.ok(JSON.stringify(body).length < 4096, rel);
  }
  // Champ piège rempli : transmis tel quel (Gestion n'écrit rien et répond 202).
  const cfg = bookData("tours/4-islands");
  assert.equal(B.demandeBody(cfg, B.emptyState(cfg), "x", "spam", "").website, "spam");
});

test("envoi : fetch keepalive en text/plain, sans cookie, jamais attendu, toute erreur avalée", () => {
  const saved = global.fetch;
  try {
    const calls = [];
    global.fetch = (url, init) => { calls.push([url, init]); return Promise.reject(new Error("offline")); };
    assert.equal(B.sendCopy({ a: 1 }), undefined, "rien à attendre");
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "https://lkxqcmzeidlyssoqmqkh.supabase.co/functions/v1/demande-site");
    assert.deepEqual({ ...calls[0][1], body: JSON.parse(calls[0][1].body) }, { method: "POST", body: { a: 1 }, keepalive: true, mode: "cors", credentials: "omit", headers: { "Content-Type": "text/plain;charset=UTF-8" } });
    global.fetch = () => { throw new Error("boom"); };
    assert.doesNotThrow(() => B.sendCopy({ a: 1 }));
  } finally { global.fetch = saved; }
});

test("la copie part dans le submit, après buildMessage et avant window.open, sans await ni then", () => {
  const js = src("src/js/booking.js");
  const submit = js.slice(js.indexOf('form.addEventListener("submit"'), js.indexOf('// « Add to my trip list »'));
  const iMsg = submit.indexOf("message = buildMessage(config, state);");
  const iSend = submit.indexOf("sendCopy(demandeBody(config, state, message,");
  const iOpen = submit.indexOf('window.open(url, "_blank")');
  assert.ok(iMsg > -1 && iSend > iMsg && iOpen > iSend, "ordre : message, copie, WhatsApp");
  assert.doesNotMatch(submit.slice(iSend, iOpen), /await|\.then\(/);
  assert.doesNotMatch(submit, /\basync\b/);
});

test("aucune requête hors d'un envoi : l'adresse seulement dans booking.js, appelée par la feuille et la liste de sorties", () => {
  for (const f of fs.readdirSync(path.join(ROOT, "src", "js"))) {
    const n = (src("src/js/" + f).match(/functions\/v1\/demande-site/g) || []).length;
    assert.equal(n, f === "booking.js" ? 1 : 0, f);
    if (!["booking.js", "v4-trips.js"].includes(f)) assert.doesNotMatch(src("src/js/" + f), /sendCopy/, f);
  }
  assert.equal((src("src/js/booking.js").match(/sendCopy\(/g) || []).length, 2, "définition et un seul appel, dans le submit");
  assert.equal((src("src/js/v4-trips.js").match(/B\.sendCopy/g) || []).length, 2, "liste : test de présence et un seul envoi");
  // Champ piège : hors de l'écran, masqué pour Clarity, jamais dans le message (pas dans l'état de la feuille).
  const h = read("tours/4-islands");
  assert.match(h, /<div class="hp" aria-hidden="true"><label for="bk-website">Website<\/label><input data-clarity-mask="True" id="bk-website" name="website" type="text" tabindex="-1" autocomplete="off"><\/div>/);
  assert.ok(!("website" in B.emptyState({})));
  assert.match(src("src/css/booking.css"), /\.hp \{ position: absolute; left: -10000px;/);
});

// ---------- Bandeau ----------
const NOW = Date.parse("2026-11-17T06:00:00Z");
const banner = (o) => Object.assign({ id: "b1", brands: ["secret"], type: "info", text: "We answer on WhatsApp from 8:00 to 20:00.", link: null, target: { kind: "all" }, closable: true, priority: 2, starts_at: "2026-11-16T00:00:00Z", ends_at: null, card_label: null }, o);

test("choix : marque, section, produit, dates, fermés, priorité puis type ; liste vide, erreur ou bandeau mal formé = rien", () => {
  const page = { brand: "secret", section: "islands", product: "4-islands" };
  assert.equal(N.choose(null, page, NOW, []), null);
  assert.equal(N.choose({ banners: [] }, page, NOW, []), null);
  assert.equal(N.choose({ version: 1 }, page, NOW, []), null);
  assert.equal(N.choose({ banners: [{ id: "x" }, banner({ type: "bogus" }), banner({ type: "constructor" }), banner({ text: "" })] }, page, NOW, []), null);
  assert.equal(N.choose({ banners: [banner({ brands: ["taxi"] })] }, page, NOW, []), null);
  assert.equal(N.choose({ banners: [banner({ target: { kind: "sections", sections: ["taxi"] } })] }, page, NOW, []), null);
  assert.equal(N.choose({ banners: [banner({ ends_at: "2026-11-17T00:00:00Z" })] }, page, NOW, []), null);
  assert.equal(N.choose({ banners: [banner({ starts_at: "2026-11-18T00:00:00Z" })] }, page, NOW, []), null);
  assert.equal(N.choose({ banners: [banner({})] }, page, NOW, ["b1"]), null);
  assert.equal(N.choose({ banners: [banner({ closable: false })] }, page, NOW, ["b1"]).id, "b1", "non fermable : toujours là");
  const pick = N.choose({ banners: [banner({ id: "i" }), banner({ id: "u", type: "urgent" }), banner({ id: "s", type: "sea", target: { kind: "products", products: ["4-islands"] } })] }, page, NOW, []);
  assert.equal(pick.id, "u", "même priorité : urgent d'abord");
  assert.equal(N.choose({ banners: [banner({ id: "u", type: "urgent", priority: 3 }), banner({ id: "i", priority: 1 })] }, page, NOW, []).id, "i", "priorité d'abord");
});

test("lien : un chemin du site ou WhatsApp avec le numéro du site, rien d'autre", () => {
  assert.deepEqual(N.linkOf(banner({ link: { kind: "page", href: "/tours/4-islands/", label: "See 4 Islands" } }), "66958683846"), { href: "/tours/4-islands/", label: "See 4 Islands", blank: false });
  assert.equal(N.linkOf(banner({ link: { kind: "page", href: "https://evil.example/", label: "x" } }), "1"), null);
  assert.equal(N.linkOf(banner({ link: { kind: "page", href: "//evil.example/", label: "x" } }), "1"), null);
  assert.equal(N.linkOf(banner({ link: { kind: "page", href: "javascript:alert(1)", label: "x" } }), "1"), null);
  assert.equal(N.linkOf(banner({ link: { kind: "page", href: "/\\evil.example/", label: "x" } }), "1"), null, "antislash : un navigateur le lit comme //");
  assert.deepEqual(N.linkOf(banner({ link: { kind: "whatsapp", label: "Ask on WhatsApp", text: "Hello & bye" } }), "66958683846"), { href: "https://wa.me/66958683846?text=Hello%20%26%20bye", label: "Ask on WhatsApp", blank: true });
});

// DOM minimal : assez pour build() (createElement, createElementNS, attributs, enfants, textContent).
function fakeDoc() {
  const el = (tag) => ({ tag, attrs: {}, children: [], className: "", _text: "", set textContent(v) { this._text = String(v); this.children = []; }, get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; }, appendChild(c) { this.children.push(c); return c; } });
  return { createElement: el, createElementNS: (ns, tag) => el(tag), createTextNode: (t) => ({ textContent: t }) };
}
const all = (n, f, acc = []) => { if (f(n)) acc.push(n); (n.children || []).forEach((c) => all(c, f, acc)); return acc; };

test("chaque type se rend : classe, rôle, icône, texte en textContent, lien, croix seulement si fermable", () => {
  for (const type of ["info", "sea", "season", "new", "urgent"]) {
    const box = N.build(fakeDoc(), banner({ id: "id-" + type, type, text: "<b>Rough sea</b> today", link: { kind: "page", href: "/tours/", label: "See trips" } }), "66958683846");
    assert.equal(box.tag, "aside");
    assert.equal(box.className, "site-notice site-notice--" + type);
    assert.equal(box.attrs.role, type === "urgent" ? "alert" : "region");
    assert.equal(box.attrs["data-notice-id"], "id-" + type);
    assert.equal(all(box, (n) => n.tag === "svg").length, 2, "icône et croix");
    const p = all(box, (n) => n.className === "site-notice__text")[0];
    assert.equal(p._text, "<b>Rough sea</b> today", "texte brut, jamais interprété comme HTML");
    const a = all(box, (n) => n.className === "site-notice__link")[0];
    assert.equal(a.href, "/tours/");
  }
  const fixed = N.build(fakeDoc(), banner({ closable: false }), "1");
  assert.equal(all(fixed, (n) => n.className === "site-notice__close").length, 0);
});

test("texte long (600 au plus) : replié par « More » avec aria-expanded, lien sous le texte, retours à la ligne gardés, texte brut", () => {
  assert.equal(N.TEXT_MAX, 600);
  assert.equal(N.isLong("x".repeat(140)), false, "140 : rendu d'avant");
  assert.equal(N.isLong("x".repeat(141)), true);
  assert.equal(N.isLong("Christmas week\nTransfers run as usual."), true, "un retour à la ligne suffit");
  assert.equal(N.cleanText("A  \r\nB\n\n\n\nC  "), "A\nB\n\nC", "deux retours au plus, espaces de fin retirés");
  assert.equal(N.cleanText("y".repeat(700)).length, 600, "coupé à la limite du contrat");
  // Caractères visibles comptés en points de code, comme Postgres et le compteur de Gestion : un emoji ou un drapeau ne compte pas double.
  const emoji = "\u{1F30A}", drapeau = "\u{1F1F9}\u{1F1ED}";
  assert.equal(N.isLong(emoji.repeat(140)), false, "140 emoji : 280 unités UTF-16 mais 140 caractères");
  assert.equal(N.isLong(emoji.repeat(141)), true);
  assert.equal(N.isLong(drapeau.repeat(70)), false, "70 drapeaux = 140 points de code");
  assert.equal(Array.from(N.cleanText(emoji.repeat(700))).length, 600, "coupé à 600 caractères");
  assert.equal(N.cleanText(emoji.repeat(700)), emoji.repeat(600), "jamais une moitié d'emoji");
  const pe = all(N.build(fakeDoc(), banner({ text: emoji.repeat(140) }), "1"), (n) => n.className === "site-notice__text")[0];
  assert.equal(pe._text, emoji.repeat(140), "140 emoji : texte entier, rendu d'avant");
  const text = "<b>Rough</b> sea. " + "Boats leave later today. ".repeat(20);
  const box = N.build(fakeDoc(), banner({ id: "b-long", text, link: { kind: "page", href: "/tours/", label: "See trips" } }), "1");
  assert.equal(box.className, "site-notice site-notice--info site-notice--long");
  const p = all(box, (n) => n.className === "site-notice__text")[0];
  assert.equal(p._text, N.cleanText(text), "texte brut, jamais interprété comme HTML");
  assert.equal(p.children.length, 0, "le lien n'est plus dans le texte replié");
  const more = all(box, (n) => n.className === "site-notice__more")[0];
  assert.equal(more.tag, "button");
  assert.equal(more.type, "button");
  assert.equal(more._text, "More");
  assert.equal(more.attrs["aria-expanded"], "false");
  assert.equal(more.attrs["aria-controls"], p.id);
  assert.equal(p.id, "site-notice-text-b-long");
  const row = all(box, (n) => n.className === "site-notice__actions")[0];
  assert.deepEqual(row.children.map((n) => n.className), ["site-notice__more", "site-notice__link"], "More puis le lien, visibles replié");
  assert.equal(all(box, (n) => n.className === "site-notice__close").length, 1);
  // 140 caractères au plus sans retour à la ligne : exactement le rendu d'avant (texte puis lien dans le même paragraphe).
  const short = N.build(fakeDoc(), banner({ text: "x".repeat(140), link: { kind: "page", href: "/tours/", label: "See trips" } }), "1");
  assert.equal(short.className, "site-notice site-notice--info");
  const sp = all(short, (n) => n.className === "site-notice__text")[0];
  assert.equal(sp._text, "x".repeat(140));
  assert.equal(sp.children[1].className, "site-notice__link");
  assert.equal(all(short, (n) => n.className === "site-notice__more").length, 0);
});

test("texte long : style replié sur deux lignes, ouvert sans animation, zone de toucher de 44 px, Échap referme", () => {
  const js = src("src/js/notice.js");
  assert.match(js, /\.site-notice--long \.site-notice__text\{white-space:pre-line;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden\}/);
  assert.match(js, /\.site-notice--long\.is-open \.site-notice__text\{display:block;-webkit-line-clamp:none/);
  assert.match(js, /width:max\(100% \+ 16px,44px\);height:44px/);
  assert.match(js, /more\.setAttribute\("aria-expanded", open \? "true" : "false"\)/);
  assert.match(js, /more\.textContent = open \? "Less" : "More"/);
  assert.match(js, /e\.key !== "Escape"/);
  assert.doesNotMatch(js, /site-notice--long[^"]*transition|marquee|@keyframes/, "aucun texte qui défile, aucune animation");
  assert.match(js, /\.site-notice--long \.site-notice__inner\{padding-bottom:13px\}/, "la zone de 44 px de la dernière ligne reste dans le bandeau");
  assert.match(js, /p\.setAttribute\("role", "region"\); p\.setAttribute\("aria-label", "Notice text"\)/, "texte ouvert qui défile : focusable et nommé");
  assert.match(js, /replace\(\/\[\\s\.,;:!\?\\u2014\\u2013-\]\+\$\/, ""\) \+ "\\u2026"/, "coupe sur un mot, sans ponctuation ni espace avant « … »");
});

test("bandeau du haut : sa hauteur est réservée sous l'en-tête (--notice-h), posée avant l'affichage d'après la page précédente", () => {
  const css = src("src/css/v4.css");
  assert.match(css, /padding-top: calc\(var\(--hd\) \+ var\(--notice-h, 0px\)\);/, "le corps réserve en-tête et bandeau");
  assert.match(css, /scroll-padding-top: calc\(var\(--hd\) \+ var\(--notice-h, 0px\) \+ 16px\)/, "ancres sous le bandeau");
  assert.doesNotMatch(src("src/css/v4.css") + src("src/css/v4-transfers.css") + src("src/css/v4-guides.css"), /calc\(var\(--hd\) \+ (?!var\(--notice-h)/, "chaque décalage sous l'en-tête compte aussi le bandeau");
  const js = src("src/js/notice.js");
  assert.match(js, /setProperty\("--notice-h", h \+ "px"\)/);
  assert.match(js, /new ResizeObserver\(height\)/, "mise à jour au dépli, au repli et au redimensionnement");
  assert.match(js, /box\.remove\(\);\n\s+watch\(null\);\n\s+height\(\);/, "remise à zéro à la fermeture");
  const h = read("");
  const inline = h.match(/<script>try\{var n=JSON\.parse\(sessionStorage\.getItem\("stt-notice-h:secret::"\)\);if\(n&&n\.w===innerWidth&&n\.h>0\)document\.documentElement\.style\.setProperty\("--notice-h",n\.h\+"px"\)\}catch\(e\)\{\}<\/script>/);
  assert.ok(inline, "réservation posée dans le head, avant le rendu");
  assert.ok(h.indexOf(inline[0]) < h.indexOf("</head>"));
  assert.match(read("tours/4-islands"), /sessionStorage\.getItem\("stt-notice-h:secret:islands:4-islands"\)/, "clé du contexte de la page, la même que notice.js");
  assert.match(js, /"stt-notice-h:" \+ \(tag\.getAttribute\("data-notice-brand"\) \|\| ""\) \+ ":" \+ \(tag\.getAttribute\("data-notice-section"\) \|\| ""\) \+ ":" \+ \(tag\.getAttribute\("data-notice-product"\) \|\| ""\)/);
});

test("pages : contexte du bandeau sur chaque page, script différé, styles des deux marques, mesure après « Accept »", () => {
  const ctx = (rel) => read(rel).match(/<script defer(?:="")? src="\/js\/notice\.js\?v=[^"]+" data-notice-brand="([^"]*)" data-notice-section="([^"]*)" data-notice-product="([^"]*)" data-notice-wa="(\d+)"><\/script>/).slice(1);
  assert.deepEqual(ctx("tours/4-islands"), ["secret", "islands", "4-islands", "66958683846"]);
  assert.deepEqual(ctx("tours/elephant-sanctuary"), ["secret", "activities", "elephant-sanctuary", "66958683846"]);
  assert.deepEqual(ctx("tours/speedboat"), ["secret", "transfers", "speedboat-ferry", "66958683846"]);
  assert.deepEqual(ctx("tours/rental"), ["secret", "rental", "rental", "66958683846"]);
  assert.deepEqual(ctx("taxi/krabi-airport-koh-lanta"), ["taxi", "taxi", "krabi-airport-koh-lanta", "66958683846"]);
  assert.deepEqual(ctx("taxi/songthaew"), ["taxi", "taxi", "", "66958683846"]);
  assert.deepEqual(ctx("taxi"), ["taxi", "taxi", "", "66958683846"]);
  assert.deepEqual(ctx(""), ["secret", "", "", "66958683846"]);
  const js = src("src/js/notice.js");
  for (const t of ["info", "sea", "season", "new", "urgent"]) {
    assert.match(js, new RegExp(`\\.site-notice--${t}\\{`), "Secret " + t);
    assert.match(js, new RegExp(`\\[data-brand=vip\\] \\.site-notice--${t}\\{`), "VIP " + t);
  }
  assert.doesNotMatch(js, /innerHTML/);
  assert.match(js, /position:fixed/, "jamais dans le flux : aucun saut de mise en page");
  const c = src("src/js/consent.js");
  assert.match(c, /track\(k === "click" \? "banner_click" : "notice_" \+ k, \{ type: type \}\)/);
});

test("confidentialité : la copie dans l'outil de réservation, ses champs, rien pour un annonceur", () => {
  const h = read("privacy");
  assert.doesNotMatch(h, /send nothing to our servers|Nothing reaches us until/);
  assert.match(h, /A copy of each request sent from a booking form is stored in our booking tool/);
  for (const f of ["the trip or route and the option you chose", "the date", "the pickup time of a transfer", "the number of adults and of children", "the pickup place or hotel", "your first and last name", "your WhatsApp number", "the estimated price shown in the form", "the address of the page", "the text of the WhatsApp message"]) assert.ok(h.includes(f), f);
  assert.match(h, /Nothing is sent to an advertiser\./);
  assert.match(h, /Supabase hosts our booking tool/);
});

// ---------- Liste de sorties : une copie par sortie (17.11.2026) ----------
const catalog = () => JSON.parse(fs.readFileSync(path.join(SITE, "data", "catalog.json"), "utf8"));
const tripList = (n, extra = {}) => {
  const cat = catalog(), slugs = Object.keys(cat);
  return { items: slugs.slice(0, n).map((s, i) => ({ id: "t" + i, slug: s, option: (cat[s].options[0] || {}).id, date: "2026-12-" + (20 - i), addons: [], choices: {}, counts: {} })), adults: 2, childAges: [7], pickup: "Pimalai Resort", firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123", ...extra };
};

test("liste de sorties : N sorties donnent N copies (5 au plus, limite par appareil), champs du contrat, texte exact", () => {
  const cat = catalog();
  for (const n of [1, 3, 5, 8]) {
    const l = tripList(n);
    const msg = B.buildTripList(cat, l);
    const bodies = B.tripListBodies(cat, l, msg, "", "https://secrettravelandtour.com/tours/#trips");
    assert.equal(bodies.length, Math.min(n, 5), n + " sorties");
    for (const b of bodies) {
      assert.deepEqual(Object.keys(b), FIELDS);
      assert.equal(b.brand, "secret");
      assert.ok(cat[b.product_id], b.product_id);
      assert.match(b.date, /^2026-12-\d{2}$/);
      assert.equal(b.message, msg.slice(0, 2000));
      assert.equal(b.ref, "");
      assert.equal(b.page_url, "https://secrettravelandtour.com/tours/");
      assert.equal(b.adults, 2);
      assert.equal(b.children, 1);
      assert.ok(Buffer.byteLength(JSON.stringify(b)) <= 4096);
    }
    // Ordre du message : par date.
    assert.deepEqual(bodies.map((b) => b.date), bodies.map((b) => b.date).slice().sort());
  }
  assert.equal(B.TRIP_COPIES_MAX, 5);
  // Rien d'inventé : une sortie sans date ni option choisie part avec ces champs vides.
  const l = { items: [{ id: "x", slug: "koh-phi-phi", option: "", date: "" }], adults: 1, childAges: [] };
  const [b] = B.tripListBodies(cat, l, "Trip list: 1 trip", "", "");
  assert.equal(b.date, "");
  assert.equal(b.option, "");
  assert.equal(b.estimated_total, null);
  // Message très long : raccourci à 2 000 caractères, corps sous 4 096 octets.
  const [big] = B.tripListBodies(cat, tripList(1), "– ".repeat(3000), "", "");
  assert.ok(big.message.length <= 2000 && Buffer.byteLength(JSON.stringify(big)) <= 4096);
});

test("liste de sorties : copies dans le clic d'envoi, après la validation, sans annuler le lien ni attendre", () => {
  const js = src("src/js/v4-trips.js");
  const handler = js.slice(js.indexOf('foot.addEventListener("click"'), js.indexOf('document.addEventListener("trips-change"'));
  const iStop = handler.indexOf("if (first || v.count) {");
  const iCopy = handler.indexOf("B.tripListBodies(cat, l, text,");
  assert.ok(iStop > -1 && iCopy > iStop, "rien ne part si la validation arrête l'envoi");
  assert.doesNotMatch(handler.slice(iCopy), /preventDefault|await|\.then\(/);
  assert.match(handler, /copied\.indexOf\(text\) < 0/, "un même message copié une fois par page");
  assert.match(js, /<input data-clarity-mask="True" id="tl-website" name="website" type="text" tabindex="-1" autocomplete="off">/);
});
