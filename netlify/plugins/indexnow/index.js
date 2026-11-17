// Plugin Netlify local IndexNow (déclaré dans netlify.toml). Netlify n'accepte que des noms d'événements
// dans cet objet : la logique vit dans run.js et lib.js.
// - onPreBuild : lit /indexnow-manifest.json sur le site en ligne, avant que ce build ne le remplace.
// - onSuccess : « runs when the deploy succeeds » (docs.netlify.com/extend/develop-and-share/develop-build-plugins/),
//   donc après la publication : Bing lit la nouvelle page, pas l'ancienne.
const run = require("./run.js");

let previous;

module.exports = {
  // Une erreur non attrapée ici ferait échouer le build : tout passe par try/catch.
  async onPreBuild({ constants }) {
    try {
      if (!run.isProduction(process.env, constants)) return;
      previous = await run.readPrevious();
      run.log(previous.status === "ok" ? `previous manifest read (${Object.keys(previous.manifest.pages).length} URLs)` : previous.status === "none" ? "no previous manifest online: first run" : `previous manifest unreadable (${previous.detail})`);
    } catch (e) {
      previous = { status: "error", detail: String((e && e.message) || e) };
      run.log(`previous manifest unreadable (${previous.detail})`);
    }
  },
  async onSuccess({ constants, utils }) {
    await run.afterDeploy({ constants, previous, show: utils && utils.status && utils.status.show });
  }
};
