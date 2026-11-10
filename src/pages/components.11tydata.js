// Page de composants du design v4 : aucune sortie en production (permalink false), seulement sur les aperçus.
const production = process.env.CONTEXT === "production";
module.exports = production
  ? { permalink: false, eleventyExcludeFromCollections: true }
  : { permalink: "/_components/" };
