# Change Log

All notable changes to the "esper-themes" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Replicant, Oblivion, Synthwave, Tomcat, Fellowship, and Cooper themes, built from Deckard's webview theme palettes.
- README screenshots of every theme, regenerated with `npm run capture:screenshots`.
- Bluey and Bluey Night themes, built from colors sampled out of the Heeler family artwork.
- `theme-palettes.html` covers every theme, each with its own named palette.
- Helix theme, a long-lived custom syntax palette on Replicant's workbench.
- A mark for every theme (`images/logos/mark-<theme>.svg`), drawn from its source material in its own colours and shown in the README table.

### Changed

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
