# Esper Themes Color and Accessibility Log

## Fixed themes

LCARS (`themes/LCARS-color-theme.json`) is the fixed theme and uses only
colors from the approved palette below.

No new colors were introduced for the fixed theme and no existing
text-safe/diagnostic-only distinctions (Mars, orange-red, light orange-red,
red) were altered. Q is the documented runtime-generated exception below.
When debugging is active, every theme uses the approved lavender `#BAA4E5`
status-bar background with dark-blue `#1C3C55` foreground text, which has a
5.22:1 contrast ratio.

## October 2026 regrade

A study of the thirty most-installed color themes on the Marketplace, measured
from their shipped JSON, set Esper against the field and found eight places to
change. All of them are in this release.

**Lighter dark grounds.** Esper's film editors sat at OKLCH lightness
0.12-0.17, darker than every one of the 143 dark variants the thirty
most-installed theme extensions ship except an experimental OLED variant and
JellyFish, with body text at 15-19:1 where thin bright text blooms. Every
built dark theme's editor now sits at L 0.19, where GitHub Dark (0.176), Ayu
Dark (0.191), Bearded's black variants (0.19) and Omni (0.210) put theirs, its
hue and chroma kept (`DARK_EDITOR_LIGHTNESS` in `scripts/build-themes.js`), and
body text lands at 13.8-17.5:1. The rest of the workbench moves with it. The chrome stays a
step brighter than the code, which is the Esper look, but the step is capped
at 0.03 (`MAX_CHROME_STEP`; it reached +0.16 in Bluey Night), with floors that
keep borders and widgets visible. LCARS's editor stays on its deep dark blue
`#09131A` (L 0.181), already inside that band. Q's generator draws its
surfaces around the same lightness.

**No two roles a shade apart.** Every theme had pairs of syntax roles with
different hex values that read as one color (OKLab ΔE under 6): Fellowship
had 17, Tomcat 13, Cooper 11. The build now fails on any such pair
(`checkRoleDistances`); roles meant to read as one share a hex instead. Each
palette was regraded until it passed, which also widened the hue range: the
field uses a median of 7 hue families across fourteen core roles, and Esper's
fixed themes now use 6 or 7 (LCARS, Fellowship and Cooper 7; the rest 6),
up from a median of 5. Tomcat stays phosphor-led but types take a radar teal,
numbers the caution amber and tags the master-warning red; Fellowship's types
take a blue ink and its tags a purple seal ink; Oblivion's types take the sky
above the Sky Tower; Cooper's types take Miller's ocean.

**Variables read as text.** Plain variables and parameters were colored in 7
of 11 themes; in LCARS one cyan covered variables, parameters, numbers,
operators, modifiers and tags. They now take the foreground, as 19 of the top
30 themes do, and color is spent on declarations, calls and literals.

**Bracket pairs.** No theme set `editorBracketHighlight.*`, so every theme
showed VS Code's default gold, orchid and blue. Each now cycles three of its
own accents, chosen at least ΔE 10 apart, with the error color for an
unexpected bracket.

**Diff markup.** `markup.inserted`, `markup.deleted` and `markup.changed` now
take each theme's git colors and diff headers the comment color, so `.diff`
and `.patch` files read like the Source Control view.

**A quieter gutter.** Line numbers sat at a median 6.6:1 (Bluey Night 11.7:1)
against 2.7:1 in the field. They now sit just over AA, at 4.6:1
(`LINE_NUMBER_CONTRAST` in `q-theme.js`); the current line's number keeps its
accent. LCARS reaches it with light gray at 73% opacity, `#9EA5BABB`.

**Font style as a second channel.** HTML attribute names and `this`/`self`
are italic and generic markup headings are bold, alongside the italic
comments and the bold markdown headings already shipped.

**Escapes and patterns.** String escapes and regular expressions have their
own roles instead of sharing the number and string colors.

## Film themes

Replicant, Oblivion, Synthwave, Tomcat, Fellowship, and Cooper are outside the
approved LCARS palette: each takes its surfaces and accents from the matching
Deckard webview theme (`src/ui/webview/themes.ts` in Deckard, with the base
palette Replicant uses in `src/ui/webview/components.ts`).
`scripts/build-themes.js` holds those palettes and maps them onto the
workbench roles through `buildWorkbenchColors` in `q-theme.js`, the same
mapping Q uses, so the film themes and Q stay aligned as roles are added.

Deckard regraded those palettes in September 2026 around a contrast suite that
renders every page in every theme and holds each text pair, hover states
included, to 4.5:1. The film themes follow the regrade so the editor and
Deckard's pages agree on what a color is. The fully saturated cyans and greens
that bloomed around thin text on near-black were softened a step with their
hues kept: Replicant's cyan `#00E5FF` is `#3ED4E8`, its green `#33FF33` is
`#66E066`, and its red `#D23C28` is `#E05232`; Synthwave's cyan is `#3FD8EA`,
its bright cyan `#7CE6F0`, its pink `#F25AA9` and its ice `#7CE3EC`; Tomcat's
phosphor greens are `#6FD96C` and `#8CE87C`. Fellowship's inks were deepened
so they carry text on the parchment: muted `#545C3C`, olive `#4A6A32`, gold
`#664317`, deep olive `#354A1F` and ink red `#9A4530`; and since its
`--panel-deep` became a control surface, the theme's structural border is
Deckard's hairline `#9C9A5C` instead. Oblivion's darkest surface merged with
its editor ground, so its activity bar is `#04080B`. Cooper did not change.

| Theme | File | Primary accent | Secondary accent |
| --- | --- | --- | --- |
| Replicant | `themes/Replicant-color-theme.json` | Amber `#FFB000` | Cyan `#3ED4E8` |
| Oblivion | `themes/Oblivion-color-theme.json` | Cyan `#3FB6C9` | Orange `#E8562A` |
| Synthwave | `themes/Synthwave-color-theme.json` | Cyan `#3FD8EA` | Pink `#F25AA9` |
| Tomcat | `themes/Tomcat-color-theme.json` | Phosphor green `#6FD96C` | Amber `#D89D31` |
| Fellowship (light) | `themes/Fellowship-color-theme.json` | Olive `#405E2A` | Gold `#664317` |
| Cooper | `themes/Cooper-color-theme.json` | Gold `#DCA24A` | Steel blue `#9FBFD4` |

Replicant's syntax palette is the one exception to that sourcing, and the one
exception to the contrast target. Its workbench surfaces and accents still come
from Deckard and still meet AA; its token colors are measured off the 1982 film
and are held to 2.9:1 instead.

Quantizing the palette strip of 46 frame-by-frame analyzed shots and clustering
the results splits the film into five looks. Replicant took the darkest of them
until 0.6.0 — the night exteriors and searchlights (`#08828E`, `#0B8B9D`,
`#0F3B4F`) — and ran the violet from the window Deckard reads his paper against
(`#8B5682` orchid, `#341B39` violet) underneath as a cast on comments,
punctuation and library calls. That cast reached too far: nine of the fourteen
syntax roles landed in the purple and pink family, strings loudest among them,
and a file read as signage end to end.

It now takes a warmer look from the same clustering, Tyrell's office at golden
hour. Gold `#FFB000` leads and carries the keywords, bone `#D6D2C6` carries the
prose, the searchlight cyan `#4FC7DC` is the counterweight rather than the
subject, sea glass off the window glass `#9FD0C4` takes the strings, and coral
off Zhora's coat `#E86A4E` takes the numbers. No syntax color sits between hue
250 and 345; the theme declares that band in `forbiddenSyntaxHues` and the
build fails rather than write a file that re-enters it.

The regrade is confined to the editor. Replicant's workbench surfaces are
unchanged, the same cool near-black ground it has always had, and its
workbench accents are Deckard's, which now means the softened cyan, green and
red of Deckard's own September regrade rather than the fully saturated ones
0.5.0 shipped with.

The relaxed floor is deliberate and narrow. The film is graded dark; a palette
that clears 4.5:1 on every surface cannot be. Only the comment color uses the
headroom — `#6E6757`, at 3.61:1 on the editor background, 3.44:1 on the line
highlight and 2.96:1 on the bracket-match tint. The markdown block-quote color
`#8F8876` is next at 4.71:1, every other token clears 5.23:1, and every
workbench pair is still held to 4.5:1 by the same build that writes the file. A
theme opts in by setting `syntaxContrast` in its palette; without it the syntax
colors are held to AA like everything else.

A color that misses the target is darkened (or lightened) in HSL with its
saturation held, rather than blended toward the theme's foreground: blending
pulls every hue toward the same washed-out dark, which on a light ground
leaves the syntax colors nearly indistinguishable.

The build enforces the same AA target as Q. Every accent that also serves as
text reads at 4.5:1 or better on every workbench surface; each accent fill
gets a foreground that reaches 4.5:1 on it; and every syntax color reaches
4.5:1 on the editor background, the line highlight, and the secondary-accent
bracket-match tint, except where a theme sets its own syntax floor — today
only Replicant, at 2.9:1, and only its comments use the headroom. A Deckard color that misses is darkened in HSL until it
passes, and an accent fill is deepened until some text reads on it, which is
why Fellowship's olive fill is a step darker than Deckard's ink. The build fails rather than write a theme with a
pair below the target.

## Bluey themes

Bluey (light) and Bluey Night (dark) take their palette from the characters in
the family artwork, sampled from the image rather than derived: navy `#040620`,
purple-navy `#403F65`, Bluey blue `#83BBE3`, steel `#75A6BE`, pale blue
`#D2EBFD`, cream `#FFF9D8`, gold `#EDCE74`, Bandit orange `#FFB070`, Bingo
orange `#E37A3B`, Chilli's brown `#9B5E33`, and the tongue red `#C9504F`.

The assignment follows how the artwork pairs colors rather than treating them
as a flat list. Counting which colors border each other on the characters
gives, in order: blue + steel, navy + purple-navy, pale blue + steel, blue +
pale blue, cream + orange, brown + orange, brown + gold, and gold + pale blue.
Roles that sit next to each other on screen therefore use colors that sit next
to each other on the characters: workbench surfaces run along the navy /
purple-navy axis of Bluey's head, with steel borders; keywords, operators and
variables use blue, steel and pale blue; strings, numbers, constants and types
use gold, the oranges and brown; text and properties are cream, which the
artwork pairs with orange.

A few surfaces and three syntax roles are blends of two adjacent artwork
colors; nothing outside the artwork is introduced. Bluey is the only light
theme besides Fellowship: cream editor paper, pale blue side bar and panels,
Bluey blue activity bar and status bar. Its accents are the artwork's darker
colors, since the pastels cannot carry text on cream — the build darkens each
one only as far as 4.5:1 requires.

## Helix

Helix is carried over from the Sublime Text theme of the same name
(`~/dotfiles/vscode/colors/helix-theme`). Its syntax palette is that file's;
its workbench is Replicant's, the same cool near-black surfaces (editor
`#050608`, activity bar `#080A0E`, side bar `#0D1017`, widgets and active tab
`#121620`, border `#212936`), so the two themes share a ground and differ in
what is painted on it. The string orange `#FF8147` is the primary accent where
Replicant has gold, and the lavender `#BD93F9` is the secondary.

Syntax keeps the tmTheme's assignments: steel blue `#448AA9` for variables,
parameters, numbers, constants, `storage` and HTML attributes; dusty rose
`#AF8787` for keywords and library functions; red `#BF5656` for `storage.type`;
slate `#748096` for types, classes, namespaces, tags and headings; orange
`#FF8147` for strings; lavender `#BD93F9` for functions; warm grey `#A2A797`
for operators, tag punctuation and markdown punctuation, emphasis and links;
green `#80E045` for library constants; mint `#A5E3D0` for markdown code. The
tmTheme's foreground `#D7875F`, which VS Code never reached because every scope
matched something else, takes the decorators. GitGutter's marks supply the
diagnostics: red `#E61F44` for errors and removed lines, amber `#F7B83D` for
warnings and modified files, and the diff's green `#A6E22E` for insertions.

The build holds Helix to the same AA floor as every other theme, and the lifts
it makes are these. Comments were `#4E4E4E`, 2.44:1 on the editor; they ship as
`#868686`. Steel blue was 4.31:1 on the changed-text wash and ships as
`#4591B2`; slate was 4.17:1 and ships as `#7F8AA0`; the `storage.type` red was
3.70:1 and ships as `#CC6868`; the inactive-tab blue `#6272A4` reads at 4.31:1
on the editor and ships as the muted `#7382B2` so it also clears the side bar.
The `storage` split and the attribute blue are written as token overrides,
since the shared matcher folds them into keyword and property. The steel-blue
overrides name the number role rather than a hex, so they follow its lift onto
whatever ground the build puts under them.

The explorer text is set to lavender `#BD93F9` as a color override, the way
the old theme had it; at 7.9:1 on the side bar it clears AA on its own.

## Mix

Mix (`themes/Mix-color-theme.json`) is a slot, the way Q is: the file ships as
Helix's workbench around LCARS's syntax, and the **Esper Themes: Mix Themes**
command writes whatever pair is chosen into the `[Mix]` scope of
`workbench.colorCustomizations`, `editor.tokenColorCustomizations` and
`editor.semanticTokenColorCustomizations`. Every color key, the editor
background included, comes from the workbench theme; every token rule comes
from the editor theme.

A theme's syntax colors were chosen against its own editor and washes, so
`composeThemes` in `q-theme.js` lifts each one against the new ground with the
same `readable` pass the build uses. The floor for a color is the lower of AA
(4.5:1) and the contrast it had at home, on its own theme's editor, current
line, bracket match and changed-text washes. A palette tuned for a near-black
editor is therefore lifted on parchment, and Replicant's syntax, built to a
2.9:1 floor by choice, keeps that floor rather than being pulled to AA on a
ground no darker than its own. Workbench pairs are not re-checked; they are
taken whole from a theme that already meets AA.

## Q generated theme

Q is a runtime-generated exception to the fixed approved palette above. Its
generator samples new dark surfaces and accent colors, then accepts a
foreground/background pair only when it reaches WCAG AA normal-text contrast
of at least 4.5:1. It applies the same constraint to actual code content:
TextMate and semantic-token foregrounds are regenerated against the Q editor
background, and selection/hover foregrounds are checked against their
alpha-composited surfaces.

Q starts from `themes/Q-color-theme.json` as a safe static fallback. When Q is
active, the extension writes generated values into the theme-scoped
`workbench.colorCustomizations`, `editor.tokenColorCustomizations`, and
`editor.semanticTokenColorCustomizations` settings. **Mon Capitan** in the
status bar and **Esper Themes: Generate Q Theme** in the Command Palette invoke the
same generator; the other themes remain unchanged. Runtime syntax colors use
a shared semantic role palette for comments, keywords, operators, strings,
numbers, constants, variables, properties, functions, types, markup,
decorators, and invalid code, so TextMate and semantic-token highlighting
remain visibly differentiated instead of collapsing into near-white shades.
Saved Q snapshots are kept in extension global storage and can be restored
from the Command Palette without adding separate theme files. Applying a
snapshot still writes the active Q customization through VS Code's supported
`workbench.colorCustomizations` and editor customization settings so the live
workbench can render it. The debugger-active status bar uses the approved
lavender `#BAA4E5` with dark-blue `#1C3C55` foreground text (5.22:1 contrast).

The main workbench chrome uses the theme's primary color, so the identity is
visible in the UI around the editor: `activityBar.foreground`
(activity-bar icons), `sideBarTitle.foreground`,
`panelTitle.activeForeground`/`panelSectionHeader.foreground`,
`badge.background`, `activityBarBadge.background`, `button.secondaryBackground`,
`editorSuggestWidget.selectedBackground`, `editorBracketMatch.border`,
`tab.activeBorderTop`, `textLink.activeForeground`, and
`textBlockQuote.border` carry that identity. The dark-blue foreground text
used on badges and secondary buttons remains readable (all AA). Diagnostic
and semantic colors — error/warning/info/hint squiggles, gutters, overview
rulers, diff borders, and Git decorations — are intentionally left unchanged
so their meaning (e.g. red = error, green = added) stays consistent. Major workbench section
separators (`sideBar.border`, `panel.border`, `surface.border`,
`editor.border`, and `statusBar.border`) use the subdued dark neutral
`#2F3749` in every theme instead of bright identity accents.

VS Code controls tab geometry in the workbench; color themes only provide color
roles. The focused, unfocused, selected, inactive, and hover tab roles are all
set explicitly in each theme so the workbench does not fall back to a stale or
unrelated tab color. The palette reference page uses a compact rounded
approximation of the Modern UI tabs, while the live workbench delegates the
exact radius, padding, spacing, shadows, and pill geometry to VS Code itself.

## VS Code Modern UI tab roles

VS Code 1.136.1's Modern UI reads a separate set of registered color IDs in
addition to the legacy `tab.*` roles. The LCARS theme explicitly defines the
full `modernTab.*` and `modernEditorTab.*` families so active, inactive, hover,
selected-action, and tab-action surfaces retain the theme's
identity. The related `surface.*`, `modernActivityBar.*`, and
`modernActivityBarItem.*` roles keep the surrounding framed workbench surfaces
on the same identity as the sidebar and activity bar, while the structural
surface/editor borders stay subdued. Explicit Modern UI roles
take precedence over VS Code's legacy-to-modern compatibility bridge, so these
values prevent the native tabs from resolving to unrelated list colors.

The two tab families are intentionally independent. In the base LCARS theme,
non-editor pane tabs such as the Chat tab use the orange
`modernTab.activeBackground` (`#EB943A`) with dark-blue text, while editor tabs
use the deep-blue `modernEditorTab.activeBackground` (`#1C3C55`) with
starlight text. The base editor tab's bottom active stroke remains orange
(`tab.activeBorder` = `#EB943A`), while its top stroke is blue
(`tab.activeBorderTop` = `#41C4F7`).

`modernEditorTab.hoverBackground` and the other hover fills use an approved
accent with transparency. Their `*ActionBackground` counterparts are opaque
composites of that same accent over the theme's editor background, which keeps
the close and other action areas visually continuous when VS Code overlays
them. These derived values do not introduce additional palette hues.

The `workbench.experimental.modernUI` setting enables the native rounded tab
presentation. Radius, padding, spacing, shadows, and pill geometry remain
owned by VS Code's Modern UI CSS; they are not encoded in these theme files.
The official Modern UI color guide does not register a
`modernEditorTab.*` border role. In VS Code 1.136.1, the native tab CSS can
render both a top and bottom active-tab stroke, but its internal border
variables default to transparent. VS Code's compatibility bridge populates
those variables from `tab.activeBorder`, `tab.activeBorderTop`, and their
unfocused counterparts only when those legacy roles are supplied through
`workbench.colorCustomizations`.

When Modern UI is enabled and a fixed theme is active, the extension
therefore copies that theme's active border roles (`tab.activeBorder`,
`tab.activeBorderTop`, their unfocused counterparts, and
`tab.selectedBorderTop`) into the theme-scoped
`workbench.colorCustomizations`, leaving any value the user already set
untouched; Q writes the same roles with its generated palette.
`tab.activeBorder` supplies the bottom stroke and `tab.activeBorderTop`
supplies the top stroke. For the base LCARS theme these
are intentionally different: orange on the bottom and blue on the top. This is a VS Code runtime
requirement, not a shape override or custom CSS injection; the theme files
retain the same `tab.*` roles for legacy workbench rendering. The
implementation follows the official [Modern UI
theming reference](https://github.com/microsoft/vscode/blob/1.136.1/src/vs/workbench/contrib/modernUI/README.md),
[native tab CSS](https://github.com/microsoft/vscode/blob/1.136.1/src/vs/workbench/contrib/modernUI/browser/media/tabs.css),
[theme color reference](https://code.visualstudio.com/api/references/theme-color),
and [VS Code 1.136 release notes](https://code.visualstudio.com/updates/v1_136).

Modern UI intentionally preserves Git and problem decoration colors on
decorated editor labels, so `gitDecoration.modifiedResourceForeground` remains
visible on a working-tree file. The native
`tab.*ModifiedBorder` roles provide an additional identity-colored top border
for unsaved editor changes when
`workbench.editor.highlightModifiedTabs` is enabled. Git working-tree status
and unsaved editor state are separate signals: the `M` decoration identifies
the former, while the border identifies the latter.

`editor.background`, `terminal.background`, the editor tab strip, and panel
content use the same deep dark blue, keeping code, terminal, Problems, Output,
Debug Console, Ports, and similar panel content visually consistent. The
editor surface is derived from the approved dark neutrals:

- **Deep dark blue** `#09131A` — dark blue `#1C3C55` darkened ~69% —
  used for `editor.background`, `terminal.background`,
  `editorGroupHeader.tabsBackground`, `panel.background`, and
  `outputView.background`.
- **Deep dark gray** `#212633` — dark gray `#2F3749` darkened ~30% —
  used for `sideBar.background`.

## Panel content surfaces

Problems, Output, Debug Console, Ports, and related bottom-panel views use the
same deep `#09131A` content surface as the editor and terminal. LCARS
sets `panel.background`, `outputView.background`, and
`outputViewStickyScroll.background` to that shared surface. The existing
theme panel identity is preserved in `panelSectionHeader.background`
and `panelSectionHeader.foreground`, with the same subdued structural border
used elsewhere.

The Q generator applies the same split to every generated palette: its panel
content follows the generated editor background, while
`panelSectionHeader.*` keeps the generated panel identity pair. The static Q
fallback mirrors the base LCARS values so the first render is consistent
before runtime generation.

VS Code 1.136.1 does not expose a separate public background color for the
top panel composite bar in Modern UI; that native strip shares
`panel.background`. The supported theme configuration therefore guarantees
the dark panel content and preserves the identity-colored section-header
roles (and panel tab accents), while the native top strip follows VS Code's
shared `panel.background` behavior.

## Theme palette reference page

`theme-palettes.html` is a generated, self-contained page (open directly in a
browser, no build step) with an interactive mock VS Code window styled from
each theme's real color values — activity bar, sidebar, Modern UI tab roles,
editor with syntax-highlighted sample code, dark panel content with an
identity-colored header, status bar, and badges. A theme selector
switches between every contributed theme. Clicking any
element in the mock-up (or any color in the palette legend below it) opens an
inspector showing exactly which color role(s) it uses, with a live color
picker to edit them; editing a palette-legend color updates every role that
shares that exact color at once. The WCAG contrast table recalculates live as
colors are edited. An **Export theme JSON** button downloads the edited
result as a ready-to-use VS Code theme file. Edits are local to the browser
session only (a **Reset changes** button restores the original per theme).
Regenerate the embedded theme data with `npm run build:palette-page` after any
palette or color-role change so it stays accurate. Each theme carries its own
named palette, derived from the colors that theme actually uses and grouped
into surfaces, accents and syntax. Color edits in the inspector are restricted
to that palette — there is no free-form or native color picker, so an edit made
in the page stays within the colors its theme is built from.

## Scope

This is the approved Esper Themes palette for the fixed LCARS theme. Each RGB color is
used exactly as provided; where VS Code supports alpha, opacity is used only to
soften an overlay without introducing a new base hue. Modern UI action
backgrounds are the corresponding opaque composites required by VS Code for
overlay controls; they are not new palette hues. No source syntax colors or
diagnostic colors were lightened, darkened, or otherwise replaced. The
accessibility work changes which approved color is assigned to each VS Code
role so text remains readable on the dark-blue and dark-gray surfaces. Q is
generated at runtime from independently sampled colors and enforces the
contrast rules described in the Q section above.

## Marketplace tokenization reference

On 2026-09-07, the token organization was compared with the ten highest-install
actual color/syntax themes in the VS Code Marketplace. Install counts are a
snapshot from the public [Marketplace extension query API](https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery)
and can change over time. The raw Marketplace `Themes` category also ranks
icon-only extensions and one non-theme package, so those entries were excluded
from the tokenization sample.

| Rank | Theme | Marketplace installs | Official theme source |
| ---: | --- | ---: | --- |
| 1 | [C/C++ Themes](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools-themes) | 59,151,469 | [Microsoft/vscode-cpptools](https://github.com/microsoft/vscode-cpptools/blob/c31cb2a399af4af7d92c0e88cbda791e2898bcf9/Themes/themes/cpptools_dark_vs_new.json) |
| 2 | [PowerShell](https://marketplace.visualstudio.com/items?itemName=ms-vscode.PowerShell) | 21,483,403 | [PowerShell/vscode-powershell](https://github.com/PowerShell/vscode-powershell/blob/9c5933866b74051f0312d4239584522893736c87/themes/theme-psise/theme.json) |
| 3 | [GitHub Theme](https://marketplace.visualstudio.com/items?itemName=GitHub.github-vscode-theme) | 20,002,705 | [primer/github-vscode-theme](https://github.com/primer/github-vscode-theme/blob/cd78e5e4e7bcf132a6f428ae0f32264bb1b729cf/src/theme.js) |
| 4 | [One Dark Pro](https://marketplace.visualstudio.com/items?itemName=zhuangtongfa.Material-theme) | 12,701,527 | [Binaryify/OneDark-Pro](https://github.com/Binaryify/OneDark-Pro/blob/54c3280b29f2c2ed9751e5ca4e071380b7b42205/themes/OneDark-Pro.json) |
| 5 | [Dracula Theme Official](https://marketplace.visualstudio.com/items?itemName=dracula-theme.theme-dracula) | 10,908,466 | [dracula/visual-studio-code](https://github.com/dracula/visual-studio-code/blob/1b9ecf4d7e0c8cc2e2e890a7a41ad1db5fff1e6c/src/dracula.yml) |
| 6 | [Atom One Dark](https://marketplace.visualstudio.com/items?itemName=akamud.vscode-theme-onedark) | 7,323,105 | [akamud/vscode-theme-onedark](https://github.com/akamud/vscode-theme-onedark/blob/a8be970644982221f9b61fb1c4b3da74b4beab79/themes/OneDark.json) |
| 7 | [Material Theme](https://marketplace.visualstudio.com/items?itemName=Equinusocio.vsc-material-theme) | 4,281,535 | [vira-themes/vira-theme-support](https://github.com/vira-themes/vira-theme-support) |
| 8 | [Ayu](https://marketplace.visualstudio.com/items?itemName=teabyii.ayu) | 4,192,558 | [ayu-theme/vscode-ayu](https://github.com/ayu-theme/vscode-ayu/blob/444ef92911cb75c3933c8003e3a7c79b6b6c914f/ayu-dark.json) |
| 9 | [Monokai Pro](https://marketplace.visualstudio.com/items?itemName=monokai.theme-monokai-pro-vscode) | 4,140,431 | [monokai.pro](https://monokai.pro) and the packaged `Monokai Pro.json` theme |
| 10 | [Winter is Coming](https://marketplace.visualstudio.com/items?itemName=johnpapa.winteriscoming) | 3,734,274 | [johnpapa/vscode-winteriscoming](https://github.com/johnpapa/vscode-winteriscoming/blob/260547834cb6ac37dd5b8bb5842cc1c8d3164946/themes/WinterIsComing-dark-blue-color-theme.json) |

All ten use variants of the following TextMate families:

| Token family | Common TextMate/semantic scopes |
| --- | --- |
| Keywords and operators | `keyword`, `keyword.control`, `keyword.operator`, `punctuation.definition.keyword` |
| Storage and modifiers | `storage`, `storage.type`, `storage.modifier` |
| Classes and types | `entity.name.type`, `entity.name.class`, `entity.other.inherited-class`, `support.type` |
| Functions and methods | `entity.name.function`, `variable.function`, `support.function`, `meta.method-call` |
| Parameters and properties | `variable.parameter`, `variable.other.property`, `variable.other.object.property`, `meta.property-name` |
| Variables and constants | `variable`, `variable.language`, `variable.other.constant`, `constant.numeric`, `constant.language` |
| Support/library symbols | `support.function`, `support.type`, `support.class`, `support.constant`, `support.variable` |
| Decorators and annotations | `meta.decorator`, `entity.name.function.decorator`, `support.token.decorator` |
| Markup and structure | `markup.*`, `punctuation.*`, `meta.*`, `entity.name.tag`, `entity.other.attribute-name` |
| Diagnostics | `invalid`, `invalid.illegal`, `invalid.deprecated` |

The strongest differences are implementation choices rather than different
fundamental taxonomies:

- C/C++ Themes, PowerShell, GitHub Theme, and Winter is Coming favor broad
  family rules with targeted language selectors.
- One Dark Pro, Dracula, Atom One Dark, Material Theme, Ayu, and Monokai Pro
  add more language-qualified rules for JavaScript/TypeScript, PHP, Python,
  Rust, Java, CSS, markup, and embedded syntaxes.
- Ayu and One Dark Pro provide the most useful semantic distinctions, including
  `class`, `interface`, `struct`, `enumMember`, `function`, `method`, `macro`,
  `variable.constant`, and `variable.defaultLibrary`.
- No sampled theme injects a grammar to split individual TypeScript modifier
  words. Theme files consume scopes produced by language grammars; grammar
  injections belong in language extensions.

Esper Themes already follows the common taxonomy and has a broader semantic map than
most of the sample ([`tokenColors`](https://github.com/doctorallen/esper-themes/blob/main/themes/LCARS-color-theme.json#L132-L452),
[`semanticTokenColors`](https://github.com/doctorallen/esper-themes/blob/main/themes/LCARS-color-theme.json#L452-L484)).
The top-ten comparison supports targeted alias and semantic-token refinements,
not a replacement of the current palette or taxonomy.

The resulting refinement adds canonical `constant.character.escape` and
`constant.regexp` coverage, recognizes `invalid.deprecated`, and maps semantic
`variable.constant` and `method.defaultLibrary` tokens to the existing barley
accent. No new colors or grammar injections were added.

## Accessibility role changes

| Role | Previous approved color | New approved color | Reason |
| --- | --- | --- | --- |
| Tag and attribute tokens | True mauve `#C082A9` | African violet `#BAA4E5` | On dark blue, true mauve measured 3.84:1 and failed normal-text AA. African violet measures 5.22:1. |
| Error and invalid-token text | Mars `#FF2200` | Pale orange-red `#FF977B` | Mars red provides only 3.00:1 on dark blue, suitable for a graphical error marker but not normal text. Pale orange-red is readable as diagnostic text. |
| Deleted-resource text | Mars `#FF2200` | Pale orange-red `#FF977B` | Keeps deleted file names readable in source control decorations. |
| Terminal red text | Red `#CF4F4F` and light orange-red `#FF6753` | Pale orange-red `#FF977B` | The previous terminal reds are too dark for normal-size terminal text on dark blue. |
| Terminal blue text | Medium dark blue `#2A7193` | Bright blue `#41C4F7` | Bright blue gives stronger terminal-text contrast. |
| Terminal magenta text | True mauve `#C082A9` | African violet `#BAA4E5` | African violet meets normal-text AA on dark blue; true mauve does not. |
| Secondary-button text | True mauve `#C082A9` | African violet `#BAA4E5` | Dark-blue labels on true mauve measured 3.84:1. African violet raises that to 5.22:1, meeting normal-text AA. |
| Diff line fills | Blue `#37A6D1` and orange-red `#E7442A` | Matching border colors | Replaces colored text backgrounds with borders, preserving readable inherited diff text. |
| Function and method tokens | Barley `#EDB378` | African violet `#BAA4E5` | Reduces the concentration of warm orange tones in code while retaining AA contrast. |
| Type and class tokens | African violet `#BAA4E5` | Barley `#EDB378` | Keeps barley in the syntax palette on the less frequent type roles, balancing warm and cool token colors. |
| Keyword, operator, storage, and storage-type tokens | Shared bright blue `#41C4F7` | African violet `#BAA4E5`, bright blue `#41C4F7`, and pale orange-red `#FF977B` | Follows the common Marketplace taxonomy without importing its colors: language keywords, operators, modifiers, and declaration types have independent roles. |
| TypeScript/JavaScript class names | Barley `#EDB378` | Ghost gray `#D2D5DF` | Separates the class name from the `class` declaration keyword and keeps type names visually distinct. |
| Constants, enum members, and language variables | Shared variable accents | Named constants/enum members barley `#EDB378`; language variables ghost gray `#D2D5DF` | Follows the common constant/variable split so values such as enum members and `this` do not blend into ordinary identifiers. |
| Variables, parameters, and properties | Variables and parameters `#F3F4F7`, properties `#D2D5DF` | Variables/parameters bright blue `#41C4F7`, properties starlight `#F3F4F7` | Makes identifiers, arguments, and object members easier to distinguish in TypeScript code. |
| Library functions, constants, and variables | Shared function/type accents | Barley `#EDB378` | Separates framework/API symbols from user-defined functions and variables. |
| Namespaces and modules | Shared type accents | Ghost gray `#D2D5DF` | Gives module and namespace identifiers their own category without introducing a new hue. |
| HTML/XML tag names | African violet `#BAA4E5` | Bright blue `#41C4F7` | Separates document structure from attributes and preserves a 5.73:1 contrast ratio on the editor background. |
| HTML/XML attribute names | African violet `#BAA4E5` | Barley `#EDB378` | Gives attributes a distinct warm accent without using the same color as tag names. |
| HTML/XML tag punctuation | African violet `#BAA4E5` | Ghost gray `#D2D5DF` | Keeps angle brackets and closing syntax visually quiet so names and values remain easier to scan. |
| HTML/XML attribute names | Barley `#EDB378` | African violet `#BAA4E5` | Removes the concentration of warm tones in Angular bindings while preserving a 5.22:1 contrast ratio on the editor background. |
| HTML/XML attribute values | Almond creme `#FCC19F` | Ghost gray `#D2D5DF` | Separates literal values from names and bindings, reducing warm visual weight in template-heavy files. |
| HTML/XML attribute values | Ghost gray `#D2D5DF` | Almond creme `#FCC19F` | Restores a visible value accent after the neutral assignment made Angular templates too monochrome; attribute names remain African violet. |
| Primary button text/background | Dark blue `#1C3C55` / bright blue `#41C4F7` | Starlight `#F3F4F7` / dark blue `#1C3C55` | VS Code applies 40% opacity to disabled buttons; a light foreground remains more readable while the bright-blue border preserves focus and LCARS emphasis. |
| Active editor selection | African violet `#BAA4E5` with dark-blue text `#1C3C55` | Dirty mauve `#7A506D` at 25% opacity with starlight text `#F3F4F7` | Makes the lavender selection more visible while allowing the bright syntax colors to remain readable; the resulting starlight contrast is approximately 9.3:1 on the editor surface. |
| Active editor selection | Dirty mauve `#7A506D` at 25% opacity | Dirty mauve `#7A506D` at 50% opacity (`#7A506D80`) | At 25% the selection composited to 1.21:1 against the editor, as faint as the faintest in the top 30. At 50% it reaches 1.57:1, just above the field median of 1.52, and every approved syntax color inside it still reads at 3.96:1 or better. |
| Variables and parameters | Bright blue `#41C4F7` | Starlight `#F3F4F7` | Bright blue also carried numbers, operators, modifiers and tags, so six roles read as one color. Plain identifiers now read as text. |
| Numbers and language constants | Bright blue `#41C4F7` | True mauve `#C082A9` | Separates numbers from operators; true mauve reads at 6.26:1 on the editor, where it failed only on dark blue. |
| Function and method tokens | African violet `#BAA4E5` | Bluey `#8899FF` | Functions shared the keyword violet; Bluey reads at 7.19:1 and sits ΔE 8.9 from it. |
| Type tokens | Barley `#EDB378` | Almond `#D29B7F` | Barley sat ΔE 5.7 from the almond-creme strings. Almond is ΔE 12.1 from strings and 8.1 from barley, which keeps constants and library symbols. |
| String escapes | Bright blue `#41C4F7` | Orange `#EB943A` | An escape now stands out from the string around it. |
| Regular expressions | Almond creme `#FCC19F` | Blue `#37A6D1` | A pattern now stands out from ordinary strings. |
| Diff lines | Unstyled | Inserted blue `#37A6D1`, deleted pale orange-red `#FF977B`, changed butterscotch `#EA9C72`, headers light gray `#9EA5BA` | The same colors as the inserted-diff border and the deleted and modified Git decorations. |
| Bracket pairs | VS Code defaults | Bright blue `#41C4F7`, African violet `#BAA4E5`, barley `#EDB378`; unexpected pale orange-red `#FF977B` | The defaults are colors outside the approved palette. |
| Inactive line numbers | Light gray `#9EA5BA` | Light gray at 73% opacity, `#9EA5BABB` | 4.60:1 on the editor instead of 7.63:1, so the gutter stays below the code. |
| Active Explorer selection icons | Bright blue `#41C4F7` | Dark blue `#1C3C55` | Aligns file-type icons with the active filename and provides 5.22:1 contrast on the African-violet selection background. |
| Active Explorer selection | African violet `#BAA4E5` with dark-blue text `#1C3C55` | Dark blue `#1C3C55` with starlight text `#F3F4F7` | Replaces the lower-contrast lavender row with an AAA text treatment; the focused file remains distinct from the dark-gray sidebar. |
| Active Explorer selection icons | Dark blue `#1C3C55` | Bright blue `#41C4F7` | Restores a visible file-type accent on the dark active row while retaining 5.73:1 contrast. |
| Explorer hover selection | Medium dark gray `#52596E` with starlight text `#F3F4F7` | 25% barley `#EDB37840` over dark gray with starlight text `#F3F4F7` | Softens the hover state while retaining a visible yellow accent and approximately 6.48:1 text contrast against the blended sidebar surface. |
| PHP visibility and storage modifiers | Bright blue `#41C4F7` | African violet `#BAA4E5` | Separates `public`, `private`, `protected`, `readonly`, and related modifiers from the bright-blue `function` keyword. |
| TypeScript/JavaScript class keywords | Bright blue `#41C4F7` | Barley `#EDB378` | Aligns `class` with the class name while keeping `export` in the bright-blue keyword family. |
| TypeScript/JavaScript class keywords | Barley `#EDB378` | African violet `#BAA4E5` | Separates the `class` keyword from the barley class name while keeping `export` bright blue. |
| Previous TypeScript `private` and `readonly` modifiers | Shared bright blue `#41C4F7` | `private` African violet `#BAA4E5`; `readonly` bright blue `#41C4F7` | Historical entry: the removed grammar injection had assigned separate scopes to the two modifier words. |
| TypeScript modifier tokenization | Custom `private`/`readonly` grammar scopes | Generic `storage.modifier` fallback | Removes the theme-specific grammar injection and follows the common Marketplace theme pattern; semantic modifier tokens remain available when a language server supplies them. |

Mars red `#FF2200`, butterscotch `#EA9C72`, light orange-red `#FF6753`, and
orange-red `#E7442A` remain in the theme as non-text diagnostic colors:
editor squiggles, overview-ruler/gutter markers, and diff borders. Diagnostic
messages use text and icons in addition to color. Red `#CF4F4F` is retained
in the approved palette but is no longer assigned to a tab role; unfocused tabs
use the same identity-colored borders as their focused counterparts.

VS Code exposes one shared `button.secondary*` color set. Notification actions
such as **Always** and **Never** therefore remain the same visual class; their
distinct text labels and position provide the differentiation. A color theme
cannot assign an individual color to either action.

## Contrast targets

| Foreground | Background | Contrast | Result |
| --- | --- | ---: | --- |
| Starlight `#F3F4F7` | Dark blue `#1C3C55` | 10.45:1 | AAA |
| Starlight `#F3F4F7` | Dark gray `#2F3749` | 10.83:1 | AAA |
| Starlight `#F3F4F7` | Medium dark gray `#52596E` | 6.34:1 | AA |
| Dark blue `#1C3C55` | African violet `#BAA4E5` | 5.22:1 | AA |
| Dark blue `#1C3C55` | Bright blue `#41C4F7` | 5.73:1 | AA |
| Barley `#EDB378` | Dark gray `#2F3749` | 6.42:1 | AA |
| Starlight `#F3F4F7` | 25% barley `#EDB378` over dark gray `#2F3749` | approximately 6.48:1 | AA |
| Starlight `#F3F4F7` | 50% dirty mauve `#7A506D` over deep dark blue `#09131A` | approximately 10.8:1 | AAA |

## Approved palette and usage

| Color | Hex | Current usage |
| --- | --- | --- |
| African violet | `#BAA4E5` | Active selections, suggestion selections, secondary buttons, keywords, function/method tokens, decorators, PHP visibility/storage modifiers, TypeScript/JavaScript class keywords, HTML/XML attribute names, terminal magenta. |
| Almond | `#D29B7F` | Type tokens, terminal green and untracked Git decorations. |
| Almond creme | `#FCC19F` | Hovered primary and secondary buttons, active line numbers, HTML/XML attribute values, string tokens, bright terminal green. |
| Barley | `#EDB378` | Activity-bar icons, sidebar and panel headings, the third bracket-pair level, named constants, enum members, library functions/constants/variables, labels, LCARS tab modified borders, 25% translucent Explorer hover background, and bright terminal yellow. |
| Bluey | `#8899FF` | Function and method tokens, and the word-highlight overview-ruler marker. |
| Brown | `#895129` | Bracket-match background. |
| Butterscotch | `#EA9C72` | Modified Git decorations and warning squiggle. |
| Dirty mauve | `#7A506D` | 50% opacity active editor selection overlay and find-match overview-ruler marker. |
| Dusty mauve | `#9D698A` | Selection-highlight overview-ruler marker. |
| Lilac | `#8A72A7` | Strong word-highlight overview-ruler marker and hint squiggle. |
| Mars | `#FF2200` | Error squiggle and error indicator only; never normal text. |
| Orange | `#EB943A` | Active links, the base active-tab stripe, string escapes, and terminal yellow. |
| Red | `#CF4F4F` | Approved palette color reserved for future diagnostic or decorative use; not assigned to a current tab role. |
| Subdued sienna | `#C47D69` | Modified overview-ruler marker. |
| True mauve | `#C082A9` | Number and language-constant tokens, and badge backgrounds with dark-blue foreground text. |
| Blue | `#37A6D1` | Regular-expression tokens, inserted diff lines, the informational squiggle and the inserted-diff border. |
| Bright blue | `#41C4F7` | Focus rings, links, input/widget borders, primary-button borders, active Explorer selection icons, operators, storage/modifier tokens, export and PHP function keywords, HTML/XML tag names, the first bracket-pair level, terminal blue, and terminal cyan. |
| Dark blue | `#1C3C55` | Activity bar, panel, title-bar, inactive-tab, primary-button, and active Explorer selection backgrounds. |
| Dark gray | `#2F3749` | Status bar, widgets, inputs, dropdowns, and line-highlight backgrounds. |
| Deep dark blue | `#09131A` | Editor, terminal, and editor tab-strip backgrounds (dark blue darkened ~69%). |
| Deep dark gray | `#212633` | LCARS sidebar background (dark gray darkened ~30%). |
| Ghost gray | `#D2D5DF` | Secondary text, inactive labels, language variables, namespaces/modules, class names, library types/classes, HTML/XML tag punctuation, terminal white, and inactive tabs. |
| Light gray | `#9EA5BA` | Comments, diff headers, placeholders, and inactive line numbers at 73% opacity. |
| Light orange-red | `#FF6753` | Added-line gutter indicator only; never normal text. |
| Medium dark blue | `#2A7193` | Minimap background and hovered primary buttons. |
| Medium dark gray | `#52596E` | Hover states, section headers, inactive selections, and indent guides. |
| Orange-red | `#E7442A` | Deleted-line gutter and removed-diff border. |
| Pale orange-red | `#FF977B` | Error text, invalid tokens, storage-type declaration tokens, deleted-resource text, editor cursor, headings, and terminal red. |
| Primary gray | `#6D748C` | Whitespace markers and bright terminal black. |
| Starlight | `#F3F4F7` | Main editor, object properties, buttons, sidebar, widget, terminal, tab, title-bar, status-bar, and Explorer hover text. |
