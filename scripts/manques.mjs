// Liste des informations manquantes et des photos à fournir, générée à chaque build à partir
// des données de la refonte (src/_data/site.json et src/_data/products/**). Ne modifie aucune page.
// Sorties : docs/refonte/manques.md et docs/refonte/photos-a-fournir.md (ne pas éditer à la main).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "src", "_data");
const PRODUCTS = path.join(DATA, "products");
const OUT = path.join(ROOT, "docs", "refonte");

// Ordre d'affichage : commun, puis Secret (bateaux, activités, location, transferts), puis VIP.
const ORDER = ["tours", "activities", "", "secret-transfers", "taxi"];
const BRAND = { secret: "Secret Travel & Tour", vip: "VIP Taxi Lanta" };

function readProducts() {
  const out = [];
  for (const folder of ORDER) {
    const dir = path.join(PRODUCTS, folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      out.push({ file: path.posix.join("src/_data/products", folder, name), data });
    }
  }
  return out;
}

// Toute chaîne contenant TODO(client), où qu'elle soit dans le fichier (pas seulement dans todo[]).
function collectTodos(value, acc = []) {
  if (typeof value === "string") {
    if (value.includes("TODO(client)")) acc.push(value.replace(/^TODO\(client\):\s*/, ""));
  } else if (Array.isArray(value)) value.forEach((v) => collectTodos(v, acc));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectTodos(v, acc));
  return [...new Set(acc)];
}

const site = JSON.parse(fs.readFileSync(path.join(DATA, "site.json"), "utf8"));
const products = readProducts();

// Pages : le commun (site.json) puis chaque produit.
const pages = [
  { title: "Commun aux deux marques", where: "src/_data/site.json", brand: null, todos: collectTodos(site), photos: Object.entries(site.brands).flatMap(([b, v]) => (v.photos || []).map((p) => ({ ...p, brand: b }))) }
].concat(products.map(({ file, data }) => ({ title: `${data.name} (${data.url})`, where: file, brand: data.brand, todos: collectTodos(data), photos: data.photos || [] })));

// manques.md
const total = pages.reduce((n, p) => n + p.todos.length, 0);
const withTodos = pages.filter((p) => p.todos.length);
let md = "# Informations manquantes\n\n";
md += "Fichier généré par `scripts/manques.mjs` à chaque `npm run build`, à partir des `TODO(client)` de `src/_data/site.json` et `src/_data/products/`. Ne pas le modifier à la main : corriger la donnée source, puis relancer le build.\n\n";
md += `${total} points sur ${withTodos.length} pages. Une information absente n'est pas affichée sur le site (00-BRIEF §9).\n\n`;
md += "| Page | Points |\n|---|---|\n";
for (const p of withTodos) md += `| ${p.title} | ${p.todos.length} |\n`;
let currentBrand;
for (const p of withTodos) {
  if (p.brand !== currentBrand) {
    currentBrand = p.brand;
    md += `\n## ${p.brand ? BRAND[p.brand] : "Commun"}\n`;
  }
  md += `\n### ${p.title}\n\nSource : \`${p.where}\`\n\n`;
  for (const t of p.todos) md += `- ${t}\n`;
}

// photos-a-fournir.md
const STATUS = { replace: "à remplacer", missing: "manquante" };
const photoPages = pages.map((p) => ({ ...p, photos: p.photos.filter((ph) => ph.status === "replace" || ph.status === "missing") })).filter((p) => p.photos.length);
const nbPhotos = photoPages.reduce((n, p) => n + p.photos.length, 0);
let ph = "# Photos à fournir\n\n";
ph += "Fichier généré par `scripts/manques.mjs` à chaque `npm run build`, à partir des champs `photos[]` (statut `replace` ou `missing`) des données. Base : 01-audit-design §4.\n\n";
ph += "Format attendu pour chaque prise de vue :\n\n";
ph += "- paysage 3:2, 2 400 px de large au minimum, plus une version verticale 4:5 pour le mobile ;\n";
ph += "- JPEG en qualité maximale ou RAW, sans filtre, horizon droit, saturation d'origine ;\n";
ph += "- vraie photo prise dans la région, jamais un scan de brochure, une photo de banque ou une image générée ;\n";
ph += "- pas de photo de l'équipe (décision du client), autorisation écrite de toute personne reconnaissable ;\n";
ph += "- une photo ne sert qu'à un seul produit ; l'image de partage 1200×630 de chaque page est tirée de ces photos.\n\n";
ph += `${nbPhotos} prises de vue sur ${photoPages.length} pages. Faute de vraie photo, la page en affiche moins (00-BRIEF §7).\n`;
for (const p of photoPages) {
  ph += `\n## ${p.title}\n\n| Emplacement | Statut | Fichier actuel | Ce qui doit être visible |\n|---|---|---|---|\n`;
  for (const x of p.photos) {
    const shot = (x.shot || x.alt || "").replace(/\|/g, "/");
    ph += `| ${x.slot} | ${STATUS[x.status]} | ${x.file ? "`" + x.file + "`" : ""} | ${shot} |\n`;
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "manques.md"), md);
fs.writeFileSync(path.join(OUT, "photos-a-fournir.md"), ph);
console.log(`[manques] ${total} TODO(client) sur ${withTodos.length} pages -> docs/refonte/manques.md ; ${nbPhotos} photos -> docs/refonte/photos-a-fournir.md`);
