/* Prototype « rupture » : la carte marine. Données : data.js (généré depuis src/_data). */
(() => {
  const S = window.STT;
  const L = S.layer;
  const IMG = '../../../../../src/images/';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Number(n).toLocaleString('en-GB');
  const thb = (n) => `${fmt(n)} THB`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>';
  const X_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  /* ---------- dates à l'heure de Bangkok ---------- */
  const bkkToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const bkkNow = () => { const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).split(':').map(Number); return h * 60 + m; };
  const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fmtDate = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const shortDate = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  /* ---------- produits ---------- */
  const P = (slug) => S.products[slug];
  const allSlugs = Object.keys(S.products);
  const pageOf = (slug) => (slug === '4-islands' ? '4-islands.html' : `tours.html#${slug}`);
  const photo = (id) => { const p = S.photos[id]; return p ? { src: IMG + p.file, alt: p.alt, pos: p.position || '50% 50%' } : null; };
  const cardPhoto = (slug) => photo(L.cardPhoto[slug]);
  const fromText = (p) => (p.price ? `from <b class="num">${thb(p.price.from)}</b> <span class="mute">${esc(p.price.unit)}</span>` : 'Price on WhatsApp');
  const fact = (p, label) => (p.facts || []).find((f) => f.label === label)?.value;
  const windows = (slug) => L.day.filter((d) => d.slug === slug);
  const windowText = (slug) => { const w = windows(slug)[0]; return w ? w.spans.map((s) => `${s[0]}–${s[1]}`).join(' or ') : ''; };
  const optionOf = (slug, id) => (P(slug).options || []).find((o) => o.id === id) || (P(slug).options || [])[0];
  const defaultOption = (slug) => { const os = P(slug).options || []; return (os.find((o) => o.prices?.length && !o.priceOnRequest) || os[0])?.id; };
  const inSeason = (slug, iso) => { const s = L.seasons[slug]; if (!s || !iso) return true; const m = Number(iso.slice(5, 7)); return s.from <= s.to ? m >= s.from && m <= s.to : m >= s.from || m <= s.to; };
  const priceSummary = (opt) => {
    if (!opt || opt.priceOnRequest || !opt.prices?.length) return 'price on WhatsApp';
    return opt.prices.filter((r) => !r.supplement && r.amount != null).slice(0, 3).map((r) => `${r.label} ${r.amount === 0 ? 'free' : `${fmt(r.amount)} THB`}`).join(' / ');
  };

  /* ---------- prix pour un groupe ---------- */
  function priceFor(opt, adults, ages) {
    if (!opt || opt.priceOnRequest || !opt.prices?.length) return null;
    const rows = opt.prices.filter((r) => r.amount != null);
    const n = adults + ages.length;
    if (!n) return null;
    const lines = []; const unknown = [];
    const tiers = rows.filter((r) => r.group && /boat|raft|for 2/.test(r.unit || '') && !r.supplement);
    const extra = rows.find((r) => r.supplement && /extra person/i.test(r.label));
    const ppGroup = rows.find((r) => r.group && /per person/.test(r.unit || '') && n >= r.group.min);
    const childRows = rows.filter((r) => r.ages);
    const adultRow = rows.find((r) => !r.group && !r.ages && !r.supplement && /adult|per person/i.test(r.label));
    const tier = tiers.find((r) => n >= r.group.min && n <= (r.group.max ?? Infinity));
    if (tier) { lines.push([tier.label, tier.amount]); return { total: tier.amount, lines, unknown }; }
    if (tiers.length && extra) {
      const top = tiers.reduce((a, b) => ((a.group.max ?? 0) > (b.group.max ?? 0) ? a : b));
      if (n > top.group.max) { const k = n - top.group.max; lines.push([top.label, top.amount], [`${extra.label} × ${k}`, extra.amount * k]); return { total: top.amount + extra.amount * k, lines, unknown }; }
    }
    const adultPrice = ppGroup || adultRow;
    if (!adultPrice) return null;
    let total = 0;
    if (adults) { total += adults * adultPrice.amount; lines.push([`${adults} × ${adultPrice.label}`, adults * adultPrice.amount]); }
    for (const a of ages) {
      const c = childRows.find((r) => a >= (r.ages.min ?? 0) && a <= (r.ages.max ?? 99));
      const maxChild = Math.max(...childRows.map((r) => r.ages.max ?? 0), -1);
      if (c) { total += c.amount; lines.push([`${c.label} (age ${a})`, c.amount]); }
      else if (childRows.length && a > maxChild) { total += adultPrice.amount; lines.push([`Age ${a}, ${adultPrice.label.toLowerCase()} rate`, adultPrice.amount]); }
      else if (!childRows.length) { total += adultPrice.amount; lines.push([`Age ${a}, ${adultPrice.label.toLowerCase()}`, adultPrice.amount]); }
      else unknown.push(a);
    }
    return { total, lines, unknown };
  }
  function cashFees(opt, adults, ages, thai = false) {
    const fees = opt?.notIncludedFees || [];
    if (!fees.length) return null;
    const nat = (f) => /Thai national/.test(f.label) === thai;
    const fa = fees.find((f) => nat(f) && /adult/i.test(f.label) && !/diver/i.test(f.label));
    const fc = fees.find((f) => nat(f) && /child/i.test(f.label) && !/diver/i.test(f.label));
    const any = fees.find((f) => !/adult|child/i.test(f.label) && !/optional/i.test(f.label));
    if (fa) return { total: adults * fa.amount + ages.length * (fc ? fc.amount : fa.amount), label: fa.label.replace(/, adult$/, ''), note: fa.note };
    if (any) return { total: (adults + ages.length) * any.amount, label: any.label, note: any.note };
    return null;
  }

  /* ---------- petite boîte à outils DOM ---------- */
  function toast(text) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toast.k); toast.k = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function stepper(name, value, min, max, onChange) {
    const w = document.createElement('span'); w.className = 'stepper';
    w.innerHTML = `<button type="button" aria-label="One fewer ${name}">−</button><output aria-live="polite" class="num">${value}</output><button type="button" aria-label="One more ${name}">+</button>`;
    const [minus, , plus] = w.children; const out = w.children[1];
    const set = (v) => { value = Math.max(min, Math.min(max, v)); out.textContent = value; onChange(value); };
    minus.onclick = () => set(value - 1); plus.onclick = () => set(value + 1);
    return w;
  }

  /* ---------- état partagé : invités, prise en charge, prénom (brouillon 7 jours) ---------- */
  const DRAFT = 'stt-rupture-draft';
  const LIST = 'stt-rupture-list';
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); if (v && (!v.t || Date.now() - v.t < 7 * 864e5)) return v.v ?? d; } catch (e) { /* stockage indisponible */ } return d; };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch (e) { /* rien */ } };
  const party = Object.assign({ adults: 2, ages: [], pickup: '', name: '' }, load(DRAFT, {}));
  const saveParty = () => { save(DRAFT, party); document.dispatchEvent(new CustomEvent('party')); };
  let list = load(LIST, []);
  const saveList = () => { save(LIST, list); $$('.list-btn .count').forEach((c) => { c.textContent = list.length; c.dataset.n = list.length; }); };
  function addToList(slug, option, date, extra) {
    option = option || defaultOption(slug);
    const ex = list.find((i) => i.slug === slug && i.option === option);
    if (ex) { if (date) ex.date = date; if (extra) ex.extra = extra; } else list.push({ slug, option, date: date || null, extra: extra || null });
    saveList();
    toast(`${P(slug).name}, ${optionOf(slug, option)?.label.toLowerCase() || ''} added. ${list.length} in your list.`);
  }

  /* ---------- calendrier ---------- */
  function calendar(host, { value, slug, onPick }) {
    const today = bkkToday();
    let view = (value || today).slice(0, 7);
    const render = () => {
      const [y, m] = view.split('-').map(Number);
      const first = `${view}-01`; const lead = (dow(first) + 6) % 7;
      const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const prevOk = view > today.slice(0, 7);
      let cells = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => `<span class="dow" aria-hidden="true">${d}</span>`).join('');
      cells += '<span></span>'.repeat(lead);
      for (let d = 1; d <= days; d++) {
        const iso = `${view}-${String(d).padStart(2, '0')}`;
        const off = iso < today || !inSeason(slug, iso);
        cells += `<button type="button" data-d="${iso}" ${off ? 'disabled' : ''} aria-pressed="${iso === value}" aria-label="${fmtDate(iso)}${!inSeason(slug, iso) ? ', out of season' : ''}">${d}</button>`;
      }
      host.innerHTML = `<div class="cal">
        <div class="chips"><button type="button" class="chip" data-q="0" aria-pressed="${value === today}">Today</button><button type="button" class="chip" data-q="1" aria-pressed="${value === addDays(today, 1)}">Tomorrow</button></div>
        <div class="cal-head"><button type="button" data-m="-1" aria-label="Previous month" ${prevOk ? '' : 'disabled'}>‹</button><strong>${MONL[m - 1]} ${y}</strong><button type="button" data-m="1" aria-label="Next month">›</button></div>
        <div class="cal-grid">${cells}</div>
        <p class="cal-note" aria-live="polite">${calNote(slug, value)}</p></div>`;
    };
    host.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.m) { const [y, m] = view.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + Number(b.dataset.m), 1)); view = d.toISOString().slice(0, 7); render(); return; }
      let iso = b.dataset.d || (b.dataset.q != null ? addDays(today, Number(b.dataset.q)) : null);
      if (!iso) return;
      if (!inSeason(slug, iso)) { host.querySelector('.cal-note').textContent = `${P(slug).name} runs ${fact(P(slug), 'Season')}. Pick another date.`; return; }
      value = iso; view = iso.slice(0, 7); render(); onPick(iso);
    });
    render();
  }
  function calNote(slug, iso) {
    if (!slug) return '';
    const p = P(slug);
    if (L.seasons[slug]) return `Runs ${fact(p, 'Season')}. Other months are greyed out.`;
    if (slug === 'cooking-class' && iso) {
      const w = L.day.filter((d) => d.slug === slug && d.weekdays.includes(dow(iso)));
      return w.length ? `${DOWL[dow(iso)]}: ${w.map((d) => `${d.label.toLowerCase()} ${d.spans[0].join('–')}`).join(', ')}.` : `No class is listed for ${DOWL[dow(iso)]}. Ask us on WhatsApp.`;
    }
    return '';
  }

  /* ---------- message WhatsApp ---------- */
  function guestsText() {
    const a = `${party.adults} adult${party.adults === 1 ? '' : 's'}`;
    if (!party.ages.length) return a;
    return `${a}, ${party.ages.length} child${party.ages.length === 1 ? '' : 'ren'} (age${party.ages.length === 1 ? '' : 's'} ${party.ages.join(', ')})`;
  }
  function buildMessage(items) {
    const host = 'secrettravelandtour.com';
    const L1 = ['Hello Secret Travel & Tour,'];
    if (items.length === 1) {
      const i = items[0]; const o = optionOf(i.slug, i.option);
      L1.push(`Booking request: ${P(i.slug).name} – ${o?.label || ''}`, `Date: ${i.date ? fmtDate(i.date) : '(to choose)'}`);
      if (i.extra) L1.push(i.extra);
      L1.push(`Guests: ${guestsText()}`, `Pickup: ${party.pickup || '(hotel)'}`, `Name: ${party.name || '(name)'}`, `Price on website: ${priceSummary(o)}`, `Page: ${host}${P(i.slug).url}`);
    } else {
      L1.push(`Booking request, ${items.length} trips:`);
      items.forEach((i, n) => { const o = optionOf(i.slug, i.option); L1.push(`${n + 1}. ${P(i.slug).name} – ${o?.label || ''}, ${i.date ? fmtDate(i.date) : '(date to choose)'} (${priceSummary(o)})${i.extra ? `. ${i.extra}` : ''}`); });
      L1.push(`Guests: ${guestsText()}`, `Pickup: ${party.pickup || '(hotel)'}`, `Name: ${party.name || '(name)'}`, `Pages: ${[...new Set(items.map((i) => host + P(i.slug).url))].join(' ')}`);
    }
    return L1.join('\n');
  }

  /* ---------- feuille de demande (une sortie ou toute la liste) ---------- */
  let lastFocus = null;
  function openRequest(opts = {}) {
    const single = !!opts.items;
    let items = single ? opts.items : list;
    closeSheet();
    lastFocus = document.activeElement;
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const sh = document.createElement('section'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-labelledby', 'sheet-t');
    document.body.append(scrim, sh);
    scrim.onclick = closeSheet;
    const render = () => {
      const title = single ? 'Check a date' : 'Your list';
      sh.innerHTML = `<header><h2 id="sheet-t">${title}</h2><button class="x" type="button" aria-label="Close">${X_ICON}</button></header>
      <div class="body">
        ${items.length ? '' : '<div class="empty"><p><strong>Your list is empty.</strong></p><p class="mute">Tap a place on the chart and add the trips you like. You send them all in one WhatsApp message.</p></div>'}
        <div class="basket">${items.map((i, n) => {
          const p = P(i.slug); const os = p.options || [];
          return `<div class="basket-item" data-n="${n}">
            <strong>${esc(p.name)}</strong>
            ${single ? '' : `<button type="button" class="link" data-rm="${n}" aria-label="Remove ${esc(p.name)}">Remove</button>`}
            ${os.length > 1 ? `<label class="vh" for="opt${n}">Option for ${esc(p.name)}</label><select id="opt${n}" data-opt="${n}">${os.map((o) => `<option value="${o.id}" ${o.id === i.option ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>` : `<span class="when">${esc(os[0]?.label || '')}</span>`}
            <span></span>
            <span class="when">${esc(priceSummary(optionOf(i.slug, i.option)))}</span><span></span>
            ${i.extra ? `<span class="when">${esc(i.extra)}</span><span></span>` : ''}
            <button type="button" class="chip" data-cal="${n}" aria-expanded="false">${i.date ? `Date: ${fmtDate(i.date)}` : 'Choose a date'}</button><span></span>
            <span class="field full"><span class="err" id="e-date${n}" hidden>Choose a date for ${esc(p.name)}.</span></span>
            <div class="calhost full" data-calhost="${n}" hidden></div>
          </div>`;
        }).join('')}</div>
        ${items.length ? `<fieldset><legend>Who's coming</legend>
          <div class="guest-row"><span>Adults</span><span data-stepper="adults"></span></div>
          <div class="guest-row"><span>Children</span><span data-stepper="kids"></span></div>
          <div class="kids">${party.ages.map((a, k) => `<label class="kid">Child ${k + 1}, age <select data-age="${k}">${Array.from({ length: 18 }, (_, v) => `<option ${v === a ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}</div>
        </fieldset>
        <div class="field"><label for="f-pickup">Pickup on Koh Lanta</label><input id="f-pickup" type="text" autocomplete="street-address" value="${esc(party.pickup)}" aria-describedby="h-pickup e-pickup"><span class="hint" id="h-pickup">Hotel name or address.</span><span class="err" id="e-pickup" hidden>Write your hotel so we can plan the pickup.</span></div>
        <div class="field"><label for="f-name">Your first name</label><input id="f-name" type="text" autocomplete="given-name" value="${esc(party.name)}" aria-describedby="e-name"><span class="err" id="e-name" hidden>Write your first name.</span></div>
        <div class="field"><span class="lab">Your message</span><pre class="msg" id="msg" aria-live="polite"></pre></div>` : ''}
      </div>
      <footer>${items.length ? `<a class="btn route" id="send" href="#" target="_blank" rel="noopener">${WA_ICON}Send on WhatsApp</a>` : ''}
        ${single ? '<button type="button" class="link" id="to-list">Add to my list instead</button>' : ''}</footer>`;
      const msg = () => { const m = $('#msg', sh); if (m) m.textContent = buildMessage(items); const s = $('#send', sh); if (s) s.href = `${S.site.whatsapp.link}?text=${encodeURIComponent(buildMessage(items))}`; };
      msg();
      $('.x', sh).onclick = closeSheet;
      const sa = $('[data-stepper="adults"]', sh); if (sa) sa.append(stepper('adult', party.adults, 1, 30, (v) => { party.adults = v; saveParty(); msg(); }));
      const sk = $('[data-stepper="kids"]', sh); if (sk) sk.append(stepper('child', party.ages.length, 0, 10, (v) => { while (party.ages.length < v) party.ages.push(6); party.ages.length = v; saveParty(); render(); focusIn('[data-stepper="kids"] button:last-child'); }));
      sh.oninput = (e) => {
        if (e.target.id === 'f-pickup') { party.pickup = e.target.value; e.target.removeAttribute('aria-invalid'); $('#e-pickup', sh).hidden = true; }
        if (e.target.id === 'f-name') { party.name = e.target.value; e.target.removeAttribute('aria-invalid'); $('#e-name', sh).hidden = true; }
        save(DRAFT, party); msg();
      };
      sh.onchange = (e) => {
        if (e.target.dataset.age != null) { party.ages[Number(e.target.dataset.age)] = Number(e.target.value); saveParty(); msg(); }
        if (e.target.dataset.opt != null) { items[Number(e.target.dataset.opt)].option = e.target.value; if (!single) saveList(); render(); focusIn(`#opt${e.target.dataset.opt}`); }
      };
      sh.onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.rm != null) { items.splice(Number(b.dataset.rm), 1); saveList(); render(); focusIn('.x'); }
        if (b.dataset.cal != null) {
          const n = Number(b.dataset.cal); const hostEl = $(`[data-calhost="${n}"]`, sh);
          const open = hostEl.hidden; hostEl.hidden = !open; b.setAttribute('aria-expanded', open);
          if (open) calendar(hostEl, { value: items[n].date, slug: items[n].slug, onPick: (iso) => { items[n].date = iso; if (!single) saveList(); b.textContent = `Date: ${fmtDate(iso)}`; $(`#e-date${n}`, sh).hidden = true; msg(); setTimeout(() => { hostEl.hidden = true; b.setAttribute('aria-expanded', 'false'); b.focus(); }, 180); } });
        }
        if (b.id === 'to-list') { items.forEach((i) => addToList(i.slug, i.option, i.date, i.extra)); closeSheet(); }
      };
      const send = $('#send', sh);
      if (send) send.onclick = (e) => {
        const bad = [];
        items.forEach((i, n) => { if (!i.date) { $(`#e-date${n}`, sh).hidden = false; bad.push($(`[data-cal="${n}"]`, sh)); } });
        if (!party.pickup.trim()) { $('#e-pickup', sh).hidden = false; $('#f-pickup', sh).setAttribute('aria-invalid', 'true'); bad.push($('#f-pickup', sh)); }
        if (!party.name.trim()) { $('#e-name', sh).hidden = false; $('#f-name', sh).setAttribute('aria-invalid', 'true'); bad.push($('#f-name', sh)); }
        if (bad.length) { e.preventDefault(); bad[0].focus(); return; }
        const text = buildMessage(items);
        setTimeout(() => done(text), 300);
      };
    };
    const done = (text) => {
      $('.body', sh).innerHTML = `<div><h3>WhatsApp should open now</h3><p class="mute" style="margin-top:6px">Your message is ready in the chat with ${esc(S.site.name)}. Press send there.</p></div>
        <pre class="msg">${esc(text)}</pre>
        <div><p><strong>Nothing opened?</strong></p><p class="mute">Copy the message and send it to ${esc(S.site.whatsapp.display)}.</p></div>`;
      $('footer', sh).innerHTML = `<button type="button" class="btn alt" id="copy">Copy message</button>`;
      $('#copy', sh).onclick = async () => { try { await navigator.clipboard.writeText(text); toast('Message copied.'); } catch (e) { toast('Copy did not work. Select the text above.'); } };
      if (!single) { list = []; saveList(); }
    };
    function focusIn(sel) { const el = $(sel, sh); if (el) el.focus(); }
    render();
    requestAnimationFrame(() => $('.x', sh).focus());
    sh.addEventListener('keydown', trap);
  }
  function trap(e) {
    const sh = e.currentTarget;
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input,select,textarea', sh).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function closeSheet() { $$('.sheet,.scrim').forEach((x) => x.remove()); if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); lastFocus = null; }

  /* ---------- la carte ---------- */
  const COAST = {
    yai: [[99.030, 7.603], [99.046, 7.600], [99.062, 7.592], [99.074, 7.583], [99.083, 7.570], [99.092, 7.556], [99.100, 7.540], [99.106, 7.525], [99.108, 7.505], [99.106, 7.485], [99.103, 7.465], [99.100, 7.445], [99.098, 7.425], [99.095, 7.405], [99.090, 7.390], [99.082, 7.380], [99.074, 7.384], [99.068, 7.398], [99.062, 7.418], [99.058, 7.440], [99.052, 7.462], [99.047, 7.485], [99.042, 7.508], [99.037, 7.532], [99.033, 7.555], [99.029, 7.578]],
    noi: [[99.035, 7.615], [99.060, 7.611], [99.085, 7.618], [99.110, 7.627], [99.128, 7.645], [99.120, 7.665], [99.104, 7.674], [99.094, 7.696], [99.074, 7.706], [99.061, 7.690], [99.051, 7.668], [99.041, 7.646]],
    main: [[99.08, 7.95], [99.10, 7.80], [99.14, 7.74], [99.17, 7.70], [99.20, 7.66], [99.24, 7.63], [99.28, 7.60], [99.32, 7.56], [99.36, 7.52], [99.39, 7.47], [99.41, 7.42], [99.42, 7.37], [99.45, 7.32], [99.48, 7.27], [99.52, 7.20], [99.62, 7.05], [99.70, 7.05], [99.70, 7.95]],
    ppdon: [[98.745, 7.760], [98.765, 7.770], [98.790, 7.765], [98.800, 7.750], [98.785, 7.740], [98.770, 7.735], [98.765, 7.722], [98.775, 7.712], [98.760, 7.705], [98.745, 7.715], [98.750, 7.735], [98.740, 7.745]],
    ppleh: [[98.760, 7.695], [98.772, 7.690], [98.775, 7.672], [98.768, 7.660], [98.758, 7.668], [98.755, 7.684]],
  };
  const BLOBS = [[99.065, 7.222, .011, 1.3, 3], [99.082, 7.208, .009, 1.1, 5], [98.918, 7.412, .004, 1, 7], [98.928, 7.404, .004, 1, 8], [98.924, 7.398, .003, 1, 9], [98.755, 7.640, .004, 1.2, 11], [99.205, 7.420, .011, 1.8, 13], [99.205, 7.452, .004, 1, 17], [99.305, 7.366, .015, 1.2, 19], [99.290, 7.399, .004, 1, 23], [99.252, 7.312, .011, 1.5, 29], [99.158, 7.578, .005, 1.2, 31], [99.166, 7.568, .004, 1, 37], [99.140, 7.515, .004, 1, 41], [98.806, 7.818, .004, 1, 43], [99.40, 7.255, .028, 1.6, 47]];
  const LABEL = { // dx, dy (en pixels écran), ancre
    'koh-lanta': [-28, 0, 'end'], 'old-town': [14, 4, 'start'], 'thung-yee-peng': [14, -6, 'start'], 'sala-dan': [-12, -10, 'end'],
    talabeng: [14, -4, 'start'], bubu: [14, 6, 'start'], ma: [-12, -6, 'end'], ngai: [-14, 10, 'end'], chueak: [10, -10, 'start'], mook: [16, 8, 'start'],
    kradan: [0, 24, 'middle'], rok: [16, 4, 'start'], haa: [-12, 4, 'end'], 'phi-phi': [16, -6, 'start'], bida: [14, 6, 'start'],
  };
  const LABEL_NARROW = { chueak: [-10, -12, 'end'], mook: [-4, 26, 'middle'], ma: [12, -8, 'start'], ngai: [-12, 6, 'end'], 'koh-lanta': [-14, 22, 'end'], talabeng: [10, -12, 'start'], bubu: [12, 8, 'start'],
  };
  function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function blobPts(lon, lat, r, stretch, seed) { const R = rnd(seed); const n = 12; return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; const k = 0.75 + R() * 0.45; return [lon + Math.cos(a) * r * k, lat + Math.sin(a) * r * k * stretch]; }); }
  function smooth(pts, closed) {
    if (pts.length < 2) return '';
    const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < p.length - 2; i++) {
      const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]; const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return closed ? `${d}Z` : d;
  }
  const legs = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const BOUNDS = { all: [98.71, 99.38, 7.13, 7.80], four: [99.07, 99.35, 7.28, 7.565], east: [99.0, 99.22, 7.47, 7.64] };

  function chart(host, o) {
    const [lon0, lon1, lat0, lat1] = BOUNDS[o.bounds || 'all'];
    const W = 1000; const H = Math.round((W * (lat1 - lat0)) / (lon1 - lon0));
    const X = (lon) => ((lon - lon0) / (lon1 - lon0)) * W; const Y = (lat) => ((lat1 - lat) / (lat1 - lat0)) * H;
    const pt = (id) => { const q = L.places[id] || L.anchors[id]; return q ? [X(q.lon), Y(q.lat)] : null; };
    const state = { on: o.on || null, routesOn: new Set(o.routesOn || []), dim: new Set(), stops: o.stops || null, ferry: !!o.ferry, boat: null };
    const box = document.createElement('div'); box.className = 'chart-box';
    host.append(box);
    function draw() {
      const k = W / Math.max(box.clientWidth || host.clientWidth || 600, 280);
      const fs = (px) => (px * k).toFixed(1);
      const land = (pts, cls = 'land') => `<path class="${cls}" d="${smooth(pts.map(([a, b]) => [X(a), Y(b)]), true)}"/>`;
      const shapes = [COAST.main, COAST.yai, COAST.noi, COAST.ppdon, COAST.ppleh, ...BLOBS.map((b) => blobPts(...b))];
      let s = `<rect class="sea" width="${W}" height="${H}"/>`;
      s += `<g style="stroke-width:${fs(12)}">${shapes.map((p) => land(p, 'shoal')).join('')}</g>`;
      s += land(COAST.main, 'land main') + [COAST.yai, COAST.noi, COAST.ppdon, COAST.ppleh, ...BLOBS.map((b) => blobPts(...b))].map((p) => land(p)).join('');
      if (o.bounds !== 'four' && o.bounds !== 'east') s += `<text class="water-name" x="${X(98.76)}" y="${Y(7.30)}" style="font-size:${fs(17)}px">Andaman Sea</text>`;
      const narrowNow = k > 1.7;
      s += `<text class="water-name" x="${X(o.bounds === 'four' ? 99.25 : narrowNow ? 99.22 : 99.17)}" y="${Y(o.bounds === 'four' ? 7.47 : narrowNow ? 7.265 : 7.33)}" style="font-size:${fs(15)}px">Trang sea</text>`;
      s += `<text class="land-name" x="${X(99.30)}" y="${Y(o.bounds === 'four' ? 7.53 : 7.66)}" style="font-size:${fs(13)}px">Mainland</text>`;
      if (state.ferry) {
        const ferry = [['sala-dan', 'phi-phi'], ['sala-dan', 'ngai', 'mook', 'kradan']];
        s += ferry.map((v) => `<path class="ferry-line" style="stroke-width:${fs(2)}" d="${legs(v.map(pt))}"/>`).join('');
      }
      const routes = o.routes || L.routes.map((r) => ({ key: r.slug + (r.id ? `:${r.id}` : ''), slug: r.slug, via: r.via }));
      s += routes.map((r) => `<path class="route-line ${state.routesOn.has(r.key) || state.routesOn.has(r.slug) ? 'on' : ''}" data-route="${r.key}" style="stroke-width:${fs(state.routesOn.has(r.key) || state.routesOn.has(r.slug) ? 3.4 : 1.8)};stroke-dasharray:${state.routesOn.has(r.key) || state.routesOn.has(r.slug) ? 'none' : `${fs(5)} ${fs(6)}`}" d="${legs(r.via.map(pt).filter(Boolean))}"/>`).join('');
      const ids = o.places || Object.keys(L.places);
      s += ids.map((id) => {
        const q = L.places[id]; const [x, y] = pt(id); const narrow = k > 1.7; const [dx, dy, an] = (narrow && LABEL_NARROW[id]) || LABEL[id] || [12, 4, 'start'];
        const hideLabel = narrow && (q.pier || ['ma', 'chueak', 'bubu'].includes(id)) && state.on !== id;
        const label = hideLabel ? '' : q.land ? `<text x="${(x + dx * k).toFixed(1)}" y="${(y + dy * k).toFixed(1)}" text-anchor="${an}" style="font-size:${fs(16)}px;stroke-width:${fs(4)}px">${esc(q.name)}</text>`
          : `<text x="${(x + dx * k).toFixed(1)}" y="${(y + dy * k).toFixed(1)}" text-anchor="${an}" style="font-size:${fs(q.pier ? 12 : 13.5)}px;stroke-width:${fs(4)}px">${esc(q.name)}</text>`;
        const n = state.stops ? state.stops.indexOf(id) : -1;
        const mark = n >= 0 ? `<circle class="stop-n" r="${fs(13)}" cx="${x}" cy="${y}"/><text class="stop-n-t" x="${x}" y="${y}" style="font-size:${fs(13)}px;stroke:none">${n + 1}</text>`
          : `<circle class="dot" r="${fs(q.land ? 7 : 6)}" cx="${x}" cy="${y}"/>`;
        const cls = `place${q.pier ? ' pier' : ''}${state.on === id ? ' on' : ''}${state.dim.has(id) ? ' dim' : ''}`;
        const aria = o.ariaFor ? o.ariaFor(id) : q.name;
        return o.onPick ? `<g class="${cls}" data-place="${id}" tabindex="0" role="button" aria-pressed="${state.on === id}" aria-label="${esc(aria)}"><circle class="hit" r="${fs(22)}" cx="${x}" cy="${y}"/><circle class="ring" r="${fs(15)}" cx="${x}" cy="${y}" fill="none"/>${mark}${label}</g>`
          : `<g class="${cls}" aria-hidden="true">${mark}${label}</g>`;
      }).join('');
      if (state.boat) s += `<circle class="boat" r="${fs(9)}" cx="${state.boat[0]}" cy="${state.boat[1]}" style="stroke-width:${fs(2.5)}"/>`;
      box.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.label || 'Chart of the sea around Koh Lanta')}">${s}</svg><span class="chart-north" aria-hidden="true">N</span><span class="chart-note">Schematic chart, positions approximate</span>`;
    }
    box.addEventListener('click', (e) => { const g = e.target.closest('[data-place]'); if (g && o.onPick) o.onPick(g.dataset.place); });
    box.addEventListener('keydown', (e) => { const g = e.target.closest('[data-place]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); o.onPick(g.dataset.place); } });
    let w0 = 0;
    new ResizeObserver(() => { const w = box.clientWidth; if (Math.abs(w - w0) > 8) { w0 = w; const f = document.activeElement?.dataset?.place; draw(); if (f) box.querySelector(`[data-place="${f}"]`)?.focus(); } }).observe(box);
    draw();
    return {
      set(patch) { const f = document.activeElement?.dataset?.place; Object.assign(state, patch); if (patch.routesOn) state.routesOn = new Set(patch.routesOn); if (patch.dim) state.dim = new Set(patch.dim); draw(); if (f) box.querySelector(`[data-place="${f}"]`)?.focus(); },
      update(newOpts) { Object.assign(o, newOpts); draw(); },
      pathPoint(route, t) { const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path'); tmp.setAttribute('d', smooth(route.map(pt), false)); const len = tmp.getTotalLength(); const p = tmp.getPointAtLength(len * t); return [p.x, p.y]; },
      pt, state,
    };
  }

  /* ---------- index lieu -> sorties ---------- */
  const visitsAt = (place) => L.visits.filter((v) => v.place === place);
  const slugsAt = (place) => [...new Set(visitsAt(place).map((v) => v.slug))];
  const lengthOk = (slug, len) => !len || L.lengths[len].items.some(([s]) => s === slug);
  const ferryAt = (place) => {
    const name = L.places[place]?.name; const tt = S.transfers[1].timetable; if (!name) return [];
    return tt.outbound.filter((r) => r.stops.some((x) => x.place === name)).map((r) => ({ departs: r.departs, arrives: r.stops.find((x) => x.place === name).time, season: r.seasonRange?.label }));
  };

  /* ---------- ligne de la journée ---------- */
  function dayline(host, o) {
    const H0 = 4; const H1 = 21; const span = (H1 - H0) * 60;
    const pos = (t) => (((toMin(t) - H0 * 60) / span) * 100).toFixed(2);
    const render = () => {
      const iso = o.date; const today = iso === bkkToday(); const now = bkkNow();
      const part = o.part; const rng = { morning: [0, 12 * 60], afternoon: [12 * 60, 17 * 60], evening: [16 * 60, 24 * 60] }[part];
      const rows = L.day.filter((d) => !o.only || o.only.includes(d.slug));
      host.innerHTML = `<div class="dayline" style="--lab:${o.lab ?? 280}px">
        <div class="dl-axis" aria-hidden="true">${Array.from({ length: (H1 - H0) / 2 + 1 }, (_, i) => `<span style="left:${(((i * 2) * 60) / span) * 100}%">${String(H0 + i * 2).padStart(2, '0')}:00</span>`).join('')}</div>
        <ul style="list-style:none;margin:0;padding:0;position:relative">${rows.map((d) => {
          const p = P(d.slug);
          let off = ''; let why = '';
          if (d.weekdays && !d.weekdays.includes(dow(iso))) { off = 'off'; why = `Not on ${DOWL[dow(iso)]}s`; }
          if (d.season && !inSeason(d.slug, iso)) { off = 'off'; why = `Runs ${fact(p, 'Season')}`; }
          if (!off && today && toMin(d.spans[d.spans.length - 1][0]) < now) { off = 'off'; why = 'Already left today'; }
          const hit = !off && rng && d.spans.some(([a, b]) => toMin(a) < rng[1] && toMin(b) > rng[0]) ? 'hit' : '';
          const t = d.spans.map((s) => `${s[0]} to ${s[1]}`).join(', or ');
          return `<li class="dl-row ${off} ${hit}">
            <span class="dl-name"><a href="${pageOf(d.slug)}">${esc(d.label)}</a><small class="num">${t}${d.approxEnd ? ', end time approximate' : ''}${why ? `. ${why}` : ''}</small></span>
            <span class="dl-track">${d.spans.map((s) => `<span class="dl-bar ${d.fuzzyFrom && s[1] === d.spans[0][1] ? 'fuzzy' : ''}" style="left:${pos(s[0])}%;width:calc(${pos(s[1])}% - ${pos(s[0])}%)" aria-hidden="true">${s[0]}</span>`).join('')}</span>
          </li>`;
        }).join('')}${today && now > H0 * 60 && now < H1 * 60 ? `<li aria-hidden="true" class="dl-now${(now - H0 * 60) / span > 0.6 ? ' flip' : ''}" style="left:calc(var(--lab) + (100% - var(--lab)) * ${(now - H0 * 60) / span})"><span>Now on Koh Lanta</span></li>` : ''}</ul></div>`;
      if (o.onRender) o.onRender();
    };
    render();
    return { set(p) { Object.assign(o, p); render(); } };
  }

  /* ---------- en-tête commun ---------- */
  function header(current) {
    const nav = [['tours.html#boats', 'Boat trips'], ['tours.html#land', 'Activities'], ['index-transfers', 'Transfers'], ['index-rental', 'Rental']];
    const href = (h) => (h === 'index-transfers' ? 'home.html#around' : h === 'index-rental' ? 'home.html#rental' : h);
    return `<a class="skip" href="#main">Skip to content</a><header class="top"><div class="wrap">
      <a class="brand" href="home.html"><img src="${IMG}secret/emblem.webp" alt="" width="52" height="44"><span>Secret Travel<br>&amp; Tour</span></a>
      <nav class="nav" id="nav" aria-label="Main">${nav.map(([h, t]) => `<a href="${href(h)}" ${current === t ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <div class="top-actions">
        <button class="list-btn" type="button" data-open-list aria-label="Your list">My list<span class="count num" data-n="${list.length}">${list.length}</span></button>
        <a class="btn" href="${S.site.whatsapp.link}" target="_blank" rel="noopener" aria-label="WhatsApp ${S.site.whatsapp.display}">${WA_ICON}<span class="wa-label">WhatsApp</span></a>
        <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
      </div></div></header>`;
  }
  function footer() {
    const boats = allSlugs.filter((s) => P(s).group === 'tours'); const acts = allSlugs.filter((s) => P(s).group === 'activities');
    return `<footer class="foot"><div class="wrap">
      <div><div class="brandline"><img src="${IMG}secret/emblem.webp" alt="" width="62" height="52">${esc(S.site.name)}</div>
        <p style="margin-top:14px">WhatsApp <a href="${S.site.whatsapp.link}">${esc(S.site.whatsapp.display)}</a></p>
        <p class="small" style="margin-top:8px">Booking on WhatsApp. ${S.site.booking.onlinePayment ? '' : 'Nothing is paid online.'} Payment in ${S.site.booking.payment.join(' or ')}.</p></div>
      <div><h2>Boat trips</h2><ul>${boats.map((s) => `<li><a href="${pageOf(s)}">${esc(P(s).name)}</a></li>`).join('')}</ul></div>
      <div><h2>Activities</h2><ul>${acts.map((s) => `<li><a href="${pageOf(s)}">${esc(P(s).name)}</a></li>`).join('')}</ul></div>
      <div><h2>Getting around</h2><ul>${S.transfers.map((t) => `<li><a href="#">${esc(t.name)}</a></li>`).join('')}<li><a href="home.html#rental">${esc(S.rental.name)}</a></li><li><a href="#">${esc(S.site.vip.name)}, private transfers</a></li></ul></div>
      <p class="legal"><span>Operated by ${esc(S.site.operator)}</span><span>Licence ${esc(S.site.licence)}</span><a href="#">Terms</a><a href="#">Privacy</a></p>
    </div></footer>`;
  }
  function boot(current) {
    const h = $('#site-head'); if (h) h.outerHTML = header(current);
    const f = $('#site-foot'); if (f) f.outerHTML = footer();
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-list]')) openRequest();
      const m = e.target.closest('.menu-btn'); if (m) { const n = $('#nav'); const open = n.classList.toggle('open'); m.setAttribute('aria-expanded', open); }
      const add = e.target.closest('[data-add]'); if (add) addToList(add.dataset.add, add.dataset.option, add.dataset.date);
    });
  }

  window.R = { S, L, IMG, $, $$, fmt, thb, esc, P, allSlugs, pageOf, photo, cardPhoto, fromText, fact, windows, windowText, optionOf, defaultOption, inSeason, priceSummary, priceFor, cashFees, chart, dayline, slugsAt, visitsAt, lengthOk, ferryAt, openRequest, addToList, party, saveParty, stepper, calendar, bkkToday, bkkNow, addDays, dow, fmtDate, shortDate, DOWL, toMin, boot, toast, reduce, WA_ICON, X_ICON, BOUNDS };
})();
