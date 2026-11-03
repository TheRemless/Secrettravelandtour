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
