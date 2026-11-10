// Captures pleine page à 1440 (DPR 1) et 390 (DPR 2). Usage : node _build/shots.mjs [page...]
import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharp = createRequire(import.meta.url)("/Users/admin/Desktop/Secrettravelandtour/node_modules/sharp");
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ["home", "4-islands", "tours", "variantes"];
import { existsSync } from "node:fs";
const exe = ["/Users/admin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Users/admin/Library/Caches/ms-playwright/chromium-1194/chrome-mac/Chromium.app/Contents/MacOS/Chromium"].find(existsSync);
const b = await chromium.launch({ executablePath: exe });
for (const name of pages) for (const [w, dpr] of [[1440, 1], [390, 2]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, deviceScaleFactor: dpr, reducedMotion: "no-preference" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto("file://" + join(here, name + ".html"), { waitUntil: "networkidle" });
  // descendre la page pour charger les images paresseuses, puis remonter
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60); }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(900);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  const full = await p.evaluate(() => document.documentElement.scrollHeight);
  const out = join(here, "shots", `${name}-${w}.png`);
  // Les animations pilotées par le scroll sont figées à leur état « vu » pour la capture pleine page
  await p.addStyleTag({ content: "*{animation-timeline:auto!important;animation:none!important} .hd{position:absolute!important} .dock{display:none!important}" });
  if (full * dpr > 8000) {
    const parts = []; const step = Math.floor(8000 / dpr);
    for (let y = 0; y < full; y += step) {
      const h = Math.min(step, full - y);
      parts.push({ input: await p.screenshot({ clip: { x: 0, y, width: w, height: h }, fullPage: true }), top: y * dpr, left: 0 });
    }
    await sharp({ create: { width: w * dpr, height: full * dpr, channels: 3, background: "#fff" } }).composite(parts).png().toFile(out);
  } else await p.screenshot({ path: out, fullPage: true });
  console.log(name, w, "hauteur", full, "scrollWidth", sw, errs.length ? "ERREURS " + errs.join(" | ") : "ok");
  await ctx.close();
}
await b.close();
