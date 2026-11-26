// Prénom, nom et numéro WhatsApp obligatoires dans la feuille et la liste de sorties (Jérémy, 17.11.2026) : des messages
// préparés n'arrivent jamais, le numéro permet de rappeler. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");

const ROOT = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, "_site", rel, "index.html"), "utf8");
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const WHO = { firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" };
const HELP = "We only use it if your message doesn't reach us.";

test("E.164 : indicatif choisi, 0 national retiré (sauf Italie), numéro complet tapé ou rempli par le téléphone", () => {
  assert.equal(B.phoneE164({ phoneCode: "GB", phone: "07700 900123" }), "+447700900123");
  assert.equal(B.phoneE164({ phoneCode: "TH", phone: "095-868-3846" }), "+66958683846");
  assert.equal(B.phoneE164({ phoneCode: "CH", phone: "(079) 123 45 67" }), "+41791234567");
  assert.equal(B.phoneE164({ phoneCode: "IT", phone: "06 1234 5678" }), "+390612345678");
  assert.equal(B.phoneE164({ phoneCode: "US", phone: "415.555.0134" }), "+14155550134");
  assert.equal(B.phoneE164({ phoneCode: "DE", phone: "+44 7700 900123" }), "+447700900123", "un « + » garde son indicatif");
  assert.equal(B.phoneE164({ phoneCode: "", phone: "0044 7700 900123" }), "+447700900123", "« 00 » vaut « + »");
  assert.equal(B.phoneE164({ phoneCode: "other", phoneOther: "+20", phone: "100 123 4567" }), "+201001234567");
  assert.equal(B.phoneE164({ phoneCode: "other", phoneOther: "020", phone: "100 123 4567" }), "");
  assert.equal(B.phoneE164({ phoneCode: "GB", phone: "12345" }), "");
  assert.equal(B.phoneE164({ phoneCode: "", phone: "0812345678" }), "", "sans indicatif, pas de numéro");
});

test("validation : 6 à 15 chiffres après l'indicatif, messages clairs, mêmes mots partout", () => {
  assert.equal(B.phoneError({ phoneCode: "TH", phone: "" }), "Add your WhatsApp number.");
  assert.equal(B.phoneError({ phoneCode: "", phone: "0812345678" }), "Choose your country code.");
  assert.equal(B.phoneError({ phoneCode: "other", phoneOther: "", phone: "1001234567" }), "Add your country code, for example +20.");
  assert.equal(B.phoneError({ phoneCode: "TH", phone: "12345" }), "Check the number: 6 to 15 digits after the country code.");
  assert.equal(B.phoneError({ phoneCode: "TH", phone: "1234567890123456" }), "Check the number: 6 to 15 digits after the country code.");
  assert.equal(B.phoneError({ phoneCode: "TH", phone: "081 abc 5678" }), "Use only digits for the number.");
  assert.equal(B.phoneError({ phoneCode: "TH", phone: "081 234 5678" }), "");
  assert.equal(B.phoneError({ phoneCode: "TH", phone: "123456" }), "", "6 chiffres : accepté");
  assert.deepEqual(B.validateContact({ firstName: " ", lastName: "", phone: "" }, {}), { firstName: "Add your first name.", lastName: "Add your last name.", phone: "Add your WhatsApp number." });
  assert.deepEqual(B.validateContact(WHO, {}), {});
});

test("indicatif proposé : fuseau hors Bangkok d'abord, puis région puis langue du navigateur ; rien de sûr = à choisir", () => {
  assert.equal(B.guessDial(["en-US"], "Europe/Berlin"), "DE");
  assert.equal(B.guessDial(["de-CH", "de"], "Asia/Bangkok"), "CH");
  assert.equal(B.guessDial(["fr"], "Asia/Bangkok"), "FR");
  assert.equal(B.guessDial(["th-TH"], "Asia/Bangkok"), "TH");
  assert.equal(B.guessDial(["en-CA"], ""), "US");
  assert.equal(B.guessDial(["en"], "Asia/Bangkok"), "");
  assert.equal(B.dialFromNumber("+41 79 123 45 67"), "CH");
  assert.equal(B.dialFromNumber("+358 40 123 4567"), "FI", "l'indicatif le plus long gagne");
  assert.equal(B.dialFromNumber("079 123 45 67"), "");
  assert.ok(B.DIAL_CODES.length >= 20 && B.DIAL_CODES.every((c) => /^[A-Z]{2}$/.test(c.id) && /^[1-9]\d{0,2}$/.test(c.dial) && c.name));
  assert.equal(new Set(B.DIAL_CODES.map((c) => c.id)).size, B.DIAL_CODES.length);
});

test("feuille : prénom, nom et numéro obligatoires dans chaque variante, comme l'hôtel", () => {
  const tour = { variant: "tour", options: [] };
  const st = Object.assign(B.emptyState(tour), { today: "2026-11-17", dateChoice: "other", dateOther: "2026-11-20", adults: 2, pickup: "Pimalai Resort" });
  assert.deepEqual(Object.keys(B.validate(tour, st)).sort(), ["firstName", "lastName", "phone"]);
  assert.deepEqual(B.validate(tour, Object.assign(st, WHO)), {});
  const rental = { variant: "rental", options: [] };
  const r = B.validate(rental, Object.assign(B.emptyState(rental), { today: "2026-11-17", dateFrom: "2026-11-20", dateTo: "2026-11-21", timeFrom: "09:00", timeTo: "18:00" }));
  assert.deepEqual(Object.keys(r).sort(), ["firstName", "lastName", "phone"]);
});

test("message WhatsApp : « Name: Prénom Nom » puis « WhatsApp: +… », toujours sans « Ref: »", () => {
  const cfg = { variant: "tour", product: "Kayak", options: [] };
  const msg = B.buildMessage(cfg, Object.assign(B.emptyState(cfg), { today: "2026-11-17", dateChoice: "other", dateOther: "2026-11-20", adults: 2, pickup: "Pimalai Resort" }, WHO));
  assert.match(msg, /\nName: Anna Becker\nWhatsApp: \+447700900123(\n|$)/);
  assert.doesNotMatch(msg, /Ref:/);
  // Ancien champ unique (brouillon d'avant le 17.11.2026) : le nom reste dans le message.
  assert.match(B.buildMessage(cfg, Object.assign(B.emptyState(cfg), { name: "Anna" })), /\nName: Anna(\n|$)/);
  assert.deepEqual(B.splitName("  Anna  Maria Becker "), { firstName: "Anna", lastName: "Maria Becker" });
});

test("copie pour Gestion : nom complet dans name, numéro E.164 dans une seule constante (feuille et liste)", () => {
  assert.equal(B.PHONE_FIELD, "whatsapp");
  const cfg = { variant: "tour", brand: "Secret Travel & Tour", product: "Kayak", productId: "kayak", options: [] };
  const st = Object.assign(B.emptyState(cfg), { today: "2026-11-17", dateChoice: "other", dateOther: "2026-11-20", adults: 2, pickup: "Pimalai Resort" }, WHO);
  const body = B.demandeBody(cfg, st, "msg", "", "https://secrettravelandtour.com/tours/kayak/");
  assert.equal(body.name, "Anna Becker");
  assert.equal(body[B.PHONE_FIELD], "+447700900123");
  const cat = { kayak: { name: "Kayak", options: [{ id: "half", title: "Half day", rows: [] }] } };
  const list = Object.assign({ items: [{ id: "a", slug: "kayak", option: "half", date: "2026-11-20" }], adults: 2, childAges: [], pickup: "Pimalai Resort" }, WHO);
  const copies = B.tripListBodies(cat, list, B.buildTripList(cat, list), "", "https://secrettravelandtour.com/tours/");
  assert.equal(copies[0].name, "Anna Becker");
  assert.equal(copies[0][B.PHONE_FIELD], "+447700900123");
  assert.match(copies[0].message, /\nName: Anna Becker\nWhatsApp: \+447700900123\n/);
  // booking.js n'écrit le champ qu'à travers la constante.
  assert.equal((src("src/js/booking.js").match(/\bwhatsapp:/g) || []).length, 0);
});

test("contrat Gestion (PR 221) : champ whatsapp en E.164 (+ et 8 à 15 chiffres), name « Prénom Nom » de 120 caractères au plus", () => {
  assert.equal(B.PHONE_FIELD, "whatsapp");
  assert.equal(B.NAME_MAX, 120);
  assert.equal(B.phoneE164({ phone: "+44 12 345" }), "", "7 chiffres : refusé (Gestion garde 8 à 15)");
  assert.equal(B.phoneE164({ phone: "+44 1234 5678" }), "+4412345678");
  assert.equal(B.phoneE164({ phoneCode: "US", phone: "123456" }), "", "+1 et 6 chiffres = 7 : refusé");
  assert.equal(B.phoneE164({ phoneCode: "US", phone: "1234567" }), "+11234567");
  const long = { firstName: "A".repeat(60), lastName: "B".repeat(60), phoneCode: "TH", phone: "081 234 5678" };
  assert.equal(B.fullName(long).length, 120);
  assert.equal(B.fullName({ name: "x ".repeat(200) }).length <= 120, true, "ancien brouillon coupé aussi");
  const cfg = { variant: "tour", brand: "Secret Travel & Tour", product: "Kayak", productId: "kayak", options: [] };
  const body = B.demandeBody(cfg, Object.assign(B.emptyState(cfg), long), "m", "", "https://secrettravelandtour.com/");
  assert.ok(body.name.length <= 120 && /^\+\d{8,15}$/.test(body.whatsapp));
  assert.equal(body.whatsapp_country, undefined, "inutile : le numéro part en E.164");
  const cat = { kayak: { name: "Kayak", options: [{ id: "half", title: "Half day", rows: [] }] } };
  const list = Object.assign({ items: [{ id: "a", slug: "kayak", option: "half", date: "2026-11-20" }], adults: 2, childAges: [], pickup: "P" }, long);
  const c = B.tripListBodies(cat, list, "m", "", "https://secrettravelandtour.com/tours/")[0];
  assert.ok(c.name.length <= 120 && /^\+\d{8,15}$/.test(c.whatsapp));
  assert.match(src("src/js/v4-trips.js"), /autocomplete="' \+ ac \+ '" maxlength="60"/);
});

test("liste de sorties : mêmes champs obligatoires avant l'envoi", () => {
  const cat = { kayak: { name: "Kayak", options: [{ id: "half", title: "Half day", rows: [] }] } };
  const base = { items: [{ id: "a", slug: "kayak", option: "half", date: "2026-11-20" }], adults: 2, childAges: [], pickup: "Pimalai Resort" };
  const v = B.validateTripList(cat, base, "2026-11-17");
  assert.deepEqual([v.firstName, v.lastName, v.phone, v.count], ["Add your first name.", "Add your last name.", "Add your WhatsApp number.", 3]);
  assert.equal(B.validateTripList(cat, Object.assign({}, base, WHO), "2026-11-17").count, 0);
  const js = src("src/js/v4-trips.js");
  for (const re of [/id="tl-' \+ k \+ '" type="text" autocomplete="' \+ ac/, /text\("firstName", "First name", "given-name"\)/, /text\("lastName", "Last name", "family-name"\)/,
    /id="tl-phone" type="tel" inputmode="tel" autocomplete="tel"/, /id="tl-phoneCode" data-ttext="phoneCode" autocomplete="tel-country-code"/, /if \(v\.phone\) fail/]) assert.match(js, re);
  assert.ok(js.includes(HELP.replace("'", "\\'")), "même aide que la feuille");
});

test("pages : champs du gabarit (clavier, remplissage auto, aide, Clarity) dans les deux marques", () => {
  for (const rel of ["tours/kayak", "tours/4-islands", "tours/rental", "tours/speedboat", "transfers", "taxi", "taxi/krabi-airport-koh-lanta", "taxi/songthaew", "taxi/koh-lanta-krabi-day-trip"]) {
    const h = read(rel).replace(/ required=""/g, " required");
    assert.match(h, /<input data-clarity-mask="True" id="book-firstName" name="firstName" type="text" autocomplete="given-name" maxlength="60"[^>]* required aria-required="true"/, rel);
    assert.match(h, /<input data-clarity-mask="True" id="book-lastName" name="lastName" type="text" autocomplete="family-name" maxlength="60"[^>]* required aria-required="true"/, rel);
    assert.match(h, /<select data-clarity-mask="True" id="book-phoneCode" name="phoneCode" autocomplete="tel-country-code"/, rel);
    assert.match(h, /<input data-clarity-mask="True" id="book-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel"[^>]* required/, rel);
    assert.match(h, /<input data-clarity-mask="True" id="book-phoneOther" name="phoneOther" type="tel" inputmode="tel"/, rel);
    assert.ok(h.includes(`<p class="f-hint f-hint--under" id="book-h-phone">${HELP.replace("'", "&#39;")}</p>`) || h.includes(`id="book-h-phone">${HELP}</p>`), rel);
    assert.doesNotMatch(h, /id="book-name"/, rel);
    // Ordre de lecture : prénom, nom, numéro (étape 3 depuis le 26.11.2026, après l'option, la date et le groupe).
    assert.ok(h.indexOf('id="book-firstName"') < h.indexOf('id="book-lastName"') && h.indexOf('id="book-lastName"') < h.indexOf('id="book-phone"'), rel);
    assert.match(h, /Your message is ready in WhatsApp<\/h2>/, rel);
    assert.match(h, /<strong>Tap Send to reach us\.<\/strong>/, rel);
    assert.match(h, /data-waqr-done/, rel);
  }
  for (const css of ["src/css/booking.css", "src/css/vip-taxi.css"]) assert.match(src(css), /input\[type="tel"\]/, css);
});

test("confidentialité : nom, prénom et numéro WhatsApp dans la liste de ce que reçoit l'outil de réservation", () => {
  const h = read("privacy");
  assert.match(h, /your first and last name, your WhatsApp number, the estimated price/);
  assert.match(h, /so we can reach you if your message does not reach us/);
  assert.doesNotMatch(h, /holds no phone number/);
  assert.match(h, /your first and last name, your WhatsApp number and its country code, your hotel/);
});

test("erreur du numéro : le focus va au champ en cause (liste, « Other » ou numéro), même règle dans la liste de sorties", () => {
  assert.equal(B.phoneFocus({ phoneCode: "", phone: "0812345678" }), "phoneCode");
  assert.equal(B.phoneFocus({ phoneCode: "other", phoneOther: "", phone: "1001234567" }), "phoneOther");
  assert.equal(B.phoneFocus({ phoneCode: "other", phoneOther: "+20", phone: "123" }), "phone", "numéro trop court : le numéro, pas l'indicatif");
  assert.equal(B.phoneFocus({ phoneCode: "", phone: "+44 12" }), "phone");
  assert.match(src("src/js/v4-trips.js"), /fail\(\$\("#tl-" \+ B\.phoneFocus\(l\)\), "tl-e-phone", v\.phone\)/);
});
