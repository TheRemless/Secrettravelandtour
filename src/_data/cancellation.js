// Page /cancellation/ (12.11.2026) : la règle d'annulation de chaque sortie, transfert et location, lue dans les fiches
// (beforeYouBook.cancellation, même texte que la ligne « Cancellation » de la fiche) ; à défaut, la phrase commune de
// site.json (booking.cancellationPolicy.default). Aucun nom de prestataire. Les règles internes à l'agence (paiement du
// prestataire, retenue) n'y sont pas.
const fs = require("node:fs");
const path = require("node:path");
const site = require("./site.json");

const DIR = path.join(__dirname, "products");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(DIR, rel), "utf8"));
const list = (folder) => fs.readdirSync(path.join(DIR, folder)).filter((n) => n.endsWith(".json")).sort().map((n) => read(path.join(folder, n)));

const policy = site.booking.cancellationPolicy;
const GROUPS = [
  { id: "boats", title: "Boat trips", items: () => list("tours") },
  { id: "activities", title: "Island activities", items: () => list("activities") },
  { id: "transfers", title: "Speedboat, ferry and minivan", items: () => list("secret-transfers") },
  { id: "rental", title: "Car and scooter rental", items: () => [read("rental.json")] }
];
const NAME = { rental: "Car and scooter rental", "speedboat-ferry": "Speedboat and ferry", "shared-minivan": "Shared minivan" };

module.exports = () => ({
  url: policy.url,
  summary: policy.summary,
  default: policy.default,
  groups: GROUPS.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items()
      .filter((p) => p.brand === "secret")
      .map((p) => ({ slug: p.slug, name: NAME[p.slug] || p.name, url: p.url, rule: (p.beforeYouBook && p.beforeYouBook.cancellation) || policy.default, own: Boolean(p.beforeYouBook && p.beforeYouBook.cancellation) }))
  })).concat([{
    id: "taxi",
    title: "Private taxis and minivans",
    items: [{ slug: "taxi", name: "VIP Taxi Lanta, all routes", url: "/taxi/", rule: policy.default, own: false }]
  }])
});
