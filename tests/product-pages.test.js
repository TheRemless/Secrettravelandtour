// Pages produit du design v4 (bateaux, activités, location, speedboat), demande du client du 08.11.2026 :
// tous les prix de chaque option visibles, un seul ordre de sections, aucune demande WhatsApp vague.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");

const root = path.join(__dirname, "..");
const P = (rel) => JSON.parse(fs.readFileSync(path.join(root, "src/_data/products", rel + ".json"), "utf8"));
const html = (url) => fs.readFileSync(path.join(root, "_site", url, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const thb = (n) => Number(n).toLocaleString("en-GB") + " THB";
const cfgOf = (doc) => JSON.parse(doc.match(/<script type="application\/json" id="book-data">([\s\S]*?)<\/script>/)[1]);
const outsideSheet = (doc) => doc.replace(/<dialog class="sheet" id="book"[\s\S]*?<\/dialog>/, "");

const TOURS = ["tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/koh-talabeng-koh-bubu", "tours/mangroves", "tours/fishing-trip",
  "activities/elephant-sanctuary", "activities/kayak", "activities/cooking-class", "activities/scuba-diving", "activities/atv", "activities/batik", "activities/go-kart"].map(P);
const RENTAL = P("rental");
const SPEED = P("secret-transfers/speedboat-ferry");
const ALL = TOURS.concat([RENTAL, SPEED]);
const TODAY = "2026-11-08";

// Un état complet pour une option : chaque sous-variante obligatoire reçoit sa première valeur (ou le premier jour
// qui convient au cours choisi), chaque compteur un exemplaire de la première ligne.
function fullState(option, over = {}) {
  const st = Object.assign(B.emptyState({}), { today: TODAY, option: option.id, dateChoice: "other", dateOther: "2026-11-21", adults: 2, childAges: [7], pickup: "Lanta Sand Resort", name: "Anna" }, over);
  for (const c of option.choices || []) {
    const v = c.type === "text" ? "Advanced Open Water, March 2026" : c.values[0];
    st.choices[option.id + "/" + c.id] = c.type === "text" ? v : v.id;
    if (v.days) for (let d = 9; d < 16; d++) { const iso = `2026-11-${d}`; if (v.days.includes(new Date(iso + "T00:00:00Z").getUTCDay())) { st.dateOther = iso; break; } }
  }
  if (option.counts) st.counts[option.id + "/0"] = 1;
  return st;
}

test("ordre des sections : le même que la 4 Islands sur chaque fiche, une section sans donnée absente", () => {
  const ORDER = ["h1", "opt-h", "day-h", "Included|Not included", "byb-h|faq-h", "rel-h"];
  for (const p of ALL) {
    const doc = html(p.url);
    const marks = [doc.indexOf('id="h1"'), doc.indexOf('id="opt-h"'), doc.indexOf('id="day-h"'),
      Math.max(doc.indexOf("<h2>Included</h2>"), doc.indexOf("<h2>Not included</h2>")),
      Math.max(doc.indexOf('id="byb-h"'), doc.indexOf('id="faq-h"')), doc.indexOf('id="rel-h"')].filter((i) => i > -1);
    assert.deepEqual(marks, marks.slice().sort((a, b) => a - b), `${p.slug} : ${ORDER.join(" > ")}`);
    assert.ok(doc.indexOf('id="opt-h"') > -1, `${p.slug} : options et prix`);
    assert.equal((doc.match(/<h1\b/g) || []).length, 1, p.slug);
    assert.match(doc, /<nav class="wrap crumbs" aria-label="Breadcrumb">/, p.slug);
    assert.match(doc, /aria-current="page">/, `${p.slug} : menu et fil d'Ariane`);
  }
});

test("prix : chaque ligne de chaque option du JSON est sur la page, avec son montant et son unité", () => {
  let rows = 0;
  for (const p of ALL) {
    const opts = outsideSheet(html(p.url)).split('id="opt-h"')[1].split("</section>")[0];
    for (const o of p.options || []) {
      if (!(o.prices || []).length) assert.match(opts, new RegExp(`${esc(o.label)}[\\s\\S]*?Price on WhatsApp`), `${p.slug} ${o.id} : Price on WhatsApp`);
      for (const r of o.prices || []) {
        rows++;
        const amount = typeof r.amount === "number" ? (r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + thb(r.amount)) : r.text;
        const block = opts.split(esc(o.label))[1] || "";
        const at = block.indexOf(">" + esc(r.label) + "<");
        assert.ok(at > -1, `${p.slug} ${o.id} : ligne « ${r.label} »`);
        const after = block.slice(at, at + 400);
        assert.ok(after.includes(`<b>${amount}</b>`), `${p.slug} ${o.id} : montant de « ${r.label} »`);
        if (r.unit && r.amount !== 0 && r.unit.toLowerCase() !== r.label.toLowerCase()) assert.ok(after.includes(`<small>${esc(r.unit)}</small>`), `${p.slug} ${o.id} : unité de « ${r.label} »`);
      }
      for (const f of o.notIncludedFees || []) assert.ok(opts.includes(esc(f.label)) && opts.includes(thb(f.amount)), `${p.slug} : frais « ${f.label} »`);
    }
  }
  assert.ok(rows > 130, String(rows));
});

test("feuille : sans option choisie, une fiche à plusieurs options refuse la demande", () => {
  for (const p of TOURS) {
    const cfg = cfgOf(html(p.url));
    const st = fullState(cfg.options[0], { option: "" });
    const errors = B.validate(cfg, st);
    if (cfg.options.length > 1) assert.equal(errors.option, "Choose an option.", p.slug);
    else assert.equal(errors.option, "Choose an option.", `${p.slug} : la feuille préremplit l'option unique, la validation exige quand même l'option`);
  }
});

test("message : chaque option donne le produit, l'option, ses sous-variantes, ses prix et l'adresse de la page", () => {
  for (const p of TOURS) {
    const doc = html(p.url);
    const cfg = cfgOf(doc);
    // Phase 1 (09.11.2026) : un seul bloc de choix. Chaque option s'y choisit (bouton radio), et le bouton de
    // réservation du bloc, du haut et de la bande du bas ouvre la feuille sur l'option choisie (data-book-sel).
    for (const o of cfg.options) assert.match(doc, new RegExp(`name="pick" value="${o.id}"`), `${p.slug} ${o.id} : choix`);
    assert.match(doc, /data-book="[^"]+" data-book-sel(="")? data-calc-book/, `${p.slug} : bouton du bloc`);
    for (const o of cfg.options) {
      const st = fullState(o);
      assert.deepEqual(B.validate(cfg, st), {}, `${p.slug} ${o.id}`);
      const msg = B.buildMessage(cfg, st);
      const lines = msg.split("\n");
      // Une option à compteurs (pilotes, karts) : ses compteurs disent qui vient, sans seconde ligne « Guests ».
      const who = o.counts ? (o.people === false ? "1K" : "1A") : "2A1C";
      assert.match(lines[0], new RegExp(`^Ref: ${p.refPrefix}-\\d{4}-${who}$`), `${p.slug} ${o.id} : référence`);
      assert.equal(lines[1], `Booking request: ${p.name} – ${o.title}`, `${p.slug} ${o.id}`);
      assert.match(msg, /\nDate: \w{3} \d+ Nov 2026\n/);
      if (o.counts) assert.doesNotMatch(msg, /\nGuests: /, `${p.slug} ${o.id} : pas de Guests à côté des compteurs`);
      else assert.match(msg, /\nGuests: 2 adults, 1 child \(age 7\)\n/);
      // Total estimé (v4-price.js) ou, quand la règle n'est pas dans les données, « confirmed on WhatsApp ».
      assert.match(msg, /\n(Estimated total: [\d,]+ THB|Total: to be confirmed on WhatsApp)\n/, `${p.slug} ${o.id} : total`);
      assert.match(msg, /\nPickup: Lanta Sand Resort\n/);
      assert.match(msg, /\nName: Anna\n/);
      assert.ok(msg.endsWith(`Page: secrettravelandtour.com${p.url}`), `${p.slug} ${o.id} : page`);
      for (const c of o.choices || []) assert.match(msg, new RegExp(`\\n${c.label}: \\S`), `${p.slug} ${o.id} : ${c.label}`);
      if (o.counts) assert.ok(msg.includes(`${o.counts.label}: 1 × ${o.counts.rows[0]}`), `${p.slug} ${o.id} : nombre`);
      const src = p.options.find((x) => x.id === o.id);
      if ((src.prices || []).length) {
        const priced = (o.choices || []).find((c) => c.values && c.values.some((v) => v.row));
        const shown = priced ? src.prices.filter((r) => r.label === priced.values[0].row) : o.counts ? src.prices.slice(0, 1) : src.prices;
        for (const r of shown) assert.ok(msg.includes(`${r.label}: ${r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + thb(r.amount)}`), `${p.slug} ${o.id} : prix « ${r.label} »`);
      }
    }
  }
});

test("sous-variantes : un message sans créneau, cours, site, karts ou pilotes est refusé", () => {
  const seen = new Set();
  for (const p of TOURS) {
    const cfg = cfgOf(html(p.url));
    for (const o of cfg.options) {
      for (const c of (o.choices || []).filter((x) => x.required)) {
        const st = fullState(o);
        delete st.choices[o.id + "/" + c.id];
        assert.ok(B.validate(cfg, st)[`c-${o.id}-${c.id}`], `${p.slug} ${o.id} : ${c.label}`);
        seen.add(`${p.slug}:${c.id}`);
      }
      if (o.counts) {
        const st = fullState(o);
        st.counts = {};
        assert.ok(B.validate(cfg, st)[`n-${o.id}`], `${p.slug} ${o.id} : ${o.counts.label}`);
        seen.add(`${p.slug}:counts`);
      }
    }
  }
  for (const k of ["elephant-sanctuary:session", "kayak:slot", "kayak:way", "batik:course", "cooking-class:class", "scuba-diving:course",
    "scuba-diving:sites", "scuba-diving:trip", "scuba-diving:cert", "go-kart:counts", "atv:counts", "mangroves:way"]) assert.ok(seen.has(k), k);
});

test("cours de cuisine : le cours du soir est réservable, et la date doit tomber l'un de ses jours", () => {
  const cfg = cfgOf(html("/tours/cooking-class/"));
  const o = cfg.options.find((x) => x.id === "single-chef");
  const evening = o.choices[0].values.find((v) => /^Dinner/.test(v.label));
  assert.deepEqual(evening.days, [2, 4, 5]);
  const st = fullState(o);
  st.choices[o.id + "/class"] = evening.id;
  st.dateOther = "2026-11-21"; // un samedi
  assert.match(B.validate(cfg, st)["c-single-chef-class"], /runs on Tuesday, Thursday and Friday/);
  st.dateOther = "2026-11-24"; // un mardi
  assert.deepEqual(B.validate(cfg, st), {});
  assert.match(B.buildMessage(cfg, st), /\nClass: Dinner, Tuesday, Thursday, Friday, 16:00–21:00\n/);
  // Sculpture : chaque créneau a ses jours (brochure p. 2, client 08.11.2026), la date est contrôlée.
  const carving = cfg.options.find((x) => x.id === "carving");
  const [afternoon, morning] = carving.choices[0].values;
  assert.deepEqual([afternoon.days, morning.days], [[1, 3, 6], [2, 4, 5]]);
  const sc = fullState(carving);
  sc.choices["carving/class"] = morning.id;
  sc.dateOther = "2026-11-21"; // un samedi
  assert.match(B.validate(cfg, sc)["c-carving-class"], /runs on Tuesday, Thursday and Friday/);
  sc.dateOther = "2026-11-24";
  assert.deepEqual(B.validate(cfg, sc), {});
  sc.choices["carving/class"] = afternoon.id;
  assert.match(B.validate(cfg, sc)["c-carving-class"], /runs on Monday, Wednesday and Saturday/);
  assert.doesNotMatch(html("/tours/cooking-class/"), /14:30/);
});

test("location : catégorie, véhicule, nombre de véhicules, dates et heures, prix du modèle", () => {
  const doc = html(RENTAL.url);
  const cfg = cfgOf(doc);
  for (const o of RENTAL.options) for (const r of o.prices) assert.match(doc, new RegExp(`data-book="${o.id}" data-vehicle="${esc(r.label)}"`), r.label);
  const st = Object.assign(B.emptyState({}), { today: TODAY, option: "big-bikes", vehicle: "Honda CRF 250", vehicles: 2, dateFrom: "2026-11-20", timeFrom: "09:00", dateTo: "2026-11-23", timeTo: "18:00", name: "Anna" });
  assert.deepEqual(B.validate(cfg, st), {});
  assert.equal(B.buildMessage(cfg, st), [
    "Ref: RENT-2011-2311", "Rental request: Big bikes", "Vehicle: Honda CRF 250", "Vehicles: 2",
    "From: Fri 20 Nov 2026, 09:00", "To: Mon 23 Nov 2026, 18:00", "Name: Anna",
    "Price on website: Honda CRF 250: 900 THB per 24 hours", "Page: secrettravelandtour.com/tours/rental/"
  ].join("\n"));
  assert.ok(B.validate(cfg, { ...st, option: "" }).option);
  assert.ok(B.validate(cfg, { ...st, timeTo: "" }).dates);
  assert.ok(B.validate(cfg, { ...st, vehicles: 0 }).vehicles);
  assert.match(B.buildMessage(cfg, { ...st, vehicle: "" }), /Price on website: Big bikes: 600 to 1,200 THB per 24 hours/);
});

test("speedboat : chaque arrêt de la grille ouvre la feuille, trajet, horaire, aller simple ou retour", () => {
  const doc = html(SPEED.url);
  const cfg = cfgOf(doc);
  for (const run of SPEED.timetable.outbound) for (const s of run.stops) {
    const place = s.place.replace(/ \(.*\)$/, "");
    const route = cfg.routes.find((r) => r.label === `Koh Lanta to ${place}`);
    assert.ok(route && route.deps.some((d) => d.time === run.departs && d.arrives === s.time), `${run.departs} ${place}`);
    assert.match(doc, new RegExp(`data-sb-route="${route.id}" data-sb-dep="${route.id}@${run.departs.replace(":", "")}"`), `${run.departs} ${place} : bouton`);
  }
  const st = Object.assign(B.emptyState({}), { today: TODAY, route: "to-koh-ngai", departure: "to-koh-ngai@1500", dateChoice: "other", dateOther: "2026-11-20", adults: 2, childAges: [], pickup: "Lanta Sand Resort", name: "Anna" });
  assert.equal(B.validate(cfg, st).tripType, "Choose one way or return.");
  st.tripType = "return";
  assert.equal(B.validate(cfg, st).returnTrip, "Pick the date of the return.");
  st.returnDate = "2026-11-23";
  assert.equal(B.validate(cfg, st).returnTrip, "Choose the time of the return boat.");
  st.returnDeparture = "from-koh-ngai@1130";
  assert.deepEqual(B.validate(cfg, st), {});
  const msg = B.buildMessage(cfg, st);
  assert.match(msg, /^Ref: SPEED-2011-2A\nSpeedboat request: Koh Lanta to Koh Ngai\nDeparture: 15:00, arrives 15:40\nDate: Fri 20 Nov 2026\nTicket: return, Koh Ngai to Koh Lanta\nReturn: Mon 23 Nov 2026, 11:30, arrives 12:00\n/);
  assert.ok(B.validate(cfg, { ...st, departure: "" }).departure);
  assert.ok(B.validate(cfg, { ...st, route: "" }).route);
});

test("liste de sorties : une sortie sans sa sous-variante obligatoire ne part pas", () => {
  const cat = JSON.parse(fs.readFileSync(path.join(root, "_site/data/catalog.json"), "utf8"));
  const list = { adults: 2, childAges: [], pickup: "Lanta Sand Resort", name: "Anna", items: [{ id: "a", slug: "elephant-sanctuary", option: "programme-b", date: "2026-11-20" }] };
  assert.match(B.validateTripList(cat, list, TODAY).items.a["c-programme-b-session"], /Choose the session \(Elephant sanctuary\)/);
  list.items[0].choices = { "programme-b/session": "1200" };
  assert.equal(B.validateTripList(cat, list, TODAY).count, 0);
  assert.match(B.buildTripList(cat, list), /Elephant sanctuary – Programme B, the elephants and Klong Jark beach\nSession: 12:00\n/);
});

test("WhatsApp : chaque lien d'une fiche nomme le produit et la page ; ailleurs, la page d'où il part", () => {
  for (const p of ALL.concat([P("tours/4-islands")])) {
    const doc = outsideSheet(html(p.url));
    const links = [...doc.matchAll(/href="https:\/\/wa\.me\/66958683846([^"]*)"/g)].map((m) => decodeURIComponent(m[1].replace(/^\?text=/, "")));
    assert.ok(links.length >= 3, p.slug);
    for (const l of links) {
      assert.ok(l.includes(`secrettravelandtour.com${p.url}`), `${p.slug} : « ${l.slice(0, 60)} »`);
      assert.ok(l.includes(p.name) || /^(Rental|Speedboat) request/.test(l), `${p.slug} : « ${l.slice(0, 60)} »`);
    }
    assert.ok(links.some((l) => l.startsWith(`Question about ${p.name} (secrettravelandtour.com${p.url})`)), `${p.slug} : question`);
  }
  for (const url of ["/", "/tours/"]) {
    const links = [...outsideSheet(html(url)).matchAll(/href="https:\/\/wa\.me\/66958683846([^"]*)"/g)].map((m) => decodeURIComponent(m[1].replace(/^\?text=/, "")));
    for (const l of links) assert.ok(/secrettravelandtour\.com\//.test(l), `${url} : « ${l.slice(0, 60)} »`);
  }
});

test("Koh Talabeng : les sorties de la brochure kayak qui y vont, mêmes prix, horaires et frais que la page kayak", () => {
  const tb = P("tours/koh-talabeng-koh-bubu"), kayak = P("activities/kayak");
  assert.ok(!tb.priceOnRequest && tb.options.length === 3);
  for (const o of tb.options) {
    const k = kayak.options.find((x) => x.id === o.id);
    assert.ok(k, o.id);
    for (const key of ["label", "prices", "notIncludedFees", "choices"]) assert.deepEqual(o[key], k[key], `${o.id} ${key}`);
    assert.deepEqual(tb.day.find((b) => b.options[0] === o.id).steps, kayak.day.find((b) => b.options[0] === o.id).steps, `${o.id} déroulé`);
  }
  const doc = html(tb.url);
  assert.doesNotMatch(outsideSheet(doc).split('id="opt-h"')[1].split("</section>")[0], /Price on WhatsApp/);
});
