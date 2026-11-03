// Favicons de Secret Travel & Tour : l'emblème d'origine, sans recadrage ni retouche, centré dans un carré.
// Source : assets/emblem-source.png (511 × 420, découpé du fichier « Logo Secret.png » de 2000 px).
// À relancer à la main quand le fichier HD de l'enseigne arrive : node scripts/favicons.mjs
import sharp from "sharp";

const SRC = "assets/emblem-source.png";
const OUT = "src/images/secret";
const SAND = { r: 245, g: 240, b: 230, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

// iOS remplit la transparence en noir : l'icône 180 px est posée sur le sable du site.
for (const [size, background] of [[32, CLEAR], [180, SAND], [512, CLEAR]]) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background, kernel: "lanczos3" })
    .flatten(background.alpha === 1 ? { background } : false)
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/favicon-${size}.png`);
}
console.log("favicons 32, 180, 512 écrits dans", OUT);
