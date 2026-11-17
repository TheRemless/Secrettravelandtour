// Écrit _site/indexnow-manifest.json (adresse du sitemap → empreinte du contenu), lancé par `npm run build` après Eleventy.
// Le plugin Netlify IndexNow (netlify/plugins/indexnow/) compare ce fichier à celui du site en ligne pour n'envoyer
// que les pages nouvelles, modifiées ou supprimées.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lib from "../netlify/plugins/indexnow/lib.js";

const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "_site");
const manifest = lib.buildManifest(SITE);
fs.writeFileSync(path.join(SITE, lib.MANIFEST), JSON.stringify(manifest, null, 1) + "\n");
console.log(`[indexnow] manifest: ${Object.keys(manifest.pages).length} URLs`);
