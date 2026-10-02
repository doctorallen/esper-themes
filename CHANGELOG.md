# Change Log

All notable changes to the "esper-themes" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Replicant, Oblivion, Synthwave, Tomcat, Fellowship, and Cooper themes, built from Deckard's webview theme palettes.
- README screenshots of every theme, regenerated with `npm run capture:screenshots`.
- Bluey and Bluey Night themes, built from colors sampled out of the Heeler family artwork.
- `theme-census.html` (`npm run build:census-page`) measures the thirty most-installed VS Code themes against Esper's, follows the regrade version by version in Modern UI specimens, and documents every theme's named palette, accessibility audit and color-theory recipes. It replaces `theme-palettes.html`.
- Helix theme, a long-lived custom syntax palette on Replicant's workbench.
- A mark for every theme (`images/logos/mark-<theme>.svg`), drawn from its source material in its own colours and shown in the README table.
- Mix theme and the **Esper Themes: Mix Themes** command: one theme's workbench, editor background included, around another theme's syntax colours, each colour lifted until it reads on the new ground as well as it read on its own.

### Changed

- The film themes' dark editors sit at OKLCH lightness 0.19, where GitHub Dark and Ayu Dark put theirs, instead of near black, and the chrome is held to a small step above them. LCARS keeps its ground.
- No two syntax roles are a shade apart: the build fails on any pair under ΔE 6, and every palette was regraded to pass, using 6-7 hue families instead of a median of 5.
- Plain variables and parameters read as text; numbers, functions and types in LCARS each have their own approved color.
- Bracket-pair colors come from each theme's accents instead of VS Code's defaults.
- Diff and patch files are colored, string escapes and regular expressions have their own colors, and line numbers sit just over AA so the gutter stays below the code.
- HTML attribute names and `this` are italic; markup headings are bold.
- LCARS's selection is 50% dirty mauve, up from 25%.
- Quick Open matches, find and symbol highlights, peek views, the modified gutter mark, inlay hints, merge conflicts, the progress bar, scrollbars and input validation take each theme's colors instead of VS Code's stock blues and oranges.
- Bright terminal colors are a visible step brighter than the normal ones instead of repeating them.
- No two syntax roles read as one color to a red-green color-blind reader: the build checks every pair as deuteranopes and protanopes see it, LCARS included.
- Pane boundaries (the side bar, Modern UI surface frames, the panel and split editors) are visible edges in every theme, halfway between the old hairline and WCAG's 3:1, and LCARS badge text clears AA.

- The LCARS mark is redrawn from the Enterprise-D blueprints: the phaser strip rings the saucer, the dome section is an egg, the hull flares to a squared stern, the nacelles taper to their bussard caps, and the pylons sweep from the hull's rear flanks.
- New Marketplace icon: a folded-paper prism splitting one line into three theme colours, above the Esper wordmark; the prism takes Synthwave's palette and the wordmark stays Esper amber. `images/logos/` holds the same icon and the prism alone in every theme's colours.
- Replicant, Oblivion, Synthwave, Tomcat, and Fellowship follow Deckard's regraded palettes: the fully saturated cyans and greens are softened a step with their hues kept, Fellowship's inks are deepened, and Oblivion's activity bar shares the editor's ground.
- Renamed the extension from LCARS (`esper-lcars`) to Esper Themes (`esper-themes`); commands are now `esperThemes.*`.

### Removed

- The Picard, Troi, Data, and Crusher themes.

### Fixed

- Active editor tabs show their top and bottom borders under VS Code's Modern UI.
- Mermaid diagrams in the markdown preview draw their edges and node borders in the theme's accent instead of VS Code's steel-blue default, which all but vanished on the darker themes.

## [0.2.0]

- Initial release
