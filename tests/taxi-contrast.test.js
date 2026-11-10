// Contrastes de VIP Taxi Lanta, identité « Laque et or » (refonte taxi v1, 10.11.2026) : chaque couple texte et fond
// réellement utilisé dans src/css/vip-taxi.css atteint 4,5:1 (WCAG AA, texte courant).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "../src/css/vip-taxi.css"), "utf8");

function token(name) {
  if (name.startsWith("#")) return name;
  const m = css.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})\\b"));
  assert.ok(m, "jeton --" + name + " introuvable dans vip-taxi.css");
  return m[1];
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [texte, fond]. Les trois derniers : encart Secret, couleurs v4 de Secret écrites telles quelles.
const PAIRS = [
  ["ink", "paper"], ["ink-2", "paper"], ["ink-2", "paper-2"], ["bronze", "paper"], ["ink", "white"], ["ink-2", "white"],
  ["ivory", "lac"], ["lac-mute", "lac"], ["gold", "lac"], ["lac", "gold"], ["lac", "gold-hi"], ["gold", "lac-2"],
  ["#F6EFE4", "#0B3B3C"], ["#D5E1DD", "#0B3B3C"], ["#0B3B3C", "#F6EFE4"]
];

for (const [fg, bg] of PAIRS) {
  test(`contraste ${fg} sur ${bg} d'au moins 4,5:1`, () => {
    const r = ratio(token(fg), token(bg));
    assert.ok(r >= 4.5, `ratio ${r.toFixed(2)} pour ${token(fg)} sur ${token(bg)}`);
  });
}
