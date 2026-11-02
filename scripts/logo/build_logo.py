# Assemble les deux pistes de logo (A fidèle, B simplifiée) en fichiers SVG autonomes.
# Le dessin de l'emblème est écrit à la main ci-dessous ; le mot-symbole vient de glyphs.json.
import json, os, sys

OUT = sys.argv[1]
G = json.load(open(os.path.join(os.path.dirname(__file__), "glyphs.json")))

DEEP = "#0A3F44"
SEA = "#0D5C63"
LAGOON = "#BFE6DF"
SUN = "#F0B429"
WHITE = "#FFFFFF"


def leaves(cx, cy, specs, fill, stroke=None, sw=0):
    """Palmes : une lame recourbée, tournée et retournée selon le côté."""
    leaf = "M0 0C10-11 27-11 38 1C27-3 12-2 0 0Z"
    out = []
    for angle, scale, flip in specs:
        sx = -scale if flip else scale
        st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ""
        out.append(f'<path d="{leaf}" transform="translate({cx} {cy}) scale({sx} {scale}) rotate({angle})" fill="{fill}"{st}/>')
    return "".join(out)


# ---------- Piste A : le badge redessiné à plat, 5 couleurs ----------
def emblem_a(uid):
    crown = [(-28, 1, False), (8, 1, False), (36, .9, False), (-28, 1, True), (8, 1, True), (40, .85, True), (-70, .8, False)]
    small = [(-24, .75, False), (12, .75, False), (-24, .75, True), (14, .7, True), (-70, .6, True)]
    return f'''<defs><clipPath id="{uid}"><circle cx="100" cy="100" r="89"/></clipPath></defs>
<g clip-path="url(#{uid})">
<rect width="200" height="200" fill="{LAGOON}"/>
<path fill="{SEA}" d="M4 134C7 112 12 96 21 88C27 83 33 85 36 93C39 82 47 76 55 82C61 88 61 106 63 134Z"/>
<path fill="{SEA}" d="M68 134C70 124 74 118 80 118C86 118 89 125 91 134Z"/>
<path fill="{SEA}" d="M140 134C142 120 147 109 155 105C161 102 165 107 167 113C171 105 179 104 185 112C190 120 193 128 196 134Z"/>
<rect y="132" width="200" height="70" fill="{DEEP}"/>
<path fill="none" stroke="{LAGOON}" stroke-width="2" stroke-linecap="round" d="M10 141q5-3 10 0t10 0M150 182q6-4 12 0t12 0M160 192q6-4 12 0t12 0"/>
<path fill="{WHITE}" d="M-5 152C40 141 90 137 130 141C160 144 185 151 205 159L205 172C172 168 142 171 120 179C98 187 82 199 72 212L-5 212Z"/>
<path fill="none" stroke="{DEEP}" stroke-width="5" stroke-linecap="round" d="M100 152C98 120 92 90 84 60M109 152C111 118 115 86 119 48M118 150C126 124 137 105 150 86"/>
{leaves(84, 60, crown, SUN, DEEP, 1.6)}
{leaves(119, 48, crown, SUN, DEEP, 1.6)}
{leaves(150, 86, small, SUN, DEEP, 1.6)}
<g stroke="{DEEP}" stroke-width="2" stroke-linejoin="round">
<path fill="none" stroke-linecap="round" d="M134 134H164M137 134V145M161 134V145"/>
<path fill="{SUN}" d="M120 145H172C174 137 176 126 180 113L183 114C181 128 180 140 178 151C166 161 136 161 124 153Z"/>
<path fill="none" d="M124 150C144 156 166 156 177 147"/>
</g>
<path fill="none" stroke-width="2.4" stroke-linecap="round" d="M182 116C180 124 183 130 181 138" stroke="{WHITE}"/>
<path fill="none" stroke-width="2.4" stroke-linecap="round" d="M184 116C185 125 182 131 185 139" stroke="{SEA}"/>
<path fill="{DEEP}" d="M16 212C28 188 58 169 100 161C120 157 140 157 162 159L160 166C138 165 117 167 101 171C75 179 57 195 53 212Z"/>
<path fill="none" stroke="{WHITE}" stroke-width="2.4" stroke-dasharray="7 6" d="M35 206C47 187 73 173 103 166C123 162 142 161 160 162"/>
<g transform="translate(-8 16) scale(.92)">
<path fill="{WHITE}" stroke="{DEEP}" stroke-width="2.2" stroke-linejoin="round" d="M52 150L54 132C55 126 60 122 68 122H104C110 122 114 126 118 132L126 138C130 140 132 143 132 148V152C132 154 130 156 128 156H56C53 156 52 154 52 150Z"/>
<path fill="{DEEP}" d="M59 128H101C105 128 108 131 112 137H59Z"/>
<path stroke="{WHITE}" stroke-width="2.2" d="M74 127V138M89 127V138"/>
<path fill="none" stroke="{DEEP}" stroke-width="1.6" d="M56 145H130"/>
<circle cx="67" cy="156" r="6.5" fill="{DEEP}"/><circle cx="117" cy="156" r="6.5" fill="{DEEP}"/>
<circle cx="67" cy="156" r="2.4" fill="{WHITE}"/><circle cx="117" cy="156" r="2.4" fill="{WHITE}"/>
</g>
</g>
<circle cx="100" cy="100" r="91" fill="none" stroke="{DEEP}" stroke-width="5"/>'''


# ---------- Piste B : le même badge réduit à l'essentiel, 3 couleurs ----------
def emblem_b(uid):
    crown = [(-30, .62, False), (6, .62, False), (-30, .62, True), (6, .62, True), (-72, .5, False)]
    return f'''<defs><clipPath id="{uid}"><circle cx="50" cy="50" r="48"/></clipPath></defs>
<circle cx="50" cy="50" r="48" fill="{DEEP}"/>
<g clip-path="url(#{uid})">
<path fill="{LAGOON}" d="M14 73C15 58 17 45 22 37C26 31 32 31 35 37C38 44 39 57 41 73Z"/>
<path fill="{LAGOON}" d="M35 73C37 63 41 57 46 57C51 57 53 65 54 73Z"/>
<path fill="none" stroke="{LAGOON}" stroke-width="2.6" d="M0 72H100"/>
<path fill="none" stroke="{SUN}" stroke-width="4" stroke-linecap="round" d="M67 71C68 58 65 46 60 33"/>
{leaves(60, 33, crown, SUN)}
<path fill="{SUN}" d="M12 80C30 84 58 84 72 80C77 75 81 65 83 51L87 52C87 67 84 80 78 88C60 92 30 91 17 86Z"/>
<path fill="none" stroke="{LAGOON}" stroke-width="2.4" stroke-linecap="round" d="M85.5 55C83.5 60 86.5 64 84.5 70"/>
</g>'''


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}" role="img">'
            f'<title>{title}</title>{body}</svg>\n')


def word(x, y, size, which, fill):
    g = G[which]
    s = size / g["upm"]
    return f'<path fill="{fill}" transform="translate({x:g} {y:g}) scale({s:g})" d="{g["d"]}"/>', g["advance"] * s


TITLE = "Secret Travel &amp; Tour, Koh Lanta"


def emblem_group(option, uid, size, x, y):
    art = emblem_a(uid) if option == "a" else emblem_b(uid)
    k = size / (200 if option == "a" else 100)
    return f'<g transform="translate({x:g} {y:g}) scale({k:g})">{art}</g>'


def lockups(option):
    files = {}
    # Emblème seul (favicon)
    vb = 200 if option == "a" else 100
    art = emblem_a(f"c{option}") if option == "a" else emblem_b(f"c{option}")
    files[f"stt-{option}-emblem.svg"] = svg(vb, vb, art, TITLE)

    for tone in ("dark", "light"):
        ink = DEEP if tone == "dark" else WHITE
        sub = SEA if tone == "dark" else LAGOON
        suffix = "" if tone == "dark" else "-light"

        # Horizontal : emblème 100, titre sur la ligne de base 50, lieu dessous.
        E = 100
        t_size, p_size = 38, 24
        tx = E + 18
        t_path, t_w = word(tx, 50, t_size, "title", ink)
        p_path, p_w = word(tx, 50 + 12 + p_size * .686 + 2, p_size, "place", sub)
        w = tx + max(t_w, p_w) + 2
        body = emblem_group(option, f"h{option}{tone}", E, 0, 0) + t_path + p_path
        files[f"stt-{option}-horizontal{suffix}.svg"] = svg(round(w, 1), E, body, TITLE)

        # Empilé : emblème centré, titre, lieu.
        t_size2, p_size2 = 44, 26
        t_path0, t_w2 = word(0, 0, t_size2, "title", ink)
        p_path0, p_w2 = word(0, 0, p_size2, "place", sub)
        W = round(t_w2 + 4, 1)
        E2 = 150
        ty = E2 + 22 + t_size2 * .686
        py = ty + 16 + p_size2 * .686
        t_path2, _ = word((W - t_w2) / 2, ty, t_size2, "title", ink)
        p_path2, _ = word((W - p_w2) / 2, py, p_size2, "place", sub)
        body = emblem_group(option, f"s{option}{tone}", E2, (W - E2) / 2, 0) + t_path2 + p_path2
        files[f"stt-{option}-stacked{suffix}.svg"] = svg(W, round(py + 6, 1), body, TITLE)
    return files


for opt in ("a", "b"):
    for name, content in lockups(opt).items():
        with open(os.path.join(OUT, name), "w") as f:
            f.write(content)
        print(name, len(content))
