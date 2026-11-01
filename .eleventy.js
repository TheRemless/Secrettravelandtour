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

  // Fichiers copiés tels quels, avec les mêmes adresses publiques.
  eleventyConfig.addPassthroughCopy({
    "src/css": "css",
    "src/js": "js",
    "src/images": "images",
    "src/favicon.ico": "favicon.ico",
    "src/robots.txt": "robots.txt"
  });

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
