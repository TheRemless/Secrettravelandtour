/* Feuille de réservation (refonte) : excursions de Secret Travel & Tour et trajets de VIP Taxi Lanta.
   Le visiteur choisit une option, une date, les passagers avec l'âge de chaque enfant, le lieu de prise en charge
   et son prénom ; il relit le message puis l'envoie lui-même sur WhatsApp. Rien ne part vers un serveur.
   Logique pure exportée en CommonJS pour les tests (node --test), interface branchée sur le <dialog> dans le navigateur.
   Repris de secret-form.js : dates à l'heure de Bangkok, brouillon gardé 7 jours, erreurs par champ. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.STT_BOOKING = api;
    if (typeof document !== "undefined") api.mount(document);
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_NUMBER = "66958683846";
  var DRAFT_VERSION = 1;
  var DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---------- Dates : toujours à l'heure de Koh Lanta, pas à celle du téléphone ----------
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

  // Prix vu sur la page, recopié tel quel depuis les données : « Adult: 1,000 THB / Child, 4 to 11: 700 THB »
  function priceLine(option) {
    if (!option || !option.rows || !option.rows.length) return "";
    return option.rows.map(function (r) { return r.label + ": " + r.price; }).join(" / ");
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
      if (clean(state.address)) {
        // Vers la destination, l'adresse est celle de la dépose ; au retour, celle de la prise en charge.
        var dropOff = config.from && config.to ? state.direction !== "back" : false;
        lines.push((dropOff ? "Drop-off: " : "Pickup: ") + clean(state.address));
      }
    } else if (config.variant === "rental") {
      var cat = findOption(config, state.option);
      lines.push("Rental request: " + (cat ? cat.title : config.product));
      if (clean(state.vehicle)) lines.push("Vehicle: " + clean(state.vehicle));
      if (state.dateFrom) lines.push("From: " + formatDate(state.dateFrom));
      if (state.dateTo) lines.push("To: " + formatDate(state.dateTo));
    } else {
      var option = findOption(config, state.option);
      lines.push("Booking request: " + config.product + (option ? " – " + option.title : ""));
      if (date) lines.push("Date: " + formatDate(date));
      lines.push("Guests: " + guestsLine(state.adults, state.childAges));
      if (clean(state.pickup)) lines.push("Pickup: " + clean(state.pickup));
    }

    if (clean(state.name)) lines.push("Name: " + clean(state.name));
    if (config.variant === "tour") {
      var price = priceLine(findOption(config, state.option));
      if (price) lines.push("Price on website: " + price);
    }
    if (config.page) lines.push("Page: " + config.page);
    // La référence ouvre le message : le comptoir trie et retrouve les demandes sur elle.
    var ref = config.variant === "rental" ? "" : makeRef(config.refPrefix, date, state.adults, (state.childAges || []).length);
    if (ref) lines.unshift("Ref: " + ref);
    return lines.join("\n");
  }

  // Référence courte (critique, idée 5) : code produit, jour et mois de la sortie, adultes et enfants.
  // « 4I-0411-2A1C » : le comptoir la retrouve dans WhatsApp, le client la cite s'il réécrit. Aucun hasard :
  // la même demande donne la même référence.
  function makeRef(prefix, dateIso, adults, children) {
    if (!prefix || !dateIso) return "";
    var d = dateIso.split("-");
    return prefix + "-" + d[2] + d[1] + "-" + (adults || 0) + "A" + (children ? children + "C" : "");
  }

  function thb(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " THB";
  }

  // Cash à prévoir pour le parc national : adultes et enfants au tarif des données, rien d'autre.
  // « 2 × 200 + 1 × 100 = 500 THB ». Null si le produit n'a pas de frais de parc.
  function parkCash(config, state) {
    var fee = config.parkFee;
    if (!fee || !fee.adult) return null;
    var kids = (state.childAges || []).length;
    var parts = [];
    var total = 0;
    if (state.adults > 0) { parts.push(state.adults + " × " + fee.adult); total += state.adults * fee.adult; }
    if (kids > 0 && fee.child) { parts.push(kids + " × " + fee.child); total += kids * fee.child; }
    if (!parts.length) return null;
    return { total: total, text: parts.join(" + ") + " = " + thb(total) };
  }

  function waUrl(message, number) {
    return "https://wa.me/" + (number || DEFAULT_NUMBER) + "?text=" + encodeURIComponent(message);
  }

  // Messages d'erreur : 03-audit-contenu §6.5.
  function validate(config, state) {
    var errors = {};
    if ((config.options || []).length && !findOption(config, state.option)) errors.option = "Choose an option.";

    if (config.variant === "rental") {
      if (!state.dateFrom || !state.dateTo) errors.dates = "Pick the first and the last day.";
      else if (state.dateFrom < state.today) errors.dates = "The first day has passed.";
      else if (state.dateTo < state.dateFrom) errors.dates = "The last day is before the first day.";
      if (!clean(state.name)) errors.name = "Add your first name.";
      return errors;
    }

    var date = resolveDate(state.dateChoice, state.dateOther, state.today);
    if (!date) errors.date = "Pick a date.";
    else if (date < state.today) errors.date = "That date has passed.";

    if (!(state.adults > 0)) errors.adults = "Add at least one adult.";
    (state.childAges || []).forEach(function (age, i) {
      if (age === "" || age === null || age === undefined) errors["child-" + i] = "Choose the age of child " + (i + 1) + ".";
    });

    if (config.variant === "taxi") {
      if (!(config.from && config.to)) {
        if (!clean(state.from)) errors.from = "Tell us where we pick you up.";
        if (!clean(state.to)) errors.to = "Tell us where you're going.";
      }
      if (!clean(state.time)) errors.time = "Choose a pickup time.";
      // Le lieu côté Koh Lanta fait le prix : sans lui, la demande repart en question.
      if (!clean(state.address)) errors.address = "Add your hotel or address.";
    } else if (config.pickupRequired !== false && !clean(state.pickup)) {
      errors.pickup = "Add your hotel so we know where to pick you up.";
    }

    if (!clean(state.name)) errors.name = "Add your first name.";
    return errors;
  }

  function makeDraft(state, now) {
    var copy = {};
    Object.keys(state).forEach(function (k) { if (k !== "today") copy[k] = state[k]; });
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
      direction: "out", from: "", to: "", time: "", flight: "", bags: 0, childSeats: 0, address: ""
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
      ["dateOther", "pickup", "name", "time", "flight", "address", "from", "to", "vehicle", "dateFrom", "dateTo"].forEach(function (k) {
        var el = field(k);
        if (el && typeof el.value === "string") el.value = state[k] || "";
      });
      ["adults", "children", "bags", "childSeats"].forEach(function (k) {
        var el = field(k);
        if (!el) return;
        el.value = k === "children" ? state.childAges.length : state[k];
      });
      setRadio("option", state.option);
      setRadio("dateChoice", state.dateChoice);
      setRadio("direction", state.direction);
      var other = form.querySelector("[data-date-other]");
      if (other) other.hidden = state.dateChoice !== "other";
      var min = today();
      if (field("dateOther")) field("dateOther").min = min;
      if (field("dateFrom")) field("dateFrom").min = min;
      if (field("dateTo")) field("dateTo").min = state.dateFrom || min;
      updateAddressLabel();
      renderChildAges();
    }

    function setRadio(name, value) {
      var list = form.querySelectorAll('input[type="radio"][name="' + name + '"]');
      Array.prototype.forEach.call(list, function (r) { r.checked = r.value === value; });
    }

    function updateAddressLabel() {
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
      if (el.type === "radio") { if (el.checked) state[name] = el.value; }
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
      if (el.name === "direction") updateAddressLabel();
      if (el.name === "option") markOptions();
      clearError(errorKey(el.name));
      save();
    }

    function errorKey(name) {
      if (name === "dateChoice" || name === "dateOther") return "date";
      if (name === "dateFrom" || name === "dateTo") return "dates";
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
      if (key === "dates") return form.querySelectorAll('input[name="dateFrom"], input[name="dateTo"]');
      if (key === "option") return form.querySelectorAll('input[name="option"]');
      var f = field(key);
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
      var first = null;
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
        if (c && !first) first = c;
      });
      if (first) first.focus();
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
      var errors = validate(config, state);
      if (Object.keys(errors).length) { showErrors(errors); return; }
      message = buildMessage(config, state);
      var url = waUrl(message, config.whatsapp);
      renderSlip(message);
      dialog.querySelector("[data-send]").href = url;
      Array.prototype.forEach.call(dialog.querySelectorAll("[data-again], [data-again-link]"), function (a) { a.href = url; });
      show("preview");
    });

    // Fiche de comptoir : une ligne par ligne du message (libellé, valeur), la référence en tête,
    // puis le cash à prévoir pour le parc, hors message.
    function renderSlip(text) {
      var pre = dialog.querySelector("[data-message]");
      if (pre) pre.textContent = text;
      var dl = dialog.querySelector("[data-slip]");
      var refEl = dialog.querySelector("[data-slip-ref]");
      if (dl) {
        dl.textContent = "";
        text.split("\n").forEach(function (line, i) {
          var cut = line.indexOf(": ");
          var label = cut > 0 ? line.slice(0, cut) : "";
          var value = cut > 0 ? line.slice(cut + 2) : line;
          if (label === "Ref") { if (refEl) { refEl.textContent = "Ref " + value; refEl.hidden = false; } return; }
          var row = doc.createElement("div");
          if (i === 0 || (i === 1 && text.indexOf("Ref: ") === 0)) row.className = "slip-first";
          var dt = doc.createElement("dt");
          var dd = doc.createElement("dd");
          dt.textContent = label;
          dd.textContent = value;
          row.appendChild(dt);
          row.appendChild(dd);
          dl.appendChild(row);
        });
      }
      var doneRef = dialog.querySelector("[data-done-ref]");
      var refLine = text.split("\n")[0];
      if (doneRef) { doneRef.hidden = refLine.indexOf("Ref: ") !== 0; doneRef.textContent = "Ref " + refLine.slice(5); }
      var cash = parkCash(config, state);
      var box = dialog.querySelector("[data-cash]");
      if (box) {
        box.hidden = !cash;
        if (cash) dialog.querySelector("[data-cash-sum]").textContent = cash.text;
      }
    }

    dialog.querySelector("[data-edit]").addEventListener("click", function () { show("form"); });

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
    dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });
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
      if (!state.option && (config.options || []).length === 1) state.option = config.options[0].id;
      fillForm();
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
    guestsLine: guestsLine,
    priceLine: priceLine,
    buildMessage: buildMessage,
    validate: validate,
    makeRef: makeRef,
    parkCash: parkCash,
    waUrl: waUrl,
    makeDraft: makeDraft,
    restoreDraft: restoreDraft,
    emptyState: emptyState,
    mount: mount
  };
});
