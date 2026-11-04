// Données des pages du design v3 (accueil, 4 Islands, hub /tours/, /_components/, /credits/).
// Textes : docs/refonte/03-audit-contenu.md §7 et PROMPT-DESIGN-V3.md §3 ; faits, prix, options et déroulé :
// src/_data/products/** et site.json ; photos : src/_data/photos-v3.json (une entrée = un usage).
const fs = require("node:fs");
const path = require("node:path");
const view = require("../_includes/components/view.js");
const site = require("./site.json");

const P = (rel) => JSON.parse(fs.readFileSync(path.join(__dirname, "products", rel + ".json"), "utf8"));
const PHOTOS = JSON.parse(fs.readFileSync(path.join(__dirname, "photos-v3.json"), "utf8")).photos;
const IMAGES = path.join(__dirname, "..", "images");

const BOATS = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu", "mangroves", "fishing-trip"].map((s) => "tours/" + s);
const ACTIVITIES = ["scuba-diving", "atv", "kayak", "elephant-sanctuary", "cooking-class", "batik", "go-kart"].map((s) => "activities/" + s);
const CARD_PHOTO = {
  "4-islands": "card-4-islands", "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi",
  "koh-talabeng-koh-bubu": "card-talabeng", mangroves: "card-mangroves", "fishing-trip": "card-fishing",
  "scuba-diving": "card-scuba", atv: "card-atv", kayak: "card-kayak", "elephant-sanctuary": "card-elephant",
  "cooking-class": "card-cooking", batik: "card-batik", "go-kart": "card-go-kart"
};
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];

// Photo d'un usage : dimensions réelles du fichier, position de recadrage, crédit.
function photo(id) {
  const p = PHOTOS.find((x) => x.id === id);
  if (!p) throw new Error("photo v3 inconnue : " + id);
  const file = path.join(IMAGES, p.file);
  let width, height;
  if (p.file.endsWith(".webp")) [width, height] = view.webpSize(p.file);
  else {
    // En-tête JPEG : on lit la taille du premier segment SOF.
    const b = fs.readFileSync(file);
    for (let i = 2; i < b.length;) {
      const len = b.readUInt16BE(i + 2);
      if (b[i + 1] >= 0xc0 && b[i + 1] <= 0xc3) { height = b.readUInt16BE(i + 5); width = b.readUInt16BE(i + 7); break; }
      i += 2 + len;
    }
  }
  return { id: p.id, src: `/images/${p.file}`, width, height, alt: p.alt, position: p.position, placeholder: p.placeholder };
}

const fact = (product, label) => ((product.facts || []).find((f) => f.label === label) || {}).value || "";

// Ligne de faits d'une carte : « Full day · Longtail or speedboat · Hotel pickup », saison si connue.
function cardFacts(product) {
  const out = [];
  const duration = fact(product, "Duration");
  if (duration && duration.length <= 24) out.push(duration);
  const boat = fact(product, "Boat");
  if (boat && boat.length <= 28) out.push(boat);
  const season = fact(product, "Season");
  if (season && season !== "All year") out.push(season);
  if (fact(product, "Hotel pickup") || (product.included || []).some((i) => /hotel (transfer|pickup)/i.test(i))) out.push("Hotel pickup");
  return out.join(" · ");
}

function card(rel) {
  const product = P(rel);
  const pr = view.price(product);
  return {
    slug: product.slug,
    href: product.url,
    title: product.name,
    promise: product.promise || "",
    facts: cardFacts(product),
    price: pr ? { amount: pr.amount, unit: product.price.unit } : null,
    photo: photo(CARD_PHOTO[product.slug])
  };
}

// Options du 4 Islands : nom, une ligne, premier tarif, âges exacts.
function options(product) {
  return product.options.map((o) => {
    const rows = o.prices || [];
    const first = rows[0];
    const unit = first.group ? `per boat, ${first.group.min}–${first.group.max} people` : "per adult";
    return {
      id: o.id,
      title: o.label,
      sub: (o.note || "").split(". ")[0].replace(/\.$/, ""),
      price: view.thb(first.amount),
      unit,
      ages: rows.slice(1).map((r) => `${r.label}: ${r.amount === 0 ? "free" : (r.supplement ? "+" : "") + view.thb(r.amount)}`).join(" · ")
    };
  });
}

module.exports = async function () {
  const four = P("tours/4-islands");
  const boats = BOATS.map(card);
  const activities = ACTIVITIES.map(card);
  const byslug = Object.fromEntries(boats.concat(activities).map((c) => [c.slug, c]));
  const fee = view.parkFee(four);
  const b = site.brands.secret;

  const data = {
    contact: view.contact(site),
    emblem: await view.emblem(44),
    boats,
    activities,
    counts: { boats: boats.length, activities: activities.length, all: WORDS[boats.length + activities.length] || String(boats.length + activities.length) },
    home: {
      seo: { title: "Koh Lanta Boat Trips, Activities and Transfers | Secret Travel & Tour", metaDescription: "Boat trips, island activities and transfers from our desk in Sala Dan, Koh Lanta. 4 Islands from 1,000 THB, Koh Rok from 2,000 THB. Book on WhatsApp." },
      hero: photo("home-hero"),
      h1: "Boat trips, activities and transfers on Koh Lanta",
      lead: "Book at our desk in Sala Dan or on WhatsApp. Prices are on the site and hotel pickup is included on every boat trip.",
      facts: `4 Islands from ${byslug["4-islands"].price.amount} · Koh Rok from ${byslug["koh-rok-koh-haa"].price.amount} · Private airport transfers`,
      desk: [`Our desk: ${b.address.street}, Sala Dan, next to the pier`, `WhatsApp ${site.whatsapp.display}`, "Pay on the day, nothing online"],
      featured: ["4-islands", "koh-rok-koh-haa", "koh-phi-phi"].map((s) => byslug[s]),
      transfers: {
        photo: photo("home-transfers"),
        title: "Transfers to and from Koh Lanta",
        // « Private car or minivan » du prompt corrigé : VIP Taxi Lanta ne roule qu'en minivan hors de l'île (site.json brands.vip.vehicles).
        text: "Private minivan from Krabi and Phuket airports, Ao Nang, Trang and Khao Sok, and speedboat tickets to Phi Phi and Koh Lipe. You pay the driver on the day.",
        routes: [
          { from: "Krabi Airport", to: "Koh Lanta", text: "about 2–3 hours, including the car ferry", href: "/taxi/krabi-airport-koh-lanta/" },
          { from: "Phuket Airport", to: "Koh Lanta", text: "about 4–5 hours", href: "/taxi/phuket-airport-koh-lanta/" },
          { from: "Koh Lanta", to: "Ao Nang", text: "about 3 hours", href: "/taxi/koh-lanta-ao-nang/" }
        ]
      },
      activities: ["elephant-sanctuary", "kayak", "cooking-class", "scuba-diving", "atv", "batik"].map((s) => byslug[s]),
      steps: [
        { title: "Pick a trip, a date and your pickup", text: "On the page you choose the option and the number of people." },
        { title: "Send it on WhatsApp", text: "The message is written for you. We reply with the total and the pickup time." },
        { title: "Pay on the day", text: "Cash at the desk or on the day. The park fee goes to the ranger." }
      ],
      deskSection: {
        photo: photo("home-desk"),
        text: `${b.address.street}, Sala Dan, Koh Lanta Yai. Two minutes on foot from Sala Dan pier.`,
        rules: [
          { title: "Address", text: b.address.display },
          { title: "WhatsApp", text: site.whatsapp.display },
          { title: "Operated by", text: site.operator.name + (b.licence ? `, TAT licence ${b.licence}` : "") }
        ]
      },
      final: { photo: photo("home-final"), title: "Not sure which trip?", text: "Tell us your dates, who's coming and where you're staying. We'll tell you what runs that day and what it costs." }
    },
    four: {
      product: four,
      seo: { title: "4 Islands Tour from Koh Lanta, from 1,000 THB | Secret Travel & Tour", metaDescription: "Emerald Cave, Koh Ngai and two snorkelling stops, by longtail or speedboat. Join-in from 1,000 THB, private longtail from 5,900 THB, hotel pickup included." },
      hero: photo("four-hero"),
      h1: "4 Islands tour from Koh Lanta",
      lead: "A full day south of Koh Lanta: snorkelling at Koh Chueak, the swim through the Emerald Cave on Koh Mook, and a beach lunch on Koh Ngai or Koh Kradan.",
      facts: ["Full day", `Pickup ${fact(four, "Hotel pickup")}`, fact(four, "Boat"), fact(four, "Format")].join(" · "),
      price: { amount: view.thb(four.price.from), unit: four.price.unit, option: view.price(four).option },
      gallery: ["four-gallery-reef", "four-gallery-ngai", "four-gallery-kradan", "four-gallery-pier"].map(photo),
      versus: {
        photo: photo("four-longtail"),
        paragraphs: [
          "The longtail is the traditional wooden boat: open, slower, and it stops at Koh Ma. Lunch is on Koh Ngai.",
          "The speedboat is faster, stops at Koh Kradan instead of Koh Ma, and lunch is on Koh Kradan. Both usually leave from Lanta Old Town pier.",
          "On a private longtail you choose the order of the islands and can add Koh Kradan."
        ],
        rows: [
          ["Boat", "Longtail", "Speedboat"],
          ["Stops", "Koh Ma", "Koh Kradan"],
          ["Lunch", "Koh Ngai", "Koh Kradan"],
          ["Pier", "Lanta Old Town", "Lanta Old Town"],
          ["Price", "from 1,000 THB", "from 2,000 THB"]
        ]
      },
      options: options(four),
      notIncluded: fee ? `Not included: national park fee, ${view.thb(fee.adult)} per adult and ${view.thb(fee.child)} per child (Thai nationals ${fee.thai.adult} / ${fee.thai.child} THB), paid in cash to the ranger on the island.` : "",
      day: {
        title: four.day[0].title,
        steps: four.day[0].steps.map((s) => ({ t: s.range || s.time, title: s.place, text: s.detail })),
        note: "Times shift a little with the tide and the sea."
      },
      included: four.included,
      notIncludedList: four.notIncluded,
      beforeBook: view.beforeBook(four, site, { skipParkFee: true }).map((i) => ({ title: i.label, text: i.text })),
      faq: four.faq,
      related: ["koh-rok-koh-haa", "koh-phi-phi", "koh-talabeng-koh-bubu"].map((s) => byslug[s]),
      booking: view.bookingTour(four, site)
    },
    hub: {
      seo: { title: "Boat Trips and Activities from Koh Lanta | Secret Travel & Tour", metaDescription: "All the boat trips and island activities we book from our desk in Sala Dan, Koh Lanta, with prices: 4 Islands, Koh Rok, Phi Phi, kayak, diving, elephants." },
      final: { photo: photo("hub-final"), title: "Can't decide?", text: "Send us your dates and we'll say what runs that day." }
    },
    credits: PHOTOS.filter((p) => p.placeholder).map((p) => ({ usage: p.usage, author: p.author, licence: p.licence, url: p.url, source: p.source }))
  };

  // AVIF et WebP de 480 à 2 000 px, jamais au-delà de la largeur native.
  await view.responsive([data.home, data.four, data.hub, data.boats, data.activities], { widths: [480, 720, 960, 1200, 1600, 2000], avif: 45, webp: 70 });
  return data;
};
