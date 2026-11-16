// Aller-retour depuis le point de prise en charge (Jérémy, 16.11.2026) : « Round trip from my place ».
// Le chauffeur emmène le groupe où il veut, ou fait le tour, puis le ramène au même endroit ; le prix dépend du programme et de la durée.
// Offert sur les feuilles à Pickup et Drop-off libres (hub /taxi/, /taxi/songthaew/), pas sur les pages trajet, le minivan partagé
// ni l'excursion à Krabi. Le message WhatsApp suit un format commun avec Gestion : il est figé ici mot pour mot.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");
const T = require("../src/_data/taxiPages.js")();

const SITE = path.join(__dirname, "..", "_site");
const html = (u) => fs.readFileSync(path.join(SITE, u, "index.html"), "utf8");
const bookData = (doc) => JSON.parse((doc.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/) || [])[1]);
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const TODAY = "2026-11-16";
const HUB = T.hubBooking;
const SONG = T.songthaewBooking;

function roundState(over) {
  return Object.assign(B.emptyState(HUB), {
    today: TODAY, ride: "round", dateChoice: "other", dateOther: "2026-11-17", time: "17:00",
    adults: 2, childAges: [7], childSeats: 1, bags: 2, pickupAt: "Lanta Sand Resort", dropoffAt: "Krabi Town",
    plan: "Old Town, then dinner at a restaurant in Saladan", hours: "4", name: "Anna"
  }, over);
}

test("hub : message de l'aller-retour, format commun avec Gestion, ni Drop-off, ni bagages, ni prix", () => {
  assert.equal(B.buildMessage(HUB, roundState()), [
    "Round trip, back to the pickup place",
    "Pickup: Lanta Sand Resort",
    "Plan: Old Town, then dinner at a restaurant in Saladan",
    "Time needed: about 4 hours",
    "Date: Tue 17 Nov 2026",
    "Pickup time: 17:00",
    "Guests: 2 adults, 1 child (age 7)",
    "Child seats: 1",
    "Name: Anna"
  ].join("\n"));
});

test("songthaew : même message, avec le véhicule de la page", () => {
  assert.equal(B.buildMessage(SONG, roundState({ childAges: [], childSeats: 0, hours: "" })), [
    "Round trip, back to the pickup place",
    "Pickup: Lanta Sand Resort",
    "Plan: Old Town, then dinner at a restaurant in Saladan",
    "Time needed: not sure",
    "Vehicle: songthaew",
    "Date: Tue 17 Nov 2026",
    "Pickup time: 17:00",
    "Guests: 2 adults",
    "Name: Anna"
  ].join("\n"));
});

test("durée : « about 1 hour », « about N hours », « not sure » quand rien n'est choisi", () => {
  assert.equal(B.hoursText("1"), "about 1 hour");
  assert.equal(B.hoursText("12"), "about 12 hours");
  assert.equal(B.hoursText(""), "not sure");
  assert.equal(B.hoursText(undefined), "not sure");
});

test("programme sur plusieurs lignes : une seule ligne Plan dans le message", () => {
  const msg = B.buildMessage(HUB, roundState({ plan: "  Old Town\n\nthen the viewpoint  " }));
  assert.match(msg, /^Plan: Old Town then the viewpoint$/m);
});

test("pris à l'aéroport en aller-retour : heure d'atterrissage et vol restent dans le message", () => {
  const msg = B.buildMessage(HUB, roundState({ pickupAt: "Krabi Airport (KBV)", flight: "FD3123" }));
  assert.match(msg, /^Pickup time: 17:00 \(landing\)$/m);
  assert.match(msg, /^Flight or ferry: FD3123$/m);
  assert.equal(B.validate(HUB, roundState({ pickupAt: "Krabi Airport (KBV)", flight: "" })).flight, "Add your flight number.");
});

test("validation : le programme est obligatoire, la dépose et la durée ne le sont pas", () => {
  assert.deepEqual(B.validate(HUB, roundState()), {});
  assert.deepEqual(B.validate(HUB, roundState({ dropoffAt: "", hours: "" })), {});
  assert.equal(B.validate(HUB, roundState({ plan: "  " })).plan, "Tell us what you would like to do. The price depends on it.");
  assert.equal(B.validate(HUB, roundState({ pickupAt: "" })).pickupAt, "Add the pickup address.");
  assert.equal(B.validate(HUB, roundState({ time: "" })).time, "Choose a pickup time.");
});

test("aller simple sur le hub : rien ne change, la dépose reste exigée et le programme est ignoré", () => {
  const s = roundState({ ride: "oneway" });
  const msg = B.buildMessage(HUB, s);
  assert.match(msg, /^Transfer request: Lanta Sand Resort to Krabi Town$/m);
  assert.match(msg, /^Drop-off: Krabi Town$/m);
  assert.match(msg, /^Bags: 2$/m);
  assert.doesNotMatch(msg, /Round trip|Plan:|Time needed/);
  assert.equal(B.validate(HUB, roundState({ ride: "oneway", dropoffAt: "" })).dropoffAt, "Add the drop-off address.");
  assert.equal(B.validate(HUB, roundState({ ride: "oneway", plan: "" })).plan, undefined);
});

test("un ancien brouillon sans « ride » reste un aller simple", () => {
  assert.equal(B.emptyState(HUB).ride, "oneway");
  const s = roundState();
  delete s.ride;
  assert.equal(B.isRound(HUB, s), false);
});

test("pas d'aller-retour là où il n'est pas offert, même si l'état le demande", () => {
  const route = T.byId["krabi-airport-koh-lanta"].booking;
  const shared = { variant: "taxi", shared: true, brand: "Secret Travel & Tour", product: "Shared minivan", from: "", to: "" };
  for (const cfg of [route, shared, T.dayTrip.booking]) {
    assert.ok(!cfg.roundTrip, cfg.productId || "shared");
    const s = roundState({ pickupAt: "Krabi Airport (KBV)", dropoffAt: "Lanta Sand Resort", flight: "FD3123", stops: ["Emerald Pool"] });
    assert.equal(B.isRound(cfg, s), false);
    assert.doesNotMatch(B.buildMessage(cfg, s), /Round trip|Plan:|Time needed/);
  }
});

test("feuilles construites : le choix et les champs de l'aller-retour sur le hub et le songthaew seulement", () => {
  for (const u of ["taxi", "taxi/songthaew"]) {
    const doc = html(u);
    assert.ok(bookData(doc).roundTrip, u);
    assert.match(doc, /<legend>Trip<\/legend>/);
    assert.match(doc, /name="ride" value="oneway"><span><b>One way<\/b>/);
    assert.match(doc, /name="ride" value="round"><span><b>Round trip from my place<\/b>/);
    assert.match(doc, /<label for="book-plan">What would you like to do\?<\/label>/);
    assert.match(doc, /<textarea data-clarity-mask="True" id="book-plan" name="plan"[^>]*aria-describedby="book-h-plan book-e-plan"/);
    assert.match(doc, /<label for="book-hours">How many hours\?<\/label>/);
    assert.match(doc, /<option value="">Not sure<\/option><option value="1">About 1 hour<\/option>/);
    assert.match(doc, /<option value="12">About 12 hours<\/option>/);
    assert.match(doc, /There is no set price for a round trip/);
  }
  assert.match(html("taxi"), /see the <a href="\/taxi\/koh-lanta-krabi-day-trip\/">Krabi day trip<\/a>/);
  assert.doesNotMatch(html("taxi/songthaew"), /Krabi day trip<\/a>/);
  const pages = ["transfers", "taxi/koh-lanta-krabi-day-trip"].concat(T.routes.map((r) => r.url.replace(/^\/|\/$/g, "")));
  for (const u of pages) {
    const doc = html(u);
    assert.doesNotMatch(doc, /name="ride"|name="plan"|Round trip from my place<\/b>/, u);
    assert.ok(!bookData(doc).roundTrip, u);
  }
});

test("le lien de la page de l'excursion à Krabi existe", () => {
  assert.equal(HUB.dayTripUrl, T.dayTrip.url);
  assert.ok(fs.existsSync(path.join(SITE, HUB.dayTripUrl, "index.html")));
});

test("repli sans JavaScript : les liens « round trip » ouvrent WhatsApp avec la forme de l'aller-retour", () => {
  const link = (doc) => decode((doc.match(/<a [^>]*href="(https:\/\/wa\.me\/[^"]+)"[^>]*data-ride="round"/) || [])[1] || "");
  const hub = decodeURIComponent(link(html("taxi")).split("?text=")[1] || "");
  assert.equal(hub, "Round trip, back to the pickup place\nPickup: \nPlan: \nTime needed: \nDate: \nPickup time: \nGuests: \nName: ");
  const song = decodeURIComponent(link(html("taxi/songthaew")).split("?text=")[1] || "");
  assert.equal(song, "Round trip, back to the pickup place\nPickup: \nPlan: \nTime needed: \nVehicle: songthaew\nDate: \nPickup time: \nGuests: \nName: ");
  // « Ask for another route » reste un trajet de A à B.
  assert.match(html("taxi"), /data-book="" data-ride="oneway">Ask for another route<\/a>/);
});

test("textes : FAQ de /taxi/ et de /transfers/, sans prix, sans attente gratuite, tarif horaire ni durée minimale", () => {
  const taxiFaq = require("../src/_data/taxi.json").faq.find((f) => /bring us back/.test(f.q));
  const trFaq = require("../src/_data/products/secret-transfers/shared-minivan.json").faq.find((f) => /bring us back/.test(f.q));
  assert.ok(taxiFaq && taxiFaq.confirmed && trFaq);
  assert.match(html("taxi"), /Can the driver take us somewhere and bring us back\?/);
  assert.match(html("transfers"), /Can a driver take us somewhere and bring us back\?/);
  const texts = [taxiFaq.a, trFaq.a, HUB.roundNote, HUB.planHint, HUB.roundHint, require("../src/_data/songthaew.json").sections[1].p.join(" ")].join(" ");
  assert.doesNotMatch(texts, /\d[\d,]*\s?THB|per hour|hourly|free wait|waits? for free|minimum|at least \d/i);
});

test("JSON-LD : aucun prix pour l'aller-retour", () => {
  for (const u of ["taxi", "taxi/songthaew", "transfers"]) {
    for (const m of html(u).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const ld = m[1];
      if (/round trip/i.test(ld)) assert.doesNotMatch(ld, /"price"|"priceSpecification"|"lowPrice"/, u);
    }
  }
});

test("mesure GA4 : l'aller-retour est marqué round_trip, sans valeur en THB (prix au cas par cas)", () => {
  const st = Object.assign(B.emptyState(HUB), { ride: "round", adults: 2, pickupAt: "Lanta Sand Resort", plan: "Old Town" });
  const t = B.trackInfo(HUB, st);
  assert.equal(t.trip, "round_trip");
  assert.equal(t.value, undefined);
  assert.equal(t.currency, undefined);
  assert.doesNotMatch(JSON.stringify(t), /Lanta Sand|Old Town/);
});
