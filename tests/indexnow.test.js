// IndexNow (demande de Jérémy, 17.11.2026) : clé servie à la racine, manifeste stable, détection des pages changées,
// envoi après publication en production seulement, et jamais d'échec du build. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const lib = require("../netlify/plugins/indexnow/lib.js");
const run = require("../netlify/plugins/indexnow/run.js");
const site = require("../src/_data/site.json");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const KEY = site.indexnow.key;
const PROD = { CONTEXT: "production" };

// fetch factice : note chaque appel et répond selon `answer` (statut, objet JSON, ou erreur à lever).
function fakeFetch(answer) {
  const calls = [];
  const f = async (url, opts = {}) => {
    calls.push({ url, opts });
    const a = typeof answer === "function" ? answer(url, opts) : answer;
    if (a instanceof Error) throw a;
    const status = typeof a === "number" ? a : 200;
    return { status, ok: status >= 200 && status < 300, json: async () => (typeof a === "object" ? a : {}) };
  };
  f.calls = calls;
  return f;
}
const quiet = async (fn) => {
  const lines = [];
  const orig = console.log;
  console.log = (...a) => lines.push(a.join(" "));
  try { return { value: await fn(), lines }; } finally { console.log = orig; }
};

// Petit site de deux pages, dans un dossier temporaire, pour les tests de détection.
function miniSite(pages) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "indexnow-"));
  const locs = Object.keys(pages).map((p) => `<url><loc>${site.url}${p}</loc></url>`).join("");
  fs.writeFileSync(path.join(dir, "sitemap.xml"), `<?xml version="1.0"?><urlset>${locs}</urlset>`);
  for (const [p, html] of Object.entries(pages)) {
    fs.mkdirSync(path.join(dir, p), { recursive: true });
    fs.writeFileSync(path.join(dir, p, "index.html"), html);
  }
  return dir;
}
const page = (body, v = "abc123", nav = "Menu") => `<!doctype html><html><head><title>T</title><link rel="stylesheet" href="/css/v4.css?v=${v}"></head><body><header>${nav}</header><main><h1>${body}</h1><script src="/js/v4.js?v=${v}" defer></script></main><footer>©</footer></body></html>`;

test("clé IndexNow : 32 caractères hexadécimaux, servie telle quelle à la racine (/<clé>.txt)", () => {
  assert.match(KEY, /^[0-9a-f]{32}$/);
  assert.equal(fs.readFileSync(path.join(ROOT, "src", KEY + ".txt"), "utf8"), KEY);
  assert.equal(fs.readFileSync(path.join(SITE, KEY + ".txt"), "utf8"), KEY, "copiée par Eleventy sans changement");
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  assert.ok(toml.includes(`for = "/${KEY}.txt"`), "en-tête text/plain sur le fichier de clé");
});

test("plugin déclaré dans netlify.toml, manifest.yml présent, seuls des événements Netlify exportés", () => {
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  assert.match(toml, /\[\[plugins\]\]\s*\n\s*package = "\.\/netlify\/plugins\/indexnow"/);
  assert.match(fs.readFileSync(path.join(ROOT, "netlify/plugins/indexnow/manifest.yml"), "utf8"), /^name: \S+/m);
  const plugin = require("../netlify/plugins/indexnow/index.js");
  assert.deepEqual(Object.keys(plugin).sort(), ["onPreBuild", "onSuccess"]);
  assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).scripts.build.includes("node scripts/indexnow-manifest.mjs"));
});

test("manifeste : les adresses du sitemap et elles seules, empreinte stable d'un calcul à l'autre", () => {
  const shipped = JSON.parse(fs.readFileSync(path.join(SITE, lib.MANIFEST), "utf8"));
  const locs = lib.sitemapUrls(fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8"));
  assert.deepEqual(Object.keys(shipped.pages), [...locs].sort());
  assert.ok(locs.length >= 40);
  assert.ok(Object.keys(shipped.pages).every((u) => u.startsWith(site.url + "/") && !/\/(design|_v4)\//.test(u)));
  assert.ok(Object.values(shipped.pages).every((h) => /^[0-9a-f]{16}$/.test(h)));
  assert.deepEqual(lib.buildManifest(SITE), shipped, "recalcul sur le même _site : même manifeste");
  assert.ok(!fs.readFileSync(path.join(SITE, "sitemap.xml"), "utf8").includes("indexnow"), "le manifeste n'est pas dans le sitemap");
});

test("empreinte : la version du build (?v=), les espaces, l'en-tête et le pied ne comptent pas ; le contenu, si", () => {
  assert.equal(lib.hash(page("Kayak")), lib.hash(page("Kayak", "zz9xk2")));
  assert.equal(lib.hash(page("Kayak")), lib.hash(page("Kayak").replace("<h1>", "\n   <h1>")));
  assert.equal(lib.hash(page("Kayak")), lib.hash(page("Kayak", "abc123", "Menu changé")));
  assert.notEqual(lib.hash(page("Kayak")), lib.hash(page("Kayak tour")));
  const meta = (d) => page("Kayak").replace("<title>", `<meta name="description" content="${d}"><title>`);
  assert.notEqual(lib.hash(meta("A")), lib.hash(meta("B")), "méta description");
});

test("détection : une page modifiée donne une seule adresse ; ajout et suppression signalés", () => {
  const a = lib.buildManifest(miniSite({ "/": page("Home"), "/tours/kayak/": page("Kayak"), "/tours/old/": page("Old") }));
  const same = lib.buildManifest(miniSite({ "/": page("Home", "new1"), "/tours/kayak/": page("Kayak", "new1"), "/tours/old/": page("Old", "new1") }));
  assert.deepEqual(lib.diff(a, same).urls, [], "deux builds identiques (seul ?v= change) : rien à envoyer");
  const b = lib.buildManifest(miniSite({ "/": page("Home"), "/tours/kayak/": page("Kayak, now 3 h"), "/tours/old/": page("Old") }));
  assert.deepEqual(lib.diff(a, b).urls, [site.url + "/tours/kayak/"]);
  const c = lib.buildManifest(miniSite({ "/": page("Home"), "/tours/kayak/": page("Kayak"), "/tours/new/": page("New") }));
  const d = lib.diff(a, c);
  assert.deepEqual([d.added, d.changed, d.removed], [[site.url + "/tours/new/"], [], [site.url + "/tours/old/"]]);
  assert.deepEqual(d.urls, [site.url + "/tours/new/", site.url + "/tours/old/"], "la page supprimée est envoyée (le moteur voit le 404)");
  assert.deepEqual(lib.diff(null, a).added.length, 3, "premier envoi : toutes les adresses");
});

test("corps de l'envoi : {host, key, keyLocation, urlList}, hôte du site seulement, 10 000 adresses au plus", () => {
  const body = lib.payload(site.url, KEY, [site.url + "/", site.url + "/tours/kayak/", "https://example.com/x"]);
  assert.deepEqual(body, { host: "secrettravelandtour.com", key: KEY, keyLocation: `https://secrettravelandtour.com/${KEY}.txt`, urlList: ["https://secrettravelandtour.com/", "https://secrettravelandtour.com/tours/kayak/"] });
  const many = Array.from({ length: 10050 }, (_, i) => `${site.url}/p${i}/`);
  assert.equal(lib.payload(site.url, KEY, many).urlList.length, 10000);
});

test("envoi : un seul POST JSON vers api.indexnow.org, avec délai maximal", async () => {
  const f = fakeFetch(202);
  const { value, lines } = await quiet(() => run.submit([site.url + "/tours/kayak/"], { fetchImpl: f }));
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, "https://api.indexnow.org/indexnow");
  assert.equal(f.calls[0].opts.method, "POST");
  assert.match(f.calls[0].opts.headers["content-type"], /^application\/json/);
  assert.deepEqual(JSON.parse(f.calls[0].opts.body).urlList, [site.url + "/tours/kayak/"]);
  assert.ok(f.calls[0].opts.signal instanceof AbortSignal, "délai (10 s)");
  assert.equal(lib.TIMEOUT_MS, 10000);
  assert.deepEqual(value, { ok: true, status: 202, count: 1 });
  assert.match(lines.join("\n"), /sent 1 URL\(s\), HTTP 202/);
});

test("hors production (aperçu, branche, build local) : aucun appel réseau, rien envoyé", async () => {
  for (const [env, constants] of [[{ CONTEXT: "deploy-preview" }, {}], [{ CONTEXT: "branch-deploy" }, {}], [{}, {}], [PROD, { IS_LOCAL: true }]]) {
    const f = fakeFetch(() => { throw new Error("aucun appel attendu"); });
    const { value, lines } = await quiet(() => run.afterDeploy({ env, constants: { PUBLISH_DIR: SITE, ...constants }, previous: { status: "none" }, fetchImpl: f }));
    assert.equal(value.sent, false);
    assert.equal(f.calls.length, 0, JSON.stringify(env));
    assert.match(lines.join("\n"), /nothing sent/);
  }
  // onPreBuild ne lit rien hors production.
  const orig = global.fetch;
  let called = 0;
  global.fetch = async () => { called++; throw new Error("x"); };
  const prevCtx = process.env.CONTEXT;
  process.env.CONTEXT = "deploy-preview";
  try {
    await require("../netlify/plugins/indexnow/index.js").onPreBuild({ constants: {} });
  } finally {
    global.fetch = orig;
    if (prevCtx === undefined) delete process.env.CONTEXT; else process.env.CONTEXT = prevCtx;
  }
  assert.equal(called, 0);
});

test("production : premier envoi = tout le sitemap, ensuite seulement la différence ; journal court", async () => {
  const shipped = JSON.parse(fs.readFileSync(path.join(SITE, lib.MANIFEST), "utf8"));
  const n = Object.keys(shipped.pages).length;
  let f = fakeFetch(200);
  let r = await quiet(() => run.afterDeploy({ env: PROD, constants: { PUBLISH_DIR: SITE }, previous: { status: "none" }, fetchImpl: f }));
  assert.equal(JSON.parse(f.calls[0].opts.body).urlList.length, n);
  assert.match(r.lines[0], new RegExp(`${n} new, 0 changed, 0 deleted \\(first run`));

  const prev = { version: 1, pages: { ...shipped.pages, [site.url + "/gone/"]: "0000000000000000" } };
  const kayak = Object.keys(prev.pages).find((u) => u.endsWith("/tours/kayak/"));
  prev.pages[kayak] = "ffffffffffffffff";
  f = fakeFetch(200);
  r = await quiet(() => run.afterDeploy({ env: PROD, constants: { PUBLISH_DIR: SITE }, previous: { status: "ok", manifest: prev }, fetchImpl: f }));
  assert.deepEqual(JSON.parse(f.calls[0].opts.body).urlList, [kayak, site.url + "/gone/"]);
  assert.match(r.lines[0], /0 new, 1 changed, 1 deleted/);

  f = fakeFetch(200);
  r = await quiet(() => run.afterDeploy({ env: PROD, constants: { PUBLISH_DIR: SITE }, previous: { status: "ok", manifest: shipped }, fetchImpl: f }));
  assert.equal(f.calls.length, 0, "rien de changé : pas d'appel");
});

test("manifeste précédent : 404 = premier envoi, autre échec = rien envoyé", async () => {
  assert.deepEqual(await run.readPrevious({ fetchImpl: fakeFetch(404) }), { status: "none" });
  const ok = await run.readPrevious({ fetchImpl: fakeFetch({ version: 1, pages: { a: "b" } }) });
  assert.equal(ok.status, "ok");
  assert.equal((await run.readPrevious({ fetchImpl: fakeFetch(503) })).status, "error");
  assert.equal((await run.readPrevious({ fetchImpl: fakeFetch(new TypeError("fetch failed")) })).status, "error");
  assert.equal((await run.readPrevious({ fetchImpl: fakeFetch({ nope: 1 }) })).status, "error");
  assert.equal((await run.readPrevious({ fetchImpl: fakeFetch({ version: 1, pages: null }) })).status, "error");
  assert.equal((await run.readPrevious({ fetchImpl: fakeFetch({ version: 1, pages: [] }) })).status, "error");
  const f = fakeFetch(200);
  const { value, lines } = await quiet(() => run.afterDeploy({ env: PROD, constants: { PUBLISH_DIR: SITE }, previous: { status: "error", detail: "HTTP 503" }, fetchImpl: f }));
  assert.equal(value.sent, false);
  assert.equal(f.calls.length, 0);
  assert.match(lines.join("\n"), /previous manifest unreadable \(HTTP 503\): nothing sent/);
});

test("un échec IndexNow (réseau, 4xx, 5xx, 429, délai) ne lève jamais d'erreur : une ligne avec le code et le nombre", async () => {
  for (const answer of [400, 403, 422, 429, 500, new TypeError("fetch failed"), Object.assign(new Error("timeout"), { name: "TimeoutError" })]) {
    const { value, lines } = await quiet(() => run.afterDeploy({ env: PROD, constants: { PUBLISH_DIR: SITE }, previous: { status: "none" }, fetchImpl: fakeFetch(answer) }));
    assert.equal(value.sent, false);
    const out = lines.join("\n");
    if (typeof answer === "number") assert.match(out, new RegExp(`refused: HTTP ${answer} for \\d+ URL\\(s\\)`));
    else assert.match(out, /not sent \(.+\) for \d+ URL\(s\), deploy unaffected/);
  }
  // Manifeste absent du dossier publié : erreur attrapée, rien ne remonte.
  const { value } = await quiet(() => run.afterDeploy({ env: PROD, constants: { PUBLISH_DIR: os.tmpdir() }, previous: { status: "none" }, fetchImpl: fakeFetch(200) }));
  assert.equal(value.sent, false);
  // Les événements Netlify eux-mêmes ne lèvent pas, en production : réseau coupé avant le build, manifeste absent après.
  const plugin = require("../netlify/plugins/indexnow/index.js");
  const orig = global.fetch;
  const prevCtx = process.env.CONTEXT;
  process.env.CONTEXT = "production";
  global.fetch = async () => { throw new TypeError("fetch failed"); };
  try {
    const pre = await quiet(() => plugin.onPreBuild({ constants: {} }));
    assert.match(pre.lines.join("\n"), /previous manifest unreadable \(fetch failed\)/);
    const post = await quiet(() => plugin.onSuccess({ constants: { PUBLISH_DIR: os.tmpdir() }, utils: {} }));
    assert.match(post.lines.join("\n"), /nothing sent/);
  } finally {
    global.fetch = orig;
    if (prevCtx === undefined) delete process.env.CONTEXT; else process.env.CONTEXT = prevCtx;
  }
});
