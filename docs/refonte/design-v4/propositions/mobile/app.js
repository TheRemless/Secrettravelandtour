/* Secret Travel & Tour, prototype « mobile ». Toutes les valeurs viennent de data.js (généré depuis src/_data). */
(function () {
  const D = window.STT;
  const IMG = "../../../../../src/images/";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n).toLocaleString("en-GB");
  const thb = (n) => fmt(n) + " THB";

  /* ---------- icônes (traits 1.8, une seule famille) ---------- */
  const I = {
    explore: '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    trips: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    week: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    wa: '<path d="M4 20.5l1.3-3.9A8.4 8.4 0 1 1 8.1 19.3z"/><path d="M9.2 8.6c.3-.6.6-.6 1-.6.3 0 .5.4.8 1.1.2.5-.5 1-.6 1.3.4 1 1.3 1.9 2.4 2.4.3-.1.8-.8 1.2-.6.7.3 1.2.6 1.2.9 0 .5-.5 1.4-1.5 1.4-2.3 0-5.2-2.8-5.2-5 0-.4.3-.7.7-.9z"/>',
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    compare: '<rect x="3.5" y="4.5" width="7" height="15" rx="1.5"/><rect x="13.5" y="4.5" width="7" height="15" rx="1.5"/>',
    sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  /* ---------- données ---------- */
  const products = D.products;
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  const fact = (p, label) => (p.facts || []).find((f) => f.label === label)?.value || null;
  const photo = (id, { cls = "", eager = false, sizes = "" } = {}) => {
    const p = D.photos[id];
    if (!p) return `<div class="ph-missing ${cls}" role="img" aria-label="Photo à fournir"><span class="missing">[DONNÉE À FOURNIR : photo]</span></div>`;
    return `<img class="${cls}" src="${IMG + p.file}" alt="${esc(p.alt)}" style="object-position:${p.position || "50% 50%"}" ${eager ? "" : 'loading="lazy"'} decoding="async">`;
  };
  const pageUrl = (p) => (p.slug === "4-islands" ? "4-islands.html" : null);

  const traits = (p) => {
    const opts = p.options || [];
    const prices = opts.flatMap((o) => o.prices || []);
    const kidRates = prices.filter((x) => x.ages && /child/i.test(x.label) && x.amount > 0);
    const dur = fact(p, "Duration") || "";
    const labels = (p.facts || []).map((f) => f.label);
    return {
      boat: p.folder === "tours",
      kids: kidRates.length > 0,
      under4: prices.some((x) => x.amount === 0 && x.ages && x.ages.max != null),
      private: opts.some((o) => o.kind === "private"),
      priceShown: !p.priceOnRequest,
      full: /^full day/i.test(dur) || labels.includes("Full days"),
      half: /half day/i.test(dur) || labels.includes("Half days"),
      duration: dur || null,
      pickup: fact(p, "Hotel pickup"),
      season: fact(p, "Season"),
    };
  };

  /* ---------- dates ---------- */
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const short = (d) => `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  const long = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const rel = (d) => { const n = Math.round((d - today()) / 864e5); return n === 0 ? "Today" : n === 1 ? "Tomorrow" : DAYS[d.getDay()].slice(0, 3); };

  /* Disponibilité lue dans les faits : saison (« October to April ») et jours de cours (« Monday, Wednesday… »). */
  function availability(p, d) {
    const season = fact(p, "Season");
    if (season && !/all year/i.test(season)) {
      const m = season.match(/(\w+) to (\w+)/);
      if (m) {
        const a = MONTHS.indexOf(m[1]), b = MONTHS.indexOf(m[2]), x = d.getMonth();
        const inSeason = a <= b ? x >= a && x <= b : x >= a || x <= b;
        if (a >= 0 && b >= 0 && !inSeason) return { ok: false, why: `Season: ${season}` };
      }
    }
    const classFacts = (p.facts || []).filter((f) => /class$/i.test(f.label) && !/carving/i.test(f.label));
    if (classFacts.length) {
      const days = new Set();
      classFacts.forEach((f) => DAYS.forEach((dn) => { if (f.value.includes(dn)) days.add(dn); }));
      if (days.size && !days.has(DAYS[d.getDay()])) return { ok: false, why: `No class on ${DAYS[d.getDay()]}s` };
    }
    return { ok: true };
  }

  /* ---------- prix ---------- */
  function model(o) {
    if (!o || o.priceOnRequest || !o.prices) return { type: "request" };
    const ps = o.prices;
    const tiers = ps.filter((x) => x.group && !x.supplement && x.amount != null && !/^for \d/i.test(x.label));
    const adult = ps.find((x) => (x.label === "Adult" || x.label === "Per person") && !x.group);
    const kids = ps.filter((x) => x.ages && /child/i.test(x.label) && x.amount != null);
    const extra = ps.find((x) => x.supplement && /extra person/i.test(x.label));
    const addons = ps.filter((x) => x.supplement && /^add /i.test(x.label));
    if (tiers.length) return { type: "group", tiers, kids, extra, addons };
    if (adult) return { type: "person", adult, kids, addons };
    return { type: "list" };
  }
  function kidPrice(m, age, fallback) {
    const r = m.kids.find((k) => age >= (k.ages.min ?? 0) && age <= (k.ages.max ?? 99));
    if (r) return { amount: r.amount, label: r.label };
    const maxKid = Math.max(...m.kids.map((k) => k.ages.max ?? -1), -1);
    if (age > maxKid && fallback != null) return { amount: fallback, label: "Adult rate" };
    return null;
  }
  /* Renvoie {total, lines, missing[]} ; total null si le prix n'est pas calculable depuis les données. */
  function quote(o, pax, addons = []) {
    const m = model(o), lines = [], missing = [];
    const n = pax.adults + pax.kids.length;
    if (m.type === "request" || m.type === "list") return { total: null, lines, missing, type: m.type };
    let total = 0;
    if (m.type === "person") {
      if (pax.adults) { lines.push([`${pax.adults} × ${m.adult.label}`, pax.adults * m.adult.amount]); total += pax.adults * m.adult.amount; }
      pax.kids.forEach((age) => {
        const k = kidPrice(m, age, m.adult.amount);
        if (!k) missing.push(`tarif pour un enfant de ${age} ans (${o.label})`);
        else { lines.push([`Child, age ${age} (${k.label})`, k.amount]); total += k.amount; }
      });
    } else {
      const tier = m.tiers.find((t) => n >= (t.group.min ?? 1) && n <= (t.group.max ?? 999));
      const top = m.tiers.reduce((a, t) => ((t.group.max ?? 999) > (a.group.max ?? 999) ? t : a), m.tiers[0]);
      if (tier && /per person/i.test(tier.unit || "")) {
        lines.push([`${pax.adults} × ${tier.label}`, pax.adults * tier.amount]); total += pax.adults * tier.amount;
        pax.kids.forEach((age) => {
          const k = kidPrice(m, age, tier.amount);
          if (!k) missing.push(`tarif pour un enfant de ${age} ans (${o.label})`);
          else { lines.push([`Child, age ${age} (${k.label})`, k.amount]); total += k.amount; }
        });
      } else if (tier) { lines.push([tier.label, tier.amount]); total += tier.amount; }
      else if (n > (top.group.max ?? 999) && m.extra) {
        const ex = n - top.group.max;
        lines.push([top.label, top.amount], [`${ex} × ${m.extra.label}`, ex * m.extra.amount]);
        total += top.amount + ex * m.extra.amount;
      } else return { total: null, lines: [], missing, type: "group-over" };
    }
    m.addons.forEach((a) => { if (addons.includes(a.label)) { lines.push([a.label, a.amount]); total += a.amount; } });
    return { total: missing.length ? null : total, lines, missing, type: m.type };
  }
  function fees(o, pax) {
    const out = [];
    (o?.notIncludedFees || []).forEach((f) => {
      if (f.label === "National park fee, adult" && pax.adults) out.push([`${pax.adults} × park fee, adult`, pax.adults * f.amount, f.note]);
      if (f.label === "National park fee, child" && pax.kids.length) out.push([`${pax.kids.length} × park fee, child`, pax.kids.length * f.amount, f.note]);
      if (f.label === "Village entrance fee") { const n = pax.adults + pax.kids.length; out.push([`${n} × village entrance fee`, n * f.amount, f.note]); }
    });
    return out;
  }
  const paxText = (pax) => {
    const a = `${pax.adults} adult${pax.adults === 1 ? "" : "s"}`;
    if (!pax.kids.length) return a;
    return `${a}, ${pax.kids.length} child${pax.kids.length === 1 ? "" : "ren"} (age ${pax.kids.join(", ")})`;
  };

  /* ---------- feuilles ---------- */
  let scrim, lastFocus, openStack = [];
  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement("div");
    scrim.className = "scrim"; scrim.hidden = true;
    scrim.addEventListener("click", () => closeSheet());
    document.body.append(scrim);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openStack.length) closeSheet(); });
    return scrim;
  }
  function makeSheet(id, title) {
    let s = document.getElementById(id);
    if (s) return s;
    s = document.createElement("div");
    s.className = "sheet"; s.id = id; s.hidden = true;
    s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-labelledby", id + "-t");
    s.innerHTML = `<div class="grab" aria-hidden="true"></div><header><h2 id="${id}-t">${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">${icon("close")}</button></header><div class="body"></div><footer hidden></footer>`;
    s.querySelector("[data-close]").addEventListener("click", () => closeSheet());
    dragToClose(s);
    document.body.append(s);
    return s;
  }
  function openSheet(s) {
    ensureScrim();
    lastFocus = document.activeElement;
    s.hidden = false; scrim.hidden = false;
    requestAnimationFrame(() => { s.classList.add("open"); scrim.classList.add("open"); });
    openStack.push(s);
    document.documentElement.style.overflow = "hidden";
    setTimeout(() => s.querySelector("[data-close]")?.focus({ preventScroll: true }), 60);
  }
  function closeSheet() {
    const s = openStack.pop(); if (!s) return;
    s.classList.remove("open"); s.style.transform = "";
    if (!openStack.length) { scrim.classList.remove("open"); document.documentElement.style.overflow = ""; }
    setTimeout(() => { s.hidden = true; if (!openStack.length) scrim.hidden = true; }, 320);
    lastFocus?.focus?.({ preventScroll: true });
  }
  function dragToClose(s) {
    const g = s.querySelector(".grab"); let y0 = null, dy = 0;
    g.addEventListener("pointerdown", (e) => { y0 = e.clientY; dy = 0; g.setPointerCapture(e.pointerId); s.style.transition = "none"; });
    g.addEventListener("pointermove", (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); s.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; s.style.transition = ""; y0 = null; if (dy > 90) closeSheet(); else s.style.transform = ""; };
    g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
  }

  /* ---------- toast ---------- */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite"); document.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  /* ---------- ruban de dates ---------- */
  function ribbon(el, { selected, onSelect, days = 14, mark } = {}) {
    let sel = selected || iso(today());
    const draw = () => {
      const t = today();
      let html = "";
      for (let i = 0; i < days; i++) {
        const d = addDays(t, i), k = iso(d);
        const r = i < 2 ? rel(d) : DAYS[d.getDay()].slice(0, 3);
        const extra = mark ? mark(d) : "";
        html += `<button type="button" class="day" data-d="${k}" aria-pressed="${k === sel}" aria-label="${long(d)}${extra ? ", " + esc(extra) : ""}"><span class="dw">${r}</span><span class="dn">${d.getDate()}</span><span class="dm">${MONTHS[d.getMonth()].slice(0, 3)}</span></button>`;
      }
      const other = fromIso(sel) > addDays(t, days - 1);
      html += `<label class="day other" aria-pressed="${other}"><span class="dw">${other ? short(fromIso(sel)).slice(0, 3) : "Other"}</span><span class="dn">${other ? fromIso(sel).getDate() : "+"}</span><span class="dm">${other ? MONTHS[fromIso(sel).getMonth()].slice(0, 3) : "date"}</span><input type="date" min="${iso(t)}" value="${sel}" aria-label="Choose another date"></label>`;
      el.innerHTML = html;
      el.setAttribute("role", "group");
    };
    draw();
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button.day"); if (!b) return;
      sel = b.dataset.d; $$("button.day", el).forEach((x) => x.setAttribute("aria-pressed", x === b)); $(".day.other", el).setAttribute("aria-pressed", "false");
      onSelect?.(sel);
    });
    el.addEventListener("change", (e) => {
      if (e.target.type !== "date" || !e.target.value) return;
      sel = e.target.value; draw(); onSelect?.(sel);
      $(`[aria-pressed="true"]`, el)?.scrollIntoView({ inline: "center", block: "nearest" });
    });
    return { get value() { return sel; }, set(v) { sel = v; draw(); } };
  }

  /* ---------- compteurs de personnes ---------- */
  function paxControl(el, pax, onChange, { minAdults = 1 } = {}) {
    const draw = () => {
      el.innerHTML = `
        <div class="stepper-row"><div><b>Adults</b></div><div class="stepper"><button type="button" data-a="-1" aria-label="One adult less" ${pax.adults <= minAdults ? "disabled" : ""}>−</button><output aria-live="polite">${pax.adults}</output><button type="button" data-a="1" aria-label="One adult more">+</button></div></div>
        <div class="stepper-row"><div><b>Children</b><span>Ages change the price</span></div><div class="stepper"><button type="button" data-k="-1" aria-label="One child less" ${pax.kids.length ? "" : "disabled"}>−</button><output aria-live="polite">${pax.kids.length}</output><button type="button" data-k="1" aria-label="One child more">+</button></div></div>
        ${pax.kids.length ? `<div class="ages">${pax.kids.map((a, i) => `<label>Child ${i + 1}<select data-i="${i}" aria-label="Age of child ${i + 1}">${Array.from({ length: 12 }, (_, n) => `<option value="${n}" ${n === a ? "selected" : ""}>${n === 0 ? "under 1" : n + (n === 1 ? " year" : " years")}</option>`).join("")}</select></label>`).join("")}</div>` : ""}`;
    };
    draw();
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.a) pax.adults = Math.max(minAdults, pax.adults + Number(b.dataset.a));
      if (b.dataset.k === "1") pax.kids.push(6);
      if (b.dataset.k === "-1") pax.kids.pop();
      draw(); onChange?.();
    });
    el.addEventListener("change", (e) => { const s = e.target.closest("select[data-i]"); if (!s) return; pax.kids[+s.dataset.i] = Number(s.value); onChange?.(); });
    return { redraw: draw };
  }

  /* ---------- semaine (localStorage) ---------- */
  const KEY = "stt-mobile-week";
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} document.dispatchEvent(new CustomEvent("week:change")); },
    add(item) { const v = store.get(); v.push({ ...item, id: Date.now().toString(36) }); v.sort((a, b) => a.date.localeCompare(b.date)); store.set(v); },
    remove(id) { store.set(store.get().filter((x) => x.id !== id)); },
    clear() { store.set([]); },
  };
  const optionOf = (it) => bySlug[it.slug]?.options?.find((o) => o.id === it.option);

  function tripLines(it) {
    const p = bySlug[it.slug], o = optionOf(it), q = quote(o, it.pax, it.addons || []);
    const out = [`${p.name}${o ? ", " + o.label : ""}`, `People: ${paxText(it.pax)}`];
    if ((it.addons || []).length) out.push(`Extra: ${it.addons.join(", ")}`);
    out.push(q.total != null ? `Price on the site: ${thb(q.total)}` : "Price: please confirm");
    const f = fees(o, it.pax); if (f.length) out.push(`Fees in cash on the day: ${thb(f.reduce((s, x) => s + x[1], 0))}`);
    return out;
  }
  function message(items, { name, hotel, note } = {}) {
    const L = [items.length > 1 ? "Hello Secret Travel & Tour, I would like to book these trips:" : "Hello Secret Travel & Tour, I would like to book:", ""];
    let last = null;
    items.forEach((it) => {
      if (it.date !== last) { L.push(`${long(fromIso(it.date))}`); last = it.date; }
      tripLines(it).forEach((l, i) => L.push((i === 0 ? "- " : "  ") + l));
      L.push("");
    });
    if (hotel) L.push(`Pickup hotel: ${hotel}`);
    if (name) L.push(`Name: ${name}`);
    if (note) L.push(`Note: ${note}`);
    return L.join("\n").trim();
  }
  const waLink = (text) => `${D.site.whatsapp.link}?text=${encodeURIComponent(text)}`;

  function weekSheet() {
    const s = makeSheet("week-sheet", "My week");
    const body = $(".body", s), foot = $("footer", s);
    const draft = (() => { try { return JSON.parse(sessionStorage.getItem("stt-week-draft")) || {}; } catch { return {}; } })();
    const render = () => {
      const items = store.get();
      if (!items.length) {
        body.innerHTML = `<div class="empty"><p><b>Nothing in your week yet.</b></p><p class="small">On any trip, choose a day and the people, then tap “Add to my week”. Every trip you add ends up in one WhatsApp message, day by day.</p><p style="margin-top:16px"><a class="btn ghost" href="tours.html">See all trips</a></p></div>`;
        foot.hidden = true; return;
      }
      const days = {};
      items.forEach((it) => (days[it.date] ||= []).push(it));
      let total = 0, unknown = 0;
      body.innerHTML = Object.entries(days).map(([d, list]) => {
        const dd = fromIso(d);
        return `<div class="week-day"><div class="date"><b>${dd.getDate()}</b><span>${DAYS[dd.getDay()].slice(0, 3)} ${MONTHS[dd.getMonth()].slice(0, 3)}</span></div><div>${list.map((it) => {
          const p = bySlug[it.slug], o = optionOf(it), q = quote(o, it.pax, it.addons || []);
          if (q.total != null) total += q.total; else unknown++;
          const av = availability(p, dd);
          return `<div class="week-item"><div><b>${esc(p.name)}</b><span>${esc(o?.label || "")}</span><span>${esc(paxText(it.pax))}</span><span class="price num">${q.total != null ? thb(q.total) : "Price confirmed on WhatsApp"}</span>${av.ok ? "" : `<span class="why">${esc(av.why)}</span>`}</div><button class="mini-btn rm" data-rm="${it.id}" aria-label="Remove ${esc(p.name)} on ${short(dd)}">Remove</button></div>`;
        }).join("")}</div></div>`;
      }).join("") + `<p class="small" style="margin-top:12px">${items.length} trip${items.length > 1 ? "s" : ""} on ${Object.keys(days).length} day${Object.keys(days).length > 1 ? "s" : ""}. Prices shown: <b class="num">${thb(total)}</b>${unknown ? `, plus ${unknown} price${unknown > 1 ? "s" : ""} to confirm` : ""}. Nothing is paid online.</p>
        <div class="field"><label for="wk-hotel">Pickup hotel</label><input id="wk-hotel" autocomplete="off" value="${esc(draft.hotel || "")}"></div>
        <div class="field"><label for="wk-name">Your name</label><input id="wk-name" autocomplete="name" value="${esc(draft.name || "")}"></div>
        <details class="qa" style="margin-top:12px"><summary>Read the message</summary><div class="msg" id="wk-msg"></div></details>`;
      const upd = () => {
        draft.hotel = $("#wk-hotel", body).value.trim(); draft.name = $("#wk-name", body).value.trim();
        try { sessionStorage.setItem("stt-week-draft", JSON.stringify(draft)); } catch {}
        const m = message(items, draft);
        $("#wk-msg", body).textContent = m; $("#wk-send", foot).href = waLink(m);
      };
      foot.hidden = false;
      foot.innerHTML = `<a class="btn block" id="wk-send" target="_blank" rel="noopener">${icon("wa")}Send my week on WhatsApp</a><button class="link-btn" id="wk-clear" type="button">Empty my week</button>`;
      body.oninput = upd; upd();
      $("#wk-clear", foot).onclick = () => { store.clear(); toast("Your week is empty"); };
    };
    body.addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (b) { store.remove(b.dataset.rm); toast("Trip removed"); } });
    document.addEventListener("week:change", render);
    render();
    return s;
  }
  const openWeek = () => openSheet(weekSheet());

  /* ---------- barre d'onglets + navigation bureau ---------- */
  function chrome(current) {
    const n = store.get().length;
    const tabs = [
      ["index", "home.html", "Explore", "explore"],
      ["tours", "tours.html", "Trips", "trips"],
    ];
    const nav = document.createElement("nav");
    nav.className = "tabbar"; nav.setAttribute("aria-label", "Main");
    nav.innerHTML = `<ul>${tabs.map(([k, h, l, i]) => `<li><a href="${h}" ${k === current ? 'aria-current="page"' : ""}>${icon(i)}${l}</a></li>`).join("")}
      <li><button type="button" data-week>${icon("week")}My week<span class="count num" ${n ? "" : "hidden"}>${n}</span></button></li>
      <li><a href="${D.site.whatsapp.link}" target="_blank" rel="noopener">${icon("wa")}<i class="wa-dot" aria-hidden="true"></i>WhatsApp</a></li></ul>`;
    document.body.append(nav);
    document.body.classList.add("has-tabbar");
    const top = $(".topnav");
    if (top) top.innerHTML = `<a href="home.html" ${current === "index" ? 'aria-current="page"' : ""}>Explore</a><a href="tours.html" ${current === "tours" ? 'aria-current="page"' : ""}>Trips</a><button type="button" data-week>My week<span class="count num" ${n ? "" : "hidden"}>${n}</span></button><a class="wa" href="${D.site.whatsapp.link}" target="_blank" rel="noopener"><i aria-hidden="true"></i>${esc(D.site.whatsapp.display)}</a>`;
    document.addEventListener("click", (e) => { if (e.target.closest("[data-week]")) openWeek(); });
    document.addEventListener("week:change", () => { const c = store.get().length; $$(".count").forEach((x) => { x.textContent = c; x.hidden = !c; }); });
    const bar = $(".appbar");
    if (bar) { const on = () => bar.classList.toggle("scrolled", scrollY > 8); addEventListener("scroll", on, { passive: true }); on(); }
  }

  /* ---------- pied de page ---------- */
  function footer(el) {
    const s = D.site;
    const boats = products.filter((p) => p.folder === "tours"), acts = products.filter((p) => p.folder === "activities");
    const li = (p) => `<li><a href="${pageUrl(p) || "tours.html#" + p.slug}">${esc(p.name)}</a></li>`;
    el.innerHTML = `<div class="wrap on-deep"><div class="cols">
      <div><img src="${IMG}secret/emblem.webp" alt="${esc(s.secret.name)}" width="56" height="56" style="border-radius:50%;background:#fff"><p style="margin-top:12px">WhatsApp <a href="${s.whatsapp.link}">${esc(s.whatsapp.display)}</a></p><p class="small" style="color:var(--on-deep-mute)">Booking on WhatsApp. Payment ${s.booking.payment.join(" or ")}, nothing online.</p></div>
      <div><h2>${esc(D.home.boats.title)}</h2><ul>${boats.map(li).join("")}</ul></div>
      <div><h2>${esc(D.home.activities.title)}</h2><ul>${acts.map(li).join("")}</ul></div>
      <div><h2>${esc(D.home.transfers.title)}</h2><ul>${D.home.transfers.items.map((t) => `<li><a href="#" data-out="${esc(t.href)}">${esc(t.title)}</a></li>`).join("")}<li><a href="#" data-out="/tours/rental/">${esc(D.home.rental.title)}</a></li></ul></div>
    </div><p class="legal">${esc(s.secret.name)} is operated by ${esc(s.operator.name)}, registration ${esc(s.operator.registration)}, licence ${esc(s.secret.licence)}. <a href="#" data-out="${esc(s.booking.terms)}">Terms</a></p></div>`;
  }
  /* Liens vers des pages hors prototype : on prévient au lieu d'ouvrir une page vide. */
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-out]"); if (a) { e.preventDefault(); toast(`Page ${a.dataset.out} is outside this prototype`); } });

  /* ---------- partage ---------- */
  async function share({ title, text, url }) {
    if (navigator.share) { try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { toast(url); }
  }

  /* ---------- formulaire de réservation réutilisable ---------- */
  function booker(root, p, { onChange, compact = false, state: init } = {}) {
    const opts = (p.options || []).filter((o) => o.kind !== "extra");
    const st = init || { option: opts[0]?.id, date: iso(addDays(today(), 1)), pax: { adults: 2, kids: [] }, addons: [] };
    const opt = () => opts.find((o) => o.id === st.option);
    root.innerHTML = `
      ${opts.length > 1 ? `<fieldset class="bk-block"><legend class="bk-l">Option</legend>${opts.length <= 3 && !compact ? `<div class="seg" data-opts>${opts.map((o) => `<button type="button" data-o="${o.id}" aria-pressed="${o.id === st.option}">${esc(o.label)}</button>`).join("")}</div>` : `<div class="opt-list" data-opts>${opts.map((o) => `<button type="button" class="opt" data-o="${o.id}" aria-pressed="${o.id === st.option}"><span>${esc(o.label)}</span><small class="num">${fromPrice(o)}</small></button>`).join("")}</div>`}<p class="small bk-note" data-note></p></fieldset>` : ""}
      <div class="bk-block"><p class="bk-l" id="${p.slug}-dl">Day</p><div class="ribbon" data-rib aria-labelledby="${p.slug}-dl"></div><p class="why" data-av></p></div>
      <fieldset class="bk-block"><legend class="bk-l">People</legend><div data-pax></div></fieldset>
      <div data-add></div>
      <div class="bk-total" data-total aria-live="polite"></div>`;
    const seg = $("[data-opts]", root);
    seg?.addEventListener("click", (e) => { const b = e.target.closest("[data-o]"); if (!b) return; st.option = b.dataset.o; st.addons = []; $$("[data-o]", seg).forEach((x) => x.setAttribute("aria-pressed", x === b)); upd(); });
    ribbon($("[data-rib]", root), { selected: st.date, onSelect: (d) => { st.date = d; upd(); }, mark: (d) => (availability(p, d).ok ? "" : availability(p, d).why) });
    paxControl($("[data-pax]", root), st.pax, () => upd());
    function upd() {
      const o = opt(), m = model(o), q = quote(o, st.pax, st.addons), f = fees(o, st.pax);
      const note = $("[data-note]", root); if (note) note.textContent = o?.note || o?.stub || "";
      const av = availability(p, fromIso(st.date)); $("[data-av]", root).textContent = av.ok ? "" : av.why;
      $("[data-add]", root).innerHTML = (m.addons || []).map((a) => `<label class="addon"><input type="checkbox" value="${esc(a.label)}" ${st.addons.includes(a.label) ? "checked" : ""}> <span>${esc(a.label)}</span> <b class="num">+${thb(a.amount)}</b></label>`).join("");
      $$("[data-add] input", root).forEach((i) => (i.onchange = () => { st.addons = $$("[data-add] input:checked", root).map((x) => x.value); upd(); }));
      const t = $("[data-total]", root);
      if (q.total != null) {
        t.innerHTML = `<div class="tl">${q.lines.map((l) => `<div><span>${esc(l[0])}</span><span class="num">${thb(l[1])}</span></div>`).join("")}</div><div class="tt"><span>Price for ${esc(short(fromIso(st.date)))}</span><b class="num">${thb(q.total)}</b></div>${f.length ? `<div class="tf"><span>Cash on the day, not included</span>${f.map((x) => `<div><span>${esc(x[0])}</span><span class="num">${thb(x[1])}</span></div>`).join("")}</div>` : ""}`;
      } else if (q.missing.length) {
        t.innerHTML = `<p><span class="missing">[DONNÉE À FOURNIR : ${esc(q.missing.join(" ; "))}]</span></p><p class="small" style="margin-top:6px">We send your request without a total. The price is confirmed on WhatsApp.</p>`;
      } else if (q.type === "group-over") {
        t.innerHTML = `<p class="small">This group is larger than the price list. The price is confirmed on WhatsApp.</p>`;
      } else if (m.type === "list") {
        t.innerHTML = `<div class="tl">${(o.prices || []).map((x) => `<div><span>${esc(x.label)}</span><span class="num">${x.amount != null ? thb(x.amount) : esc(x.text || "")}</span></div>`).join("")}</div><p class="small" style="margin-top:6px">Tell us what you choose in the message. The price is confirmed on WhatsApp.</p>`;
      } else {
        t.innerHTML = `<p><b>Price on WhatsApp</b></p><p class="small">${esc(o?.note || "")}</p>`;
      }
      onChange?.(st, q);
    }
    upd();
    return { state: st, option: opt, quote: () => quote(opt(), st.pax, st.addons), refresh: upd };
  }
  function fromPrice(o) {
    const m = model(o);
    if (m.type === "request") return "Price on WhatsApp";
    const am = (o.prices || []).filter((x) => x.amount > 0 && !x.supplement && !(x.ages && /child/i.test(x.label))).map((x) => x.amount);
    return am.length ? "from " + thb(Math.min(...am)) : "";
  }
  const priceFrom = (p) => (p.priceOnRequest || !p.price ? `<span class="price">Price on WhatsApp</span>` : `<span class="price num">from ${thb(p.price.from)} <small>${esc(p.price.unit)}</small></span>`);

  /* ---------- aperçu rapide d'une sortie (feuille) ---------- */
  function quickLook(slug, date) {
    const p = bySlug[slug];
    const s = makeSheet("ql-" + slug, p.name);
    const body = $(".body", s), foot = $("footer", s);
    if (!body.dataset.ready) {
      body.dataset.ready = 1;
      body.innerHTML = `<div class="ql-photo">${photo(p.photo)}</div><p class="lead" style="margin-top:14px">${esc(p.lead)}</p>
        <dl class="facts">${(p.facts || []).slice(0, 6).map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("")}</dl>
        <h3 style="margin:22px 0 10px">Choose and add</h3><div data-bk></div>
        ${pageUrl(p) ? `<p style="margin-top:16px"><a href="${pageUrl(p)}">Open the full ${esc(p.name)} page</a></p>` : `<p class="small" style="margin-top:16px">Full page ${esc(p.url)} is outside this prototype.</p>`}`;
      const bk = booker($("[data-bk]", body), p, { compact: true, state: { option: (p.options || [])[0]?.id, date: date || iso(addDays(today(), 1)), pax: { adults: 2, kids: [] }, addons: [] } });
      foot.hidden = false;
      foot.innerHTML = `<button class="btn block" type="button" data-addw>${icon("plus")}Add to my week</button><a class="btn ghost block" data-wa target="_blank" rel="noopener">${icon("wa")}Ask about this trip on WhatsApp</a>`;
      const sync = () => { $("[data-wa]", foot).href = waLink(message([{ slug, option: bk.state.option, date: bk.state.date, pax: bk.state.pax, addons: bk.state.addons }])); };
      body.addEventListener("click", sync); body.addEventListener("change", sync); sync();
      $("[data-addw]", foot).onclick = () => { store.add({ slug, option: bk.state.option, date: bk.state.date, pax: structuredClone(bk.state.pax), addons: [...bk.state.addons] }); closeSheet(); toast(`${p.name} added to ${short(fromIso(bk.state.date))}`); };
    }
    openSheet(s);
  }


  /* ---------- ligne produit (accueil, hub) ---------- */
  function rowHTML(p, { date, compare = false, compared = false } = {}) {
    const t = traits(p), av = date ? availability(p, fromIso(date)) : { ok: true };
    const href = pageUrl(p);
    const title = href ? `<a href="${href}" data-keep>${esc(p.name)}</a>` : `<button type="button" data-ql="${p.slug}">${esc(p.name)}</button>`;
    const meta = [t.duration, t.pickup ? "Pickup " + t.pickup : null, t.season && !/all year/i.test(t.season) ? t.season : null].filter(Boolean);
    return `<li class="row ${av.ok ? "" : "off"}" data-slug="${p.slug}">
      <div class="thumb">${photo(p.photo)}</div>
      <div><h3>${title}</h3><p>${esc(p.promise || p.lead)}</p>
        <div class="meta">${meta.map((m) => `<span>${esc(m)}</span>`).join("")}</div>
        <div class="meta">${priceFrom(p)}</div>
        ${av.ok ? "" : `<p class="why">${esc(av.why)}</p>`}
        ${compare ? `<div class="actions"><button type="button" class="mini-btn" data-cmp="${p.slug}" aria-pressed="${compared}">${icon("compare")}Compare</button></div>` : ""}
      </div></li>`;
  }

  window.App = { D, IMG, $, $$, esc, fmt, thb, icon, products, bySlug, fact, photo, pageUrl, traits, today, addDays, iso, fromIso, short, long, rel, DAYS, MONTHS, availability, model, quote, fees, paxText, makeSheet, openSheet, closeSheet, toast, ribbon, paxControl, store, message, waLink, openWeek, chrome, footer, share, booker, fromPrice, priceFrom, quickLook, rowHTML };
})();
