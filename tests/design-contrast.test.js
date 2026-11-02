// Contrastes des jetons de la refonte (stt.css pour Secret Travel & Tour, vip.css pour VIP Taxi Lanta) :
// 4,5:1 pour tout couple de texte réellement utilisé, 3:1 pour les bordures de champs, de cartes et le focus.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function tokens(file) {
  const css = fs.readFileSync(path.join(__dirname, "../src/css", file), "utf8");
  return (name) => {
    const m = css.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})\\b"));
    assert.ok(m, `jeton --${name} introuvable dans ${file}`);
    return m[1];
  };
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

const SETS = {
  "stt.css": {
    text: [
      ["ink", "sand"], ["ink", "white"], ["ink", "lagoon"],
      ["sea", "sand"], ["sea", "white"],
      ["mute", "sand"], ["mute", "white"], ["mute", "lagoon"],
      ["white", "buoy"], ["white", "buoy-hover"], ["white", "sea"], ["white", "deep"],
      ["sun", "deep"], ["lagoon", "deep"],
      ["buoy", "white"]
    ],
    ui: [["field", "white"], ["field", "sand"], ["sea", "white"], ["sea", "sand"], ["white", "deep"]]
  },
  "vip.css": {
    text: [
      ["text", "bg"], ["mute", "bg"], ["amber", "bg"],
      ["text", "bg-2"], ["mute", "bg-2"], ["amber", "bg-2"],
      ["ink", "amber"], ["ink", "amber-hi"], ["ink", "paper"], ["mute-ink", "paper"], ["err", "paper"],
      ["paper", "ink"], ["paper", "ink-hover"], ["ink", "white"],
      ["white", "stt-deep"], ["stt-lagoon", "stt-deep"]
    ],
    ui: [["edge-line", "bg"], ["edge-line", "bg-2"], ["amber", "bg"], ["mute-ink", "paper"], ["mute-ink", "white"], ["ink", "paper"]]
  }
};

for (const [file, { text, ui }] of Object.entries(SETS)) {
  const t = tokens(file);
  for (const [fg, bg] of text) {
    test(`${file} : texte --${fg} sur --${bg} d'au moins 4,5:1`, () => {
      const r = ratio(t(fg), t(bg));
      assert.ok(r >= 4.5, `ratio ${r.toFixed(2)}`);
    });
  }
  for (const [fg, bg] of ui) {
    test(`${file} : bordure ou focus --${fg} sur --${bg} d'au moins 3:1`, () => {
      const r = ratio(t(fg), t(bg));
      assert.ok(r >= 3, `ratio ${r.toFixed(2)}`);
    });
  }
}
