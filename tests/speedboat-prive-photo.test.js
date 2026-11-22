// Speedboat privé à deux moteurs (Phi Phi, 4 Islands, Koh Rok) : photo du bateau transmise par Jérémy le 22.11.2026,
// sur la carte de l'option seulement. Capacité affichée = registre (20 passagers plus l'équipage, Anaïs 18.11.2026),
// conforme à la coque. Le nom du partenaire n'apparaît ni dans le texte alternatif ni dans le nom du fichier.
// Lancer `npm run build` avant.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const PHOTOS = require("../src/_data/photos-v3.json").photos;

const root = path.join(__dirname, "..");
const SLUGS = ["koh-phi-phi", "4-islands", "koh-rok-koh-haa"];
const ph = PHOTOS.find((p) => p.id === "opt-private-speedboat");

test("la photo est déclarée, sans nom de partenaire", () => {
  assert.ok(ph, "opt-private-speedboat dans photos-v3.json");
  assert.ok(fs.existsSync(path.join(root, "src/images", ph.file)));
  assert.doesNotMatch(ph.file + " " + ph.alt, /octopus/i);
});

for (const slug of SLUGS) {
  test(`${slug} : photo sur l'option speedboat privé seulement, capacité du registre`, () => {
    const p = JSON.parse(fs.readFileSync(path.join(root, "src/_data/products/tours", slug + ".json"), "utf8"));
    const withPhoto = p.options.filter((o) => o.photo);
    assert.deepEqual(withPhoto.map((o) => o.id), ["private-speedboat"]);
    assert.equal(withPhoto[0].photo, "opt-private-speedboat");
    assert.match(withPhoto[0].note, /two 200 hp Yamaha engines and takes up to 20 passengers plus the crew/);
    const html = fs.readFileSync(path.join(root, "_site/tours", slug, "index.html"), "utf8");
    const d = html.split('id="po-private-speedboat-d"')[1];
    assert.ok(d, "détail de l'option");
    const block = d.split('id="po-')[0];
    assert.ok(block.includes(`alt="${ph.alt}"`), "photo dans le détail de l'option");
    assert.ok(/width="\d+" height="\d+"/.test(block) && /image\/avif/.test(block) && /image\/webp/.test(block));
    assert.equal(html.split(`alt="${ph.alt}"`).length - 1, 1, "une seule fois sur la page");
  });
}
