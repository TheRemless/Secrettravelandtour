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
    { id: "join-in-longtail", title: "Join-in longtail", rows: [{ label: "Adult", price: "1,000 THB" }, { label: "Child, 4 to 11", price: "700 THB" }] },
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
    adults: 2, childAges: [5], childSeats: 1, bags: 3, address: "Lanta Sand Resort", name: "Anna"
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
      "Price on website: Adult: 1,000 THB / Child, 4 to 11: 700 THB",
      "Page: secrettravelandtour.com/tours/4-islands/"
    ].join("\n")
  );
  assert.doesNotMatch(B.buildMessage(TOUR, tourState()), /Hi\b|Hello|!|Today|Tomorrow/);
});

test("buildMessage excursion : option sans prix, pas de ligne de prix", () => {
  const msg = B.buildMessage(TOUR, tourState({ option: "on-request", childAges: [] }));
  assert.match(msg, /Booking request: 4 Islands – Custom day/);
  assert.match(msg, /Guests: 2 adults\n/);
  assert.doesNotMatch(msg, /Price on website/);
});

test("buildMessage trajet : aller, vol, sièges, bagages, adresse de dépose", () => {
  assert.equal(
    B.buildMessage(TAXI, taxiState()),
    [
      "Transfer request: Krabi Airport to Koh Lanta",
      "Date: Tue 10 Nov 2026",
      "Pickup time: 14:30",
      "Flight or ferry: FD3xxx",
      "Guests: 2 adults, 1 child (age 5)",
      "Child seats: 1",
      "Bags: 3",
      "Drop-off: Lanta Sand Resort",
      "Name: Anna",
      "Page: secrettravelandtour.com/taxi/krabi-airport-koh-lanta/"
    ].join("\n")
  );
});

test("buildMessage trajet : véhicule seulement s'il est donné par les données", () => {
  const msg = B.buildMessage(Object.assign({}, TAXI, { vehicle: "private minivan" }), taxiState());
  assert.match(msg, /^Transfer request: Krabi Airport to Koh Lanta \(private minivan\)\n/);
});

test("buildMessage trajet : retour, l'adresse devient la prise en charge, champs vides omis", () => {
  const msg = B.buildMessage(TAXI, taxiState({ direction: "back", flight: "", bags: 0, childAges: [], childSeats: 1 }));
  assert.match(msg, /Transfer request: Koh Lanta to Krabi Airport/);
  assert.match(msg, /Pickup: Lanta Sand Resort/);
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
    name: "Add your first name."
  });
});

test("validate : date passée", () => {
  assert.equal(B.validate(TOUR, tourState({ dateChoice: "other", dateOther: "2026-11-02" })).date, "That date has passed.");
});

test("validate trajet : heure obligatoire, adresse facultative, lieux libres sans trajet fixé", () => {
  assert.deepEqual(B.validate(TAXI, taxiState({ address: "" })), {});
  assert.equal(B.validate(TAXI, taxiState({ time: "" })).time, "Choose a pickup time.");
  const free = Object.assign({}, TAXI, { from: "", to: "" });
  const errors = B.validate(free, taxiState({ from: "", to: "Ao Nang" }));
  assert.equal(errors.from, "Tell us where we pick you up.");
  assert.equal(errors.to, undefined);
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
