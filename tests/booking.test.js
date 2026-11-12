// tests/booking.test.js : message WhatsApp, validation et brouillon de la feuille de réservation (refonte).
const test = require("node:test");
const assert = require("node:assert/strict");
const B = require("../src/js/booking.js");

const TODAY = "2026-11-03"; // un mardi

const TOUR = {
  variant: "tour",
  brand: "Secret Travel & Tour",
  product: "4 Islands",
  productId: "4-islands",
  page: "secrettravelandtour.com/tours/4-islands/",
  options: [
    { id: "join-in-longtail", title: "Join-in longtail", rows: [{ label: "Adult", price: "1,000 THB" }, { label: "Child, 4 to 11", price: "600 THB" }] },
    { id: "private-longtail", title: "Private longtail", rows: [{ label: "1 to 2 people", price: "5,900 THB" }] },
    { id: "on-request", title: "Custom day", rows: [] }
  ]
};

const TAXI = {
  variant: "taxi",
  brand: "VIP Taxi Lanta",
  product: "Krabi Airport to Koh Lanta",
  productId: "taxi-krabi-airport-koh-lanta",
  from: "Krabi Airport",
  to: "Koh Lanta",
  page: "secrettravelandtour.com/taxi/krabi-airport-koh-lanta/"
};

function tourState(over) {
  return Object.assign(B.emptyState(TOUR), {
    today: TODAY, option: "join-in-longtail", dateChoice: "tomorrow", adults: 2, childAges: [7], pickup: "Lanta Sand Resort (Klong Dao)", name: "Anna"
  }, over);
}

function taxiState(over) {
  return Object.assign(B.emptyState(TAXI), {
    today: TODAY, direction: "out", dateChoice: "other", dateOther: "2026-11-10", time: "14:30", flight: "FD3xxx",
    adults: 2, childAges: [5], childSeats: 1, bags: 3, pickupAt: "Krabi Airport (KBV)", dropoffAt: "Lanta Sand Resort", name: "Anna"
  }, over);
}

test("formatDate : date absolue avec le jour et l'année", () => {
  assert.equal(B.formatDate("2026-11-04"), "Wed 4 Nov 2026");
  assert.equal(B.formatDate("2027-01-01"), "Fri 1 Jan 2027");
});

test("bangkokToday : 23 h UTC est déjà le lendemain à Koh Lanta", () => {
  assert.equal(B.bangkokToday(new Date("2026-11-03T23:00:00Z")), "2026-11-04");
});

test("guestsLine : adultes, un enfant, plusieurs enfants, bébé", () => {
  assert.equal(B.guestsLine(2, []), "2 adults");
  assert.equal(B.guestsLine(1, [7]), "1 adult, 1 child (age 7)");
  assert.equal(B.guestsLine(2, [4, 9]), "2 adults, 2 children (ages 4 and 9)");
  assert.equal(B.guestsLine(2, [0, 3, 10]), "2 adults, 3 children (ages under 1, 3 and 10)");
});

test("buildMessage excursion : la demande en première ligne, sans formule d'appel ni point d'exclamation", () => {
  assert.equal(
    B.buildMessage(TOUR, tourState()),
    [
      "Booking request: 4 Islands – Join-in longtail",
      "Date: Wed 4 Nov 2026",
      "Guests: 2 adults, 1 child (age 7)",
      "Pickup: Lanta Sand Resort (Klong Dao)",
      "Name: Anna",
      // Sans prix structurés, pas de total : le prix de l'option termine le message.
      "Price: Adult: 1,000 THB / Child, 4 to 11: 600 THB"
    ].join("\n")
  );
  assert.doesNotMatch(B.buildMessage(TOUR, tourState()), /Hi\b|Hello|!|Today|Tomorrow|Ref:|Page:/);
});

test("buildMessage excursion : option sans prix, pas de ligne de prix", () => {
  const msg = B.buildMessage(TOUR, tourState({ option: "on-request", childAges: [] }));
  assert.match(msg, /Booking request: 4 Islands – Custom day/);
  assert.match(msg, /Guests: 2 adults\n/);
  assert.doesNotMatch(msg, /Price|total/i);
});

test("buildMessage trajet : aller, vol, sièges, bagages, prise en charge et dépose", () => {
  assert.equal(
    B.buildMessage(TAXI, taxiState()),
    [
      "Transfer request: Krabi Airport to Koh Lanta",
      "Date: Tue 10 Nov 2026",
      // Pris à l'aéroport : l'heure est celle de l'atterrissage, Gestion lit toujours « Pickup time ».
      "Pickup time: 14:30 (landing)",
      "Flight or ferry: FD3xxx",
      "Guests: 2 adults, 1 child (age 5)",
      "Child seats: 1",
      "Bags: 3",
      "Pickup: Krabi Airport (KBV)",
      "Drop-off: Lanta Sand Resort",
      "Name: Anna"
    ].join("\n")
  );
  // Ni référence ni page, même quand la config donne l'adresse.
  assert.doesNotMatch(B.buildMessage(TAXI, taxiState()), /Ref:|Page:/);
});

test("buildMessage trajet : véhicule seulement s'il est donné par les données", () => {
  const msg = B.buildMessage(Object.assign({}, TAXI, { vehicle: "private minivan" }), taxiState());
  assert.match(msg, /^Transfer request: Krabi Airport to Koh Lanta \(private minivan\)\n/);
});

test("buildMessage trajet : retour, les deux adresses telles que saisies, champs vides omis", () => {
  const msg = B.buildMessage(TAXI, taxiState({ direction: "back", flight: "", bags: 0, childAges: [], childSeats: 1, pickupAt: "Lanta Sand Resort", dropoffAt: "Krabi Airport (KBV)" }));
  assert.match(msg, /Transfer request: Koh Lanta to Krabi Airport/);
  assert.match(msg, /Pickup: Lanta Sand Resort\nDrop-off: Krabi Airport \(KBV\)/);
  assert.doesNotMatch(msg, /Flight|Bags|Child seats/);
});

test("validate excursion : tout est rempli", () => {
  assert.deepEqual(B.validate(TOUR, tourState()), {});
});

test("validate excursion : date, adultes, âge d'enfant, hôtel, prénom, option", () => {
  const errors = B.validate(TOUR, tourState({ option: "", dateChoice: "", adults: 0, childAges: [""], pickup: " ", name: "" }));
  assert.deepEqual(errors, {
    option: "Choose an option.",
    date: "Pick a date.",
    adults: "Add at least one adult.",
    "child-0": "Choose the age of child 1.",
    pickup: "Add your hotel so we know where to pick you up.",
    name: "Add your name."
  });
});

test("validate : date passée", () => {
  assert.equal(B.validate(TOUR, tourState({ dateChoice: "other", dateOther: "2026-11-02" })).date, "That date has passed.");
});

test("validate trajet : heure et hôtel obligatoires, lieux libres sans trajet fixé", () => {
  // Les deux adresses font le prix (revue taxi v1, 10.11.2026) : prise en charge et dépose exigées.
  assert.equal(B.validate(TAXI, taxiState({ pickupAt: "" })).pickupAt, "Add the pickup address.");
  assert.equal(B.validate(TAXI, taxiState({ dropoffAt: " " })).dropoffAt, "Add the drop-off address.");
  assert.deepEqual(B.validate(TAXI, taxiState({ dropoffAt: "Lanta Garden Hill" })), {});
  // À l'aéroport l'heure est celle de l'atterrissage ; à l'hôtel, celle de la prise en charge.
  assert.equal(B.validate(TAXI, taxiState({ time: "" })).time, "Add your landing time.");
  assert.equal(B.validate(TAXI, taxiState({ time: "", pickupAt: "Lanta Sand Resort", dropoffAt: "Krabi Airport (KBV)" })).time, "Choose a pickup time.");
  // Hub : deux lieux libres, plus de From ni de To.
  const free = Object.assign({}, TAXI, { from: "", to: "" });
  const errors = B.validate(free, taxiState({ pickupAt: "", dropoffAt: "Lanta Garden Hill" }));
  assert.equal(errors.pickupAt, "Add the pickup address.");
  assert.equal(errors.from, undefined);
  assert.equal(errors.to, undefined);
});

test("type de lieu : avion, ferry ou bus, sinon hôtel", () => {
  assert.equal(B.endKind("Krabi Airport (KBV)"), "air");
  assert.equal(B.endKind("Phuket airport"), "air");
  assert.equal(B.endKind("HKT"), "air");
  assert.equal(B.endKind("Donsak Pier"), "sea");
  assert.equal(B.endKind("Surat Thani bus terminal"), "sea");
  assert.equal(B.endKind("Lanta Sand Resort"), "");
  assert.equal(B.endKind("Portofino Hotel"), "");
  assert.equal(B.endKind(""), "");
});

test("taxi : à l'aéroport le numéro de vol est obligatoire et l'heure devient celle de l'atterrissage", () => {
  assert.equal(B.validate(TAXI, taxiState({ flight: " " })).flight, "Add your flight number.");
  assert.equal(B.validate(TAXI, taxiState()).flight, undefined);
  assert.equal(B.timeLabel("air"), "Landing time");
  assert.equal(B.timeLabel("sea"), "Arrival time");
  assert.equal(B.timeLabel(""), "Pickup time");
  // Pris à l'hôtel : pas de vol demandé, et un vol resté dans le brouillon ne part pas dans le message.
  const hotel = taxiState({ pickupAt: "Lanta Sand Resort", dropoffAt: "Krabi Airport (KBV)", flight: "FD3xxx" });
  assert.equal(B.validate(TAXI, hotel).flight, undefined);
  assert.doesNotMatch(B.buildMessage(TAXI, hotel), /Flight/);
  // Ferry : l'heure d'arrivée, le détail du ferry reste facultatif.
  const pier = taxiState({ pickupAt: "Donsak Pier", dropoffAt: "Lanta Sand Resort", flight: "" });
  assert.equal(B.validate(TAXI, pier).flight, undefined);
  assert.match(B.buildMessage(TAXI, pier), /Pickup time: 14:30 \(arrival\)/);
});

test("hub : la première ligne vient de Pickup et de Drop-off, Gestion lit toujours les deux lignes", () => {
  const hub = { variant: "taxi", brand: "VIP Taxi Lanta", product: "Private transfer", from: "", to: "" };
  const msg = B.buildMessage(hub, taxiState({ pickupAt: "Ao Nang Beach Resort", dropoffAt: "Lanta Sand Resort", flight: "" }));
  assert.equal(msg.split("\n")[0], "Transfer request: Ao Nang Beach Resort to Lanta Sand Resort");
  assert.match(msg, /\nPickup: Ao Nang Beach Resort\nDrop-off: Lanta Sand Resort\n/);
});

test("minivan partagé : l'heure est facultative, la demande est au nom de Secret", () => {
  const shared = { variant: "taxi", shared: true, brand: "Secret Travel & Tour", product: "Shared minivan", from: "", to: "" };
  const s = taxiState({ pickupAt: "Lanta Sand Resort", dropoffAt: "Krabi Town", time: "", flight: "" });
  assert.deepEqual(B.validate(shared, s), {});
  const msg = B.buildMessage(shared, s);
  assert.equal(msg.split("\n")[0], "Shared minivan request (Secret Travel & Tour): Lanta Sand Resort to Krabi Town");
  assert.doesNotMatch(msg, /time|VIP|THB|Price/i);
  assert.match(B.buildMessage(shared, Object.assign({}, s, { time: "09:00" })), /\nPreferred pickup time: 09:00\n/);
});

test("minivan partagé : avec des départs fixes dans les données, l'un d'eux est exigé et part dans le message", () => {
  const shared = { variant: "taxi", shared: true, brand: "Secret Travel & Tour", product: "Shared minivan", from: "", to: "", departures: [{ id: "d1", label: "09:00" }, { id: "d2", label: "13:30" }] };
  const base = taxiState({ pickupAt: "Lanta Sand Resort", dropoffAt: "Krabi Town", time: "", flight: "" });
  assert.equal(B.validate(shared, base).slot, "Choose a departure time.");
  const ok = Object.assign({}, base, { slot: "d2" });
  assert.deepEqual(B.validate(shared, ok), {});
  assert.match(B.buildMessage(shared, ok), /\nDeparture: 13:30\n/);
});

test("« Today » : refusé une fois le premier ramassage commencé, jamais avant", () => {
  const cfg = Object.assign({}, TOUR, { pickupFrom: "07:45" });
  const base = tourState({ dateChoice: "today", nowTime: "07:41" });
  assert.equal(B.validate(cfg, base).date, undefined);
  assert.equal(B.validate(cfg, Object.assign({}, base, { nowTime: "07:45" })).date, "Pickups for today have started. Choose tomorrow or another day.");
  assert.equal(B.validate(cfg, Object.assign({}, base, { dateChoice: "tomorrow", nowTime: "09:00" })).date, undefined);
  assert.equal(B.todayClosed(cfg, "08:00"), true);
  assert.equal(B.todayClosed(cfg, "06:00"), false);
  // Sans heure dans les données, rien n'est fermé.
  assert.equal(B.todayClosed(TOUR, "23:00"), false);
  assert.equal(B.todayClosed(Object.assign({}, TAXI, { pickupFrom: "07:00" }), "23:00"), false);
});

test("speedboat : un bateau déjà parti aujourd'hui est refusé", () => {
  const boat = {
    variant: "speedboat", product: "Speedboat",
    routes: [{ id: "a", label: "Koh Lanta to Koh Phi Phi", deps: [{ id: "d1", time: "08:30" }, { id: "d2", time: "13:00" }] }]
  };
  const s = Object.assign(B.emptyState(boat), { today: TODAY, nowTime: "10:00", dateChoice: "today", route: "a", departure: "d1", tripType: "one-way", adults: 2, pickup: "Hotel", name: "Anna" });
  assert.equal(B.validate(boat, s).date, "That boat has left for today. Choose another departure or another day.");
  assert.equal(B.validate(boat, Object.assign({}, s, { departure: "d2" })).date, undefined);
  assert.equal(B.validate(boat, Object.assign({}, s, { dateChoice: "tomorrow" })).date, undefined);
});

test("waUrl : numéro de l'agence et texte encodé", () => {
  assert.equal(B.waUrl("A & B\nC"), "https://wa.me/66958683846?text=A%20%26%20B%0AC");
});

test("brouillon : gardé 7 jours, « Tomorrow » d'un autre jour effacé", () => {
  const saved = new Date("2026-11-03T05:00:00Z");
  const raw = B.makeDraft(tourState(), saved);
  assert.doesNotMatch(raw, /"today"/);
  const sameDay = B.restoreDraft(raw, new Date("2026-11-03T09:00:00Z"));
  assert.equal(sameDay.dateChoice, "tomorrow");
  assert.equal(sameDay.pickup, "Lanta Sand Resort (Klong Dao)");
  const nextDay = B.restoreDraft(raw, new Date("2026-11-04T09:00:00Z"));
  assert.equal(nextDay.dateChoice, "");
  assert.equal(nextDay.name, "Anna");
  assert.equal(B.restoreDraft(raw, new Date("2026-11-11T06:00:00Z")), null);
  assert.equal(B.restoreDraft("{bad", saved), null);
});

// Retour du 03.11.2026 : cash du parc, option du transfert. Référence et page retirées le 10.11.2026.
test("message : ni référence ni page, même avec un code produit et une adresse dans la config", () => {
  const cfg = { variant: "tour", product: "4 Islands", page: "secrettravelandtour.com/tours/4-islands/", refPrefix: "FOUR", options: [] };
  const base = { dateChoice: "tomorrow", today: "2026-11-03", adults: 2, childAges: [7], name: "Anna" };
  const msg = B.buildMessage(cfg, base);
  assert.match(msg, /^Booking request: 4 Islands\n/);
  assert.doesNotMatch(msg, /Ref:|Page:|FOUR-|secrettravelandtour\.com/);
  assert.equal(B.makeRef, undefined);
  assert.equal(B.makeRentalRef, undefined);
});
test("cash du parc : adultes et enfants au tarif des données, rien sans frais de parc", () => {
  const cfg = { parkFee: { adult: 200, child: 100 } };
  assert.deepEqual(B.parkCash(cfg, { adults: 2, childAges: [7] }), { total: 500, text: "2 × 200 + 1 × 100 = 500 THB" });
  assert.equal(B.parkCash(cfg, { adults: 0, childAges: [] }), null);
  assert.equal(B.parkCash({}, { adults: 2, childAges: [] }), null);
  assert.equal(B.parkCash({ parkFee: { adult: 400, child: 200 } }, { adults: 3, childAges: [] }).text, "3 × 400 = 1,200 THB");
});

test("transfert : l'option choisie suit le trajet sur la première ligne", () => {
  const cfg = { variant: "taxi", product: "Minivan transfers", options: [{ id: "shared", title: "Shared minivan" }] };
  const msg = B.buildMessage(cfg, { option: "shared", pickupAt: "Koh Lanta", dropoffAt: "Krabi Airport", dateChoice: "today", today: "2026-11-03", adults: 2, childAges: [], time: "09:00", name: "Anna" });
  assert.equal(msg.split("\n")[0], "Transfer request: Koh Lanta to Krabi Airport – Shared minivan");
});

test("taxi : une heure déjà passée aujourd'hui est refusée (heure de Bangkok)", () => {
  const s = taxiState({ dateChoice: "today", time: "09:00", nowTime: "14:05" });
  assert.equal(B.validate(TAXI, s).time, "That time has passed. Choose a later time.");
  assert.equal(B.validate(TAXI, taxiState({ dateChoice: "today", time: "15:00", nowTime: "14:05" })).time, undefined);
  // Demain : l'heure n'est pas comparée.
  assert.equal(B.validate(TAXI, taxiState({ dateChoice: "tomorrow", time: "09:00", nowTime: "14:05" })).time, undefined);
});

test("taxi : la ligne de prix (par véhicule) n'est envoyée que pour 8 personnes au plus", () => {
  const cfg = Object.assign({}, TAXI, { priceNote: "From 2,300 THB per vehicle" });
  assert.match(B.buildMessage(cfg, taxiState({ adults: 6, childAges: [5, 7] })), /Price on the site: From 2,300 THB per vehicle/);
  assert.doesNotMatch(B.buildMessage(cfg, taxiState({ adults: 9, childAges: [5] })), /Price on the site/);
});

test("day trip : stops dans le message, chaque stop nommé, pas de drop-off demandé", () => {
  const DT = { variant: "taxi", dayTrip: true, brand: "VIP Taxi Lanta", product: "Day trip to Krabi", productId: "taxi-koh-lanta-krabi-day-trip",
    from: "Koh Lanta", to: "Krabi", stops: ["Emerald Pool", "Tiger Cave Temple", "The hot springs"],
    priceNote: "From 3,500 THB per vehicle, depending on stops and hours", page: "secrettravelandtour.com/taxi/koh-lanta-krabi-day-trip/" };
  const st = Object.assign(B.emptyState(DT), { today: TODAY, dateChoice: "other", dateOther: "2026-11-20", time: "08:30",
    adults: 2, childAges: [], pickupAt: "Lanta Sand Resort", name: "Anna", stops: ["Emerald Pool", "Krabi Town night market"] });
  assert.deepEqual(B.validate(DT, st), {});
  const msg = B.buildMessage(DT, st);
  assert.match(msg, /^Day trip request: Koh Lanta to Krabi\nStops \(2\): Emerald Pool, Krabi Town night market\n/);
  assert.match(msg, /Hotel on Koh Lanta \(pickup and return\): Lanta Sand Resort/);
  assert.match(msg, /Price on the site: From 3,500 THB per vehicle, depending on stops and hours/);
  assert.doesNotMatch(msg, /Drop-off|Bags/);
  // Un stop sans nom est refusé.
  assert.equal(B.validate(DT, Object.assign({}, st, { stops: ["Emerald Pool", " "] }))["stop-1"], "Name stop 2.");
});
