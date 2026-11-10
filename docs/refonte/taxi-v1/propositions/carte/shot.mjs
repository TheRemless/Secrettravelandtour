// Captures et contrôle axe des maquettes « carte ». Usage : node shot.mjs <page> <largeur> <sortie.png> [action]
import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs";
const [, , page, width, out, action] = process.argv;
const w = Number(width);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: w < 800 ? 2 : 1, hasTouch: w < 800, isMobile: w < 800 });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push(e.message));
p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.goto(`http://localhost:8744/docs/refonte/taxi-v1/propositions/carte/${page}`, { waitUntil: "networkidle" });
await p.evaluate(async () => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager")); for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
await p.waitForTimeout(2600);
let full = action !== "top";
if (action === "sheet" || action === "preview") {
  await p.locator("[data-book]:visible").first().click();
  await p.waitForTimeout(400);
  await p.check('input[name="dateChoice"][value="tomorrow"]', { force: true });
  await p.fill("#book-time", "14:30");
  await p.fill("#book-flight", "FD3013");
  await p.click('[data-step="1"][data-for="children"]');
  await p.waitForTimeout(100);
  const sel = await p.$('[data-child-ages] select'); if (sel) await sel.selectOption("6");
  await p.click('[data-step="1"][data-for="bags"]'); await p.click('[data-step="1"][data-for="bags"]');
  await p.fill("#book-address", "Long Beach, Koh Lanta");
  await p.fill("#book-name", "Claire");
  if (action === "preview") { await p.click('.sheet [type="submit"]'); }
  else { await p.evaluate(() => { document.activeElement.blur(); document.querySelector('[data-screen="form"] .sheet-body').scrollTop = 0; }); }
  await p.waitForTimeout(500);
  full = false;
}
if (action === "tap") {
  // Un toucher sur une ligne de la carte (Krabi Airport–Koh Lanta) : le trajet s'allume.
  await p.evaluate(() => window.scrollTo(0, document.querySelector("[data-map]").offsetTop - 80));
  await p.waitForTimeout(200);
  const pt = await p.evaluate(() => {
    const path = document.querySelector('.rt[data-route="krabi-airport-koh-lanta"] .rt-line');
    const q = path.getPointAtLength(path.getTotalLength() * 0.45), m = path.getScreenCTM();
    return { x: q.x * m.a + m.e, y: q.y * m.d + m.f };
  });
  await p.touchscreen.tap(pt.x, pt.y);
  await p.waitForTimeout(300); full = false;
}
if (action === "axe") {
  await p.addScriptTag({ path: "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/axe-core/axe.min.js" });
  const r = await p.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] })).violations.map(v => ({ id: v.id, n: v.nodes.length, t: v.nodes.slice(0, 3).map(n => n.target.join(" ") + " :: " + (n.failureSummary || "").slice(0, 160)) })));
  console.log(page, w, "violations:", r.length, JSON.stringify(r, null, 1));
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log("scrollWidth", sw);
} else {
  // Au téléphone, la fenêtre prend la hauteur de la page : la barre fixe se pose en bas, comme à l'écran.
  if (full && w < 800) { const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(300); }
  await p.screenshot({ path: out, fullPage: full });
}
if (errs.length) console.log("ERREURS", errs);
await browser.close();
