// Fenêtre de consentement centrée sur ordinateur (Jérémy, 17.11.2026), bande du bas sur téléphone (PR 45, inchangée).
// consent.js tourne ici dans un petit DOM factice (vm) : ouverture, focus, tabulation gardée, Échap = refus, fond sans effet,
// défilement bloqué puis rendu, « Cookie settings », et rien de chargé avant « Accept ».
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const JS = fs.readFileSync(path.join(__dirname, "..", "src", "js", "consent.js"), "utf8");

function classes() {
  const s = new Set();
  return { add: (...c) => c.forEach((x) => s.add(x)), remove: (...c) => c.forEach((x) => s.delete(x)), contains: (c) => s.has(c), toString: () => [...s].join(" ") };
}

function run({ desk, saved = null }) {
  const store = new Map();
  if (saved) store.set("stt-consent", JSON.stringify({ s: saved, t: Date.now() }));
  const docHandlers = {};
  let doc;
  const el = (tag, extra = {}) => {
    const e = {
      tagName: tag.toUpperCase(), attrs: {}, handlers: {}, children: [], style: { setProperty() {} }, classList: classes(), open: false, modal: false,
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
      removeAttribute(k) { delete this.attrs[k]; }, hasAttribute(k) { return k in this.attrs; },
      addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); }, removeEventListener() {},
      appendChild(c) { this.children.push(c); return c; },
      focus() { doc.activeElement = this; },
      closest() { return null; },
      getBoundingClientRect() { return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }; },
      ...extra
    };
    return e;
  };
  // Le bandeau : innerHTML lu pour en tirer le lien Privacy et les deux boutons, dans l'ordre du texte.
  const dialog = () => {
    const d = el("dialog", {
      showModal() { this.open = true; this.modal = true; },
      show() { this.open = true; },
      close() { this.open = false; this.modal = false; },
      querySelector(sel) { return this.kids.find((k) => sel === '[data-choice="' + k.getAttribute("data-choice") + '"]') || null; },
      querySelectorAll() { return this.kids; },
      kids: []
    });
    Object.defineProperty(d, "innerHTML", {
      set(html) {
        d.kids = [...html.matchAll(/<(a|button)\b([^>]*)>([^<]*)</g)].map((m) => {
          const k = el(m[1], { textContent: m[3] });
          for (const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) k.setAttribute(a[1], a[2]);
          k.closest = (sel) => (sel === "[data-choice]" && k.hasAttribute("data-choice") ? k : null);
          return k;
        });
      }
    });
    return d;
  };
  const created = [];
  const root = el("html", { clientWidth: 1351 });
  doc = {
    readyState: "complete", cookie: "",
    currentScript: { getAttribute: (k) => ({ "data-ga-id": "G-TEST", "data-clarity-id": "cl-test" })[k] || null },
    documentElement: root, head: el("head"), body: el("body"),
    createElement(tag) { const e = tag === "dialog" ? dialog() : el(tag); created.push(e); return e; },
    addEventListener(t, f) { (docHandlers[t] = docHandlers[t] || []).push(f); }, removeEventListener() {},
    querySelectorAll() { return []; }, getElementById() { return null; },
    contains() { return true; }, activeElement: null
  };
  doc.activeElement = doc.body;
  const ctx = {
    document: doc, location: { hostname: "secrettravelandtour.com" },
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    setTimeout: (f) => f(), requestAnimationFrame: (f) => f(), innerWidth: 1366, innerHeight: 860,
    matchMedia: (q) => ({ matches: /min-width:760px/.test(q) ? desk : false }),
    addEventListener() {}, removeEventListener() {}, CustomEvent: function () {}
  };
  ctx.window = ctx;
  vm.runInNewContext(JS, ctx);
  const box = created.find((e) => e.tagName === "DIALOG");
  const key = (k, shift = false) => { let stopped = false; (box.handlers.keydown || []).forEach((f) => f({ key: k, shiftKey: shift, preventDefault() { stopped = true; } })); return stopped; };
  const click = (target) => (box.handlers.click || []).forEach((f) => f({ target }));
  const btn = (c) => box.kids.find((k) => k.getAttribute("data-choice") === c);
  const scripts = () => doc.head.children.filter((c) => c.tagName === "SCRIPT").map((c) => c.src);
  const reopen = () => (docHandlers.click || []).forEach((f) => f({ target: { closest: (s) => (s === "[data-consent-open]" ? {} : null) }, preventDefault() {} }));
  return { ctx, doc, root, box, key, click, btn, store, scripts, reopen };
}

test("ordinateur : fenêtre modale centrée (dialog, aria-modal, titre), focus sur « Accept », page bloquée", () => {
  const t = run({ desk: true });
  assert.ok(t.box.open && t.box.modal, "showModal");
  assert.equal(t.box.getAttribute("aria-modal"), "true");
  assert.equal(t.box.getAttribute("aria-labelledby"), "cb-t");
  assert.ok(t.box.classList.contains("cb--modal") && t.box.classList.contains("is-on"));
  assert.equal(t.doc.activeElement, t.btn("granted"));
  assert.ok(t.root.classList.contains("cb-lock"), "défilement bloqué");
  assert.deepEqual(t.scripts(), [], "rien de chargé avant le choix");
});

test("téléphone : la bande du bas reste non modale, sans blocage du défilement ni focus imposé", () => {
  const t = run({ desk: false });
  assert.ok(t.box.open && !t.box.modal);
  assert.equal(t.box.getAttribute("aria-modal"), null);
  assert.ok(!t.box.classList.contains("cb--modal"));
  assert.ok(!t.root.classList.contains("cb-lock"));
  assert.equal(t.doc.activeElement, t.doc.body);
});

test("tabulation gardée dans la fenêtre : Privacy, No thanks, Accept, puis retour au début (et l'inverse)", () => {
  const t = run({ desk: true });
  const [privacy, no, yes] = t.box.kids;
  assert.deepEqual(t.box.kids.map((k) => k.textContent), ["Privacy", "No thanks", "Accept"], "ordre du DOM = ordre visuel");
  assert.equal(t.doc.activeElement, yes);
  assert.ok(t.key("Tab"), "Tab depuis Accept est retenu");
  assert.equal(t.doc.activeElement, privacy);
  assert.ok(t.key("Tab", true), "Maj+Tab depuis Privacy est retenu");
  assert.equal(t.doc.activeElement, yes);
  t.doc.activeElement = no;
  assert.equal(t.key("Tab"), false, "entre deux éléments, le navigateur fait le reste");
});

test("clic sur le fond : sans effet, il faut choisir", () => {
  const t = run({ desk: true });
  t.click(t.box);
  assert.ok(t.box.open);
  assert.equal(t.store.get("stt-consent"), undefined);
  assert.ok(t.root.classList.contains("cb-lock"));
});

test("Échap = « No thanks » : refus enregistré, fenêtre fermée, page débloquée, focus rendu, rien de chargé", () => {
  const t = run({ desk: true });
  t.key("Escape");
  assert.equal(JSON.parse(t.store.get("stt-consent")).s, "denied");
  assert.ok(!t.box.open);
  assert.ok(!t.root.classList.contains("cb-lock"), "défilement rendu");
  assert.equal(t.root.style.scrollbarGutter, "");
  assert.equal(t.doc.activeElement, t.doc.body, "focus rendu à l'élément d'avant");
  assert.deepEqual(t.scripts(), []);
  // L'événement cancel du navigateur (Échap natif) donne le même refus, sans fermeture muette.
  const u = run({ desk: true });
  let prevented = false;
  u.box.handlers.cancel[0]({ preventDefault() { prevented = true; } });
  assert.ok(prevented);
  assert.equal(JSON.parse(u.store.get("stt-consent")).s, "denied");
});

test("« Accept » : choix gardé, page débloquée, GA4 et Clarity chargés seulement maintenant", () => {
  const t = run({ desk: true });
  t.click(t.btn("granted"));
  assert.equal(JSON.parse(t.store.get("stt-consent")).s, "granted");
  assert.ok(!t.box.open && !t.root.classList.contains("cb-lock"));
  const s = t.scripts();
  assert.ok(s.some((u) => /googletagmanager\.com\/gtag\/js\?id=G-TEST/.test(u)) && s.some((u) => /clarity\.ms\/tag\/cl-test/.test(u)), s.join(" "));
});

test("une seule fois : choix gardé = pas de fenêtre ; « Cookie settings » la rouvre de la même façon", () => {
  const t = run({ desk: true, saved: "denied" });
  assert.equal(t.box, undefined, "aucune fenêtre au chargement");
  t.reopen();
  const box = t.ctx.document.body.children.find((c) => c.tagName === "DIALOG");
  assert.ok(box && box.open && box.modal);
  assert.ok(t.root.classList.contains("cb-lock"));
});

test("styles : fond sombre à 35 %, 460 px au plus, un seul mouvement coupé si l'on réduit les animations", () => {
  assert.match(JS, /var DESK = "\(min-width:760px\)";/);
  assert.match(JS, /\.cb--modal::backdrop\{background:rgba\(0,0,0,\.35\)\}/);
  assert.match(JS, /\.cb\.cb--modal\{inset:0;margin:auto;width:min\(460px,calc\(100% - 48px\)\);/);
  assert.match(JS, /opacity:0;transform:scale\(\.96\);transition:opacity \.22s ease-out,transform \.22s/);
  assert.match(JS, /html\.cb-lock\{overflow:hidden\}/);
  assert.match(JS, /@media\(prefers-reduced-motion:reduce\)\{\.cb,\.cb\.is-on,\.cb\.cb--modal,\.cb\.cb--modal\.is-on\{transition:none\}\}/);
});

test("téléphone : après le choix, la bande descend puis se ferme (même sortie qu'avant)", () => {
  const timers = [];
  const t = run({ desk: false });
  t.ctx.setTimeout = (f, ms) => timers.push([f, ms]);
  t.click(t.btn("denied"));
  assert.ok(!t.box.classList.contains("is-on"), "la bande descend");
  assert.ok(t.box.open, "encore là pendant la descente");
  assert.equal(timers.length, 1);
  assert.ok(timers[0][1] >= 280);
  timers[0][0]();
  assert.ok(!t.box.open);
});
