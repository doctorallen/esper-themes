#!/usr/bin/env node
// Builds a lockup for every theme: its mark (images/logos/mark-<theme>.svg)
// beside its name set in the Blade Runner Movie Font, each letter painted in one
// of the theme's own accents in turn. The letters are outlines taken from the
// font once (scripts/lockups/extract-glyphs.py), so the SVGs stand alone.
//
// Writes images/logos/lockup-<theme>.svg, and a PNG beside it when Chrome is
// available. Usage: node scripts/build-lockups.js [Theme ...]

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const LOGOS = path.join(ROOT, "images", "logos");
const FONT = JSON.parse(fs.readFileSync(path.join(__dirname, "lockups", "blade-runner-glyphs.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const slug = label => label.toLowerCase().replace(/\s+/g, "-");
const MARK = 200;          // the marks are 200 × 200
const GAP = 44;            // between the mark and the first letter
const CAP = 104;           // cap height of the lettering, in the mark's units
const TRACK = 0.08;        // letter-spacing, as a fraction of the em
const WORD = 0.42;         // word space, as a fraction of the em
const PAD = 40;            // right margin after the last letter, inside the plate

// The accents the letters cycle through: the theme's two identity colors, then
// the syntax colors a reader meets most, duplicates dropped.
function accents(theme) {
  const rule = name => (theme.tokenColors.find(r => r.name === name) || {}).settings?.foreground;
  const list = [
    theme.colors.focusBorder, theme.colors["badge.background"],
    rule("Strings"), rule("Functions"), rule("Keywords"), rule("Types"), rule("Numbers and constants"),
  ].filter(Boolean).map(c => c.slice(0, 7).toUpperCase());
  return [...new Set(list)];
}

function layout(text, scale) {
  const em = FONT.unitsPerEm * scale;
  const letters = [];
  let x = 0;
  for (const char of text) {
    if (char === " ") { x += em * WORD; continue; }
    // The font's uppercase B, L and R are the film's logotype and the Deckard
    // silhouette; its lowercase is the plain capital alphabet, so set from that.
    const g = FONT.glyphs[char.toLowerCase()] || FONT.glyphs[char];
    if (!g) throw new Error(`No glyph for "${char}"`);
    letters.push({ char, x, d: g.d });
    x += g.advance * scale + em * TRACK;
  }
  return { letters, width: x - em * TRACK };
}

function lockup(label, theme, markSvg) {
  const scale = CAP / FONT.capHeight;
  const name = label.toUpperCase();
  const { letters, width } = layout(name, scale);
  const colors = accents(theme);
  const textX = MARK + GAP;
  const baseline = MARK / 2 + CAP / 2;
  const total = Math.ceil(textX + width + PAD);
  // The mark's own content, dropped in as-is.
  const inner = markSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();
  const markAttrs = (markSvg.match(/<svg([^>]*)>/) || ["", ""])[1]
    .replace(/\s(xmlns|viewBox|role|aria-label)="[^"]*"/g, "").trim();
  const glyphs = letters.map((l, i) =>
    `<path transform="translate(${(textX + l.x).toFixed(1)} ${baseline}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" fill="${colors[i % colors.length]}" d="${l.d}"/>`
  ).join("\n    ");
  // The mark's plate carries on under the name, so the whole lockup sits on the
  // theme's own ground. The mark's own rounded rect is the same color.
  const plate = (markSvg.match(/<rect[^>]*fill="(#[0-9A-Fa-f]{6})"/) || [])[1] || theme.colors["editor.background"];
  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${MARK}" width="${total}" height="${MARK}" role="img" aria-label="${label} — Esper Themes">
  <rect width="${total}" height="${MARK}" rx="28" fill="${plate}"/>
  <g ${markAttrs}>${inner}</g>
  <g aria-hidden="true">
    ${glyphs}
  </g>
</svg>
`;
}

function png(svgPath, pngPath, width) {
  if (!fs.existsSync(CHROME)) return false;
  const html = path.join(require("os").tmpdir(), `lockup-${path.basename(svgPath)}.html`);
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}img{display:block}</style><img src="file://${svgPath}" width="${width * 2}" height="${MARK * 2}">`);
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
    `--window-size=${width * 2},${MARK * 2}`, `--screenshot=${pngPath}`, `file://${html}`,
  ], { stdio: "ignore" });
  fs.unlinkSync(html);
  return true;
}

const only = process.argv.slice(2);
for (const contribution of manifest.contributes.themes) {
  if (only.length && !only.includes(contribution.label)) continue;
  const theme = JSON.parse(fs.readFileSync(path.join(ROOT, contribution.path), "utf8"));
  const markPath = path.join(LOGOS, `mark-${slug(contribution.label)}.svg`);
  if (!fs.existsSync(markPath)) { console.log(`skip ${contribution.label}: no mark`); continue; }
  const svg = lockup(contribution.label, theme, fs.readFileSync(markPath, "utf8"));
  const out = path.join(LOGOS, `lockup-${slug(contribution.label)}.svg`);
  fs.writeFileSync(out, svg);
  const width = Number((svg.match(/viewBox="0 0 (\d+)/) || [])[1]);
  const made = png(out, out.replace(/\.svg$/, ".png"), width);
  console.log(`wrote ${path.relative(ROOT, out)}${made ? " + .png" : ""}`);
}
