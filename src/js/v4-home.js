/* Accueil v4 : hero à trois sorties, rail des activités, chercheur de transfert, location,
   message qui se compose quand on essaie. Tout le contenu est déjà rendu au build. */
(function () {
  "use strict";
  var V = window.V4;
  if (!V) return;
  var $ = V.$, $$ = V.$$;

  // ---------- Hero : la photo, la légende et le bouton suivent le choix ; la pastille glisse ----------
  var sw = $("[data-switch]");
  if (sw) {
    var btns = $$("button", sw), pill = $(".switch__pill", sw), stack = $("[data-hero-stack]"), go = $("[data-hero-go]"), cap = $("[data-hero-cap]");
    var cur = 0, loaded = false;
    var place = function (instant) {
      var b = btns[cur];
      if (instant) pill.style.transition = "none";
      pill.style.height = b.offsetHeight + "px";
      pill.style.transform = "translateY(" + b.offsetTop + "px)";
      if (instant) { pill.offsetWidth; pill.style.transition = ""; }
    };
    // Les deux autres photos n'arrivent qu'à la première intention (survol, focus, toucher) : rien de plus au chargement.
    var hydrate = function () {
      if (loaded) return;
      loaded = true;
      $$("template[data-hero-tpl]", stack).forEach(function (t) {
        var node = t.content.firstElementChild.cloneNode(true);
        node.setAttribute("data-i", t.getAttribute("data-hero-tpl"));
        stack.appendChild(node);
      });
      V.bindImgs(stack);
    };
    var phs = function () { return $$(".ph", stack); };
    var pick = function (i, focus) {
      hydrate();
      if (i === cur) return;
      cur = i;
      var b = btns[i];
      btns.forEach(function (x, j) { x.setAttribute("aria-checked", j === i ? "true" : "false"); x.tabIndex = j === i ? 0 : -1; });
      place();
      phs().forEach(function (p) { var j = Number(p.getAttribute("data-i") || 0); p.classList.toggle("is-on", j === i); });
      go.href = b.getAttribute("data-href");
      go.textContent = "See the " + b.getAttribute("data-name") + " trip";
      cap.textContent = b.getAttribute("data-cap");
      V.prefetch(b.getAttribute("data-href"));
      if (focus) b.focus();
    };
    place(true);
    addEventListener("resize", function () { place(true); });
    if (document.fonts) document.fonts.ready.then(function () { place(true); });
    var hov;
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { pick(i); });
      b.addEventListener("pointerenter", function (e) { hydrate(); if (e.pointerType === "mouse") { clearTimeout(hov); hov = setTimeout(function () { pick(i); }, 90); } });
      b.addEventListener("pointerleave", function () { clearTimeout(hov); });
      b.addEventListener("focus", hydrate);
    });
    sw.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); pick((cur + d + btns.length) % btns.length, true); }
    });
  }

  // ---------- Rail des activités : flèches, barre de progression, glisser-lancer à la souris ----------
  var rail = $("[data-rail]");
  if (rail) {
    var ctl = $("[data-rail-ctl]"), prev = $("[data-rail-prev]"), next = $("[data-rail-next]");
    ctl.hidden = false;
    var page = function (d) { rail.scrollBy({ left: d * rail.clientWidth * 0.9, behavior: V.reduce.matches ? "auto" : "smooth" }); };
    var state = function () {
      var max = rail.scrollWidth - rail.clientWidth;
      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft > max - 4;
      if (!CSS.supports("animation-timeline: scroll()")) $(".rail-bar i").style.setProperty("--p", 0.2 + 0.8 * (max ? rail.scrollLeft / max : 1));
    };
    prev.addEventListener("click", function () { page(-1); });
    next.addEventListener("click", function () { page(1); });
    rail.addEventListener("scroll", state, { passive: true });
    addEventListener("resize", state);
    state();
    var d = null;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button) return;
      d = { x: e.clientX, s: rail.scrollLeft, t: e.timeStamp, v: 0, moved: false, id: e.pointerId };
    });
    rail.addEventListener("pointermove", function (e) {
      if (!d) return;
      var dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6) { d.moved = true; rail.classList.add("is-dragging"); rail.setPointerCapture(d.id); }
      if (!d.moved) return;
      var dt = Math.max(1, e.timeStamp - d.t);
      d.v = (rail.scrollLeft - (d.s - dx)) / dt; d.t = e.timeStamp;
      rail.scrollLeft = d.s - dx;
    });
    var end = function () {
      if (!d) return;
      var moved = d.moved, v = d.v;
      d = null;
      if (!moved) return;
      rail.classList.remove("is-dragging");
      rail.scrollTo({ left: rail.scrollLeft + v * -220, behavior: V.reduce.matches ? "auto" : "smooth" });
      // Un glisser n'ouvre pas la carte sous le curseur
      rail.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
    };
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointercancel", end);
  }

  // ---------- Transferts : De / Vers, inversion qui croise les deux champs ----------
  var finder = $("[data-finder]");
  var routesEl = $("#routes-data");
  if (finder && routesEl) {
    var routes = JSON.parse(routesEl.textContent);
    var from = $("[data-from]", finder), to = $("[data-to]", finder), out = $("[data-route]", finder), swap = $("[data-swap]", finder), turns = 0;
    var others = function (a) { return routes.filter(function (t) { return t.from === a || t.to === a; }).map(function (t) { return t.from === a ? t.to : t.from; }); };
    var fillTo = function (keep) {
      var list = others(from.value);
      to.innerHTML = list.map(function (p) { return "<option>" + V.esc(p) + "</option>"; }).join("");
      if (keep && list.indexOf(keep) > -1) to.value = keep;
    };
    var render = function (animate) {
      var a = from.value, b = to.value;
      var t = routes.filter(function (r) { return (r.from === a && r.to === b) || (r.from === b && r.to === a); })[0];
      if (!t) return;
      out.innerHTML = "<b>" + V.esc(a) + " to " + V.esc(b) + "</b><p>" + V.esc(t.drive.charAt(0).toUpperCase() + t.drive.slice(1)) + " by private minivan, both directions. Run by VIP Taxi Lanta.</p>" +
        '<a class="link" href="' + t.url + '">See the ' + V.esc(t.name) + " transfer</a>";
      if (animate && !V.reduce.matches) out.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    };
    from.addEventListener("change", function () { fillTo(to.value); render(true); });
    to.addEventListener("change", function () { render(true); });
    finder.addEventListener("submit", function (e) { e.preventDefault(); });
    swap.addEventListener("click", function () {
      var a = from.value, b = to.value, fa = $('[data-f="from"]', finder), fb = $('[data-f="to"]', finder);
      var dy = fb.getBoundingClientRect().top - fa.getBoundingClientRect().top;
      from.value = b; fillTo(a); render(true);
      turns++;
      $("svg", swap).style.transform = "rotate(" + turns * 180 + "deg)";
      if (!V.reduce.matches) {
        var o = { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" };
        $("select", fa).animate([{ transform: "translateY(" + dy + "px)" }, { transform: "none" }], o);
        $("select", fb).animate([{ transform: "translateY(" + -dy + "px)" }, { transform: "none" }], o);
      }
    });
  }

  // ---------- Location : la fourchette roule jusqu'aux nouveaux chiffres, le message suit le type ----------
  var rentSeg = $('[data-seg="rent"]');
  if (rentSeg) {
    var lo = $('[data-odo="lo"]'), hi = $('[data-odo="hi"]'), models = $("[data-rent-models]"), rgo = $("[data-rent-go]");
    V.odo(lo, Number($('[aria-pressed="true"]', rentSeg).getAttribute("data-lo")));
    V.odo(hi, Number($('[aria-pressed="true"]', rentSeg).getAttribute("data-hi")));
    V.seg(rentSeg, function (v, b) {
      V.odo(lo, Number(b.getAttribute("data-lo")));
      V.odo(hi, Number(b.getAttribute("data-hi")));
      models.textContent = b.getAttribute("data-models");
      rgo.href = b.getAttribute("data-wa");
      $("span", rgo).textContent = b.getAttribute("data-ask");
    });
  }

  // ---------- Le message se compose quand on essaie (même fonction que la feuille de réservation) ----------
  var form = $("[data-try]");
  if (form) {
    var bubble = $("[data-try-msg]"), send = $("[data-try-send]"), agesBox = $("[data-ages]", form);
    var st = { trip: form.trip.value, day: "tomorrow", date: "", adults: 2, ages: [] };
    var ready = null, lines = $$(".msg__l", bubble).map(function (l) { return l.textContent; });
    var prepare = function () {
      if (!ready) ready = Promise.all([V.catalog(), V.load("/js/booking.js")]).then(function (r) { return r[0]; });
      return ready;
    };
    var drawAges = function () {
      while (agesBox.children.length > st.ages.length) agesBox.lastElementChild.remove();
      for (var i = agesBox.children.length; i < st.ages.length; i++) {
        var l = document.createElement("label");
        l.className = "agesel";
        l.innerHTML = "Age of child " + (i + 1) + '<select data-age="' + i + '"><option value="">Choose</option><option value="0">Under 1</option>' +
          Array.from({ length: 17 }, function (_, n) { return '<option value="' + (n + 1) + '">' + (n + 1) + "</option>"; }).join("") + "</select>";
        agesBox.appendChild(l);
      }
    };
    var compose = function () {
      prepare().then(function (catalog) {
        var B = window.STT_BOOKING, p = catalog[st.trip];
        if (!B || !p) return;
        var cfg = { variant: "tour", product: p.name, page: p.page, refPrefix: p.refPrefix, options: p.options };
        var state = Object.assign(B.emptyState(cfg), { option: p.options.length ? p.options[0].id : "", dateChoice: st.day, dateOther: st.date, adults: st.adults, childAges: st.ages, today: V.today() });
        var msg = B.buildMessage(cfg, state);
        var next = msg.split("\n");
        bubble.innerHTML = next.map(function (l) { return '<span class="msg__l' + (lines.indexOf(l) < 0 ? " is-new" : "") + '">' + V.esc(l) + "</span>"; }).join("");
        lines = next;
        requestAnimationFrame(function () { requestAnimationFrame(function () { $$(".is-new", bubble).forEach(function (s) { s.classList.remove("is-new"); }); }); });
        send.href = V.wa(msg);
      });
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "trip") st.trip = t.value;
      if (t.name === "day") { st.day = t.value; form.date.hidden = t.value !== "other"; if (t.value === "other") { form.date.min = V.today(); form.date.focus(); } }
      if (t.name === "date") st.date = t.value;
      if (t.hasAttribute("data-age")) st.ages[Number(t.getAttribute("data-age"))] = t.value === "" ? "" : Number(t.value);
      compose();
    });
    form.addEventListener("click", function (e) {
      var b = e.target.closest("[data-step]");
      if (!b) return;
      var k = b.getAttribute("data-step"), d = Number(b.getAttribute("data-d"));
      if (k === "adults") st.adults = V.clamp(st.adults + d, 1, 30);
      else if (d > 0 && st.ages.length < 12) st.ages.push(""); else if (d < 0) st.ages.pop();
      $('[data-out="adults"]', form).textContent = st.adults;
      $('[data-out="children"]', form).textContent = st.ages.length;
      $('[data-step="adults"][data-d="-1"]', form).disabled = st.adults <= 1;
      $('[data-step="children"][data-d="-1"]', form).disabled = !st.ages.length;
      drawAges();
      compose();
    });
    $('[data-step="children"][data-d="-1"]', form).disabled = true;
    // Données chargées à l'approche de la section, puis premier message avec la date de demain.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); compose(); } }, { rootMargin: "400px 0px" });
      io.observe(form);
    }
  }
})();
