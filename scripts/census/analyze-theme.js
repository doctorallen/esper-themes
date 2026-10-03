"use strict";
// Measures a VS Code color theme the way the theme census does: resolves a
// fixed set of syntax roles through the theme's TextMate and semantic rules,
// and reports WCAG contrast, OKLCH hue, lightness and chroma, collisions
// between roles (for typical vision and for red-green color blindness), and
// the workbench surfaces around the editor. The popular themes in the census
// snapshot were measured with the same definitions.

// Representative scope stacks: one real TypeScript, HTML, CSS, Markdown or diff
// token per role, as its grammar emits it.
const ROLES = [["comment", "Comment", "Text", ["source.ts", "comment.line.double-slash.ts"]], ["keyword", "Control keyword", "Keywords", ["source.ts", "keyword.control.flow.ts"]], ["import", "Import keyword", "Keywords", ["source.ts", "meta.import.ts", "keyword.control.import.ts"]], ["storage", "Declaration (const, function)", "Keywords", ["source.ts", "storage.type.ts"]], ["modifier", "Modifier (async, export)", "Keywords", ["source.ts", "storage.modifier.async.ts"]], ["operator", "Operator", "Keywords", ["source.ts", "keyword.operator.assignment.ts"]], ["string", "String", "Literals", ["source.ts", "string.quoted.double.ts"]], ["escape", "String escape", "Literals", ["source.ts", "string.quoted.double.ts", "constant.character.escape.ts"]], ["regex", "Regex", "Literals", ["source.ts", "string.regexp.ts"]], ["number", "Number", "Literals", ["source.ts", "constant.numeric.decimal.ts"]], ["boolean", "true / null", "Literals", ["source.ts", "constant.language.boolean.true.ts"]], ["function", "Function declaration", "Names", ["source.ts", "meta.function.ts", "meta.definition.function.ts", "entity.name.function.ts"]], ["call", "Function call", "Names", ["source.ts", "meta.function-call.ts", "entity.name.function.ts"]], ["method", "Built-in function", "Names", ["source.ts", "meta.function-call.ts", "support.function.console.ts"]], ["class", "Class name", "Names", ["source.ts", "meta.class.ts", "entity.name.type.class.ts"]], ["type", "Type annotation", "Names", ["source.ts", "meta.type.annotation.ts", "entity.name.type.ts"]], ["primitive", "Primitive type", "Names", ["source.ts", "meta.type.annotation.ts", "support.type.primitive.ts"]], ["variable", "Variable", "Names", ["source.ts", "variable.other.readwrite.ts"]], ["constant", "Constant", "Names", ["source.ts", "meta.var.expr.ts", "meta.var-single-variable.expr.ts", "meta.definition.variable.ts", "variable.other.constant.ts"]], ["parameter", "Parameter", "Names", ["source.ts", "meta.function.ts", "meta.parameters.ts", "variable.parameter.ts"]], ["property", "Property access", "Names", ["source.ts", "meta.function-call.ts", "variable.other.property.ts"]], ["objkey", "Object key", "Names", ["source.ts", "meta.objectliteral.ts", "meta.object.member.ts", "meta.object-literal.key.ts"]], ["this", "this / self", "Names", ["source.ts", "variable.language.this.ts"]], ["punct", "Punctuation", "Text", ["source.ts", "punctuation.separator.comma.ts"]], ["tag", "HTML tag", "Markup", ["text.html.basic", "meta.tag.structure.div.start.html", "entity.name.tag.html"]], ["attr", "HTML attribute", "Markup", ["text.html.basic", "meta.tag.structure.div.start.html", "meta.attribute.class.html", "entity.other.attribute-name.html"]], ["cssprop", "CSS property", "Markup", ["source.css", "meta.property-list.css", "meta.property-name.css", "support.type.property-name.css"]], ["heading", "Markdown heading", "Markup", ["text.html.markdown", "markup.heading.markdown", "heading.1.markdown", "entity.name.section.markdown"]], ["attrValue", "HTML attribute value", "Markup", ["text.html.basic", "meta.tag.structure.a.start.html", "meta.attribute.href.html", "string.quoted.double.html"]], ["tagPunct", "Tag punctuation", "Markup", ["text.html.basic", "meta.tag.structure.a.start.html", "punctuation.definition.tag.begin.html"]], ["inserted", "Diff inserted", "Diff", ["source.diff", "markup.inserted.diff"]], ["deleted", "Diff deleted", "Diff", ["source.diff", "markup.deleted.diff"]], ["diffHeader", "Diff hunk header", "Diff", ["source.diff", "meta.diff.range.unified"]], ["link", "Markdown link", "Markup", ["text.html.markdown", "meta.link.inline.markdown", "markup.underline.link.markdown"]]];
// Role -> semantic token type and modifiers, as TypeScript's provider emits them.
const SEMANTIC = {"variable": ["variable", []], "constant": ["variable", ["declaration", "readonly"]], "parameter": ["parameter", ["declaration"]], "property": ["property", []], "objkey": ["property", ["declaration"]], "function": ["function", ["declaration"]], "call": ["function", []], "method": ["method", ["defaultLibrary"]], "class": ["class", ["declaration"]], "type": ["type", []]};
const WB_KEYS = {"editor": "editor.background", "fg": "editor.foreground", "sidebar": "sideBar.background", "activity": "activityBar.background", "status": "statusBar.background", "statusFg": "statusBar.foreground", "title": "titleBar.activeBackground", "titleFg": "titleBar.activeForeground", "panel": "panel.background", "tabActive": "tab.activeBackground", "tabInactive": "tab.inactiveBackground", "tabsBar": "editorGroupHeader.tabsBackground", "terminal": "terminal.background", "widget": "editorWidget.background", "input": "input.background", "focus": "focusBorder", "button": "button.background", "badge": "badge.background", "activityFg": "activityBar.foreground", "activityBadge": "activityBarBadge.background", "tabBorderTop": "tab.activeBorderTop", "tabBorder": "tab.activeBorder", "selection": "editor.selectionBackground", "lineHighlight": "editor.lineHighlightBackground", "lineNo": "editorLineNumber.foreground", "lineNoActive": "editorLineNumber.activeForeground", "cursor": "editorCursor.foreground", "listActive": "list.activeSelectionBackground", "findMatch": "editor.findMatchBackground", "indent": "editorIndentGuide.background1", "indentActive": "editorIndentGuide.activeBackground1", "whitespace": "editorWhitespace.foreground", "sidebarFg": "sideBar.foreground", "error": "editorError.foreground", "warning": "editorWarning.foreground", "info": "editorInfo.foreground", "gitAdded": "gitDecoration.addedResourceForeground", "gitModified": "gitDecoration.modifiedResourceForeground", "gitDeleted": "gitDecoration.deletedResourceForeground", "gitUntracked": "gitDecoration.untrackedResourceForeground", "diffInserted": "diffEditor.insertedTextBackground", "diffRemoved": "diffEditor.removedTextBackground", "sideBarBorder": "sideBar.border", "editorGroupBorder": "editorGroup.border", "statusBorder": "statusBar.border", "activityBorder": "activityBar.border", "panelBorder": "panel.border", "titleBorder": "titleBar.border", "tabsBorder": "editorGroupHeader.tabsBorder", "contrastBorder": "contrastBorder", "debugStatus": "statusBar.debuggingBackground", "findMatchHighlight": "editor.findMatchHighlightBackground", "listHighlight": "list.highlightForeground", "gutterModified": "editorGutter.modifiedBackground", "gutterAdded": "editorGutter.addedBackground", "surfaceBg": "surface.background", "surfaceBorder": "surface.border", "editorBorder": "editor.border", "mTabBg": "modernTab.activeBackground", "mTabFg": "modernTab.activeForeground", "mEdTabBg": "modernEditorTab.activeBackground", "mEdTabFg": "modernEditorTab.activeForeground", "mEdTabInactiveBg": "modernEditorTab.inactiveBackground", "tabInactiveFg": "tab.inactiveForeground", "mActBg": "modernActivityBar.background", "mActItemBg": "modernActivityBarItem.activeBackground", "mActItemFg": "modernActivityBarItem.activeForeground", "actInactiveFg": "activityBar.inactiveForeground", "actActiveBg": "activityBar.activeBackground"};
// VS Code's own values for the keys above when a theme leaves them unset.
const DEFAULTS = {"dark": {"editor.background": "#1E1E1E", "editor.foreground": "#D4D4D4", "sideBar.background": "#252526", "activityBar.background": "#333333", "statusBar.background": "#007ACC", "statusBar.foreground": "#FFFFFF", "titleBar.activeBackground": "#3C3C3C", "tab.inactiveBackground": "#2D2D2D", "editorGroupHeader.tabsBackground": "#252526", "editorLineNumber.foreground": "#858585", "editor.selectionBackground": "#264F78", "editorError.foreground": "#F14C4C", "editorWarning.foreground": "#CCA700", "editorInfo.foreground": "#3794FF", "focusBorder": "#007FD4", "button.background": "#0E639C", "badge.background": "#4D4D4D", "activityBar.foreground": "#FFFFFF", "editor.findMatchHighlightBackground": "#EA5C0055", "list.highlightForeground": "#2AAAFF", "editorGutter.modifiedBackground": "#1B81A8", "editorGutter.addedBackground": "#487E02"}, "light": {"editor.background": "#FFFFFF", "editor.foreground": "#000000", "sideBar.background": "#F3F3F3", "activityBar.background": "#2C2C2C", "statusBar.background": "#007ACC", "statusBar.foreground": "#FFFFFF", "titleBar.activeBackground": "#DDDDDD", "tab.inactiveBackground": "#ECECEC", "editorGroupHeader.tabsBackground": "#F3F3F3", "editorLineNumber.foreground": "#237893", "editor.selectionBackground": "#ADD6FF", "editorError.foreground": "#E51400", "editorWarning.foreground": "#BF8803", "editorInfo.foreground": "#1A85FF", "focusBorder": "#0090F1", "button.background": "#007ACC", "badge.background": "#C4C4C4", "activityBar.foreground": "#FFFFFF", "editor.findMatchHighlightBackground": "#EA5C0055", "list.highlightForeground": "#0066BF", "editorGutter.modifiedBackground": "#2090D3", "editorGutter.addedBackground": "#48985D"}};
// OKLCH hue families by starting angle; under 0.035 chroma a color is neutral.
const FAMILIES = [[0, "pink"], [12, "red"], [40, "orange"], [70, "yellow"], [105, "lime"], [125, "green"], [165, "teal"], [195, "cyan"], [230, "blue"], [275, "violet"], [305, "purple"], [340, "pink"]];
// Scopes outside TypeScript, for grammar coverage.
const EXTRA_SCOPES = {"JSON key": ["source.json", "meta.structure.dictionary.json", "support.type.property-name.json"], "YAML key": ["source.yaml", "entity.name.tag.yaml"], "Markdown bold": ["text.html.markdown", "markup.bold.markdown"], "Markdown italic": ["text.html.markdown", "markup.italic.markdown"], "Markdown code": ["text.html.markdown", "markup.inline.raw.string.markdown"], "Diff inserted": ["source.diff", "markup.inserted.diff"], "Diff deleted": ["source.diff", "markup.deleted.diff"], "Python decorator": ["source.python", "meta.function.decorator.python", "entity.name.function.decorator.python"], "Python self": ["source.python", "variable.parameter.function.language.special.self.python"], "CSS selector class": ["source.css", "meta.selector.css", "entity.other.attribute-name.class.css"], "CSS value": ["source.css", "meta.property-value.css", "support.constant.property-value.css"], "Shell variable": ["source.shell", "variable.other.normal.shell"], "Go package": ["source.go", "entity.name.import.go"], "Rust macro": ["source.rust", "entity.name.function.macro.rust"], "SQL keyword": ["source.sql", "keyword.other.DML.sql"], "Template expr": ["source.ts", "string.template.ts", "meta.template.expression.ts", "punctuation.definition.template-expression.begin.ts"]};

const CORE_ROLES = ["comment", "keyword", "storage", "string", "number", "function", "class", "type", "variable", "parameter", "property", "operator", "tag", "attr"];
const CVD_ROLES = ["comment", "keyword", "storage", "string", "number", "function", "type", "variable", "property", "operator", "tag", "attr", "escape", "regex"];
const ANSI = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];
// Machado, Oliveira and Fernandes (2009), full severity, in linear RGB.
const CVD = {
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};

const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;

function parseHex(value) {
  if (typeof value !== "string") return null;
  let h = value.trim().replace(/^#/, "");
  if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join("");
  if (!(h.length === 6 || h.length === 8) || !/^[0-9a-f]+$/i.test(h)) return null;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return [r, g, b, h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
}
const toHex = rgb => "#" + rgb.slice(0, 3).map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0").toUpperCase()).join("");
const blend = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const linear = c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = rgb => 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function oklch(rgb) {
  const [r, g, b] = rgb.slice(0, 3).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [round(L, 4), round(Math.hypot(A, B), 4), round(((Math.atan2(B, A) * 180) / Math.PI + 360) % 360, 1)];
}
function family(L, C, H) {
  if (C < 0.035) return "neutral";
  let name = "pink";
  for (const [start, label] of FAMILIES) if (H >= start) name = label;
  return name;
}
function oklab(hex) {
  const [L, C, H] = oklch(parseHex(hex));
  const rad = (H * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}
const distance = (a, b) => { const [x, y] = [oklab(a), oklab(b)]; return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100; };
function simulate(hex, kind) {
  const lin = parseHex(hex).slice(0, 3).map(linear);
  return toHex(CVD[kind].map(row => {
    const c = Math.max(0, Math.min(1, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
    return (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
  }));
}

// ---- TextMate scope matching, as VS Code ranks selectors ----
function selectorParts(selector) {
  const sel = selector.trim();
  if (!sel || sel.startsWith("-")) return null;
  return sel.split(" - ")[0].trim().split(/\s+/).filter(part => part !== ">");
}
const prefixMatch = (sel, scope) => scope === sel || scope.startsWith(sel + ".");
function matchSelector(parts, stack) {
  const last = parts[parts.length - 1];
  for (let depth = stack.length - 1; depth >= 0; depth -= 1) {
    if (!prefixMatch(last, stack[depth])) continue;
    let j = depth - 1;
    let ok = true;
    for (const part of parts.slice(0, -1).reverse()) {
      while (j >= 0 && !prefixMatch(part, stack[j])) j -= 1;
      if (j < 0) { ok = false; break; }
      j -= 1;
    }
    if (ok) return [depth, last.split(".").length, parts.length];
  }
  return null;
}
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
function resolve(rules, stack) {
  const best = {};
  for (const rule of rules) {
    const settings = rule.settings || {};
    let scopes = rule.scope;
    if (scopes == null) continue;
    if (typeof scopes === "string") scopes = scopes.split(",");
    for (const selector of scopes) {
      const parts = selectorParts(selector);
      if (!parts) continue;
      const score = matchSelector(parts, stack);
      if (!score) continue;
      for (const key of ["foreground", "fontStyle"]) {
        if (settings[key] == null) continue;
        // A later rule wins a tie, as in VS Code.
        if (!best[key] || compare(score, best[key][0]) >= 0) best[key] = [score, settings[key], selector.trim()];
      }
    }
  }
  return {
    result: Object.fromEntries(Object.entries(best).map(([key, value]) => [key, value[1]])),
    selector: best.foreground ? best.foreground[2] : null,
  };
}
function resolveSemantic(rules, type, modifiers, language = "typescript") {
  let best = null;
  for (const [selector, value] of Object.entries(rules)) {
    const [base, lang = ""] = selector.split(":");
    if (lang && lang !== language) continue;
    const [kind, ...mods] = base.split(".");
    if (kind !== "*" && kind !== type) continue;
    if (mods.some(mod => !modifiers.includes(mod))) continue;
    const score = (kind !== "*") * 100 + mods.length * 10 + (lang ? 1 : 0);
    if (!best || score > best[0]) best = [score, selector, value];
  }
  return best ? [best[1], best[2]] : null;
}

/**
 * Measures one theme. `uiTheme` is the manifest's value ("vs", "vs-dark", …),
 * which picks the defaults VS Code would fill unset keys with.
 */
function analyzeTheme(theme, uiTheme, meta = {}) {
  const colors = Object.fromEntries(Object.entries(theme.colors || {}).filter(([, v]) => typeof v === "string"));
  const rules = (theme.tokenColors || []).filter(rule => rule && typeof rule === "object");
  const defaults = uiTheme === "vs" || uiTheme === "hc-light" ? DEFAULTS.light : DEFAULTS.dark;
  let bg = parseHex(colors["editor.background"] || defaults["editor.background"]);
  if (bg[3] < 1) bg = blend(bg, [0, 0, 0, 1]);
  let fgRaw = colors["editor.foreground"];
  if (!fgRaw) fgRaw = (rules.find(rule => !rule.scope && rule.settings && rule.settings.foreground) || {}).settings?.foreground;
  const fg = blend(parseHex(fgRaw || defaults["editor.foreground"]), bg);
  const bgL = oklch(bg)[0];

  const describe = value => {
    const p = parseHex(value);
    if (!p) return null;
    const solid = blend(p, bg);
    const [L, C, H] = oklch(solid);
    return { hex: toHex(solid), raw: value.toUpperCase(), alpha: round(p[3], 3), cr: round(contrast(solid, bg), 2), L, C, H, fam: family(L, C, H) };
  };

  const wb = {};
  for (const [name, key] of Object.entries(WB_KEYS)) {
    let d = colors[key] ? describe(colors[key]) : null;
    if (!d && defaults[key] && name !== "selection") {
      d = describe(defaults[key]);
      if (d) d.default = true;
    }
    if (d) d.key = key;
    wb[name] = d;
  }
  const surfaces = {};
  for (const name of ["sidebar", "activity", "status", "title", "panel", "tabsBar", "tabActive", "tabInactive", "widget", "terminal"]) {
    if (wb[name]) surfaces[name] = { dL: round(wb[name].L - bgL, 4), same: wb[name].hex === toHex(bg), C: wb[name].C };
  }

  const semanticOn = theme.semanticHighlighting === true;
  const semanticRules = theme.semanticTokenColors || {};
  const roles = {};
  for (const [key, , , stack] of ROLES) {
    const resolved = resolve(rules, stack);
    const res = resolved.result;
    let selector = resolved.selector;
    if (semanticOn && SEMANTIC[key]) {
      const hit = resolveSemantic(semanticRules, ...SEMANTIC[key]);
      if (hit) {
        let [semSelector, value] = hit;
        if (typeof value === "string") value = { foreground: value };
        if (value.foreground) { res.foreground = value.foreground; selector = "semantic: " + semSelector; }
        let fontStyle = value.fontStyle;
        if (fontStyle == null) fontStyle = ["italic", "bold", "underline"].filter(w => value[w]).join(" ") || null;
        if (fontStyle != null) res.fontStyle = fontStyle;
      }
    }
    let d = res.foreground ? describe(res.foreground) : null;
    if (!d) { d = describe(toHex(fg)); d.unstyled = true; }
    d.font = String(res.fontStyle || "").trim();
    d.sel = selector;
    roles[key] = d;
  }

  const tokenColors = new Map();
  const font = {};
  for (const rule of rules) {
    const settings = rule.settings || {};
    const p = parseHex(settings.foreground);
    if (p) { const hex = toHex(blend(p, bg)); tokenColors.set(hex, (tokenColors.get(hex) || 0) + 1); }
    for (const word of ["italic", "bold", "underline", "strikethrough"]) if ((settings.fontStyle || "").includes(word)) font[word] = (font[word] || 0) + 1;
  }
  const palette = [...tokenColors.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);

  const nearCollisions = [];
  const merges = [];
  CORE_ROLES.forEach((a, i) => CORE_ROLES.slice(i + 1).forEach(b => {
    const [ha, hb] = [roles[a].hex, roles[b].hex];
    if (ha === hb) { merges.push([a, b]); return; }
    const de = distance(ha, hb);
    if (de < 6) nearCollisions.push([a, b, round(de, 1)]);
  }));
  const cvdColors = [...new Set(CVD_ROLES.map(k => roles[k].hex))].sort();
  let cvd3 = 0;
  for (const kind of Object.keys(CVD)) {
    cvdColors.forEach((a, i) => cvdColors.slice(i + 1).forEach(b => { if (distance(simulate(a, kind), simulate(b, kind)) < 3) cvd3 += 1; }));
  }

  const ansi = Object.fromEntries(ANSI.map(n => [n, colors["terminal.ansi" + n] || null]));
  const ansiBright = Object.fromEntries(ANSI.map(n => [n, colors["terminal.ansiBright" + n] || null]));
  const brightDistinct = ANSI.slice(1, 7).filter(n => ansi[n] && ansiBright[n] && ansi[n].toUpperCase() !== ansiBright[n].toUpperCase()).length;
  const extra = Object.fromEntries(Object.entries(EXTRA_SCOPES).map(([name, stack]) => {
    const { result } = resolve(rules, stack);
    return [name, (result.foreground || "") + (result.fontStyle ? "|" + result.fontStyle : "")];
  }));

  return {
    ...meta,
    label: meta.label,
    kind: luminance(bg) > 0.4 ? "light" : "dark",
    bg: toHex(bg), fg: toHex(fg), fgCr: round(contrast(fg, bg), 2), bgLCH: oklch(bg),
    surfaces, nColors: Object.keys(colors).length, nRules: rules.length, nTokenColors: tokenColors.size,
    nSemantic: Object.keys(semanticRules).length, semanticHighlighting: theme.semanticHighlighting ?? null,
    bracket: [1, 2, 3, 4, 5, 6].map(i => colors["editorBracketHighlight.foreground" + i] || null),
    ansi, ansiBright, brightDistinct, nearCollisions, merges, cvd3, font,
    wb: Object.fromEntries(Object.entries(wb).map(([k, v]) => [k, v && { hex: v.hex, raw: v.raw, cr: v.cr, a: v.alpha, key: v.key, def: !!v.default }])),
    roles: Object.fromEntries(Object.entries(roles).map(([k, v]) => [k, { hex: v.hex, cr: v.cr, fam: v.fam, font: v.font, sel: v.sel, un: !!v.unstyled, L: v.L, C: v.C, H: v.H }])),
    palette: palette.slice(0, 28), extra,
  };
}

module.exports = { ROLES, analyzeTheme, contrast, distance, family, oklch, parseHex, toHex };
