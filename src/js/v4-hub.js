/* Hub /tours/ v4 : type et tri (les cartes qui restent glissent à leur place), compteur qui roule, état dans l'adresse
   (?type=boat&sort=asc, ou #boat-trips et #activities depuis le menu), comparateur avec tiroir et tableau. */
(function () {
  "use strict";
  var V = window.V4;
  if (!V) return;
  var $ = V.$, $$ = V.$$;
  var grid = $("[data-grid]");
  if (!grid) return;
  var cards = $$(".card", grid);
  var order = cards.slice();
  var q = new URLSearchParams(location.search);
  var hash = location.hash.slice(1);
  var st = {
    type: q.get("type") || (hash === "boat-trips" ? "boat" : hash === "activities" ? "activity" : "all"),
    sort: q.get("sort") || ""
  };
  if (["all", "boat", "activity"].indexOf(st.type) < 0) st.type = "all";
  if (["", "asc", "desc"].indexOf(st.sort) < 0) st.sort = "";
  var sortEl = $("[data-sort]"), n = $('[data-odo="n"]'), nl = $("[data-n-l]");
  sortEl.value = st.sort;

  function visible() {
    var list = order.filter(function (c) { return st.type === "all" || c.getAttribute("data-kind") === st.type; });
    if (st.sort) list = list.slice().sort(function (a, b) {
      var pa = Number(a.getAttribute("data-from")) || Infinity, pb = Number(b.getAttribute("data-from")) || Infinity;
      if (pa === pb) return 0;
      // « Price on WhatsApp » reste en fin de liste dans les deux sens.
      return st.sort === "asc" ? pa - pb : pa === Infinity ? 1 : pb === Infinity ? -1 : pb - pa;
    });
    return list;
  }
  function apply() {
    var list = visible();
    cards.forEach(function (c) { c.hidden = list.indexOf(c) < 0; });
    list.forEach(function (c) { grid.appendChild(c); });
    cards.filter(function (c) { return c.hidden; }).forEach(function (c) { grid.appendChild(c); });
    V.odo(n, list.length);
    nl.textContent = list.length === 1 ? "trip" : "trips";
    var u = new URLSearchParams();
    if (st.type !== "all") u.set("type", st.type);
    if (st.sort) u.set("sort", st.sort);
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  }
  // Noms de transition posés le temps du réagencement (sinon les 13 cartes s'animeraient en quittant la page).
  function reflow() {
    var name = function (on) { cards.forEach(function (c) { c.style.viewTransitionName = on ? "c-" + c.getAttribute("data-slug") : ""; }); };
    name(true);
    return V.vt(apply).then(function () { name(false); });
  }
  var typeSeg = V.seg($('[data-seg="type"]'), function (v) { st.type = v; reflow(); });
  typeSeg.select(st.type, true);
  sortEl.addEventListener("change", function () { st.sort = sortEl.value; reflow(); });
  if (st.type !== "all" || st.sort) apply();
  else V.odo(n, cards.length);

  // ---------- Comparateur : jusqu'à trois sorties, la vignette s'envole jusqu'au tiroir ----------
  var tray = $("[data-tray]"), slots = $("[data-slots]"), txt = $("[data-tray-t]"), go = $("[data-cmp-go]"), dlg = $("[data-cmpd]"), MAX = 3;
  var picked = [];
  function card(slug) { return $('.card[data-slug="' + slug + '"]', grid); }
  function drawTray() {
    slots.innerHTML = Array.from({ length: MAX }, function (_, i) {
      var s = picked[i], ph = s && $(".ph", card(s));
      return '<span class="tray__slot" data-i="' + i + '">' + (ph ? ph.outerHTML.replace(/ alt="[^"]*"/, ' alt=""') : "") + "</span>";
    }).join("");
    V.bindImgs(slots);
    var k = picked.length;
    tray.hidden = k === 0;
    txt.textContent = k === 1 ? "Tick one more trip to compare." : k === MAX ? "Three trips is the most you can compare." : k + " trips ticked.";
    go.disabled = k < 2;
    go.textContent = k < 2 ? "Compare" : "Compare " + k + " trips";
    $$("[data-compare]", grid).forEach(function (i) { i.checked = picked.indexOf(i.value) > -1; i.disabled = !i.checked && k >= MAX; });
  }
  function fly(slug) {
    if (V.reduce.matches) return;
    var from = $(".ph", card(slug)), to = $('.tray__slot[data-i="' + picked.indexOf(slug) + '"]', slots);
    if (!from || !to) return;
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var f = document.createElement("div");
    f.className = "fly";
    f.innerHTML = from.innerHTML;
    Object.assign(f.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
    document.body.appendChild(f);
    f.animate([{ transform: "none" }, { transform: "translate(" + (b.left - a.left) + "px," + (b.top - a.top) + "px) scale(" + b.width / a.width + "," + b.height / a.height + ")" }],
      { duration: 520, easing: "cubic-bezier(.5,0,.2,1)" }).finished.then(function () { f.remove(); });
    to.animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], { duration: 560 });
  }
  grid.addEventListener("change", function (e) {
    var i = e.target.closest("[data-compare]");
    if (!i) return;
    if (i.checked) { picked.push(i.value); drawTray(); requestAnimationFrame(function () { fly(i.value); }); V.catalog(); }
    else { picked = picked.filter(function (s) { return s !== i.value; }); drawTray(); }
  });
  $("[data-cmp-clear]").addEventListener("click", function () { picked = []; drawTray(); });
  go.addEventListener("click", function () {
    V.catalog().then(function (cat) {
      var ps = picked.map(function (s) { return cat[s]; });
      var labels = [];
      ps.forEach(function (p) { p.compare.forEach(function (r) { if (labels.indexOf(r[0]) < 0) labels.push(r[0]); }); });
      var val = function (p, l) { var r = p.compare.filter(function (x) { return x[0] === l; })[0]; return r ? r[1] : ""; };
      $("[data-cmpd-t]", dlg).innerHTML = '<table><caption class="sr">Trips side by side</caption><thead><tr><td></td>' + ps.map(function (p) {
        var ph = $(".ph", card(p.slug));
        return '<th scope="col">' + (ph ? ph.outerHTML.replace(/ alt="[^"]*"/, ' alt=""') : "") + '<a href="' + p.url + '">' + V.esc(p.name) + "</a></th>";
      }).join("") + "</tr></thead><tbody>" + labels.map(function (l) {
        return '<tr><th scope="row">' + V.esc(l) + "</th>" + ps.map(function (p) { var v = val(p, l); return v ? "<td>" + V.esc(v) + "</td>" : '<td class="none">Not on the trip page</td>'; }).join("") + "</tr>";
      }).join("") + "</tbody></table>";
      V.bindImgs(dlg);
      dlg.showModal();
    });
  });
  $("[data-close]", dlg).addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  drawTray();
})();
