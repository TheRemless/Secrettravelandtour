/* Feuille de réservation (refonte) : excursions de Secret Travel & Tour et trajets de VIP Taxi Lanta.
   Le visiteur choisit une option, une date, les passagers avec l'âge de chaque enfant, le lieu de prise en charge
   et son prénom ; le bouton « Send on WhatsApp » ouvre WhatsApp avec le message, que le visiteur peut encore changer
   avant de l'envoyer lui-même (plus d'écran d'aperçu, Jérémy 16.11.2026). Rien ne part vers un serveur ; la feuille
   annonce seulement l'ouverture et l'envoi à consent.js (stt-book-open, stt-book-send), sans rien de ce que le visiteur a écrit.
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

  // Ce qu'est un bout de trajet : avion (numéro de vol et heure d'atterrissage), ferry ou bus (heure d'arrivée), sinon un hôtel.
  // Lu dans le texte du champ, donc aussi pour les lieux saisis librement sur le hub et le minivan partagé.
  var AIR_RE = /airport|aeroport|a[eé]roport|\b(?:KBV|HKT|USM|HDY|TST|BKK|DMK|NST)\b|suvarnabhumi|don ?mueang/i;
  var SEA_RE = /\b(?:pier|ferry|port|terminal|station|bus)\b/i;
  function endKind(text) {
    var t = typeof text === "string" ? text : "";
    return AIR_RE.test(t) ? "air" : SEA_RE.test(t) ? "sea" : "";
  }
  function timeLabel(kind, shared) {
    return kind === "air" ? "Landing time" : kind === "sea" ? "Arrival time" : shared ? "Preferred pickup time" : "Pickup time";
  }

  // Sortie du jour : plus proposée une fois le ramassage commencé (heure du premier ramassage tirée des données, config.pickupFrom).
  function todayClosed(config, nowTime) {
    return Boolean(config && config.variant === "tour" && config.pickupFrom && nowTime && nowTime >= config.pickupFrom);
  }

  function clean(value) {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  }

  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }

  // ---------- Qui écrit : prénom, nom et numéro WhatsApp, obligatoires (Jérémy, 17.11.2026) ----------
  // Certains visiteurs remplissent la feuille sans appuyer sur « Envoyer » dans WhatsApp : le numéro permet de les joindre.
  // Indicatifs courants des visiteurs de Koh Lanta, dans le site (ni bibliothèque ni CDN) ; « Other » pour taper le sien.
  var DIAL_CODES = [
    ["TH", "Thailand", "66"], ["GB", "United Kingdom", "44"], ["DE", "Germany", "49"], ["FR", "France", "33"],
    ["CH", "Switzerland", "41"], ["IT", "Italy", "39"], ["NL", "Netherlands", "31"], ["BE", "Belgium", "32"],
    ["AT", "Austria", "43"], ["ES", "Spain", "34"], ["SE", "Sweden", "46"], ["NO", "Norway", "47"], ["DK", "Denmark", "45"],
    ["FI", "Finland", "358"], ["IE", "Ireland", "353"], ["PL", "Poland", "48"], ["CZ", "Czechia", "420"], ["IL", "Israel", "972"],
    ["US", "USA, Canada", "1"], ["AU", "Australia", "61"], ["NZ", "New Zealand", "64"], ["SG", "Singapore", "65"],
    ["MY", "Malaysia", "60"], ["CN", "China", "86"], ["IN", "India", "91"], ["JP", "Japan", "81"], ["KR", "South Korea", "82"]
  ].map(function (c) { return { id: c[0], name: c[1], dial: c[2] }; });
  var DIAL_BY_REGION = { CA: "US" };
  var DIAL_BY_LANG = { th: "TH", de: "DE", fr: "FR", it: "IT", nl: "NL", sv: "SE", nb: "NO", nn: "NO", no: "NO", da: "DK", fi: "FI", pl: "PL", cs: "CZ", he: "IL", es: "ES", zh: "CN", ja: "JP", ko: "KR" };
  var DIAL_BY_ZONE = {
    "Europe/London": "GB", "Europe/Berlin": "DE", "Europe/Paris": "FR", "Europe/Zurich": "CH", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE", "Europe/Vienna": "AT", "Europe/Madrid": "ES", "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI", "Europe/Dublin": "IE", "Europe/Warsaw": "PL", "Europe/Prague": "CZ", "Asia/Jerusalem": "IL", "Asia/Bangkok": "TH",
    "Asia/Singapore": "SG", "Asia/Kuala_Lumpur": "MY", "Asia/Shanghai": "CN", "Asia/Kolkata": "IN", "Asia/Tokyo": "JP", "Asia/Seoul": "KR",
    "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU", "Australia/Perth": "AU", "Pacific/Auckland": "NZ"
  };
  function dialOf(id) { return DIAL_CODES.filter(function (c) { return c.id === id; })[0] || null; }
  // Indicatif proposé d'avance. Un téléphone déjà en Thaïlande passe au fuseau de Bangkok : ce fuseau ne dit rien du pays
  // du numéro. Un autre fuseau (visite préparée depuis chez soi) passe donc en premier, puis la région de la langue du
  // navigateur (« de-CH » → Suisse), puis la langue seule (« fr » → France). Rien de sûr : chaîne vide, le visiteur choisit.
  // Toujours modifiable.
  function guessDial(languages, timeZone) {
    var langs = (languages || []).map(function (l) { return String(l || ""); });
    if (timeZone && timeZone !== "Asia/Bangkok" && DIAL_BY_ZONE[timeZone]) return DIAL_BY_ZONE[timeZone];
    for (var i = 0; i < langs.length; i++) {
      var region = ((/^[a-z]{2,3}-([A-Za-z]{2})\b/i.exec(langs[i]) || [])[1] || "").toUpperCase();
      if (region && (DIAL_BY_REGION[region] || dialOf(region))) return DIAL_BY_REGION[region] || region;
    }
    for (var j = 0; j < langs.length; j++) {
      var base = langs[j].slice(0, 2).toLowerCase();
      if (DIAL_BY_LANG[base]) return DIAL_BY_LANG[base];
    }
    return "";
  }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  // Numéro complet (« +44 7700… », souvent rempli par le téléphone) : le pays de la liste dont l'indicatif ouvre le numéro.
  function dialFromNumber(phone) {
    var raw = String(phone || "").trim();
    if (!/^(\+|00)/.test(raw)) return "";
    var all = digits(raw).replace(/^00/, "");
    var hit = DIAL_CODES.filter(function (c) { return all.indexOf(c.dial) === 0; }).sort(function (a, b) { return b.dial.length - a.dial.length; })[0];
    return hit ? hit.id : "";
  }
  // Numéro au format E.164 (« +66958683846 ») ; chaîne vide s'il n'est pas valable. Un numéro tapé ou rempli par le
  // téléphone avec « + » ou « 00 » garde son propre indicatif ; sinon l'indicatif choisi, sans le 0 national de tête
  // (07700… au Royaume-Uni → +447700…), sauf en Italie où le 0 fait partie du numéro.
  function phoneParts(state) {
    var raw = String(state.phone || "").trim();
    if (/^(\+|00)/.test(raw)) {
      var all = digits(raw).replace(/^00/, "");
      return { code: "", national: all, full: all, intl: true };
    }
    var code = state.phoneCode === "other" ? digits(state.phoneOther) : (dialOf(state.phoneCode) || {}).dial || "";
    var national = digits(raw);
    if (code !== "39") national = national.replace(/^0/, "");
    return { code: code, national: national, full: code + national, intl: false };
  }
  function phoneE164(state) {
    var p = phoneParts(state);
    // Gestion garde un numéro « + » suivi de 8 à 15 chiffres (contrat demandes-site, 17.11.2026) : même borne ici.
    if (p.intl) return p.full.length >= 8 && p.full.length <= 15 && p.full.charAt(0) !== "0" ? "+" + p.full : "";
    if (!/^\d{1,3}$/.test(p.code) || p.code.charAt(0) === "0") return "";
    return p.national.length >= 6 && p.national.length <= 15 && p.full.length >= 8 && p.full.length <= 15 ? "+" + p.full : "";
  }
  // Message d'erreur du numéro, ou chaîne vide. Mêmes mots dans la feuille et dans la liste de sorties.
  function phoneError(state) {
    var raw = String(state.phone || "").trim();
    if (!raw) return "Add your WhatsApp number.";
    if (/[^\d\s()+.\-\/]/.test(raw)) return "Use only digits for the number.";
    var p = phoneParts(state);
    if (!p.intl) {
      if (!state.phoneCode) return "Choose your country code.";
      if (state.phoneCode === "other" && (!/^\d{1,3}$/.test(digits(state.phoneOther)) || digits(state.phoneOther).charAt(0) === "0")) return "Add your country code, for example +20.";
    }
    return phoneE164(state) ? "" : "Check the number: 6 to 15 digits after the country code.";
  }
  // Champ qui reçoit le focus quand le numéro est refusé : la liste des indicatifs, le petit champ « Other », ou le numéro.
  function phoneFocus(state) {
    if (/^(\+|00)/.test(String(state.phone || "").trim())) return "phone";
    if (!state.phoneCode) return "phoneCode";
    if (state.phoneCode === "other" && phoneError(state) === "Add your country code, for example +20.") return "phoneOther";
    return "phone";
  }
  // Indicatif proposé par ce navigateur (langues et fuseau horaire) ; chaîne vide hors navigateur.
  function browserDial() {
    if (typeof navigator === "undefined") return "";
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { tz = ""; }
    return guessDial(navigator.languages || [navigator.language], tz);
  }
  // Ancien champ unique « name » (brouillons et listes d'avant le 17.11.2026) : premier mot en prénom, le reste en nom.
  function splitName(name) {
    var parts = clean(name).split(" ");
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
  }
  // Nom complet « Prénom Nom », 120 caractères au plus : au-delà, Gestion refuse toute la demande (contrat demandes-site).
  // Chaque champ en garde 60 (maxlength) ; la coupe ici couvre l'espace entre les deux et les anciens brouillons.
  var NAME_MAX = 120;
  function fullName(state) {
    return (clean([state.firstName, state.lastName].join(" ")) || clean(state.name)).slice(0, NAME_MAX).trim();
  }
  // Prénom, nom et numéro : mêmes règles partout (feuille et liste). errors reçoit firstName, lastName, phone.
  function validateContact(state, errors) {
    if (!clean(state.firstName)) errors.firstName = "Add your first name.";
    if (!clean(state.lastName)) errors.lastName = "Add your last name.";
    var pe = phoneError(state);
    if (pe) errors.phone = pe;
    return errors;
  }
  // Lignes du message WhatsApp : « Name: Prénom Nom » puis « WhatsApp: +66… » (toujours sans « Ref: »).
  function contactLines(state) {
    var out = [], n = fullName(state), tel = phoneE164(state);
    if (n) out.push("Name: " + n);
    if (tel) out.push("WhatsApp: " + tel);
    return out;
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
  function findSlot(config, id) {
    var list = config.departures || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function findDeparture(route, id) {
    var list = (route && route.deps) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Aller-retour depuis le point de prise en charge (Jérémy, 16.11.2026) : le chauffeur emmène le groupe où il veut, ou fait le tour,
  // puis le ramène au même endroit. Offert seulement sur les feuilles à Pickup et Drop-off libres (config.roundTrip : hub /taxi/ et songthaew).
  function isRound(config, state) {
    return Boolean(config && config.roundTrip && state && state.ride === "round");
  }
  // « about 4 hours », « about 1 hour », « not sure » : format lu tel quel par Gestion (demande collée).
  function hoursText(value) {
    var n = parseInt(value, 10);
    return n > 0 ? "about " + n + (n === 1 ? " hour" : " hours") : "not sure";
  }

  function routeLabel(config, state) {
    if (config.from && config.to) {
      return state.direction === "back" ? config.to + " to " + config.from : config.from + " to " + config.to;
    }
    return clean(state.pickupAt) + " to " + clean(state.dropoffAt);
  }

  // La première ligne dit tout de suite ce qui est demandé : l'agence trie ses messages sur elle.
  function buildMessage(config, state) {
    var lines = [];
    var date = resolveDate(state.dateChoice, state.dateOther, state.today);

    if (isRound(config, state)) {
      // Format commun avec Gestion (16.11.2026), à garder mot pour mot : les quatre premières lignes, puis le véhicule de la page.
      // Ni Drop-off, ni bagages, ni prix : le prix dépend du programme et de la durée, l'équipe le donne sur WhatsApp.
      lines.push("Round trip, back to the pickup place");
      lines.push("Pickup: " + clean(state.pickupAt));
      lines.push("Plan: " + clean(state.plan));
      lines.push("Time needed: " + hoursText(state.hours));
      if (config.vehicle) lines.push("Vehicle: " + config.vehicle);
      if (date) lines.push("Date: " + formatDate(date));
      var rk = endKind(state.pickupAt);
      if (clean(state.time)) lines.push("Pickup time: " + clean(state.time) + (rk === "air" ? " (landing)" : rk === "sea" ? " (arrival)" : ""));
      if (rk && clean(state.flight)) lines.push("Flight or ferry: " + clean(state.flight));
      lines.push("Guests: " + guestsLine(state.adults, state.childAges));
      if (state.childSeats > 0 && (state.childAges || []).length) lines.push("Child seats: " + state.childSeats);
    } else if (config.variant === "taxi") {
      var vehicle = findOption(config, state.option);
      // Minivan partagé (page /transfers/) : la demande est au nom de Secret Travel & Tour, sur le même WhatsApp que VIP Taxi Lanta.
      if (config.shared) lines.push("Shared minivan request (" + config.brand + "): " + routeLabel(config, state));
      // Excursion à la journée : le nombre de stops et leur nom juste sous la demande, ce qui fait le prix (12.11.2026).
      // Première ligne et « Pickup: » au format que lit la demande collée de Gestion (demande-calc.mjs).
      else if (config.dayTrip) {
        var stops = (state.stops || []).map(clean).filter(Boolean);
        lines.push("Transfer request: " + routeLabel(config, state) + " – Day trip");
        lines.push("Stops (" + stops.length + "): " + stops.join(", "));
      }
      else lines.push("Transfer request: " + routeLabel(config, state) + (vehicle ? " – " + vehicle.title : config.vehicle ? " (" + config.vehicle + ")" : ""));
      if (date) lines.push("Date: " + formatDate(date));
      // Gestion lit « Pickup time » : l'heure d'atterrissage ou d'arrivée y reste, dite entre parenthèses.
      var kind = endKind(state.pickupAt);
      var slot = (config.departures || []).filter(function (d) { return d.id === state.slot; })[0];
      if (slot) lines.push("Departure: " + slot.label);
      else if (clean(state.time)) lines.push((config.shared ? "Preferred pickup time: " : "Pickup time: ") + clean(state.time) + (kind === "air" ? " (landing)" : kind === "sea" ? " (arrival)" : ""));
      if (kind && clean(state.flight)) lines.push("Flight or ferry: " + clean(state.flight));
      lines.push("Guests: " + guestsLine(state.adults, state.childAges));
      if (state.childSeats > 0 && (state.childAges || []).length) lines.push("Child seats: " + state.childSeats);
      if (state.bags > 0) lines.push("Bags: " + state.bags);
      // Les deux bouts du trajet : où le chauffeur prend le client, où il le dépose (taxi v1, 10.11.2026).
      if (clean(state.pickupAt)) lines.push("Pickup: " + clean(state.pickupAt) + (config.dayTrip ? " (and back at the end of the day)" : ""));
      if (!config.dayTrip && clean(state.dropoffAt)) lines.push("Drop-off: " + clean(state.dropoffAt));
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

    contactLines(state).forEach(function (l) { lines.push(l); });
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
  // list : { items: [{slug, option, date, addons}], adults, childAges, pickup, firstName, lastName, phoneCode, phoneOther, phone }.
  function buildTripList(catalog, list) {
    var items = (list.items || []).filter(function (it) { return catalog[it.slug]; }).slice();
    items.sort(function (a, b) { return (a.date || "9999") < (b.date || "9999") ? -1 : (a.date || "9999") > (b.date || "9999") ? 1 : 0; });
    var lines = [];
    lines.push("Trip list: " + plural(items.length, "trip", "trips"));
    lines.push("Guests: " + guestsLine(list.adults, list.childAges));
    if (clean(list.pickup)) lines.push("Pickup: " + clean(list.pickup));
    contactLines(list).forEach(function (l) { lines.push(l); });
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
  // plusieurs. Renvoie { items: { id: { option?, date? } }, ages: { i: texte }, pickup?, firstName?, lastName?, phone? } ; vide si tout va.
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
    var who = validateContact(list, {});
    Object.keys(who).forEach(function (k) { out[k] = who[k]; n++; });
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

  // Mesure d'audience (consent.js) : quel produit, quelle variante, quelle option, combien de personnes, total estimé.
  // Jamais le nom, l'hôtel, le téléphone, les dates ni le texte du message.
  function productType(config) {
    if (config.variant !== "taxi") return config.variant || "unknown";
    return config.shared ? "shared_minivan" : config.dayTrip ? "day_trip" : config.vehicle === "songthaew" ? "songthaew" : "taxi";
  }
  function trackInfo(config, state) {
    var out = { product_id: config.productId || "", product_type: productType(config) };
    out.option_id = state.option || state.route || "";
    var opt = findOption(config, state.option), value = null;
    // Location : le nombre de véhicules. Karts, quad : les compteurs de l'option disent qui vient, pas le groupe
    // (laissé à sa valeur par défaut) ; aucun nombre de personnes plutôt qu'un faux.
    if (config.variant === "rental") out.vehicles = state.vehicles > 0 ? state.vehicles : 1;
    else if (!(opt && opt.counts)) out.people = (state.adults || 0) + (state.childAges || []).length;
    if (config.variant === "tour") { var q = quoteOf(opt, state); if (q) value = q.total; }
    else if (config.variant === "rental") { var rt = rentalTotal(opt, state); if (rt) value = rt.total; }
    // Taxi : le prix d'appel par véhicule de la page (« From 2,300 THB per vehicle »), pour un seul véhicule (8 personnes au plus).
    // Aller-retour depuis le point de prise en charge : prix au cas par cas, aucune valeur envoyée.
    else if (config.variant === "taxi" && isRound(config, state)) out.trip = "round_trip";
    else if (config.variant === "taxi" && config.priceNote && out.people <= 8) {
      var m = /([\d,]+)\s*THB/.exec(config.priceNote);
      if (m) value = Number(m[1].replace(/,/g, ""));
    }
    if (typeof value === "number" && value > 0) { out.value = value; out.currency = "THB"; }
    return out;
  }

  // ---------- Copie de la demande pour Gestion (contrat Site_Anais docs/gestion/demandes-site.md, 17.11.2026) ----------
  // Le corps exact du contrat, rien de plus : ce que la feuille sait déjà, et le texte WhatsApp tel qu'il part (sans ligne
  // « Ref: », décision de Jérémy du 17.11.2026). Nom complet dans name ; numéro WhatsApp au format E.164 dans le champ
  // PHONE_FIELD (« whatsapp », confirmé par le contrat Gestion du 17.11.2026, PR 221 de Site_Anais). Le numéro part déjà en
  // E.164 : whatsapp_country (facultatif) n'est pas envoyé. Aucun e-mail.
  var DEMANDE_URL = "https://lkxqcmzeidlyssoqmqkh.supabase.co/functions/v1/demande-site";
  var PHONE_FIELD = "whatsapp";
  function withPhone(body, who) { body[PHONE_FIELD] = phoneE164(who); return body; }
  function demandeBody(config, state, message, honeypot, pageUrl) {
    var option = findOption(config, state.option);
    var info = trackInfo(config, state);
    var time = clean(state.time);
    return withPhone({
      brand: /VIP Taxi/i.test(config.brand || "") ? "taxi" : "secret",
      product_id: config.productId || "",
      product: config.product || "",
      option: state.option || state.route || "",
      option_label: option ? option.title : "",
      date: config.variant === "rental" ? state.dateFrom || "" : resolveDate(state.dateChoice, state.dateOther, state.today) || "",
      time: /^\d{2}:\d{2}$/.test(time) ? time : "",
      adults: state.adults || 0,
      children: (state.childAges || []).length,
      pickup: clean(state.pickup || state.pickupAt || ""),
      name: fullName(state),
      estimated_total: typeof info.value === "number" ? info.value : null,
      currency: "THB",
      ref: "",
      page_url: String(pageUrl || "").split("#")[0],
      message: message,
      website: honeypot || ""
    }, state);
  }
  // Liste de sorties (v4-trips.js) : une copie par sortie, mêmes champs et mêmes règles que la feuille, sans toucher au
  // contrat ni à la fonction de Gestion (session parente, 17.11.2026). Chaque copie porte les champs de sa sortie (fiche,
  // option, date, total estimé de la sortie) et le texte exact envoyé à WhatsApp, que Gestion sait lire (« Trip list: »).
  // Au plus 5 copies par envoi : demande-site refuse au-delà de 5 demandes en 10 minutes par appareil (LIMITE_APPAREIL,
  // supabase/functions/demande-site/calc.js) ; les sorties sont prises dans l'ordre du message (par date).
  // Le message est raccourci si besoin : 2 000 caractères au plus, corps de 4 096 octets au plus (contrat).
  var TRIP_COPIES_MAX = 5, MESSAGE_MAX = 2000, BODY_MAX = 4096;
  function bytes(s) { return typeof TextEncoder === "function" ? new TextEncoder().encode(s).length : unescape(encodeURIComponent(s)).length; }
  function fitBody(body) {
    var msg = String(body.message || "").slice(0, MESSAGE_MAX);
    body.message = msg;
    while (bytes(JSON.stringify(body)) > BODY_MAX && msg.length) { msg = msg.slice(0, Math.max(0, msg.length - 100)); body.message = msg; }
    return body;
  }
  function tripListBodies(catalog, list, message, honeypot, pageUrl) {
    var items = (list.items || []).filter(function (it) { return catalog[it.slug]; }).slice();
    items.sort(function (a, b) { return (a.date || "9999") < (b.date || "9999") ? -1 : (a.date || "9999") > (b.date || "9999") ? 1 : 0; });
    return items.slice(0, TRIP_COPIES_MAX).map(function (it) {
      var p = catalog[it.slug];
      var option = findOption(p, it.option) || ((p.options || []).length === 1 ? p.options[0] : null);
      var q = option && PRICE && Array.isArray(option.prices) ? quoteOf(option, tripState(list, it)) : null;
      return fitBody(withPhone({
        brand: "secret",
        product_id: String(it.slug || ""),
        product: p.name || "",
        option: option ? option.id : "",
        option_label: option ? option.title : "",
        date: /^\d{4}-\d{2}-\d{2}$/.test(it.date || "") ? it.date : "",
        time: "",
        adults: list.adults || 0,
        children: (list.childAges || []).length,
        pickup: clean(list.pickup || ""),
        name: fullName(list),
        estimated_total: q && typeof q.total === "number" ? q.total : null,
        currency: "THB",
        ref: "",
        page_url: String(pageUrl || "").split("#")[0],
        message: message,
        website: honeypot || ""
      }, list));
    });
  }

  // Envoi sans attendre de réponse, avant WhatsApp : ne bloque ni ne retarde jamais l'ouverture, toute erreur est avalée.
  // Corps en text/plain (requête « simple », sans contrôle CORS préalable) et keepalive : il part même si la page change.
  function sendCopy(body) {
    try {
      var data = JSON.stringify(body);
      if (typeof fetch === "function") {
        fetch(DEMANDE_URL, { method: "POST", body: data, keepalive: true, mode: "cors", credentials: "omit", headers: { "Content-Type": "text/plain;charset=UTF-8" } }).catch(function () {});
      } else if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(DEMANDE_URL, new Blob([data], { type: "text/plain;charset=UTF-8" }));
      }
    } catch (e) { /* jamais bloquant */ }
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
      validateContact(state, errors);
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
    else if (date === state.today && todayClosed(config, state.nowTime)) errors.date = "Pickups for today have started. Choose tomorrow or another day.";
    else if (config.variant === "speedboat" && date === state.today && state.nowTime) {
      var gone = findDeparture(findRoute(config, state.route), state.departure);
      if (gone && /^\d{2}:\d{2}$/.test(gone.time) && gone.time <= state.nowTime) errors.date = "That boat has left for today. Choose another departure or another day.";
    }

    if (config.variant === "tour") validateChoices(findOption(config, state.option), state, date, errors);

    var counted = config.variant === "tour" ? findOption(config, state.option) : null;
    if (!(counted && counted.counts)) {
      if (!(state.adults > 0)) errors.adults = "Add at least one adult.";
      (state.childAges || []).forEach(function (age, i) {
        if (age === "" || age === null || age === undefined) errors["child-" + i] = "Choose the age of child " + (i + 1) + ".";
      });
    }

    if (config.variant === "taxi") {
      var pk = endKind(state.pickupAt);
      var slots = config.shared && (config.departures || []).length;
      if (slots) { if (!findSlot(config, state.slot)) errors.slot = "Choose a departure time."; }
      else if (!clean(state.time)) { if (!config.shared) errors.time = pk === "air" ? "Add your landing time." : pk === "sea" ? "Add the time you arrive." : "Choose a pickup time."; }
      else if (state.nowTime && date === state.today && clean(state.time) <= state.nowTime) errors.time = "That time has passed. Choose a later time.";
      // Les deux adresses font le prix : sans elles, la demande repart en question.
      if (!clean(state.pickupAt)) errors.pickupAt = config.dayTrip ? "Add your hotel on Koh Lanta." : "Add the pickup address.";
      // Aller-retour : pas de dépose, c'est le programme qui fait le prix. La durée reste facultative.
      if (isRound(config, state)) {
        if (!clean(state.plan)) errors.plan = "Tell us what you would like to do. The price depends on it.";
      } else if (config.dayTrip) {
        (state.stops || []).forEach(function (st, i) { if (!clean(st)) errors["stop-" + i] = "Name stop " + (i + 1) + "."; });
      } else if (!clean(state.dropoffAt)) errors.dropoffAt = "Add the drop-off address.";
      // Pris à l'aéroport : sans numéro de vol, on ne peut pas suivre l'atterrissage.
      if (pk === "air" && !clean(state.flight)) errors.flight = "Add your flight number.";
    } else if (config.variant === "speedboat") {
      if (!clean(state.pickup)) errors.pickup = "Add your hotel on Koh Lanta.";
    } else if (config.pickupRequired !== false && !clean(state.pickup)) {
      errors.pickup = "Add your hotel so we know where to pick you up.";
    }

    validateContact(state, errors);
    return errors;
  }

  function makeDraft(state, now) {
    var copy = {};
    // Le numéro WhatsApp ne reste pas 7 jours sur l'appareil : il vit le temps de la visite (stt-who, sessionStorage).
    Object.keys(state).forEach(function (k) { if (!/^(today|nowTime|phone|phoneCode|phoneOther)$/.test(k)) copy[k] = state[k]; });
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
      option: "", dateChoice: "", dateOther: "", adults: 2, childAges: [], pickup: "", firstName: "", lastName: "", phoneCode: "", phoneOther: "", phone: "",
      vehicle: "", dateFrom: "", dateTo: "",
      direction: "out", time: "", slot: "", flight: "", bags: 0, childSeats: 0, pickupAt: "", dropoffAt: "", addons: [], stops: [""],
      ride: "oneway", plan: "", hours: "",
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
      done: dialog.querySelector('[data-screen="done"]')
    };
    var storageKey = "stt-book:" + (config.productId || config.product);
    var state = emptyState(config);
    var message = "";
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function field(name) { return form.elements.namedItem(name); }

    // Indicatifs : la liste vient de DIAL_CODES (une seule source pour la feuille et la liste de sorties).
    // Le texte commence par l'indicatif : sur un téléphone étroit, c'est lui qui reste lisible.
    var codeSel = field("phoneCode");
    if (codeSel && codeSel.options.length < 3) {
      DIAL_CODES.forEach(function (c) { codeSel.add(new Option("+" + c.dial + " " + c.name, c.id)); });
      codeSel.add(new Option("Other", "other"));
    }
    function showPhoneOther() {
      var box = form.querySelector("[data-phone-other]");
      if (box) box.hidden = state.phoneCode !== "other";
    }
    function today() { return bangkokToday(new Date()); }

    // Ce qu'on retient d'une feuille à l'autre pendant la visite (sessionStorage, effacé à la fermeture de l'onglet) :
    // le nom, l'hôtel à Koh Lanta et le groupe. Le brouillon de chaque fiche, lui, reste 7 jours.
    function who() {
      try { return JSON.parse(sessionStorage.getItem("stt-who")) || {}; } catch (e) { return {}; }
    }
    function remember() {
      var w = who(), opt = findOption(config, state.option), hotel = "";
      // Valeur actuelle, même effacée : un numéro corrigé ou retiré ne revient pas dans la feuille suivante.
      ["firstName", "lastName", "phone", "phoneOther", "phoneCode"].forEach(function (k) { w[k] = clean(state[k]); });
      if (config.variant === "taxi") {
        if (config.from && config.to) {
          var back = state.direction === "back";
          if (/^Koh Lanta$/i.test(back ? config.to : config.from)) hotel = clean(state.pickupAt);
          else if (/^Koh Lanta$/i.test(back ? config.from : config.to)) hotel = clean(state.dropoffAt);
          if (endKind(hotel)) hotel = "";
        }
      } else if (!(opt && opt.departure)) hotel = clean(state.pickup);
      if (hotel) w.hotel = hotel;
      if (config.variant !== "rental" && state.adults > 0) { w.adults = state.adults; w.childAges = state.childAges.slice(); }
      try { sessionStorage.setItem("stt-who", JSON.stringify(w)); } catch (e) { /* stockage indisponible */ }
    }

    function save() {
      remember();
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
      // Brouillon d'avant le 17.11.2026 : un seul champ « name », partagé en prénom et nom.
      if (saved && saved.name && !saved.firstName && !saved.lastName) Object.assign(state, splitName(saved.name));
      return Boolean(saved);
    }

    // Première ouverture de cette fiche : le nom, l'hôtel et le groupe déjà donnés ailleurs dans la visite ne se retapent pas.
    function carryOver(fresh) {
      var w = who(), opt = findOption(config, state.option);
      if (w.name && !w.firstName) Object.assign(w, splitName(w.name)); // visite commencée avant le 17.11.2026
      ["firstName", "lastName", "phoneCode", "phoneOther", "phone"].forEach(function (k) { if (!state[k] && w[k]) state[k] = w[k]; });
      // Indicatif proposé d'après la langue ou le fuseau du navigateur ; le visiteur le change s'il le faut.
      if (!state.phoneCode && !/^(\+|00)/.test(clean(state.phone))) state.phoneCode = browserDial();
      if (config.variant !== "taxi" && config.variant !== "rental" && !clean(state.pickup) && w.hotel && !(opt && opt.departure)) state.pickup = w.hotel;
      if (fresh && config.variant !== "rental" && w.adults > 0) {
        state.adults = w.adults;
        if (Array.isArray(w.childAges)) state.childAges = w.childAges.slice();
      }
    }

    // Les champs d'âge suivent le nombre d'enfants.
    // Excursion à la journée : un champ par stop, autant que le compteur « Number of stops ».
    function renderStops() {
      var box = form.querySelector("[data-stop-list]");
      var tpl = doc.getElementById("book-stop-tpl");
      if (!box || !tpl) return;
      if (!Array.isArray(state.stops) || !state.stops.length) state.stops = [""];
      var count = state.stops.length;
      while (box.children.length > count) box.removeChild(box.lastElementChild);
      while (box.children.length < count) {
        var i = box.children.length;
        var node = tpl.content.firstElementChild.cloneNode(true);
        var input = node.querySelector("input"), label = node.querySelector("label"), err = node.querySelector(".err");
        input.id = "book-stop-" + i;
        input.name = "stop-" + i;
        input.setAttribute("aria-describedby", "book-e-stop-" + i);
        label.htmlFor = input.id;
        label.textContent = "Stop " + (i + 1);
        err.id = "book-e-stop-" + i;
        box.appendChild(node);
      }
      state.stops.forEach(function (st, i) {
        var el = box.querySelector('[name="stop-' + i + '"]');
        if (el && el.value !== (st || "")) el.value = st || "";
      });
      var n = field("stopCount");
      if (n) n.value = count;
      // Une suggestion déjà prise ne se repropose pas.
      Array.prototype.forEach.call(form.querySelectorAll("[data-stop-add]"), function (b) {
        var taken = state.stops.some(function (st) { return clean(st).toLowerCase() === b.getAttribute("data-stop-add").toLowerCase(); });
        b.setAttribute("aria-pressed", taken ? "true" : "false");
      });
    }

    // Une suggestion remplit le premier stop vide, ou ajoute un stop (8 au plus). Touchée une seconde fois, elle se retire.
    function addStop(name) {
      if (!Array.isArray(state.stops)) state.stops = [""];
      var low = name.toLowerCase();
      var at = -1;
      state.stops.forEach(function (st, i) { if (at < 0 && clean(st).toLowerCase() === low) at = i; });
      if (at >= 0) {
        if (state.stops.length > 1) state.stops.splice(at, 1); else state.stops[0] = "";
      } else {
        var empty = state.stops.findIndex ? state.stops.findIndex(function (st) { return !clean(st); }) : -1;
        if (empty >= 0) { state.stops[empty] = name; clearError("stop-" + empty); }
        else if (state.stops.length < 8) state.stops.push(name);
      }
      // Les erreurs des stops se recalculent à l'envoi : on efface celles des champs qui ont bougé.
      for (var k = 0; k < 8; k++) if (clean(state.stops[k])) clearError("stop-" + k);
      renderStops();
      save();
    }

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
      ["dateOther", "pickup", "firstName", "lastName", "phoneOther", "phone", "time", "flight", "pickupAt", "dropoffAt", "plan", "hours", "vehicle", "dateFrom", "dateTo", "timeFrom", "timeTo", "returnDate", "returnTime"].forEach(function (k) {
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
      if (field("phoneCode")) { field("phoneCode").value = state.phoneCode || ""; showPhoneOther(); }
      showDepartures();
      setRadio("departure", state.departure);
      setRadio("tripType", state.tripType);
      showReturn();
      setRadio("returnDeparture", state.returnDeparture);
      fillChoices();
      setRadio("dateChoice", state.dateChoice);
      setRadio("direction", state.direction);
      setRadio("ride", state.ride === "round" ? "round" : "oneway");
      setRadio("slot", state.slot);
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
      dateUI();
      updateRouteTitle();
      endsUI();
      renderChildAges();
      renderStops();
      optionUI();
    }

    // Aujourd'hui n'est proposé que si on peut encore l'être : une sortie dont le ramassage a commencé passe à demain.
    function dateUI() {
      var closed = todayClosed(config, bangkokTime(new Date()));
      Array.prototype.forEach.call(form.querySelectorAll('input[name="dateChoice"][value="today"]'), function (r) {
        r.closest("label").hidden = closed;
        var box = r.closest(".choice");
        if (box) box.classList.toggle("is-two", closed);
      });
      if (closed && state.dateChoice === "today") {
        state.dateChoice = "";
        setRadio("dateChoice", "");
      }
    }

    // L'option choisie sur la page : déjà cochée dans la liste, toujours visible (Jérémy, 12.11.2026).
    // Ses compteurs (pilotes, karts) remplacent « Guests » ; un départ d'Ao Nang demande l'hôtel à Ao Nang ;
    // le conseil d'âge de l'option (catamaran) s'affiche dès qu'un enfant est trop jeune ; le total estimé suit.
    function optionUI() {
      var opt = findOption(config, state.option);
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
          // À qui se paie ce cash quand les données le disent (« Cash, paid to the ranger on the island ») : l'aperçu qui
          // l'affichait n'existe plus (16.11.2026).
          // Même règle que l'ancien aperçu : la note de la fiche vaut pour ses propres frais (même libellé), pas pour ceux d'une option.
          var note = cash && config.parkFee && cash.label === config.parkFee.label ? config.parkFee.note : "", to = /^Cash, (.+)$/.exec(note || "");
          if (cash) { sm.textContent = "Plus " + thb(cash.total) + " " + (cash.label || "fees").toLowerCase() + ", in cash on the day" + (to ? ", " + to[1] : ""); tot.appendChild(sm); }
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
    // L'autre bout, quand c'est Koh Lanta, reprend l'hôtel déjà donné dans une autre feuille de la visite.
    function presetEnds() {
      var ends = config.ends;
      if (config.variant !== "taxi" || !ends) return;
      var back = state.direction === "back";
      if (!clean(state.pickupAt)) state.pickupAt = (back ? ends.to : ends.from) || "";
      if (!clean(state.dropoffAt)) state.dropoffAt = (back ? ends.from : ends.to) || "";
      var hotel = who().hotel;
      if (hotel && config.from && config.to) {
        var pickPlace = back ? config.to : config.from, dropPlace = back ? config.from : config.to;
        if (!clean(state.pickupAt) && /^Koh Lanta$/i.test(pickPlace)) state.pickupAt = hotel;
        if (!clean(state.dropoffAt) && /^Koh Lanta$/i.test(dropPlace)) state.dropoffAt = hotel;
      }
      lastDirection = state.direction || "out";
    }

    // Taxi : le titre de la feuille et l'en-tête de l'aperçu suivent le sens choisi.
    function updateRouteTitle() {
      if (config.variant !== "taxi" || config.dayTrip || !(config.from && config.to)) return;
      Array.prototype.forEach.call(dialog.querySelectorAll("[data-route-title]"), function (el) { el.textContent = routeLabel(config, state); });
    }

    // Taxi : un bout déjà connu (aéroport, jetée d'une page trajet) n'est pas redemandé, il s'écrit en une ligne.
    // Le vol, l'heure d'atterrissage ou d'arrivée ne se demandent que si le client est pris à un aéroport, un ferry ou un bus.
    function endsUI() {
      if (config.variant !== "taxi") return;
      var ends = config.ends, back = state.direction === "back";
      var fixedPick = ends ? ((back ? ends.to : ends.from) || "") : "";
      var fixedDrop = ends ? ((back ? ends.from : ends.to) || "") : "";
      var pk = form.querySelector('[data-end="pickup"]'), dp = form.querySelector('[data-end="dropoff"]'), line = form.querySelector("[data-fixed]");
      var parts = [];
      if (pk) { pk.hidden = Boolean(fixedPick) && clean(state.pickupAt) === fixedPick; if (pk.hidden) parts.push("Pickup: " + fixedPick); }
      if (dp) { dp.hidden = Boolean(fixedDrop) && clean(state.dropoffAt) === fixedDrop; if (dp.hidden) parts.push("Drop-off: " + fixedDrop); }
      if (line) { line.hidden = !parts.length; line.textContent = parts.join(". ") + (parts.length ? "." : ""); }
      // Aller-retour : « Drop-off » laisse la place au programme et à la durée ; la dépose déjà tapée reste en mémoire
      // (cachée, hors du message) et revient si le client repasse en aller simple. Pas de bagages pour un aller-retour.
      var round = isRound(config, state);
      var rb = form.querySelector("[data-round]");
      if (rb) {
        rb.hidden = !round;
        if (dp && round) dp.hidden = true;
        var bags = field("bags") && field("bags").closest(".count");
        if (bags) bags.hidden = round;
        var ph = form.querySelector("#book-h-pickupAt");
        if (ph && ph.hasAttribute("data-hint")) ph.textContent = round ? ph.getAttribute("data-round-hint") : ph.getAttribute("data-hint");
      }
      var kind = endKind(state.pickupAt);
      var fl = form.querySelector("[data-flight]");
      if (fl) {
        fl.hidden = !kind;
        var fLabel = fl.querySelector("label"), fInput = fl.querySelector("input");
        fLabel.textContent = kind === "sea" ? "Ferry or bus details (optional)" : "Flight number";
        if (kind === "air") { fInput.setAttribute("required", ""); fInput.setAttribute("aria-required", "true"); }
        else { fInput.removeAttribute("required"); fInput.removeAttribute("aria-required"); }
      }
      var tl = form.querySelector("[data-time-label]");
      if (tl) tl.textContent = timeLabel(kind, config.shared);
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
      else if (name === "stopCount") {
        var ns = readNumber(el, 1, 8);
        if (!Array.isArray(state.stops)) state.stops = [];
        while (state.stops.length < ns) state.stops.push("");
        // En baissant le compteur, un stop vide part avant un stop déjà nommé.
        while (state.stops.length > ns) {
          var gap = -1;
          for (var g = state.stops.length - 1; g >= 0; g--) if (!clean(state.stops[g])) { gap = g; break; }
          state.stops.splice(gap >= 0 ? gap : state.stops.length - 1, 1);
        }
      }
      else if (/^stop-\d+$/.test(name)) { if (!Array.isArray(state.stops)) state.stops = [""]; state.stops[Number(name.slice(5))] = el.value; }
      else if (name === "childSeats") state.childSeats = readNumber(el, 0, state.childAges.length);
      else if (/^child-\d+$/.test(name)) state.childAges[Number(name.slice(6))] = el.value === "" ? "" : Number(el.value);
      else if (name in state) state[name] = el.value;
    }

    form.addEventListener("input", function (e) { onChange(e.target); });
    form.addEventListener("change", function (e) { onChange(e.target); });

    function onChange(el) {
      readField(el);
      if (el.name === "dateChoice") {
        var other = form.querySelector("[data-date-other]");
        if (other) other.hidden = state.dateChoice !== "other";
        if (state.dateChoice === "other" && el.checked && field("dateOther")) field("dateOther").focus();
      }
      if (el.name === "children") renderChildAges();
      if (el.name === "stopCount") renderStops();
      if (el.name === "dateFrom" && field("dateTo")) field("dateTo").min = state.dateFrom;
      // Location : un modèle de la liste fixe sa catégorie.
      if (el.name === "vehicle") {
        (config.options || []).forEach(function (o) {
          if ((o.rows || []).some(function (r) { return r.label.toLowerCase() === clean(state.vehicle).toLowerCase(); })) { state.option = o.id; setRadio("option", o.id); clearError("option"); }
        });
      }
      if (el.name === "direction") {
        updateRouteTitle();
        // Taxi : l'aéroport de l'aller devient l'arrivée du retour, les deux adresses s'échangent.
        if (config.variant === "taxi" && el.checked) swapEnds();
      }
      if (config.variant === "taxi" && (el.name === "direction" || el.name === "pickupAt" || el.name === "dropoffAt" || el.name === "ride")) {
        endsUI();
        clearError("flight");
        clearError("time");
      }
      // Changement aller simple / aller-retour : l'erreur du champ qui disparaît part avec lui.
      if (el.name === "ride") { clearError("dropoffAt"); clearError("plan"); }
      if (el.name === "route") { showDepartures(); setRadio("departure", state.departure); clearError("departure"); showReturn(); }
      if (el.name === "tripType") { showReturn(); clearError("returnTrip"); }
      if (el.name === "returnDate" || el.name === "returnDeparture" || el.name === "returnTime") clearError("returnTrip");
      if (el.name === "option") fillChoices();
      if (el.name === "phoneCode") showPhoneOther();
      // Numéro collé ou rempli avec son indicatif : la liste suit, pour que l'écran dise la même chose que le message.
      if (el.name === "phone" && dialFromNumber(state.phone) && field("phoneCode")) {
        state.phoneCode = dialFromNumber(state.phone);
        field("phoneCode").value = state.phoneCode;
        showPhoneOther();
      }
      if (/^n-/.test(el.name)) clearError("n-" + el.getAttribute("data-opt"));
      if (el.name === "timeFrom" || el.name === "timeTo") clearError("dates");
      if (el.name === "option") markOptions();
      clearError(errorKey(el.name));
      optionUI();
      save();
    }

    function errorKey(name) {
      if (name === "phoneCode" || name === "phoneOther") return "phone";
      if (name === "dateChoice" || name === "dateOther") return "date";
      if (name === "dateFrom" || name === "dateTo" || name === "timeFrom" || name === "timeTo") return "dates";
      if (name === "returnDate" || name === "returnDeparture" || name === "returnTime") return "returnTrip";
      if (/^c-/.test(name)) return name;
      if (/^n-/.test(name)) return name.replace(/-\d+$/, "");
      return name;
    }

    // Stops suggérés de l'excursion à la journée.
    form.addEventListener("click", function (e) {
      var idea = e.target.closest && e.target.closest("[data-stop-add]");
      if (idea) addStop(idea.getAttribute("data-stop-add"));
    });

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
      if (key === "phone") return form.querySelectorAll('[name="phoneCode"], [name="phoneOther"], [name="phone"]');
      if (/^c-/.test(key)) return form.querySelectorAll('[name="' + key + '"]');
      if (/^n-/.test(key)) return form.querySelectorAll('[name^="' + key + '-"]');
      var f = field(key);
      if (f && !f.tagName && f.length !== undefined) return f; // groupe de boutons radio (RadioNodeList)
      return f ? [f] : [];
    }
    function controlFor(key) {
      if (key === "phone") return field(phoneFocus(state));
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

    // Touche Entrée dans un champ (« Done » ou « Next » du clavier du téléphone) : elle ferme le clavier ou passe au champ
    // suivant, elle n'envoie pas. Sinon WhatsApp s'ouvrirait au milieu de la saisie ; seul le bouton envoie.
    form.addEventListener("keydown", function (e) {
      var t = e.target;
      if (e.key !== "Enter" || !t || t.tagName !== "INPUT" || /^(submit|button)$/.test(t.type)) return;
      e.preventDefault();
      if (t.blur) t.blur();
    });

    // Envoi direct : WhatsApp s'ouvre depuis le geste du visiteur (l'envoi du formulaire suit son appui sur le bouton),
    // sans quoi Safari sur iPhone et Chrome bloquent la fenêtre. Fenêtre refusée quand même : WhatsApp dans cet onglet.
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      state.today = today();
      state.nowTime = bangkokTime(new Date());
      var errors = validate(config, state);
      if (Object.keys(errors).length) { showErrors(errors); markDayClash(errors); return; }
      message = buildMessage(config, state);
      // Copie pour Gestion : avant window.open, sans attendre (le geste du visiteur reste disponible pour WhatsApp).
      var trap = form.querySelector('[name="website"]');
      sendCopy(demandeBody(config, state, message, trap ? trap.value : "", window.location.href));
      var url = waUrl(message, config.whatsapp);
      Array.prototype.forEach.call(dialog.querySelectorAll("[data-again]"), function (a) { a.href = url; });
      // variant : pour l'ancien événement send_on_whatsapp (consent.js le retire de booking_send).
      emit("stt-book-send", Object.assign(trackInfo(config, state), { variant: config.variant || "unknown" }));
      var win = null;
      try { win = window.open(url, "_blank"); } catch (x) { win = null; }
      if (!win) { window.location.href = url; return; }
      try { win.opener = null; } catch (x) { /* fenêtre d'une autre origine */ }
      show("done");
      // Ordinateur : QR code du message sur l'écran final, pour qui n'avait pas WhatsApp (wa-qr.js, absent des tests).
      if (window.STT_WAQR) window.STT_WAQR.doneScreen(dialog.querySelector("[data-waqr-done]"), url);
    });

    // « Add to my trip list » : option, date et voyageurs suffisent ; l'hôtel, le nom et le numéro se donnent dans la liste.
    var tripBtn = dialog.querySelector("[data-trip]");
    if (tripBtn) tripBtn.addEventListener("click", function () {
      state.today = today();
      state.nowTime = bangkokTime(new Date());
      var errors = validate(config, state);
      ["pickup", "firstName", "lastName", "phone"].forEach(function (k) { delete errors[k]; });
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

    var lastTrigger = null, openedBy = "other";
    function open(optionId, trigger, auto) {
      lastTrigger = trigger || null;
      var spot = trigger && trigger.closest ? trigger.closest("[data-track]") : null;
      openedBy = auto ? "auto" : (spot && spot.getAttribute("data-track")) || "other";
      state = emptyState(config);
      var fresh = !load();
      if (optionId) state.option = optionId;
      // Une ligne de la page précise davantage : le véhicule de la location, le trajet et le départ du speedboat.
      var attr = function (n) { return trigger && trigger.getAttribute ? trigger.getAttribute(n) || "" : ""; };
      if (attr("data-vehicle")) state.vehicle = attr("data-vehicle");
      if (attr("data-sb-route")) { state.route = attr("data-sb-route"); state.departure = attr("data-sb-dep"); }
      // « Ask for a round trip » ouvre la feuille en aller-retour ; « Ask for another route », en aller simple.
      if (config.roundTrip && /^(?:round|oneway)$/.test(attr("data-ride"))) state.ride = attr("data-ride");
      if (!state.option && (config.options || []).length === 1) state.option = config.options[0].id;
      carryOver(fresh);
      presetEnds();
      fillForm();
      showErrors({});
      show("form");
      markOptions();
      doc.documentElement.classList.add("sheet-open");
      dialog.showModal();
      // Quel bouton a ouvert la feuille : son emplacement (data-track) ; « auto » pour une ouverture par le code
      // (anciens liens /taxi/?from=…, vip-taxi.js), sans clic du visiteur.
      emit("stt-book-open", { product_id: config.productId || "", product_type: productType(config), cta: openedBy });
      var head = screens.form.querySelector("[data-focus]");
      if (head) head.focus();
    }

    // Déclencheurs : liens WhatsApp de secours (sans JS) que l'on intercepte pour ouvrir la feuille.
    doc.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-book]");
      if (!t || dialog.contains(t)) return;
      e.preventDefault();
      open(t.getAttribute("data-book") || "", t, e.isTrusted === false);
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
    demandeBody: demandeBody,
    tripListBodies: tripListBodies,
    PHONE_FIELD: PHONE_FIELD,
    NAME_MAX: NAME_MAX,
    DIAL_CODES: DIAL_CODES,
    guessDial: guessDial,
    dialFromNumber: dialFromNumber,
    phoneFocus: phoneFocus,
    browserDial: browserDial,
    phoneE164: phoneE164,
    phoneError: phoneError,
    splitName: splitName,
    fullName: fullName,
    validateContact: validateContact,
    TRIP_COPIES_MAX: TRIP_COPIES_MAX,
    sendCopy: sendCopy,
    DEMANDE_URL: DEMANDE_URL,
    trackInfo: trackInfo,
    makeDraft: makeDraft,
    restoreDraft: restoreDraft,
    emptyState: emptyState,
    endKind: endKind,
    isRound: isRound,
    hoursText: hoursText,
    timeLabel: timeLabel,
    todayClosed: todayClosed,
    bangkokTime: bangkokTime,
    mount: mount
  };
});
