import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs";
import { existsSync } from "node:fs";
const exe = ["/Users/admin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing","/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(existsSync);
const b = await chromium.launch({ executablePath: exe });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  addEventListener("pagereveal", (e) => {
    if (!e.viewTransition) { window.__vt = "aucune"; return; }
    requestAnimationFrame(() => { window.__vt = document.getAnimations().map((a) => a.effect && a.effect.pseudoElement).filter(Boolean).join(" "); });
  });
});
const p = await ctx.newPage();
for (const [from, sel] of [["home", "#go"], ["tours", null]]) {
  await p.goto("file://" + process.cwd() + "/" + from + ".html");
  await p.waitForTimeout(500);
  if (sel) await p.click(sel);
  else { await p.click('.hcard[data-slug="4-islands"] a'); await p.waitForTimeout(700); await p.click('#ql a[href="4-islands.html"]'); }
  await p.waitForTimeout(150);
  console.log(from, "→ 4-islands :", await p.evaluate(() => window.__vt));
}
await b.close();
