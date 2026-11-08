/* Visionneuse photo (chargée au premier geste sur la galerie) : glisser pour changer avec élasticité aux bords,
   pincer ou double-toucher pour zoomer au point touché, tirer vers le bas pour fermer, flèches, Échap, boutons. */
(function () {
  "use strict";
  var V = window.V4;
  var cache = null;
  window.V4_LIGHTBOX = function (gal) {
    if (cache) return cache;
    var $ = V.$, $$ = V.$$, reduce = V.reduce;
    var thumbs = $$("[data-gal-i]", gal);
    var n = thumbs.length;
    var close = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';
    var left = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 6l-6 6 6 6"/></svg>';
    var right = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6"/></svg>';
    var dlg = document.createElement("dialog");
    dlg.className = "lb";
    dlg.setAttribute("aria-label", "Photos of the trip");
    dlg.innerHTML = '<div class="lb__bg"></div><div class="lb__track">' + thumbs.map(function (a) {
      var img = $("img", a);
      return '<div class="lb__slide"><img src="' + a.getAttribute("data-full") + '" alt="' + V.esc(img.alt) + '" width="' + a.getAttribute("data-w") + '" height="' + a.getAttribute("data-h") + '" draggable="false" decoding="async"></div>';
    }).join("") + '</div><div class="lb__bar"><span class="lb__count" aria-live="polite"></span><button class="x" type="button" data-close>' + close + '<span class="sr">Close the photos</span></button></div>' +
      '<button class="lb__nav lb__nav--p" type="button">' + left + '<span class="sr">Previous photo</span></button><button class="lb__nav lb__nav--n" type="button">' + right + '<span class="sr">Next photo</span></button><p class="lb__cap"></p>';
    document.body.appendChild(dlg);
    var track = $(".lb__track", dlg), bg = $(".lb__bg", dlg), imgs = $$(".lb__slide img", dlg);
    var i = 0, z = { s: 1, x: 0, y: 0 }, pts = new Map(), g = null, lastTap = 0;
    var EASE = "cubic-bezier(.22,1,.36,1)";
    var W = function () { return dlg.clientWidth; };
    var rubber = function (d, dim) { return (1 - 1 / (d * 0.55 / dim + 1)) * dim; };
    function place(dx, animate) {
      track.style.transition = animate && !reduce.matches ? "transform 380ms " + EASE : "none";
      track.style.transform = "translate3d(" + (-i * W() + (dx || 0)) + "px,0,0)";
    }
    function zoomTo(s, x, y, animate) {
      z = { s: s, x: x, y: y };
      imgs[i].style.transition = animate && !reduce.matches ? "transform 300ms " + EASE : "none";
      imgs[i].style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")";
    }
    function resetZoom(animate) { if (z.s !== 1 || z.x || z.y) zoomTo(1, 0, 0, animate); }
    function go(k) {
      resetZoom(false);
      i = V.clamp(k, 0, n - 1);
      place(0, true);
      $(".lb__count", dlg).textContent = (i + 1) + " of " + n;
      $(".lb__cap", dlg).textContent = imgs[i].alt;
      $(".lb__nav--p", dlg).disabled = i === 0;
      $(".lb__nav--n", dlg).disabled = i === n - 1;
    }
    function named(el, fn) {
      if (!document.startViewTransition || reduce.matches || !el) { fn(); return; }
      el.style.viewTransitionName = "lb-photo";
      var t = document.startViewTransition(function () { el.style.viewTransitionName = ""; fn(); });
      t.finished.finally(function () { imgs.concat($$("img", gal)).forEach(function (x) { x.style.viewTransitionName = ""; }); });
    }
    function open(k) {
      var th = thumbs[k] && $("img", thumbs[k]);
      named(th, function () {
        dlg.showModal(); bg.style.setProperty("--bg", 1); go(k); place(0, false);
        if (th) imgs[k].style.viewTransitionName = "lb-photo";
      });
    }
    function shut() {
      var th = thumbs[i] && $("img", thumbs[i]);
      resetZoom(false);
      if (th && document.startViewTransition && !reduce.matches) {
        imgs[i].style.viewTransitionName = "lb-photo";
        document.startViewTransition(function () { imgs[i].style.viewTransitionName = ""; dlg.close(); th.style.viewTransitionName = "lb-photo"; })
          .finished.finally(function () { th.style.viewTransitionName = ""; });
      } else dlg.close();
      if (thumbs[i]) thumbs[i].focus({ preventScroll: true });
    }
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); shut(); });
    $("[data-close]", dlg).addEventListener("click", shut);
    $(".lb__nav--p", dlg).addEventListener("click", function () { go(i - 1); });
    $(".lb__nav--n", dlg).addEventListener("click", function () { go(i + 1); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
      if (e.key === "+" || e.key === "=") { var r = imgs[i].getBoundingClientRect(); toggleZoom(r.left + r.width / 2, r.top + r.height / 2, true); }
      if (e.key === "-") resetZoom(true);
    });
    addEventListener("resize", function () { if (dlg.open) place(0, false); });

    var dist = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    track.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      track.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var arr = Array.from(pts.values());
      if (arr.length === 2) {
        var r = imgs[i].getBoundingClientRect();
        g = { mode: "pinch", d0: dist(arr[0], arr[1]), s0: z.s, x0: z.x, y0: z.y, ox: r.left - z.x, oy: r.top - z.y, mx: (arr[0].x + arr[1].x) / 2, my: (arr[0].y + arr[1].y) / 2 };
        return;
      }
      g = { mode: null, x0: e.clientX, y0: e.clientY, t: e.timeStamp, lx: e.clientX, ly: e.clientY, vx: 0, vy: 0, zx: z.x, zy: z.y };
    });
    track.addEventListener("pointermove", function (e) {
      if (!pts.has(e.pointerId) || !g) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.mode === "pinch") {
        var arr = Array.from(pts.values());
        if (arr.length < 2) return;
        var s = V.clamp(g.s0 * dist(arr[0], arr[1]) / g.d0, 1, 4);
        var px = g.mx - g.ox, py = g.my - g.oy;
        zoomTo(s, px - (px - g.x0) * (s / g.s0), py - (py - g.y0) * (s / g.s0));
        return;
      }
      var dx = e.clientX - g.x0, dy = e.clientY - g.y0, dt = Math.max(1, e.timeStamp - g.t);
      g.vx = 0.8 * (e.clientX - g.lx) / dt + 0.2 * g.vx; g.vy = 0.8 * (e.clientY - g.ly) / dt + 0.2 * g.vy;
      g.lx = e.clientX; g.ly = e.clientY; g.t = e.timeStamp;
      if (z.s > 1) { zoomTo(z.s, g.zx + dx, g.zy + dy); return; }
      if (!g.mode && Math.hypot(dx, dy) > 8) g.mode = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.mode === "x") {
        var edge = (i === 0 && dx > 0) || (i === n - 1 && dx < 0);
        place(edge ? Math.sign(dx) * rubber(Math.abs(dx), W() / 3) : dx, false);
      } else if (g.mode === "y") {
        var k = Math.max(0, dy);
        track.style.transition = "none";
        track.style.transform = "translate3d(" + (-i * W()) + "px," + (dy > 0 ? dy : -rubber(-dy, 80)) + "px,0) scale(" + (1 - Math.min(k, 400) / 2000) + ")";
        bg.style.setProperty("--bg", 1 - Math.min(k, 400) / 500);
      }
    });
    function up(e) {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (!g) return;
      if (g.mode === "pinch") { if (pts.size === 0) { if (z.s < 1.05) resetZoom(true); g = null; } return; }
      var dx = e.clientX - g.x0, dy = e.clientY - g.y0, mode = g.mode, vx = g.vx, vy = g.vy;
      g = null;
      if (mode === "x") {
        var k = i;
        if (dx < -W() * 0.2 || vx < -0.4) k = i + 1; else if (dx > W() * 0.2 || vx > 0.4) k = i - 1;
        go(k);
      } else if (mode === "y") {
        if (dy > 110 || vy > 0.5) { track.style.transform = ""; bg.style.setProperty("--bg", 1); shut(); }
        else { track.style.transition = "transform 320ms " + EASE; track.style.transform = "translate3d(" + (-i * W()) + "px,0,0)"; bg.style.setProperty("--bg", 1); }
      } else if (!mode && e.pointerType !== "mouse") {
        if (e.timeStamp - lastTap < 300) { toggleZoom(e.clientX, e.clientY); lastTap = 0; } else lastTap = e.timeStamp;
      }
    }
    function toggleZoom(cx, cy) {
      if (z.s > 1) { resetZoom(true); return; }
      var r = imgs[i].getBoundingClientRect(), s = 2.4, px = cx - r.left, py = cy - r.top;
      zoomTo(s, px - px * s, py - py * s, true);
    }
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    var lastType = "mouse";
    track.addEventListener("pointerdown", function (e) { lastType = e.pointerType; }, true);
    track.addEventListener("dblclick", function (e) { if (lastType === "mouse") toggleZoom(e.clientX, e.clientY); });
    track.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      var r = imgs[i].getBoundingClientRect(), s = V.clamp(z.s * (1 - e.deltaY / 200), 1, 4), px = e.clientX - (r.left - z.x), py = e.clientY - (r.top - z.y);
      zoomTo(s, px - (px - z.x) * (s / z.s), py - (py - z.y) * (s / z.s));
    }, { passive: false });
    cache = { open: open };
    return cache;
  };
})();
