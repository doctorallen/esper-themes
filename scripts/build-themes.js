#!/usr/bin/env node
// Builds the fixed themes from curated palettes: the film themes from Deckard's
// webview themes (~/projects/deckard/src/ui/webview/themes.ts), and the two
// Bluey themes from colors sampled out of the Heeler family artwork. Every color
// role comes from the shared Q mapping; only the palette differs. Text colors
// that miss WCAG AA on their surfaces are nudged toward the theme's foreground
// until they pass.
//
// Usage: node scripts/build-themes.js

const fs = require("fs");
const path = require("path");
const {
  DEBUGGING_STATUS_BACKGROUND,
  DEBUGGING_STATUS_FOREGROUND,
  MIN_TEXT_CONTRAST,
  alphaComposite,
  buildWorkbenchColors,
  contrastRatio,
  hslToHex,
  mixHex,
  relativeLuminance,
  syntaxRoleForSemanticToken,
  syntaxRoleForToken,
} = require("../q-theme");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = JSON.parse(
  fs.readFileSync(path.join(ROOT, "themes", "LCARS-color-theme.json"), "utf8")
);

/**
 * Surfaces and accents per theme. `surfaces` follow Deckard's tokens:
 * editor ← --bg, activity ← --bg-dark, sidebar ← --panel, widget ← --panel-raised,
 * border ← --slate-border. `syntax` assigns each role a Deckard accent.
 */
const THEMES = [
  {
    // Deckard's default: amber readouts and cyan telemetry on a near-black ground.
    name: "Replicant",
    type: "dark",
    surfaces: {
      editor: "#050608",
      activity: "#080A0E",
      sidebar: "#0D1017",
      panel: "#0D1017",
      status: "#0D1017",
      widget: "#121620",
      raised: "#121620",
      tabActive: "#121620",
      tabInactive: "#0D1017",
      border: "#212936",
    },
    foreground: "#D9E0E4",
    muted: "#7D8792",
    primary: "#FFB000",
    secondary: "#00E5FF",
    error: "#D23C28",
    warning: "#FF5500",
    success: "#33FF33",
    info: "#00E5FF",
    syntax: {
      text: "#D9E0E4",
      comment: "#7D8792",
      keyword: "#00E5FF",
      operator: mixHex("#00E5FF", "#D9E0E4", 0.5),
      string: mixHex("#33FF33", "#D9E0E4", 0.3),
      number: "#FF5500",
      constant: mixHex("#FFB000", "#FF5500", 0.5),
      variable: "#D9E0E4",
      property: mixHex("#D9E0E4", "#00E5FF", 0.2),
      function: "#FFB000",
      libraryFunction: mixHex("#FFB000", "#D9E0E4", 0.45),
      type: mixHex("#33FF33", "#D9E0E4", 0.6),
      markup: "#FFB000",
      decorator: mixHex("#FFB000", "#D23C28", 0.5),
      invalid: "#D23C28",
    },
  },
  {
    // The film's light table: steel frames, cyan readouts, orange for alerts.
    name: "Oblivion",
    type: "dark",
    surfaces: {
      editor: "#04080B",
      activity: "#020608",
      sidebar: "#081115",
      panel: "#081115",
      status: "#081115",
      widget: "#0F1D24",
      raised: "#0F1D24",
      tabActive: "#0F1D24",
      tabInactive: "#081115",
      border: "#12262E",
    },
    foreground: "#DCE6EA",
    muted: "#6F8A95",
    primary: "#3FB6C9",
    secondary: "#E8562A",
    error: "#FF5A30",
    warning: "#FF9A3C",
    success: "#CDBE95",
    info: "#5FD3E4",
    syntax: {
      text: "#DCE6EA",
      comment: "#6F8A95",
      keyword: "#5FD3E4",
      operator: mixHex("#3F8296", "#DCE6EA", 0.35),
      string: "#CDBE95",
      number: "#FF9A3C",
      constant: "#FF6A35",
      variable: "#DCE6EA",
      property: mixHex("#DCE6EA", "#5FD3E4", 0.25),
      function: "#3FB6C9",
      libraryFunction: mixHex("#3FB6C9", "#DCE6EA", 0.5),
      type: mixHex("#3F8296", "#DCE6EA", 0.15),
      markup: "#5FD3E4",
      decorator: "#E8562A",
      invalid: "#FF5A30",
    },
  },
  {
    // Neon grid: cyan and hot pink over violet night.
    name: "Synthwave",
    type: "dark",
    surfaces: {
      editor: "#100C20",
      activity: "#090713",
      sidebar: "#15102F",
      panel: "#15102F",
      status: "#15102F",
      widget: "#211748",
      raised: "#211748",
      tabActive: "#211748",
      tabInactive: "#15102F",
      border: "#33295E",
    },
    foreground: "#E7E8FF",
    muted: "#8E8BB3",
    primary: "#00E5FF",
    secondary: "#FF3CA6",
    error: "#FF2D95",
    warning: "#FF8B55",
    success: "#62F5FF",
    info: "#8F75FF",
    // Hand-tuned after the generated mapping: the activity bar sits on the
    // raised surface with pink icons, and a few token roles were reassigned.
    colorOverrides: {
      "activityBar.background": "#211748",
      "activityBar.foreground": "#FF2D95",
      "list.activeSelectionForeground": "#33295E",
      "modernTab.activeForeground": "#211748",
    },
    tokenOverrides: {
      "Numbers and constants": "#FF647E",
      Variables: "#FF8B55",
      "Object properties": "#8F75FF",
      Decorators: "#00E5FF",
    },
    semanticOverrides: {
      number: "#FF647E",
      variable: "#FF8B55",
      property: "#8F75FF",
      member: "#8F75FF",
      "property.readonly": "#8F75FF",
      decorator: "#00E5FF",
    },
    syntax: {
      text: "#E7E8FF",
      comment: "#8E8BB3",
      keyword: "#FF3CA6",
      operator: "#5FF7FF",
      string: "#FF8B55",
      number: "#8F75FF",
      constant: mixHex("#FF8B55", "#FF3CA6", 0.5),
      variable: "#E7E8FF",
      property: mixHex("#E7E8FF", "#5FF7FF", 0.3),
      function: "#00E5FF",
      libraryFunction: mixHex("#00E5FF", "#E7E8FF", 0.5),
      type: mixHex("#8F75FF", "#E7E8FF", 0.35),
      markup: "#5FF7FF",
      decorator: "#FF3CA6",
      invalid: "#FF2D95",
    },
  },
  {
    // A green phosphor cockpit display with amber warnings.
    name: "Tomcat",
    type: "dark",
    surfaces: {
      editor: "#030703",
      activity: "#010401",
      sidebar: "#061006",
      panel: "#061006",
      status: "#061006",
      widget: "#0A1A09",
      raised: "#0A1A09",
      tabActive: "#0A1A09",
      tabInactive: "#061006",
      border: "#1E5724",
    },
    foreground: "#CCFA7B",
    muted: "#82AA51",
    primary: "#54DB51",
    secondary: "#D89D31",
    error: "#E24B26",
    warning: "#F0BF47",
    success: "#76FF63",
    info: "#76FF63",
    syntax: {
      text: "#CCFA7B",
      comment: mixHex("#278A31", "#82AA51", 0.4),
      keyword: "#76FF63",
      operator: mixHex("#82AA51", "#CCFA7B", 0.4),
      string: "#F0BF47",
      number: "#D89D31",
      constant: mixHex("#D89D31", "#E24B26", 0.4),
      variable: "#CCFA7B",
      property: mixHex("#CCFA7B", "#82AA51", 0.3),
      function: mixHex("#76FF63", "#CCFA7B", 0.5),
      libraryFunction: mixHex("#F0BF47", "#CCFA7B", 0.5),
      type: "#54DB51",
      markup: "#F0BF47",
      decorator: "#D89D31",
      invalid: "#E24B26",
    },
  },
  {
    // Parchment and ink: olive greens and aged gold on a light page.
    name: "Fellowship",
    type: "light",
    surfaces: {
      editor: "#F1E8C8",
      activity: "#D6CDA9",
      sidebar: "#E6DEB9",
      panel: "#E6DEB9",
      status: "#D6CDA9",
      widget: "#FAF1D4",
      raised: "#FAF1D4",
      tabActive: "#F1E8C8",
      tabInactive: "#E6DEB9",
      border: "#C5B980",
    },
    foreground: "#29341D",
    muted: "#66704B",
    primary: "#587A3D",
    secondary: "#9B6B2B",
    error: "#A94D35",
    warning: "#9B6B2B",
    success: "#587A3D",
    info: "#55713D",
    syntax: {
      text: "#29341D",
      comment: "#66704B",
      keyword: "#55713D",
      operator: mixHex("#7D8750", "#29341D", 0.3),
      string: "#9B6B2B",
      number: "#A94D35",
      constant: "#6F542A",
      variable: "#29341D",
      property: "#3D4D28",
      function: "#C28A32",
      libraryFunction: "#6F542A",
      type: mixHex("#587A3D", "#6F542A", 0.5),
      markup: "#55713D",
      decorator: "#A94D35",
      invalid: "#A94D35",
    },
  },
  {
    // Interstellar: white-on-black instrument readouts and Gargantua's gold.
    name: "Cooper",
    type: "dark",
    surfaces: {
      editor: "#07090B",
      activity: "#030405",
      sidebar: "#0D1013",
      panel: "#0D1013",
      status: "#0D1013",
      widget: "#171B1F",
      raised: "#171B1F",
      tabActive: "#171B1F",
      tabInactive: "#0D1013",
      border: "#2B3136",
    },
    foreground: "#EBE8E1",
    muted: "#8F959A",
    primary: "#DCA24A",
    secondary: "#9FBFD4",
    error: "#D9673B",
    warning: "#E27D3C",
    success: "#B5CFA5",
    info: "#9FBFD4",
    syntax: {
      text: "#EBE8E1",
      comment: "#8F959A",
      keyword: "#DCA24A",
      operator: "#A7AFB4",
      string: "#B5CFA5",
      number: "#E27D3C",
      constant: "#F3C46E",
      variable: "#EBE8E1",
      property: "#D6E4EE",
      function: "#9FBFD4",
      libraryFunction: mixHex("#DCA24A", "#EBE8E1", 0.5),
      type: mixHex("#9FBFD4", "#B5CFA5", 0.5),
      markup: "#F3C46E",
      decorator: mixHex("#DCA24A", "#D9673B", 0.5),
      invalid: "#D9673B",
    },
  },
  // The two Bluey themes are built from the characters' own colors, sampled from
  // the family artwork: navy #040620, purple-navy #403F65, Bluey blue #83BBE3,
  // steel #75A6BE, pale blue #D2EBFD, cream #FFF9D8, gold #EDCE74, orange
  // #FFB070, Bingo orange #E37A3B, Chilli's brown #9B5E33, and the tongue red
  // #C9504F. Colors are paired the way they are painted: measuring which colors
  // touch on the characters gives blue+steel, navy+purple-navy, pale blue+steel,
  // blue+pale blue, cream+orange, brown+orange, brown+gold, and gold+pale blue,
  // so the surfaces run along the navy/purple-navy of Bluey's head, code
  // structure takes the blues of his body, and literals take the warm family
  // shared by Chilli, Bingo and the muzzles.
  {
    name: "Bluey",
    type: "light",
    surfaces: {
      editor: "#FFF9D8",
      activity: "#83BBE3",
      sidebar: "#D2EBFD",
      panel: "#D2EBFD",
      status: "#83BBE3",
      widget: "#FFFFFF",
      // Muzzle gold, lightened toward cream: it carries the line highlight and
      // the unfocused selection, where full gold reads as a stripe.
      raised: mixHex("#EDCE74", "#FFF9D8", 0.55),
      tabActive: "#FFFFFF",
      tabInactive: "#D2EBFD",
      border: "#75A6BE",
    },
    foreground: "#040620",
    muted: "#403F65",
    // Purple-navy fills with cream on them, the way Bluey's head sits against
    // the muzzle; brown stays a text color, where it belongs.
    primary: "#403F65",
    secondary: "#83BBE3",
    accentForeground: ["#FFF9D8"],
    error: "#C9504F",
    warning: "#E37A3B",
    success: "#75A6BE",
    info: "#403F65",
    syntax: {
      text: "#040620",
      comment: mixHex("#75A6BE", "#9B5E33", 0.45),
      keyword: "#403F65",
      operator: mixHex("#403F65", "#040620", 0.45),
      string: "#9B5E33",
      number: "#E37A3B",
      constant: "#EDCE74",
      variable: "#83BBE3",
      property: "#040620",
      function: "#C9504F",
      libraryFunction: mixHex("#9B5E33", "#403F65", 0.4),
      type: mixHex("#EDCE74", "#9B5E33", 0.5),
      markup: "#E37A3B",
      decorator: mixHex("#403F65", "#C9504F", 0.5),
      invalid: "#C9504F",
    },
  },
  // Bluey after bedtime: the workbench runs along the navy and purple-navy of
  // Bluey's own head, the blues of his body carry the code's structure, and the
  // muzzle golds, Chilli's brown and Bingo's orange carry its literals.
  {
    name: "Bluey Night",
    type: "dark",
    surfaces: {
      editor: "#040620",
      activity: "#222345",
      sidebar: "#2B2A4E",
      panel: "#2B2A4E",
      status: "#403F65",
      widget: "#403F65",
      raised: "#4E4D76",
      tabActive: "#403F65",
      tabInactive: "#2B2A4E",
      border: "#4E4D76",
    },
    foreground: "#FFF9D8",
    muted: "#75A6BE",
    primary: "#83BBE3",
    secondary: "#EDCE74",
    error: "#C9504F",
    warning: "#FFB070",
    success: "#D2EBFD",
    info: "#75A6BE",
    syntax: {
      text: "#FFF9D8",
      comment: "#75A6BE",
      keyword: "#83BBE3",
      operator: mixHex("#83BBE3", "#D2EBFD", 0.5),
      string: "#EDCE74",
      number: "#FFD08D",
      constant: "#FFB070",
      variable: "#D2EBFD",
      property: "#FFF9D8",
      function: "#E37A3B",
      libraryFunction: "#9B5E33",
      type: mixHex("#EDCE74", "#9B5E33", 0.4),
      markup: "#FFB070",
      decorator: mixHex("#403F65", "#D2EBFD", 0.45),
      invalid: "#C9504F",
    },
  },
];

// The shared role matcher reads "type-parameter" as a parameter; types keep the type role here.
const TOKEN_ROLE_OVERRIDES = { Types: "type" };
const SEMANTIC_ROLE_OVERRIDES = { typeParameter: "type" };

function passes(color, backgrounds) {
  return backgrounds.every(background => contrastRatio(color, background) >= MIN_TEXT_CONTRAST);
}

function toHsl(color) {
  const [red, green, blue] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const span = max - min;
  if (span === 0) {
    return { hue: 0, saturation: 0, lightness };
  }
  const saturation = span / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === red
      ? 60 * (((green - blue) / span) % 6)
      : max === green
        ? 60 * ((blue - red) / span + 2)
        : 60 * ((red - green) / span + 4);
  return { hue, saturation, lightness };
}

/**
 * Darkens (or lightens) `color` until it reads on every background, keeping its
 * hue and holding on to its saturation. Blending toward the theme's foreground
 * instead would pull every hue to the same washed-out dark, which is what makes
 * a pastel palette unreadable as syntax colors on a light ground.
 */
function readable(color, backgrounds, target) {
  if (passes(color, backgrounds)) {
    return color.toUpperCase();
  }
  const { hue, saturation, lightness } = toHsl(color);
  const towardDark = relativeLuminance(target) < relativeLuminance(color);
  for (let step = 1; step <= 48; step += 1) {
    const nextLightness = towardDark ? lightness - step * 0.02 : lightness + step * 0.02;
    if (nextLightness <= 0.04 || nextLightness >= 0.97) {
      break;
    }
    // Saturation rises as the color darkens, so the hue stays recognizable.
    const candidate = hslToHex(hue, Math.min(1, saturation * (1 + step * 0.03)), nextLightness);
    if (passes(candidate, backgrounds)) {
      return candidate.toUpperCase();
    }
  }
  for (let step = 0; step <= 20; step += 1) {
    const candidate = mixHex(color, target, step / 20);
    if (passes(candidate, backgrounds)) {
      return candidate.toUpperCase();
    }
  }
  throw new Error(`No readable variant of ${color} on ${backgrounds.join(", ")}.`);
}

/** The first candidate that reads on every background, else the strongest. */
function pickForeground(backgrounds, candidates) {
  const found = candidates.find(candidate => passes(candidate, backgrounds));
  if (found) {
    return found;
  }
  const score = candidate =>
    Math.min(...backgrounds.map(background => contrastRatio(candidate, background)));
  return candidates.reduce((best, candidate) => (score(candidate) > score(best) ? candidate : best));
}

/** An accent fill with text that reads on it; the fill deepens if nothing does. */
function accentPair(accent, candidates, deepen) {
  for (let step = 0; step <= 20; step += 1) {
    const background = mixHex(accent, deepen, step / 20).toUpperCase();
    const foreground = pickForeground([background], candidates);
    if (contrastRatio(foreground, background) >= MIN_TEXT_CONTRAST) {
      return { background, foreground };
    }
  }
  throw new Error(`No readable text for accent ${accent}.`);
}

function buildTheme(spec) {
  const s = spec.surfaces;
  const isLight = spec.type === "light";
  const ink = isLight ? "#000000" : "#FFFFFF";
  const allSurfaces = [
    s.editor, s.activity, s.sidebar, s.panel, s.status, s.widget, s.raised, s.tabActive, s.tabInactive,
  ];
  const foreground = readable(spec.foreground, allSurfaces, ink);
  const mutedForeground = readable(spec.muted, allSurfaces, foreground);
  const onAccent = [
    ...(spec.accentForeground ?? []),
    s.activity,
    s.editor,
    foreground,
    "#000000",
    "#FFFFFF",
  ];

  // Accents double as text (links, titles, icons), so they must read on every surface.
  const accentText = color => readable(color, allSurfaces, foreground);
  const deepen = isLight ? "#000000" : s.activity;
  const primaryPair = accentPair(accentText(spec.primary), onAccent, deepen);
  const secondaryPair = accentPair(accentText(spec.secondary), onAccent, deepen);
  const errorPair = accentPair(accentText(spec.error), onAccent, deepen);
  const warningPair = accentPair(accentText(spec.warning), onAccent, deepen);
  const infoPair = accentPair(accentText(spec.info), onAccent, deepen);
  const success = accentText(spec.success);

  const primary = primaryPair.background;
  const secondary = secondaryPair.background;
  const hoverCandidates = [foreground, primaryPair.foreground, mutedForeground];
  const selectionBackgrounds = [
    alphaComposite(primary, s.editor, "66"),
    alphaComposite(secondary, s.editor, "66"),
  ];
  const listHover = [alphaComposite(primary, s.sidebar, "40")];
  const tabHover = [
    alphaComposite(primary, s.editor, "40"),
    alphaComposite(primary, s.tabInactive, "40"),
  ];
  const modernTabHover = [
    alphaComposite(primary, s.activity, "40"),
    alphaComposite(primary, s.sidebar, "40"),
  ];

  const colors = buildWorkbenchColors(TEMPLATE.colors, {
    foreground,
    mutedForeground,
    editorBackground: s.editor,
    activityBackground: s.activity,
    sidebarBackground: s.sidebar,
    panelBackground: s.panel,
    statusBackground: s.status,
    widgetBackground: s.widget,
    raisedBackground: s.raised,
    tabActiveBackground: s.tabActive,
    tabInactiveBackground: s.tabInactive,
    structuralBorder: s.border,
    primary,
    primaryForeground: primaryPair.foreground,
    secondary,
    secondaryForeground: secondaryPair.foreground,
    error: errorPair.background,
    errorForeground: errorPair.foreground,
    warning: warningPair.background,
    warningForeground: warningPair.foreground,
    success,
    info: infoPair.background,
    infoForeground: infoPair.foreground,
    selectionForeground: pickForeground(selectionBackgrounds, hoverCandidates),
    listHoverForeground: pickForeground(listHover, hoverCandidates),
    tabHoverForeground: pickForeground(tabHover, hoverCandidates),
    modernTabHoverForeground: pickForeground(modernTabHover, hoverCandidates),
  });

  const syntaxBackgrounds = [
    s.editor,
    alphaComposite(s.raised, s.editor, "80"),
    alphaComposite(secondary, s.editor, "20"),
  ];
  const syntax = Object.fromEntries(
    Object.entries(spec.syntax).map(([role, color]) => [
      role,
      readable(color, syntaxBackgrounds, foreground),
    ])
  );

  const tokenColors = TEMPLATE.tokenColors.map(entry => {
    const rule = JSON.parse(JSON.stringify(entry));
    if (rule.settings && typeof rule.settings.foreground === "string") {
      rule.settings.foreground = syntax[TOKEN_ROLE_OVERRIDES[entry.name] || syntaxRoleForToken(entry)];
    }
    return rule;
  });
  const semanticTokenColors = Object.fromEntries(
    Object.entries(TEMPLATE.semanticTokenColors).map(([key, value]) => [
      key,
      typeof value === "string"
        ? syntax[SEMANTIC_ROLE_OVERRIDES[key] || syntaxRoleForSemanticToken(key)]
        : value,
    ])
  );

  Object.assign(colors, spec.colorOverrides ?? {});
  for (const [name, color] of Object.entries(spec.tokenOverrides ?? {})) {
    const rule = tokenColors.find(entry => entry.name === name);
    if (!rule) {
      throw new Error(`${spec.name} overrides unknown token rule "${name}".`);
    }
    rule.settings.foreground = color;
  }
  for (const [key, color] of Object.entries(spec.semanticOverrides ?? {})) {
    if (!(key in semanticTokenColors)) {
      throw new Error(`${spec.name} overrides unknown semantic token "${key}".`);
    }
    semanticTokenColors[key] = color;
  }

  const rolePairs = [
    ["activityBar.foreground", "activityBar.background"],
    ["activityBar.inactiveForeground", "activityBar.background"],
    ["activityBarBadge.foreground", "activityBarBadge.background"],
    ["sideBarTitle.foreground", "sideBar.background"],
    ["sideBarSectionHeader.foreground", "sideBarSectionHeader.background"],
    ["list.activeSelectionForeground", "list.activeSelectionBackground"],
    ["list.inactiveSelectionForeground", "list.inactiveSelectionBackground"],
    ["statusBar.foreground", "statusBar.background"],
    ["titleBar.activeForeground", "titleBar.activeBackground"],
    ["tab.activeForeground", "tab.activeBackground"],
    ["tab.inactiveForeground", "tab.inactiveBackground"],
    ["modernTab.activeForeground", "modernTab.activeBackground"],
    ["modernEditorTab.activeForeground", "modernEditorTab.activeBackground"],
    ["panelSectionHeader.foreground", "panelSectionHeader.background"],
    ["editorSuggestWidget.selectedForeground", "editorSuggestWidget.selectedBackground"],
    ["editorWidget.foreground", "editorWidget.background"],
    ["input.foreground", "input.background"],
    ["dropdown.foreground", "dropdown.background"],
    ["button.foreground", "button.background"],
    ["button.secondaryForeground", "button.secondaryBackground"],
    ["badge.foreground", "badge.background"],
  ];

  const pairs = [
    ...rolePairs
      .filter(([fg, bg]) => colors[fg] && colors[bg])
      .map(([fg, bg]) => [colors[fg], colors[bg]]),
    ...tokenColors.map(rule => [rule.settings.foreground, s.editor]),
    ...Object.values(semanticTokenColors).map(color => [color, s.editor]),
    [foreground, s.editor],
    [mutedForeground, s.editor],
    [primary, s.activity],
    [primary, s.sidebar],
    [primary, s.panel],
    [secondary, s.widget],
    [primaryPair.foreground, primary],
    [secondaryPair.foreground, secondary],
    [errorPair.foreground, errorPair.background],
    [warningPair.foreground, warningPair.background],
    [infoPair.foreground, infoPair.background],
    [colors["editor.selectionForeground"], selectionBackgrounds[0]],
    [colors["list.hoverForeground"], listHover[0]],
    [colors["tab.hoverForeground"], tabHover[0]],
    [colors["tab.hoverForeground"], tabHover[1]],
    [DEBUGGING_STATUS_FOREGROUND, DEBUGGING_STATUS_BACKGROUND],
  ];
  const failures = pairs.filter(([fg, bg]) => contrastRatio(fg, bg) < MIN_TEXT_CONTRAST);
  if (failures.length > 0) {
    throw new Error(
      `${spec.name} misses ${MIN_TEXT_CONTRAST}:1 on ${failures
        .map(([fg, bg]) => `${fg}/${bg} (${contrastRatio(fg, bg).toFixed(2)})`)
        .join(", ")}`
    );
  }

  return {
    name: spec.name,
    type: spec.type,
    semanticHighlighting: true,
    colors: uppercaseColors(colors),
    tokenColors,
    semanticTokenColors,
  };
}

function uppercaseColors(colors) {
  return Object.fromEntries(
    Object.entries(colors).map(([key, value]) =>
      [key, typeof value === "string" ? value.toUpperCase() : value]
    )
  );
}

for (const spec of THEMES) {
  const theme = buildTheme(spec);
  const file = path.join(ROOT, "themes", `${spec.name.replace(/\s+/g, "-")}-color-theme.json`);
  fs.writeFileSync(file, `${JSON.stringify(theme, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, file)}`);
}
