// Contrôle des photos du design v3 (PROMPT-DESIGN-V3.md §2.4, §4, §6) :
// - une image = un usage : un fichier n'apparaît qu'une fois dans src/_data/photos-v3.json ;
// - chaque fichier déclaré existe ;
// - src/data/placeholders.json liste les photos encore temporaires, par usage ;
// - le build de production échoue tant qu'il en reste, sauf STT_ALLOW_PLACEHOLDERS=1 (deploy previews).
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("src/_data/photos-v3.json", "utf8")).photos;
const errors = [];
const seen = new Map();
for (const p of data) {
  if (seen.has(p.file)) errors.push(`même fichier pour deux usages : ${p.file} (${seen.get(p.file)} et ${p.id})`);
  seen.set(p.file, p.id);
  if (!fs.existsSync(`src/images/${p.file}`)) errors.push(`fichier absent : ${p.file}`);
  if (p.placeholder && !(p.source && p.author && p.licence && p.url)) errors.push(`crédit incomplet : ${p.id}`);
  if (p.placeholder && /our (boat|team|desk|driver)/i.test(p.alt)) errors.push(`texte alternatif trompeur : ${p.id}`);
}
const placeholders = data.filter((p) => p.placeholder).map((p) => ({ id: p.id, usage: p.usage, file: p.file, source: p.source, author: p.author, licence: p.licence, url: p.url, downloaded_at: p.downloaded_at || "", shot: p.shot }));
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/placeholders.json", JSON.stringify(placeholders, null, 2) + "\n");

// docs/refonte/photos-a-fournir.md : section v3 régénérée à partir de cette liste.
const md = ["# Photos à fournir (design v3)", "", "Fichier généré par `scripts/photos-v3.mjs` à chaque build. Chaque ligne est une photo temporaire à remplacer par une vraie photo.", "", "| Usage | Prise de vue attendue | Photo temporaire |", "|---|---|---|"]
  .concat(placeholders.map((p) => `| ${p.usage} | ${p.shot} | ${p.author}, ${p.licence} |`)).join("\n") + "\n";
fs.writeFileSync("docs/refonte/photos-a-fournir-v3.md", md);

const production = process.env.CONTEXT === "production" || process.env.NODE_ENV === "production";
if (production && placeholders.length && process.env.STT_ALLOW_PLACEHOLDERS !== "1") errors.push(`${placeholders.length} photos temporaires : la production attend les vraies photos (STT_ALLOW_PLACEHOLDERS=1 pour passer outre)`);

console.log(`[photos-v3] ${data.length} usages, ${placeholders.length} photos temporaires -> src/data/placeholders.json`);
if (errors.length) { for (const e of errors) console.error("[photos-v3] ÉCHEC : " + e); process.exit(1); }
