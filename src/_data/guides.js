// Page « About » et guides pratiques (aperçu demandé par Jérémy le 16.11.2026, PR en brouillon, pas pour la production).
// Registre de faits : il n'existe pas de registre propre à Secret Travel & Tour dans redaction-fr (celui de Site_Anais est
// ancien) ; les faits viennent donc des données du site, lues ici et jamais recopiées à la main :
//   site.json (licence, exploitant, délai de réponse, langues, paiement, bateaux non possédés), taxi.json (FAQ de /taxi/),
//   taxiPages.js (trajets, prix d'appel, durées), products/** (prix, âges, durées, saisons, frais de parc), rental.json,
//   songthaew.json, secretPagesContent.json (sanctuaire : ni monte ni spectacle).
// Faits donnés par Jérémy le 16.11.2026 (demande de la page About) : partenaires de confiance vus tous les jours,
// seulement des entreprises éthiques, équipe locale qui réserve sur WhatsApp.
// Aucun fait non confirmé dans le texte : un marqueur [À CONFIRMER: …] ou [À VÉRIFIER] bloquerait la production (check-dist).
// Version validée par Jérémy le 17.11.2026 (seule demande : retirer la phrase sur le paiement de la page About).
// Ordre des guides : veille du 30.10.2026 (~/Desktop/Claude Plugins/veille/2026-10-30.md) ; les transferts depuis l'aéroport
// de Krabi et les sorties en bateau (4 Islands, Koh Rok, Phi Phi) sont les requêtes les plus suivies, puis « koh lanta taxi ».
const fs = require("node:fs");
const path = require("node:path");
const site = require("./site.json");
const view = require("../_includes/components/view.js");
const taxi = require("./taxi.json");
const songthaew = require("./songthaew.json");

const DATA = __dirname;
const P = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, "products", rel + ".json"), "utf8"));
const pages = JSON.parse(fs.readFileSync(path.join(DATA, "secretPagesContent.json"), "utf8")).pages;
const thb = view.thb;
const fact = (p, label) => ((p.facts || []).find((f) => f.label === label) || {}).value || "";
const opt = (p, id) => (p.options || []).find((o) => o.id === id) || {};
const row = (o, re) => (o.prices || []).find((r) => re.test(r.label || "")) || {};
// Réponse de la FAQ de /taxi/ : une question absente fait échouer le build plutôt que d'afficher une case vide.
const faq = (q) => {
  const f = taxi.faq.find((x) => x.q === q);
  if (!f) throw new Error("guides.js : question absente de taxi.json faq : " + q);
  return f.a;
};
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const UPDATED = "2026-11-16";
// Paiement d'un transfert VIP (taxi.json, FAQ de /taxi/), sans « no hidden fees » : check-dist le tolère une fois par page.
const seatsLine = () => {
  const m = faq("Is the price per person or per vehicle?").match(/seats (\d+ to \d+) people/);
  if (!m) throw new Error("guides.js : nombre de places introuvable dans taxi.json");
  return m[1] + " people, depending on luggage";
};
const payLine = () => faq("How do I pay?").replace(" and no hidden fees", "");

const routes = require("./taxiPages.js")().routes;
const route = (url) => routes.find((r) => r.url === url);
const kbv = route("/taxi/krabi-airport-koh-lanta/");
const hkt = route("/taxi/phuket-airport-koh-lanta/");

// ---------- Produits lus pour les tableaux ----------
const four = P("tours/4-islands"), rok = P("tours/koh-rok-koh-haa"), phi = P("tours/koh-phi-phi");
const rental = P("rental");
const shared = P("secret-transfers/shared-minivan");
const elephant = P("activities/elephant-sanctuary");
const speedboat = P("secret-transfers/speedboat-ferry");

// Prix « enfant » et gratuité d'une option, tels que la fiche les donne (libellés « Child, 4 to 11 », « Child under 4 »).
function childOf(p, optionId) {
  const o = opt(p, optionId);
  const child = (o.prices || []).find((r) => /^Child,? \d/.test(r.label || "") || /^Child \d/.test(r.label || ""));
  const free = (o.prices || []).find((r) => /under \d+/i.test(r.label || "") && r.amount === 0);
  const ages = child ? (child.label.match(/(\d+) to (\d+)/) || []) : [];
  return {
    ages: ages.length ? `${ages[1]} to ${ages[2]}` : "",
    price: child ? thb(child.amount) : "",
    free: free ? "Under " + (free.label.match(/under (\d+)/i) || [])[1] : ""
  };
}
const adultOf = (p, optionId) => thb(row(opt(p, optionId), /^(Adult|Per person)/).amount);
const parkFee = (p) => fact(p, "National park fee").replace(/, not included$/, "");
// « 400 THB per adult, 200 THB per child » : les deux montants du fait « National park fee », sans les âges.
const feeShort = (p) => { const m = parkFee(p).match(/([\d,]+ THB) per adult.*?([\d,]+ THB) per child/); return m ? `${m[1]} per adult and ${m[2]} per child` : parkFee(p); };

// ---------- Page About ----------
const brand = site.brands.secret;
const langs = site.languages;
const langLine = langs.slice(0, -1).join(", ") + " and " + langs[langs.length - 1];
const about = {
  url: "/about/",
  seo: {
    title: "About Secret Travel & Tour | Local Agency on Koh Lanta",
    metaDescription: `A local team on Koh Lanta that books boat trips, activities and transfers on WhatsApp, only with partners we see every day. TAT licence ${brand.licence}.`
  },
  h1: "About Secret Travel & Tour",
  // La phrase d'ouverture : ce qui distingue Secret, en un fait (Jérémy, 16.11.2026).
  statement: "Every trip we book is run by a partner we see every day on Koh Lanta.",
  lead: "We are a local team on the island. You tell us on WhatsApp what you would like to do, and we book it with the people we know.",
  commitments: [
    {
      id: "partners",
      title: "Partners we see every day",
      text: [
        // boatsOwned: false (site.json, 04-questions-client Q18).
        "We do not own the boats. Each trip is run by a local company we work with and see every day on the island.",
        "We book your place with them and reply on WhatsApp with your pickup time."
      ],
      link: { href: "/tours/", label: "See the boat trips and activities", cta: "about_partners" },
      // Proue d'un longtail, sans nom ni numéro lisibles (four-longtail montrait le nom peint sur la coque).
      photo: "hub-final"
    },
    {
      id: "ethical",
      title: "Only ethical companies",
      text: [
        "We only work with ethical companies, for the elephants and for everything else we book.",
        // secretPagesContent.json pages.elephant-sanctuary.intro (« There is no riding and no show… »).
        "At the elephant sanctuary there is no riding and no show. You spend the time next to the animals: feeding them, walking with them and washing them."
      ],
      link: { href: "/tours/elephant-sanctuary/", label: "See the elephant sanctuary", cta: "about_ethical" },
      photo: "gal-elephant-visitor"
    },
    {
      id: "licence",
      title: "A licensed travel agency",
      text: [
        `${brand.name} is a licensed travel agency, TAT licence ${brand.licence}. It is run by ${site.operator.name}, a company registered in Thailand.`,
        "Our booking terms and the cancellation rules of each trip are published on this site."
      ],
      proof: `TAT licence ${brand.licence}`,
      links: [
        { href: "/terms/", label: "Booking terms" },
        { href: "/cancellation/", label: "Cancellation rules" }
      ],
      // Eau et récif à Koh Rok, sans bateau (le radeau portait un drapeau à logo et un panneau).
      photo: "gal-rok-turquoise-water"
    },
    {
      id: "pay",
      // Jérémy, 17.11.2026 : « pas besoin de mettre la phrase pour le paiement ». Ni qui reçoit le paiement, ni comment :
      // seulement la réservation sur WhatsApp, l'absence de paiement en ligne (site.json booking.onlinePayment false) et les
      // frais de parc national, non inclus et donnés sur chaque fiche (secretPagesContent.json parkFeeNote).
      title: "Clear prices",
      text: [
        `Every booking goes through ${site.booking.channel}. There is no online payment on this site.`,
        "National park fees are never included by any boat operator on Koh Lanta. Each trip page tells you how much, so there is no surprise on the day."
      ],
      link: { href: "/cancellation/", label: "How cancellation works", cta: "about_pay" },
      photo: "gal-rok-beach-lunch"
    }
  ],
  contact: {
    title: "Talk to the team",
    reply: `We reply ${site.replyTime.usual}.`,
    langs: `We speak ${langLine}.`,
    message: "Hello, I have a question: "
  },
  final: {
    photo: "gal-rok-palm-beach",
    title: "Tell us what you have in mind",
    text: "Your dates, who is coming and what you enjoy. We reply with the trips that fit and the price of each one.",
    message: "Hello, we are planning our days on Koh Lanta.\nOur dates: \nWho is coming: "
  }
};

// ---------- Guides ----------
const g1 = {
  slug: "krabi-airport-to-koh-lanta",
  title: "Krabi Airport to Koh Lanta: every way to get there",
  short: "Krabi Airport to Koh Lanta",
  seo: {
    title: "Krabi Airport to Koh Lanta: How to Get There | Secret Travel",
    metaDescription: `Private minivan from ${thb(kbv.price.thb)} per vehicle, about 2 to 3 hours door to door, or a shared minivan. How the transfer works, the ferry and the way back.`
  },
  card: "Private or shared minivan, the ferry, the way back.",
  photo: "home-transfers",
  answer: [
    `The simplest way is a private minivan from the arrivals hall to your hotel. The drive takes ${kbv.product.route.drive} and costs ${lc(kbv.price.label)} per vehicle.`,
    "A shared minivan is the other option: you share the seats with other passengers, and we give you the price on WhatsApp."
  ],
  sections: [
    {
      id: "options",
      h: "Private or shared minivan",
      blocks: [
        { table: {
          caption: "Getting from Krabi Airport to Koh Lanta",
          head: ["", "Private minivan", "Shared minivan"],
          rows: [
            ["Who travels", "Your group only", "Other passengers too"],
            ["Price", `${kbv.price.label} per vehicle`, "On WhatsApp"],
            ["Seats", seatsLine(), "Per seat"],
            ["Drive time", cap(kbv.product.route.drive), "Longer if it stops for other passengers"],
            ["At the airport", "The driver waits in the arrivals hall with a sign showing your name", "The driver may not be able to wait for you"],
            ["Run by", site.brands.vip.name, `${brand.name}, with a local transport partner`]
          ]
        } },
        { p: `The private minivan is run by <a class="link" href="/taxi/">${site.brands.vip.name}</a>, our partner for transfers. ${payLine()}` },
        // Réponse de la FAQ de /taxi/, reprise en phrase d'article (sans le « Yes, » de la réponse).
        { p: faq("Is the ferry to Koh Lanta included?").replace(/^Yes, for up to (\d+) people\. /, "The ferry to Koh Lanta is included for up to $1 people. ") }
      ]
    },
    {
      id: "how",
      h: "How the private transfer works",
      blocks: [
        { steps: [
          "Send us your flight number, your landing time, your hotel on Koh Lanta and the number of people.",
          "The team confirms the price on WhatsApp.",
          "Your driver waits in the arrivals hall with a sign showing your name, and drives you to your hotel."
        ] },
        { p: "Travelling with children? Child seats and baby seats are on request, and only if we confirm them in writing." }
      ]
    },
    {
      id: "back",
      h: "Going back to the airport",
      blocks: [
        { p: "Book the same transfer the other way: choose Koh Lanta to Krabi Airport in the form, with your hotel, your date and the time you want to leave. Keep enough time for the drive and the ferry before your flight." }
      ]
    },
    {
      id: "phuket",
      h: "Landing in Phuket instead?",
      blocks: [
        { p: `From Phuket Airport the private minivan takes ${hkt.product.route.drive}, ${lc(hkt.price.label)} per vehicle. Same meeting point in the arrivals hall.` }
      ]
    }
  ],
  links: [
    { href: kbv.url, label: "Krabi Airport to Koh Lanta, private minivan" },
    { href: "/transfers/", label: "Shared minivan and every transfer option" },
    { href: hkt.url, label: "Phuket Airport to Koh Lanta" }
  ],
  book: { title: "Book your airport transfer", text: "Send your flight number and your hotel. We reply with the price.", href: kbv.url, label: "See the Krabi Airport transfer", cta: "guide_route" },
  faq: [
    { q: "How long is the drive from Krabi Airport to Koh Lanta?", a: `${cap(kbv.product.route.drive)}, depending on traffic.` },
    { q: "Where does the driver meet me at Krabi Airport?", a: faq("Where does the driver meet me at the airport?") },
    { q: "Is the ferry to Koh Lanta included?", a: faq("Is the ferry to Koh Lanta included?") },
    { q: "How do I pay for the transfer?", a: payLine() }
  ],
  on: ["/transfers/"]
};

const trip = (p, optionId) => ({ adult: adultOf(p, optionId), ...childOf(p, optionId) });
const fourL = trip(four, "join-in-longtail"), fourS = trip(four, "join-in-speedboat"), rokS = trip(rok, "join-in-speedboat"), phiS = trip(phi, "join-in-speedboat");
const g2 = {
  slug: "4-islands-koh-rok-or-koh-phi-phi",
  title: "Which island trip from Koh Lanta? 4 Islands, Koh Rok or Koh Phi Phi",
  short: "4 Islands, Koh Rok or Koh Phi Phi",
  seo: {
    title: "4 Islands, Koh Rok or Phi Phi? | Secret Travel & Tour",
    metaDescription: `The three island days from Koh Lanta side by side: price, children, season and park fees. 4 Islands from ${fourL.adult}, Koh Rok and Phi Phi from ${rokS.adult}.`
  },
  card: "The three island days side by side: price, children, season.",
  photo: "four-gallery-islets",
  answer: [
    `All three are full days with hotel pickup, lunch and snorkelling gear. The 4 Islands is the cheapest, from ${fourL.adult} by longtail, with the Emerald Cave on Koh Mook.`,
    `Koh Rok is the snorkelling trip and only runs from ${lc(fact(rok, "Season"))}. Koh Phi Phi is the trip for Maya Bay and Pileh Lagoon.`
  ],
  sections: [
    {
      id: "compare",
      h: "The three trips side by side",
      blocks: [
        { table: {
          caption: "Join-in island trips from Koh Lanta, prices per person",
          head: ["", four.name, rok.name, phi.name],
          rows: [
            ["What you see", four.promise, rok.promise.replace(/, mid-October to mid-May$/, ""), phi.promise],
            ["Adult, join-in", `${fourL.adult} by longtail, ${fourS.adult} by speedboat`, `${rokS.adult} by speedboat`, `${phiS.adult} by speedboat`],
            ["Child", `${fourL.price} by longtail, ${fourS.price} by speedboat, ages ${fourL.ages}`, `${rokS.price}, ages ${rokS.ages}`, `${phiS.price}, ages ${phiS.ages}`],
            ["Under 4", ...[fourL, rokS, phiS].map((t) => (t.free ? "Free" : "Child rate"))],
            ["Boat", fact(four, "Boat"), fact(rok, "Boat"), fact(phi, "Boat")],
            ["Season", "Ask us for your dates", fact(rok, "Season"), "Ask us for your dates"],
            ["Hotel pickup", fact(four, "Hotel pickup"), fact(rok, "Hotel pickup"), fact(phi, "Hotel pickup")],
            ["National park fee, cash", parkFee(four), parkFee(rok), parkFee(phi)]
          ]
        } },
        { p: "Each of the three also runs as a private longtail for your group only, priced per boat on the trip page." }
      ]
    },
    {
      id: "pick",
      h: "Which one for you",
      blocks: [
        { dl: [
          ["A first island day, or a smaller budget", `The 4 Islands by longtail, from ${fourL.adult}. Children under 4 go free.`],
          ["Snorkelling first", `Koh Rok and Koh Haa, from ${lc(fact(rok, "Season"))}. The crossing takes ${lc(fact(rok, "Crossing"))}. Out of season, ask us which trip runs on your dates.`],
          ["Maya Bay and the famous views", `Koh Phi Phi, ${lc(fact(phi, "Crossing"))}. Maya Bay has its own rules set by the national park, and the stop depends on the day and the season.`]
        ] }
      ]
    },
    { id: "cards", h: "The trips", blocks: [{ cards: ["4-islands", "koh-rok-koh-haa", "koh-phi-phi"] }] }
  ],
  links: [
    { href: "/tours/", label: "Every boat trip and activity" },
    { href: "/guides/koh-lanta-with-kids/", label: "Koh Lanta with kids" }
  ],
  book: { title: "Not sure which one?", text: "Send your dates and who is coming. We tell you which trip runs and fits.", wa: "Hello, which island trip would you suggest?\nOur dates: \nWho is coming: ", label: "Ask on WhatsApp" },
  faq: [
    { q: "Is the national park fee included?", a: `No. No boat operator on Koh Lanta includes it. You pay it in cash to the ranger on the island: ${feeShort(four)} on the 4 Islands, ${feeShort(rok)} at Koh Rok and Koh Haa, ${feeShort(phi)} at Koh Phi Phi. Children under 4 do not pay at Koh Rok and on the 4 Islands.` },
    { q: "Which island trip is open all year?", a: `Koh Rok runs from ${lc(fact(rok, "Season"))}. For the 4 Islands and Koh Phi Phi, send us your dates and we tell you what runs.` }
  ],
  on: ["/tours/4-islands/", "/tours/koh-rok-koh-haa/", "/tours/koh-phi-phi/"]
};

// Location : fourchette par catégorie, lue dans les lignes de prix (même calcul que l'accueil).
const rentalCats = rental.options.map((o) => {
  const a = o.prices.map((r) => r.amount);
  return { label: o.label, lo: Math.min(...a), hi: Math.max(...a) };
});
const rentalUnit = rental.options[0].prices[0].unit;
const rentalGood = (key) => (rental.beforeYouBook || {})[key] || "";
const scooters = rentalCats.find((c) => /Scooters/.test(c.label)), cars = rentalCats.find((c) => /Cars/.test(c.label));
const g3 = {
  slug: "getting-around-koh-lanta",
  title: "Getting around Koh Lanta: songthaew taxi, scooter or car",
  short: "Getting around Koh Lanta",
  seo: {
    title: "Getting Around Koh Lanta | Secret Travel & Tour",
    metaDescription: `How to get around Koh Lanta: songthaew taxis for your group, scooters from ${thb(scooters.lo)} and cars from ${thb(cars.lo)} ${rentalUnit}, private minivans to leave the island.`
  },
  card: "Songthaew taxis, scooter and car rental, minivans off the island.",
  photo: "gal-rental-shed",
  answer: [
    `On the island the taxis are songthaews: pickup trucks with two benches in the back, booked for your group only. To drive yourself, scooters start at ${thb(scooters.lo)} and cars at ${thb(cars.lo)} ${rentalUnit}.`,
    "To leave the island, for an airport or another town, you take a private minivan."
  ],
  sections: [
    {
      id: "options",
      h: "Your options at a glance",
      blocks: [
        { table: {
          caption: "Getting around Koh Lanta",
          head: ["", "Price", "Book"],
          rows: [
            ["Songthaew taxi, your group only", "On WhatsApp", '<a class="link" href="/taxi/songthaew/">Songthaew taxis</a>'],
            ...rentalCats.slice().reverse().map((c) => [c.label, `${thb(c.lo).replace(" THB", "")} to ${thb(c.hi)} ${rentalUnit}`, '<a class="link" href="/tours/rental/">Rental</a>']),
            ["Private minivan, airports and other towns", "From " + thb(Math.min(...routes.filter((r) => /Koh Lanta/.test(r.name) && r.price && !r.price.approx).map((r) => r.price.thb))) + " per vehicle", '<a class="link" href="/taxi/">Private transfers</a>']
          ]
        } }
      ]
    },
    {
      id: "songthaew",
      h: "What is a songthaew?",
      blocks: [
        { p: songthaew.sections[0].p[0] + " " + songthaew.sections[0].p[1] },
        { p: "Use one for a hotel transfer on Koh Lanta, a beach, a restaurant or the pier. Or book it to see the island: a half day, a full day, or by the hour with the stops you choose." }
      ]
    },
    {
      id: "rent",
      h: "Renting a scooter or a car",
      blocks: [
        { dl: [
          ["Deposit", rentalGood("deposit")],
          ["Driving licence", rentalGood("licence")],
          ["Insurance", rentalGood("insurance")],
          ["Helmets", rentalGood("helmets")],
          ["Delivery", rentalGood("delivery")]
        ].filter((r) => r[1]) }
      ]
    },
    {
      id: "leave",
      h: "Leaving the island",
      blocks: [
        { p: `Outside Koh Lanta we always book a private minivan. Krabi Airport is ${kbv.product.route.drive} away, ${lc(kbv.price.label)} per vehicle. The speedboats from Sala Dan pier go to ${fact(speedboat, "Destinations").split("; ")[0].split(", ").slice(0, 4).join(", ")} and more islands.` }
      ]
    }
  ],
  links: [
    { href: "/taxi/songthaew/", label: "Songthaew taxis on Koh Lanta" },
    { href: "/tours/rental/", label: "Every rental vehicle and its price" },
    { href: "/tours/speedboat/", label: "Speedboat timetable" },
    { href: "/guides/krabi-airport-to-koh-lanta/", label: "Krabi Airport to Koh Lanta" }
  ],
  book: { title: "Need a ride or a scooter?", text: "Tell us where you are staying and what you need. We reply with the price.", wa: "Hello, I need to get around Koh Lanta.\nWhere we stay: \nWhat we need: ", label: "Ask on WhatsApp" },
  on: ["/tours/rental/", "/transfers/"]
};

// Enfants : une ligne par sortie, prix et âges lus dans l'option la moins chère qui a un tarif enfant.
const kidRow = (p, optionId, extra = "") => {
  const c = childOf(p, optionId);
  return { slug: p.slug, name: p.name, url: p.url, adult: adultOf(p, optionId), child: c.price, ages: c.ages, free: c.free, extra };
};
const atv = P("activities/atv"), batik = P("activities/batik"), cooking = P("activities/cooking-class");
const mangroves = P("tours/mangroves"), kayak = P("activities/mangrove-kayaking"), sunrise = P("tours/sunrise-raft"), kart = P("activities/go-kart");
const atvPass = row(opt(atv, "track-30-min"), /^Child passenger/);
const rafts = row(opt(sunrise, "raft-sunrise"), /^Child/);
const kids = [
  kidRow(four, "join-in-longtail", "Full day, lunch on the beach"),
  kidRow(mangroves, "longtail-half-day", "Half day"),
  kidRow(kayak, "mangrove-kayak-half-day", "Half day"),
  kidRow(elephant, "programme-a", cap(fact(elephant, "Children").replace(/^4–10 child rate, under 4 free, /, ""))),
  kidRow(batik, "morning-or-afternoon", "Your canvas comes back the next day"),
  { slug: "sunrise-raft", name: sunrise.name, url: sunrise.url, adult: thb(row(opt(sunrise, "raft-sunrise"), /^1 or 2/).amount) + " for 1 or 2 people, then " + thb(row(opt(sunrise, "raft-sunrise"), /^Each extra/).amount) + " each", child: thb(rafts.amount), ages: (rafts.label.match(/(\d+ to \d+)/) || [])[1], free: "", extra: "Private raft, your group only" },
  { slug: "atv", name: atv.name, url: atv.url, adult: adultOf(atv, "track-30-min"), child: thb(atvPass.amount) + " as a passenger", ages: "4 to 12", free: "", extra: fact(atv, "Ages") }
];
const g4 = {
  slug: "koh-lanta-with-kids",
  title: "Koh Lanta with kids: trips that work for families",
  short: "Koh Lanta with kids",
  seo: {
    title: "Koh Lanta with Kids: Child Prices | Secret Travel & Tour",
    metaDescription: `Boat trips and activities on Koh Lanta with child prices and ages: 4 Islands, mangroves, elephant sanctuary, batik, rafts. Children under 4 often go free.`
  },
  card: "Child prices and ages for each trip, and what to know before you go.",
  photo: "gal-kart-double-teal",
  answer: [
    "Most of our trips have a child rate, usually from about 4 to 10 or 11 years old, and on many of them children under 4 go free. The ages change from one company to the next, so each trip page gives its own.",
    "The mangroves and mangrove kayaking take half a day, and batik is a morning or an afternoon course."
  ],
  sections: [
    {
      id: "prices",
      h: "Child prices, trip by trip",
      blocks: [
        { table: {
          caption: "Child rates from the trip pages, per person unless stated",
          byRow: true,
          head: ["Trip", "Adult", "Child", "Ages", "Note"],
          rows: kids.map((k) => [`<a class="link" href="${k.url}">${k.name}</a>`, k.adult, k.child, k.ages + (k.free ? `, ${lc(k.free)} free` : ""), k.extra])
        } },
        { p: "National park fees on the island trips also have a child rate, paid in cash on the island. Each trip page lists them." }
      ]
    },
    {
      id: "more",
      h: "Other ideas with children",
      blocks: [
        { dl: [
          [cooking.name, fact(cooking, "Children") + "."],
          [kart.name, "Double-seat karts take an adult and a child side by side, " + thb(row(opt(kart, "10-minutes"), /^Small double/).amount) + " for 10 minutes."],
          ["Snorkelling on the dive boat", (() => { const o = opt(P("activities/scuba-diving"), "snorkelling-on-dive-boat"); const c = row(o, /^Child, \d/), n = row(o, /^Nanny/); return `Children from ${(c.label.match(/(\d+ to \d+)/) || [])[1]} pay ${thb(c.amount)}, under 5 come free, and a nanny can stay on board for ${thb(n.amount)}.`; })()]
        ] }
      ]
    },
    {
      id: "before",
      h: "Before you book",
      blocks: [
        { list: [
          "Tell us the age of each child when you book. The child rate depends on it.",
          "Child seats and baby seats for transfers are on request, and only if we confirm them in writing.",
          "On the ATV, there are no children under 4. Passengers ride from 4, drivers from 6 with staff supervision."
        ] }
      ]
    },
    { id: "cards", h: "Trips families book", blocks: [{ cards: ["4-islands", "mangroves", "elephant-sanctuary", "batik"] }] }
  ],
  links: [
    { href: "/tours/", label: "Every boat trip and activity" },
    { href: "/guides/4-islands-koh-rok-or-koh-phi-phi/", label: "4 Islands, Koh Rok or Koh Phi Phi" }
  ],
  book: { title: "Planning days with children?", text: "Send their ages and your dates. We suggest the trips that fit.", wa: "Hello, we are coming with children.\nTheir ages: \nOur dates: ", label: "Ask on WhatsApp" },
  faq: [
    { q: "Do children under 4 pay on the boat trips?", a: "On the 4 Islands, Koh Rok and Koh Phi Phi join-in trips, children under 4 go free. Each trip page gives its own ages." },
    { q: "Can young children come on the ATV?", a: (atv.beforeYouBook && atv.beforeYouBook.children) || fact(atv, "Ages") }
  ],
  on: ["/tours/elephant-sanctuary/", "/tours/mangroves/", "/tours/mangrove-kayaking/", "/tours/batik/", "/tours/atv/", "/tours/go-kart/", "/tours/cooking-class/", "/tours/sunrise-raft/", "/tours/4-islands/"]
};

// Temps de lecture : 200 mots par minute, texte visible seulement (balises retirées).
function words(g) {
  const parts = [g.title, ...g.answer];
  g.sections.forEach((s) => {
    parts.push(s.h);
    s.blocks.forEach((b) => {
      if (b.p) parts.push(b.p);
      if (b.table) b.table.rows.forEach((r) => parts.push(r.join(" ")));
      (b.steps || b.list || []).forEach((x) => parts.push(x));
      (b.dl || []).forEach((x) => parts.push(x.join(" ")));
    });
  });
  (g.faq || []).forEach((f) => parts.push(f.q, f.a));
  return parts.join(" ").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

const list = [g1, g2, g3, g4].map((g) => ({
  ...g,
  url: `/guides/${g.slug}/`,
  updated: UPDATED,
  updatedLabel: new Date(UPDATED + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
  minutes: Math.max(2, Math.round(words(g) / 200))
}));

// « Good to know » : sur chaque fiche, un ou deux guides qui la citent (ordre de la liste).
const byPage = {};
list.forEach((g) => g.on.forEach((u) => { (byPage[u] = byPage[u] || []).push({ url: g.url, title: g.short, card: g.card, minutes: g.minutes }); }));
Object.keys(byPage).forEach((u) => { byPage[u] = byPage[u].slice(0, 2); });

// JSON-LD (components/schema.js) : image de l'article = sa photo d'origine (photos-v3.json).
const schema = require("../_includes/components/schema.js");
const PHOTOS = JSON.parse(fs.readFileSync(path.join(DATA, "photos-v3.json"), "utf8")).photos;
const imageOf = (id) => { const ph = PHOTOS.find((x) => x.id === id); return ph ? "/images/" + ph.file : ""; };
const hub = {
  url: "/guides/",
  seo: { title: "Koh Lanta Travel Guides | Secret Travel & Tour", metaDescription: "Answers to the questions travellers ask us about Koh Lanta: getting here from Krabi Airport, which island trip, getting around, and trips with kids." },
  h1: "Koh Lanta guides",
  lead: "Answers to the questions travellers send us on WhatsApp, with the prices from our trip pages."
};
const jsonLd = {
  about: schema.about(site, about),
  hub: schema.guidesHub(site, hub, list),
  guides: Object.fromEntries(list.map((g) => [g.slug, schema.guide(site, g, imageOf(g.photo))]))
};

module.exports = {
  about,
  jsonLd,
  hub,
  list,
  byPage,
  // Prochains guides, dans l'ordre de la veille (rapport) : pas encore écrits.
  next: []
};
