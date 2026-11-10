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
