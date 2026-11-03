/* Design v3 : filet du header au défilement, menu plein écran, barre collante mobile (après 480 px,
   cachée quand la feuille est ouverte, voir v3.css), galerie avec compteur et visionneuse plein écran. */
(function () {
  "use strict";

  var hd = document.querySelector("[data-hd]");
  var bar = document.querySelector("[data-mbar]");
  var onScroll = function () {
    var y = window.scrollY || 0;
    if (hd) hd.classList.toggle("is-scrolled", y > 0);
    if (bar) bar.classList.toggle("is-shown", y > 480);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var menu = document.getElementById("menu");
  if (menu && typeof menu.showModal === "function") {
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-open]")) menu.showModal();
      else if (e.target.closest("[data-menu-close]") || (menu.open && e.target.closest("#menu a"))) menu.close();
    });
  }

  var gallery = document.querySelector("[data-gallery]");
  var viewer = document.querySelector("[data-viewer]");
  if (gallery) {
    var items = gallery.querySelectorAll("[data-view]");
    var index = document.querySelector("[data-gallery-index]");
    // Compteur mobile : la photo la plus à gauche de la piste.
    gallery.addEventListener("scroll", function () {
      var best = 0, min = Infinity;
      for (var i = 0; i < items.length; i++) {
        var d = Math.abs(items[i].offsetLeft - gallery.offsetLeft - gallery.scrollLeft);
        if (d < min) { min = d; best = i; }
      }
      var end = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 4;
      if (index) index.textContent = (end ? items.length : best + 1);
    }, { passive: true });

    if (viewer && typeof viewer.showModal === "function") {
      var img = viewer.querySelector("[data-viewer-img]");
      var vi = viewer.querySelector("[data-viewer-index]");
      var current = 0;
      var show = function (i) {
        current = (i + items.length) % items.length;
        img.src = items[current].getAttribute("data-full");
        img.alt = items[current].getAttribute("data-alt");
        vi.textContent = current + 1;
      };
      gallery.addEventListener("click", function (e) {
        var b = e.target.closest("[data-view]");
        if (!b || matchMedia("(max-width: 767px)").matches) return;
        show(Number(b.getAttribute("data-view")));
        viewer.showModal();
      });
      viewer.querySelector("[data-viewer-prev]").addEventListener("click", function () { show(current - 1); });
      viewer.querySelector("[data-viewer-next]").addEventListener("click", function () { show(current + 1); });
      viewer.querySelector("[data-viewer-close]").addEventListener("click", function () { viewer.close(); });
      viewer.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") show(current + 1);
        if (e.key === "ArrowLeft") show(current - 1);
      });
    }
  }
})();
