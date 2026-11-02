# Contours du mot-symbole en Archivo (instance largeur 87,5, graisse donnée), avec crénage harfbuzz.
import sys, json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import io

SRC = sys.argv[1]

def shape(text, wght, wdth=87.5):
    font = TTFont(SRC)
    inst = instantiateVariableFont(font, {"wght": wght, "wdth": wdth})
    buf = io.BytesIO(); inst.flavor = None; inst.save(buf); data = buf.getvalue()
    face = hb.Face(data); hbf = hb.Font(face)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(hbf, b, {"kern": True, "liga": False})
    gs = inst.getGlyphSet(); order = inst.getGlyphOrder()
    upm = inst["head"].unitsPerEm
    x = 0; parts = []
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(gs)
        # y vers le bas en SVG
        tp = TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, 0))
        gs[name].draw(tp)
        d = pen.getCommands()
        if d: parts.append(d)
        x += pos.x_advance
    os2 = inst["OS/2"]
    return {"d": " ".join(parts), "advance": x, "upm": upm, "cap": os2.sCapHeight, "xh": os2.sxHeight}

out = {
  "title": shape("SECRET TRAVEL & TOUR", 700),
  "place": shape("Koh Lanta", 600),
}
print(json.dumps(out))
