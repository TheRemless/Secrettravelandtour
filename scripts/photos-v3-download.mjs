// Télécharge les photos placeholders de src/_data/photos-v3.json (ou copie les photos locales de la société),
// réduites à 2 400 px de large en JPEG. Lancer une fois à la main : node scripts/photos-v3-download.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const sharp = createRequire(import.meta.url)("sharp");
const data = JSON.parse(fs.readFileSync("src/_data/photos-v3.json", "utf8"));
const UA = { "User-Agent": "STT-refonte/1.0 (jeremylaner@gmail.com)" };
for (const p of data.photos) {
  const out = path.join("src/images", p.file);
  if (fs.existsSync(out) || (!p.download && !p.local)) continue;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let buf;
  if (p.local) buf = fs.readFileSync(p.local);
  else {
    // curl plutôt que fetch : upload.wikimedia.org ne répond pas à fetch depuis ce poste.
    try { buf = execFileSync("curl", ["-4", "-sfL", "--retry", "3", "-m", "180", "-A", UA["User-Agent"], p.download], { maxBuffer: 80 * 1024 * 1024 }); }
    catch (e) { console.log("ÉCHEC", p.id); continue; }
  }
  const img = sharp(buf).rotate();
  const meta = await img.metadata();
  await img.resize({ width: Math.min(meta.width, 2400), withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
  const m = await sharp(out).metadata();
  console.log("ok", p.id, `${m.width}×${m.height}`);
  p.downloaded_at = new Date().toISOString().slice(0, 10);
}
fs.writeFileSync("src/_data/photos-v3.json", JSON.stringify(data, null, 2) + "\n");
