// Bandeau du site (contrat Site_Anais docs/gestion/bandeau-site.md, 17.11.2026) : marque, section et produit de chaque
// page, pour le choix du bandeau. Même règle que Gestion (src/gestion/js/site-produits.mjs) : la section vient du
// dossier de la fiche (tours/ islands, activities/ activities, secret-transfers/ transfers, rental, taxi/ taxi),
// le produit est l'identifiant de la fiche. Les hubs n'ont pas de produit ; /taxi/ a la section taxi, l'accueil et
// /tours/ n'en ont pas.
const fs = require("node:fs");
const path = require("node:path");

const DIR = path.join(__dirname, "products");
const SECTION = { tours: "islands", activities: "activities", "secret-transfers": "transfers", taxi: "taxi" };

module.exports = () => {
  const map = { "/taxi/": { brand: "taxi", section: "taxi", product: "" } };
  const add = (p, section) => {
    if (!p.url || !p.slug) return;
    map[p.url] = { brand: p.url.startsWith("/taxi/") ? "taxi" : "secret", section, product: p.slug };
  };
  for (const [folder, section] of Object.entries(SECTION)) {
    for (const n of fs.readdirSync(path.join(DIR, folder)).filter((x) => x.endsWith(".json"))) add(JSON.parse(fs.readFileSync(path.join(DIR, folder, n), "utf8")), section);
  }
  add(JSON.parse(fs.readFileSync(path.join(DIR, "rental.json"), "utf8")), "rental");
  return map;
};
