"""Maquettes « Laque et or » : hub.html et deux pages trajet, générées depuis les JSON du dépôt.

Lancer depuis n'importe où : python3 build.py. Lit src/_data/*.json et la feuille de réservation rendue
dans _site/taxi/krabi-airport-koh-lanta/index.html (balisage imposé, recopié tel quel).
"""
import json
import re
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
DATA = ROOT / "src" / "_data"
BASE = "/docs/refonte/taxi-v1/propositions/laque"
IMG = "/src/images"
WA = "66958683846"

routes_data = json.loads((DATA / "taxiRoutes.json").read_text())
taxi = json.loads((DATA / "taxi.json").read_text())
vip = json.loads((DATA / "site.json").read_text())["brands"]["vip"]
ROUTES = {r["id"]: r for r in routes_data["routes"]}
REGIONS = routes_data["regions"]
COMMON = routes_data["common"]
RATING = vip["rating"]


def e(s):
    return escape(str(s), quote=True)


def wa_link(text=""):
    from urllib.parse import quote
    return f"https://wa.me/{WA}" + (f"?text={quote(text)}" if text else "")


SRC_PAGE = (ROOT / "_site" / "taxi" / "krabi-airport-koh-lanta" / "index.html").read_text()
ICON_WA = re.search(r'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17\.47.*?</svg>', SRC_PAGE).group(0)
ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>'
ICON_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>'
STAR = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z"/></svg>'

# Arc thaï (ซุ้ม) : forme du cadre photo et trait d'or qui le suit. viewBox 400 x 500.
ARCH_MASK = "M28 502V270C28 168 118 112 200 40C282 112 372 168 372 270V502Z"
ARCH_LEFT = "M200 14C112 92 14 156 14 268V502"
ARCH_RIGHT = "M200 14C288 92 386 156 386 268V502"
# Pointe de flamme et deux crochets kranok près de la pointe (tracés en premier).
ARCH_TIP = ("M200 14C194 6 195 -4 200 -10C205 -4 206 6 200 14"
            "M168 42C156 38 152 26 160 22C166 19 170 25 165 28"
            "M232 42C244 38 248 26 240 22C234 19 230 25 235 28")
# Crochets d'épaule (hang hong), tracés quand l'or passe à leur hauteur.
ARCH_SHOULDER = ("M14 292C2 290 -6 278 0 268C5 261 13 265 9 272"
                 "M386 292C398 290 406 278 400 268C395 261 387 265 391 272")


def arch(img_html, cls="arch", draw=True):
    paths = (f'<path class="a-l" pathLength="1" d="{ARCH_LEFT}"/>'
             f'<path class="a-r" pathLength="1" d="{ARCH_RIGHT}"/>'
             f'<path class="a-t" pathLength="1" d="{ARCH_TIP}"/>'
             f'<path class="a-s" pathLength="1" d="{ARCH_SHOULDER}"/>')
    return (f'<figure class="{cls}{" is-draw" if draw else ""}">'
            f'<div class="arch-photo">{img_html}</div>'
            f'<svg class="arch-line" viewBox="0 -2 400 504" preserveAspectRatio="none" aria-hidden="true" focusable="false">{paths}</svg>'
            f'</figure>')


def head(title, desc, extra=""):
    return f"""<!doctype html>
<html lang="en-GB" data-brand="vip">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#1B130D">
<link rel="preload" as="font" type="font/woff2" href="{BASE}/fonts/chonburi-400-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="{BASE}/fonts/bai-jamjuree-400-latin.woff2" crossorigin>
<link rel="stylesheet" href="/_site/css/booking.css">
<link rel="stylesheet" href="{BASE}/taxi.css">
<link rel="icon" type="image/png" sizes="32x32" href="{IMG}/taxi/icon-32.png">
<script>document.documentElement.classList.add("js");</script>{extra}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="/taxi/"><span class="disc disc--crop"><img src="{IMG}/taxi/logo.webp" width="640" height="640" alt=""></span><span class="brand-name">VIP Taxi Lanta<small>Mr. Brown</small></span></a>
    <a class="top-wa" href="{wa_link()}">{ICON_WA}<span>WhatsApp</span></a>
  </div>
</header>
"""


def route_row(r, current=False):
    drive = f'<span class="rr-time">{e(r["drive"])}</span>' if r.get("drive") else ""
    return (f'<li><a class="rr" href="/taxi/{e(r["id"])}/">'
            f'<span class="rr-pair">{e(r["from"])} <span class="rr-word">to</span> {e(r["to"])}</span>'
            f'{drive}{ICON_CHEV}</a></li>')


def faq_list(items, hid):
    out = [f'<div class="faq" aria-labelledby="{hid}">']
    for q in items:
        out.append(f'<details><summary><span>{e(q["q"])}</span><span class="faq-mark" aria-hidden="true"></span></summary>'
                   f'<div class="faq-a"><p>{e(q["a"])}</p></div></details>')
    out.append("</div>")
    return "\n".join(out)


def secret_aside(compact=False):
    t = taxi["tours"]
    photo = (f'<img src="{IMG}/secret/v3/card-4-islands.jpg" width="1421" height="1066" loading="lazy" decoding="async" '
             f'alt="Snorkellers in turquoise water at the foot of a limestone cliff">')
    links = [("/tours/4-islands/", "4 Islands"), ("/tours/koh-rok-koh-haa/", "Koh Rok &amp; Koh Haa"),
             ("/tours/elephant-sanctuary/", "Elephant sanctuary")]
    lis = "".join(f'<li><a href="{h}">{n}{ICON_CHEV}</a></li>' for h, n in links)
    return f"""<aside class="stt{' stt--compact' if compact else ''}" aria-labelledby="stt-h">
  <div class="wrap stt-in">
    <figure class="stt-photo">{photo}</figure>
    <div class="stt-text">
      <img class="stt-emblem" src="{IMG}/secret/emblem.webp" width="240" height="198" alt="Secret Travel &amp; Tour" loading="lazy">
      <h2 id="stt-h">{e(t["kicker"])} on Koh Lanta</h2>
      <p>{e(t["text"])}</p>
      <ul class="stt-links">{lis}</ul>
      <a class="stt-btn" href="{e(t["link"]["href"])}">{e(t["link"]["label"])}</a>
    </div>
  </div>
</aside>"""


def footer():
    return f"""<footer class="foot">
  <div class="wrap foot-in">
    <span class="disc disc--lg"><img src="{IMG}/taxi/logo.webp" width="640" height="640" alt="VIP Taxi Lanta, Mr. Brown" loading="lazy"></span>
    <div class="foot-col">
      <p class="foot-name">VIP Taxi Lanta</p>
      <p>Mr. Brown, based on Koh Lanta.</p>
      <p><a href="{e(vip["maps"])}">Google Maps listing</a></p>
    </div>
    <div class="foot-col">
      <p class="foot-name">WhatsApp</p>
      <p><a href="{wa_link()}">+66 95 868 38 46</a></p>
      <p>We usually reply within 6 hours, Thailand time.</p>
    </div>
    <div class="foot-legal">
      <p>Bookings sold by Zwald Travel Planner Co., Ltd.</p>
      <ul><li><a href="/terms/">Booking terms</a></li><li><a href="/legal/">Legal notice</a></li><li><a href="/privacy/">Privacy</a></li></ul>
    </div>
  </div>
</footer>"""


# ---------- Feuille de réservation : balisage rendu par booking.njk, recopié ----------
SHEET_KRABI = SRC_PAGE[SRC_PAGE.index('<dialog class="sheet"'):SRC_PAGE.index('<script type="application/json" id="book-data">')]


def sheet_for_route(r):
    s = SHEET_KRABI
    a, b = "Krabi Airport to Koh Lanta", f'{r["from"]} to {r["to"]}'
    s = s.replace("Koh Lanta to Krabi Airport", f'{r["to"]} to {r["from"]}').replace(a, b)
    cfg = {"variant": "taxi", "brand": "VIP Taxi Lanta", "product": b, "productId": f'taxi-{r["id"]}',
           "from": r["from"], "to": r["to"], "page": f'secrettravelandtour.com/taxi/{r["id"]}/', "whatsapp": WA}
    return s + f'<script type="application/json" id="book-data">{json.dumps(cfg)}</script>\n'


def text_field(name, label):
    # Même sortie que la macro text() de booking.njk (required, sans aide).
    return (f'<div class="f">\n  <label for="book-{name}">{label}</label>\n  \n'
            f'  <input id="book-{name}" name="{name}" type="text" autocomplete="off" required aria-required="true" aria-describedby="book-e-{name}">\n'
            f'  <p class="err" id="book-e-{name}" hidden></p>\n</div>')


def sheet_free():
    """Variante sans trajet fixé (booking.njk : cfg sans from ni to) : deux champs libres From / To."""
    s = SHEET_KRABI
    s = re.sub(r'<fieldset class="f">\s*<legend>Direction</legend>.*?</fieldset>',
               text_field("from", "From") + "\n        " + text_field("to", "To"), s, count=1, flags=re.S)
    s = s.replace('data-back="Pickup hotel or address">Drop-off hotel or address</label>',
                  'data-back="Pickup hotel or address">Hotel or address</label>')
    s = s.replace("Krabi Airport to Koh Lanta", "Private transfer")
    cfg = {"variant": "taxi", "brand": "VIP Taxi Lanta", "product": "Private transfer", "productId": "taxi-request",
           "page": "secrettravelandtour.com/taxi/", "whatsapp": WA}
    return s + f'<script type="application/json" id="book-data">{json.dumps(cfg)}</script>\n'


SCRIPTS = (f'<script src="/_site/js/booking.js" defer></script>\n'
           f'<script src="{BASE}/taxi.js" defer></script>\n</body>\n</html>\n')


def vbar(label, wa_text):
    return (f'<aside class="vbar" aria-label="{e(label)}"><p>Price on WhatsApp<small>Cash to the driver</small></p>'
            f'<a class="btn btn--gold" href="{wa_link(wa_text)}" data-book>{e(label)}</a></aside>')


# ---------- Hub ----------
def hub():
    h = taxi["hero"]
    hero_img = (f'<img src="{IMG}/taxi/hero-ceiling-1800.webp" srcset="{IMG}/taxi/hero-ceiling-900.webp 900w, {IMG}/taxi/hero-ceiling-1800.webp 1800w" '
                f'sizes="(min-width: 64rem) 40vw, 92vw" width="1800" height="1350" fetchpriority="high" alt="{e(h["photo"]["alt"])}">')
    regions = []
    for i, g in enumerate(REGIONS):
        rows = "".join(route_row(ROUTES[rid]) for rid in g["routes"])
        regions.append(f'<section class="region" aria-labelledby="rg-{i}"><h3 id="rg-{i}">{e(g["name"])}</h3>'
                       f'<p class="region-intro">{e(g["intro"])}</p><ul class="rr-list">{rows}</ul></section>')
    steps = "".join(f'<li><p class="step-t">{e(s["title"])}</p><p>{e(s["text"])}</p></li>' for s in taxi["steps"])
    why = "".join(f'<div><dt>{e(w["title"])}</dt><dd>{e(w["text"])}</dd></div>' for w in taxi["why"])
    g = taxi["gallery"]["photos"]
    stars = STAR * 5
    body = f"""<main id="main">
<section class="hero" aria-labelledby="h1">
  <div class="wrap hero-in">
    <h1 id="h1">{e(h["title"])}</h1>
    {arch(hero_img)}
    <div class="hero-text">
      <p class="lead">{e(h["lead"])}</p>
      <div class="hero-act">
        <a class="btn btn--gold" href="{wa_link("Transfer request")}" data-book>Request a transfer</a>
        <a class="link-lac" href="#routes">See the 17 routes</a>
      </div>
    </div>
  </div>
</section>

<section class="routes" id="routes" aria-labelledby="h-routes">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-routes">Where we drive</h2>
      <p>Every route runs both ways, in a private minivan. Prices on WhatsApp.</p>
    </div>
    <div class="regions">{"".join(regions)}
    <div class="elsewhere">
      <div>
        <h3>Not on the list?</h3>
        <p>{e(routes_data["further"])}</p>
      </div>
      <a class="btn btn--lac" href="{wa_link("Transfer request")}" data-book>Ask for another route</a>
    </div></div>
  </div>
</section>

<section class="book" aria-labelledby="h-book">
  <div class="wrap book-in">
    <div class="book-how">
      <h2 id="h-book">How to book</h2>
      <ol class="steps">{steps}</ol>
    </div>
    <div class="book-side">
      <div class="pay" data-frame="still">
        <h3>Payment</h3>
        <p>{e(taxi["payment"]["text"])}</p>
      </div>
      <a class="rating" href="{e(RATING["url"])}">
        <span class="stars">{stars}</span>
        <span class="rating-t">Rated {RATING["value"]:.1f} on Google<small>{RATING["count"]} reviews, read them on Google Maps</small></span>
      </a>
    </div>
  </div>
</section>

<section class="van" aria-labelledby="h-van">
  <div class="wrap van-in">
    <figure class="van-wide"><img src="{IMG}/taxi/van-exterior.webp" width="900" height="675" loading="lazy" decoding="async" alt="{e(g[0]["alt"])}"></figure>
    <div class="van-text">
      <h2 id="h-van">{e(taxi["gallery"]["title"])}</h2>
      <dl class="why">{why}</dl>
    </div>
    <figure class="van-in-photo"><img src="{IMG}/taxi/van-welcome.webp" width="900" height="675" loading="lazy" decoding="async" alt="{e(g[2]["alt"])}"></figure>
  </div>
</section>

<section class="qa" aria-labelledby="h-faq">
  <div class="wrap qa-in">
    <h2 id="h-faq">Questions</h2>
    {faq_list(taxi["faq"], "h-faq")}
  </div>
</section>

{secret_aside()}
</main>
"""
    return (head(vip["legacyText"]["title"], vip["legacyText"]["metaDescription"]) + body + footer() + "\n"
            + vbar("Request a transfer", "Transfer request") + "\n" + sheet_free() + SCRIPTS)


# ---------- Page trajet (un gabarit pour les 17) ----------
def route_page(rid):
    r = ROUTES[rid]
    pair = f'{r["from"]} to {r["to"]}'
    tail = r["h1"][len(pair):] if r["h1"].startswith(pair) else ""
    if tail:
        h1 = (f'<h1 id="h1" class="cart-h1"><span class="c-from">{e(r["from"])}</span> <span class="c-word">to</span> '
              f'<span class="c-to">{e(r["to"])}</span><span class="c-tail"><span class="sr-only">,</span> {e(tail.lstrip(", "))}</span></h1>')
    else:
        h1 = f'<h1 id="h1" class="cart-h1 cart-h1--plain">{e(r["h1"])}</h1>'
    code = f'<p class="c-code"><span class="sr-only">Airport code </span>{e(r["code"])}</p>' if r.get("code") else ""
    drive = f'<p class="c-drive">{e(r["drive"].capitalize())}<span class="sr-only"> by road</span></p>' if r.get("drive") else ""
    body_p = "".join(f"<p>{e(p)}</p>" for p in r.get("body", []))
    how = "".join(f'<div><dt>{e(x["title"])}</dt><dd>{e(x["text"])}</dd></div>' for x in COMMON["how"])
    seen, faqs = set(), []
    for q in r.get("faq", []) + COMMON["faq"]:
        if q["q"] not in seen:
            seen.add(q["q"]); faqs.append(q)
    region = next((g for g in REGIONS if rid in g["routes"]), None)
    others = [ROUTES[x] for x in (region["routes"] if region else []) if x != rid]
    other_html = ""
    if others:
        other_html = f"""<section class="others" aria-labelledby="h-others">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-others">Other routes in {e(region["name"])}</h2></div>
    <ul class="rr-list rr-list--wide">{"".join(route_row(o) for o in others)}</ul>
    <p class="all-routes"><a class="link-ink" href="/taxi/">All 17 routes</a></p>
  </div>
</section>"""
    seats = (f'<img src="{IMG}/taxi/van-seats.webp" width="900" height="675" loading="lazy" decoding="async" '
             f'alt="Minivan interior with diamond-stitched tan leather seats and a lit ceiling">')
    main = f"""<main id="main" class="is-route">
<section class="hero hero--route" aria-labelledby="h1">
  <div class="wrap hero-in">
    <nav class="crumb" aria-label="Breadcrumb"><a href="/taxi/">{ICON_BACK}<span>All routes</span></a></nav>
    <div class="cart" data-frame>
      {code}
      {h1}
      {drive}
    </div>
    <div class="route-lead">
      <p class="lead">{e(r["lead"])}</p>
      <div class="hero-act">
        <a class="btn btn--gold" href="{wa_link("Transfer request: " + pair)}" data-book>Check availability</a>
        <p class="hero-note">Price on WhatsApp.</p>
      </div>
    </div>
  </div>
</section>

<section class="detail" aria-labelledby="h-detail">
  <div class="wrap detail-in">
    <div class="detail-text">
      <h2 id="h-detail">How this transfer works</h2>
      <div class="prose">{body_p}</div>
      <dl class="why why--route">{how}</dl>
    </div>
    {arch(seats, "arch arch--still", draw=False)}
  </div>
</section>

<section class="qa" aria-labelledby="h-faq">
  <div class="wrap qa-in">
    <h2 id="h-faq">Questions</h2>
    {faq_list(faqs, "h-faq")}
  </div>
</section>

{other_html}

{secret_aside(compact=True)}
</main>
"""
    return (head(r["title"], r["metaDescription"]) + main + footer() + "\n"
            + vbar("Check availability", "Transfer request: " + pair) + "\n" + sheet_for_route(r) + SCRIPTS)


(HERE / "hub.html").write_text(hub())
for rid in ("krabi-airport-koh-lanta", "krabi-airport-khao-lak"):
    (HERE / f"{rid}.html").write_text(route_page(rid))
print("ok")
