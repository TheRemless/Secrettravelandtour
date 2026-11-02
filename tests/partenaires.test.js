// Aucun nom de prestataire sur le site (sinon les clients réservent en direct sans passer par Secret),
// la plongée détaille ses niveaux et la date est obligatoire dans les deux formulaires.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const site = path.join(__dirname, "..", "_site");

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return /\.(html|xml|txt)$/.test(e.name) ? [full] : [];
  });
}

// VIP Taxi Lanta est la marque de transferts assumée sur le site, elle n'est donc pas dans cette liste.
const PARTENAIRES = /rattana|lacha ?ru|sukho|lanta ?atv|atv adventure|lanta elephant|lanta longtail|lanta batik|lanta kayaking|e-?gokart|noom|bundhaya|satun|pakbara|blue ?planet/i;

test("aucun nom de prestataire dans les pages générées", () => {
  const files = htmlFiles(site);
  assert.ok(files.length > 20);
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, PARTENAIRES, path.relative(site, file));
  }
});

test("aucun nom de prestataire dans les noms de fichiers d'images", () => {
  const images = fs.readdirSync(path.join(site, "images", "secret")).concat(fs.readdirSync(path.join(site, "images", "taxi")));
  for (const name of images) assert.doesNotMatch(name, PARTENAIRES, name);
});

test("plongée : une page avec les niveaux, de l'essai d'un jour aux cours avancés", () => {
  const doc = fs.readFileSync(path.join(site, "tours", "scuba-diving", "index.html"), "utf8");
  for (const level of ["Kids Scuba Explorer", "Basic Diver", "Open Water Diver", "Advanced Open Water Diver", "React Right", "Stress and Rescue Diver", "Deep Diver", "Nitrox"]) {
    assert.ok(doc.includes(level), level);
  }
  assert.match(doc, /Koh Haa or Koh Bida/);
  assert.match(doc, /medically fit/);
  assert.doesNotMatch(doc, /฿|CHF|€|per person\s*:?\s*\d/);
  const home = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(home, /href="\/tours\/scuba-diving\/"/);
});

test("formulaires : la date est obligatoire (radios required) sur l'accueil et sur /taxi/", () => {
  const home = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const taxi = fs.readFileSync(path.join(site, "taxi", "index.html"), "utf8");
  const radios = (doc, name) => doc.match(new RegExp(`<input type="radio" name="${name}"[^>]*>`, "g")) || [];
  for (const [doc, name] of [[home, "dateChoice"], [taxi, "date_choice"]]) {
    const found = radios(doc, name);
    assert.equal(found.length, 3, name);
    for (const tag of found) assert.match(tag, /\brequired\b/, tag);
  }
});
