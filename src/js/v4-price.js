/* Estimation d'un prix à partir des lignes de prix d'une option (products/**.json), rien d'autre.
   Sert au calculateur et au comparateur de la page 4 Islands (navigateur) et au rendu du build (Node).
   Un cas que les lignes ne couvrent pas (un âge sans tarif, un groupe hors grille) n'est jamais deviné :
   il revient dans `unpriced` et la page dit « price on WhatsApp » pour lui. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.STT_PRICE = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function thb(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " THB";
  }

  // Âge adulte : un an après le plus grand âge enfant des grilles du produit (4 Islands : enfants 4 à 11, donc 12).
  function adultFrom(options) {
    var max = 0;
    (options || []).forEach(function (o) {
      (o.prices || []).forEach(function (r) { if (r.ages && r.ages.max > max) max = r.ages.max; });
    });
    return max ? max + 1 : 0;
  }

  // option : { prices: [{label, amount, ages?, group?, supplement?}], priceOnRequest? }
  // Renvoie { total, lines: [[libellé, montant]], unpriced: [âges], perBoat } ou null (prix sur WhatsApp).
  function estimate(option, adults, ages, addons) {
    if (!option || option.priceOnRequest || !(option.prices || []).length) return null;
    var rows = option.prices;
    var kids = (ages || []).filter(function (a) { return a !== "" && a !== null && a !== undefined; }).map(Number);
    var lines = [];
    var total = 0;
    var tiers = rows.filter(function (r) { return r.group && typeof r.amount === "number"; });
    if (tiers.length) {
      // Un tarif enfant à côté de tranches de groupe sans « Each extra person » : la règle de calcul n'est pas écrite,
      // rien n'est deviné (prix confirmé sur WhatsApp). Les radeaux, eux, ont leur règle juste en dessous.
      var ageRows = rows.some(function (r) { return r.ages && typeof r.amount === "number" && r.amount > 0; });
      // Radeau privé (Lacha Ru A, B, C, décision du 11.11.2026) : le prix de base couvre 1 ou 2 adultes, chaque adulte
      // en plus paie « Each extra person », chaque enfant paie son tarif d'âge. Un âge sans tarif (moins de 3 ans) n'est pas deviné.
      var raftExtra = rows.filter(function (r) { return r.supplement && /extra person/i.test(r.label) && typeof r.amount === "number"; })[0];
      var raftBase = tiers.length === 1 && tiers[0].group.max !== undefined ? tiers[0] : null;
      if (ageRows && raftExtra && raftBase) {
        if (adults < 1) return null;
        var rl = [], rt = raftBase.amount, unpricedKids = [], byAge = [];
        rl.push([raftBase.label, raftBase.amount]);
        if (adults > raftBase.group.max) {
          var more = adults - raftBase.group.max;
          rt += more * raftExtra.amount;
          rl.push([more + " × extra " + (more === 1 ? "person" : "people"), more * raftExtra.amount]);
        }
        kids.forEach(function (age) {
          var cr = rows.filter(function (x) { return x.ages && typeof x.amount === "number" && age >= (x.ages.min || 0) && age <= (x.ages.max === undefined ? Infinity : x.ages.max); })[0];
          if (!cr) { unpricedKids.push(age); return; }
          var hit = byAge.filter(function (b) { return b.r === cr; })[0];
          if (hit) hit.n++; else byAge.push({ r: cr, n: 1 });
        });
        byAge.forEach(function (b) { rt += b.n * b.r.amount; rl.push([b.n + " × " + b.r.label.toLowerCase(), b.n * b.r.amount]); });
        return { total: rt, lines: rl, unpriced: unpricedKids, perBoat: false };
      }
      if (ageRows && kids.length) return null;
      // Bateau privé : les enfants comptent dans le groupe dès 4 ans, les moins de 4 ans ne comptent pas (client, 08.11.2026).
      var n = adults + kids.filter(function (a) { return a >= 4; }).length;
      var hits = tiers.filter(function (r) { return n >= r.group.min && n <= r.group.max; });
      // Deux tranches du partenaire qui se touchent (« 5 to 7 » et « 7 to 9 ») : un groupe pile sur la borne n'a pas un prix
      // écrit, il n'est pas deviné (prix confirmé sur WhatsApp).
      if (hits.some(function (r) { return r.amount !== hits[0].amount; })) return null;
      var tier = hits[0];
      var top = tiers[tiers.length - 1];
      var extra = rows.filter(function (r) { return r.supplement && /extra person/i.test(r.label); })[0];
      if (tier && tier.group.max === undefined) return null;
      if (tier) { total += tier.amount; lines.push([tier.label, tier.amount]); }
      else if (n > top.group.max && extra) {
        var more = n - top.group.max;
        total += top.amount + more * extra.amount;
        lines.push([top.label, top.amount]);
        lines.push([more + " × " + extra.label.toLowerCase(), more * extra.amount]);
      } else return null;
      (addons || []).forEach(function (label) {
        var r = rows.filter(function (x) { return x.supplement && x.label === label; })[0];
        if (r) { total += r.amount; lines.push([r.label, r.amount]); }
      });
      // « the whole boat » seulement pour un prix par bateau (pas le Partner chef « for 2 people »).
      return { total: total, lines: lines, unpriced: [], perBoat: /\bboat\b/i.test(tier ? tier.unit || "" : top.unit || "") };
    }
    // Ligne adulte : « Adult », « Per person », ou « Adult, from age 12 » (un âge minimum, pas de maximum).
    var adult = rows.filter(function (r) { return (!r.ages || r.ages.max === undefined) && !r.group && !r.supplement && typeof r.amount === "number" && /^(adult|per person)/i.test(r.label); })[0];
    if (adults > 0) {
      if (!adult) return null;
      total += adults * adult.amount;
      lines.push([adults + " × " + adult.label.toLowerCase(), adults * adult.amount]);
    }
    var byRow = [];
    var unpriced = [];
    // Âge le plus haut des tranches enfant : au-dessus, un ado paie le prix adulte (comme les frais de parc).
    var childMax = rows.reduce(function (m, x) { return x.ages && x.ages.max !== undefined && typeof x.amount === "number" ? Math.max(m, x.ages.max) : m; }, -1);
    var teens = 0;
    kids.forEach(function (age) {
      var r = rows.filter(function (x) { return x.ages && typeof x.amount === "number" && age >= (x.ages.min || 0) && age <= (x.ages.max === undefined ? Infinity : x.ages.max); })[0];
      if (!r && adult && childMax >= 0 && age > childMax) { teens++; return; }
      if (!r) { unpriced.push(age); return; }
      var hit = byRow.filter(function (b) { return b.r === r; })[0];
      if (hit) hit.n++; else byRow.push({ r: r, n: 1 });
    });
    if (teens) {
      total += teens * adult.amount;
      lines.push([teens + " × " + adult.label.toLowerCase() + " (" + (childMax + 1) + " and over)", teens * adult.amount]);
    }
    byRow.forEach(function (b) {
      total += b.n * b.r.amount;
      lines.push([b.n + " × " + b.r.label.toLowerCase(), b.n * b.r.amount]);
    });
    var people = adults + kids.length - unpriced.length;
    total += addonTotal(rows, addons, people, lines);
    return { total: total, lines: lines, unpriced: unpriced, perBoat: false };
  }

  // Suppléments cochés (plongée en plus, nounou) : par personne quand la ligne le dit, sinon une fois.
  function addonTotal(rows, addons, people, lines) {
    var sum = 0;
    (addons || []).forEach(function (label) {
      var r = rows.filter(function (x) { return x.label === label && typeof x.amount === "number"; })[0];
      if (!r) return;
      var each = /per person/i.test(r.unit || "");
      var n = each ? people : 1;
      sum += n * r.amount;
      lines.push([(each ? n + " × " : "") + r.label, n * r.amount]);
    });
    return sum;
  }

  // Devis d'une option pour un groupe, dans toutes les formes de prix des fiches :
  //   g.counts : { libellé de ligne : nombre } (karts, pilotes et passagers) ;
  //   g.row : une ligne choisie (cours, site, programme), au prix par personne pour tout le groupe ;
  //   sinon adultes et âge de chaque enfant (estimate).
  // Null quand la règle n'est pas écrite dans les données : la page et le message disent alors
  // « we confirm the total on WhatsApp ».
  function quote(option, g) {
    g = g || {};
    if (!option || option.priceOnRequest || !(option.prices || []).length) return null;
    var rows = option.prices;
    if (g.counts) {
      var lines = [], total = 0;
      rows.forEach(function (r) {
        var n = Number(g.counts[r.label]) || 0;
        if (n > 0 && typeof r.amount === "number") { total += n * r.amount; lines.push([n + " × " + r.label, n * r.amount]); }
      });
      return lines.length ? { total: total, lines: lines, unpriced: [], perBoat: false } : null;
    }
    var kids = (g.ages || []).filter(function (a) { return a !== "" && a !== null && a !== undefined; }).map(Number);
    if (g.row) {
      var row = rows.filter(function (r) { return r.label === g.row; })[0];
      if (!row || typeof row.amount !== "number") return null;
      // Ligne sans âge minimum (plongée « Fun dives ») : rien ne dit qu'un enfant y a droit, il reste à confirmer.
      var min = row.ages && row.ages.min ? row.ages.min : null;
      var young = min === null ? kids.slice() : kids.filter(function (a) { return a < min; });
      var n = (g.adults || 0) + kids.length - young.length;
      if (n < 1) return null;
      var out = [[n + " × " + row.label, n * row.amount]];
      var sum = n * row.amount + addonTotal(rows, g.addons, n, out);
      return { total: sum, lines: out, unpriced: young, perBoat: false };
    }
    return estimate(option, g.adults || 0, kids, g.addons || []);
  }

  // Frais de parc en espèces, comme parkCash() de booking.js : adultes et enfants au tarif des données.
  // kids : un nombre d'enfants, ou la liste de leurs âges. Avec une liste et fee.childAges (4 à 11), les plus
  // jeunes ne paient pas et les plus âgés paient le tarif adulte.
  function parkCash(fee, adults, kids) {
    if (!fee || !fee.adult) return null;
    if (Array.isArray(kids)) {
      var ages = kids.filter(function (a) { return a !== "" && a !== null && a !== undefined; }).map(Number), ca = fee.childAges;
      kids = ca ? ages.filter(function (a) { return a >= ca.min && a <= ca.max; }).length : ages.length;
      if (ca) adults += ages.filter(function (a) { return a > ca.max; }).length;
    }
    var parts = [];
    var total = 0;
    if (adults > 0) { parts.push(adults + " × " + fee.adult); total += adults * fee.adult; }
    if (kids > 0 && fee.child) { parts.push(kids + " × " + fee.child); total += kids * fee.child; }
    if (!parts.length) return null;
    return { total: total, text: parts.join(" + ") + " = " + thb(total) };
  }

  return { thb: thb, estimate: estimate, quote: quote, parkCash: parkCash, adultFrom: adultFrom };
});
