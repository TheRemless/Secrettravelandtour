module.exports = async function (eleventyConfig) {
  // Images responsives : chaque <img src="/images/..."> du HTML généré est converti en WebP
  // à plusieurs largeurs, avec srcset, width et height. Les fichiers sortent dans /img/ avec un nom
  // haché (cache long côté Netlify). Pour exclure une image : <img eleventy:ignore ...>.
  const { eleventyImageTransformPlugin } = await import("@11ty/eleventy-img");
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp"],
    widths: [480, 800, 1100, 1600],
    urlPath: "/img/",
    outputDir: "_site/img/",
    htmlOptions: {
      imgAttributes: { decoding: "async", sizes: "auto" },
    },
    sharpWebpOptions: { quality: 72, effort: 5 },
    failOnError: true,
  });

  // JSON-LD sérialisé sans risque de fermer la balise <script> (components/schema.js).
  eleventyConfig.addFilter("jsonld", (obj) => require("./src/_includes/components/schema.js").toScript(obj));

  // Nombre en toutes lettres (anglais) pour les liens « All six boat trips ».
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];
  eleventyConfig.addFilter("numwords", (n) => WORDS[n] || String(n));

  // Mot à trait d'union (« mid-October ») gardé sur une ligne ; Manrope n'a pas de trait insécable. Texte échappé ici.
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  eleventyConfig.addFilter("keephy", (s) => String(s || "").replace(/[&<>"]/g, (c) => ESC[c]).replace(/\b([A-Za-z]+-[A-Za-z]+)\b/g, '<span class="nw">$1</span>'));

  // Fichiers copiés tels quels, avec les mêmes adresses publiques.
  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/images": "images",
    "src/favicon.ico": "favicon.ico",
    "src/robots.txt": "robots.txt"
  });

  // Captures avant/après de la planche /design/ : copiées seulement hors production, comme la planche.
  if (process.env.CONTEXT !== "production") {
    eleventyConfig.addPassthroughCopy({ "src/design/compare": "design/compare" });
    // Propositions du design v4 (prototypes autonomes des agents) sur la preview, sous /_v4/.
    // Leurs images pointent vers /src/images/ : on copie aussi les originaux, mais pas les captures.
    eleventyConfig.on("eleventy.after", ({ dir }) => {
      const fs = require("node:fs");
      const path = require("node:path");
      const skip = /[\\/](shots|tools|_build)([\\/]|$)|\.mjs$/;
      fs.cpSync("docs/refonte/design-v4", path.join(dir.output, "_v4"), { recursive: true, filter: (f) => !skip.test(f) });
      fs.cpSync("src/images", path.join(dir.output, "src/images"), { recursive: true });
    });
  }

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "html"]
  };
};
