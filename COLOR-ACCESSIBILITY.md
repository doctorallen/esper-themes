# Esper Themes Color and Accessibility Log

## Character theme variants

Four additional themes reuse only colors already in the approved palette
above, each assigning one approved accent as the theme's primary identity
color for workbench UI chrome — focus rings, links, buttons,
badges, activity-bar icons, sidebar/panel titles, tabs, and the editor and
terminal background surfaces. **Code syntax highlighting (`tokenColors` and
`semanticTokenColors`) is identical across the five fixed themes** — operators,
storage, variables, parameters, tag names, and every other token role keep
the base theme's bright blue `#41C4F7` (and other syntax colors) regardless
of which character theme is active, so switching themes only changes the
"chrome" around the code, never the code's own coloring.

| Theme | File | Primary accent (UI chrome only) | Contrast on dark blue `#1C3C55` |
| --- | --- | --- | --- |
| Picard | `themes/LCARS-Picard-color-theme.json` | Pale orange-red `#FF977B` | 5.45:1 (AA) |
| Troi | `themes/LCARS-Troi-color-theme.json` | African violet `#BAA4E5` | 5.22:1 (AA) |
| Data | `themes/LCARS-Data-color-theme.json` | Barley `#EDB378` | 6.20:1 (AA) |
| Crusher | `themes/LCARS-Crusher-color-theme.json` | Bright blue `#41C4F7` | 5.73:1 (AA) |

No new colors were introduced for the fixed themes and no existing
text-safe/diagnostic-only distinctions (Mars, orange-red, light orange-red,
red) were altered. Q is the documented runtime-generated exception below.
When debugging is active, every theme uses the approved lavender `#BAA4E5`
status-bar background with dark-blue `#1C3C55` foreground text, which has a
5.22:1 contrast ratio.

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

Each theme rebrands the main workbench chrome to its primary color, so the
identity is visible in the UI around the editor: `activityBar.foreground`
(activity-bar icons), `sideBarTitle.foreground`,
`panelTitle.activeForeground`/`panelSectionHeader.foreground`,
`badge.background`, `activityBarBadge.background`, `button.secondaryBackground`,
`editorSuggestWidget.selectedBackground`, `editorBracketMatch.border`,
`tab.activeBorderTop`, `textLink.activeForeground`, and
`textBlockQuote.border` all switch from their base-theme colors (barley,
orange, true mauve, or African violet) to each theme's primary accent. The
existing dark-blue foreground text used on badges and secondary buttons
remains readable against every new primary (5.22:1–6.20:1, all AA). Diagnostic
and semantic colors — error/warning/info/hint squiggles, gutters, overview
rulers, diff borders, and Git decorations — are intentionally left unchanged
in every theme so their meaning (e.g. red = error, green = added) stays
consistent regardless of the active character theme. Major workbench section
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
addition to the legacy `tab.*` roles. Each LCARS theme explicitly defines the
full `modernTab.*` and `modernEditorTab.*` families so active, inactive, hover,
selected-action, and tab-action surfaces retain the selected character
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
(`tab.activeBorderTop` = `#41C4F7`). The character variants can use the same
split with their own identity accent on pane tabs and their darker identity
surface on editor tabs.

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

The user's theme-scoped color customizations therefore repeat each theme's
active border colors: `tab.activeBorder` supplies the bottom stroke and
`tab.activeBorderTop` supplies the top stroke. For the base LCARS theme these
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

Surface backgrounds are tinted the same way: each neutral base color (dark
blue `#1C3C55`, dark gray `#2F3749`, medium dark gray `#52596E`) is
hue-shifted toward the theme's primary accent so the activity bar, sidebar,
panel headers, status bar, title bar, tabs, dropdowns, inputs, and editor
widgets all carry a clearly visible color cast instead of staying neutral
gray/blue in every theme. Rather than a flat low-opacity blend (which only
produced a faint cast before the foreground text collided with it), each
surface is built by blending 40–45% of the primary accent into the neutral
base and then darkening the result only as much as needed to keep its
foreground text readable:

- Surfaces that also host identity-colored icons/titles
  (`activityBar.background`, `sideBar.background`,
  `panelSectionHeader.background`, which carry `activityBar.foreground`,
  `sideBarTitle.foreground`, and `panelSectionHeader.foreground` in the
  primary accent color) use a 40% hue blend, darkened until contrast against
  that same primary color is at least 4.6:1.
- Surfaces whose text stays neutral starlight (`statusBar.background`,
  `titleBar.activeBackground`/`inactiveBackground`,
  `tab.inactiveBackground`/`unfocusedInactiveBackground`,
  `input.background`, `editorWidget.background`,
  `editorSuggestWidget.background`, `editorHoverWidget.background`,
  `sideBarSectionHeader.background`, `list.inactiveSelectionBackground`,
  `statusBarItem.hoverBackground`) use a 45% hue blend, darkened until
  contrast against starlight text is at least 6:1, since white text
  tolerates a richer, darker-saturated background.

`editor.background`, `terminal.background`, the editor tab strip, and panel
content use the same deep dark blue in every theme. This keeps code, terminal,
Problems, Output, Debug Console, Ports, and similar panel content visually
consistent while allowing each character variant to retain its identity on the
sidebar, activity bar, panel headers, title bar, tabs, and other workbench
chrome. The shared editor surface stays purely derived from the approved dark
neutrals:

- **Deep dark blue** `#09131A` — dark blue `#1C3C55` darkened ~69% —
  used for `editor.background`, `terminal.background`,
  `editorGroupHeader.tabsBackground`, `panel.background`, and
  `outputView.background` in every fixed theme.
- **Deep dark gray** `#212633` — dark gray `#2F3749` darkened ~30% —
  used for `sideBar.background` in the base LCARS theme.

Each character theme keeps its sidebar tint while using the shared editor
surface:

- `editor.background` and `terminal.background` are `#09131A` in Picard,
  Troi, Data, and Crusher as well as the base LCARS theme. Shared syntax
  highlighting therefore has the same dark contrast target in every variant.
- `sideBar.background` remains tinted for Picard `#5A3D3A`, Troi `#433E56`,
  Data `#42392D`, and Crusher `#214C61`. Data also uses `#42392D` for its
  activity bar, panel section header, title bar, and inactive tab surfaces;
  this raises the barley and ghost-gray text contrast on those surfaces to at
  least 5.8:1.
- Data's suggestion-widget match text uses starlight `#F3F4F7` rather than the
  lower-contrast almond creme so highlighted results remain readable on its
  warm widget surface.

`activityBar.background` and `panelSectionHeader.background` still tint from
the standard dark blue `#1C3C55` in Picard, Troi, and Crusher. Data's darker
workbench surfaces are the exception described above; status/input/widget
surfaces retain their existing warm tint because their neutral starlight text
already exceeds 6:1 contrast.

## Panel content surfaces

Problems, Output, Debug Console, Ports, and related bottom-panel views use the
same deep `#09131A` content surface as the editor and terminal. Fixed themes
set `panel.background`, `outputView.background`, and
`outputViewStickyScroll.background` to that shared surface. The existing
theme-specific panel identity is preserved in `panelSectionHeader.background`
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
switches between the base theme, the Q fallback snapshot, and all four character
themes. Clicking any
element in the mock-up (or any color in the palette legend below it) opens an
inspector showing exactly which color role(s) it uses, with a live color
picker to edit them; editing a palette-legend color updates every role that
shares that exact color at once. The WCAG contrast table recalculates live as
colors are edited. An **Export theme JSON** button downloads the edited
result as a ready-to-use VS Code theme file. Edits are local to the browser
session only (a **Reset changes** button restores the original per theme).
Regenerate the embedded theme data from the JSON files in `themes/` after any
palette or color-role change so it stays accurate. Color edits in the
inspector are restricted to the 27 approved palette swatches (the same
colors documented in the "Approved palette and usage" table above) — there is
no free-form/native color picker, so any edit made in the page stays within
the approved Esper Themes palette.

## Scope

This is the approved Esper Themes palette for the five fixed themes. Each RGB color is
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
| Starlight `#F3F4F7` | 25% dirty mauve `#7A506D` over dark blue `#1C3C55` | approximately 9.3:1 | AAA |

## Approved palette and usage

| Color | Hex | Current usage |
| --- | --- | --- |
| African violet | `#BAA4E5` | Active selections, suggestion selections, secondary buttons, keywords, function/method tokens, decorators, PHP visibility/storage modifiers, TypeScript/JavaScript class keywords, HTML/XML attribute names, Troi tab modified borders, terminal magenta. |
| Almond | `#D29B7F` | Terminal green and untracked Git decorations. |
| Almond creme | `#FCC19F` | Hovered primary and secondary buttons, active line numbers, HTML/XML attribute values, string and regular-expression tokens, bright terminal green. |
| Barley | `#EDB378` | Activity-bar icons, sidebar and panel headings, type tokens, named constants, enum members, library functions/constants/variables, labels, LCARS/Data tab modified borders, 25% translucent Explorer hover background, and bright terminal yellow. |
| Bluey | `#8899FF` | Word-highlight overview-ruler marker. |
| Brown | `#895129` | Bracket-match background. |
| Butterscotch | `#EA9C72` | Modified Git decorations and warning squiggle. |
| Dirty mauve | `#7A506D` | 25% opacity active editor selection overlay and find-match overview-ruler marker. |
| Dusty mauve | `#9D698A` | Selection-highlight overview-ruler marker. |
| Lilac | `#8A72A7` | Strong word-highlight overview-ruler marker and hint squiggle. |
| Mars | `#FF2200` | Error squiggle and error indicator only; never normal text. |
| Orange | `#EB943A` | Active links, the base active-tab stripe, and terminal yellow. |
| Red | `#CF4F4F` | Approved palette color reserved for future diagnostic or decorative use; not assigned to a current tab role. |
| Subdued sienna | `#C47D69` | Modified overview-ruler marker. |
| True mauve | `#C082A9` | Badge backgrounds with dark-blue foreground text. |
| Blue | `#37A6D1` | Informational squiggle and inserted-diff border. |
| Bright blue | `#41C4F7` | Focus rings, links, input/widget borders, primary-button borders, active Explorer selection icons, Crusher tab modified borders, operators, storage/modifier/variable/parameter tokens, export and PHP function keywords, numeric constants, HTML/XML tag names, terminal blue, and terminal cyan. |
| Dark blue | `#1C3C55` | Activity bar, panel, title-bar, inactive-tab, primary-button, and active Explorer selection backgrounds. |
| Dark gray | `#2F3749` | Status bar, widgets, inputs, dropdowns, and line-highlight backgrounds. |
| Deep dark blue | `#09131A` | Editor, terminal, and editor tab-strip backgrounds in all five themes (dark blue darkened ~69%). |
| Deep dark gray | `#212633` | Base LCARS sidebar background (dark gray darkened ~30%); character themes use identity-tinted sidebar surfaces. |
| Ghost gray | `#D2D5DF` | Secondary text, inactive labels, language variables, namespaces/modules, class names, library types/classes, HTML/XML tag punctuation, terminal white, and inactive tabs. |
| Light gray | `#9EA5BA` | Comments, placeholders, and inactive line numbers. |
| Light orange-red | `#FF6753` | Added-line gutter indicator only; never normal text. |
| Medium dark blue | `#2A7193` | Minimap background and hovered primary buttons. |
| Medium dark gray | `#52596E` | Hover states, section headers, inactive selections, and indent guides. |
| Orange-red | `#E7442A` | Deleted-line gutter and removed-diff border. |
| Pale orange-red | `#FF977B` | Error text, invalid tokens, storage-type declaration tokens, Picard tab modified borders, deleted-resource text, editor cursor, headings, and terminal red. |
| Primary gray | `#6D748C` | Whitespace markers and bright terminal black. |
| Starlight | `#F3F4F7` | Main editor, object properties, buttons, sidebar, widget, terminal, tab, title-bar, status-bar, and Explorer hover text. |
