/* WhatsApp sur un ordinateur : scanner ou ouvrir (Jérémy, 16.11.2026).
   Sur un ordinateur sans écran tactile et à fenêtre large, un lien wa.me ouvre WhatsApp Web ou l'application de bureau,
   que beaucoup n'utilisent pas. Le clic sur un lien WhatsApp ouvre donc un petit panneau : le QR code du même lien
   (message compris), « Scan with your phone's camera to open WhatsApp » et un bouton « Open WhatsApp on this computer »
   qui suit le lien. Esc, un clic hors du panneau ou la croix le ferment ; le focus reste dans le panneau et revient au lien.
   Après « Send on WhatsApp » dans la feuille (booking.js), WhatsApp s'ouvre toujours tout de suite ; l'écran suivant
   ajoute le QR code du message pour qui n'avait pas WhatsApp sur l'ordinateur.
   Téléphones et tablettes : rien ne change, le lien ouvre WhatsApp directement.

   QR code calculé dans le navigateur, sans dépendance ni service extérieur (encodeur écrit d'après la norme ISO/IEC 18004,
   mode octet, versions 1 à 40). Correction d'erreur : la plus petite version possible au niveau L, puis le niveau le plus
   haut qui tient dans cette même version (M, Q ou H gratuits pour un lien court). Un écran n'abîme pas le code : ce qui
   gêne la lecture d'un message long, c'est la densité, d'où la plus petite version d'abord.
   Mesure (consent.js, après « Accept » seulement) : stt-wa-qr-shown → whatsapp_qr_shown {placement},
   stt-wa-desktop-open → whatsapp_desktop_open {placement}. whatsapp_click reste envoyé par consent.js au clic sur le lien.
   Logique pure exportée en CommonJS pour les tests (node --test). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    var api = factory();
    root.STT_WAQR = api;
    if (typeof document !== "undefined") api.mount(document);
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------- Encodeur QR ----------
  // Niveaux de correction, dans l'ordre des tables : L, M, Q, H ; bits de format de la norme.
  var LEVELS = ["L", "M", "Q", "H"];
  var FORMAT_BITS = [1, 0, 3, 2];
  // Octets de correction par bloc, puis nombre de blocs, pour chaque niveau et chaque version (index 0 inutilisé).
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function rawModules(ver) {
    var n = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var align = Math.floor(ver / 7) + 2;
      n -= (25 * align - 10) * align - 55;
      if (ver >= 7) n -= 36;
    }
    return n;
  }
  function dataCodewords(ver, ecl) {
    return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * BLOCKS[ecl][ver];
  }
  // Mode octet : 4 bits de mode, puis la longueur sur 8 bits (versions 1 à 9) ou 16 bits (10 à 40).
  function bitsNeeded(ver, len) { return 4 + (ver < 10 ? 8 : 16) + 8 * len; }

  // Corps de Galois GF(256), polynôme 0x11D.
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var r = [];
    for (var i = 0; i < degree - 1; i++) r.push(0);
    r.push(1);
    var root = 1;
    for (var k = 0; k < degree; k++) {
      for (var j = 0; j < r.length; j++) {
        r[j] = gfMul(r[j], root);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, divisor) {
    var r = divisor.map(function () { return 0; });
    data.forEach(function (b) {
      var factor = b ^ r.shift();
      r.push(0);
      divisor.forEach(function (c, i) { r[i] ^= gfMul(c, factor); });
    });
    return r;
  }

  function utf8(text) {
    if (typeof TextEncoder === "function") return Array.prototype.slice.call(new TextEncoder().encode(text));
    var s = unescape(encodeURIComponent(text)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  // Renvoie { version, level, size, modules[y][x] } ou null si le texte dépasse la version 40 au niveau L.
  // minLevel (0 à 3, L par défaut) : niveau de correction minimal, pour les tests de toutes les tables.
  function encode(text, minLevel) {
    var bytes = utf8(text), ver, ecl = minLevel || 0;
    for (ver = 1; ver <= 40; ver++) if (bitsNeeded(ver, bytes.length) <= dataCodewords(ver, ecl) * 8) break;
    if (ver > 40) return null;
    for (var e = ecl + 1; e < 4; e++) if (bitsNeeded(ver, bytes.length) <= dataCodewords(ver, e) * 8) ecl = e;

    // Flux de bits : mode, longueur, octets, terminateur, alignement sur l'octet, octets de bourrage 0xEC 0x11.
    var bits = [];
    var put = function (val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4);
    put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCodewords(ver, ecl) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
      data.push(v);
    }

    // Blocs, correction Reed-Solomon, entrelacement.
    var nBlocks = BLOCKS[ecl][ver], eccLen = ECC_PER_BLOCK[ecl][ver];
    var raw = Math.floor(rawModules(ver) / 8);
    var nShort = nBlocks - raw % nBlocks, shortLen = Math.floor(raw / nBlocks);
    var div = rsDivisor(eccLen), blocks = [];
    for (var b = 0, k = 0; b < nBlocks; b++) {
      var dat = data.slice(k, k + shortLen - eccLen + (b < nShort ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (b < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var words = [];
    for (var c = 0; c < blocks[0].length; c++) {
      blocks.forEach(function (blk, n) {
        if (c !== shortLen - eccLen || n >= nShort) words.push(blk[c]);
      });
    }

    var size = ver * 4 + 17, m = [], fn = [];
    for (var y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    var set = function (x, yy, dark) { m[yy][x] = dark; fn[yy][x] = true; };

    // Motifs fixes : lignes de synchronisation, trois repères, motifs d'alignement, format et version.
    for (var t = 0; t < size; t++) { set(6, t, t % 2 === 0); set(t, 6, t % 2 === 0); }
    var finder = function (cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = alignPositions(ver, size);
    pos.forEach(function (ay, ai) {
      pos.forEach(function (ax, aj) {
        if ((ai === 0 && aj === 0) || (ai === 0 && aj === pos.length - 1) || (ai === pos.length - 1 && aj === 0)) return;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      });
    });
    var format = function (mask) {
      var d = (FORMAT_BITS[ecl] << 3) | mask, rem = d;
      for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var fb = ((d << 10) | rem) ^ 0x5412, bit = function (n) { return ((fb >>> n) & 1) !== 0; };
      for (var a = 0; a <= 5; a++) set(8, a, bit(a));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (a = 9; a < 15; a++) set(14 - a, 8, bit(a));
      for (a = 0; a < 8; a++) set(size - 1 - a, 8, bit(a));
      for (a = 8; a < 15; a++) set(8, size - 15 + a, bit(a));
      set(8, size - 8, true);
    };
    format(0);
    if (ver >= 7) {
      var rem = ver;
      for (var q = 0; q < 12; q++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (ver << 12) | rem;
      for (var s = 0; s < 18; s++) {
        var dark = ((vb >>> s) & 1) !== 0, pa = size - 11 + s % 3, pb = Math.floor(s / 3);
        set(pa, pb, dark); set(pb, pa, dark);
      }
    }

    // Placement en zigzag, deux colonnes à la fois, de bas en haut puis de haut en bas.
    var idx = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var x = right - jj, up = ((right + 1) & 2) === 0, yv = up ? size - 1 - vert : vert;
          if (!fn[yv][x] && idx < words.length * 8) {
            m[yv][x] = ((words[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0;
            idx++;
          }
        }
      }
    }

    // Masque : les huit sont essayés, le moins pénalisé est gardé.
    var flip = function (mask) {
      for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) {
        if (!fn[yy][xx] && maskBit(mask, xx, yy)) m[yy][xx] = !m[yy][xx];
      }
    };
    var best = 0, bestScore = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      flip(mk); format(mk);
      var sc = penalty(m, size);
      if (sc < bestScore) { bestScore = sc; best = mk; }
      flip(mk);
    }
    flip(best); format(best);
    return { version: ver, level: LEVELS[ecl], size: size, modules: m };
  }

  function alignPositions(ver, size) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2;
    var step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    var out = [6];
    for (var p = size - 7; out.length < n; p -= step) out.splice(1, 0, p);
    return out;
  }
  function maskBit(mask, x, y) {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return (x * y) % 2 + (x * y) % 3 === 0;
      case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
      default: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    }
  }
  // Pénalités de la norme : suites de 5 modules ou plus, carrés 2×2, motifs proches des repères, équilibre clair/foncé.
  function penalty(m, size) {
    var score = 0, dark = 0;
    // Motif 1:1:3:1:1 bordé de 4 modules clairs d'un côté ; la marge autour du code compte comme claire.
    var finderLike = function (line) {
      var str = "0000" + line.map(function (v) { return v ? "1" : "0"; }).join("") + "0000", hits = 0;
      for (var i = 0; i + 11 <= str.length; i++) {
        var w = str.substr(i, 11);
        if (w === "10111010000" || w === "00001011101") hits++;
      }
      return hits;
    };
    for (var y = 0; y < size; y++) {
      var row = m[y], col = [];
      for (var x = 0; x < size; x++) col.push(m[x][y]);
      [row, col].forEach(function (line) {
        var run = 1;
        for (var i = 1; i <= size; i++) {
          if (i < size && line[i] === line[i - 1]) run++;
          else { if (run >= 5) score += run - 2; run = 1; }
        }
        score += finderLike(line) * 40;
      });
      for (x = 0; x < size; x++) {
        if (row[x]) dark++;
        if (y < size - 1 && x < size - 1 && row[x] === row[x + 1] && row[x] === m[y + 1][x] && row[x] === m[y + 1][x + 1]) score += 3;
      }
    }
    var total = size * size;
    score += Math.max(0, Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  }

  // SVG : un chemin pour les modules foncés, marge blanche de 4 modules exigée par la norme.
  function svg(qr, label) {
    var q = 4, n = qr.size + q * 2, d = "";
    for (var y = 0; y < qr.size; y++) for (var x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) d += "M" + (x + q) + " " + (y + q) + "h1v1h-1z";
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + " " + n + '" shape-rendering="crispEdges" role="img" aria-label="' + label + '">'
      + '<rect width="' + n + '" height="' + n + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }
  // Taille affichée : 3 px par module (marge comprise), entre 216 et 480 px. Une liste de 8 sorties (version 33) reste
  // à 3 px par module, un lien court ne devient pas énorme. Fenêtre basse : la place sous le titre et le bouton décide.
  function displaySize(qr) { return Math.max(216, Math.min(480, (qr.size + 8) * 3)); }

  var WA = /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i;
  var DESKTOP = "(hover: hover) and (pointer: fine) and (min-width: 900px)";

  // ---------- Interface ----------
  var CSS = ".waqr{width:fit-content;min-width:min(420px,calc(100vw - 32px));max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);padding:0;border:1px solid var(--sheet-rule,#E3DACB);border-radius:16px;"
    + "background:var(--sheet-bg,#fff);color:var(--sheet-ink,#14262B);font-family:var(--sheet-text,'Manrope',system-ui,sans-serif);box-shadow:0 24px 60px rgb(0 0 0 / .22);overflow:auto}"
    + ".waqr::backdrop{background:var(--sheet-backdrop,rgb(11 59 60 / .45))}"
    + ".waqr-in{position:relative;padding:28px 28px 24px;text-align:center}"
    + ".waqr-t{margin:0 40px 6px;font:var(--sheet-head-weight,600) 26px/1.15 var(--sheet-head,'Cormorant Garamond',serif);color:var(--sheet-ink,#14262B)}"
    + ".waqr-sub{margin:0 0 18px;font-size:15px;line-height:1.45;color:var(--sheet-mute,#546A65)}"
    + ".waqr-code{display:block;margin:0 auto;padding:10px;background:#fff;border:1px solid var(--sheet-rule,#E3DACB);border-radius:12px;box-sizing:content-box}"
    + ".waqr-code svg{display:block;width:100%;height:auto}"
    + ".waqr-p{margin:14px 0 0;font-size:16px;line-height:1.4;font-weight:600}"
    + ".waqr-or{display:flex;align-items:center;gap:12px;margin:20px 0 16px;font-size:14px;color:var(--sheet-mute,#546A65)}"
    + ".waqr-or::before,.waqr-or::after{content:'';flex:1;height:1px;background:var(--sheet-rule,#E3DACB)}"
    + ".waqr-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 20px;border-radius:var(--r-btn,14px);"
    + "background:var(--sheet-cta,#0B3B3C);color:var(--sheet-cta-ink,#fff);font:600 16px/1.2 var(--sheet-text,'Manrope',system-ui,sans-serif);text-decoration:none}"
    + ".waqr-btn:hover{background:var(--sheet-cta-hover,#124B4C)}"
    + ".waqr-btn svg{width:20px;height:20px;flex:none}"
    + ".waqr-x{position:absolute;top:14px;right:14px;display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:50%;"
    + "background:var(--sheet-soft,#F6EFE4);color:var(--sheet-ink,#14262B);cursor:pointer}"
    + ".waqr-x svg{width:18px;height:18px}"
    + ".waqr :focus-visible{outline:none;box-shadow:var(--sheet-focus,0 0 0 2px #fff,0 0 0 4px #0F6B61)}"
    + ".waqr [hidden]{display:none}"
    + "@media(prefers-reduced-motion:no-preference){.waqr[open]{animation:waqr-in .22s cubic-bezier(.22,1,.36,1)}}"
    + "@keyframes waqr-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}";
  var ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.4.4 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var LABEL = "QR code that opens WhatsApp on your phone";

  function emit(doc, name, detail) {
    if (typeof CustomEvent === "function") doc.dispatchEvent(new CustomEvent(name, { detail: detail }));
  }
  function placementOf(el) {
    var p = el && el.closest ? el.closest("[data-track]") : null;
    return (p && p.getAttribute("data-track")) || "untagged";
  }
  function hasText(url) { return /[?&]text=/.test(url); }

  // Remplit un emplacement avec le QR code d'un lien ; renvoie false si le lien est trop long pour un QR code.
  function fill(slot, url) {
    var qr = encode(url);
    if (!qr) { slot.innerHTML = ""; return false; }
    var px = displaySize(qr);
    // Jamais sous 216 px : dans une fenêtre basse, le panneau défile plutôt que de rendre le code illisible.
    slot.style.width = "max(216px, min(" + px + "px, calc(100vh - 300px), calc(100vw - 96px)))";
    slot.innerHTML = svg(qr, LABEL);
    slot.setAttribute("data-qr-version", qr.version);
    slot.setAttribute("data-qr-level", qr.level);
    return true;
  }

  function mount(doc) {
    if (!doc.addEventListener || typeof window === "undefined" || !window.matchMedia) return;
    var mq = window.matchMedia(DESKTOP);
    var dlg = null, lastLink = null, where = "untagged";
    // Délai de réponse : site.json (replyTime.usual), posé sur la balise du script par consent-head.njk.
    var tag = doc.querySelector("script[data-wa-reply]"), reply = tag ? tag.getAttribute("data-wa-reply") : "";

    function build() {
      if (dlg) return dlg;
      var st = doc.createElement("style");
      st.textContent = CSS;
      doc.head.appendChild(st);
      dlg = doc.createElement("dialog");
      dlg.className = "waqr";
      dlg.setAttribute("aria-labelledby", "waqr-t");
      dlg.setAttribute("aria-describedby", "waqr-p");
      dlg.innerHTML = '<div class="waqr-in">'
        + '<button class="waqr-x" type="button" aria-label="Close" data-waqr-close>' + ICON_X + "</button>"
        + '<h2 class="waqr-t" id="waqr-t">Chat with us on WhatsApp</h2>'
        + '<p class="waqr-sub" data-waqr-sub></p>'
        + '<div class="waqr-code" data-waqr-code></div>'
        + '<p class="waqr-p" id="waqr-p">Scan with your phone\'s camera to open WhatsApp</p>'
        + '<p class="waqr-or">or</p>'
        + '<a class="waqr-btn" href="#" target="_blank" rel="noopener" data-wa-desktop>' + ICON_WA + "<span>Open WhatsApp on this computer</span></a>"
        + "</div>";
      doc.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg || (e.target.closest && e.target.closest("[data-waqr-close]"))) { e.preventDefault(); dlg.close(); return; }
        var open = e.target.closest && e.target.closest("[data-wa-desktop]");
        if (open) {
          emit(doc, "stt-wa-desktop-open", { placement: where });
          // Le lien s'ouvre (nouvel onglet ou application), le panneau se ferme derrière lui.
          setTimeout(function () { if (dlg.open) dlg.close(); }, 0);
        }
      });
      // Le focus reste dans le panneau : Tab et Maj+Tab tournent entre la croix et le bouton.
      dlg.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        var f = dlg.querySelectorAll("button, a[href]"), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      dlg.addEventListener("close", function () {
        // Lien remplacé entre-temps (liste de sorties redessinée) : le même emplacement, retrouvé par data-track.
        var back = lastLink && doc.contains(lastLink) ? lastLink : doc.querySelector('a[data-track="' + where + '"][href*="wa.me"], [data-tsend]');
        if (back && back.focus) back.focus();
        lastLink = null;
      });
      return dlg;
    }

    function open(link) {
      var url = link.href, d = build();
      lastLink = link;
      where = placementOf(link);
      var code = d.querySelector("[data-waqr-code]"), sub = d.querySelector("[data-waqr-sub]"), scan = d.querySelector("#waqr-p");
      var ok = fill(code, url);
      code.hidden = !ok;
      scan.hidden = !ok;
      d.querySelector(".waqr-or").hidden = !ok;
      sub.textContent = !ok ? "This message is too long for a QR code. Open WhatsApp on this computer to send it."
        : hasText(url) ? "Your message comes with it. You can change it before you send." : reply ? "We reply " + reply + "." : "";
      var btn = d.querySelector("[data-wa-desktop]");
      btn.href = url;
      if (!d.open) d.showModal();
      btn.focus();
      if (ok) emit(doc, "stt-wa-qr-shown", { placement: where });
    }

    // Clic simple sur un lien WhatsApp (phase de bulle : la liste de sorties a déjà mis son lien à jour, et un
    // envoi refusé par la validation est déjà annulé). Ctrl, Cmd, Maj ou clic du milieu : le navigateur fait comme d'habitude.
    doc.addEventListener("click", function (e) {
      if (!mq.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || !WA.test(a.href) || a.hasAttribute("data-wa-desktop")) return;
      // La feuille de réservation : ses liens de secours l'ouvrent, et son écran final a son propre QR code.
      if (a.hasAttribute("data-book") && doc.getElementById("book")) return;
      if (a.closest("#book")) return;
      e.preventDefault();
      open(a);
    });
  }

  // Écran final de la feuille : QR code du message, ordinateur seulement. Appelé par booking.js après l'envoi.
  function doneScreen(box, url) {
    if (!box) return;
    var desk = typeof window !== "undefined" && window.matchMedia && window.matchMedia(DESKTOP).matches;
    var slot = box.querySelector("[data-waqr-slot]");
    var ok = desk && slot ? fill(slot, url) : false;
    box.hidden = !ok;
    if (ok) emit(document, "stt-wa-qr-shown", { placement: "sheet_done" });
  }

  return { encode: encode, svg: svg, displaySize: displaySize, fill: fill, mount: mount, doneScreen: doneScreen, DESKTOP: DESKTOP };
});
