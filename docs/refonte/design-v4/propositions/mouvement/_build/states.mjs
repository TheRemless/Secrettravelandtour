// Captures d'états interactifs (écran visible), pour vérifier que tout marche vraiment.
import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const exe = ["/Users/admin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Users/admin/Library/Caches/ms-playwright/chromium-1194/chrome-mac/Chromium.app/Contents/MacOS/Chromium"].find(existsSync);
const b = await chromium.launch({ executablePath: exe });
const url = (n) => "file://" + join(here, n + ".html");
const shot = async (p, name) => { await p.waitForTimeout(700); await p.screenshot({ path: join(here, "shots", "etat-" + name + ".png") }); console.log("ok", name); };
const errs = [];
async function page(w, dpr, mobile) {
  const ctx = await b.newContext({ viewport: { width: w, height: mobile ? 844 : 900 }, deviceScaleFactor: dpr, hasTouch: !!mobile, isMobile: !!mobile });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  return p;
}
// Accueil : changer de sortie dans le hero, puis la palette de recherche
let p = await page(1440, 1);
await p.goto(url("home"));
await p.click("#switch button:nth-of-type(2)");
await shot(p, "accueil-hero-koh-rok-1440");
await p.keyboard.press("Meta+k"); await p.keyboard.type("maya");
await shot(p, "recherche-maya-1440");
await p.keyboard.press("Escape");
await p.locator("#transfers").scrollIntoViewIfNeeded(); await p.click("#swap");
await p.selectOption("#from", "Phuket Airport");
await shot(p, "accueil-trajet-1440");
// Hub : filtre, aperçu, comparateur
p = await page(1440, 1);
await p.goto(url("tours"));
await p.click('#type button[value="boat"]');
await shot(p, "hub-filtre-bateaux-1440");
await p.click('.hcard[data-slug="koh-rok-koh-haa"] a');
await shot(p, "hub-apercu-koh-rok-1440");
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
await p.check('.cmp input[value="4-islands"]'); await p.check('.cmp input[value="koh-phi-phi"]');
await shot(p, "hub-tiroir-comparer-1440");
await p.click("#cmp-go");
await shot(p, "hub-comparaison-1440");
// 4 Islands : speedboat, privé + Koh Kradan, feuille de réservation, visionneuse
p = await page(1440, 1);
await p.goto(url("4-islands"));
await p.locator("#boat").scrollIntoViewIfNeeded();
await p.click('#opt-seg button[value="join-in-speedboat"]');
await shot(p, "4i-speedboat-1440");
await p.click('#opt-seg button[value="private-longtail"]'); await p.check("#kr-page input");
await p.click('#calc-gs [data-k="c"][data-d="1"]'); await p.selectOption("#calc-age-0", "7");
await shot(p, "4i-prive-kradan-1440");
await p.click("#cta").catch(async () => { await p.evaluate(() => scrollTo(0, 0)); await p.click("#cta"); });
await p.click(".days button:nth-child(3)");
await shot(p, "4i-feuille-1440");
p = await page(390, 2, true);
await p.goto(url("4-islands"));
await p.click("#cta");
await p.click(".days button:nth-child(2)");
await p.fill("#bk-pickup", "Long Beach");
await shot(p, "4i-feuille-390");
await p.keyboard.press("Escape"); await p.waitForTimeout(700);
await p.locator("#gal").scrollIntoViewIfNeeded();
await p.tap("#gal button:first-child");
await shot(p, "4i-visionneuse-390");
p = await page(390, 2, true);
await p.goto(url("tours"));
await p.tap('.hcard[data-slug="elephant-sanctuary"] a');
await shot(p, "hub-apercu-390");
console.log(errs.length ? "ERREURS " + errs.join(" | ") : "aucune erreur JS");
await b.close();
