"use strict";

const MIN_TEXT_CONTRAST = 4.5;
const MIN_SELECTION_CONTRAST = 1.6;
const DEFAULT_LIGHT_FOREGROUND = "#F3F4F7";
const DEFAULT_DARK_FOREGROUND = "#14202B";
const DEBUGGING_STATUS_BACKGROUND = "#BAA4E5";
const DEBUGGING_STATUS_FOREGROUND = "#1C3C55";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomBetween(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function hslToHex(hue, saturation, lightness) {
  const h = normalizeHue(hue) / 60;
  const s = Math.max(0, Math.min(1, saturation));
  const l = Math.max(0, Math.min(1, lightness));
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const second = chroma * (1 - Math.abs((h % 2) - 1));
  const match = l - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (h < 1) {
    red = chroma;
    green = second;
  } else if (h < 2) {
    red = second;
    green = chroma;
  } else if (h < 3) {
    green = chroma;
    blue = second;
  } else if (h < 4) {
    green = second;
    blue = chroma;
  } else if (h < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  return `#${[red, green, blue]
    .map(channel => Math.round((channel + match) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseHex(color) {
  if (typeof color !== "string") {
    throw new TypeError("Expected a hexadecimal color string.");
  }

  let value = color.replace(/^#/, "");
  if (value.length === 3 || value.length === 4) {
    value = value.split("").map(channel => channel + channel).join("");
  }
  if (value.length === 8) {
    value = value.slice(0, 6);
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new TypeError(`Invalid hexadecimal color: ${color}`);
  }

  return {
    red: parseInt(value.slice(0, 2), 16),
    green: parseInt(value.slice(2, 4), 16),
    blue: parseInt(value.slice(4, 6), 16),
  };
}

function channelLuminance(channel) {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  const { red, green, blue } = parseHex(color);
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function mixHex(first, second, weight) {
  const firstRgb = parseHex(first);
  const secondRgb = parseHex(second);
  const amount = Math.max(0, Math.min(1, weight));
  const channels = ["red", "green", "blue"].map(channel =>
    Math.round(firstRgb[channel] + (secondRgb[channel] - firstRgb[channel]) * amount)
      .toString(16)
      .padStart(2, "0")
  );
  return `#${channels.join("")}`;
}

function withAlpha(color, alpha) {
  const opaque = color.replace(/^#/, "").slice(0, 6);
  return `#${opaque}${alpha}`;
}

function alphaComposite(overlay, background, alpha) {
  return mixHex(background, overlay, parseInt(alpha, 16) / 255);
}

/**
 * A selected-but-unfocused row sits straight on the surfaces lists render on,
 * and the raised surface alone can land a hair away from them. Lift it toward
 * the foreground until the row separates from every one of those surfaces.
 */
function visibleSelectionBackground(raised, foreground, backgrounds) {
  let candidate = raised;
  for (let step = 0; step <= 24; step += 1) {
    candidate = mixHex(raised, foreground, step / 48);
    const separated = backgrounds.every(
      background => contrastRatio(candidate, background) >= MIN_SELECTION_CONTRAST
    );
    if (separated) {
      break;
    }
  }
  return candidate;
}

function randomDarkColor(random, hue, minimumLightness, maximumLightness) {
  return hslToHex(
    hue + randomBetween(random, -34, 34),
    randomBetween(random, 0.35, 0.78),
    randomBetween(random, minimumLightness, maximumLightness)
  );
}

function findReadableLight(backgrounds, random) {
  for (let attempt = 0; attempt < 320; attempt += 1) {
    const candidate = hslToHex(
      randomBetween(random, 0, 360),
      randomBetween(random, 0.05, 0.48),
      randomBetween(random, 0.76, 0.99)
    );
    if (backgrounds.every(background => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST)) {
      return candidate;
    }
  }

  for (const candidate of ["#FFFFFF", DEFAULT_LIGHT_FOREGROUND]) {
    if (backgrounds.every(background => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST)) {
      return candidate;
    }
  }

  return null;
}

function pickReadableLight(backgrounds, random) {
  const candidate = findReadableLight(backgrounds, random);
  if (candidate) {
    return candidate;
  }
  throw new Error("Unable to generate a readable light foreground for the selected surfaces.");
}

function findReadableDark(backgrounds, random) {
  for (let attempt = 0; attempt < 320; attempt += 1) {
    const candidate = hslToHex(
      randomBetween(random, 0, 360),
      randomBetween(random, 0.18, 0.65),
      randomBetween(random, 0.03, 0.2)
    );
    if (backgrounds.every(background => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST)) {
      return candidate;
    }
  }

  for (const candidate of [DEFAULT_DARK_FOREGROUND, "#000000"]) {
    if (backgrounds.every(background => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST)) {
      return candidate;
    }
  }

  return null;
}

function pickReadableDark(backgrounds, random) {
  const candidate = findReadableDark(backgrounds, random);
  if (candidate) {
    return candidate;
  }
  throw new Error("Unable to generate a readable dark foreground for the selected surfaces.");
}

function pickReadableForeground(backgrounds, random) {
  const light = findReadableLight(backgrounds, random);
  if (light) {
    return light;
  }
  const dark = findReadableDark(backgrounds, random);
  if (dark) {
    return dark;
  }
  throw new Error("Unable to generate a readable foreground for the selected surfaces.");
}

function pickAccentPair(backgrounds, random, minimumHue, maximumHue) {
  for (let attempt = 0; attempt < 640; attempt += 1) {
    const background = hslToHex(
      randomBetween(random, minimumHue, maximumHue),
      randomBetween(random, 0.55, 0.94),
      randomBetween(random, 0.52, 0.82)
    );
    const foreground = findReadableDark([background], random);
    if (!foreground) {
      continue;
    }
    if (
      backgrounds.every(surface => contrastRatio(background, surface) >= MIN_TEXT_CONTRAST) &&
      contrastRatio(foreground, background) >= MIN_TEXT_CONTRAST
    ) {
      return { background, foreground };
    }
  }

  throw new Error("Unable to generate an accessible accent pair.");
}

const SYNTAX_ROLE_DEFINITIONS = {
  text: { hueOffset: 0, saturation: [0.1, 0.3], lightness: [0.78, 0.95] },
  comment: { hueOffset: -20, saturation: [0.2, 0.48], lightness: [0.68, 0.84] },
  keyword: { hueOffset: 305, saturation: [0.62, 0.9], lightness: [0.62, 0.86] },
  operator: { hueOffset: 200, saturation: [0.62, 0.9], lightness: [0.62, 0.86] },
  string: { hueOffset: 125, saturation: [0.55, 0.88], lightness: [0.62, 0.86] },
  number: { hueOffset: 32, saturation: [0.62, 0.92], lightness: [0.62, 0.84] },
  constant: { hueOffset: 58, saturation: [0.58, 0.9], lightness: [0.62, 0.84] },
  variable: { hueOffset: 220, saturation: [0.58, 0.88], lightness: [0.62, 0.86] },
  property: { hueOffset: 165, saturation: [0.52, 0.84], lightness: [0.64, 0.88] },
  function: { hueOffset: 265, saturation: [0.58, 0.9], lightness: [0.62, 0.86] },
  libraryFunction: { hueOffset: 245, saturation: [0.58, 0.88], lightness: [0.64, 0.86] },
  type: { hueOffset: 78, saturation: [0.58, 0.9], lightness: [0.62, 0.84] },
  markup: { hueOffset: 180, saturation: [0.58, 0.88], lightness: [0.62, 0.86] },
  decorator: { hueOffset: 335, saturation: [0.58, 0.9], lightness: [0.62, 0.86] },
  invalid: { hueOffset: 5, saturation: [0.68, 0.95], lightness: [0.6, 0.82] },
};

function findReadableSyntaxColor(backgrounds, baseHue, definition, random) {
  for (let attempt = 0; attempt < 640; attempt += 1) {
    const candidate = hslToHex(
      baseHue + definition.hueOffset + randomBetween(random, -10, 10),
      randomBetween(random, definition.saturation[0], definition.saturation[1]),
      randomBetween(random, definition.lightness[0], definition.lightness[1])
    );
    if (backgrounds.every(background => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST)) {
      return candidate;
    }
  }

  for (const lightness of [0.62, 0.7, 0.78, 0.86, 0.94, 0.99]) {
    for (const saturation of [definition.saturation[1], definition.saturation[0], 0.2]) {
      const candidate = hslToHex(baseHue + definition.hueOffset, saturation, lightness);
      if (
        backgrounds.every(background => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST)
      ) {
        return candidate;
      }
    }
  }

  throw new Error("Unable to generate an accessible semantic syntax color.");
}

function syntaxRoleForToken(entry) {
  const name = typeof entry.name === "string" ? entry.name : "";
  const scopes = Array.isArray(entry.scope) ? entry.scope.join(" ") : entry.scope || "";
  const text = `${name} ${scopes}`.toLowerCase();

  // Markdown names a heading, a list marker and a link destination all at once,
  // and the generic tests below would read most of them as strings. Q has no
  // markdown roles of its own, so each one lands on the nearest code role.
  if (text.includes("markdown") || text.includes("frontmatter")) {
    if (text.includes("punctuation") || text.includes("separator")) {
      return "operator";
    }
    if (text.includes("heading") || text.includes("section")) {
      return "markup";
    }
    if (text.includes("reference")) {
      return "constant";
    }
    if (text.includes("title") || text.includes("description")) {
      return "string";
    }
    if (text.includes("link")) {
      return "type";
    }
    if (text.includes("raw") || text.includes("fenced") || text.includes("code")) {
      return "string";
    }
    if (text.includes("quote") || text.includes("strikethrough")) {
      return "comment";
    }
    if (text.includes("bold") || text.includes("italic") || text.includes("list")) {
      return "text";
    }
  }
  if (text.includes("comment")) {
    return "comment";
  }
  if (text.includes("invalid")) {
    return "invalid";
  }
  if (text.includes("string") || text.includes("quoted") || text.includes("regexp")) {
    return "string";
  }
  if (text.includes("numeric") || text.includes("numbers")) {
    return "number";
  }
  if (text.includes("parameter")) {
    return "variable";
  }
  if (text.includes("constant") || text.includes("enum")) {
    return "constant";
  }
  if (text.includes("property") || text.includes("attribute")) {
    return "property";
  }
  if (text.includes("decorator")) {
    return "decorator";
  }
  if (text.includes("library function")) {
    return "libraryFunction";
  }
  if (text.includes("function") || text.includes("method") || text.includes("constructor")) {
    return "function";
  }
  if (
    text.includes("operator") ||
    (text.includes("punctuation") && !text.includes("keyword"))
  ) {
    return "operator";
  }
  if (text.includes("keyword")) {
    return "keyword";
  }
  if (text.includes("type") || text.includes("class") || text.includes("namespace")) {
    return "type";
  }
  if (text.includes("tag") || text.includes("markup") || text.includes("heading")) {
    return "markup";
  }
  if (text.includes("storage") || text.includes("modifier")) {
    return "keyword";
  }
  if (text.includes("variable")) {
    return "variable";
  }
  return "text";
}

function syntaxRoleForSemanticToken(key) {
  const text = key.toLowerCase();

  if (text === "comment") {
    return "comment";
  }
  if (text.includes("string") || text.includes("regexp")) {
    return "string";
  }
  if (text === "number") {
    return "number";
  }
  if (text.includes("enum") || text.includes("constant")) {
    return "constant";
  }
  if (text.includes("parameter") || text.includes("variable")) {
    return "variable";
  }
  if (text.includes("property") || text.includes("member")) {
    return "property";
  }
  if (text.includes("decorator")) {
    return "decorator";
  }
  if (text.includes("defaultlibrary")) {
    return text.includes("function") || text.includes("method") ? "libraryFunction" : "type";
  }
  if (text.includes("function") || text.includes("method")) {
    return "function";
  }
  if (text.includes("operator")) {
    return "operator";
  }
  if (text.includes("keyword") || text.includes("modifier") || text.includes("macro")) {
    return "keyword";
  }
  if (
    text.includes("namespace") ||
    text.includes("type") ||
    text.includes("class") ||
    text.includes("interface") ||
    text.includes("enum")
  ) {
    return "type";
  }
  if (text.includes("label") || text.includes("event")) {
    return "markup";
  }
  return "text";
}

function generateSyntaxPalette(backgrounds, baseHue, random) {
  return Object.fromEntries(
    Object.entries(SYNTAX_ROLE_DEFINITIONS).map(([role, definition]) => [
      role,
      findReadableSyntaxColor(backgrounds, baseHue, definition, random),
    ])
  );
}

function generateTokenColors(template, syntaxPalette) {
  return (template.tokenColors || []).map(entry => {
    const generated = clone(entry);
    if (generated.settings && typeof generated.settings.foreground === "string") {
      generated.settings.foreground = syntaxPalette[syntaxRoleForToken(entry)];
    }
    return generated;
  });
}

function generateSemanticTokenColors(template, syntaxPalette) {
  const generated = {};
  for (const [key, value] of Object.entries(template.semanticTokenColors || {})) {
    generated[key] =
      typeof value === "string"
        ? syntaxPalette[syntaxRoleForSemanticToken(key)]
        : clone(value);
  }
  return generated;
}

function minimumContrastForColors(
  tokenColors,
  semanticTokenColors,
  editorBackground,
  contentBackgrounds,
  pairs
) {
  const ratios = pairs.map(([foreground, background]) => contrastRatio(foreground, background));

  for (const entry of tokenColors) {
    if (entry.settings && typeof entry.settings.foreground === "string") {
      ratios.push(contrastRatio(entry.settings.foreground, editorBackground));
      for (const background of contentBackgrounds) {
        ratios.push(contrastRatio(entry.settings.foreground, background));
      }
    }
  }
  for (const value of Object.values(semanticTokenColors)) {
    if (typeof value === "string") {
      ratios.push(contrastRatio(value, editorBackground));
      for (const background of contentBackgrounds) {
        ratios.push(contrastRatio(value, background));
      }
    }
  }

  if (ratios.length === 0) {
    throw new Error("Generated theme has no readable foreground/background pairs.");
  }
  return Math.min(...ratios);
}

/**
 * Maps a palette of surfaces and accents onto every workbench color role the
 * themes define. Q fills the palette at random; the fixed film themes supply
 * their own.
 */
function buildWorkbenchColors(templateColors, palette) {
  const {
    foreground,
    mutedForeground,
    editorBackground,
    activityBackground,
    sidebarBackground,
    panelBackground,
    statusBackground,
    widgetBackground,
    raisedBackground,
    tabActiveBackground,
    tabInactiveBackground,
    structuralBorder,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
    error,
    errorForeground,
    warning,
    warningForeground,
    success,
    successForeground,
    info,
    infoForeground,
    selectionForeground,
    listHoverForeground,
    tabHoverForeground,
    modernTabHoverForeground,
  } = palette;
  const colors = clone(templateColors);
  const inactiveSelectionBackground = visibleSelectionBackground(raisedBackground, foreground, [
    sidebarBackground,
    panelBackground,
    widgetBackground,
  ]);

  Object.assign(colors, {
    focusBorder: primary,
    foreground,
    disabledForeground: mutedForeground,
    descriptionForeground: mutedForeground,
    errorForeground: error,
    "icon.foreground": primary,
    "textLink.foreground": primary,
    "textLink.activeForeground": secondary,
    "textBlockQuote.background": panelBackground,
    "textBlockQuote.border": secondary,
    "button.background": panelBackground,
    "button.foreground": foreground,
    "button.border": primary,
    "button.hoverBackground": raisedBackground,
    "button.secondaryBackground": primary,
    "button.secondaryForeground": primaryForeground,
    "button.secondaryHoverBackground": secondary,
    "dropdown.background": widgetBackground,
    "dropdown.listBackground": widgetBackground,
    "dropdown.foreground": foreground,
    "dropdown.border": primary,
    "input.background": widgetBackground,
    "input.foreground": foreground,
    "input.border": primary,
    "input.placeholderForeground": mutedForeground,
    "badge.background": secondary,
    "badge.foreground": secondaryForeground,
    "activityBar.background": activityBackground,
    "activityBar.foreground": primary,
    "activityBar.inactiveForeground": mutedForeground,
    "activityBarBadge.background": primary,
    "activityBarBadge.foreground": primaryForeground,
    "sideBar.background": sidebarBackground,
    "sideBar.foreground": foreground,
    "sideBarTitle.foreground": primary,
    "sideBarSectionHeader.background": raisedBackground,
    "sideBarSectionHeader.foreground": foreground,
    "sideBar.border": structuralBorder,
    "list.activeSelectionBackground": primary,
    "list.activeSelectionForeground": primaryForeground,
    "list.activeSelectionIconForeground": primaryForeground,
    "list.inactiveSelectionBackground": inactiveSelectionBackground,
    "list.inactiveSelectionForeground": foreground,
    "list.inactiveSelectionIconForeground": mutedForeground,
    "list.hoverBackground": withAlpha(primary, "40"),
    "list.hoverForeground": listHoverForeground,
    "list.focusOutline": primary,
    "list.inactiveFocusOutline": withAlpha(primary, "99"),
    "editor.background": editorBackground,
    "editor.foreground": foreground,
    "editorLineNumber.foreground": mutedForeground,
    "editorLineNumber.activeForeground": secondary,
    "editorCursor.foreground": primary,
    "editor.selectionBackground": withAlpha(primary, "66"),
    "editor.selectionForeground": selectionForeground,
    "editor.inactiveSelectionBackground": withAlpha(secondary, "66"),
    "editor.lineHighlightBackground": withAlpha(raisedBackground, "80"),
    "editorWhitespace.foreground": mutedForeground,
    "editorIndentGuide.background1": withAlpha(mutedForeground, "55"),
    "editorIndentGuide.activeBackground1": primary,
    "editorWidget.background": widgetBackground,
    "editorWidget.foreground": foreground,
    "editorWidget.border": primary,
    "editorSuggestWidget.background": widgetBackground,
    "editorSuggestWidget.foreground": foreground,
    "editorSuggestWidget.selectedBackground": primary,
    "editorSuggestWidget.selectedForeground": primaryForeground,
    "editorSuggestWidget.highlightForeground": secondary,
    "editorHoverWidget.background": widgetBackground,
    "editorHoverWidget.border": primary,
    // The markdown preview draws mermaid diagrams with the workbench's chart
    // stroke, and VS Code's default for it is a steel blue no theme here chose.
    // Nodes fill with the widget background, so on a near-black editor the
    // stroke is most of what the eye gets; it takes the accent the theme
    // already puts on its widget borders, which is what the preview would fall
    // back to if the default were not in the way.
    "chart.line": primary,
    "editorBracketMatch.background": withAlpha(secondary, "20"),
    "editorBracketMatch.border": primary,
    "editorError.foreground": error,
    "editorWarning.foreground": warning,
    "editorInfo.foreground": info,
    "editorHint.foreground": secondary,
    "editorGutter.addedBackground": success,
    "editorGutter.deletedBackground": error,
    "editorOverviewRuler.border": structuralBorder,
    "editorOverviewRuler.findMatchForeground": secondary,
    "editorOverviewRuler.modifiedForeground": warning,
    "editorOverviewRuler.selectionHighlightForeground": primary,
    "editorOverviewRuler.wordHighlightForeground": info,
    "editorOverviewRuler.wordHighlightStrongForeground": secondary,
    "minimap.background": panelBackground,
    "editorGroupHeader.tabsBackground": editorBackground,
    "editorGroupHeader.tabsBorder": "#00000000",
    "surface.background": sidebarBackground,
    "surface.foreground": foreground,
    "surface.border": structuralBorder,
    "editor.border": structuralBorder,
    "panel.background": editorBackground,
    "panel.border": structuralBorder,
    "panelSectionHeader.background": panelBackground,
    "panelSectionHeader.foreground": primary,
    "panelSectionHeader.border": structuralBorder,
    "panelTitle.activeForeground": primary,
    "panelTitle.inactiveForeground": mutedForeground,
    "outputView.background": editorBackground,
    "outputViewStickyScroll.background": editorBackground,
    "statusBar.background": statusBackground,
    "statusBar.foreground": foreground,
    "statusBar.border": structuralBorder,
    "statusBar.debuggingBackground": DEBUGGING_STATUS_BACKGROUND,
    "statusBar.debuggingForeground": DEBUGGING_STATUS_FOREGROUND,
    "statusBar.debuggingBorder": DEBUGGING_STATUS_BACKGROUND,
    "statusBar.noFolderBackground": statusBackground,
    "statusBar.noFolderForeground": foreground,
    "statusBar.noFolderBorder": structuralBorder,
    "statusBar.focusBorder": primary,
    "statusBarItem.activeBackground": raisedBackground,
    "statusBarItem.hoverBackground": raisedBackground,
    "statusBarItem.hoverForeground": foreground,
    "statusBarItem.focusBorder": primary,
    "statusBarItem.prominentBackground": primary,
    "statusBarItem.prominentForeground": primaryForeground,
    "statusBarItem.prominentHoverBackground": secondary,
    "statusBarItem.prominentHoverForeground": secondaryForeground,
    "statusBarItem.remoteBackground": info,
    "statusBarItem.remoteForeground": infoForeground,
    "statusBarItem.remoteHoverBackground": info,
    "statusBarItem.remoteHoverForeground": infoForeground,
    "statusBarItem.errorBackground": error,
    "statusBarItem.errorForeground": errorForeground,
    "statusBarItem.errorHoverBackground": error,
    "statusBarItem.errorHoverForeground": errorForeground,
    "statusBarItem.warningBackground": warning,
    "statusBarItem.warningForeground": warningForeground,
    "statusBarItem.warningHoverBackground": warning,
    "statusBarItem.warningHoverForeground": warningForeground,
    "statusBarItem.offlineBackground": raisedBackground,
    "statusBarItem.offlineForeground": foreground,
    "statusBarItem.offlineHoverBackground": raisedBackground,
    "statusBarItem.offlineHoverForeground": foreground,
    "statusBarItem.compactHoverBackground": raisedBackground,
    "tab.activeBackground": tabActiveBackground,
    "tab.activeForeground": foreground,
    "tab.activeBorder": primary,
    "tab.activeBorderTop": primary,
    "tab.unfocusedActiveBackground": tabActiveBackground,
    "tab.unfocusedActiveForeground": foreground,
    "tab.unfocusedActiveBorder": primary,
    "tab.unfocusedActiveBorderTop": primary,
    "tab.selectedBackground": tabActiveBackground,
    "tab.selectedForeground": foreground,
    "tab.selectedBorderTop": primary,
    "tab.inactiveBackground": tabInactiveBackground,
    "tab.inactiveForeground": mutedForeground,
    "tab.unfocusedInactiveBackground": tabInactiveBackground,
    "tab.unfocusedInactiveForeground": mutedForeground,
    "tab.border": "#00000000",
    "tab.lastPinnedBorder": "#00000000",
    "tab.hoverBackground": withAlpha(primary, "40"),
    "tab.hoverForeground": tabHoverForeground,
    "tab.unfocusedHoverBackground": withAlpha(primary, "40"),
    "tab.unfocusedHoverForeground": tabHoverForeground,
    "tab.hoverBorder": "#00000000",
    "tab.unfocusedHoverBorder": "#00000000",
    "tab.activeModifiedBorder": secondary,
    "tab.inactiveModifiedBorder": secondary,
    "tab.unfocusedActiveModifiedBorder": secondary,
    "tab.unfocusedInactiveModifiedBorder": secondary,
    "modernTab.activeBackground": primary,
    "modernTab.activeForeground": primaryForeground,
    "modernTab.hoverBackground": withAlpha(primary, "40"),
    "modernTab.hoverForeground": modernTabHoverForeground,
    "modernEditorTab.activeBackground": tabActiveBackground,
    "modernEditorTab.activeActionBackground": tabActiveBackground,
    "modernEditorTab.activeForeground": foreground,
    "modernEditorTab.activeHoverBackground": tabActiveBackground,
    "modernEditorTab.activeHoverActionBackground": tabActiveBackground,
    "modernEditorTab.inactiveBackground": tabInactiveBackground,
    "modernEditorTab.hoverBackground": withAlpha(primary, "40"),
    "modernEditorTab.hoverActionBackground": tabInactiveBackground,
    "modernEditorTab.hoverForeground": tabHoverForeground,
    "modernEditorTab.selectedActionBackground": tabActiveBackground,
    "modernActivityBar.background": activityBackground,
    "modernActivityBar.inactiveBackground": activityBackground,
    "modernActivityBarItem.activeBackground": primary,
    "modernActivityBarItem.activeForeground": primaryForeground,
    "modernActivityBarItem.hoverBackground": withAlpha(primary, "40"),
    "modernActivityBarItem.hoverForeground": foreground,
    "titleBar.activeBackground": activityBackground,
    "titleBar.activeForeground": foreground,
    "titleBar.inactiveBackground": activityBackground,
    "titleBar.inactiveForeground": mutedForeground,
    "terminal.background": editorBackground,
    "terminal.foreground": foreground,
    "terminalCursor.foreground": primary,
    "terminal.ansiBlack": mutedForeground,
    "terminal.ansiBrightBlack": mutedForeground,
    "terminal.ansiRed": error,
    "terminal.ansiBrightRed": error,
    "terminal.ansiGreen": success,
    "terminal.ansiBrightGreen": success,
    "terminal.ansiYellow": warning,
    "terminal.ansiBrightYellow": warning,
    "terminal.ansiBlue": info,
    "terminal.ansiBrightBlue": info,
    "terminal.ansiMagenta": secondary,
    "terminal.ansiBrightMagenta": secondary,
    "terminal.ansiCyan": primary,
    "terminal.ansiBrightCyan": primary,
    "terminal.ansiWhite": mutedForeground,
    "terminal.ansiBrightWhite": foreground,
    // Changed code reads as a wash, not as an outline. Bordering every changed
    // line boxes the code in and puts a saturated stroke next to the syntax it
    // is meant to frame; a tint sits underneath instead. The tints carry alpha
    // so token colors stay legible through them, and the build holds the
    // syntax to its floor over them. Whole lines take the lighter wash and the
    // changed words inside them the heavier one, which is the only distinction
    // the borders were making.
    "diffEditor.insertedLineBackground": `${success}14`,
    "diffEditor.insertedTextBackground": `${success}1F`,
    "diffEditor.removedLineBackground": `${error}14`,
    "diffEditor.removedTextBackground": `${error}1F`,
    // No code sits on these, so they can carry the accent at full strength.
    "diffEditorGutter.insertedLineBackground": `${success}26`,
    "diffEditorGutter.removedLineBackground": `${error}26`,
    "diffEditorOverview.insertedForeground": `${success}CC`,
    "diffEditorOverview.removedForeground": `${error}CC`,
    "diffEditor.unchangedRegionBackground": raisedBackground,
    // Copilot's inline edits and its keep/undo highlight are the same event as
    // a diff, so they get the same wash rather than a second visual language.
    "inlineEdit.modifiedBackground": `${success}14`,
    "inlineEdit.modifiedChangedLineBackground": `${success}14`,
    "inlineEdit.modifiedChangedTextBackground": `${success}1F`,
    "inlineEdit.originalBackground": `${error}14`,
    "inlineEdit.originalChangedLineBackground": `${error}14`,
    "inlineEdit.originalChangedTextBackground": `${error}1F`,
    // The suggestion box is delimited by the theme's own structural border;
    // the accent strokes are kept for the one state that earns a stroke, when
    // Tab will accept the edit.
    "inlineEdit.modifiedBorder": structuralBorder,
    "inlineEdit.originalBorder": structuralBorder,
    "inlineEdit.tabWillAcceptModifiedBorder": success,
    "inlineEdit.tabWillAcceptOriginalBorder": error,
    "inlineEdit.gutterIndicator.primaryBackground": primary,
    "inlineEdit.gutterIndicator.primaryForeground": primaryForeground,
    "inlineEdit.gutterIndicator.secondaryBackground": raisedBackground,
    "inlineEdit.gutterIndicator.secondaryForeground": mutedForeground,
    "inlineEdit.gutterIndicator.successfulBackground": success,
    "inlineEdit.gutterIndicator.successfulForeground": successForeground,
    "editorGhostText.foreground": mutedForeground,
    "inlineChatDiff.inserted": `${success}14`,
    "inlineChatDiff.removed": `${error}14`,
    "chat.linesAddedForeground": success,
    "chat.linesRemovedForeground": error,
    "chat.editedFileForeground": warning,
    "gitDecoration.modifiedResourceForeground": warning,
    "gitDecoration.deletedResourceForeground": error,
    "gitDecoration.untrackedResourceForeground": success,
  });

  return colors;
}

function generateQTheme(template, random = Math.random) {
  if (!template || !template.colors) {
    throw new TypeError("A theme template with a colors object is required.");
  }

  const baseHue = randomBetween(random, 0, 360);
  const editorBackground = randomDarkColor(random, baseHue, 0.045, 0.09);
  const activityBackground = randomDarkColor(random, baseHue + 15, 0.07, 0.13);
  const sidebarBackground = randomDarkColor(random, baseHue - 15, 0.085, 0.15);
  const panelBackground = randomDarkColor(random, baseHue + 35, 0.065, 0.125);
  const statusBackground = randomDarkColor(random, baseHue - 35, 0.09, 0.15);
  const widgetBackground = randomDarkColor(random, baseHue + 5, 0.1, 0.16);
  const raisedBackground = randomDarkColor(random, baseHue - 5, 0.115, 0.17);
  const tabActiveBackground = randomDarkColor(random, baseHue + 25, 0.08, 0.14);
  const tabInactiveBackground = randomDarkColor(random, baseHue - 25, 0.055, 0.11);
  const darkSurfaces = [
    editorBackground,
    activityBackground,
    sidebarBackground,
    panelBackground,
    statusBackground,
    widgetBackground,
    raisedBackground,
    tabActiveBackground,
    tabInactiveBackground,
  ];

  const foreground = pickReadableLight(darkSurfaces, random);
  const mutedForeground = pickReadableLight(darkSurfaces, random);
  const primaryPair = pickAccentPair(darkSurfaces, random, baseHue - 55, baseHue + 55);
  const secondaryPair = pickAccentPair(darkSurfaces, random, baseHue + 75, baseHue + 245);
  const errorPair = pickAccentPair(darkSurfaces, random, 0, 25);
  const warningPair = pickAccentPair(darkSurfaces, random, 28, 68);
  const successPair = pickAccentPair(darkSurfaces, random, 92, 165);
  const infoPair = pickAccentPair(darkSurfaces, random, 175, 245);
  const structuralBorder = mixHex(editorBackground, statusBackground, 0.55);

  const primary = primaryPair.background;
  const primaryForeground = primaryPair.foreground;
  const secondary = secondaryPair.background;
  const secondaryForeground = secondaryPair.foreground;
  const error = errorPair.background;
  const warning = warningPair.background;
  const success = successPair.background;
  const info = infoPair.background;
  const selectionForeground = pickReadableForeground(
    [
      alphaComposite(primary, editorBackground, "66"),
      alphaComposite(secondary, editorBackground, "66"),
    ],
    random
  );
  const listHoverForeground = pickReadableForeground(
    [alphaComposite(primary, sidebarBackground, "40")],
    random
  );
  const tabHoverForeground = pickReadableForeground(
    [
      alphaComposite(primary, editorBackground, "40"),
      alphaComposite(primary, tabInactiveBackground, "40"),
    ],
    random
  );
  const modernTabHoverForeground = pickReadableForeground(
    [
      alphaComposite(primary, activityBackground, "40"),
      alphaComposite(primary, sidebarBackground, "40"),
    ],
    random
  );

  const colors = buildWorkbenchColors(template.colors, {
    foreground,
    mutedForeground,
    editorBackground,
    activityBackground,
    sidebarBackground,
    panelBackground,
    statusBackground,
    widgetBackground,
    raisedBackground,
    tabActiveBackground,
    tabInactiveBackground,
    structuralBorder,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
    error,
    errorForeground: errorPair.foreground,
    warning,
    warningForeground: warningPair.foreground,
    success,
    successForeground: successPair.foreground,
    info,
    infoForeground: infoPair.foreground,
    selectionForeground,
    listHoverForeground,
    tabHoverForeground,
    modernTabHoverForeground,
  });

  const syntaxBackgrounds = [
    editorBackground,
    alphaComposite(secondary, editorBackground, "20"),
    alphaComposite(raisedBackground, editorBackground, "80"),
  ];
  const syntaxPalette = generateSyntaxPalette(syntaxBackgrounds, baseHue, random);
  const tokenColors = generateTokenColors(template, syntaxPalette);
  const semanticTokenColors = generateSemanticTokenColors(template, syntaxPalette);
  const minimumContrast = minimumContrastForColors(
    tokenColors,
    semanticTokenColors,
    editorBackground,
    syntaxBackgrounds.slice(1),
    [
      [foreground, editorBackground],
      [mutedForeground, editorBackground],
      [primary, activityBackground],
      [primary, sidebarBackground],
      [primary, panelBackground],
      [primary, editorBackground],
      [secondary, widgetBackground],
      [primaryForeground, primary],
      [secondaryForeground, secondary],
      [selectionForeground, alphaComposite(primary, editorBackground, "66")],
      [selectionForeground, alphaComposite(secondary, editorBackground, "66")],
      [listHoverForeground, alphaComposite(primary, sidebarBackground, "40")],
      [tabHoverForeground, alphaComposite(primary, editorBackground, "40")],
      [tabHoverForeground, alphaComposite(primary, tabInactiveBackground, "40")],
      [modernTabHoverForeground, alphaComposite(primary, activityBackground, "40")],
      [modernTabHoverForeground, alphaComposite(primary, sidebarBackground, "40")],
      [errorPair.foreground, error],
      [warningPair.foreground, warning],
      [successPair.foreground, success],
      [infoPair.foreground, info],
      [DEBUGGING_STATUS_FOREGROUND, DEBUGGING_STATUS_BACKGROUND],
    ]
  );

  if (minimumContrast < MIN_TEXT_CONTRAST) {
    throw new Error(`Generated theme failed its contrast check: ${minimumContrast.toFixed(2)}:1.`);
  }

  return {
    colors,
    tokenColors,
    semanticTokenColors,
    primary,
    primaryForeground,
    minimumContrast,
  };
}

module.exports = {
  DEBUGGING_STATUS_BACKGROUND,
  DEBUGGING_STATUS_FOREGROUND,
  MIN_TEXT_CONTRAST,
  alphaComposite,
  buildWorkbenchColors,
  contrastRatio,
  generateQTheme,
  mixHex,
  syntaxRoleForSemanticToken,
  syntaxRoleForToken,
  withAlpha,
  hslToHex,
  relativeLuminance,
};
