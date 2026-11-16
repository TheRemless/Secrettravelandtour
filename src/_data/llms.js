// /llms.txt et /llms-full.txt pour les assistants IA (ChatGPT, Perplexity, Claude, Gemini), demande de Jérémy du 16.11.2026.
// Format llmstxt.org : titre H1, résumé en citation, sections H2 de liens « - [Titre](URL absolue): une phrase ».
// Tout est lu dans les mêmes données que les pages, au build : site.json, products/** (via components/view.js, comme
// les fiches), taxiPages.js (trajets, prix d'appel, durées), songthaew.json, cancellation.js. Aucun nom de prestataire,
// aucune adresse de bureau, aucune note Google. Phrases courtes et factuelles, en anglais.
const fs = require("node:fs");
const path = require("node:path");
const site = require("./site.json");
const view = require("../_includes/components/view.js");
const booking = require("../js/booking.js");
const songthaew = require("./songthaew.json");
const taxi = require("./taxi.json");

const DATA = __dirname;
const P = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, "products", rel + ".json"), "utf8"));
const list = (folder) => fs.readdirSync(path.join(DATA, "products", folder)).filter((n) => n.endsWith(".json")).sort().map((n) => P(folder + "/" + n.replace(/\.json$/, "")));
const abs = (u) => site.url + u;
const fact = (p, label) => ((p.facts || []).find((f) => f.label === label) || {}).value || "";
const dot = (s) => (s && !/[.!?]$/.test(s) ? s + "." : s || "");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");
const joinList = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : a[0] || "");

// Fiches dans l'ordre du site (groupes du hub /tours/) : bateaux, puis activités.
const { GROUPS } = require("../_includes/components/groups.js");
const BOATS = ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "sunset-dinner-raft", "sunrise-raft", "fishing-trip", "mangroves"];
const tours = Object.fromEntries(list("tours").map((p) => [p.slug, p]));
const acts = Object.fromEntries(list("activities").map((p) => [p.slug, p]));
const order = GROUPS.flatMap((g) => g.slugs);
const boatList = order.filter((s) => BOATS.includes(s)).map((s) => tours[s]).concat(Object.values(tours).filter((p) => !order.includes(p.slug)));
const actList = order.filter((s) => acts[s]).map((s) => acts[s]).concat(Object.values(acts).filter((p) => !order.includes(p.slug)));
const rental = P("rental");
const speedboat = P("secret-transfers/speedboat-ferry");
const shared = P("secret-transfers/shared-minivan");
const taxiPages = require("./taxiPages.js")();
const routes = taxiPages.routes;
const dayTrip = taxiPages.dayTrip;
const cancellation = require("./cancellation.js")();

// Âges enfants de l'option du prix d'appel : « Children 4 to 11 pay a child rate, under 4 free. »
function childLine(p) {
  const opts = view.options(p).list;
  const main = opts.find((o) => o.id === (view.price(p) || {}).option) || opts[0];
  if (!main) return "";
  const child = main.rows.find((r) => /^Child,? \d+ to \d+/.test(r.label));
  const free = main.rows.find((r) => /under \d+/i.test(r.label) && r.amount === 0);
  const ages = child ? child.label.match(/(\d+) to (\d+)/) : null;
  return [ages ? `Child rate from ${ages[1]} to ${ages[2]}` : "", free ? `under ${free.label.match(/under (\d+)/i)[1]} free` : ""].filter(Boolean).join(", ");
}
function priceLine(p) {
  const pr = view.price(p);
  if (!pr) return "Price on WhatsApp";
  return /^(per|for)\b/.test(p.price.unit) ? `From ${pr.amount} ${p.price.unit}` : `From ${pr.amount}, ${p.price.unit}`;
}
// Une ligne de llms.txt : promesse (ou accroche), prix d'appel, durée, enfants, saison.
function shortLine(p) {
  const bits = [dot(cap(p.promise || p.lead)), dot(priceLine(p))];
  const said = bits.join(" ").toLowerCase();
  // Durée et saison seulement si la promesse ou le prix ne les disent pas déjà.
  const dur = fact(p, "Duration");
  if (dur && !said.includes(dur.toLowerCase())) bits.push(dot(cap(dur)));
  const season = fact(p, "Season");
  if (season && season !== "All year" && !said.includes(season.toLowerCase())) bits.push(dot("Season: " + lc(season)));
  const kids = childLine(p) || fact(p, "Ages") || fact(p, "Children");
  if (kids) bits.push(dot(cap(kids)));
  return bits.join(" ");
}
const link = (title, url, text) => `- [${title}](${abs(url)}): ${text}`;

// ---------- Faits communs ----------
const brand = site.brands.secret;
const vip = site.brands.vip;
const langs = joinList(site.languages);
const wa = site.whatsapp.display;
const payTrips = "Boat trips and activities are paid in cash or by bank transfer. There is no online payment.";
const payTransfers = (taxi.faq.find((f) => f.q === "How do I pay?") || {}).a.replace(" and no hidden fees", "");
const todayIso = booking.bangkokToday(new Date());

const summary = [
  `${brand.name} is a licensed travel agency (TAT licence ${brand.licence}) based on Koh Lanta, Krabi province, Thailand.`,
  `It books boat trips, island activities, speedboat seats and scooter and car rental, and private minivan transfers across Southern Thailand run by its transfer partner ${vip.name}.`,
  `Bookings are made on ${site.booking.channel} (${wa}); the team replies ${site.replyTime.usual}, in ${langs}. ${payTrips}`
].join(" ");

// ---------- llms.txt ----------
function shortFile() {
  const L = [];
  L.push(`# ${brand.name}`, "", `> ${summary}`, "");
  L.push(`Updated: ${todayIso}. Prices are in Thai baht (THB) and come from the trip pages of ${site.url}. The full version, with every option, price and question, is at ${abs("/llms-full.txt")}.`, "");
  L.push("## Boat trips", "");
  boatList.forEach((p) => L.push(link(p.name, p.url, shortLine(p))));
  L.push("", "## Activities", "");
  actList.forEach((p) => L.push(link(p.name, p.url, shortLine(p))));
  L.push("", "## Transfers and taxi", "");
  L.push(link(`${vip.name}, private minivan transfers`, "/taxi/", `Private minivans for your group only, between airports, piers, national parks and towns across Southern Thailand. Price per vehicle. ${payTransfers}`));
  routes.forEach((r) => L.push(link(r.name, r.url, `Private minivan for your group, ${r.drive}, ${lc(r.price.label)} per vehicle.`)));
  L.push(link(dayTrip.name, dayTrip.url, `${dayTrip.lead} ${dayTrip.price.label} per vehicle.`));
  L.push(link("Songthaew taxis on Koh Lanta", "/taxi/songthaew/", `On Koh Lanta the taxis are songthaews. ${songthaew.sections[0].p[0]} Booked for your group only. Price on WhatsApp.`));
  L.push(link("Shared minivan and all transfer options", "/transfers/", `${fact(shared, "Shared minivan")}. ${fact(shared, "Shared transfers")}.`));
  L.push(link("Speedboat timetable", speedboat.url, `From ${fact(speedboat, "Departure pier")} to ${fact(speedboat, "Destinations")}. ${dot(fact(speedboat, "Hotel pickup").replace(/^Included on Koh Lanta/, "Hotel pickup included on Koh Lanta"))} Fare on WhatsApp.`));
  L.push(link("Scooter and car rental", rental.url, `${rentalLine()} Deposit: ${lc(rental.beforeYouBook.deposit)}`));
  L.push("", "## Practical info", "");
  L.push(link("How to book", "/", `Send the trip, the date, the number of adults and the age of each child on ${site.booking.channel} (${wa}). The team replies ${site.replyTime.usual}, with the price and the pickup time. ${payTrips}`));
  L.push(link("Cancellation rules", cancellation.url, cancellation.summary));
  L.push(link("Booking terms", "/terms/", `Booking terms of ${brand.name}, operated by ${site.operator.name.replace(/\.$/, "")}.`));
  L.push("", "## Optional", "");
  L.push(link("All boat trips and activities", "/tours/", "Every trip with its price, by group: islands, mangroves, on land."));
  L.push(link("Privacy", "/privacy/", "How the site handles personal data and cookies."));
  L.push(link("Legal notice", "/legal/", "Publisher and hosting of the site."));
  return L.join("\n") + "\n";
}
function rentalLine() {
  return rental.options.slice().reverse().map((o) => {
    const a = o.prices.map((r) => r.amount);
    return `${o.label}: ${view.thb(Math.min(...a)).replace(" THB", "")} to ${view.thb(Math.max(...a))} ${o.prices[0].unit}.`;
  }).join(" ");
}

// ---------- llms-full.txt ----------
function productBlock(p) {
  const L = [];
  L.push(`## ${p.name}`, "", `URL: ${abs(p.url)}`, "");
  L.push(dot(p.lead || p.promise), "");
  (p.facts || []).forEach((f) => L.push(`- ${f.label}: ${f.value}`));
  const opts = view.options(p).list;
  if (opts.length) {
    L.push("", "Options and prices:");
    opts.forEach((o) => {
      L.push(`- ${o.title}: ` + o.rows.map((r) => `${r.label}: ${r.price}${r.unit ? " " + r.unit : ""}`).join("; ") + ".");
      if (o.note) L.push(`  ${dot(o.note)}`);
    });
  } else if (p.priceOnRequest) L.push("", "Price: on WhatsApp.");
  // Chaque journée de la fiche (longtail, speedboat, catamaran…), avec son titre.
  (p.day || []).filter((d) => d.steps && d.steps.length).forEach((day) => {
    L.push("", `${day.title} (times are approximate):`);
    day.steps.forEach((s) => L.push(`- ${s.range || s.time}: ${dot(s.text)}`));
  });
  if ((p.included || []).length) L.push("", "Included: " + p.included.join("; ") + ".");
  if ((p.notIncluded || []).length) L.push("Not included: " + p.notIncluded.join("; ") + ".");
  const b = p.beforeYouBook || {};
  const before = [["Pickup", b.pickup], ["Children", b.children], ["Health", b.health], ["Weather", b.weather], ["Cancellation", b.cancellation], ["Bring", Array.isArray(b.bring) ? b.bring.join(", ") : b.bring]].filter((x) => x[1]);
  if (before.length) { L.push("", "Before you book:"); before.forEach(([k, v]) => L.push(`- ${k}: ${dot(v)}`)); }
  if ((p.faq || []).length) {
    L.push("", "Questions:");
    p.faq.forEach((f) => L.push(`- Q: ${f.q}`, `  A: ${f.a}`));
  }
  L.push("");
  return L;
}
function fullFile() {
  const L = [];
  L.push(`# ${brand.name}, full details`, "", `> ${summary}`, "");
  L.push(`Updated: ${todayIso}. Prices are in Thai baht (THB), generated from the pages of ${site.url} at each update. Short version: ${abs("/llms.txt")}.`, "");
  L.push("# Boat trips", "");
  boatList.forEach((p) => L.push(...productBlock(p)));
  L.push("# Activities", "");
  actList.forEach((p) => L.push(...productBlock(p)));
  L.push("# Rental", "");
  L.push(...productBlock(rental));
  L.push("# Transfers and taxi", "");
  L.push(`Private minivan transfers are run by ${vip.name}, the transfer partner of ${brand.name}, for your group only. ${payTransfers} Prices are per vehicle, for 1 or 2 people; the team confirms the price for your group on WhatsApp.`, "");
  L.push("## Private minivan routes", "");
  routes.forEach((r) => L.push(`- ${r.name}: ${r.drive}, ${lc(r.price.label)} per vehicle. ${abs(r.url)}`));
  L.push(`- ${dayTrip.name}: ${lc(dayTrip.price.label)} per vehicle. ${dayTrip.lead} ${abs(dayTrip.url)}`);
  L.push(`- Other places: ${taxiPages.further} ${abs("/taxi/")}`, "");
  L.push("## Questions about private transfers", "");
  taxi.faq.filter((f) => !/hidden fees/.test(f.a) || f.q === "How do I pay?").forEach((f) => L.push(`- Q: ${f.q}`, `  A: ${f.a.replace(" and no hidden fees", "")}`));
  L.push("", "## Songthaew taxis on Koh Lanta", "", `URL: ${abs("/taxi/songthaew/")}`, "");
  songthaew.sections.forEach((s) => s.p.forEach((t) => L.push(t)));
  L.push("");
  L.push(...productBlock(shared));
  L.push(...productBlock(speedboat));
  L.push("# Booking, cancellation and contact", "");
  L.push(`- Booking: on ${site.booking.channel} only. Send the trip, the date, the number of adults and the age of each child. Nothing is booked until the team confirms.`);
  L.push(`- Reply time: ${site.replyTime.usual}.`);
  L.push(`- Languages: ${langs}.`);
  L.push(`- Payment: ${payTrips} Private transfers: ${lc(payTransfers)}`);
  L.push(`- WhatsApp: ${site.whatsapp.e164}, ${site.whatsapp.link}`);
  L.push(`- Licence: TAT licence ${brand.licence}. Operator: ${site.operator.name.replace(/\.$/, "")}.`);
  L.push(`- Weather: ${site.booking.weather}`);
  L.push(`- Cancellation: ${cancellation.summary} ${abs(cancellation.url)}`, "");
  L.push("## Cancellation rule of each trip", "");
  cancellation.groups.forEach((g) => g.items.forEach((i) => L.push(`- ${i.name}: ${i.rule}`)));
  L.push("");
  return L.join("\n");
}

module.exports = () => ({ short: shortFile(), full: fullFile(), updated: todayIso, products: boatList.concat(actList, [rental, speedboat, shared]).map((p) => ({ slug: p.slug, name: p.name, url: p.url })), routes: routes.map((r) => ({ name: r.name, url: r.url, thb: r.price.thb })).concat([{ name: dayTrip.name, url: dayTrip.url, thb: dayTrip.price.thb }]) });
