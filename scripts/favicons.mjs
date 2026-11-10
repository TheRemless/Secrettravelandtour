// Favicons de Secret Travel & Tour : l'emblème d'origine, sans recadrage ni retouche, centré dans un carré.
// Source : assets/emblem-source.png (511 × 420, découpé du fichier « Logo Secret.png » de 2000 px).
// À relancer à la main quand le fichier HD de l'enseigne arrive : node scripts/favicons.mjs
import sharp from "sharp";

const SRC = "assets/emblem-source.png";
const OUT = "src/images/secret";
const SAND = { r: 245, g: 240, b: 230, alpha: 1 };

// Sur fond sable, comme demandé par la critique (iOS remplirait la transparence en noir).
for (const size of [32, 180, 512]) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: SAND, kernel: "lanczos3" })
    .flatten({ background: SAND })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/favicon-${size}.png`);
}
console.log("favicons 32, 180, 512 écrits dans", OUT);
