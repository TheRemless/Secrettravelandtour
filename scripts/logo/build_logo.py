# Assemble les pistes de logo en fichiers SVG autonomes dans src/images/brand/ :
#   a  : redessin fidèle du badge imprimé (cartes de visite, assets/emblem-hd.png) ;
#   b  : le même badge simplifié, aplats sans contour ;
#   bv : la piste b avec la silhouette du van, comme sur le badge imprimé.
# Le dessin des emblèmes est écrit à la main ci-dessous ; le mot-symbole vient de glyphs.json
# (contours Archivo produits par glyphs.py).
# Usage : python3 scripts/logo/build_logo.py src/images/brand
import json, os, sys

OUT = sys.argv[1]
G = json.load(open(os.path.join(os.path.dirname(__file__), "glyphs.json")))

DEEP = "#0A3F44"
SEA = "#0D5C63"
LAGOON = "#BFE6DF"
SAND = "#F5F0E6"
BEIGE = "#D8C59C"   # palmes et route, comme le beige du badge imprimé
WOOD = "#7A4A26"    # coque en bois du longtail
SUN = "#F0B429"
RED = "#B83A16"
WHITE = "#FFFFFF"


def leaves(cx, cy, specs, fill, leaf, stroke=None, sw=0, rib=None):
    """Palmes : une lame tournée, retournée selon le côté et mise à l'échelle, avec sa nervure si demandée."""
    out = []
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ""
    for angle, scale, flip in specs:
        sx = -scale if flip else scale
        tr = f'translate({cx} {cy}) scale({sx} {scale}) rotate({angle})'
        out.append(f'<path d="{leaf}" transform="{tr}" fill="{fill}"{st}/>')
        if rib:
            out.append(f'<path d="{rib}" transform="{tr}" fill="none" stroke="{stroke}" stroke-width="{sw * .8}"/>')
    return "".join(out)


# Lame de palme crantée dessous, comme les palmes du badge imprimé.
FROND = "M0 0C12-13 34-14 50 3C46 1 43 3 40 1C30-5 14-5 0 0Z"
FROND_RIB = "M2-1C16-9 34-9 48 2"
FROND_FLAT = "M0 0C8-9 22-9 32 1C22-2 10-1 0 0Z"


def trunk(d, outline=DEEP, fill=BEIGE, w=7):
    return (f'<path d="{d}" fill="none" stroke="{outline}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{fill}" stroke-width="{w - 3.4}" stroke-linecap="round"/>')


# ---------- Piste A : redessin fidèle ----------
# Cercle de centre (110, 110) et de rayon 94, ouvert à droite pour la proue et en bas à gauche pour la route.
A_W, A_H = 228, 218


def emblem_a(uid):
    crown_l = [(-22, .82, False), (14, .85, False), (44, .7, False), (-22, .82, True), (14, .85, True), (46, .68, True), (-66, .6, False)]
    crown_m = [(-18, .66, False), (18, .66, False), (-18, .66, True), (20, .62, True), (-64, .5, True)]
    return f'''<defs><clipPath id="{uid}"><circle cx="110" cy="110" r="92"/></clipPath></defs>
<g clip-path="url(#{uid})">
<rect width="228" height="218" fill="{LAGOON}"/>
<path fill="{SEA}" d="M92 140C94 128 98 120 104 120C110 120 112 130 114 140ZM150 140C152 130 156 124 160 125C165 126 167 133 169 140Z"/>
<path fill="{DEEP}" d="M18 140L21 118C17 108 17 95 23 87C29 79 40 79 44 88C48 96 46 106 44 114L46 140Z"/>
<path fill="{DEEP}" d="M44 140L46 122C43 112 45 101 52 97C58 93 65 97 67 105C69 113 67 122 67 130L68 140Z"/>
<path fill="{DEEP}" d="M172 140L174 120C171 110 175 99 183 97C191 95 198 103 199 113L203 140Z"/>
<path fill="{SEA}" d="M38 92C42 100 41 110 39 118L41 140L46 140L44 114C46 106 47 98 44 89ZM62 100C65 108 63 120 63 128L64 140H68L67 130C67 122 69 113 67 105ZM193 104C197 112 197 126 198 140H203L199 113C198 109 196 106 193 104Z"/>
<rect y="139" width="228" height="80" fill="{SEA}"/>
<path fill="none" stroke="{LAGOON}" stroke-width="1.8" stroke-linecap="round" d="M150 182q6-4 12 0t12 0M158 192q6-4 12 0t12 0M140 197q6-4 12 0"/>
<path fill="{SAND}" d="M-5 158C30 150 70 146 110 148C140 150 166 152 205 146L205 168C175 166 150 168 128 176C104 186 86 200 76 215L-5 215Z"/>
{trunk("M104 152C102 120 96 90 88 58")}
{trunk("M112 152C114 116 118 86 124 46")}
{trunk("M120 152C128 128 140 108 156 92")}
{leaves(88, 58, crown_l, BEIGE, FROND, DEEP, 1.4, FROND_RIB)}
{leaves(124, 46, crown_l, BEIGE, FROND, DEEP, 1.4, FROND_RIB)}
{leaves(156, 92, crown_m, BEIGE, FROND, DEEP, 1.4, FROND_RIB)}
</g>
<path fill="none" stroke="{DEEP}" stroke-width="5" stroke-linecap="round" d="M203.9 113.3A94 94 0 0 1 74.8 197.1M38 170.4A94 94 0 1 1 189.7 60.2"/>
<path fill="{BEIGE}" stroke="{DEEP}" stroke-width="1.8" stroke-linejoin="round" d="M20 214C33 190 68 170 112 162C130 158 146 156 162 156L162 162C146 162 130 164 116 168C82 178 62 198 58 214Z"/>
<path fill="none" stroke="{WHITE}" stroke-width="2.2" stroke-dasharray="6 5" d="M39 211C50 190 80 172 114 165C132 161 146 159 160 159"/>
<g stroke="{DEEP}" stroke-width="1.8" stroke-linejoin="round">
<path fill="{SAND}" d="M134 126H178V130H134Z"/>
<path fill="none" d="M138 130V144M174 130V144"/>
<path fill="{WOOD}" d="M124 146H190L204 96L214 62L220 64L210 104L200 152C188 166 144 166 124 156Z"/>
<path fill="none" stroke="{SUN}" stroke-width="2" d="M127 150C146 156 176 156 196 148"/>
</g>
<circle cx="214" cy="70" r="3.4" fill="{SUN}"/>
<path fill="none" stroke-width="3.4" stroke-linecap="round" stroke="{RED}" d="M211 74C208 86 213 96 209 110"/>
<path fill="none" stroke-width="3.4" stroke-linecap="round" stroke="{SUN}" d="M214.5 75C214.5 88 210.5 98 214.5 112"/>
<path fill="none" stroke-width="3.4" stroke-linecap="round" stroke="{SEA}" d="M218 73C220 85 217 95 221 106"/>
<g transform="translate(-12 -12) scale(1.13)">
<path fill="{WHITE}" stroke="{DEEP}" stroke-width="2" stroke-linejoin="round" d="M48 157L48.5 139C49 131 52 127 59 125.5L94 120.5C102 119.6 109 121 114 125L124 134.5C130 136 137 138.5 140 142L142 150C142.5 155 140.5 158 136 158.5L52 159.5C49.5 159.5 48 158.8 48 157Z"/>
<path fill="{LAGOON}" d="M49.5 146.5L141 146L142 150C142.5 155 140.5 158 136 158.5L52 159.5C49.5 159.5 48.5 158.8 48.5 157Z"/>
<path fill="none" stroke="{DEEP}" stroke-width="1.6" d="M49.5 146.5L141 146"/>
<path fill="{DEEP}" d="M55 131.5C55.5 129.5 57 128.4 60 128L99 123.5C103.5 123 106.5 124 108.5 126L118 135.5L55 137.5Z"/>
<path fill="none" stroke="{WHITE}" stroke-width="2.2" d="M68 127L66 138M85 125V137.5M102 123.5L104 136.5"/>
<path fill="none" stroke="{DEEP}" stroke-width="1.2" d="M85 138V146"/>
<path fill="{DEEP}" d="M135 139.5L140.5 141.5L141.5 145L134 144.5Z"/>
<path fill="{SAND}" d="M128 138L134 139.5L133.5 142.5L127.5 141.5Z"/>
<circle cx="64" cy="159.5" r="8" fill="{DEEP}"/><circle cx="123" cy="158.5" r="8" fill="{DEEP}"/>
<circle cx="64" cy="159.5" r="3.6" fill="{SAND}"/><circle cx="123" cy="158.5" r="3.6" fill="{SAND}"/>
</g>'''


# ---------- Piste B : simplifiée, aplats sans contour ----------
# Disque de centre (52, 55) et de rayon 48 ; la proue et le ruban sortent du disque à droite.
B_W, B_H = 112, 106


def emblem_b(uid, van=False):
    crown = [(-26, 1, True), (8, .95, True), (38, .8, True), (-34, .78, False), (4, .72, False), (-78, .55, False)]
    van_art = ""
    if van:
        # Silhouette du van découpée dans le pied des karsts, comme sur le badge imprimé.
        van_art = f'''<path fill="{DEEP}" d="M15 75V68.5C15 66.8 16.2 65.6 18 65.5L32.5 64.6C34.4 64.5 36 65.3 37.2 66.8L40.6 70.2C41.6 71 42 72 42 73.2V75Z"/>
<path fill="{LAGOON}" d="M18.4 67.4L32 66.6L35 69.3L18.4 69.8Z"/>
<circle cx="20.5" cy="75.6" r="2.4" fill="{DEEP}"/><circle cx="36.5" cy="75.6" r="2.4" fill="{DEEP}"/>'''
    return f'''<defs><clipPath id="{uid}"><circle cx="52" cy="55" r="48"/></clipPath></defs>
<circle cx="52" cy="55" r="48" fill="{DEEP}"/>
<g clip-path="url(#{uid})">
<path fill="{LAGOON}" d="M11 77L12.5 64C10 60 10.5 54 12 50L13 42C14 37 17 34 21 33.5L25 34C28 35 29.5 39 29.5 43L28.5 50L30.5 56L29.5 63L31.5 77Z"/>
<path fill="{LAGOON}" d="M29 77L30 70L29 64L31 58C32 55 35 54 38 54.5L43 55.5C45 56 46 58 45.5 61L44.5 66L46 77Z"/>
<rect y="76.5" width="112" height="2.6" fill="{LAGOON}"/>
<path fill="{SUN}" d="M55.5 77.5C57.5 63 63 49 71.5 37L74.5 39C67 51 62 64 60.5 77.5Z"/>
{leaves(73, 38, crown, SUN, FROND_FLAT)}
{van_art}
</g>
<path fill="{SUN}" d="M15 81.5L18.5 84.5C36 86 60 86 80 84C87 72 95 54 103 34L107.5 35C103 56 96.5 75 89 89C66 93 38 93 22 90C18.5 88 16 85 15 81.5Z"/>
<path fill="{RED}" d="M102.6 39.5C100.4 47 104.6 52.5 101.6 61.5L104.8 62C107.6 52.5 103.6 47 105.8 40Z"/>
<path fill="{RED}" d="M106.4 40C106.2 48 109.4 52 107.2 59L110 59.4C112 52 108.8 47.5 109.2 40.4Z"/>'''


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}" role="img">'
            f'<title>{title}</title>{body}</svg>\n')


def word(x, y, size, which, fill):
    g = G[which]
    s = size / g["upm"]
    return f'<path fill="{fill}" transform="translate({x:g} {y:g}) scale({s:g})" d="{g["d"]}"/>', g["advance"] * s


TITLE = "Secret Travel &amp; Tour, Koh Lanta"
OPTIONS = {
    "a": (A_W, A_H, lambda uid: emblem_a(uid)),
    "b": (B_W, B_H, lambda uid: emblem_b(uid)),
    "bv": (B_W, B_H, lambda uid: emblem_b(uid, van=True)),
}


def emblem_group(option, uid, height, x, y):
    w, h, art = OPTIONS[option]
    k = height / h
    return f'<g transform="translate({x:g} {y:g}) scale({k:g})">{art(uid)}</g>', w * k


def lockups(option):
    files = {}
    w, h, art = OPTIONS[option]
    files[f"stt-{option}-emblem.svg"] = svg(w, h, art(f"c{option}"), TITLE)

    for tone in ("dark", "light"):
        ink = DEEP if tone == "dark" else WHITE
        sub = SEA if tone == "dark" else LAGOON
        suffix = "" if tone == "dark" else "-light"

        # Horizontal : emblème haut de 100, titre, lieu dessous.
        E = 100
        em, ew = emblem_group(option, f"h{option}{tone}", E, 0, 0)
        tx = ew + 16
        t_path, t_w = word(tx, 50, 38, "title", ink)
        p_path, p_w = word(tx, 50 + 12 + 24 * .686 + 2, 24, "place", sub)
        files[f"stt-{option}-horizontal{suffix}.svg"] = svg(round(tx + max(t_w, p_w) + 2, 1), E, em + t_path + p_path, TITLE)

        # Horizontal compact, pour les hauteurs sous 64 px : sans « Koh Lanta », titre centré sur l'emblème.
        em, ew = emblem_group(option, f"k{option}{tone}", E, 0, 0)
        tx = ew + 14
        t_path, t_w = word(tx, 50 + 46 * .686 / 2, 46, "title", ink)
        files[f"stt-{option}-compact{suffix}.svg"] = svg(round(tx + t_w + 2, 1), E, em + t_path, TITLE)

        # Empilé : emblème centré, titre, lieu.
        t0, t_w2 = word(0, 0, 44, "title", ink)
        p0, p_w2 = word(0, 0, 26, "place", sub)
        E2 = 150
        ew2 = w * E2 / h
        W = round(max(t_w2, ew2) + 4, 1)
        ty = E2 + 22 + 44 * .686
        py = ty + 16 + 26 * .686
        t_path2, _ = word((W - t_w2) / 2, ty, 44, "title", ink)
        p_path2, _ = word((W - p_w2) / 2, py, 26, "place", sub)
        em2, _ = emblem_group(option, f"s{option}{tone}", E2, (W - ew2) / 2, 0)
        files[f"stt-{option}-stacked{suffix}.svg"] = svg(W, round(py + 6, 1), em2 + t_path2 + p_path2, TITLE)
    return files


for opt in OPTIONS:
    for name, content in lockups(opt).items():
        with open(os.path.join(OUT, name), "w") as f:
            f.write(content)
        print(name, len(content))
