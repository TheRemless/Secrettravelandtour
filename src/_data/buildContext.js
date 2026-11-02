// Contexte du build pour les composants de la refonte. Netlify fournit CONTEXT=production
// uniquement pour le site en ligne : les emplacements « Photo to supply » et les planches /design/
// n'existent que dans les aperçus et en local.
const production = process.env.CONTEXT === "production";

module.exports = {
  production,
  showPhotoSlots: !production
};
