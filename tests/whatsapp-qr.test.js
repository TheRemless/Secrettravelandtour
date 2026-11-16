// WhatsApp sur un ordinateur : scanner le QR code ou ouvrir WhatsApp ici (Jérémy, 16.11.2026).
// Encodeur QR maison (src/js/wa-qr.js), panneau réservé aux ordinateurs, QR code de l'écran final de la feuille,
// événements whatsapp_qr_shown et whatsapp_desktop_open. Lancer le build avant (lecture de _site/).
// Le décodage réel des codes (40 versions × 4 niveaux, captures du panneau) se vérifie dans Chrome (BarcodeDetector),
// pas ici : node n'a pas de lecteur de QR code.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Q = require("../src/js/wa-qr.js");
const B = require("../src/js/booking.js");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const pages = () => {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!rel && /^(_v4|design|docs|src|img|css|js|images|data)$/.test(e.name)) continue; walk(path.join(d, e.name), rel + "/" + e.name); }
      else if (e.name === "index.html" || (!rel && e.name === "404.html")) out.push(path.join(d, e.name));
    }
  };
  walk(SITE, "");
  return out;
};

// Repère de position 7 × 7 (anneaux foncé, clair, carré foncé de 3 × 3) au coin (x, y).
function finderAt(m, x, y) {
  for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
    const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
    if (m[y + dy][x + dx] !== (d !== 2)) return false;
  }
  return true;
}

test("encodeur : taille 4v + 17, trois repères, ligne de synchronisation, module foncé fixe", () => {
  for (const len of [1, 30, 200, 800, 2000, 2900]) {
    const q = Q.encode("x".repeat(len));
    assert.ok(q, String(len));
    assert.equal(q.size, q.version * 4 + 17);
    assert.equal(q.modules.length, q.size);
    assert.ok(finderAt(q.modules, 0, 0) && finderAt(q.modules, q.size - 7, 0) && finderAt(q.modules, 0, q.size - 7), String(len));
    for (let i = 8; i < q.size - 8; i++) { assert.equal(q.modules[6][i], i % 2 === 0); assert.equal(q.modules[i][6], i % 2 === 0); }
    assert.equal(q.modules[q.size - 8][8], true);
  }
});

test("encodeur : plus petite version au niveau L, puis le niveau le plus haut qui tient dans la même version", () => {
  // Lien seul : version 2, assez de place pour plus de correction qu'avec L.
  const short = Q.encode("https://wa.me/66958683846");
  assert.equal(short.version, 2);
  assert.notEqual(short.level, "L");
  // Capacités de la norme en mode octet, niveau L : 17 octets en version 1, 2 953 en version 40.
  assert.equal(Q.encode("x".repeat(17)).version, 1);
  assert.equal(Q.encode("x".repeat(18)).version, 2);
  assert.equal(Q.encode("x".repeat(2953)).version, 40);
  assert.equal(Q.encode("x".repeat(2954)), null);
  // Niveau H imposé : 7 octets en version 1 (capacité de la norme).
  assert.equal(Q.encode("x".repeat(7), 3).version, 1);
  assert.equal(Q.encode("x".repeat(8), 3).version, 2);
  // Texte non ASCII : compté en octets UTF-8.
  assert.equal(Q.encode("é".repeat(8)).version, 1);
  assert.equal(Q.encode("é".repeat(9)).version, 2);
});

test("message réel de la feuille : un QR code de taille lisible, exactement le lien wa.me", () => {
  const url = B.waUrl("Booking request: 4 Islands\nDate: Thu 24 Dec\nGuests: 2 adults, 1 child (7)\nPickup: Pimalai Resort, Ba Kantiang Beach\nName: Anna");
  const q = Q.encode(url);
  assert.ok(q.version <= 15, "version " + q.version);
  const svg = Q.svg(q, "QR code");
  assert.match(svg, /^<svg[^>]*viewBox="0 0 (\d+) \1"[^>]*shape-rendering="crispEdges"/);
  assert.equal(Number(svg.match(/viewBox="0 0 (\d+)/)[1]), q.size + 8, "marge de 4 modules de chaque côté");
  // 3 px par module, entre 216 et 480 px.
  assert.equal(Q.displaySize(Q.encode("x")), 216);
  assert.equal(Q.displaySize(q), Math.max(216, Math.min(480, (q.size + 8) * 3)));
  assert.equal(Q.displaySize(Q.encode("x".repeat(2900))), 480);
});

test("panneau : ordinateur seulement (souris et fenêtre large), jamais sur un téléphone ou une tablette", () => {
  assert.equal(Q.DESKTOP, "(hover: hover) and (pointer: fine) and (min-width: 900px)");
  const js = src("src/js/wa-qr.js");
  // Le clic n'est intercepté que si la requête correspond, et jamais avec Ctrl, Cmd, Maj ou Alt.
  assert.match(js, /if \(!mq\.matches \|\| e\.defaultPrevented \|\| e\.button !== 0 \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.shiftKey \|\| e\.altKey\) return;/);
  // Les liens de la feuille (ouverture, écran final) gardent leur comportement.
  assert.match(js, /a\.hasAttribute\("data-book"\) && doc\.getElementById\("book"\)/);
  assert.match(js, /a\.closest\("#book"\)/);
  // Textes demandés par Jérémy.
  assert.match(js, /Scan with your phone\\'s camera to open WhatsApp/);
  assert.match(js, /Open WhatsApp on this computer/);
  // Aucun script ni service extérieur.
  assert.doesNotMatch(js, /https?:\/\/(?!wa\.me|api\.whatsapp\.com|www\.w3\.org)/);
});

test("écran final de la feuille : QR code du message sur ordinateur, rien sur téléphone", () => {
  const saved = { window: global.window, document: global.document, CustomEvent: global.CustomEvent };
  const events = [];
  global.document = { dispatchEvent: (e) => events.push(e) };
  global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  const box = () => {
    const slot = { style: {}, innerHTML: "", attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
    return { hidden: true, slot, querySelector: () => slot };
  };
  const url = B.waUrl("Booking request: 4 Islands");
  try {
    global.window = { matchMedia: (q) => ({ matches: false, media: q }) };
    const phone = box();
    Q.doneScreen(phone, url);
    assert.equal(phone.hidden, true);
    assert.equal(phone.slot.innerHTML, "");
    assert.equal(events.length, 0);

    global.window = { matchMedia: (q) => ({ matches: q === Q.DESKTOP }) };
    const desk = box();
    Q.doneScreen(desk, url);
    assert.equal(desk.hidden, false);
    assert.match(desk.slot.innerHTML, /^<svg/);
    assert.deepEqual(events.map((e) => [e.type, e.detail.placement]), [["stt-wa-qr-shown", "sheet_done"]]);
  } finally {
    Object.assign(global, saved);
  }
});

test("mesure : whatsapp_qr_shown et whatsapp_desktop_open passent par consent.js, après « Accept » seulement", () => {
  const c = src("src/js/consent.js");
  assert.match(c, /addEventListener\("stt-wa-qr-shown", function \(e\) \{ track\("whatsapp_qr_shown", \{ placement:/);
  assert.match(c, /addEventListener\("stt-wa-desktop-open", function \(e\) \{ track\("whatsapp_desktop_open", \{ placement:/);
  assert.match(c, /whatsapp_qr_shown: 1, whatsapp_desktop_open: 1/);
  // Le bouton du panneau ne compte pas un second whatsapp_click ; whatsapp_click reste pour le lien d'origine.
  assert.match(c, /if \(el\.hasAttribute\("data-wa-desktop"\)\) return;/);
  assert.match(c, /if \(WA\.test\(href\)\) return track\("whatsapp_click"/);
  // track() ne fait rien avant « Accept ».
  assert.match(c, /function track\(name, params\) \{\s*if \(!on\) return;/);
  const js = src("src/js/wa-qr.js");
  assert.match(js, /emit\(doc, "stt-wa-desktop-open", \{ placement: where \}\)/);
  assert.match(js, /emit\(doc, "stt-wa-qr-shown", \{ placement: where \}\)/);
});

test("pages générées : wa-qr.js sur chaque page qui a un lien WhatsApp, emplacement du QR sur chaque écran final", () => {
  let withWa = 0;
  for (const f of pages()) {
    const h = fs.readFileSync(f, "utf8");
    if (!/href="https:\/\/wa\.me\//.test(h)) continue;
    withWa++;
    assert.match(h, /<script defer(?:="")? src="\/js\/wa-qr\.js\?v=[^"]+" data-wa-reply="within 6 hours, Thailand time"><\/script>/, path.relative(SITE, f));
    if (/data-screen="done"/.test(h)) {
      assert.match(h, /<div class="done-qr" data-waqr-done(?:="")? hidden(?:="")?>\s*<div class="done-qr__code" data-waqr-slot(?:="")?><\/div>/, path.relative(SITE, f));
      assert.match(h, /Scan with your phone(?:'|&#39;|’)s camera to open WhatsApp with your message\./, path.relative(SITE, f));
    }
  }
  assert.ok(withWa > 40, "pages avec un lien WhatsApp : " + withWa);
  assert.ok(fs.existsSync(path.join(SITE, "js", "wa-qr.js")));
  // booking.js passe le même lien que celui ouvert à l'envoi.
  assert.match(src("src/js/booking.js"), /window\.STT_WAQR\.doneScreen\(dialog\.querySelector\("\[data-waqr-done\]"\), url\)/);
});
