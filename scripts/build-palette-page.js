#!/usr/bin/env node
// Regenerates the data embedded in theme-palettes.html from themes/*.json, so
// the reference page always matches the shipped themes. Each theme carries its
// own named palette: the page's legend and its restricted color picker offer
// exactly the colors that theme uses.
//
// Usage: node scripts/build-palette-page.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(ROOT, "theme-palettes.html");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

// Names for colors the themes are built from, so the legend reads in the terms
// the docs use. Anything else is named from its hue below.
const KNOWN_NAMES = {
  // LCARS approved palette
  "#09131A": "Deep Navy", "#1C3C55": "Dark Blue", "#2A7193": "Medium Blue",
  "#2F3749": "Dark Gray", "#52596E": "Medium Dark Gray", "#212633": "Deep Dark Gray",
  "#37A6D1": "Sky Blue", "#41C4F7": "Bright Blue", "#8899FF": "Powder Blue",
  "#BAA4E5": "African Violet", "#8A72A7": "Lilac", "#7A506D": "Dirty Mauve",
  "#9D698A": "Dusty Mauve", "#C082A9": "True Mauve", "#EB943A": "Orange",
  "#EDB378": "Barley", "#FCC19F": "Almond Creme", "#D29B7F": "Almond",
  "#C47D69": "Subdued Sienna", "#EA9C72": "Butterscotch", "#FF977B": "Pale Orange-Red",
  "#FF6753": "Light Orange-Red", "#E7442A": "Orange-Red", "#CF4F4F": "Red",
  "#FF2200": "Mars", "#895129": "Brown", "#6D748C": "Primary Gray",
  "#9EA5BA": "Light Gray", "#D2D5DF": "Ghost Gray", "#F3F4F7": "Starlight",
  // Bluey, from the Heeler family artwork
  "#040620": "Bluey Navy", "#403F65": "Purple Navy", "#83BBE3": "Bluey Blue",
  "#75A6BE": "Steel Blue", "#D2EBFD": "Pale Blue", "#FFF9D8": "Cream",
  "#EDCE74": "Muzzle Gold", "#FFB070": "Bandit Orange", "#E37A3B": "Bingo Orange",
  "#9B5E33": "Chilli Brown", "#C9504F": "Tongue Red", "#FFD08D": "Light Gold",
  // Film themes, from Deckard's webview palettes
  "#FFB000": "Amber", "#00E5FF": "Cyan", "#33FF33": "Toxic Green",
  "#D23C28": "Signal Red", "#FF5500": "Warning Orange", "#3FB6C9": "Readout Cyan",
  "#5FD3E4": "Bright Cyan", "#E8562A": "Alert Orange", "#CDBE95": "Bone",
  "#FF3CA6": "Hot Pink", "#5FF7FF": "Neon Cyan", "#8F75FF": "Violet",
  "#FF8B55": "Sunset Orange", "#62F5FF": "Ice", "#54DB51": "Phosphor Green",
  "#76FF63": "Bright Phosphor", "#F0BF47": "Amber Alert", "#D89D31": "Dark Amber",
  "#DCA24A": "Gargantua Gold", "#9FBFD4": "Instrument Blue", "#F3C46E": "Warm Gold",
  "#B5CFA5": "Pale Olive", "#D9673B": "Rust", "#A7AFB4": "Steel",
};

const HUES = [
  [15, "Red"], [40, "Orange"], [52, "Amber"], [66, "Gold"], [78, "Yellow"],
  [100, "Lime"], [150, "Green"], [175, "Teal"], [195, "Cyan"], [215, "Sky"],
  [245, "Blue"], [265, "Indigo"], [285, "Violet"], [310, "Purple"],
  [335, "Magenta"], [350, "Rose"], [361, "Red"],
];

function toHsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const span = max - min;
  if (span === 0) return { h: 0, s: 0, l };
  const s = span / (1 - Math.abs(2 * l - 1));
  const h =
    max === r ? 60 * (((g - b) / span) % 6)
    : max === g ? 60 * ((b - r) / span + 2)
    : 60 * ((r - g) / span + 4);
  return { h: (h + 360) % 360, s, l };
}

function nameFor(hex) {
  if (KNOWN_NAMES[hex]) return KNOWN_NAMES[hex];
  const { h, s, l } = toHsl(hex);
  if (s < 0.1) {
    const shade =
      l < 0.12 ? "Ink" : l < 0.28 ? "Charcoal" : l < 0.45 ? "Slate"
      : l < 0.62 ? "Gray" : l < 0.82 ? "Silver" : "Off White";
    return shade;
  }
  const hue = HUES.find(([limit]) => h < limit)[1];
  const qualifier =
    l < 0.16 ? "Deepest " : l < 0.3 ? "Deep " : l < 0.45 ? "Dark "
    : l < 0.68 ? "" : l < 0.84 ? "Light " : "Pale ";
  return `${qualifier}${hue}`.trim();
}

/** Surfaces, then the accents, then whatever the code is painted with. */
function groupFor(hex, usage) {
  if (usage.background) return "Surfaces";
  if (usage.syntax) return usage.workbench ? "Accents" : "Syntax";
  return "Accents";
}

function paletteFor(theme) {
  const usage = new Map();
  const note = (value, kind) => {
    if (typeof value !== "string" || !value.startsWith("#")) return;
    const hex = value.slice(0, 7).toUpperCase();
    if (hex === "#000000" && value.length > 7) return; // fully transparent role
    const entry = usage.get(hex) ?? { count: 0 };
    entry[kind] = true;
    entry.count += 1;
    usage.set(hex, entry);
  };
  for (const [role, value] of Object.entries(theme.colors)) {
    note(value, /\.background$|^editor\.background$/.test(role) ? "background" : "workbench");
  }
  for (const rule of theme.tokenColors || []) note(rule.settings?.foreground, "syntax");
  for (const value of Object.values(theme.semanticTokenColors || {})) note(value, "syntax");

  const used = new Set();
  return [...usage.entries()]
    .sort((a, b) => toHsl(a[0]).l - toHsl(b[0]).l)
    .map(([hex, kinds]) => {
      let name = nameFor(hex);
      if (used.has(name)) {
        let n = 2;
        while (used.has(`${name} ${n}`)) n += 1;
        name = `${name} ${n}`;
      }
      used.add(name);
      return { name, hex, group: groupFor(hex, kinds) };
    });
}

const themes = {};
const order = [];
for (const contribution of manifest.contributes.themes) {
  const theme = JSON.parse(fs.readFileSync(path.join(ROOT, contribution.path), "utf8"));
  const key = contribution.label;
  order.push(key);
  themes[key] = {
    label: contribution.label,
    themeName: theme.name,
    primary: theme.colors.focusBorder,
    colors: theme.colors,
    tokenColors: theme.tokenColors,
    semanticTokenColors: theme.semanticTokenColors,
    palette: paletteFor(theme),
  };
}

const bundle = { themes };
const page = fs.readFileSync(PAGE, "utf8").split("\n");
const bundleLine = page.findIndex(line => line.startsWith("const BUNDLE = "));
const orderLine = page.findIndex(line => line.startsWith("const THEME_ORDER = "));
if (bundleLine < 0 || orderLine < 0) {
  throw new Error("theme-palettes.html no longer declares BUNDLE and THEME_ORDER.");
}
page[bundleLine] = `const BUNDLE = ${JSON.stringify(bundle)};`;
page[orderLine] = `const THEME_ORDER = ${JSON.stringify(order)};`;
fs.writeFileSync(PAGE, page.join("\n"));

console.log(`theme-palettes.html: ${order.length} themes (${order.join(", ")})`);
for (const key of order) {
  console.log(`  ${key}: ${themes[key].palette.length} palette colors`);
}
