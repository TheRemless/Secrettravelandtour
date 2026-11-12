// Pages produit du design v4 (bateaux, activités, location, speedboat) : mise en forme des fiches
// src/_data/products/** pour les gabarits src/pages/product.njk, rental.njk et speedboat.njk.
// Même ordre partout que la 4 Islands : hero, photos, options et prix, déroulé, inclus, avant de réserver,
// questions, autres sorties. Une section sans donnée n'existe pas. Aucun fait n'est écrit ici : tout est lu
// dans la fiche (ou site.json) ; seuls les titres de section et les libellés de boutons sont du texte d'interface.
const view = require("./view.js");
const price = require("../../js/v4-price.js");

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
// Noms de lieux jamais coupés en fin de ligne (« Koh Bubu », « Thung Yee Peng ») : espaces insécables.
const nb = (s) => String(s || "").replace(/\b(Koh|Ko|Ao) (\S+)/g, "$1\u00a0$2").replace(/Thung Yee Peng/g, "Thung\u00a0Yee\u00a0Peng");
const listJoin = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
const fact = (p, label) => ((p.facts || []).find((f) => f.label === label) || {}).value || "";

// Notes internes laissées dans les données (« (legacy meta description) », « (page speedboat actuelle : …) ») :
// jamais affichées. Une note réduite à « Not included » ne dit rien de plus que le titre du bloc.
function publicText(s) {
  const t = String(s || "").replace(/\s*\((?:legacy|page |site actuel)[^)]*\)/gi, "").trim();
  return /^not included\.?$/i.test(t) ? "" : t;
}

// ---------- Faits : le haut de page dit toujours la même chose, dans le même ordre ----------
// Durée, prise en charge (puis le prix d'appel, à part). Une valeur absente des données n'est pas affichée ;
// aucune n'est choisie selon sa longueur. Le reste va au déroulé ou à « Before you book ».
// Faits déjà dits ailleurs sur la page (sélecteur, intitulés des groupes, accroche) : jamais redits à côté.
const SKIP = ["National park fee", "Village entrance fee", "Not included", "Karts", "Boat", "Format", "Ways to go", "Rides", "Sessions", "Half days", "Full days", "Also", "Riding", "Level", "Your canvas"];
// Faits pratiques : « Before you book », sauf si la fiche dit déjà la même chose (même clé).
const BEFORE = { Children: "children", Ages: "children", Cancellation: "cancellation", Transfer: "pickup" };
// Créneaux écrits dans les faits, montrés en tête du sélecteur (cuisine, batik) : choisir, c'est d'abord choisir quand.
const WHEN = { "cooking-class": ["Lunch class", "Dinner class", "Carving class"], batik: ["Morning course", "Afternoon course", "Kayak and painting"] };

// « Duration » : le fait, sinon ce que les faits disent de la durée (séances du karting, demi-journées et journées).
function durationOf(p) {
  const d = fact(p, "Duration");
  if (d) return d;
  if (/minutes?$/.test(fact(p, "Sessions"))) return fact(p, "Sessions");
  if (fact(p, "Half days") && fact(p, "Full days")) return "Half day or full day";
  return "";
}
// « Pickup » : l'heure écrite, sinon ce que dit la liste « Included » ou le fait « Transfer ».
function pickupOf(p) {
  const h = fact(p, "Hotel pickup");
  if (h) return h;
  const inc = (p.included || []).find((x) => /^Hotel transfer both ways/.test(x));
  if (inc === "Hotel transfer both ways") return "Included";
  if (inc === "Hotel transfer both ways, within the Koh Lanta area") return "Included, Koh Lanta area";
  if (/^Hotel transfer both ways, from selected areas\b/.test(inc || "")) return "Included, selected areas";
  // La suite de la ligne liste d'autres inclus (plongée : repas) : le transfert reste inclus sans condition.
  if (/^Hotel transfer both ways, (breakfast|lunch)\b/.test(inc || "")) return "Included";
  if (/^not included/i.test(fact(p, "Transfer"))) return "Not included";
  return "";
}
// « Pickup » en tête seulement quand il dit une heure ou « Not included » : « Included » est déjà dans « What the price
// covers ». Il reste quand c'est le seul fait de la fiche.
function heroFacts(p) {
  const dur = durationOf(p), pick = pickupOf(p);
  const keep = pick && (/\d{2}:\d{2}/.test(pick) || /^not included/i.test(pick) || !dur);
  return [["Duration", dur], ["Pickup", keep ? pick : ""]].filter((f) => f[1]).map(([label, value]) => ({ label, value }));
}

function sortFacts(p, { day }) {
  const facts = (p.facts || []).map((f) => ({ label: f.label, value: publicText(f.value) })).filter((f) => f.value);
  const used = new Set(["Duration", "Hotel pickup"].concat(WHEN[p.slug] || []));
  if (!fact(p, "Duration") && /minutes?$/.test(fact(p, "Sessions"))) used.add("Sessions");
  const own = p.beforeYouBook || {};
  const rest = facts.filter((f) => !used.has(f.label) && !SKIP.includes(f.label));
  const before = [], side = [];
  // Un fait que l'accroche dit déjà (« mid-October to mid-May » sur Koh Rok) n'est pas redit à côté de la journée.
  const lead = String(p.lead || "").toLowerCase();
  for (const f of rest) {
    if (f.label in BEFORE) { if (own[BEFORE[f.label]] === undefined && !(f.label === "Transfer" && pickupOf(p) === "Not included")) before.push(f); }
    else if (day) { if (!lead.includes(f.value.toLowerCase())) side.push(f); }
    // Bateau sans journée : le départ et le lieu sont déjà dans « Pickup » et le titre, ils ne finissent pas la liste.
    else if (p.template !== "boat") before.push(f);
  }
  return { hero: heroFacts(p), side, before };
}

// ---------- Prix : chaque ligne de chaque option, avec son unité ; les frais sur place à part ----------
function priceRow(r) {
  // « Per person : 1,900 THB per person » : l'unité qui redit le libellé n'est pas répétée.
  // « Adult : 1,500 THB per person » sous « per adult » : l'unité ne dit rien de plus.
  const unit = r.amount === 0 || !r.unit || r.unit.toLowerCase() === r.label.toLowerCase() || (/^per person$/i.test(r.unit) && /^(adult|child)\b/i.test(r.label)) ? "" : r.unit;
  // « 3 or more people, per person : 1,800 THB per person » : le libellé perd la fin qui redit l'unité.
  const tail = unit ? ", " + unit.toLowerCase() : "";
  const label = tail && r.label.toLowerCase().endsWith(tail) ? r.label.slice(0, -tail.length) : r.label;
  return { label, name: r.label, amount: rowAmount(r), unit, raw: typeof r.amount === "number" ? r.amount : r.text };
}
function rowAmount(r) {
  if (typeof r.amount === "number") return r.amount === 0 ? "Free" : (r.supplement ? "+" : "") + view.thb(r.amount);
  return r.text || "";
}
function feeRows(fees) {
  return (fees || []).map((f) => ({ label: f.label, amount: view.thb(f.amount), unit: f.unit || "", note: publicText(f.note), cash: /\bcash\b/i.test(f.note || "") }));
}
const sameFees = (a, b) => JSON.stringify(a || []) === JSON.stringify(b || []);

function optionsOf(p) {
  const list = p.options || [];
  // Une option dont la brochure ne dit rien des frais (`feesToConfirm`, catamaran d'Ao Nang) ne casse pas le bloc
  // commun des autres : sa note dit que nous confirmons sur WhatsApp.
  const known = list.filter((o) => !o.feesToConfirm);
  const common = known.length > 0 && known.every((o) => sameFees(o.notIncludedFees, known[0].notIncludedFees)) ? feeRows(known[0].notIncludedFees) : [];
  return {
    common,
    list: list.map((o) => ({
      id: o.id,
      label: o.label,
      note: publicText(o.note || o.stub || ""),
      rows: (o.prices || []).map(priceRow),
      onRequest: Boolean(o.priceOnRequest || !(o.prices || []).length),
      // « Rentals and discounts » (kind "extra") : des lignes à ajouter à une plongée, pas une sortie à réserver seule.
      bookable: o.kind !== "extra",
      fees: common.length ? [] : feeRows(o.notIncludedFees)
    }))
  };
}

// ---------- Choisir et réserver : un seul bloc par fiche (options, détail de l'option choisie, groupe, total) ----------
// Les intitulés de groupe sont du texte d'interface ; les options, leurs lignes et leurs notes viennent des fiches.
const GROUPS = {
  "scuba-diving": [["No diving experience", ["one-day-experience", "snorkelling-on-dive-boat"]], ["Certified divers", ["fun-dives", "catamaran-special-trips"]], ["Learn to dive", ["courses"]]]
};
// Options qui partagent les mêmes lignes (pilotes et passagers, types de kart) : une grille durée × ligne.
const isMatrix = (p) => {
  const list = (p.options || []).filter((o) => o.kind !== "extra");
  if (list.length < 2 || !list.every((o) => o.counts && (o.prices || []).length)) return false;
  const labels = (o) => o.prices.map((r) => r.label).join("|");
  return list.every((o) => labels(o) === labels(list[0]));
};
const TIME = /\d{2}:\d{2}(?:[–-]\d{2}:\d{2})?/;
const norm = (t) => String(t || "").replace(/[–-]/g, " to ").replace(/\s+/g, " ").trim();
const orJoin = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " or " + a[a.length - 1]);
const sentences = (t) => String(t || "").split(/(?<=\.)\s+/).filter(Boolean);
const startsWithLabel = (sentence, label) => {
  const a = sentence.replace(/\.$/, "").toLowerCase(), b = label.toLowerCase();
  return a.length > 6 && (b === a || b.startsWith(a + ",") || b.startsWith(a + " "));
};

// Déroulé d'une option tenu en une ou deux phrases, sans heure (kayak, éléphants A à C, plongée, ATV, batik) :
// il va sous l'option, dans son détail. Le titre de l'option n'est pas redit en tête de phrase.
function shortDays(p) {
  const out = {};
  for (const b of view.day(p)) {
    if (b.options.length !== 1 || b.steps.some((s) => /^\d{2}:\d{2}/.test(s.t))) continue;
    const id = b.options[0];
    const label = ((p.options || []).find((o) => o.id === id) || {}).label || "";
    const same = b.steps.length > 1 && b.steps.every((s) => s.t === b.steps[0].t);
    out[id] = b.steps.map((s) => {
      const parts = sentences(s.text);
      if (parts.length > 1 && startsWithLabel(parts[0], label)) parts.shift();
      return { t: b.steps.length > 1 && !same ? s.t : "", text: parts.join(" ") };
    });
  }
  return out;
}

// Prix d'appel d'une option : la ligne adulte (« per adult »), sinon la plus basse avec son unité, « from » si les
// lignes diffèrent. Les lignes enfant et les suppléments ne font pas le prix d'appel.
function fromOf(o, skip) {
  const rows = (o.prices || []).filter((r) => typeof r.amount === "number" && r.amount > 0 && !r.supplement && !/^child/i.test(r.label) && !(skip && skip.has(r.label)));
  if (!rows.length) return null;
  const adult = rows.find((r) => /^(adult\b|per person$)/i.test(r.label));
  const tiers = rows.filter((r) => r.group).sort((a, b) => (a.group.min || 0) - (b.group.min || 0));
  const min = adult || tiers[0] || rows.reduce((a, b) => (b.amount < a.amount ? b : a));
  const many = !adult && !tiers.length && new Set(rows.map((r) => r.amount)).size > 1;
  const unit = adult ? (/^adult/i.test(adult.label) ? "per adult" : "per person") : min.group ? `${min.unit || "per boat"}, ${min.label.replace(/, the raft$/, "").toLowerCase()}` : min.unit || "";
  return { amount: view.thb(min.amount), unit, from: many };
}

// Une ligne qui dit ce qui distingue l'option : ses heures (séances, créneaux), sa journée, ou la première phrase de sa note.
function subOf(p, o, days) {
  const timed = !WHEN[p.slug] && (o.choices || []).find((c) => (c.values || []).length > 1 && c.values.every((v) => TIME.test(v.label)));
  if (timed) return `${timed.label}: ${orJoin(timed.values.map((v) => v.label.match(TIME)[0]))}`;
  const d = days[o.id];
  if (d && d.length === 1) { const m = d[0].text.match(/(\d{2}:\d{2} to \d{2}:\d{2}(?: or \d{2}:\d{2} to \d{2}:\d{2})?)\.?$/); if (m) return m[1].replace(/(\d) to (\d)/g, "$1–$2"); }
  const first = noteSentences(o)[0] || "";
  return first.length <= 80 ? first.replace(/\.$/, "") : "";
}
// Note publique de l'option, sans ce que la page dit déjà autrement (« Price per person. », « ask us » d'un prix sur demande,
// « Private speedboat option: » qui redit le nom de l'option).
function noteSentences(o) {
  const onRequest = o.priceOnRequest || !(o.prices || []).length;
  const own = new RegExp("^" + String(o.label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " option[:,]\\s*", "i");
  return sentences(publicText(o.note || o.stub || ""))
    .filter((x) => !/^price per person\.?$/i.test(x) && !(onRequest && /\bask us\b/i.test(x)))
    .map((x) => (own.test(x) ? x.replace(own, "").replace(/^./, (c) => c.toUpperCase()) : x));
}

// Groupes : la fiche décide (plongée par profil), sinon au départ d'ailleurs (Ao Nang), à la demi-journée ou à la
// journée (libellés « …, half day », « …, 1 day »), au partagé ou au privé. Un seul groupe : pas d'intitulé.
function groupsOf(p, list) {
  const own = GROUPS[p.slug];
  if (own) return own.map(([title, ids]) => ({ title, sub: "", ids: ids.filter((id) => list.some((o) => o.id === id)) }));
  const away = list.filter((o) => o.from), home = list.filter((o) => !o.from);
  const g = [];
  const half = home.filter((o) => /, half day$/.test(o.label)), full = home.filter((o) => /, 1 day$/.test(o.label));
  if (half.length && full.length && half.length + full.length === home.length) {
    g.push({ title: "Half day", factLabel: "Half days", ids: half.map((o) => o.id) }, { title: "Full day", factLabel: "Full days", ids: full.map((o) => o.id) });
  } else {
    const join = home.filter((o) => o.kind !== "private"), priv = home.filter((o) => o.kind === "private");
    if (join.length && priv.length) g.push({ title: "Join-in", ids: join.map((o) => o.id) }, { title: "Private", ids: priv.map((o) => o.id) });
    else g.push({ title: "", ids: home.map((o) => o.id) });
  }
  if (away.length) [...new Set(away.map((o) => o.from))].forEach((f) => g.push({ title: "From " + f, ids: away.filter((o) => o.from === f).map((o) => o.id) }));
  const shown = list.length >= 3 && g.filter((x) => x.ids.length).length > 1;
  return g.filter((x) => x.ids.length).map((x) => ({ title: shown ? x.title : "", sub: shown && x.factLabel ? fact(p, x.factLabel) : "", ids: x.ids }));
}

// Frais sur place d'une liste de lignes : adulte et enfant pour le calcul du liquide à prévoir (visiteurs étrangers).
function cashOf(fees) {
  const list = (fees || []).filter((f) => !/Thai/.test(f.label));
  const adult = list.find((f) => /, adults?$/.test(f.label)), child = list.find((f) => /, child(ren)?( \d+ to \d+)?$/.test(f.label));
  if (!adult || list.length !== (child ? 2 : 1)) return null;
  const ages = child && child.ages ? child.ages : (child && child.label.match(/(\d+) to (\d+)$/) ? { min: Number(RegExp.$1), max: Number(RegExp.$2) } : null);
  return { label: adult.label.split(", ")[0], adult: adult.amount, child: child ? child.amount : null, childAges: ages };
}

// Conseil d'âge écrit dans la note de l'option (catamaran : « Not recommended for children under 4. »).
function adviceOf(o) {
  const m = publicText(o.note || "").match(/Not recommended for children under (\d+)\./);
  return m ? { under: Number(m[1]), text: m[0] } : null;
}

// Le bloc complet. opts : { title, help, sub(o), facts(o), lead } pour la 4 Islands.
function pickOf(p, site, opts = {}) {
  const list = (p.options || []).filter((o) => o.kind !== "extra");
  const extra = (p.options || []).filter((o) => o.kind === "extra");
  const days = shortDays(p);
  const matrix = isMatrix(p);
  const optFees = optionsOf(p);
  const host = site.url.replace(/^https?:\/\//, "");
  const lead = view.optionOfPrice(p);
  const sel = list.some((o) => o.id === lead) ? lead : (list[0] || {}).id;
  const options = list.map((o) => {
    const form = formOf(p, o);
    const rowChoice = (form.choices || []).find((c) => c.values.some((v) => v.row));
    const ticks = new Set([...(o.extras || []), ...(o.prices || []).filter((r) => r.supplement && /^Add /.test(r.label)).map((r) => r.label)]);
    const notes = noteSentences(o);
    const sub = opts.sub ? opts.sub(o) : subOf(p, o, days);
    const skip = new Set(ticks);
    const rest = notes.filter((x) => x.replace(/\.$/, "") !== sub);
    const shared = optFees.list.find((x) => x.id === o.id) || {};
    return {
      id: o.id, label: o.label, sub, from: fromOf(o, skip), onRequest: Boolean(o.priceOnRequest || !(o.prices || []).length),
      facts: opts.facts ? opts.facts(o) : [],
      rows: (o.prices || []).map((r) => {
        const v = rowChoice && rowChoice.values.find((x) => x.row === r.label);
        return { ...priceRow(r), pick: v ? { choice: rowChoice.id, value: v.id } : null, tick: ticks.has(r.label) };
      }),
      note: rest.join(" "),
      what: days[o.id] || [],
      fees: shared.fees || [],
      thai: [],
      fallback: optionFallback(p, site, o)
    };
  });
  options.forEach((o) => { o.thai = o.fees.filter((f) => /Thai/.test(f.label)); o.fees = o.fees.filter((f) => !/Thai/.test(f.label)); });
  const common = optFees.common.filter((f) => !/Thai/.test(f.label)), thai = optFees.common.filter((f) => /Thai/.test(f.label));
  const groups = groupsOf(p, list).map((g) => {
    // Heures communes à tout le groupe (demi-journées) : dites dans l'intitulé, pas sous chaque option.
    const items = g.ids.map((id) => options.find((o) => o.id === id));
    const bare = (t) => norm(String(t || "").replace(/^[A-Z][a-z]+: /, ""));
    if (g.sub && items.every((o) => bare(o.sub) === bare(g.sub))) items.forEach((o) => { o.sub = ""; });
    else if (g.title && items.length > 1 && items[0].sub && items.every((o) => o.sub === items[0].sub)) { g.sub = items[0].sub; items.forEach((o) => { o.sub = ""; }); }
    else g.sub = "";
    // La phrase d'heures qui termine un déroulé court (« 09:30 to 12:30 or 14:00 to 17:00. ») est déjà dite au-dessus.
    items.forEach((o) => {
      const shown = bare(o.sub || g.sub);
      // « Sessions at 09:00, 12:00 or 15:00. » redit la ligne « Session: … » de l'option.
      if (/^Session/.test(o.sub)) o.what = o.what.map((w) => ({ ...w, text: w.text.replace(/\s*Sessions? at [\d:, or]+\.$/, "") }));
      o.what = o.what.map((w) => ({ ...w, text: w.text.replace(/\s*(\d{2}:\d{2} to \d{2}:\d{2}(?: or \d{2}:\d{2} to \d{2}:\d{2})?)\.$/, (m, t) => (shown && shown === norm(t) ? "" : m)) })).filter((w) => w.text);
    });
    return { title: g.title, sub: g.sub, options: items };
  });
  const adultFrom = price.adultFrom(list);
  const counts = list.some((o) => o.counts);
  // Données du script de la page (v4-product.js) : lignes de prix brutes pour le devis, frais en espèces par option.
  const json = {
    slug: p.slug, name: p.name, sel, adultFrom: adultFrom || 12, mode: counts ? "counts" : "people",
    options: list.map((o) => ({
      id: o.id, label: o.label, kind: o.kind || "", prices: o.prices || [], priceOnRequest: Boolean(o.priceOnRequest), feesToConfirm: Boolean(o.feesToConfirm),
      counts: o.counts ? o.counts.rows : null, cash: o.feesToConfirm ? null : cashOf(o.notIncludedFees), advice: adviceOf(o)
    }))
  };
  const first = list.find((o) => o.id === sel);
  const q = first && !first.counts ? price.quote(first, { adults: 2, ages: [] }) : null;
  return {
    title: opts.title || (list.length > 1 ? "Choose your option" : "Price and booking"),
    help: opts.help || "",
    // Batik : chaque option dit déjà ses heures dans son détail, la liste en tête les redirait.
    when: options.some((o) => o.what.length) ? [] : (WHEN[p.slug] || []).map((l) => ({ label: l, value: fact(p, l) })).filter((f) => f.value),
    matrix: matrix ? { rows: list[0].prices.map((r) => r.label), unit: list[0].prices[0].unit || "" } : null,
    groups, options, sel, single: list.length === 1,
    common, thai, feesCash: optFees.common.some((f) => f.cash),
    extra: extra.map((o) => ({ id: o.id, label: o.label, note: publicText(o.note || ""), rows: (o.prices || []).map(priceRow) })),
    calc: {
      mode: json.mode, adultFrom: json.adultFrom, kidMax: json.adultFrom - 1,
      countRows: counts ? (first.counts || {}).rows || [] : [],
      countLabel: counts ? (first.counts || {}).label || "" : "",
      total: q ? view.thb(q.total) : "", lines: q ? q.lines.map(([l, a]) => ({ label: l, amount: view.thb(a) })) : [],
      selLabel: first ? first.label : "", fallback: first ? optionFallback(p, site, first) : ""
    },
    json
  };
}

// La question de la fiche qui aide à choisir entre les options : sa réponse va près du sélecteur, plus dans « Questions ».
const HELP = /^(which (\w+ )?(trip|ride|programme|course) should i (pick|choose)\?|longtail or speedboat\b.*|speedboat or longtail\?|speedboat, longtail or catamaran\?)$/i;
function helpOf(p) {
  const q = (p.faq || []).find((f) => HELP.test(f.q));
  return q ? { q: q.q, a: q.a } : null;
}

// ---------- Sous-variantes que la feuille fait choisir (créneau, cours, karts, pilotes…) ----------
// Structure lue dans chaque option de la fiche (products/**, voir NOTES.md « Pages produit ») :
//   "choices": [{ "id": "session", "label": "Session", "type": "one" | "text", "required": true, "hint": "…",
//                 "values": [{ "id": "0900", "label": "09:00", "row": "libellé d'une ligne de prix", "days": ["Tuesday"] }] }],
//   "counts": { "label": "Karts", "rows": ["Small single seat", …] },   un nombre par ligne de prix
//   "extras": ["Extra dive, decided on the day"]                         lignes de prix à cocher
// Les choix sont lus dans la fiche, jamais déduits (décision client du 08.11.2026).
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const rowPrice = (r) => (r ? rowAmount(r) + (r.unit && r.amount !== 0 ? " " + r.unit : "") : "");

// Forme finale pour booking.js : jours en numéros, prix des lignes affichés à côté des valeurs, rien de vide.
function formOf(p, o) {
  const declared = o.choices || o.counts || o.extras;
  const raw = declared ? { choices: o.choices, counts: o.counts, extras: o.extras } : {};
  const rowOf = (label) => (o.prices || []).find((r) => r.label === label);
  const out = {};
  const choices = (raw.choices || []).filter((c) => c.type === "text" || (c.values || []).length > 1).map((c) => ({
    id: c.id, label: c.label, type: c.type === "text" ? "text" : "one", required: c.required !== false, hint: c.hint || "", ...(c.error ? { error: c.error } : {}),
    values: (c.values || []).map((v) => ({
      id: v.id, label: v.label, ...(v.row ? { row: v.row, price: v.price || rowPrice(rowOf(v.row)) } : {}),
      ...(v.days && v.days.length ? { days: v.days.map((d) => (typeof d === "number" ? d : DAY_NAMES.indexOf(d))).filter((d) => d > -1) } : {})
    }))
  }));
  if (choices.length) out.choices = choices;
  if (raw.counts && raw.counts.rows && raw.counts.rows.length) out.counts = { label: raw.counts.label, rows: raw.counts.rows, prices: raw.counts.rows.map((l) => rowPrice(rowOf(l))) };
  if (raw.extras && raw.extras.length) out.extras = raw.extras.map((l) => ({ label: l, price: rowPrice(rowOf(l)) }));
  return out;
}
// booking.js lit les suppléments comme des libellés (state.addons) et la feuille les affiche avec leur prix.
function withForms(p, options) {
  const extra = new Set((p.options || []).filter((o) => o.kind === "extra").map((o) => o.id));
  return options.filter((o) => !extra.has(o.id)).map((o) => {
    const src = (p.options || []).find((x) => x.id === o.id) || {};
    return { ...o, ...formOf(p, src) };
  });
}

// ---------- Déroulé : les journées minutées (« How the day goes ») ; les déroulés d'une phrase vont sous leur option ----------
// Plusieurs journées (Koh Rok, éléphants D, cuisine midi et soir) : la page montre celle de l'option choisie ; un bloc
// commun à plusieurs options reste toujours visible avec son titre.
function programme(p, optLabels) {
  const short = shortDays(p);
  const blocks = view.day(p).filter((b) => !(b.options.length === 1 && short[b.options[0]]));
  if (!blocks.length) return null;
  const all = Object.keys(optLabels).length;
  const sameOpts = blocks.length > 1 && blocks.every((b) => b.options.length && b.options.join() === blocks[0].options.join());
  return {
    mode: "day",
    title: "How the day goes",
    blocks: blocks.map((b) => ({
      ids: b.options.length && b.options.length < all ? b.options : [],
      // Deux blocs pour les mêmes options (cours du midi et du soir) : chacun garde son titre. Sinon le nom de l'option.
      title: sameOpts ? b.title : blocks.length > 1 || (b.options.length && b.options.length < all) ? listJoin(b.options.map((id) => optLabels[id]).filter(Boolean)) : "",
      note: publicText(b.note),
      steps: b.steps.map((s) => ({ t: s.t, approx: s.approx, fixed: s.fixed, text: s.text }))
    }))
  };
}

// ---------- Autres sorties : les fiches voisines écrites dans la donnée (related), en cartes ----------
const OTHER_LINKS = {
  "/tours/speedboat/": "Speedboat timetable",
  "/tours/rental/": "Scooter and car rental",
  "/taxi/": "Private minivan transfers with VIP Taxi Lanta"
};
function related(p, ctx) {
  const urls = p.related || [];
  const cards = urls.map((u) => ctx.cardsByUrl[u]).filter(Boolean).slice(0, 3);
  const taxi = urls.map((u) => ctx.taxi.find((t) => t.url === u)).find(Boolean);
  const links = urls.filter((u) => OTHER_LINKS[u] && ctx.live.has(u) && u !== p.url).map((u) => ({ href: u, label: OTHER_LINKS[u] }));
  const kinds = new Set(cards.map((c) => c.kind));
  const title = kinds.size === 1 ? (kinds.has("boat") ? "More boat trips" : "More activities") : "More trips and activities";
  // Le lien suit les cartes montrées, comme le titre (plongée : cartes bateaux) ; cartes mêlées : la liste complète.
  const only = kinds.size === 1 ? [...kinds][0] : kinds.size > 1 ? "mixed" : p.template;
  const grp = ctx.group;
  const all = grp ? { href: "/tours/#" + grp.hash, label: "See all " + grp.title.toLowerCase() }
    : only === "mixed" ? { href: "/tours/", label: "See the boat trips and activities" }
    : only === "boat" ? { href: "/tours/#boat-trips", label: "Compare all boat trips" }
    : only === "activity" ? { href: "/tours/#activities", label: "See all activities" }
    : { href: "/tours/", label: "See the boat trips and activities" };
  return cards.length || links.length || taxi ? {
    title, cards, links, all,
    transfer: taxi ? { from: taxi.from, href: taxi.url, name: taxi.name } : null
  } : null;
}

// ---------- WhatsApp : chaque lien dit de quel produit et de quelle page il vient ----------
function askText(name) {
  return `Question about ${name}: `;
}

// Repli sans JavaScript d'un bouton d'option : la demande dit déjà le produit, l'option et la page.
function optionFallback(p, site, o) {
  return `Booking request: ${p.name}${o ? " – " + o.label : ""}`;
}

// Listes « Included » par option quand la fiche en donne (includedByOption) : une liste par option citée, puis la liste
// commune pour les options restantes. Sans includedByOption, la fiche garde une seule liste.
function includedGroups(p, optLabels) {
  const own = p.includedByOption;
  if (!own) return null;
  const rest = Object.keys(optLabels).filter((id) => !own[id]);
  return [
    { label: rest.map((id) => optLabels[id]).join(", "), items: p.included || [] },
    ...Object.keys(own).map((id) => ({ label: optLabels[id], items: own[id] }))
  ];
}

// ---------- Fiche bateau ou activité ----------
function productPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const opts = optionsOf(p);
  const optLabels = Object.fromEntries((p.options || []).map((o) => [o.id, o.label]));
  const prog = programme(p, optLabels);
  const facts = sortFacts(p, { day: Boolean(prog) });
  const pr = view.price(p);
  const single = opts.list.length === 1 ? opts.list[0].id : "";
  const fee = view.parkFee(p);
  // « Not included » : la ligne de la fiche telle quelle ; les montants ne sont dits qu'une fois, sous les options.
  const notIncluded = (p.notIncluded || []).slice();
  const byb = view.beforeBook(p, site, { skipParkFee: true }).concat(facts.before.map((f) => ({ label: f.label, text: f.value })));
  const help = helpOf(p);
  const pick = pickOf(p, site, { help: help ? help.a : "" });
  return {
    slug: p.slug, kind: p.template, url: p.url, name: p.name,
    // Groupe de la vignette (îles, mangrove, sur terre) : menu marqué et fil d'Ariane vers son filtre du hub.
    nav: ctx.group ? ctx.group.id : p.template === "boat" ? "boats" : "activities",
    crumb: ctx.group ? { label: ctx.group.nav, href: "/tours/#" + ctx.group.hash }
      : p.template === "boat" ? { label: "Boat trips", href: "/tours/#boat-trips" } : { label: "Activities", href: "/tours/#activities" },
    seo: p.seo, h1: nb(p.h1), lead: p.lead, promise: p.promise || "",
    keyFacts: facts.hero,
    price: pr ? { amount: pr.amount, unit: p.price.unit } : null,
    hero: ctx.hero,
    pick,
    programme: prog,
    sideFacts: facts.side,
    included: p.included || [],
    // Liste « Included » propre à une option (Koh Phi Phi, longtail privé) : la liste de la fiche vaut pour les autres options.
    includedGroups: includedGroups(p, optLabels),
    notIncluded,
    beforeBook: byb,
    faq: (p.faq || []).filter((f) => !help || f.q !== help.q).map((f) => ({ ...f, q: nb(f.q) })),
    related: related(p, ctx),
    single: single || pick.sel,
    ask: askText(p.name),
    fallback: single ? optionFallback(p, site, p.options[0]) : view.fallbackText(p, site),
    booking: bookingOf(p, site),
    parkFee: fee,
    jsonLd: p.template === "boat" ? schema.tour(p, site) : schema.activity(p, site)
  };
}

// Configuration de la feuille (booking.js) : sous-variantes, lignes brutes pour le total estimé, frais en espèces de
// chaque option, prise en charge facultative quand le transfert n'est pas inclus (karting), conseil d'âge (catamaran).
function bookingOf(p, site) {
  const b = view.bookingTour(p, site);
  const optional = /^not included/i.test(fact(p, "Transfer"));
  return {
    ...b, tripList: true,
    ...(optional ? { pickupRequired: false, pickupLabel: "Hotel, if you want a transfer", pickupHint: "Optional. The transfer is not included, we quote it on WhatsApp." } : {}),
    options: withForms(p, b.options).map((o) => {
      const src = (p.options || []).find((x) => x.id === o.id) || {};
      const adv = adviceOf(src);
      return {
        ...o, prices: src.prices || [], ...(src.priceOnRequest ? { priceOnRequest: true } : {}),
        cash: src.feesToConfirm ? null : cashOf(src.notIncludedFees),
        ...(adv ? { advice: adv } : {}),
        ...(o.counts ? { people: o.counts.rows.every((r) => /rider|passenger|adult|child/i.test(r)) } : {})
      };
    })
  };
}

// ---------- Location : une catégorie à la fois (scooters d'abord), chaque véhicule est une ligne qui ouvre la feuille ----------
// L'unité (« per 24 hours », réponse du client) est dite une fois par catégorie, pas sur chaque ligne ; les comptes
// sont sur les onglets, la fourchette une fois sous eux. Ni faits du haut ni prix d'appel : la liste est le haut de page.
const RENT_SHORT = { "scooters-and-small-bikes": "Scooters", "big-bikes": "Big bikes", "cars-and-pick-ups": "Cars" };
function rentalPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const pr = view.price(p);
  const cats = (p.options || []).map((o) => {
    const amounts = (o.prices || []).map((r) => r.amount);
    const units = [...new Set((o.prices || []).map((r) => r.unit || ""))];
    return {
      id: o.id, label: o.label, short: RENT_SHORT[o.id] || o.label, count: (o.prices || []).length,
      lo: view.thb(Math.min(...amounts)), hi: view.thb(Math.max(...amounts)), from: Math.min(...amounts),
      // Une seule unité pour toute la catégorie, sinon chaque ligne garde la sienne.
      unit: units.length === 1 ? units[0] : "",
      rows: (o.prices || []).map((r) => ({ ...priceRow(r), unit: units.length === 1 ? "" : priceRow(r).unit, spec: r.spec || "", fallback: `Rental request: ${o.label} – ${r.label}\nFrom: \nTo: ` })),
      fallback: `Rental request: ${o.label}\nFrom: \nTo: `
    };
  });
  // Scooters d'abord : le cas le plus fréquent sur l'île ; puis grosses motos, puis voitures.
  const order = ["scooters-and-small-bikes", "big-bikes", "cars-and-pick-ups"];
  cats.sort((x, y) => (order.indexOf(x.id) + 1 || 99) - (order.indexOf(y.id) + 1 || 99));
  // Accroche sans sa première phrase, qui redit les comptes des onglets.
  const lead = (p.lead || "").replace(/^\d+ [^.]*\.\s*/, "");
  const links = [{ href: "/tours/", label: "Boat trips and activities" }].concat((p.related || []).filter((u) => OTHER_LINKS[u] && ctx.live.has(u)).map((u) => ({ href: u, label: OTHER_LINKS[u] })));
  return {
    slug: p.slug, kind: "rental", url: p.url, name: p.name, crumb: "Rental", nav: "rental",
    seo: p.seo, h1: nb(p.h1), lead,
    price: pr ? { amount: pr.amount, unit: p.price.unit } : null,
    cats,
    // « How to book » redit l'accroche ; les questions redisent les onglets (elles restent dans le JSON-LD).
    beforeBook: view.beforeBook(p, site).filter((b) => b.label !== "How to book"),
    faq: [],
    related: { title: "Trips and transfers", cards: [], links, all: null, transfer: null },
    ask: askText(p.name),
    fallback: `Rental request: ${p.name}\nFrom: \nTo: `,
    booking: { ...view.bookingTour(p, site), variant: "rental" },
    jsonLd: schema.rental(p, site)
  };
}

// ---------- Speedboat : la grille des départs ; chaque arrêt ouvre la feuille sur son trajet et son heure ----------
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function placeOf(raw) {
  const m = String(raw).match(/^(.*?) \((.*)\)$/);
  return m ? { name: m[1], note: m[2] } : { name: raw, note: "" };
}

function speedboatRoutes(p) {
  const tt = p.timetable || {};
  const routes = new Map();
  const add = (id, label, group, dep) => {
    if (!routes.has(id)) routes.set(id, { id, label, group, deps: [] });
    const r = routes.get(id);
    // Identifiant unique sur toute la grille (« to-koh-ngai@1500 ») : les boutons radio d'un même groupe ne se confondent pas.
    dep.id = id + "@" + dep.time.replace(":", "");
    if (!r.deps.some((d) => d.id === dep.id)) r.deps.push(dep);
  };
  const board = (tt.outbound || []).map((run) => {
    const langkawi = /Langkawi/.test(run.onward || "");
    const season = langkawi ? "" : publicText(run.season || "");
    const stops = run.stops.map((s) => {
      const pl = placeOf(s.place);
      const route = "to-" + slugify(pl.name);
      const pier = [pl.note, publicText(s.note || "")].filter(Boolean).join(", ");
      add(route, `Koh Lanta to ${pl.name}`, "out", { time: run.departs, arrives: s.time, detail: [pier, season].filter(Boolean).join(". "), pier, season: run.seasonRange && !langkawi ? run.seasonRange.label : "" });
      return { place: pl.name, note: [pl.note, publicText(s.note || "")].filter(Boolean).join(", "), time: s.time, route, dep: route + "@" + run.departs.replace(":", "") };
    });
    let onward = null;
    if (langkawi) {
      // « From Koh Lipe a ferry goes on to Langkawi, arriving at 18:00 Malaysia time. » : l'arrivée est lue dans la phrase.
      const at = (run.onward.match(/arriving at (\d{2}:\d{2}[^.]*)/) || [])[1] || "";
      const lk = (run.season || "").replace(/^Langkawi:\s*/, "");
      add("to-langkawi", "Koh Lanta to Langkawi", "out", { time: run.departs, arrives: at, detail: ["Change of boat at Koh Lipe", lk ? "Runs " + lk : ""].filter(Boolean).join(". "), season: lk });
      onward = { text: run.onward, season: lk, route: "to-langkawi", dep: "to-langkawi@" + run.departs.replace(":", ""), checkIn: tt.checkIn && tt.checkIn.langkawi ? tt.checkIn.langkawi : "" };
    }
    return { time: run.departs, stops, season, onward };
  });
  // Départs d'une seconde compagnie, ajoutés aux trajets existants (même destination, même bouton) : heure, arrivée et
  // saison quand la donnée les a, jamais de ponton. Une heure déjà dans la grille complète garde son arrivée et son ponton.
  for (const o of tt.otherDepartures || []) {
    const deps = o.deps || (o.departs || []).map((t) => ({ time: t }));
    for (const place of o.places || [o.place]) {
      for (const d of deps) add("to-" + slugify(place), `Koh Lanta to ${place}`, "out", { time: d.time, arrives: d.arrives || "", detail: d.season ? "Runs " + d.season : "", pier: "", season: d.season || "" });
    }
  }
  // Une ligne par destination, toutes ses heures. Le ponton n'est dit que pour les bateaux qui le donnent.
  const langkawiRun = board.find((r) => r.onward);
  const dests = [...routes.values()].filter((r) => r.group === "out").map((r) => {
    const deps = r.deps.slice().sort((a, b) => a.time.localeCompare(b.time));
    const piers = [...new Set(deps.map((d) => d.pier).filter(Boolean))];
    const notes = piers.map((pier) => {
      const with_ = deps.filter((d) => d.pier === pier);
      return cap(pier) + (with_.length === deps.length ? "" : ` on the ${listJoin(with_.map((d) => d.time))} boat${with_.length > 1 ? "s" : ""}`);
    });
    if (r.id === "to-langkawi" && langkawiRun) {
      const ow = langkawiRun.onward;
      // L'enregistrement de Langkawi est dit une fois, sous la grille.
      notes.push(ow.text, ...(ow.season ? [`Runs ${ow.season}.`] : []));
    }
    // Saison commune à tous les bateaux de la ligne (Krabi, Railay, Koh Yao) : dite une fois, dans la ligne repliée.
    const seasons = [...new Set(deps.map((d) => d.season || ""))];
    const allSeason = seasons.length === 1 ? seasons[0] : "";
    return {
      place: r.label.replace(/^Koh Lanta to /, ""), route: r.id, notes, season: allSeason,
      lk: r.id === "to-langkawi" && langkawiRun ? { text: langkawiRun.onward.text, season: langkawiRun.onward.season } : null,
      deps: deps.map((d) => ({ time: d.time, arrives: d.arrives, season: allSeason ? "" : d.season, pier: d.pier ? cap(d.pier) : "", dep: d.id }))
    };
  });
  const back = (tt.inbound || []).map((run) => {
    const origins = [{ name: run.from, times: run.departs }].concat((run.stops || []).map((s) => ({ name: s.place, times: s.times })))
      .map((o) => ({ ...placeOf(o.name), times: o.times }));
    const season = publicText(run.season || "");
    const rows = origins.map((o) => {
      const route = "from-" + slugify(o.name);
      const deps = o.times.map((t, i) => {
        // Saison du bateau (« Dec – Apr », ou la phrase de Langkawi) : elle part dans le message, comme à l'aller.
        const runSeason = run.seasonRange ? run.seasonRange.label : (/Langkawi:\s*(.+)$/.exec(run.season || "") || [])[1] || "";
        add(route, `${o.name} to Koh Lanta`, "in", { time: t, arrives: (run.arrivesKohLanta || [])[i] || "", detail: [o.note, season].filter(Boolean).join(". "), season: runSeason });
        return { time: t, arrives: (run.arrivesKohLanta || [])[i] || "", dep: route + "@" + t.replace(":", "") };
      });
      return { place: o.name, note: o.note, route, deps };
    });
    return { from: run.from, via: run.via || [], season, short: run.seasonRange ? run.seasonRange.label : run.season && /^High season$/i.test(run.season) ? "High season" : "", rows };
  });
  // Retours de la seconde compagnie : fusionnés dans la ligne du même port quand elle existe, sans son ponton.
  for (const o of tt.otherReturns || []) {
    const route = "from-" + slugify(o.place);
    let run = back.find((x) => x.rows.some((r) => r.route === route));
    let row = run && run.rows.find((r) => r.route === route);
    if (!row) {
      row = { place: o.place, note: "", route, deps: [] };
      run = { from: o.place, via: [], season: "", short: "", rows: [row] };
      back.push(run);
    } else if (run.short && run.rows.length === 1) {
      // La saison de la ligne (« Dec – Apr ») ne vaut plus pour tous ses bateaux : elle passe sur chacun des siens.
      row.deps.forEach((d) => { if (!d.season) d.season = run.short; });
      run.short = ""; run.season = "";
    }
    for (const d of o.deps) {
      const id = route + "@" + d.time.replace(":", "");
      if (row.deps.some((x) => x.dep === id)) continue;
      add(route, `${o.place} to Koh Lanta`, "in", { time: d.time, arrives: d.arrives || "", detail: d.season ? "Runs " + d.season : "", season: d.season || "" });
      row.deps.push({ time: d.time, arrives: d.arrives || "", season: d.season || "", other: true, dep: id });
    }
    row.deps.sort((a, b) => a.time.localeCompare(b.time));
  }
  const list = [...routes.values()];
  list.forEach((r) => r.deps.sort((a, b) => a.time.localeCompare(b.time)));
  return { board, dests, back, routes: list };
}

function speedboatPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const tt = p.timetable || {};
  const sb = speedboatRoutes(p);
  // Trajet inverse (« to-koh-ngai » et « from-koh-ngai ») : il donne les bateaux du retour quand la grille les a.
  const ids = new Set(sb.routes.map((r) => r.id));
  const backOf = (id) => { const b = id.startsWith("to-") ? "from-" + id.slice(3) : "to-" + id.slice(5); return ids.has(b) ? b : ""; };
  const routes = sb.routes.map((r) => ({ id: r.id, label: r.label, back: backOf(r.id), deps: r.deps }));
  const groups = [
    { label: "From Koh Lanta", routes: sb.routes.filter((r) => r.group === "out") },
    { label: "To Koh Lanta", routes: sb.routes.filter((r) => r.group === "in") }
  ].filter((g) => g.routes.length);
  // Retours : une ligne par port de départ, comme les départs ; ponton du port de départ dans le tableau.
  const back = sb.back.flatMap((run) => run.rows.map((r, i) => ({
    place: r.place, route: r.route,
    season: run.short,
    note: run.short ? "" : run.season,
    via: i === 0 && run.via.length ? "via " + run.via.join(", ") : "",
    deps: r.deps.map((d) => ({ time: d.time, arrives: d.arrives, season: d.season || "", pier: r.note && !d.other ? cap(r.note) : "", dep: d.dep }))
  })));
  const ck = tt.checkIn || {};
  // Une phrase sous le titre (la grille et la réponse sur WhatsApp), la saison juste dessous : c'est elle qui décide.
  const lead = [fact(p, "Timetable") ? `Timetable for the ${fact(p, "Timetable")}.` : "", p.priceOnRequest ? "We reply with the fare on WhatsApp." : ""].filter(Boolean).join(" ");
  // La prise en charge à l'hôtel n'est dite qu'une fois (« Pickup » de Before you book) ; « How do I book a seat? »
  // décrit l'ancien formulaire. Ces deux questions restent dans le JSON-LD.
  const shown = (p.faq || []).filter((f) => !/hotel pickup included|how do i book/i.test(f.q));
  return {
    slug: p.slug, kind: "speedboat", url: p.url, name: p.name, crumb: "Speedboat", nav: "speedboat",
    seo: p.seo, h1: nb(p.h1), lead,
    season: publicText((tt.seasons || [])[0] || ""),
    board: sb.board, dests: sb.dests, back,
    checkIn: ck.default ? `Check in ${ck.default}.${ck.langkawi ? ` For Langkawi, ${ck.langkawi}.` : ""}` : "",
    beforeBook: view.beforeBook(p, site),
    faq: shown,
    related: related(p, ctx),
    ask: askText(p.name),
    fallback: `Speedboat request: \nDate: `,
    booking: {
      variant: "speedboat", brand: site.brands[p.brand].name, product: p.name, productId: p.slug,
      page: host + p.url, whatsapp: site.whatsapp.number, refPrefix: p.refPrefix || "",
      routes, groups: groups.map((g) => ({ label: g.label, routes: g.routes.map((r) => ({ id: r.id, label: r.label })) }))
    },
    jsonLd: schema.transfer(p, site)
  };
}

// ---------- /transfers/ : « What kind of transfer are you looking for? », trois choix ----------
// Textes et faits : products/secret-transfers/shared-minivan.json (choices, faq, beforeYouBook). Le minivan partagé
// n'a ni tarif ni nom de prestataire sur le site : seule la demande WhatsApp de Secret Travel & Tour.
// ctx.privateRoutes : trajets privés cités en exemple, avec le prix d'appel de la grille VIP Taxi Lanta (taxiPages.js).
function transfersPage(p, ctx) {
  const { site, schema } = ctx;
  const host = site.url.replace(/^https?:\/\//, "");
  const ch = p.choices;
  const own = p.beforeYouBook || {};
  const examples = ch.private.routes.map((id) => {
    const r = (ctx.privateRoutes || []).find((x) => x.id === id);
    if (!r) throw new Error(`[transfersPage] trajet privé introuvable : ${id}`);
    return r;
  })
    .map((r) => ({ href: r.url, name: `${r.from} to ${r.to}`, price: r.price ? r.price.label : "" }));
  const links = [
    { href: "/tours/speedboat/", label: "Speedboat timetable" },
    { href: "/tours/rental/", label: "Scooter and car rental" },
    { href: "/tours/", label: "Boat trips and activities" }
  ];
  return {
    slug: p.slug, kind: "transfers", url: p.url, name: p.name, crumb: "Transfers", nav: "transfers",
    seo: p.seo, h1: p.h1, lead: p.lead,
    choices: { ...ch, private: { ...ch.private, routes: examples } },
    beforeBook: [
      { label: "Children", text: own.children },
      { label: "Travel times", text: own.weather },
      // Minivan partagé : sa règle d'annulation, avec le lien vers la page des conditions (12.11.2026).
      { label: "Cancellation", text: own.cancellation, href: (site.booking.cancellationPolicy || {}).url, hrefLabel: "All cancellation rules" }
    ].filter((b) => b.text),
    faq: p.faq || [],
    related: { title: "Also from Koh Lanta", cards: [], links, all: null, transfer: null },
    ask: "Transfer question: ",
    unsureText: "Transfer question: \nFrom: \nTo: \nDate: ",
    fallback: "Shared minivan request (Secret Travel & Tour): \nPickup: \nDrop-off: \nDate: ",
    // Même feuille que /taxi/ (variante taxi, Pickup et Drop-off libres), au nom de Secret Travel & Tour : le message dit
    // « Shared minivan request (Secret Travel & Tour) » pour qu'on ne le prenne pas pour une demande VIP Taxi Lanta.
    booking: {
      variant: "taxi", shared: true, brand: site.brands[p.brand].name, product: ch.shared.title,
      kicker: ch.shared.cta, productId: "transfers-shared",
      page: host + p.url, whatsapp: site.whatsapp.number
    },
    jsonLd: schema.transferHub(p, site, { privateUrl: ch.private.href, localUrl: ch.local.href })
  };
}

module.exports = { pickOf, helpOf, bookingOf, cashOf, heroFacts, formOf, withForms, productPage, rentalPage, speedboatPage, transfersPage, speedboatRoutes, publicText, askText, sortFacts, optionsOf, programme };
