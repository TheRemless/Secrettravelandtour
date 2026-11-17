// IndexNow : lecture du manifeste en ligne avant le build, puis envoi des adresses nouvelles, modifiées et supprimées
// une fois le déploi de production publié. Rien ici ne peut faire échouer le build ni le déploi : chaque erreur
// devient une ligne dans le journal du build.
const fs = require("node:fs");
const path = require("node:path");
const lib = require("./lib.js");
const site = require("../../../src/_data/site.json");

const log = (msg) => console.log("[indexnow] " + msg);
const reason = (e) => (e && (e.name === "TimeoutError" || e.name === "AbortError") ? "no answer within " + lib.TIMEOUT_MS / 1000 + " s" : String((e && e.message) || e));

// Seul le site en ligne envoie : ni aperçu de PR, ni déploi de branche, ni build local (netlify build sur un poste).
function isProduction(env = process.env, constants = {}) {
  return env.CONTEXT === "production" && !constants.IS_LOCAL;
}

// Manifeste servi par le site en ligne AVANT ce déploi. 404 : premier envoi. Autre échec : on ne sait pas ce qui a changé.
async function readPrevious({ fetchImpl = fetch, siteUrl = site.url } = {}) {
  try {
    const res = await fetchImpl(new URL("/" + lib.MANIFEST, siteUrl).href, { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(lib.TIMEOUT_MS) });
    if (res.status === 404) return { status: "none" };
    if (!res.ok) return { status: "error", detail: "HTTP " + res.status };
    const manifest = await res.json();
    const p = manifest && manifest.pages;
    if (!p || typeof p !== "object" || Array.isArray(p)) return { status: "error", detail: "unexpected content" };
    return { status: "ok", manifest };
  } catch (e) {
    return { status: "error", detail: reason(e) };
  }
}

// Un seul POST JSON. 200 et 202 : reçu. Tout le reste (400, 403, 422, 429, 5xx, réseau) : une ligne et on s'arrête.
async function submit(urls, { fetchImpl = fetch, siteUrl = site.url, key = site.indexnow.key } = {}) {
  const body = lib.payload(siteUrl, key, urls);
  const n = body.urlList.length;
  try {
    const res = await fetchImpl(lib.ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(lib.TIMEOUT_MS)
    });
    const ok = res.status === 200 || res.status === 202;
    log(ok ? `sent ${n} URL(s), HTTP ${res.status}` : `refused: HTTP ${res.status} for ${n} URL(s), nothing retried, deploy unaffected`);
    return { ok, status: res.status, count: n };
  } catch (e) {
    log(`not sent (${reason(e)}) for ${n} URL(s), deploy unaffected`);
    return { ok: false, status: 0, count: n };
  }
}

// Après publication : compare le manifeste précédent (lu avant le build) au nouveau et envoie la différence.
async function afterDeploy({ env = process.env, constants = {}, previous, fetchImpl = fetch, show } = {}) {
  try {
    if (!isProduction(env, constants)) {
      log(`context ${env.CONTEXT || "local"}${constants.IS_LOCAL ? " (local build)" : ""}: nothing sent`);
      return { sent: false };
    }
    if (!previous || previous.status === "error") {
      log(`previous manifest unreadable (${(previous && previous.detail) || "not read before the build"}): nothing sent`);
      return { sent: false };
    }
    const next = JSON.parse(fs.readFileSync(path.join(constants.PUBLISH_DIR || "_site", lib.MANIFEST), "utf8"));
    const first = previous.status === "none";
    const d = lib.diff(first ? null : previous.manifest, next);
    log(`${d.added.length} new, ${d.changed.length} changed, ${d.removed.length} deleted${first ? " (first run: every sitemap URL)" : ""}`);
    if (!d.urls.length) return { sent: false, diff: d };
    const r = await submit(d.urls, { fetchImpl });
    if (show) {
      try {
        show({ title: "IndexNow", summary: r.ok ? `${r.count} URL(s) sent (HTTP ${r.status})` : `Not sent (HTTP ${r.status || "none"})` });
      } catch (e) { /* résumé du déploi facultatif */ }
    }
    return { sent: r.ok, diff: d, result: r };
  } catch (e) {
    log(`error (${reason(e)}): nothing sent, deploy unaffected`);
    return { sent: false };
  }
}

module.exports = { isProduction, readPrevious, submit, afterDeploy, log };
