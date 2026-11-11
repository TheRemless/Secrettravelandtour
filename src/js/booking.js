/* Feuille de réservation (refonte) : excursions de Secret Travel & Tour et trajets de VIP Taxi Lanta.
   Le visiteur choisit une option, une date, les passagers avec l'âge de chaque enfant, le lieu de prise en charge
   et son prénom ; il relit le message puis l'envoie lui-même sur WhatsApp. Rien ne part vers un serveur.
   Logique pure exportée en CommonJS pour les tests (node --test), interface branchée sur le <dialog> dans le navigateur.
   Repris de secret-form.js : dates à l'heure de Bangkok, brouillon gardé 7 jours, erreurs par champ. */
(function (root, factory) {
  // Total estimé : v4-price.js (chargé avant ce fichier sur les fiches ; absent des pages taxi, qui n'en ont pas besoin).
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./v4-price.js"));
  } else {
    var api = factory(root.STT_PRICE || null);
    root.STT_BOOKING = api;
    if (typeof document !== "undefined") api.mount(document);
  }
})(typeof self !== "undefined" ? self : this, function (PRICE) {
  "use strict";

  var DEFAULT_NUMBER = "66958683846";
  var DRAFT_VERSION = 1;
  var DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---------- Dates : toujours à l'heure de Koh Lanta, pas à celle du téléphone ----------
  // Heure de Bangkok « HH:MM », pour refuser une heure déjà passée aujourd'hui.
  function bangkokTime(now) {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    var get = function (type) { return parts.filter(function (p) { return p.type === type; })[0].value; };
    return get("hour") + ":" + get("minute");
  }

  function bangkokToday(now) {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(now);
    var get = function (type) {
      return parts.filter(function (p) { return p.type === type; })[0].value;
    };
    return get("year") + "-" + get("month") + "-" + get("day");
  }

  function toUTC(iso) {
    var p = iso.split("-").map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }

  function addDays(iso, n) {
    var d = toUTC(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function resolveDate(choice, other, today) {
    if (choice === "today") return today;
    if (choice === "tomorrow") return addDays(today, 1);
    if (choice === "other") return other || "";
    return "";
  }

  // Date absolue avec l'année : l'agence peut lire le message le lendemain sans se tromper de jour.
  function formatDate(iso) {
    var d = toUTC(iso);
    return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  }

  // Jour court sous Today et Tomorrow (« Tue 10 Nov ») : le calendrier, rien d'autre.
  function shortDay(iso) {
    var d = toUTC(iso);
    return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
  }

  function clean(value) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  }

  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }

  function listJoin(items) {
    if (items.length < 2) return items.join("");
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  function ageLabel(age) {
    return Number(age) === 0 ? "under 1" : String(age);
  }

  // « 2 adults, 1 child (age 7) » ; « 1 adult, 2 children (ages 4 and 9) »
  function guestsLine(adults, childAges) {
    var parts = [];
    if (adults > 0) parts.push(plural(adults, "adult", "adults"));
    var ages = (childAges || []).filter(function (a) { return a !== "" && a !== null && a !== undefined; });
    if (ages.length === 1) parts.push("1 child (age " + ageLabel(ages[0]) + ")");
    else if (ages.length > 1) parts.push(ages.length + " children (ages " + listJoin(ages.map(ageLabel)) + ")");
    return parts.join(", ");
  }

  function findOption(config, id) {
    var list = config.options || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Prix vu sur la page, recopié tel quel depuis les données, avec l'unité quand elle est écrite :
  // « Adult: 1,000 THB per person / Child, 4 to 11: 700 THB per person »
  function priceLine(option) {
    if (!option || !option.rows || !option.rows.length) return "";
    return option.rows.map(function (r) { return r.label + ": " + r.price + (r.unit && r.price !== "Free" && r.unit.toLowerCase() !== r.label.toLowerCase() ? " " + r.unit : ""); }).join(" / ");
  }

  // Location : le prix du véhicule choisi s'il est dans la liste, sinon la fourchette de la catégorie.
  function rentalPrice(cat, vehicle) {
    if (!cat || !cat.rows || !cat.rows.length) return "";
    var v = clean(vehicle).toLowerCase();
    var row = v ? cat.rows.filter(function (r) { return r.label.toLowerCase() === v; })[0] : null;
    if (row) return row.label + ": " + row.price + (row.unit ? " " + row.unit : "");
    var amounts = cat.rows.map(function (r) { return r.amount; }).filter(function (a) { return typeof a === "number"; });
    if (!amounts.length) return "";
    var lo = Math.min.apply(null, amounts), hi = Math.max.apply(null, amounts);
    var unit = cat.rows[0].unit ? " " + cat.rows[0].unit : "";
    return cat.title + ": " + (lo === hi ? thb(lo) : thb(lo).replace(" THB", "") + " to " + thb(hi)) + unit;
  }

  // Total estimé d'une location : prix par 24 h du modèle choisi × nombre de périodes de 24 h × véhicules.
  // Rien tant que le modèle n'est pas dans la liste ou que les dates manquent.
  function rentalTotal(cat, state) {
    if (!cat || !cat.rows || !state.dateFrom || !state.dateTo) return null;
    var v = clean(state.vehicle).toLowerCase();
    var row = v ? cat.rows.filter(function (r) { return r.label.toLowerCase() === v; })[0] : null;
    if (!row || typeof row.amount !== "number" || !/24 hours|per day/i.test(row.unit || "")) return null;
    var t = function (d, h) { return Date.parse(d + "T" + (/^\d{2}:\d{2}$/.test(clean(h)) ? clean(h) : "10:00") + ":00Z"); };
    var hours = (t(state.dateTo, state.timeTo) - t(state.dateFrom, state.timeFrom)) / 36e5;
    if (!(hours > 0)) return null;
    var days = Math.max(1, Math.ceil(hours / 24 - 1e-9));
    var n = state.vehicles > 0 ? state.vehicles : 1;
    return { total: row.amount * days * n, days: days, n: n };
  }

  // ---------- Sous-variantes d'une option (créneau, cours, karts, pilotes…) ----------
  // option.choices : [{ id, label, type: "one" | "text", required, values: [{ id, label, days?, row? }] }]
  //   une valeur avec `row` désigne une ligne de prix (cours de plongée, site) : le prix du message n'en garde que celle-là ;
  //   `days` (0 = dimanche) : la date doit tomber l'un de ces jours (cours de cuisine).
  // option.counts : { label, rows: [libellés de lignes de prix] } : un nombre par ligne (karts, pilotes et passagers).
  // option.extras : [libellés de lignes de prix] : suppléments à cocher (state.addons).
  // L'état garde chaque choix sous « option/choix » et chaque nombre sous « option/ligne ».
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function choiceKey(option, choice) { return "c-" + option.id + "-" + choice.id; }
  function choiceValue(state, option, choice) {
    var v = ((state.choices || {})[option.id + "/" + choice.id]);
    if (choice.type === "text") return clean(v);
    for (var i = 0; i < (choice.values || []).length; i++) if (choice.values[i].id === v) return choice.values[i];
    return null;
  }
  function countsOf(state, option) {
    if (!option || !option.counts) return [];
    return option.counts.rows.map(function (label, i) {
      return { label: label, n: Number((state.counts || {})[option.id + "/" + i]) || 0 };
    }).filter(function (c) { return c.n > 0; });
  }

  // Total estimé (v4-price.js), dans la même forme que la page : lignes de prix brutes de l'option, groupe de la feuille.
  // Null quand la règle n'est pas dans les données (radeau au-delà de 2 personnes, âge sans tarif, prix sur demande).
  function quoteOf(option, state) {
    if (!PRICE || !option || !option.prices || !option.prices.length) return null;
    if (option.counts) {
      var c = {};
      countsOf(state, option).forEach(function (x) { c[x.label] = x.n; });
      return PRICE.quote(option, { counts: c });
    }
    var row = "";
    (option.choices || []).forEach(function (ch) { var v = choiceValue(state, option, ch); if (v && v.row) row = v.row; });
    var picks = (option.choices || []).some(function (ch) { return (ch.values || []).some(function (v) { return v.row; }); });
    if (picks && !row) return null;
    var q = PRICE.quote(option, { adults: state.adults, ages: state.childAges, addons: addonsOf(option, state.addons), row: row });
    return q && !q.unpriced.length ? q : null;
  }
  // Le prix dépend d'un choix pas encore fait (karts à zéro, cours ou site non choisi) : rien à annoncer encore.
  function pendingPrice(option, state) {
    if (!option) return false;
    if (option.counts) return !countsOf(state, option).length;
    var picks = (option.choices || []).filter(function (ch) { return (ch.values || []).some(function (v) { return v.row; }); });
    return picks.some(function (ch) { return !choiceValue(state, option, ch); });
  }
  // Ce que l'agence lit pour répondre : le total estimé quand les données le permettent, sinon le prix de la page.
  function priceSummary(option, state) {
    var q = option && PRICE && Array.isArray(option.prices) ? quoteOf(option, state) : null;
    if (q) return "Estimated total: " + thb(q.total);
    // Bateau privé : une ligne « 7 people or more : On request » et un groupe de cette taille, le prix est à donner sur WhatsApp.
    var onReq = option && (option.rows || []).filter(function (r) { return r.price === "On request" && /^\d+ people or more$/i.test(r.label); })[0];
    if (onReq) {
      var size = (state.adults || 0) + (state.childAges || []).filter(function (a) { return a !== "" && a !== null && a !== undefined && Number(a) >= 4; }).length;
      if (size >= parseInt(onReq.label, 10)) return "Price: on request, group of " + size + " people";
    }
    var price = priceLine(pricedOption(option, state));
    return price ? "Price: " + price : "";
  }

  function choiceLines(option, state) {
    var out = [];
    if (!option) return out;
    (option.choices || []).forEach(function (c) {
      var v = choiceValue(state, option, c);
      if (v) out.push(c.label + ": " + (c.type === "text" ? v : v.label));
    });
    var counts = countsOf(state, option);
    if (counts.length) out.push(option.counts.label + ": " + counts.map(function (c) { return c.n + " × " + c.label; }).join(", "));
    return out;
  }
  // Lignes de prix du message : celle de la valeur choisie quand le choix désigne une ligne, sinon toutes.
  function pricedOption(option, state) {
    if (!option) return option;
    var keep = null;
    (option.choices || []).forEach(function (c) {
      var v = choiceValue(state, option, c);
      if (v && v.row) keep = v.row;
    });
    if (option.counts) {
      var used = countsOf(state, option).map(function (c) { return c.label; });
      if (used.length) return { rows: (option.rows || []).filter(function (r) { return used.indexOf(r.label) > -1; }) };
    }
    var extras = state.addons || [];
    if (!keep) return { rows: (option.rows || []).filter(function (r) { return !tickable(option, r) || extras.indexOf(r.label) > -1; }) };
    return { rows: (option.rows || []).filter(function (r) { return r.label === keep || extras.indexOf(r.label) > -1; }) };
  }
  // Supplément à cocher sur la page (Koh Kradan, extras d'une option) : même règle que v4-product.js (ticks).
  function tickable(option, row) {
    if (row.tick) return true;
    if ((option.extras || []).some(function (x) { return (x.label || x) === row.label; })) return true;
    return (option.prices || []).some(function (p) { return p.label === row.label && p.supplement && /^Add /.test(p.label); });
  }
  function validateChoices(option, state, date, errors) {
    if (!option) return;
    (option.choices || []).forEach(function (c) {
      var v = choiceValue(state, option, c);
      var key = choiceKey(option, c);
      if (!v) { if (c.required !== false) errors[key] = c.error || (c.type === "text" ? "Tell us your " + c.label.toLowerCase() + "." : "Choose the " + c.label.toLowerCase() + "."); return; }
      if (v.days && v.days.length && date) {
        var wd = toUTC(date).getUTCDay();
        if (v.days.indexOf(wd) < 0) errors[key] = v.label.split(",")[0] + " runs on " + listJoin(v.days.map(function (d) { return DAY_NAMES[d]; })) + ". Pick one of those days or another " + c.label.toLowerCase() + ".";
      }
    });
    if (option.counts && !countsOf(state, option).length) errors["n-" + option.id] = option.counts.error || "Choose how many " + option.counts.label.toLowerCase() + ".";
  }

  // Speedboat : un trajet (« Koh Lanta to Koh Phi Phi ») et l'un de ses départs, lus dans la grille.
  function findRoute(config, id) {
    var list = config.routes || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function findDeparture(route, id) {
    var list = (route && route.deps) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function routeLabel(config, state) {
    if (config.from && config.to) {
      return state.direction === "back" ? config.to + " to " + config.from : config.from + " to " + config.to;
    }
    return clean(state.from) + " to " + clean(state.to);
  }

  // La première ligne dit tout de suite ce qui est demandé : l'agence trie ses messages sur elle.
  function buildMessage(config, state) {
    var lines = [];
    var date = resolveDate(state.dateChoice, state.dateOther, state.today);

    if (config.variant === "taxi") {
      var vehicle = findOption(config, state.option);
      lines.push("Transfer request: " + routeLabel(config, state) + (vehicle ? " – " + vehicle.title : config.vehicle ? " (" + config.vehicle + ")" : ""));
      if (date) lines.push("Date: " + formatDate(date));
      if (clean(state.time)) lines.push("Pickup time: " + clean(state.time));
      if (clean(state.flight)) lines.push("Flight or ferry: " + clean(state.flight));
      lines.push("Guests: " + guestsLine(state.adults, state.childAges));
      if (state.childSeats > 0 && (state.childAges || []).length) lines.push("Child seats: " + state.childSeats);
      if (state.bags > 0) lines.push("Bags: " + state.bags);
      // Les deux bouts du trajet : où le chauffeur prend le client, où il le dépose (taxi v1, 10.11.2026).
      if (clean(state.pickupAt)) lines.push("Pickup: " + clean(state.pickupAt));
      if (clean(state.dropoffAt)) lines.push("Drop-off: " + clean(state.dropoffAt));
      // Prix d'appel affiché sur la page du trajet (grille VIP Taxi Lanta), rappelé à la fin.
      // Prix par véhicule : la ligne n'est juste que pour un seul véhicule (8 places au plus, Jérémy 10.11.2026).
      if (config.priceNote && state.adults + (state.childAges || []).length <= 8) lines.push("Price on the site: " + config.priceNote);
    } else if (config.variant === "rental") {
      var cat = findOption(config, state.option);
      lines.push("Rental request: " + (cat ? cat.title : config.product));
      if (clean(state.vehicle)) lines.push("Vehicle: " + clean(state.vehicle));
      if (state.vehicles > 0) lines.push("Vehicles: " + state.vehicles);
      if (state.dateFrom) lines.push("From: " + formatDate(state.dateFrom) + (clean(state.timeFrom) ? ", " + clean(state.timeFrom) : ""));
      if (state.dateTo) lines.push("To: " + formatDate(state.dateTo) + (clean(state.timeTo) ? ", " + clean(state.timeTo) : ""));
    } else if (config.variant === "speedboat") {
      var route = findRoute(config, state.route);
      var dep = findDeparture(route, state.departure);
      lines.push("Speedboat request: " + (route ? route.label : config.product));
      if (dep) lines.push("Departure: " + dep.time + (dep.arrives ? ", arrives " + dep.arrives : ""));
      if (date) lines.push("Date: " + formatDate(date));
      // Bateau saisonnier : la saison part avec la demande, pour qu'on la vérifie avant de confirmer.
      if (dep && dep.season) lines.push("Season: " + String(dep.season).replace(/\u00a0/g, " "));
      if (state.tripType === "one-way") lines.push("Ticket: one way");
      if (state.tripType === "return") {
        var back = findRoute(config, route && route.back);
        var bdep = findDeparture(back, state.returnDeparture);
        var bdate = state.returnDate ? formatDate(state.returnDate) : "";
        lines.push("Ticket: return" + (back ? ", " + back.label : ""));
        lines.push("Return: " + [bdate, bdep ? bdep.time + (bdep.arrives ? ", arrives " + bdep.arrives : "") : clean(state.returnTime)].filter(Boolean).join(", "));
        if (bdep && bdep.season) lines.push("Return season: " + String(bdep.season).replace(/\u00a0/g, " "));
      }
      lines.push("Guests: " + guestsLine(state.adults, state.childAges));
      if (clean(state.pickup)) lines.push("Hotel on Koh Lanta: " + clean(state.pickup));
    } else {
      var option = findOption(config, state.option);
      lines.push("Booking request: " + config.product + (option ? " – " + option.title : ""));
      if (option && option.departure) lines.push("Departure: from " + option.departure + ", pickup at your hotel in " + option.departure);
      choiceLines(option, state).forEach(function (l) { lines.push(l); });
      if (date) lines.push("Date: " + formatDate(date));
      // Les compteurs de l'option (pilotes, karts) disent déjà qui vient : pas de seconde ligne « Guests ».
      if (!(option && option.counts)) lines.push("Guests: " + guestsLine(state.adults, state.childAges));
      var extras = addonsOf(option, state.addons);
      if (extras.length) lines.push("Extras: " + extras.join(", "));
      if (clean(state.pickup)) lines.push("Pickup: " + clean(state.pickup));
    }

    if (clean(state.name)) lines.push("Name: " + clean(state.name));
    // Ni référence ni page (Jérémy, 10.11.2026) : qui demande, quoi, quand, et le prix.
    if (config.variant === "tour") {
      var sum = priceSummary(findOption(config, state.option), state);
      if (sum) lines.push(sum);
    }
    if (config.variant === "rental") {
      var rcat = findOption(config, state.option);
      var rp = rentalPrice(rcat, state.vehicle);
      if (rp) lines.push("Price: " + rp);
      var rt = rentalTotal(rcat, state);
      if (rt) lines.push("Estimated total: " + thb(rt.total) + " (" + rt.days + (rt.days > 1 ? " days" : " day") + (rt.n > 1 ? ", " + rt.n + " vehicles" : "") + ")");
    }
    return lines.join("\n");
  }

  // Suppléments choisis sur la page (Koh Kradan sur le longtail privé) : seulement ceux que l'option propose,
  // pour qu'un changement d'option dans la feuille ne laisse pas un supplément d'une autre option.
  function addonsOf(option, addons) {
    if (!option || !addons || !addons.length) return [];
    var labels = (option.rows || []).map(function (r) { return r.label; });
    return addons.filter(function (a) { return labels.indexOf(a) > -1; });
  }

  // Liste de sorties (design v4) : un seul message pour plusieurs sorties, classées par jour, le total de chaque sortie
  // et celui de la liste. catalog : { slug: { name, options: [{id, title, rows}] } } ;
  // list : { items: [{slug, option, date, addons}], adults, childAges, pickup, name }.
  function buildTripList(catalog, list) {
    var items = (list.items || []).filter(function (it) { return catalog[it.slug]; }).slice();
    items.sort(function (a, b) { return (a.date || "9999") < (b.date || "9999") ? -1 : (a.date || "9999") > (b.date || "9999") ? 1 : 0; });
    var lines = [];
    lines.push("Trip list: " + plural(items.length, "trip", "trips"));
    lines.push("Guests: " + guestsLine(list.adults, list.childAges));
    if (clean(list.pickup)) lines.push("Pickup: " + clean(list.pickup));
    if (clean(list.name)) lines.push("Name: " + clean(list.name));
    var day = null, grand = 0, priced = true;
    items.forEach(function (it) {
      var p = catalog[it.slug];
      // Une sortie à une seule option la prend d'office ; à plusieurs, l'envoi attend le choix (validateTripList).
      var option = findOption(p, it.option) || ((p.options || []).length === 1 ? p.options[0] : null);
      if (it.date !== day) {
        day = it.date;
        lines.push("");
        lines.push(day ? formatDate(day) : "Date to choose");
      } else lines.push(""); // deux sorties le même jour : une ligne vide entre elles
      lines.push(p.name + (option ? " – " + option.title : (p.options || []).length > 1 ? " – option to choose" : ""));
      choiceLines(option, it).forEach(function (l) { lines.push(l); });
      var extras = addonsOf(option, it.addons);
      if (extras.length) lines.push("Extras: " + extras.join(", "));
      // Total estimé de la sortie, calculé comme dans la feuille (groupe de la liste, sous-choix et suppléments) ; sinon son prix.
      var st = tripState(list, it), q = option && PRICE && Array.isArray(option.prices) ? quoteOf(option, st) : null;
      var sum = option ? priceSummary(option, st) : "";
      if (sum) lines.push(sum);
      if (q) grand += q.total; else priced = false;
    });
    // Total de toutes les sorties, seulement quand chacune a le sien.
    if (items.length > 1 && priced) { lines.push(""); lines.push("Estimated total, all trips: " + thb(grand)); }
    return lines.join("\n");
  }

  // État d'une sortie de la liste, dans la forme de la feuille : le groupe est celui de la liste.
  function tripState(list, it) {
    return { adults: list.adults, childAges: list.childAges || [], addons: it.addons || [], choices: it.choices || {}, counts: it.counts || {}, option: it.option };
  }

  // Liste de sorties : rien ne part tant qu'une sortie n'a pas sa date, et son option quand la fiche en a
  // plusieurs. Renvoie { items: { id: { option?, date? } }, ages: { i: texte }, pickup?, name? } ; vide si tout va.
  function validateTripList(catalog, list, today) {
    var out = { items: {}, ages: {} };
    var n = 0;
    (list.items || []).forEach(function (it) {
      var p = catalog[it.slug];
      if (!p) return;
      var e = {};
      if ((p.options || []).length > 1 && !findOption(p, it.option)) e.option = "Choose an option for " + p.name + ".";
      if (!it.date) e.date = "Pick a date for " + p.name + ".";
      else if (today && it.date < today) e.date = "That date has passed.";
      var option = findOption(p, it.option) || ((p.options || []).length === 1 ? p.options[0] : null);
      var sub = {};
      validateChoices(option, { choices: it.choices || {}, counts: it.counts || {} }, it.date, sub);
      // Message de deux phrases (jour d'un cours) : le nom de la sortie en tête, sinon la parenthèse suit la seconde phrase.
      Object.keys(sub).forEach(function (k) { e[k] = /\. \S/.test(sub[k]) ? p.name + ": " + sub[k] : sub[k].replace(/\.$/, "") + " (" + p.name + ")."; });
      if (Object.keys(e).length) { out.items[it.id] = e; n += Object.keys(e).length; }
    });
    (list.childAges || []).forEach(function (a, i) {
      if (a === "" || a === null || a === undefined) { out.ages[i] = "Choose the age of child " + (i + 1) + "."; n++; }
    });
    if (!clean(list.pickup)) { out.pickup = "Add your hotel so we know where to pick you up."; n++; }
    if (!clean(list.name)) { out.name = "Add your first name."; n++; }
    out.count = n;
    return out;
  }

  // Deux sorties d'une journée entière le même jour : signalé dans la liste.
  function sameDayClashes(catalog, items) {
    var byDate = {};
    (items || []).forEach(function (it) {
      var p = catalog[it.slug];
      if (!p || !p.fullDay || !it.date) return;
      (byDate[it.date] = byDate[it.date] || []).push(p.name);
    });
    return Object.keys(byDate).sort().filter(function (d) { return byDate[d].length > 1; }).map(function (d) { return { date: d, names: byDate[d] }; });
  }

  function thb(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " THB";
  }

  // Cash à prévoir pour le parc national : adultes et enfants au tarif des données, rien d'autre.
  // « 2 × 200 + 1 × 100 = 500 THB ». Null si le produit n'a pas de frais de parc.
  function parkCash(config, state) {
    var opt = findOption(config, state.option);
    // Frais propres à l'option quand la fiche les donne (parc, village) ; sinon ceux de la fiche.
    var fee = opt && "cash" in opt ? opt.cash : config.parkFee;
    if (!fee || !fee.adult) return null;
    // Catamaran d'Ao Nang : la brochure ne dit rien du parc, aucun montant à prévoir n'est annoncé.
    if (opt && opt.feesToConfirm) return null;
    if (opt && opt.counts) return null;
    // Tarif enfant pour les âges de fee.childAges (4 à 11) : plus jeune, gratuit ; plus âgé, tarif adulte.
    var ages = state.childAges || [], ca = fee.childAges, kids = ages.length, adults = state.adults;
    if (ca) {
      kids = ages.filter(function (a) { return Number(a) >= ca.min && Number(a) <= ca.max; }).length;
      adults += ages.filter(function (a) { return Number(a) > ca.max; }).length;
    }
    var parts = [];
    var total = 0;
    if (adults > 0) { parts.push(adults + " × " + fee.adult); total += adults * fee.adult; }
    if (kids > 0 && fee.child) { parts.push(kids + " × " + fee.child); total += kids * fee.child; }
    if (!parts.length) return null;
    var out = { total: total, text: parts.join(" + ") + " = " + thb(total) };
    if (fee.label) out.label = fee.label;
    return out;
  }

  function waUrl(message, number) {
    return "https://wa.me/" + (number || DEFAULT_NUMBER) + "?text=" + encodeURIComponent(message);
  }

  // Messages d'erreur : 03-audit-contenu §6.5.
  function validate(config, state) {
    var errors = {};
    if ((config.options || []).length && !findOption(config, state.option)) errors.option = "Choose an option.";

    if (config.variant === "rental") {
      if (!state.dateFrom || !state.dateTo) errors.dates = "Pick the start date and the return date.";
      else if (state.dateFrom < state.today) errors.dates = "The first day has passed.";
      else if (state.dateTo < state.dateFrom) errors.dates = "The last day is before the first day.";
      else if (!clean(state.timeFrom) || !clean(state.timeTo)) errors.dates = "Add the time you take the vehicle and the time you bring it back.";
      else if (state.dateTo === state.dateFrom && clean(state.timeTo) <= clean(state.timeFrom)) errors.dates = "The return time is before the start time.";
      if (!(state.vehicles > 0)) errors.vehicles = "Add at least one vehicle.";
      if (!clean(state.name)) errors.name = "Add your first name.";
      return errors;
    }

    if (config.variant === "speedboat") {
      var route = findRoute(config, state.route);
      if (!route) errors.route = "Choose where you are going.";
      else if (!findDeparture(route, state.departure)) errors.departure = "Choose a departure time.";
      if (state.tripType !== "one-way" && state.tripType !== "return") errors.tripType = "Choose one way or return.";
      else if (state.tripType === "return") {
        var back = route && findRoute(config, route.back);
        var go = resolveDate(state.dateChoice, state.dateOther, state.today);
        if (!state.returnDate) errors.returnTrip = "Pick the date of the return.";
        else if (go && state.returnDate < go) errors.returnTrip = "The return is before the outward trip.";
        else if (back && back.deps.length && !findDeparture(back, state.returnDeparture)) errors.returnTrip = "Choose the time of the return boat.";
        else if (!back && !clean(state.returnTime)) errors.returnTrip = "Tell us when you want to come back.";
      }
    }

    var date = resolveDate(state.dateChoice, state.dateOther, state.today);
    if (!date) errors.date = "Pick a date.";
    else if (date < state.today) errors.date = "That date has passed.";

    if (config.variant === "tour") validateChoices(findOption(config, state.option), state, date, errors);

    var counted = config.variant === "tour" ? findOption(config, state.option) : null;
    if (!(counted && counted.counts)) {
      if (!(state.adults > 0)) errors.adults = "Add at least one adult.";
      (state.childAges || []).forEach(function (age, i) {
        if (age === "" || age === null || age === undefined) errors["child-" + i] = "Choose the age of child " + (i + 1) + ".";
      });
    }

    if (config.variant === "taxi") {
      if (!(config.from && config.to)) {
        if (!clean(state.from)) errors.from = "Tell us where we pick you up.";
        if (!clean(state.to)) errors.to = "Tell us where you're going.";
      }
      if (!clean(state.time)) errors.time = "Choose a pickup time.";
      else if (state.nowTime && date === state.today && clean(state.time) <= state.nowTime) errors.time = "That time has passed. Choose a later time.";
      // Les deux adresses font le prix : sans elles, la demande repart en question.
      if (!clean(state.pickupAt)) errors.pickupAt = "Add the pickup address.";
      if (!clean(state.dropoffAt)) errors.dropoffAt = "Add the drop-off address.";
    } else if (config.variant === "speedboat") {
      if (!clean(state.pickup)) errors.pickup = "Add your hotel on Koh Lanta.";
    } else if (config.pickupRequired !== false && !clean(state.pickup)) {
      errors.pickup = "Add your hotel so we know where to pick you up.";
    }

    if (!clean(state.name)) errors.name = "Add your first name.";
    return errors;
  }

  function makeDraft(state, now) {
    var copy = {};
    Object.keys(state).forEach(function (k) { if (k !== "today" && k !== "nowTime") copy[k] = state[k]; });
    return JSON.stringify({ v: DRAFT_VERSION, savedAt: now.getTime(), day: bangkokToday(now), state: copy });
  }

  // Un brouillon de plus de 7 jours est oublié ; « Today » ou « Tomorrow » d'un autre jour, ou une date passée, sont effacés.
  function restoreDraft(raw, now) {
    if (!raw) return null;
    var draft;
    try { draft = JSON.parse(raw); } catch (e) { return null; }
    if (!draft || draft.v !== DRAFT_VERSION || !draft.state || typeof draft.savedAt !== "number") return null;
    if (now.getTime() - draft.savedAt > DRAFT_MAX_AGE) return null;
    var state = draft.state;
    var today = bangkokToday(now);
    var relative = state.dateChoice === "today" || state.dateChoice === "tomorrow";
    var stale = relative ? draft.day !== today : state.dateChoice === "other" && (state.dateOther || "") < today;
    if (stale) { state.dateChoice = ""; state.dateOther = ""; }
    if (state.dateFrom && state.dateFrom < today) { state.dateFrom = ""; state.dateTo = ""; }
    return state;
  }

  function emptyState(config) {
    return {
      option: "", dateChoice: "", dateOther: "", adults: 2, childAges: [], pickup: "", name: "",
      vehicle: "", dateFrom: "", dateTo: "",
      direction: "out", from: "", to: "", time: "", flight: "", bags: 0, childSeats: 0, address: "", pickupAt: "", dropoffAt: "", addons: [],
      route: "", departure: "", tripType: "", returnDate: "", returnDeparture: "", returnTime: "",
      choices: {}, counts: {}, timeFrom: "", timeTo: "", vehicles: 1
    };
  }

  // ---------- Interface ----------
  function mount(doc) {
    if (!doc.querySelector || typeof HTMLDialogElement === "undefined") return;
    var start = function () {
      var dialog = doc.getElementById("book");
      var dataEl = doc.getElementById("book-data");
      if (!dialog || !dataEl) return;
      var config;
      try { config = JSON.parse(dataEl.textContent); } catch (e) { return; }
      controller(doc, dialog, config);
    };
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
    else start();
  }

  function controller(doc, dialog, config) {
    var form = dialog.querySelector("form");
    var screens = {
      form: dialog.querySelector('[data-screen="form"]'),
      preview: dialog.querySelector('[data-screen="preview"]'),
      done: dialog.querySelector('[data-screen="done"]')
    };
    var storageKey = "stt-book:" + (config.productId || config.product);
    var state = emptyState(config);
    var message = "";
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function field(name) { return form.elements.namedItem(name); }
    function today() { return bangkokToday(new Date()); }

    function save() {
      try { localStorage.setItem(storageKey, makeDraft(state, new Date())); } catch (e) { /* stockage indisponible */ }
      // La page (calculateur, bande du bas) suit la feuille : même état, des deux côtés.
      emit("stt-book-change", { productId: config.productId, state: state });
    }

    function emit(name, detail) {
      if (typeof CustomEvent === "function") doc.dispatchEvent(new CustomEvent(name, { detail: JSON.parse(JSON.stringify(detail)) }));
    }

    function load() {
      var saved = null;
      try { saved = restoreDraft(localStorage.getItem(storageKey), new Date()); } catch (e) { saved = null; }
      if (saved) Object.keys(saved).forEach(function (k) { if (k in state) state[k] = saved[k]; });
    }

    // Les champs d'âge suivent le nombre d'enfants.
    function renderChildAges() {
      var box = form.querySelector("[data-child-ages]");
      var tpl = doc.getElementById("book-age-tpl");
      if (!box || !tpl) return;
      var count = state.childAges.length;
      while (box.children.length > count) box.removeChild(box.lastElementChild);
      while (box.children.length < count) {
        var i = box.children.length;
        var node = tpl.content.firstElementChild.cloneNode(true);
        var select = node.querySelector("select");
        var label = node.querySelector("label");
        var err = node.querySelector(".err");
        select.id = "book-child-" + i;
        select.name = "child-" + i;
        select.setAttribute("aria-describedby", "book-e-child-" + i);
        label.htmlFor = select.id;
        label.textContent = "Age of child " + (i + 1);
        err.id = "book-e-child-" + i;
        box.appendChild(node);
      }
      state.childAges.forEach(function (age, i) {
        var s = box.querySelector('[name="child-' + i + '"]');
        if (s) s.value = age === null || age === undefined ? "" : String(age);
      });
      var seats = form.querySelector("[data-child-seats]");
      if (seats) seats.hidden = count === 0;
    }

    function fillForm() {
      ["dateOther", "pickup", "name", "time", "flight", "address", "pickupAt", "dropoffAt", "from", "to", "vehicle", "dateFrom", "dateTo", "timeFrom", "timeTo", "returnDate", "returnTime"].forEach(function (k) {
        var el = field(k);
        if (el && typeof el.value === "string") el.value = state[k] || "";
      });
      ["adults", "children", "bags", "childSeats", "vehicles"].forEach(function (k) {
        var el = field(k);
        if (!el) return;
        el.value = k === "children" ? state.childAges.length : state[k];
      });
      setRadio("option", state.option);
      if (field("route")) field("route").value = state.route || "";
      showDepartures();
      setRadio("departure", state.departure);
      setRadio("tripType", state.tripType);
      showReturn();
      setRadio("returnDeparture", state.returnDeparture);
      fillChoices();
      setRadio("dateChoice", state.dateChoice);
      setRadio("direction", state.direction);
      var other = form.querySelector("[data-date-other]");
      if (other) other.hidden = state.dateChoice !== "other";
      var min = today();
      Array.prototype.forEach.call(form.querySelectorAll('input[name="dateChoice"]'), function (r) {
        var d = r.parentNode.querySelector("[data-day]");
        if (d) d.textContent = r.value === "today" ? shortDay(min) : r.value === "tomorrow" ? shortDay(addDays(min, 1)) : "";
      });
      if (field("dateOther")) field("dateOther").min = min;
      if (field("dateFrom")) field("dateFrom").min = min;
      if (field("dateTo")) field("dateTo").min = state.dateFrom || min;
      updateAddressLabel();
      renderChildAges();
      optionUI();
    }

    // L'option choisie sur la page : résumée en une ligne avec « Change » ; la liste revient sur demande.
    // Ses compteurs (pilotes, karts) remplacent « Guests » ; un départ d'Ao Nang demande l'hôtel à Ao Nang ;
    // le conseil d'âge de l'option (catamaran) s'affiche dès qu'un enfant est trop jeune ; le total estimé suit.
    var sumMode = false, sbSum = false;
    // Speedboat ouvert depuis un bateau de la grille : trajet et départ résumés en une ligne, « Change » les rouvre.
    function sbUI() {
      var sum = form.querySelector("[data-sb-sum]"), pick = form.querySelector("[data-sb-pick]");
      if (!sum || !pick) return;
      var route = findRoute(config, state.route), dep = findDeparture(route, state.departure);
      var on = sbSum && Boolean(dep);
      sum.hidden = !on;
      pick.hidden = on;
      if (dep) {
        sum.querySelector("[data-sb-sum-t]").textContent = route.label;
        sum.querySelector("[data-sb-sum-p]").textContent = dep.time + (dep.arrives ? ", arrives " + dep.arrives : "") + (dep.detail ? ". " + dep.detail : "");
      }
    }
    function optionUI() {
      sbUI();
      var opt = findOption(config, state.option);
      var sum = form.querySelector("[data-opt-sum]"), list = form.querySelector("[data-opt-list]");
      if (sum && list) {
        var on = sumMode && Boolean(opt);
        sum.hidden = !on;
        list.hidden = on;
        if (opt) {
          sum.querySelector("[data-opt-sum-t]").textContent = opt.title;
          var v = config.variant === "rental" ? clean(state.vehicle).toLowerCase() : "";
          var row = v ? (opt.rows || []).filter(function (r) { return r.label.toLowerCase() === v; })[0] : null;
          sum.querySelector("[data-opt-sum-p]").textContent = row ? row.price + (row.unit ? " " + row.unit : "")
            : opt.from ? opt.from + (opt.unit ? " " + opt.unit : "") : "Price on WhatsApp";
        }
      }
      var guests = form.querySelector("[data-guests]");
      if (guests) guests.hidden = Boolean(opt && opt.counts);
      var pl = form.querySelector('label[for="book-pickup"]'), ph = form.querySelector("#book-h-pickup");
      if (pl && ph && pl.hasAttribute("data-label")) {
        var away = opt && opt.departure;
        pl.textContent = away ? "Hotel in " + opt.departure : pl.getAttribute("data-label");
        ph.textContent = away ? "We pick you up at your hotel in " + opt.departure + "." : ph.getAttribute("data-hint");
      }
      var adv = form.querySelector("[data-advice]");
      if (adv) {
        var young = opt && opt.advice && (state.childAges || []).some(function (a) { return a !== "" && a !== null && Number(a) < opt.advice.under; });
        adv.hidden = !young;
        adv.textContent = young ? opt.advice.text : "";
      }
      var tot = dialog.querySelector("[data-total]");
      if (tot) {
        var q = opt ? quoteOf(opt, state) : null, cash = opt ? parkCash(config, state) : null;
        tot.hidden = !opt || pendingPrice(opt, state);
        tot.innerHTML = "";
        if (opt) {
          var b = doc.createElement("b"), sm = doc.createElement("span");
          b.textContent = q ? "Estimated total " + thb(q.total) : "Total confirmed on WhatsApp";
          tot.appendChild(b);
          if (cash) { sm.textContent = "Plus " + thb(cash.total) + " " + (cash.label || "fees").toLowerCase() + ", in cash on the day"; tot.appendChild(sm); }
        }
      }
    }

    // Speedboat : seuls les départs du trajet choisi restent visibles ; un trajet à un seul départ le prend d'office.
    function showDepartures() {
      var box = form.querySelector("[data-deps]");
      if (!box) return;
      var route = findRoute(config, state.route);
      var shown = 0;
      Array.prototype.forEach.call(box.querySelectorAll("[data-dep-route]"), function (l) {
        var on = l.getAttribute("data-dep-route") === state.route;
        l.hidden = !on;
        if (on) shown++;
      });
      box.hidden = !route;
      if (route && !findDeparture(route, state.departure)) state.departure = route.deps.length === 1 ? route.deps[0].id : "";
      var none = form.querySelector("[data-deps-none]");
      if (none) none.hidden = shown > 0 || !route;
    }

    // Sous-variantes : seul le bloc de l'option choisie est visible ; chaque champ relit l'état.
    function fillChoices() {
      Array.prototype.forEach.call(form.querySelectorAll("[data-opt-block]"), function (b) {
        b.hidden = b.getAttribute("data-opt-block") !== state.option;
      });
      Array.prototype.forEach.call(form.querySelectorAll("[data-opt]"), function (el) {
        var opt = el.getAttribute("data-opt");
        if (/^c-/.test(el.name)) {
          var v = state.choices[opt + "/" + el.getAttribute("data-choice")] || "";
          if (el.type === "radio") el.checked = el.value === v; else el.value = v;
        } else if (/^n-/.test(el.name)) el.value = state.counts[opt + "/" + el.getAttribute("data-row")] || 0;
        else if (/^x-/.test(el.name)) el.checked = (state.addons || []).indexOf(el.value) > -1;
      });
    }

    // Speedboat, aller-retour : date et bateau du retour, pris dans la grille du trajet inverse quand elle existe.
    function showReturn() {
      var box = form.querySelector("[data-return]");
      if (!box) return;
      box.hidden = state.tripType !== "return";
      var route = findRoute(config, state.route);
      var back = route && findRoute(config, route.back);
      var shown = 0;
      Array.prototype.forEach.call(box.querySelectorAll("[data-ret-route]"), function (l) {
        var on = Boolean(back) && l.getAttribute("data-ret-route") === back.id;
        l.hidden = !on;
        if (on) shown++;
      });
      var deps = box.querySelector("[data-ret-deps]"), depsH = box.querySelector("[data-ret-deps-h]");
      if (deps) deps.hidden = !shown;
      if (depsH) depsH.hidden = !shown;
      var free = box.querySelector("[data-ret-free]");
      if (free) free.hidden = Boolean(shown);
      if (back && !findDeparture(back, state.returnDeparture)) state.returnDeparture = "";
      var lbl = box.querySelector("[data-ret-label]");
      if (lbl) lbl.textContent = back ? back.label : "The way back";
      if (field("returnDate")) field("returnDate").min = resolveDate(state.dateChoice, state.dateOther, today()) || today();
    }

    function setRadio(name, value) {
      var list = form.querySelectorAll('input[type="radio"][name="' + name + '"]');
      Array.prototype.forEach.call(list, function (r) { r.checked = r.value === value; });
    }

    var lastDirection = "out";
    function swapEnds() {
      if (state.direction === lastDirection) return;
      lastDirection = state.direction;
      var p = state.pickupAt; state.pickupAt = state.dropoffAt; state.dropoffAt = p;
      if (field("pickupAt")) field("pickupAt").value = state.pickupAt || "";
      if (field("dropoffAt")) field("dropoffAt").value = state.dropoffAt || "";
    }

    // Taxi sur une page trajet : le bout qui est un lieu précis (aéroport, jetée) est déjà rempli, dans le bon sens.
    function presetEnds() {
      var ends = config.ends;
      if (config.variant !== "taxi" || !ends) return;
      var back = state.direction === "back";
      if (!clean(state.pickupAt)) state.pickupAt = (back ? ends.to : ends.from) || "";
      if (!clean(state.dropoffAt)) state.dropoffAt = (back ? ends.from : ends.to) || "";
      lastDirection = state.direction || "out";
    }

    // Taxi : le titre de la feuille et l'en-tête de l'aperçu suivent le sens choisi.
    function updateRouteTitle() {
      if (config.variant !== "taxi" || !(config.from && config.to)) return;
      Array.prototype.forEach.call(dialog.querySelectorAll("[data-route-title]"), function (el) { el.textContent = routeLabel(config, state); });
    }

    // Hub : From et To remplissent Pickup et Drop-off tant que le client ne les a pas changés.
    var autoEnds = { pickupAt: "", dropoffAt: "" };
    function syncHubEnds() {
      if (config.variant !== "taxi" || (config.from && config.to)) return;
      [["from", "pickupAt"], ["to", "dropoffAt"]].forEach(function (p) {
        var src = clean(state[p[0]]), cur = clean(state[p[1]]);
        if (!src || (cur && cur !== autoEnds[p[1]])) return;
        state[p[1]] = src;
        autoEnds[p[1]] = src;
        if (field(p[1])) field(p[1]).value = src;
        clearError(p[1]);
      });
    }

    function updateAddressLabel() {
      updateRouteTitle();
      var label = form.querySelector("[data-address-label]");
      if (!label || !(config.from && config.to)) return;
      label.textContent = state.direction === "back" ? label.getAttribute("data-back") : label.getAttribute("data-out");
    }

    function readNumber(el, min, max) {
      var n = parseInt(el.value, 10);
      if (isNaN(n)) n = min;
      return Math.max(min, Math.min(max, n));
    }

    function readField(el) {
      var name = el.name;
      if (!name) return;
      var opt = el.getAttribute && el.getAttribute("data-opt");
      if (opt && /^c-/.test(name)) { if (el.type !== "radio" || el.checked) state.choices[opt + "/" + el.getAttribute("data-choice")] = el.value; }
      else if (opt && /^n-/.test(name)) state.counts[opt + "/" + el.getAttribute("data-row")] = readNumber(el, 0, 20);
      else if (opt && /^x-/.test(name)) {
        state.addons = (state.addons || []).filter(function (a) { return a !== el.value; });
        if (el.checked) state.addons.push(el.value);
      }
      else if (el.type === "radio") { if (el.checked) state[name] = el.value; }
      else if (name === "vehicles") state.vehicles = readNumber(el, 1, 20);
      else if (name === "children") {
        var n = readNumber(el, 0, 12);
        while (state.childAges.length < n) state.childAges.push("");
        state.childAges.length = n;
        if (state.childSeats > n) state.childSeats = n;
      } else if (name === "adults") state.adults = readNumber(el, 0, 60);
      else if (name === "bags") state.bags = readNumber(el, 0, 30);
      else if (name === "childSeats") state.childSeats = readNumber(el, 0, state.childAges.length);
      else if (/^child-\d+$/.test(name)) state.childAges[Number(name.slice(6))] = el.value === "" ? "" : Number(el.value);
      else if (name in state) state[name] = el.value;
    }

    form.addEventListener("input", function (e) { onChange(e.target); });
    form.addEventListener("change", function (e) { onChange(e.target); });

    function onChange(el) {
      readField(el);
      if (el.name === "from" || el.name === "to") syncHubEnds();
      if (el.name === "dateChoice") {
        var other = form.querySelector("[data-date-other]");
        if (other) other.hidden = state.dateChoice !== "other";
        if (state.dateChoice === "other" && el.checked && field("dateOther")) field("dateOther").focus();
      }
      if (el.name === "children") renderChildAges();
      if (el.name === "dateFrom" && field("dateTo")) field("dateTo").min = state.dateFrom;
      // Location : un modèle de la liste fixe sa catégorie.
      if (el.name === "vehicle") {
        (config.options || []).forEach(function (o) {
          if ((o.rows || []).some(function (r) { return r.label.toLowerCase() === clean(state.vehicle).toLowerCase(); })) { state.option = o.id; setRadio("option", o.id); clearError("option"); }
        });
      }
      if (el.name === "direction") {
        updateAddressLabel();
        // Taxi : l'aéroport de l'aller devient l'arrivée du retour, les deux adresses s'échangent.
        if (config.variant === "taxi" && el.checked) swapEnds();
      }
      if (el.name === "route") { showDepartures(); setRadio("departure", state.departure); clearError("departure"); showReturn(); }
      if (el.name === "tripType") { showReturn(); clearError("returnTrip"); }
      if (el.name === "returnDate" || el.name === "returnDeparture" || el.name === "returnTime") clearError("returnTrip");
      if (el.name === "option") fillChoices();
      if (/^n-/.test(el.name)) clearError("n-" + el.getAttribute("data-opt"));
      if (el.name === "timeFrom" || el.name === "timeTo") clearError("dates");
      if (el.name === "option") markOptions();
      clearError(errorKey(el.name));
      optionUI();
      save();
    }

    function errorKey(name) {
      if (name === "dateChoice" || name === "dateOther") return "date";
      if (name === "dateFrom" || name === "dateTo" || name === "timeFrom" || name === "timeTo") return "dates";
      if (name === "returnDate" || name === "returnDeparture" || name === "returnTime") return "returnTrip";
      if (/^c-/.test(name)) return name;
      if (/^n-/.test(name)) return name.replace(/-\d+$/, "");
      return name;
    }

    // Boutons − et + des compteurs.
    form.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-step]");
      if (!btn) return;
      var input = field(btn.getAttribute("data-for"));
      if (!input) return;
      var min = Number(input.min || 0);
      var max = Number(input.max || 60);
      var next = Math.max(min, Math.min(max, (parseInt(input.value, 10) || 0) + Number(btn.getAttribute("data-step"))));
      input.value = next;
      onChange(input);
    });

    function errorEl(key) { return dialog.querySelector("#book-e-" + key); }
    // Contrôles d'une erreur : tout le groupe pour les choix (date, option), le champ seul sinon.
    function controlsFor(key) {
      if (key === "date") return form.querySelectorAll('input[name="dateChoice"], input[name="dateOther"]');
      if (key === "dates") return form.querySelectorAll('input[name="dateFrom"], input[name="dateTo"], input[name="timeFrom"], input[name="timeTo"]');
      if (key === "option") return form.querySelectorAll('input[name="option"]');
      if (key === "departure") return form.querySelectorAll('input[name="departure"]');
      if (key === "tripType") return form.querySelectorAll('input[name="tripType"]');
      if (key === "returnTrip") return form.querySelectorAll('input[name="returnDate"], input[name="returnDeparture"], input[name="returnTime"]');
      if (/^c-/.test(key)) return form.querySelectorAll('[name="' + key + '"]');
      if (/^n-/.test(key)) return form.querySelectorAll('[name^="' + key + '-"]');
      var f = field(key);
      if (f && !f.tagName && f.length !== undefined) return f; // groupe de boutons radio (RadioNodeList)
      return f ? [f] : [];
    }
    function controlFor(key) {
      if (key === "date") return form.querySelector('input[name="dateChoice"]:checked') || form.querySelector('input[name="dateChoice"]');
      return controlsFor(key)[0] || null;
    }
    function groupOf(el) { return el && el.closest ? el.closest(".f, .count") : null; }

    // Dès qu'un choix est fait, l'erreur quitte tout le groupe : message, barre, bordures.
    function clearError(key) {
      var el = errorEl(key);
      if (el) { el.hidden = true; el.textContent = ""; }
      Array.prototype.forEach.call(controlsFor(key), function (c) { c.removeAttribute("aria-invalid"); });
      var g = groupOf(el);
      if (g) g.classList.remove("is-invalid");
    }

    function showErrors(errors) {
      var first = null, firstKey = "";
      Array.prototype.forEach.call(dialog.querySelectorAll(".err"), function (el) { el.hidden = true; el.textContent = ""; });
      Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (el) { el.removeAttribute("aria-invalid"); });
      Array.prototype.forEach.call(form.querySelectorAll(".is-invalid"), function (el) { el.classList.remove("is-invalid"); });
      // L'ordre des clés suit l'ordre du formulaire à l'écran.
      var order = Array.prototype.map.call(dialog.querySelectorAll(".err[id]"), function (el) { return el.id.replace("book-e-", ""); });
      order.forEach(function (key) {
        if (!errors[key]) return;
        var el = errorEl(key);
        if (el) { el.textContent = errors[key]; el.hidden = false; }
        var g = groupOf(el);
        if (g) g.classList.add("is-invalid");
        Array.prototype.forEach.call(controlsFor(key), function (c) {
          if (c.name !== "dateOther" || !c.closest("[hidden]")) c.setAttribute("aria-invalid", "true");
        });
        var c = controlFor(key);
        if (c && !first) { first = c; firstKey = key; }
      });
      if (!first) return;
      // Le bouton radio choisi fait 1 px : le défilement suit le groupe (titre, choix et message), pas le seul bouton.
      // data-quiet-focus : le champ reçoit le focus sans ouvrir la liste des lieux par-dessus le message d'erreur.
      first.setAttribute("data-quiet-focus", "");
      first.focus({ preventScroll: true });
      first.removeAttribute("data-quiet-focus");
      var err = errorEl(firstKey), g = groupOf(err) || groupOf(first);
      var box = form.querySelector(".sheet-body");
      if (!g || !g.scrollIntoView) return;
      var how = reduced ? "auto" : "smooth";
      if (box && g.offsetHeight > box.clientHeight && err) err.scrollIntoView({ block: "end", behavior: how });
      else g.scrollIntoView({ block: "start", behavior: how });
    }

    // Cours hors de ses jours : le message reste sous le cours, la rangée de dates est marquée aussi (c'est souvent elle qu'on change).
    function markDayClash(errors) {
      var opt = findOption(config, state.option);
      var clash = opt && (opt.choices || []).some(function (ch) { var v = choiceValue(state, opt, ch); return v && v.days && errors[choiceKey(opt, ch)]; });
      if (clash) Array.prototype.forEach.call(form.querySelectorAll('input[name="dateChoice"]'), function (r) { r.setAttribute("aria-invalid", "true"); });
    }

    function show(name) {
      Object.keys(screens).forEach(function (k) { if (screens[k]) screens[k].hidden = k !== name; });
      var head = screens[name] && screens[name].querySelector("[data-focus]");
      if (head) head.focus();
      dialog.scrollTop = 0;
      var body = dialog.querySelector(".sheet-body");
      if (body) body.scrollTop = 0;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      state.today = today();
      state.nowTime = bangkokTime(new Date());
      var errors = validate(config, state);
      if (Object.keys(errors).length) { showErrors(errors); markDayClash(errors); return; }
      message = buildMessage(config, state);
      var url = waUrl(message, config.whatsapp);
      renderSlip(message);
      dialog.querySelector("[data-send]").href = url;
      Array.prototype.forEach.call(dialog.querySelectorAll("[data-again]"), function (a) { a.href = url; });
      show("preview");
    });

    // Fiche de comptoir : une ligne par ligne du message (libellé, valeur), la référence en tête,
    // puis le cash à prévoir pour le parc, hors message.
    function renderSlip(text) {
      var pre = dialog.querySelector("[data-message]");
      if (pre) pre.textContent = text;
      var dl = dialog.querySelector("[data-slip]");
      var totEl = dialog.querySelector("[data-slip-total]");
      if (totEl) totEl.hidden = true;
      if (dl) {
        dl.textContent = "";
        text.split("\n").forEach(function (line, i) {
          var cut = line.indexOf(": ");
          var label = cut > 0 ? line.slice(0, cut) : "";
          var value = cut > 0 ? line.slice(cut + 2) : line;
          // Le total se lit en premier (même texte que dans le message).
          if (totEl && (label === "Estimated total" || label === "Total")) { totEl.textContent = label + " " + value; totEl.hidden = false; return; }
          var row = doc.createElement("div");
          if (i === 0) row.className = "slip-first";
          var dt = doc.createElement("dt");
          var dd = doc.createElement("dd");
          dt.textContent = label;
          dd.textContent = value;
          row.appendChild(dt);
          row.appendChild(dd);
          dl.appendChild(row);
        });
      }
      var cash = parkCash(config, state);
      var box = dialog.querySelector("[data-cash]");
      if (box) {
        box.hidden = !cash;
        if (cash) {
          dialog.querySelector("[data-cash-sum]").textContent = cash.text;
          var cl = dialog.querySelector("[data-cash-label]");
          if (cl && cash.label) cl.textContent = cash.label + ", in cash on the day";
          var cn = dialog.querySelector("[data-cash-note]");
          if (cn) cn.hidden = Boolean(config.parkFee) && cash.label !== config.parkFee.label;
        }
      }
    }

    dialog.querySelector("[data-edit]").addEventListener("click", function () { show("form"); });
    var sbChange = dialog.querySelector("[data-sb-change]");
    if (sbChange) sbChange.addEventListener("click", function () {
      sbSum = false;
      sbUI();
      if (field("route")) field("route").focus();
    });
    var change = dialog.querySelector("[data-opt-change]");
    if (change) change.addEventListener("click", function () {
      sumMode = false;
      optionUI();
      var r = form.querySelector('input[name="option"]:checked') || form.querySelector('input[name="option"]');
      if (r) r.focus();
    });

    // « Add to my trip list » : option, date et voyageurs suffisent ; l'hôtel et le prénom se donnent dans la liste.
    var tripBtn = dialog.querySelector("[data-trip]");
    if (tripBtn) tripBtn.addEventListener("click", function () {
      state.today = today();
      var errors = validate(config, state);
      ["pickup", "name"].forEach(function (k) { delete errors[k]; });
      if (Object.keys(errors).length) { showErrors(errors); return; }
      emit("stt-trip-add", {
        slug: config.productId, option: state.option, date: resolveDate(state.dateChoice, state.dateOther, state.today),
        adults: state.adults, childAges: state.childAges, addons: state.addons || [],
        // Karts, ATV : les compteurs disent qui vient, la feuille n'a pas de groupe à donner à la liste.
        counted: Boolean((findOption(config, state.option) || {}).counts),
        choices: state.choices || {}, counts: state.counts || {}
      });
      close();
    });

    dialog.querySelector("[data-send]").addEventListener("click", function () {
      if (window.dataLayer && typeof window.dataLayer.push === "function") {
        var option = findOption(config, state.option);
        window.dataLayer.push({ event: "whatsapp_click", product: config.product, option: option ? option.title : (config.variant === "taxi" ? routeLabel(config, state) : "") });
      }
      // WhatsApp s'ouvre dans un nouvel onglet ou dans l'application ; la feuille montre la suite.
      setTimeout(function () { show("done"); }, 0);
    });

    var copyBtn = dialog.querySelector("[data-copy]");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var status = dialog.querySelector("[data-copy-status]");
      var done = function () { if (status) status.textContent = "Message copied."; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(done, function () { fallbackCopy(); done(); });
      } else { fallbackCopy(); done(); }
    });

    function fallbackCopy() {
      var ta = doc.createElement("textarea");
      ta.value = message;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      dialog.appendChild(ta);
      ta.select();
      try { doc.execCommand("copy"); } catch (e) { /* rien de plus à faire */ }
      dialog.removeChild(ta);
    }

    Array.prototype.forEach.call(dialog.querySelectorAll("[data-close]"), function (b) {
      b.addEventListener("click", close);
    });
    // Un clic sur le voile (hors du panneau) ferme la feuille.
    dialog.addEventListener("click", function (e) {
      if (dialog.hasAttribute("data-dragged")) { dialog.removeAttribute("data-dragged"); return; }
      if (e.target === dialog) close();
    });
    dialog.addEventListener("close", function () {
      doc.documentElement.classList.remove("sheet-open");
      markOptions(true);
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    });

    function close() {
      if (!dialog.open) return;
      if (reduced) { dialog.close(); return; }
      dialog.classList.add("is-closing");
      setTimeout(function () { dialog.classList.remove("is-closing"); dialog.close(); }, 160);
    }

    // Lignes de prix sélectionnables : la ligne choisie reste marquée tant que la feuille est ouverte.
    function markOptions(reset) {
      Array.prototype.forEach.call(doc.querySelectorAll(".opt[data-book]"), function (b) {
        b.setAttribute("aria-pressed", !reset && b.getAttribute("data-book") === state.option ? "true" : "false");
      });
    }

    var lastTrigger = null;
    function open(optionId, trigger) {
      lastTrigger = trigger || null;
      state = emptyState(config);
      load();
      if (optionId) state.option = optionId;
      // Une ligne de la page précise davantage : le véhicule de la location, le trajet et le départ du speedboat.
      var attr = function (n) { return trigger && trigger.getAttribute ? trigger.getAttribute(n) || "" : ""; };
      if (attr("data-vehicle")) state.vehicle = attr("data-vehicle");
      if (attr("data-sb-route")) { state.route = attr("data-sb-route"); state.departure = attr("data-sb-dep"); }
      sbSum = Boolean(attr("data-sb-route"));
      if (!state.option && (config.options || []).length === 1) state.option = config.options[0].id;
      sumMode = Boolean(optionId) && Boolean(findOption(config, state.option));
      presetEnds();
      autoEnds = { pickupAt: "", dropoffAt: "" };
      syncHubEnds();
      fillForm();
      updateRouteTitle();
      showErrors({});
      show("form");
      markOptions();
      doc.documentElement.classList.add("sheet-open");
      dialog.showModal();
      var head = screens.form.querySelector("[data-focus]");
      if (head) head.focus();
    }

    // Déclencheurs : liens WhatsApp de secours (sans JS) que l'on intercepte pour ouvrir la feuille.
    doc.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-book]");
      if (!t || dialog.contains(t)) return;
      e.preventDefault();
      open(t.getAttribute("data-book") || "", t);
    });
  }

  return {
    bangkokToday: bangkokToday,
    addDays: addDays,
    resolveDate: resolveDate,
    formatDate: formatDate,
    shortDay: shortDay,
    guestsLine: guestsLine,
    priceLine: priceLine,
    buildMessage: buildMessage,
    validate: validate,
    validateTripList: validateTripList,
    choiceLines: choiceLines,
    rentalPrice: rentalPrice,
    buildTripList: buildTripList,
    sameDayClashes: sameDayClashes,
    parkCash: parkCash,
    quoteOf: quoteOf,
    pendingPrice: pendingPrice,
    tripState: tripState,
    waUrl: waUrl,
    makeDraft: makeDraft,
    restoreDraft: restoreDraft,
    emptyState: emptyState,
    mount: mount
  };
});
