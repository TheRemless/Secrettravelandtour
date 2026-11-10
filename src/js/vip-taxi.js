/* Cadre kranok autour d'un bloc [data-frame] : deux moitiés symétriques qui partent de la pointe en haut
   et se rejoignent en bas. Recalculé à chaque changement de taille ; tracé une seule fois à l'arrivée,
   sauf data-frame="still". */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function half(w, h, dir) {
    var cx = w / 2, r = Math.min(16, h / 6), s = dir > 0 ? 1 : 0;
    var X = function (v) { return (dir > 0 ? v : w - v).toFixed(1); };
    return [
      // pointe de flamme jusqu'au filet
      "M" + cx.toFixed(1) + " -18",
      "C" + X(cx - 2) + " -8 " + X(cx - 9) + " -1 " + X(cx - 22) + " 0",
      // crochet kranok qui remonte au-dessus du filet
      "M" + X(cx - 22) + " 0",
      "C" + X(cx - 34) + " 0 " + X(cx - 38) + " -10 " + X(cx - 31) + " -15",
      "C" + X(cx - 25) + " -18 " + X(cx - 20) + " -12 " + X(cx - 25) + " -9",
      // filet, coin creusé, côté, coin creusé, fond jusqu'au milieu
      "M" + X(cx - 22) + " 0",
      "H" + X(r),
      "A" + r + " " + r + " 0 0 " + s + " " + X(0) + " " + r.toFixed(1),
      "V" + (h - r).toFixed(1),
      "A" + r + " " + r + " 0 0 " + s + " " + X(r) + " " + h.toFixed(1),
      "H" + X(cx - 7),
      "L" + cx.toFixed(1) + " " + (h + 7).toFixed(1)
    ].join(" ");
  }

  function build(el) {
    var svg = el.querySelector(":scope > svg.frame");
    if (!svg) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "frame");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      for (var i = 0; i < 2; i++) {
        var p = document.createElementNS(NS, "path");
        p.setAttribute("pathLength", "1");
        svg.appendChild(p);
      }
      el.insertBefore(svg, el.firstChild);
      if (el.getAttribute("data-frame") !== "still") el.classList.add("is-draw");
    }
    var w = el.offsetWidth, h = el.offsetHeight;
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.children[0].setAttribute("d", half(w, h, 1));
    svg.children[1].setAttribute("d", half(w, h, -1));
  }

  var els = document.querySelectorAll("[data-frame]");
  Array.prototype.forEach.call(els, build);
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (en) { build(en.target); }); });
    Array.prototype.forEach.call(els, function (el) { ro.observe(el); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { Array.prototype.forEach.call(els, build); });
})();

/* Barre du bas : cachée tant que le bouton principal de la page est visible, pour ne jamais doubler l'action. */
(function () {
  var bar = document.querySelector(".vbar"), act = document.querySelector(".hero-act");
  if (!bar || !act || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(function (en) { bar.classList.toggle("is-off", en[0].isIntersecting); }).observe(act);
})();

/* Anciens liens du hub (QR codes, pages Secret) : /taxi/?from=…&to=… et /taxi/#request ouvraient le formulaire.
   Ils ouvrent maintenant la feuille, avec From et To remplis quand ils sont donnés. booking.js est chargé avant. */
(function () {
  var q = new URLSearchParams(location.search), from = q.get("from"), to = q.get("to");
  if (!from && !to && location.hash !== "#request") return;
  var go = function () {
    var btn = document.querySelector(".hero-act [data-book]");
    if (!btn) return;
    btn.click();
    [["book-from", from], ["book-to", to]].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (el && p[1]) { el.value = p[1]; el.dispatchEvent(new Event("input", { bubbles: true })); }
    });
  };
  if (document.readyState === "complete") go(); else window.addEventListener("load", go);
})();

/* Feuille du hub : From et To ouvrent la liste des lieux populaires (décision du 28.10.2026), qui se réduit pendant
   la saisie et laisse écrire n'importe quel lieu. Pattern ARIA « combobox avec listbox ». Lieux : #taxi-places. */
(function () {
  var data = document.getElementById("taxi-places");
  if (!data) return;
  var places = JSON.parse(data.textContent);
  var norm = function (s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); };

  function setup(input) {
    if (!input) return;
    var id = input.id + "-list";
    var pop = document.createElement("div");
    pop.className = "combo-pop";
    pop.hidden = true;
    pop.innerHTML = '<ul role="listbox" id="' + id + '" aria-label="Popular places">' + places.map(function (p, i) {
      return '<li role="option" id="' + id + "-" + i + '">' + p.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</li>";
    }).join("") + "</ul>";
    input.parentNode.classList.add("combo");
    input.insertAdjacentElement("afterend", pop);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-controls", id);
    var items = Array.prototype.slice.call(pop.querySelectorAll("li"));
    var active = -1;
    var shown = function () { return items.filter(function (li) { return !li.hidden; }); };

    function setActive(i) {
      var list = shown();
      items.forEach(function (li) { li.classList.remove("is-active"); li.removeAttribute("aria-selected"); });
      active = list[i] ? i : -1;
      if (active < 0) { input.removeAttribute("aria-activedescendant"); return; }
      list[i].classList.add("is-active");
      list[i].setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", list[i].id);
      list[i].scrollIntoView({ block: "nearest" });
    }
    function close() { pop.hidden = true; input.setAttribute("aria-expanded", "false"); setActive(-1); }
    // Un lieu déjà choisi remontre toute la liste ; un lieu libre sans correspondance la ferme.
    function open(exact) {
      var q = norm(input.value);
      var all = !q || (exact && places.some(function (p) { return norm(p) === q; }));
      var n = 0;
      items.forEach(function (li) { li.hidden = !(all || norm(li.textContent).indexOf(q) !== -1); if (!li.hidden) n++; });
      if (!n) { close(); return; }
      pop.hidden = false;
      input.setAttribute("aria-expanded", "true");
      setActive(-1);
    }
    function choose(li) {
      input.value = li.textContent;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      close();
    }
    input.addEventListener("focus", function () { open(true); });
    input.addEventListener("click", function () { if (pop.hidden) open(true); });
    input.addEventListener("input", function (e) { if (e.isTrusted) open(false); });
    input.addEventListener("blur", close);
    input.addEventListener("keydown", function (e) {
      var list = shown();
      if (e.key === "ArrowDown") { e.preventDefault(); if (pop.hidden) open(true); else setActive(active + 1 >= list.length ? 0 : active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (!pop.hidden) setActive(active <= 0 ? list.length - 1 : active - 1); }
      else if (e.key === "Enter" && !pop.hidden && active >= 0) { e.preventDefault(); choose(list[active]); }
      else if (e.key === "Escape" && !pop.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
    });
    // mousedown : le champ garde le focus, la liste ne se ferme pas avant le choix.
    pop.addEventListener("mousedown", function (e) {
      e.preventDefault();
      var li = e.target.closest && e.target.closest("li");
      if (li) choose(li);
    });
  }
  setup(document.getElementById("book-from"));
  setup(document.getElementById("book-to"));
})();
