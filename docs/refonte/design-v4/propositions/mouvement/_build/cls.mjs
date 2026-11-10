// Décalages de mise en page APRÈS le rendu initial (défilement complet, effets au scroll, en-tête, bande du bas).
import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs";
import { existsSync } from "node:fs";
const exe = ["/Users/admin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing","/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const b = await chromium.launch({ executablePath: exe });
for (const [w, h] of [[390, 844], [1440, 900]]) for (const n of ["home", "4-islands", "tours"]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto("file://" + process.cwd() + "/" + n + ".html", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__cls = 0; window.__src = []; window.__loaf = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 50) window.__loaf++; }).observe({ type: "long-animation-frame" }); } catch (e) {} new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__cls += e.value; window.__src.push(e.sources.map(s => s.node && (s.node.className || s.node.nodeName)).join(",")); } }).observe({ type: "layout-shift" }); });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await p.mouse.wheel(0, 300); await p.waitForTimeout(50); }
  for (let y = H; y > 0; y -= 600) { await p.mouse.wheel(0, -600); await p.waitForTimeout(40); }
  await p.waitForTimeout(800);
  console.log(n, w, "frames > 50 ms", await p.evaluate(() => window.__loaf), "CLS au défilement", (await p.evaluate(() => window.__cls)).toFixed(4), (await p.evaluate(() => window.__src.slice(0, 4))).join(" | "));
  await ctx.close();
}
await b.close();
