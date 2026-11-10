/* Carte du hub : une ligne touchée ou survolée s'allume, la liste et la carte se répondent.
   Au doigt, un premier toucher montre le trajet, un second (ou le lien) ouvre sa page. À la souris, un clic l'ouvre. */
(function () {
  var map = document.querySelector("[data-map]");
  var dataEl = document.getElementById("map-data");
  if (!map || !dataEl) return;
  var data = JSON.parse(dataEl.textContent);
  var svg = map.querySelector("svg");
  var readout = map.querySelector("[data-readout]");
  var hint = readout.innerHTML;
  var current = null;
  var pointer = "mouse";

  function text(tag, cls, value) {
    var el = document.createElement(tag);
    el.className = cls;
    el.textContent = value;
    return el;
  }

  function select(id) {
    current = id;
    svg.classList.toggle("has-sel", Boolean(id));
    svg.querySelectorAll(".rt").forEach(function (g) { g.classList.toggle("is-on", g.getAttribute("data-route") === id); });
    var ends = id ? data[id].ends : [];
    svg.querySelectorAll(".pl").forEach(function (g) { g.classList.toggle("is-end", ends.indexOf(g.getAttribute("data-place")) > -1); });
    document.querySelectorAll(".row[data-route]").forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-route") === id); });
    if (!id) { readout.innerHTML = hint; readout.classList.remove("is-on"); return; }
    var r = data[id];
    readout.textContent = "";
    var words = text("span", "readout-words", "");
    words.appendChild(text("span", "readout-name", r.name));
    if (r.drive) words.appendChild(text("span", "readout-time", r.drive));
    readout.appendChild(words);
    var go = text("a", "readout-go", "Open this route");
    go.href = "/taxi/" + id + "/";
    readout.appendChild(go);
    readout.classList.add("is-on");
  }

  svg.addEventListener("pointerdown", function (e) { pointer = e.pointerType; });
  svg.addEventListener("pointerover", function (e) {
    if (e.pointerType !== "mouse") return;
    var g = e.target.closest(".rt");
    if (g) select(g.getAttribute("data-route"));
  });
  svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") select(null); });
  svg.addEventListener("click", function (e) {
    var g = e.target.closest(".rt");
    if (!g) { select(null); return; }
    var id = g.getAttribute("data-route");
    if (pointer === "mouse" || current === id) window.location.href = "/taxi/" + id + "/";
    else select(id);
  });

  document.querySelectorAll(".row[data-route]").forEach(function (a) {
    var id = a.getAttribute("data-route");
    a.addEventListener("mouseenter", function () { select(id); });
    a.addEventListener("mouseleave", function () { select(null); });
    a.addEventListener("focus", function () { select(id); });
    a.addEventListener("blur", function () { select(null); });
  });
})();
