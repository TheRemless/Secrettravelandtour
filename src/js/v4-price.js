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
      // Bateau privé : les enfants comptent dans le groupe dès 4 ans, les moins de 4 ans ne comptent pas (client, 08.11.2026).
      var n = adults + kids.filter(function (a) { return a >= 4; }).length;
      var tier = tiers.filter(function (r) { return n >= r.group.min && n <= r.group.max; })[0];
      var top = tiers[tiers.length - 1];
      var extra = rows.filter(function (r) { return r.supplement && /extra person/i.test(r.label); })[0];
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
      return { total: total, lines: lines, unpriced: [], perBoat: true };
    }
    var adult = rows.filter(function (r) { return !r.ages && !r.group && !r.supplement && typeof r.amount === "number" && /^(adult|per person)/i.test(r.label); })[0];
    if (adults > 0) {
      if (!adult) return null;
      total += adults * adult.amount;
      lines.push([adults + " × " + adult.label.toLowerCase(), adults * adult.amount]);
    }
    var byRow = [];
    var unpriced = [];
    kids.forEach(function (age) {
      var r = rows.filter(function (x) { return x.ages && typeof x.amount === "number" && age >= (x.ages.min || 0) && age <= x.ages.max; })[0];
      if (!r) { unpriced.push(age); return; }
      var hit = byRow.filter(function (b) { return b.r === r; })[0];
      if (hit) hit.n++; else byRow.push({ r: r, n: 1 });
    });
    byRow.forEach(function (b) {
      total += b.n * b.r.amount;
      lines.push([b.n + " × " + b.r.label.toLowerCase(), b.n * b.r.amount]);
    });
    return { total: total, lines: lines, unpriced: unpriced, perBoat: false };
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

  return { thb: thb, estimate: estimate, parkCash: parkCash, adultFrom: adultFrom };
});
