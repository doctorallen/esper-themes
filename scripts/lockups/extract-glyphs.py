#!/usr/bin/env python3
"""Writes the glyph outlines the lockups are set in, so the SVGs carry paths and
need no font installed. Run once against BLADRMF_.TTF (Blade Runner Movie
Font, Phil Steinschneider, freeware): python3 scripts/lockups/extract-glyphs.py path/to/BLADRMF_.TTF
"""
import json
import string
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm
out = {"font": "Blade Runner Movie Font", "author": "Phil Steinschneider", "unitsPerEm": upm, "glyphs": {}}
for char in string.ascii_letters + string.digits + " -'&.":
    name = cmap.get(ord(char))
    if name is None:
        continue
    glyph = glyph_set[name]
    pen = SVGPathPen(glyph_set)
    glyph.draw(pen)
    out["glyphs"][char] = {"advance": glyph.width, "d": pen.getCommands()}
# Cap height from H, for laying the text out against the mark.
bounds = font["glyf"]["H"].getCoordinates(font["glyf"])[0] if "glyf" in font else None
if bounds is not None:
    out["capHeight"] = max(y for _, y in bounds)
json.dump(out, open("scripts/lockups/blade-runner-glyphs.json", "w"), separators=(",", ":"))
print(f"{len(out['glyphs'])} glyphs, cap height {out.get('capHeight')}, {upm} units per em")
