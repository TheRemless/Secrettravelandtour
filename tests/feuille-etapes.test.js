// Feuille en trois étapes (maquette B, 26.11.2026) : 1. option et date, 2. groupe et lieux, 3. qui écrit et l'envoi.
// validate() et le message ne changent pas : la feuille filtre ses erreurs par étape (pickStep). Lancer le build avant.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");

const read = (rel) => fs.readFileSync(path.join(__dirname, "..", "_site", rel, "index.html"), "utf8");
const steps = (h) => {
  const d = h.slice(h.indexOf('<dialog class="sheet" id="book"'), h.indexOf('data-screen="done"'));
  return [1, 2, 3].map((n) => {
    const a = d.indexOf(`data-sheet-step="${n}"`);
    const b = n < 3 ? d.indexOf(`data-sheet-step="${n + 1}"`) : d.indexOf('<div class="hp"');
    assert.ok(a > -1 && b > a, `étape ${n}`);
    return d.slice(a, b);
  });
};
const errIds = (s) => [...s.matchAll(/class="err" id="book-e-([^"]+)"/g)].map((m) => m[1]);

test("pickStep : la première étape en erreur, avec ses seules erreurs ; une clé inconnue compte pour la dernière", () => {
  const keys = [["option", "date"], ["adults", "pickup"], ["firstName", "lastName", "phone"]];
  assert.deepEqual(B.pickStep({}, keys), { step: -1, errors: {} });
  assert.deepEqual(B.pickStep({ phone: "x", date: "y" }, keys), { step: 0, errors: { date: "y" } });
  assert.deepEqual(B.pickStep({ phone: "x", pickup: "p" }, keys), { step: 1, errors: { pickup: "p" } });
  assert.deepEqual(B.pickStep({ "child-0": "a" }, keys), { step: 2, errors: { "child-0": "a" } });
  // Location : deux étapes visibles seulement.
  assert.deepEqual(B.pickStep({ dates: "d", phone: "x" }, [["dates"], ["phone"]]), { step: 0, errors: { dates: "d" } });
});

test("stepText : « Step 2 of 3 · Guests and pickup »", () => {
  assert.equal(B.stepText(1, 3, "Guests and pickup"), "Step 2 of 3 · Guests and pickup");
  assert.equal(B.stepText(0, 2, ""), "Step 1 of 2");
});

test("validate : une feuille remplie étape par étape ne garde des erreurs que dans l'étape suivante", () => {
  const cfg = JSON.parse(read("tours/4-islands").match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);
  const h = read("tours/4-islands"), keys = steps(h).map(errIds);
  const st = Object.assign(B.emptyState(cfg), { today: "2026-11-26", option: cfg.options[0].id, dateChoice: "tomorrow" });
  assert.equal(B.pickStep(B.validate(cfg, st), keys).step, 1);
  st.pickup = "Lanta Sand Resort";
  const third = B.pickStep(B.validate(cfg, st), keys);
  assert.equal(third.step, 2);
  assert.deepEqual(Object.keys(third.errors).sort(), ["firstName", "lastName", "phone"]);
  Object.assign(st, { firstName: "Anna", lastName: "Becker", phoneCode: "GB", phone: "07700 900123" });
  assert.equal(B.pickStep(B.validate(cfg, st), keys).step, -1);
});

test("pages : trois étapes dans l'ordre, chaque erreur dans une seule étape, pied d'une ligne", () => {
  for (const rel of ["tours/4-islands", "tours/kayak", "tours/rental", "tours/speedboat", "transfers", "taxi", "taxi/krabi-airport-koh-lanta", "taxi/songthaew", "taxi/koh-lanta-krabi-day-trip"]) {
    const h = read(rel), [s1, s2, s3] = steps(h);
    if (!rel.includes("rental")) assert.match(s1, /name="dateChoice"/, rel);
    if (!rel.includes("rental")) assert.match(s2, /name="adults"/, rel);
    for (const id of ["firstName", "lastName", "phone"]) assert.match(s3, new RegExp(`id="book-${id}"`), rel);
    assert.match(s3, /id="book-send-note"/, rel);
    const all = [s1, s2, s3].flatMap(errIds);
    assert.equal(new Set(all).size, all.length, rel + " : une erreur, une étape");
    assert.match(h, /data-progress(?:="")? tabindex="-1"/, rel);
    assert.match(h, /data-back(?:="")? hidden/, rel);
    const foot = h.slice(h.indexOf('<div class="sheet-foot sheet-foot--row">'));
    assert.ok(foot.indexOf("data-next") > -1 && foot.indexOf("data-next") < foot.indexOf('type="submit"'), rel);
    assert.doesNotMatch(foot.slice(0, foot.indexOf("</div>")), /Add to my trip list|WhatsApp opens/, rel);
    assert.match(h, /data-code-face(?:="")? aria-hidden="true">Code<\/span>/, rel);
  }
  // Excursion : lieu de prise en charge à l'étape 2, liste de sorties et total relu à l'étape 3.
  const [, s2, s3] = steps(read("tours/4-islands"));
  assert.match(s2, /id="book-pickup"/);
  assert.match(s3, /data-trip(?:="")? /);
  assert.match(s3, /data-sum(?:="")? hidden/);
});

test("taxi : une seule aide pour Pickup et Drop-off, rien de perdu", () => {
  const h = read("taxi");
  const hint = "Hotel, address, airport or pier. Picked a town from the list? Add your hotel after it.";
  assert.equal(h.split(hint).length - 1, 2, "texte affiché et data-hint de l'aller-retour"); // <p data-hint="…">…</p>
  assert.match(h, /aria-describedby="book-h-pickupAt book-e-pickupAt"/);
  assert.match(h, /aria-describedby="book-h-pickupAt book-e-dropoffAt"/);
  const route = read("taxi/krabi-airport-koh-lanta");
  assert.equal(route.split(">Hotel, address, airport or pier.</p>").length - 1, 1);
});
