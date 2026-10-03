"use strict";
// Draws a VS Code window from a theme analysis (scripts/census/analyze-theme.js),
// in either of VS Code's two layouts: the classic one, and the Modern UI with its
// rounded cards. Every element is painted from its own theme key and carries
// that key in `data-keys`, so a page can open an inspector on anything in the
// window. Icons are Codicons (Microsoft, CC BY 4.0), inlined at build time.
//
// The window shows what a theme has to get right: the active and inactive
// activity items, the explorer's title and section headers, the selected file
// with the tree focused (folder tree) and unfocused (OPEN EDITORS), git- and
// problem-decorated rows, an active, an inactive and a modified tab,
// breadcrumbs, line numbers, the current line, a selection, a find match, the
// gutter marks, bracket pairs, pane tabs, the terminal's normal and bright
// colors, and the status bar's remote, error and warning items.
//
// Usage, in a page that has EsperAnalyze (analyze-theme.js) loaded:
//   EsperSpecimen.render(analysis, { ui: "modern" | "classic", big: boolean })
//   EsperSpecimen.css   — the stylesheet, to inline once per page
/* global EsperAnalyze */
(function (root) {
  const ICONS = typeof module !== "undefined" ? require("./codicons.json") : /*ICONS*/{};
  const { WB_KEYS } = typeof module !== "undefined" ? require("./analyze-theme") : EsperAnalyze;

  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const icon = (name, cls = "") => {
    const i = ICONS[name];
    return i ? `<svg class="ci ${cls}" viewBox="${i.vb}" aria-hidden="true">${i.body}</svg>` : "";
  };
  // A workbench color by its short name, or null when the theme and VS Code's defaults both lack it.
  const W = (t, k) => (t.wb[k] && t.wb[k].hex) || null;
  const KEY = k => WB_KEYS[k] || k;
  const keys = (...names) => names.map(KEY).join(",");
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const inkOn = h => lum(h) > 0.3 ? "#111111" : "#FFFFFF";

  // The sample: a TypeScript file mid-search for `ship`, with a selection on
  // line 6 and modified and added gutter marks on lines 5 and 6, then a diff,
  // an HTML line and a Markdown heading.
  const CODE = [
    [["// fetch the crew manifest", "comment"]],
    [["import", "import"], [" {", "punct"], [" log ", "variable"], ["}", "punct"], [" "], ["from", "import"], [" "], ["\"./util\"", "string"], [";", "punct"]],
    [["export", "modifier"], [" "], ["async", "modifier"], [" "], ["function", "storage"], [" "], ["load", "function"], ["(", "punct"], ["ship", "parameter"], [": ", "punct"], ["Ship", "type"], [")", "punct"], [" "], ["{", "punct"]],
    [["  "], ["const", "storage"], [" "], ["url", "constant"], [" "], ["=", "operator"], [" "], ["`/api/${", "string"], ["ship", "variable"], [".", "punct"], ["id", "property"], ["}`", "string"], [";", "punct"]],
    [["  "], ["if", "keyword"], [" "], ["(", "punct"], ["ship", "variable"], [".", "punct"], ["crew", "property"], [" "], [">", "operator"], [" "], ["12", "number"], [" "], ["&&", "operator"], [" "], ["/^[A-Z]/", "regex"], [".", "punct"], ["test", "method"], ["(", "punct"], ["url", "variable"], [")", "punct"], [")", "punct"], [" "], ["{", "punct"]],
    [["    "], ["console", "variable"], [".", "punct"], ["log", "method"], ["(", "punct"], ["\"found", "string"], ["\\n", "escape"], ["\"", "string"], [", ", "punct"], ["url", "variable", "sel"], [")", "punct"], [";", "punct"]],
    [["  "], ["}", "punct"]],
    [["  "], ["return", "keyword"], [" "], ["new", "keyword"], [" "], ["Manifest", "class"], ["(", "punct"], ["this", "this"], [".", "punct"], ["name", "property"], [", ", "punct"], ["true", "boolean"], [")", "punct"], [";", "punct"]],
    [["}", "punct"]],
  ];
  const MORE = [
    [["@@ -8,1 +8,1 @@", "diffHeader"]],
    [["-  return null;", "deleted"]],
    [["+  return new Manifest(this.name);", "inserted"]],
    [["<", "tagPunct"], ["a", "tag"], [" "], ["href", "attr"], ["="], ["\"/crew\"", "attrValue"], [">", "tagPunct"], ["Crew"], ["</", "tagPunct"], ["a", "tag"], [">", "tagPunct"]],
    [["# Crew manifest", "heading"]],
  ];
  const BRACKETABLE = new Set(["punct", "operator", undefined]);
  // VS Code's bracket-pair colors when a theme sets none.
  const DEFAULT_BRACKETS = { dark: ["#FFD700", "#DA70D6", "#179FFF"], light: ["#0431FA", "#319331", "#7B3814"] };

  const styleOf = r => !r || !r.font ? "" : (r.font.includes("italic") ? "font-style:italic;" : "") + (r.font.includes("bold") ? "font-weight:700;" : "") + (r.font.includes("underline") ? "text-decoration:underline;" : "");
  // The key an inspector should edit for a syntax role: the semantic selector
  // or the TextMate selector that won it, or the editor foreground when none did.
  const roleKey = r => !r || r.un || !r.sel ? "editor.foreground" : r.sel.startsWith("semantic: ") ? "semantic:" + r.sel.slice(10) : "token:" + r.sel;

  function lines(t, code, startNo, withCursor) {
    const brackets = t.bracket && t.bracket.some(Boolean) ? t.bracket.filter(Boolean) : DEFAULT_BRACKETS[t.kind];
    const lnHex = W(t, "lineNo") || "#858585", lnA = W(t, "lineNoActive") || t.fg, lh = W(t, "lineHighlight");
    const sel = W(t, "selection"), cur = W(t, "cursor") || t.fg;
    const find = withCursor ? W(t, "findMatchHighlight") : null;
    const marks = withCursor ? { 4: W(t, "gutterModified"), 5: W(t, "gutterAdded") } : {};
    const indent = W(t, "indent"), indentActive = W(t, "indentActive");
    let depth = 0;
    return code.map((line, i) => {
      const active = withCursor && i === 3;
      const parts = line.map(([txt, role, flag]) => {
        const r = role ? t.roles[role] : null;
        const col = r ? r.hex : t.fg, st = styleOf(r);
        const bg = flag === "sel" && sel ? `background:${sel};` : find && txt === "ship" ? `background:${find};` : "";
        const dk = flag === "sel" ? ` data-keys="${esc(roleKey(r))},editor.selectionBackground" data-label="Selection"` : find && txt === "ship" ? ` data-keys="${esc(roleKey(r))},editor.findMatchHighlightBackground" data-label="Find match"` : r ? ` data-keys="${esc(roleKey(r))}" data-label="${esc(role)}"` : "";
        if (BRACKETABLE.has(role) && /[()[\]{}]/.test(txt)) {
          return [...txt].map(ch => {
            if ("([{".includes(ch)) { const c = brackets[depth % brackets.length]; const n = depth % brackets.length + 1; depth++; return `<span style="color:${c}" data-keys="editorBracketHighlight.foreground${n}" data-label="Bracket pair ${n}">${esc(ch)}</span>`; }
            if (")]}".includes(ch)) { depth = Math.max(0, depth - 1); const n = depth % brackets.length + 1; return `<span style="color:${brackets[depth % brackets.length]}" data-keys="editorBracketHighlight.foreground${n}" data-label="Bracket pair ${n}">${esc(ch)}</span>`; }
            return `<span style="color:${col};${st}"${dk}>${esc(ch)}</span>`;
          }).join("");
        }
        return `<span style="color:${col};${st}${bg}"${dk}>${esc(txt)}</span>`;
      }).join("") + (active ? `<span class="cur" style="background:${cur}" data-keys="editorCursor.foreground" data-label="Cursor"></span>` : "");
      const mark = marks[i] ? `box-shadow:inset 3px 0 0 ${marks[i]};` : "";
      const markKeys = i === 4 ? "editorGutter.modifiedBackground" : i === 5 ? "editorGutter.addedBackground" : "";
      // Indent guides on the indented lines of the main sample.
      const guide = withCursor && /^\s{2,}/.test(line[0][0]) ? `<i class="ig" style="background:${(active ? indentActive : indent) || "transparent"}" data-keys="editorIndentGuide.background1,editorIndentGuide.activeBackground1" data-label="Indent guide"></i>` : "";
      return `<div class="ln" style="${active && lh && lh !== t.bg ? "background:" + lh : ""}"${active ? ` data-keys="editor.lineHighlightBackground" data-label="Current line"` : ""}><span class="g" style="${mark}color:${active ? lnA : lnHex}" data-keys="${active ? "editorLineNumber.activeForeground" : "editorLineNumber.foreground"}${markKeys ? "," + markKeys : ""}" data-label="Line number">${startNo + i}</span><span class="lc">${guide}${parts}</span></div>`;
    }).join("");
  }

  function termLine(t) {
    const n = t.ansi || {}, b = t.ansiBright || {};
    const pair = (k, word) => `<span style="color:${n[k] || t.fg}" data-keys="terminal.ansi${k}" data-label="Terminal ${k}">${word}</span> <span style="color:${b[k] || n[k] || t.fg}" data-keys="terminal.ansiBright${k}" data-label="Terminal bright ${k}">${word.toUpperCase()}</span>`;
    return `${pair("Green", "pass")}  ${pair("Red", "fail")}  ${pair("Yellow", "warn")}  ${pair("Blue", "info")}  ${pair("Magenta", "tag")}`;
  }

  // The parts of the window, resolved once per theme and layout. Modern UI reads
  // its own keys and falls back to the classic ones, as VS Code's bridge does.
  function parts(t, modern) {
    const sidebar = W(t, "sidebar") || t.bg;
    const surface = modern ? (W(t, "surfaceBg") || sidebar) : sidebar;
    const paneTab = W(t, "mTabBg") || W(t, "listInactive") || W(t, "badge") || t.fg;
    return {
      // Modern UI: the ground between the cards is the title bar's color and the
      // activity rail is a card of its own (modernUI/README.md: "the shell
      // gutters use the active or inactive titleBar.* background").
      frame: W(t, "title") || W(t, "activity") || t.bg,
      title: W(t, "title") || W(t, "activity") || t.bg,
      titleFg: W(t, "titleFg") || W(t, "sidebarFg") || t.fg,
      rail: modern ? (W(t, "mActBg") || W(t, "activity") || t.bg) : (W(t, "activity") || t.bg),
      actFg: W(t, "activityFg") || t.fg,
      actInFg: W(t, "actInactiveFg") || W(t, "activityFg") || t.fg,
      actItemBg: modern ? (W(t, "mActItemBg") || W(t, "actActiveBg")) : W(t, "actActiveBg"),
      actItemFg: modern ? (W(t, "mActItemFg") || W(t, "activityFg") || t.fg) : (W(t, "activityFg") || t.fg),
      actBorder: W(t, "actActiveBorder") || W(t, "activityFg") || t.fg,
      badge: W(t, "activityBadge") || W(t, "badge") || t.fg,
      badgeFg: W(t, "activityBadgeFg") || inkOn(W(t, "activityBadge") || W(t, "badge") || t.fg),
      surface,
      border: modern ? (W(t, "surfaceBorder") || W(t, "sideBarBorder")) : W(t, "sideBarBorder"),
      edBorder: modern ? (W(t, "editorBorder") || W(t, "surfaceBorder") || W(t, "editorGroupBorder")) : null,
      sideFg: W(t, "sidebarFg") || t.fg,
      sbTitle: W(t, "sbTitle") || W(t, "sidebarFg") || t.fg,
      sectBg: W(t, "sectBg"), sectFg: W(t, "sectFg") || W(t, "sidebarFg") || t.fg,
      listA: W(t, "listActive"), listAFg: W(t, "listActiveFg") || W(t, "sidebarFg") || t.fg, listAIcon: W(t, "listActiveIcon") || W(t, "listActiveFg") || W(t, "sidebarFg") || t.fg,
      listI: W(t, "listInactive"), listIFg: W(t, "listInactiveFg") || W(t, "sidebarFg") || t.fg,
      focusOutline: W(t, "focusOutline") || W(t, "focus"), inactiveFocusOutline: W(t, "listInactiveFocusOutline"),
      listHi: W(t, "listHighlight") || t.fg, listFocusHi: W(t, "listFocusHi") || W(t, "listHighlight") || t.fg,
      gitMod: W(t, "gitModified"), gitUn: W(t, "gitUntracked"), listErr: W(t, "listErrorFg") || W(t, "error"), listWarn: W(t, "listWarningFg") || W(t, "warning"),
      iconFg: W(t, "iconFg") || W(t, "sidebarFg") || t.fg,
      tabsBar: modern ? t.bg : (W(t, "tabsBar") || sidebar),
      tabA: modern ? (W(t, "mEdTabBg") || W(t, "tabActive") || t.bg) : (W(t, "tabActive") || t.bg),
      tabAFg: modern ? (W(t, "mEdTabFg") || W(t, "tabActiveFg") || t.fg) : (W(t, "tabActiveFg") || t.fg),
      tabI: modern ? (W(t, "mEdTabInactiveBg") || W(t, "tabInactive") || sidebar) : (W(t, "tabInactive") || sidebar),
      tabIFg: W(t, "tabInactiveFg") || W(t, "lineNo") || t.fg,
      tabTop: W(t, "tabBorderTop"), tabBottom: W(t, "tabBorder"),
      tabMod: W(t, "tabModified"), tabIMod: W(t, "tabInactiveModified") || W(t, "tabModified"),
      crumb: W(t, "breadcrumbFg") || W(t, "descriptionFg") || t.fg, crumbFocus: W(t, "breadcrumbFocusFg") || t.fg,
      widget: W(t, "widget") || sidebar, widgetBorder: W(t, "widgetBorder") || W(t, "focus"),
      input: W(t, "input") || W(t, "widget") || sidebar, inputFg: W(t, "inputFg") || t.fg, inputBorder: W(t, "inputBorder"),
      button: W(t, "button") || W(t, "focus") || t.fg, buttonFg: W(t, "buttonFg") || inkOn(W(t, "button") || W(t, "focus") || t.fg),
      minimap: W(t, "minimapBg"),
      panel: W(t, "panel") || t.bg, panelBorder: W(t, "panelBorder") || W(t, "sideBarBorder"),
      paneTab, paneTabFg: W(t, "mTabFg") || inkOn(paneTab),
      panelTitle: W(t, "panelTitleActive") || t.fg, panelTitleIn: W(t, "panelTitleInactive") || W(t, "lineNo") || t.fg,
      terminal: W(t, "terminal") || W(t, "panel") || t.bg,
      status: W(t, "status") || sidebar, statusFg: W(t, "statusFg") || t.fg, statusBorder: W(t, "statusBorder"),
      remote: W(t, "stRemote"), remoteFg: W(t, "stRemoteFg") || W(t, "statusFg") || t.fg,
      stErr: W(t, "stError"), stErrFg: W(t, "stErrorFg"), stWarn: W(t, "stWarning"), stWarnFg: W(t, "stWarningFg"),
    };
  }

  const dk = (label, ...ks) => ` data-keys="${esc(ks.filter(Boolean).join(","))}" data-label="${esc(label)}"`;
  // File icons come from the icon theme, not the color theme; these are Seti's,
  // which VS Code ships as its default, so the tree reads as it does in VS Code.
  const SETI = { ts: ["TS", "#519ABA"], html: ["<>", "#E37933"], md: ["i", "#519ABA"], diff: ["±", "#8DC149"], json: ["{}", "#CBCB41"] };
  const fileIcon = ext => { const [g, c] = SETI[ext] || ["·", "#A074C4"]; return `<i class="fi" style="color:${c}" data-keys="" data-label="File icon (Seti icon theme, not the color theme)">${esc(g)}</i>`; };
  const extOf = name => name.split(".").pop();

  /** The window. `opts.ui` is "modern" (default) or "classic"; `opts.big` scales it up. */
  function render(t, opts = {}) {
    const modern = (opts.ui || "modern") === "modern";
    const m = parts(t, modern);
    const K = modern ? {
      rail: "modernActivityBar.background,activityBar.background", actItem: "modernActivityBarItem.activeBackground,modernActivityBarItem.activeForeground",
      surface: "surface.background,surface.foreground,surface.border", editor: "editor.background,editor.border",
      tabA: "modernEditorTab.activeBackground,modernEditorTab.activeForeground,tab.activeBorderTop,tab.activeBorder", tabI: "modernEditorTab.inactiveBackground,tab.inactiveForeground",
      paneTab: "modernTab.activeBackground,modernTab.activeForeground", panel: "panel.background,surface.border",
    } : {
      rail: "activityBar.background", actItem: "activityBar.foreground,activityBar.activeBorder,activityBar.activeBackground",
      surface: "sideBar.background,sideBar.foreground,sideBar.border", editor: "editor.background",
      tabA: "tab.activeBackground,tab.activeForeground,tab.activeBorderTop,tab.activeBorder", tabI: "tab.inactiveBackground,tab.inactiveForeground",
      paneTab: "panelTitle.activeForeground,panelTitle.activeBorder", panel: "panel.background,panel.border",
    };
    const bd = m.border ? `box-shadow:inset 0 0 0 1px ${m.border};` : "";
    // Classic VS Code draws the side bar's border on its editor-facing edge only.
    const sideBd = modern ? bd : m.border ? `box-shadow:inset -1px 0 0 ${m.border};` : "";

    // ---- activity bar ----
    const actItem = (name, on, badge) => {
      const fill = on && m.actItemBg ? `background:${m.actItemBg};` : "";
      const color = on ? (m.actItemBg ? m.actItemFg : m.actFg) : m.actInFg;
      const stroke = on && !modern ? `box-shadow:inset 2px 0 0 ${m.actBorder};` : "";
      return `<span class="ai${on ? " on" : ""}" style="${fill}${stroke}color:${color}"${dk(on ? "Active activity item" : "Activity item", ...(on ? K.actItem.split(",") : ["activityBar.inactiveForeground"]))}>${icon(name)}${badge ? `<b style="background:${m.badge};color:${m.badgeFg}"${dk("Activity badge", "activityBarBadge.background", "activityBarBadge.foreground")}>${badge}</b>` : ""}</span>`;
    };
    const rail = `<div class="rail" style="background:${m.rail}"${dk("Activity bar", ...K.rail.split(","))}>
      ${actItem("files", true)}${actItem("search", false)}${actItem("source-control", false, 4)}${actItem("debug-alt", false)}${actItem("extensions", false)}
      <span class="sp"></span>${actItem("account", false)}${actItem("settings-gear", false)}</div>`;

    // ---- side bar ----
    // The explorer as the README captures show it: the samples folder open, the
    // active file selected while the editor has focus (inactive selection with
    // the inactive focus outline), and Open Editors above it showing the same
    // file as a focused list draws it.
    const row = (name, kind, x = {}) => {
      const color = x.color || m.sideFg;
      const style = kind === "focused" ? `background:${m.listA || "transparent"};color:${m.listAFg};${m.focusOutline ? `box-shadow:inset 0 0 0 1px ${m.focusOutline};` : ""}`
        : kind === "inactive" ? `background:${m.listI || "transparent"};color:${m.listIFg};${m.inactiveFocusOutline ? `box-shadow:inset 0 0 0 1px ${m.inactiveFocusOutline};` : ""}`
        : `color:${color};`;
      const ks = kind === "focused" ? dk("Selected file, list focused", "list.activeSelectionBackground", "list.activeSelectionForeground", "list.activeSelectionIconForeground", "list.focusOutline")
        : kind === "inactive" ? dk("Selected file, list unfocused (editor has focus)", "list.inactiveSelectionBackground", "list.inactiveSelectionForeground", "list.inactiveFocusOutline")
        : x.keys ? dk(x.label, ...x.keys) : dk("Explorer row", "sideBar.foreground");
      const chev = x.folder ? icon(x.open ? "chevron-down" : "chevron-right", "chev") : `<i class="chev"></i>`;
      const ic = x.folder ? "" : fileIcon(extOf(name));
      const label = x.match ? `<span style="color:${kind === "focused" ? m.listFocusHi : m.listHi};font-weight:700"${dk("Filter match", kind === "focused" ? "list.focusHighlightForeground" : "list.highlightForeground")}>${esc(name.slice(0, 2))}</span>${esc(name.slice(2))}` : esc(name);
      const deco = x.deco ? `<span class="deco" style="color:${x.decoColor || color}"${x.decoKeys ? dk(x.decoLabel, ...x.decoKeys) : ""}>${x.deco}</span>` : x.dot ? `<span class="deco dot" style="color:${color}">${icon("circle-filled")}</span>` : "";
      return `<div class="row d${x.depth || 0}" style="${style}"${ks}>${chev}${ic}<span class="rl">${label}</span>${deco}</div>`;
    };
    const sect = (label, open) => `<div class="sect" style="${m.sectBg ? `background:${m.sectBg};` : ""}color:${m.sectFg}"${dk("Section header", "sideBarSectionHeader.background", "sideBarSectionHeader.foreground")}>${icon(open ? "chevron-down" : "chevron-right", "chev")}${label}</div>`;
    const side = `<div class="side sc" style="background:${m.surface};color:${m.sideFg};${sideBd}"${dk(modern ? "Side bar surface" : "Side bar", ...K.surface.split(","))}>
      <div class="sbt"><span style="color:${m.sbTitle}"${dk("Side bar title", "sideBarTitle.foreground")}>Explorer</span><span class="more" style="color:${m.iconFg}"${dk("Icon", "icon.foreground")}>${icon("ellipsis")}</span></div>
      ${sect("Open Editors", true)}
      ${row("load.ts", "focused", { depth: 1 })}
      ${row("telemetry.ts", "plain", { depth: 1, color: m.gitMod, keys: ["gitDecoration.modifiedResourceForeground"], label: "Modified file", deco: "M" })}
      ${sect("samples", true)}
      ${row("angular", "plain", { folder: true, color: m.gitUn, keys: ["gitDecoration.untrackedResourceForeground"], label: "Folder with untracked files", dot: true })}
      ${row("css", "plain", { folder: true })}
      ${row("typescript", "plain", { folder: true, open: true })}
      ${row("load.ts", "inactive", { depth: 1, match: true })}
      ${row("relay-alerts.ts", "plain", { depth: 1, color: m.gitUn, keys: ["gitDecoration.untrackedResourceForeground"], label: "Untracked file", deco: "U" })}
      ${row("telemetry.ts", "plain", { depth: 1, color: m.gitMod, keys: ["gitDecoration.modifiedResourceForeground"], label: "Modified file", deco: "4", decoColor: m.listErr, decoKeys: ["list.errorForeground"], decoLabel: "Problem count" })}
      ${row("README.md", "plain")}
      <span class="sp"></span>
      ${sect("Outline", false)}
      ${sect("Timeline", false)}
    </div>`;

    // ---- editor ----
    const tab = (name, active, modified) => {
      const fill = active ? m.tabA : m.tabI, color = active ? m.tabAFg : m.tabIFg;
      const outline = active && modern && m.tabTop ? `inset 0 0 0 1px ${m.tabTop}` : "";
      const strokes = active ? [m.tabTop ? `inset 0 2px 0 ${m.tabTop}` : "", m.tabBottom ? `inset 0 -2px 0 ${m.tabBottom}` : ""].filter(Boolean).join(",") : "";
      const modStroke = modified && !active && m.tabIMod && !modern ? `inset 0 2px 0 ${m.tabIMod}` : "";
      const shadow = [strokes, outline, modStroke].filter(Boolean).join(",");
      const close = modified ? `<i class="dot" style="color:${active ? (m.tabMod || color) : (m.tabIMod || color)}"${dk("Modified tab mark", active ? "tab.activeModifiedBorder" : "tab.inactiveModifiedBorder")}>${icon("circle-filled")}</i>` : `<i class="x">${icon("close")}</i>`;
      const label = modified ? `<span style="color:${m.gitMod || color}"${dk("Decorated tab label", "gitDecoration.modifiedResourceForeground")}>${esc(name)}</span>` : esc(name);
      return `<span class="tab${active ? " on" : ""}" style="background:${fill};color:${color};${shadow ? `box-shadow:${shadow};` : ""}"${dk(active ? "Active tab" : modified ? "Inactive tab, modified file" : "Inactive tab", ...(active ? K.tabA : K.tabI).split(","))}>${fileIcon(extOf(name))}${label}${close}</span>`;
    };
    const find = `<div class="find" style="background:${m.widget};${m.widgetBorder ? `box-shadow:0 0 0 1px ${m.widgetBorder};` : ""}color:${t.fg}"${dk("Find widget", "editorWidget.background", "editorWidget.border", "editorWidget.foreground")}><span class="in" style="background:${m.input};color:${m.inputFg};${m.inputBorder ? `box-shadow:0 0 0 1px ${m.inputBorder};` : ""}"${dk("Input", "input.background", "input.foreground", "input.border")}>ship</span><span class="n">1 of 3</span><span class="bt" style="background:${m.button};color:${m.buttonFg}"${dk("Button", "button.background", "button.foreground")}>Aa</span></div>`;
    const crumbs = `<div class="crumbs" style="color:${m.crumb}"${dk("Breadcrumbs", "breadcrumb.foreground", "breadcrumb.focusForeground")}>typescript ${icon("chevron-right", "chev")} ${fileIcon("ts")} load.ts ${icon("chevron-right", "chev")} ${icon("symbol-method", "chev")} <span style="color:${m.crumbFocus}">load</span></div>`;
    // A minimap: each sample line as a short bar in its first colored token's color.
    const minimap = `<div class="mini" style="${m.minimap ? `background:${m.minimap};` : ""}"${dk("Minimap", "minimap.background")}>${[...CODE, ...MORE, ...CODE].map((line, i) => { const r = line.map(([, role]) => role && t.roles[role]).find(Boolean); return `<i style="width:${Math.min(90, 18 + (line.map(p => p[0]).join("").length * 3))}%;background:${r ? r.hex : t.fg}"></i>`; }).join("")}</div>`;
    const dash = (W(t, "lineNo") || t.fg) + "55";
    const editor = `<div class="ed sc" style="background:${t.bg};${m.edBorder ? `box-shadow:inset 0 0 0 1px ${m.edBorder};` : ""}"${dk(modern ? "Editor surface" : "Editor", ...K.editor.split(","))}>
      <div class="tabs" style="background:${m.tabsBar}"${dk("Tab strip", modern ? "editor.background" : "editorGroupHeader.tabsBackground")}>${tab("load.ts", true)}${tab("telemetry.ts", false, true)}${tab("status-panel.html", false)}<span class="sp"></span><span class="acts" style="color:${m.iconFg}">${icon("split-horizontal")}${icon("ellipsis")}</span></div>
      ${crumbs}
      <div class="code" style="color:${t.fg}"${dk("Editor text", "editor.background", "editor.foreground")}>${find}${minimap}<pre>${lines(t, CODE, 1, true)}</pre><pre class="more" style="border-color:${dash}">${lines(t, MORE, 1, false)}</pre></div>
    </div>`;

    // ---- panel ----
    const paneTabs = modern
      ? `<span class="pt on" style="background:${m.paneTab};color:${m.paneTabFg}"${dk("Active pane tab", ...K.paneTab.split(","))}>Terminal</span><span class="pt" style="color:${m.panelTitleIn}"${dk("Pane tab", "panelTitle.inactiveForeground")}>Problems</span><span class="pt" style="color:${m.panelTitleIn}"${dk("Pane tab", "panelTitle.inactiveForeground")}>Output</span>`
      : `<span class="pt on" style="color:${m.panelTitle};box-shadow:inset 0 -1px 0 ${m.panelTitle}"${dk("Active panel title", ...K.paneTab.split(","))}>TERMINAL</span><span class="pt" style="color:${m.panelTitleIn}"${dk("Panel title", "panelTitle.inactiveForeground")}>PROBLEMS</span><span class="pt" style="color:${m.panelTitleIn}"${dk("Panel title", "panelTitle.inactiveForeground")}>OUTPUT</span>`;
    const panel = `<div class="pan sc" style="background:${m.panel};${modern ? bd : m.panelBorder ? `box-shadow:inset 0 1px 0 ${m.panelBorder};` : ""}"${dk(modern ? "Panel surface" : "Panel", ...K.panel.split(","))}>
      <div class="pts">${paneTabs}</div>
      <div class="term" style="background:${m.terminal};color:${t.fg}"${dk("Terminal", "terminal.background", "terminal.foreground")}>${termLine(t)}</div>
    </div>`;

    // ---- status bar ----
    const stItem = (bg, fg, ks, label, body) => `<span class="si" style="${bg ? `background:${bg};` : ""}${fg ? `color:${fg};` : ""}"${dk(label, ...ks)}>${body}</span>`;
    const status = `<div class="status" style="background:${m.status};color:${m.statusFg};${m.statusBorder ? `box-shadow:inset 0 1px 0 ${m.statusBorder};` : ""}"${dk("Status bar", "statusBar.background", "statusBar.foreground", "statusBar.border")}>
      ${stItem(m.remote, m.remoteFg, ["statusBarItem.remoteBackground", "statusBarItem.remoteForeground"], "Remote item", icon("remote"))}
      ${stItem(null, null, ["statusBar.foreground"], "Status item", `${icon("git-branch")} main* ${icon("sync")}`)}
      ${stItem(null, null, ["statusBar.foreground"], "Problems", `${icon("error")} 4 ${icon("warning")} 0`)}
      ${stItem(m.stErr, m.stErrFg, ["statusBarItem.errorBackground", "statusBarItem.errorForeground"], "Error item", `${icon("error")} 1`)}
      ${stItem(m.stWarn, m.stWarnFg, ["statusBarItem.warningBackground", "statusBarItem.warningForeground"], "Warning item", `${icon("warning")} 2`)}
      <span class="sp"></span>
      ${stItem(null, null, ["statusBar.foreground"], "Status item", "Ln 4, Col 18")}
      ${stItem(null, null, ["statusBar.foreground"], "Status item", "Spaces: 2")}
      ${stItem(null, null, ["statusBar.foreground"], "Status item", "UTF-8")}
      ${stItem(null, null, ["statusBar.foreground"], "Status item", "LF")}
      ${stItem(null, null, ["statusBar.foreground"], "Status item", "{ } TypeScript")}
      ${stItem(null, null, ["statusBar.foreground"], "Status item", icon("bell"))}
    </div>`;

    // ---- title bar ----
    const titlebar = `<div class="title" style="background:${m.title};color:${m.titleFg}"${dk("Title bar", "titleBar.activeBackground", "titleBar.activeForeground")}><span class="nav">${icon("chevron-right", "back")}${icon("chevron-right")}</span><span class="cc">esper-themes</span><span class="lay">${icon("split-horizontal")}${icon("split-horizontal")}</span></div>`;

    return `<div class="spec ${modern ? "modern" : "classic"}${opts.big ? " big" : ""}" style="background:${m.frame}"${dk(modern ? "Window ground (title bar color)" : "Window", "titleBar.activeBackground")}>
      ${titlebar}
      <div class="body">${rail}${side}<div class="main">${editor}${panel}</div></div>
      ${status}
    </div>`;
  }

  // One stylesheet for both layouts; the window scales with its font-size.
  const css = `
.spec { font: 10px/1.3 "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; box-shadow: 0 0 0 1px rgba(127,127,127,.25); --ui: -apple-system, "Segoe UI", system-ui, sans-serif; }
.spec.big { font-size: 13px; }
.spec .ci { width: 1.4em; height: 1.4em; fill: currentColor; flex: none; display: inline-block; vertical-align: -0.3em; }
.spec .chev { width: 1.2em; height: 1.2em; opacity: .9; flex: none; display: inline-block; }
.spec .fi { font: 700 .72em/1 var(--ui); letter-spacing: -.02em; width: 1.9em; flex: none; display: inline-block; text-align: center; }
.spec .sp { flex: 1; }
.spec .title { height: 2.8em; display: flex; align-items: center; gap: .8em; padding: 0 1em; font-family: var(--ui); position: relative; }
.spec .title .nav { display: inline-flex; gap: .2em; margin-left: auto; opacity: .8; } .spec .title .nav .back { transform: scaleX(-1); }
.spec .cc { display: inline-flex; align-items: center; justify-content: center; width: 38%; min-width: 9em; padding: .25em 1em; border-radius: .5em; box-shadow: inset 0 0 0 1px rgba(127,127,127,.5); background: rgba(127,127,127,.12); opacity: .9; font-size: .95em; margin-right: auto; }
.spec .lay { display: inline-flex; gap: .4em; opacity: .7; }
.spec .body { display: grid; grid-template-columns: 3.6em 14.5em minmax(0, 1fr); min-width: 0; }
.spec.modern .body { gap: .6em; padding: 0 .6em .6em .6em; }
.spec .sc { min-width: 0; } .spec.modern .sc { border-radius: .8em; overflow: hidden; }
.spec .rail { display: flex; flex-direction: column; align-items: center; gap: .5em; padding: .6em 0; }
.spec.modern .rail { border-radius: .8em; }
.spec .ai { width: 2.6em; height: 2.6em; display: grid; place-items: center; border-radius: .6em; position: relative; }
.spec.classic .ai { width: 3.6em; height: 3.2em; border-radius: 0; }
.spec .ai .ci { width: 1.9em; height: 1.9em; }
.spec .ai b { position: absolute; right: .1em; bottom: .1em; min-width: 1.45em; height: 1.45em; border-radius: .75em; font: 700 .8em/1.8 var(--ui); text-align: center; padding: 0 .3em; }
.spec .side { display: flex; flex-direction: column; font-family: var(--ui); font-size: 1.05em; padding-bottom: .2em; min-height: 100%; }
.spec .sbt { display: flex; align-items: center; justify-content: space-between; padding: .7em 1em .5em; font-size: 1em; font-weight: 600; }
.spec .more .ci { width: 1.3em; height: 1.3em; }
.spec .sect { display: flex; align-items: center; gap: .2em; padding: .3em .4em; font-size: .9em; font-weight: 700; }
.spec .row { display: flex; align-items: center; gap: .3em; padding: .2em .6em .2em .4em; white-space: nowrap; overflow: hidden; }
.spec .row.d1 { padding-left: 1.6em; } .spec .row.d2 { padding-left: 2.8em; } .spec .row .rl { overflow: hidden; text-overflow: ellipsis; }
.spec .row .deco { margin-left: auto; font-size: .85em; opacity: .95; } .spec .row .deco.dot .ci { width: .7em; height: .7em; }
.spec .main { display: flex; flex-direction: column; min-width: 0; } .spec.modern .main { gap: .6em; }
.spec .ed { display: flex; flex-direction: column; min-width: 0; }
.spec .tabs { display: flex; align-items: center; min-width: 0; overflow: hidden; }
.spec.modern .tabs { gap: .4em; padding: .5em .5em 0; }
.spec .tabs .acts { display: inline-flex; gap: .3em; padding: 0 .6em; opacity: .8; }
.spec .tab { display: inline-flex; align-items: center; gap: .45em; padding: 0 .7em 0 .8em; line-height: 2.7em; white-space: nowrap; font-size: .95em; font-family: var(--ui); }
.spec.modern .tab { border-radius: .6em; line-height: 2.3em; }
.spec .tab .ci { width: 1.1em; height: 1.1em; opacity: .75; } .spec .tab .dot .ci { opacity: 1; width: .8em; height: .8em; }
.spec .crumbs { display: flex; align-items: center; gap: .25em; padding: .3em 1em; font-size: .85em; font-family: var(--ui); white-space: nowrap; overflow: hidden; }
.spec .crumbs .fi { width: auto; margin: 0 .1em; }
.spec .code { position: relative; }
.spec pre { margin: 0; padding: .6em 7em .6em 0; font: inherit; line-height: 1.55; overflow: hidden; white-space: pre; }
.spec pre.more { border-top: 1px dashed; }
.spec .ln { display: flex; } .spec .ln .g { width: 3.2em; text-align: right; padding-right: 1em; flex: none; } .spec .ln .lc { position: relative; }
.spec .ig { position: absolute; left: 0; top: 0; bottom: 0; width: 1px; }
.spec .cur { display: inline-block; width: 1.5px; height: 1.2em; vertical-align: -0.25em; margin-left: -1px; }
.spec .find { position: absolute; z-index: 2; top: 0; right: 7.5em; display: flex; gap: .5em; align-items: center; padding: .45em .6em; border-radius: 0 0 .4em .4em; font-size: .9em; }
.spec .find .in { padding: .2em .6em; border-radius: .2em; min-width: 6em; } .spec .find .n { opacity: .7; } .spec .find .bt { padding: .2em .7em; border-radius: .25em; font-weight: 700; }
.spec .mini { position: absolute; z-index: 1; top: 0; right: 0; bottom: 0; width: 6em; padding: .6em .6em; display: flex; flex-direction: column; gap: .22em; opacity: .55; }
.spec .mini i { display: block; height: .28em; border-radius: 1px; }
.spec .pan { display: flex; flex-direction: column; }
.spec .pts { display: flex; align-items: center; gap: 1.2em; padding: .5em 1em 0; font-family: var(--ui); font-size: .9em; font-weight: 600; }
.spec.modern .pts { gap: .5em; } .spec.modern .pt { padding: .25em .9em; border-radius: .45em; } .spec.classic .pt { padding: .5em 0 .4em; font-size: .85em; letter-spacing: .06em; }
.spec .term { padding: .6em 1em .8em; white-space: pre; overflow: hidden; margin-top: .3em; }
.spec .status { height: 2.3em; display: flex; align-items: center; gap: .15em; padding: 0 .3em; font-family: var(--ui); font-size: .95em; white-space: nowrap; overflow: hidden; }
.spec .si { display: inline-flex; align-items: center; gap: .35em; padding: .2em .5em; }
.spec.modern .si { border-radius: .35em; }
.spec .status .ci { width: 1.25em; height: 1.25em; }
`;

  const api = { render, css, CODE, MORE, ICONS, icon };
  if (typeof module !== "undefined") module.exports = api;
  else root.EsperSpecimen = api;
})(typeof window !== "undefined" ? window : globalThis);
