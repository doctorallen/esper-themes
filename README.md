# Esper Themes

High-contrast dark color themes for Visual Studio Code, including the
LCARS-inspired LCARS theme and a generated Q theme.

The root `COLOR-ACCESSIBILITY.md` file records the approved palette, its theme
roles, and the accessibility rationale for each assignment.

The Problems, Output, Debug Console, Ports, and related panel content use the
same dark surface as the editor and terminal. Panel section headers retain
each theme's identity color through the supported
`panelSectionHeader.*` roles; VS Code's Modern UI top panel strip shares the
native `panel.background` role.

## Q generated theme

Select **Q** from **Preferences: Color Theme** to enable the runtime-generated
theme. The extension creates a new dark workbench palette and readable code
foregrounds; every generated text pair is required to meet WCAG AA contrast
of at least 4.5:1, including the composited backgrounds used by selections
and hover states.

While Q is active, click **Mon Capitan** in the status bar to generate another
palette. The same action is available in the Command Palette as
**Esper Themes: Generate Q Theme**. The generated values are stored as Q-scoped VS
Code color customizations, so the fixed LCARS
theme is not changed.

## Saving generated Q themes

While Q is active, run **Esper Themes: Save Current Q Theme** from the Command Palette
and give the palette a name. Run **Esper Themes: Pick Saved Q Theme** later to restore
any saved workbench and syntax palette; saved snapshots are kept in the
extension's global storage and do not create separate theme files.

## Development

Open this folder in VS Code and press `F5` to launch an Extension Development
Host. In that window, use **Preferences: Color Theme** and select **LCARS**.

The generated `.vscode/launch.json` starts the theme with the same
Extension Host development-path pattern used by Deckard:

```text
--extensionDevelopmentPath=${workspaceFolder}
```

## Packaging

Package the extension with:

```sh
npm ci
npm run package:vsix
```

Install the resulting VSIX through **Extensions: Install from VSIX...**.

Pull requests and pushes to `master` are validated and packaged by GitHub
Actions. A push to `master` creates a GitHub Release and attaches the VSIX
when the version in `package.json` has not been released before.

