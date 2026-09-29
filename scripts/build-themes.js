#!/usr/bin/env node
// Builds the fixed themes from curated palettes: the film themes from Deckard's
// webview themes (~/projects/deckard/src/ui/webview/themes.ts, with the base
// palette in components.ts), the two Bluey themes from colors sampled out of
// the Heeler family artwork, and Helix from a 2020 Sublime Text theme.
//
// Deckard's palettes were regraded in September 2026 around its contrast
// suite: the fully saturated cyans and greens that bloomed around thin text
// on near-black were softened a step with their hues kept, and Fellowship's
// inks were deepened so they read on its parchment. The film themes follow
// those values, so the editor and Deckard's pages agree on what a color is. Every color
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
  composeThemes,
  contrastRatio,
  mixHex,
  passes,
  readable,
  syntaxRoleForSemanticToken,
  syntaxRoleForToken,
  toHsl,
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
    // Los Angeles, November 2019 — but the pyramid, not the street.
    //
    // Clustering the palettes of 46 analyzed frames splits the film into five
    // looks. The theme used to take the darkest of them, the night exteriors
    // and searchlights, and ran the window's violet (#8B5682 orchid, #341B39
    // violet) underneath as a cast on comments, punctuation and library calls.
    // That cast reached too far: nine of fourteen roles landed in the purple
    // and pink family, strings loudest among them, and a file read as signage
    // end to end.
    //
    // So this is Tyrell's office at golden hour instead. Gold (#FFB000) leads
    // and carries the keywords, the ground warms to match it, bone (#D6D2C6)
    // carries the prose, and the searchlight cyan (#4FC7DC) is the
    // counterweight rather than the subject. Sea glass off the window glass
    // (#9FD0C4) takes the strings, coral off Zhora's coat (#E86A4E) takes the
    // numbers, and nothing in the editor is purple.
    name: "Replicant",
    type: "dark",
    // The workbench is Deckard's: the same cool near-black ground, and the
    // accents as Deckard now grades them, with the cyan, green and red
    // softened a step. The editor's syntax is measured off the film instead.
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
    secondary: "#3ED4E8",
    error: "#E05232",
    warning: "#FF5500",
    success: "#66E066",
    info: "#3ED4E8",
    syntax: {
      // Bone, warmed to the room.
      text: "#D6D2C6",
      comment: "#6E6757",
      // The gold is the signage here.
      keyword: "#FFB000",
      operator: "#98917F",
      // Sea glass, cool against the gold.
      string: "#9FD0C4",
      // Zhora's coat under the neon.
      number: "#E86A4E",
      constant: "#F0C97A",
      variable: "#D6D2C6",
      property: "#C4BCA6",
      // The searchlight, reduced to a supporting part.
      function: "#4FC7DC",
      libraryFunction: "#95B6C0",
      type: "#38D3C5",
      markup: "#FFB000",
      decorator: "#D08B5E",
      // Blood on Roy Batty's hand.
      invalid: "#FF5A4A",
    },
    // Headings step from the gold down to the bone, so an outline reads as one
    // ladder rather than as a second palette.
    markdown: {
      heading1: "#FFB000",
      heading2: "#EFC16A",
      heading3: "#D6C49B",
      headingDeep: "#B4AD9A",
      list: "#E86A4E",
      link: "#4FC7DC",
      linkText: "#9FD0C4",
      code: "#9FD0C4",
      quote: "#8F8876",
    },
    // A tag, its attributes and its punctuation would otherwise be three
    // shades of the same blue, so attributes take the drained steel.
    tokenOverrides: {
      "Attribute names": "#95B6C0",
    },
    // The violet cast reached nine of fourteen roles before 0.6.0, and a
    // palette is easier to keep honest with the constraint written down than
    // by eye. Nothing in the syntax may land between these hues.
    forbiddenSyntaxHues: [[250, 345]],
    // The film is graded dark, and a palette that clears 4.5:1 everywhere
    // cannot be. The floor is set just under the comment color so the palette
    // ships as chosen rather than nudged, and no lower, so the build still
    // catches a hue that drifts. Syntax only — every workbench pair meets AA.
    syntaxContrast: 2.9,
  },
  {
    // The film's light table: steel frames, cyan readouts, orange for alerts.
    name: "Oblivion",
    type: "dark",
    surfaces: {
      editor: "#04080B",
      activity: "#04080B",
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
    // Neon grid: cyan and hot pink over violet night. The neon is a step
    // below full saturation, as Deckard grades it, so it does not bloom.
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
    primary: "#3FD8EA",
    secondary: "#F25AA9",
    error: "#F2559E",
    warning: "#FF8B55",
    success: "#7CE3EC",
    info: "#8F75FF",
    // Hand-tuned after the generated mapping: the activity bar sits on the
    // raised surface with pink icons, and a few token roles were reassigned.
    colorOverrides: {
      "activityBar.background": "#211748",
      "activityBar.foreground": "#F2559E",
      "list.activeSelectionForeground": "#33295E",
      "modernTab.activeForeground": "#211748",
    },
    tokenOverrides: {
      "Numbers and constants": "#FF647E",
      Variables: "#FF8B55",
      "Object properties": "#8F75FF",
      Decorators: "#3FD8EA",
    },
    semanticOverrides: {
      number: "#FF647E",
      variable: "#FF8B55",
      property: "#8F75FF",
      member: "#8F75FF",
      "property.readonly": "#8F75FF",
      decorator: "#3FD8EA",
    },
    syntax: {
      text: "#E7E8FF",
      comment: "#8E8BB3",
      keyword: "#F25AA9",
      operator: "#7CE6F0",
      string: "#FF8B55",
      number: "#8F75FF",
      constant: mixHex("#FF8B55", "#F25AA9", 0.5),
      variable: "#E7E8FF",
      property: mixHex("#E7E8FF", "#7CE6F0", 0.3),
      function: "#3FD8EA",
      libraryFunction: mixHex("#3FD8EA", "#E7E8FF", 0.5),
      type: mixHex("#8F75FF", "#E7E8FF", 0.35),
      markup: "#7CE6F0",
      decorator: "#F25AA9",
      invalid: "#F2559E",
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
    primary: "#6FD96C",
    secondary: "#D89D31",
    error: "#E24B26",
    warning: "#F0BF47",
    success: "#8CE87C",
    info: "#8CE87C",
    syntax: {
      text: "#CCFA7B",
      comment: mixHex("#278A31", "#82AA51", 0.4),
      keyword: "#8CE87C",
      operator: mixHex("#82AA51", "#CCFA7B", 0.4),
      string: "#F0BF47",
      number: "#D89D31",
      constant: mixHex("#D89D31", "#E24B26", 0.4),
      variable: "#CCFA7B",
      property: mixHex("#CCFA7B", "#82AA51", 0.3),
      function: mixHex("#8CE87C", "#CCFA7B", 0.5),
      libraryFunction: mixHex("#F0BF47", "#CCFA7B", 0.5),
      type: "#6FD96C",
      markup: "#F0BF47",
      decorator: "#D89D31",
      invalid: "#E24B26",
    },
  },
  {
    // Parchment and ink: olive greens and aged gold on a light page. The inks
    // are the deeper ones Deckard moved to when its contrast suite found the
    // originals could not carry text on the parchment.
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
      // Deckard's hairline, --line. Its --panel-deep, which the border used
      // to borrow, is the control ground now and no longer a line color.
      border: "#9C9A5C",
    },
    foreground: "#29341D",
    muted: "#545C3C",
    primary: "#4A6A32",
    secondary: "#664317",
    error: "#9A4530",
    warning: "#664317",
    success: "#4A6A32",
    info: "#354A1F",
    syntax: {
      text: "#29341D",
      comment: "#545C3C",
      keyword: "#354A1F",
      operator: mixHex("#7D8750", "#29341D", 0.3),
      string: "#664317",
      number: "#9A4530",
      constant: "#6F542A",
      variable: "#29341D",
      property: "#3D4D28",
      function: "#C28A32",
      libraryFunction: "#6F542A",
      type: mixHex("#4A6A32", "#6F542A", 0.5),
      markup: "#354A1F",
      decorator: "#9A4530",
      invalid: "#9A4530",
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
  // Helix: the Sublime Text theme David wrote in 2020, carried over into VS
  // Code and lived in for years. The syntax colors are the tmTheme's own:
  // steel blue (#448AA9) for anything that holds a value, dusty rose (#AF8787)
  // for keywords and library calls, slate (#748096) for types and tags, orange
  // (#FF8147) for strings, lavender (#BD93F9) for functions and the explorer,
  // and a warm grey (#A2A797) for brackets and markdown punctuation. The
  // workbench is Replicant's: the same cool near-black ground, so the two
  // themes sit side by side, with the orange carrying the chrome where
  // Replicant's gold does. The greys the tmTheme kept near-invisible
  // (comments at 2.3:1) are the only colors the build has to lift far.
  {
    name: "Helix",
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
    foreground: "#E3EDFF",
    // The inactive tab text.
    muted: "#6272A4",
    // The string orange, on the activity bar, tab strokes and selections.
    primary: "#FF8147",
    // The lavender of the explorer and the function names.
    secondary: "#BD93F9",
    // GitGutter's deleted mark.
    error: "#E61F44",
    // GitGutter's changed mark.
    warning: "#F7B83D",
    // The diff's inserted green.
    success: "#A6E22E",
    info: "#448AA9",
    syntax: {
      text: "#E3EDFF",
      comment: "#4E4E4E",
      keyword: "#AF8787",
      operator: "#A2A797",
      string: "#FF8147",
      number: "#448AA9",
      constant: "#448AA9",
      variable: "#448AA9",
      property: "#E3EDFF",
      function: "#BD93F9",
      libraryFunction: "#AF8787",
      type: "#748096",
      markup: "#748096",
      // The tmTheme's own foreground, which nothing in VS Code ever reached.
      decorator: "#D7875F",
      invalid: "#E61F44",
    },
    // The tmTheme kept its markdown quiet: emphasis, links and their
    // punctuation all in the bracket grey, inline code in mint.
    markdown: {
      bold: "#A2A797",
      italic: "#A2A797",
      link: "#A2A797",
      linkText: "#A2A797",
      code: "#A5E3D0",
    },
    // The tmTheme split `storage` (blue) from `storage.type` (red) and gave
    // HTML attributes the value blue; the shared matcher folds those into
    // keyword and property. These are the tmTheme colors lifted to the same
    // floor the build applies to everything else.
    tokenOverrides: {
      Storage: "#4591B2",
      "Storage modifiers": "#4591B2",
      "PHP visibility and storage modifiers": "#4591B2",
      "Storage types": "#CC6868",
      "PHP function declarations": "#CC6868",
      "TypeScript class keywords": "#CC6868",
      "Attribute names": "#4591B2",
      "Library constants and variables": "#80E045",
    },
    // The explorer read in lavender.
    colorOverrides: {
      "sideBar.foreground": "#BD93F9",
    },
  },
];

// Markdown is a first-class grammar here: prose has as many roles as code, and
// the shared matcher cannot tell a heading from a list marker from a link, so
// every markdown rule in the template names its role outright.
const MARKDOWN_TOKEN_ROLES = {
  "Markdown heading 1": "heading1",
  "Markdown heading 2": "heading2",
  "Markdown heading 3": "heading3",
  "Markdown deep headings": "headingDeep",
  "Markdown heading markers": "headingMarker",
  "Markdown bold": "bold",
  "Markdown italic": "italic",
  "Markdown strikethrough": "strikethrough",
  "Markdown emphasis markers": "punctuation",
  "Markdown block quotes": "quote",
  "Markdown block quote markers": "punctuation",
  "Markdown list markers": "list",
  "Markdown link text": "linkText",
  "Markdown link destinations": "link",
  "Markdown link references": "linkRef",
  "Markdown link punctuation": "punctuation",
  "Markdown inline code": "code",
  "Markdown fenced code": "code",
  "Markdown code fence markers": "punctuation",
  "Markdown code fence language": "codeLanguage",
  "Markdown separators": "separator",
  "Markdown table punctuation": "separator",
  "Markdown frontmatter delimiters": "separator",
};

/**
 * Markdown roles derived from the theme's code roles, so a palette that never
 * mentions markdown still gets a coherent document. Headings walk from the
 * theme's markup accent toward its body text, which gives the ladder without
 * asking a palette for six more colors. A theme states `markdown` only where it
 * wants to disagree.
 */
function markdownPalette(syntax) {
  return {
    heading1: syntax.markup,
    heading2: mixHex(syntax.markup, syntax.text, 0.25),
    heading3: mixHex(syntax.markup, syntax.text, 0.5),
    headingDeep: mixHex(syntax.markup, syntax.text, 0.7),
    headingMarker: syntax.operator,
    bold: syntax.text,
    italic: syntax.text,
    strikethrough: syntax.comment,
    quote: mixHex(syntax.comment, syntax.text, 0.35),
    list: syntax.keyword,
    link: syntax.type,
    linkText: syntax.string,
    linkRef: syntax.constant,
    code: syntax.string,
    codeLanguage: syntax.type,
    punctuation: syntax.operator,
    separator: syntax.operator,
  };
}

// The shared role matcher reads "type-parameter" as a parameter; types keep the type role here.
const TOKEN_ROLE_OVERRIDES = {
  Types: "type",
  ...Object.fromEntries(
    Object.entries(MARKDOWN_TOKEN_ROLES).map(([name, role]) => [name, `markdown.${role}`])
  ),
};
const SEMANTIC_ROLE_OVERRIDES = { typeParameter: "type" };

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
  // Success is the one accent without a pair: it is a text color everywhere
  // else, and only the inline-edit gutter badge ever fills with it.
  const successForeground = pickForeground([success], onAccent);

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
    successForeground,
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
    // Real code sits on the diff and inline-edit washes, so they count as
    // backgrounds the syntax has to read on. The changed-text tint is the
    // heaviest of them; clearing it clears the line tint too.
    alphaComposite(success, s.editor, "1F"),
    alphaComposite(errorPair.background, s.editor, "1F"),
  ];
  // A theme may state a lower floor for its syntax colors; the workbench roles
  // below are held to AA regardless.
  const syntaxFloor = spec.syntaxContrast ?? MIN_TEXT_CONTRAST;
  const syntax = Object.fromEntries(
    Object.entries(spec.syntax).map(([role, color]) => [
      role,
      readable(color, syntaxBackgrounds, foreground, syntaxFloor),
    ])
  );
  const markdown = { ...markdownPalette(spec.syntax), ...(spec.markdown ?? {}) };
  for (const [role, color] of Object.entries(markdown)) {
    if (!(role in markdownPalette(spec.syntax))) {
      throw new Error(`${spec.name} sets unknown markdown role "${role}".`);
    }
    syntax[`markdown.${role}`] = readable(color, syntaxBackgrounds, foreground, syntaxFloor);
  }

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

  const syntaxPairs = [
    ...tokenColors.map(rule => [rule.settings.foreground, s.editor]),
    ...Object.values(semanticTokenColors).map(color => [color, s.editor]),
  ];
  const pairs = [
    ...rolePairs
      .filter(([fg, bg]) => colors[fg] && colors[bg])
      .map(([fg, bg]) => [colors[fg], colors[bg]]),
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
  // Saturation gates the test: a near-grey carries no hue worth ruling out.
  const strayed = Object.entries(syntax).flatMap(([role, color]) => {
    const { hue, saturation } = toHsl(color);
    const degrees = ((hue % 360) + 360) % 360;
    return saturation > 0.12 &&
      (spec.forbiddenSyntaxHues ?? []).some(([low, high]) => degrees >= low && degrees <= high)
      ? [`${role} ${color} (hue ${Math.round(degrees)})`]
      : [];
  });
  if (strayed.length > 0) {
    throw new Error(
      `${spec.name} puts syntax in a hue band it rules out: ${strayed.join(", ")}`
    );
  }

  const failures = [
    ...pairs
      .filter(([fg, bg]) => contrastRatio(fg, bg) < MIN_TEXT_CONTRAST)
      .map(pair => [...pair, MIN_TEXT_CONTRAST]),
    ...syntaxPairs
      .filter(([fg, bg]) => contrastRatio(fg, bg) < syntaxFloor)
      .map(pair => [...pair, syntaxFloor]),
  ];
  if (failures.length > 0) {
    throw new Error(
      `${spec.name} misses its floor on ${failures
        .map(([fg, bg, floor]) => `${fg}/${bg} (${contrastRatio(fg, bg).toFixed(2)}, needs ${floor})`)
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

const built = {};
for (const spec of THEMES) {
  const theme = buildTheme(spec);
  built[spec.name] = theme;
  const file = path.join(ROOT, "themes", `${spec.name.replace(/\s+/g, "-")}-color-theme.json`);
  fs.writeFileSync(file, `${JSON.stringify(theme, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, file)}`);
}

// Mix ships as Helix's workbench around LCARS's syntax; the extension's Mix
// Themes command replaces it at runtime with whatever pair is chosen.
const mix = composeThemes(built.Helix, TEMPLATE, "Mix");
const mixFile = path.join(ROOT, "themes", "Mix-color-theme.json");
fs.writeFileSync(mixFile, `${JSON.stringify(mix, null, 2)}\n`);
console.log(`wrote ${path.relative(ROOT, mixFile)}`);
