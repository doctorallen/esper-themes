#!/usr/bin/env node
// Builds theme-census.html: the thirty most-installed VS Code color themes set
// against Esper's, the regrade that study led to, and each Esper theme's named
// palette and accessibility audit. The popular themes and the earlier Esper
// versions come from the measured snapshot in docs/census/snapshot.json; the
// current Esper themes are measured from themes/ on every build, so the page
// always shows what ships.
//
// Usage: node scripts/build-census-page.js

const fs = require("fs");
const path = require("path");
const { ROLES, analyzeTheme, contrast, oklch, parseHex, toHex } = require("./census/analyze-theme");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(ROOT, "theme-census.html");
const TEMPLATE = path.join(__dirname, "census", "page.html");
const SNAPSHOT = path.join(ROOT, "docs", "census", "snapshot.json");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

// Names for colors the themes are built from, so the palettes read in the terms
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
  "#B59CE6": "Bedtime Lavender", "#D04A80": "Raspberry",
  // Film themes, from Deckard's webview palettes and the October 2026 regrade
  "#FFB000": "Amber", "#3ED4E8": "Cyan", "#66E066": "Toxic Green",
  "#E05232": "Signal Red", "#FF5500": "Warning Orange", "#3FB6C9": "Readout Cyan",
  "#5FD3E4": "Bright Cyan", "#E8562A": "Alert Orange", "#CDBE95": "Bone",
  "#F25AA9": "Hot Pink", "#F2559E": "Neon Pink", "#3FD8EA": "Grid Cyan",
  "#7CE6F0": "Neon Cyan", "#8F75FF": "Violet",
  "#FF8B55": "Sunset Orange", "#7CE3EC": "Ice", "#6FD96C": "Phosphor Green",
  "#8CE87C": "Bright Phosphor", "#F0BF47": "Amber Alert", "#D89D31": "Dark Amber",
  "#4A6A32": "Olive", "#664317": "Aged Gold", "#354A1F": "Deep Olive",
  "#9A4530": "Ink Red", "#545C3C": "Moss", "#9C9A5C": "Parchment Line",
  "#2D4F6E": "River Ink", "#1F6E63": "Green-Blue Ink", "#7B3F8F": "Seal Purple",
  "#A3283A": "Vermilion Ink", "#6E4A10": "Deep Gold",
  "#DCA24A": "Gargantua Gold", "#9FBFD4": "Instrument Blue", "#F3C46E": "Warm Gold",
  "#B5CFA5": "Pale Olive", "#D9673B": "Rust", "#A7AFB4": "Steel",
  "#6FC2B5": "Miller's Ocean", "#E86767": "Warning Red",
  "#8DB4E8": "Sky Tower Blue", "#5CD6B4": "Radar Teal", "#6FB3E8": "Canopy Blue",
  "#6BD0B2": "Sea Glass", "#F0C97A": "Brass", "#E86A4E": "Zhora Coral",
  // Helix, from the 2020 Sublime Text theme
  "#448AA9": "Helix Steel", "#AF8787": "Dusty Rose", "#A5B4DB": "Helix Slate",
  "#FF8147": "Helix Orange", "#BD93F9": "Lavender", "#A2A797": "Bracket Grey",
  "#D7875F": "Copper", "#80E045": "Library Green", "#A5E3D0": "Mint",
  "#A6E22E": "Diff Green", "#E61F44": "Gutter Red", "#F7B83D": "Gutter Amber",
};

const HUES = [
  [15, "Red"], [40, "Orange"], [52, "Amber"], [66, "Gold"], [78, "Yellow"],
  [100, "Lime"], [150, "Green"], [175, "Teal"], [195, "Cyan"], [215, "Sky"],
  [245, "Blue"], [265, "Indigo"], [285, "Violet"], [310, "Purple"],
  [335, "Magenta"], [350, "Rose"], [361, "Red"],
];

// Where each theme comes from, in a sentence or two.
const CONTEXT = {
  LCARS: "Starfleet console panels. LCARS is written by hand from an approved palette of named colors; every role assignment and the reason for it is logged in COLOR-ACCESSIBILITY.md.",
  Q: "A new accessible palette, generated on demand by the Mon Capitan status-bar item. The file shown is Q's static fallback, which mirrors LCARS until the first generation.",
  Replicant: "Tyrell's office at golden hour, measured off the 1982 film: gold leads and carries the keywords, bone carries the prose, the searchlight cyan names functions, sea glass off the window takes the strings and coral off Zhora's coat the numbers. No syntax color sits between hue 250 and 345, and comments are held to 2.9:1 rather than AA by choice.",
  Oblivion: "The film's light table: steel frames, cyan readouts, orange kept for alerts, and the sky above the Sky Tower for types.",
  Synthwave: "Neon grid: cyan and hot pink over violet night, a step below full saturation so the neon does not bloom.",
  Tomcat: "A green phosphor cockpit display. Green leads; the radar sweep's teal takes types, the caution lamp's amber literals, and a canopy blue the tags.",
  Fellowship: "Parchment and ink: olive greens and aged gold on a light page, with a river ink for types, a seal purple for constants and tags, and a vermilion for numbers.",
  Cooper: "Interstellar: white-on-black instrument readouts, Gargantua's gold, Miller's ocean for types and the Endurance's warning red for tags.",
  Bluey: "Heeler-family daylight, sampled from the artwork: cream paper, pale blue chrome, the purple-navy of Bluey's head for keywords, Chilli's brown for strings.",
  "Bluey Night": "The same artwork after bedtime, on Bluey's navy: the blues of his body for structure, the muzzle golds and Bingo's orange for literals.",
  Helix: "The Sublime Text theme David wrote in 2020, carried into VS Code: steel blue for values, dusty rose for keywords, lavender for functions and slate for types, on Replicant's workbench.",
};

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
    return l < 0.12 ? "Ink" : l < 0.28 ? "Charcoal" : l < 0.45 ? "Slate"
      : l < 0.62 ? "Gray" : l < 0.82 ? "Silver" : "Off White";
  }
  const hue = HUES.find(([limit]) => h < limit)[1];
  const qualifier =
    l < 0.16 ? "Deepest " : l < 0.3 ? "Deep " : l < 0.45 ? "Dark "
    : l < 0.68 ? "" : l < 0.84 ? "Light " : "Pale ";
  return `${qualifier}${hue}`.trim();
}

/** Surfaces, then the accents, then whatever the code is painted with. */
function groupFor(usage) {
  if (usage.background) return "Surfaces";
  if (usage.syntax) return usage.workbench ? "Accents" : "Syntax";
  return "Accents";
}

/** Every color a theme uses, named and grouped, darkest first. */
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
      return { name, hex, group: groupFor(kinds) };
    });
}

// Foreground/background pairs each theme is held to, read straight from its
// colors. "token:" reads a token rule by name.
const TEXT_PAIRS = [
  ["Editor text", "editor.foreground", "editor.background", "Normal code and document text."],
  ["Comment token", "token:Comments", "editor.background", "Muted syntax comments on the editor surface."],
  ["Sidebar text", "sideBar.foreground", "sideBar.background", "Explorer and other sidebar labels."],
  ["Sidebar title", "sideBarTitle.foreground", "sideBar.background", "Themed sidebar title and section identity."],
  ["Activity bar icons", "activityBar.foreground", "activityBar.background", "Active activity-bar icons."],
  ["Activity bar inactive icons", "activityBar.inactiveForeground", "activityBar.background", "Inactive activity-bar icons."],
  ["Modern active activity item", "modernActivityBarItem.activeForeground", "modernActivityBarItem.activeBackground", "The filled pill behind the active Modern UI activity item."],
  ["Panel title", "panelTitle.activeForeground", "panel.background", "Active Problems, Output, Debug Console and Ports titles."],
  ["Panel section header", "panelSectionHeader.foreground", "panelSectionHeader.background", "Identity-colored nested panel headers."],
  ["Status bar", "statusBar.foreground", "statusBar.background", "Normal status-bar text."],
  ["Title bar", "titleBar.activeForeground", "titleBar.activeBackground", "Active window title."],
  ["Active tab", "tab.activeForeground", "tab.activeBackground", "Classic active editor tab."],
  ["Inactive tab", "tab.inactiveForeground", "tab.inactiveBackground", "Classic inactive editor tab."],
  ["Modern active editor tab", "modernEditorTab.activeForeground", "modernEditorTab.activeBackground", "Modern UI active editor tab."],
  ["Modern hovered tab", "modernEditorTab.hoverForeground", "modernEditorTab.hoverBackground", "Tab text over an alpha-composited hover fill."],
  ["Modern pane tab", "modernTab.activeForeground", "modernTab.activeBackground", "Active pane tab, such as Chat or Terminal."],
  ["Badge", "badge.foreground", "badge.background", "Compact status and activity badges."],
  ["Secondary button", "button.secondaryForeground", "button.secondaryBackground", "Secondary action text."],
  ["Input text", "input.foreground", "input.background", "Text entered into controls."],
  ["Editor widget", "editorWidget.foreground", "editorWidget.background", "Completion and hover widget text."],
  ["List match", "list.highlightForeground", "sideBar.background", "Matched letters in Quick Open and the Explorer filter."],
  ["Inlay hint", "editorInlayHint.foreground", "editorInlayHint.background", "Parameter and type hints inside code."],
  ["Error text", "errorForeground", "editor.background", "Normal-size error and invalid text."],
];
const BORDER_PAIRS = [
  ["Focus boundary", "editor.background", "focusBorder", "Keyboard focus ring against the editor."],
  ["Primary button", "button.background", "button.border", "Button outline against its fill."],
  ["Input control", "input.background", "input.border", "Input outline against its surface."],
  ["Editor widget", "editorWidget.background", "editorWidget.border", "Completion and hover widget boundary."],
  ["Sidebar", "sideBar.background", "sideBar.border", "Sidebar separator."],
  ["Modern surface", "surface.background", "surface.border", "The frame around Modern UI's rounded surfaces."],
  ["Active tab bottom", "tab.activeBackground", "tab.activeBorder", "Active editor-tab bottom stroke."],
  ["Active tab top", "tab.activeBackground", "tab.activeBorderTop", "Active editor-tab top stroke."],
  ["Bracket match", "editorBracketMatch.background", "editorBracketMatch.border", "Bracket-match boundary against its highlight."],
  ["Find match", "editor.background", "editor.findMatchBorder", "Current find match outline against the editor."],
];

const composite = (value, backdrop) => {
  const fg = parseHex(value);
  const bg = parseHex(backdrop);
  if (!fg || !bg) return null;
  return toHex([0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])));
};
const ratio = (a, b) => Math.round(contrast(parseHex(a), parseHex(b)) * 100) / 100;

function auditFor(theme) {
  const editor = theme.colors["editor.background"];
  const read = key => key.startsWith("token:")
    ? (theme.tokenColors.find(rule => rule.name === key.slice(6)) || {}).settings?.foreground
    : theme.colors[key];
  const pair = ([label, fgKey, bgKey, detail], borders) => {
    const fg = read(fgKey);
    const bg = read(bgKey);
    if (!fg || !bg) return null;
    const surface = composite(bg, editor);
    const ink = composite(fg, surface);
    return { label, detail, fgKey, bgKey, fg: fg.toUpperCase(), bg: bg.toUpperCase(), surface, ink, ratio: ratio(ink, surface), border: borders };
  };
  return {
    text: TEXT_PAIRS.map(p => pair(p, false)).filter(Boolean),
    borders: BORDER_PAIRS.map(([label, main, border, detail]) => pair([label, border, main, detail], true)).filter(Boolean),
  };
}

/**
 * Color-theory recipes read off each theme's own palette, so every theme gets
 * recipes in its own colors. A recipe is text-safe only when its declared
 * foreground clears AA on its declared background; otherwise it is accent-only.
 */
function recipesFor(theme, analysis) {
  const c = theme.colors;
  const editor = c["editor.background"];
  const hueOf = hex => oklch(parseHex(hex));
  const named = hex => ({ name: nameFor(hex.slice(0, 7).toUpperCase()), hex: hex.slice(0, 7).toUpperCase() });
  const recipe = (category, name, detail, colors, fg, bg) => {
    const r = ratio(composite(fg, bg), composite(bg, editor));
    return { category, name, detail, colors: colors.map(named), fg: named(fg), bg: named(bg), ratio: r, textSafe: r >= 4.5 };
  };
  const out = [];

  const primary = c.focusBorder;
  const secondary = c["badge.background"];
  if (primary && secondary) {
    const [, , h1] = hueOf(primary);
    const [, , h2] = hueOf(secondary);
    const gap = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
    const kind = gap <= 45 ? "Analogous" : gap >= 150 ? "Complementary" : gap >= 100 ? "Split-complementary" : "Contrasting";
    out.push(recipe(kind, `${nameFor(primary.toUpperCase())} and ${nameFor(secondary.toUpperCase())}`,
      `The two identity accents sit ${Math.round(gap)}° apart in OKLCH hue. The primary marks focus, links and icons, so it is tested as text on the editor.`,
      [primary, secondary], primary, editor));
  }

  const [, bgC, bgH] = hueOf(editor);
  const warm = h => h >= 20 && h < 110;
  const temperature = bgC < 0.015 ? "neutral" : warm(bgH) ? "warm" : "cool";
  // Error colors are left out: some palettes keep theirs for squiggles and
  // markers only, never text.
  const signals = [c.focusBorder, c["badge.background"], c["textLink.activeForeground"], c["editorWarning.foreground"]].filter(Boolean);
  const signal = signals
    .filter(s => temperature === "neutral" || (temperature === "cool" ? warm(hueOf(s)[2]) : !warm(hueOf(s)[2])))
    .sort((a, b) => hueOf(b)[1] - hueOf(a)[1])[0] || signals[0];
  if (signal) {
    out.push(recipe("Warm/cool", `${temperature === "warm" ? "Warm surface, cool signal" : temperature === "cool" ? "Cool surface, warm signal" : "Neutral surface, strongest signal"}`,
      `The editor ground is ${temperature}; the most saturated accent of the opposite temperature carries the signals that must stand out.`,
      [editor, signal], signal, editor));
  }

  const structure = c["sideBar.background"] || c["activityBar.background"];
  out.push(recipe("Role recipe", "60/30/10 workbench",
    `The editor ground covers about 60% of the window, the chrome about 30%, and ${nameFor(primary.toUpperCase())} the 10% that is active. Body text is tested on the ground.`,
    [editor, structure, primary], c["editor.foreground"], editor));

  const syntax = ["string", "number", "keyword", "function", "type", "constant", "tag", "comment"]
    .map(k => analysis.roles[k]).filter(r => r && r.C >= 0.04);
  let best = null;
  for (let i = 0; i < syntax.length; i += 1) for (let j = i + 1; j < syntax.length; j += 1) for (let k = j + 1; k < syntax.length; k += 1) {
    const set = [syntax[i], syntax[j], syntax[k]];
    if (new Set(set.map(r => r.hex)).size < 3) continue;
    const hs = set.map(r => r.H).sort((a, b) => a - b);
    const span = Math.min(hs[2] - hs[0], 360 - (hs[1] - hs[0]), 360 - (hs[2] - hs[1]));
    if (span <= 60 && (!best || span < best.span)) best = { span, set };
  }
  if (best) {
    const weakest = [...best.set].sort((a, b) => a.cr - b.cr)[0];
    out.push(recipe("Analogous syntax", "Neighboring hues in the code",
      `Three syntax colors within ${Math.round(best.span)}° of hue, told apart by lightness and chroma rather than hue. The weakest of the three is tested on the editor.`,
      best.set.map(r => r.hex), weakest.hex, editor));
  }

  if (c["button.secondaryBackground"] && c["button.secondaryForeground"]) {
    out.push(recipe("Accent fill", "Text on the identity color",
      "Where the primary accent becomes a fill, as on secondary buttons and the active activity item, its text has to clear AA on the accent itself.",
      [c["button.secondaryBackground"], c["button.secondaryForeground"]], c["button.secondaryForeground"], c["button.secondaryBackground"]));
  }
  return out;
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
const now = [];
const esper = {};
for (const contribution of manifest.contributes.themes) {
  if (contribution.label === "Mix") continue; // assembled from the others at runtime
  const theme = JSON.parse(fs.readFileSync(path.join(ROOT, contribution.path), "utf8"));
  const analysis = analyzeTheme(theme, contribution.uiTheme, {
    label: contribution.label, esper: true, ext: "esperinnovations.esper-themes", extName: "Esper Themes",
  });
  now.push(analysis);
  esper[contribution.label] = {
    context: CONTEXT[contribution.label] || "",
    palette: paletteFor(theme),
    primary: (theme.colors.focusBorder || "").toUpperCase(),
    audit: auditFor(theme),
    recipes: recipesFor(theme, analysis),
  };
}

const data = {
  measured: snapshot.measured,
  roles: ROLES.map(([key, label, group, stack]) => ({ key, label, group, scope: stack[stack.length - 1] })),
  extraScopes: snapshot.extraScopes,
  popular: snapshot.popular,
  light: snapshot.light,
  sets: { ...Object.fromEntries(Object.entries(snapshot.history).map(([k, v]) => [k, v.themes])), now },
  versions: [...Object.entries(snapshot.history).map(([k, v]) => [k, v.label, v.detail]), ["now", "Now", "built from themes/"]],
  esper,
};
const template = fs.readFileSync(TEMPLATE, "utf8");
if (!template.includes("/*DATA*/")) {
  throw new Error("scripts/census/page.html no longer has its /*DATA*/ placeholder.");
}
fs.writeFileSync(PAGE, template.replace("/*DATA*/", JSON.stringify(data).replace(/<\//g, "<\\/")));

console.log(`theme-census.html: ${snapshot.popular.length} popular themes, ${now.length} Esper themes`);
for (const t of now) {
  console.log(`  ${t.label}: ${esper[t.label].palette.length} palette colors, near-collisions ${t.nearCollisions.length}, color-blind merges ${t.cvd3}`);
}
