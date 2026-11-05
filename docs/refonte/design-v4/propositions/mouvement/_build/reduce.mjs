import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs";
import { existsSync } from "node:fs";
const exe = ["/Users/admin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing","/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const b = await chromium.launch({ executablePath: exe });
for (const n of ["home", "4-islands", "tours", "variantes"]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + process.cwd() + "/" + n + ".html", { waitUntil: "networkidle" });
  if (n === "4-islands") { await p.click("#cta"); await p.waitForTimeout(200); errs.push("feuille ouverte: " + await p.evaluate(() => getComputedStyle(document.querySelector(".sheet__panel")).transform)); }
  if (n === "tours") { await p.click('#type button[value="activity"]'); errs.push("cartes visibles: " + await p.evaluate(() => [...document.querySelectorAll(".hcard")].filter(c => !c.hidden).length)); }
  // Mesure CLS en fin de chargement
  const cls = await p.evaluate(() => new Promise((r) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: "layout-shift", buffered: true }); setTimeout(() => r(v.toFixed(3)), 600); }));
  console.log(n, "CLS", cls, errs.join(" | "));
  await ctx.close();
}
await b.close();
