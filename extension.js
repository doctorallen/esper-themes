"use strict";

const path = require("path");
const vscode = require("vscode");
const { composeThemes, generateQTheme } = require("./q-theme");
const manifest = require("./package.json");
const qThemeTemplate = require("./themes/Q-color-theme.json");

const COMMAND = "esperThemes.generateQTheme";
const SAVE_COMMAND = "esperThemes.saveQTheme";
const PICK_COMMAND = "esperThemes.pickSavedQTheme";
const THEME_NAME = "Q";
const THEME_REFRESH_FALLBACK = "Default Dark Modern";
const THEME_SCOPE = "[Q]";
const GENERATED_TOKEN_RULE_PREFIX = "Esper Themes Q generated token ";
// Rules written before the extension was renamed from LCARS still need cleanup.
const LEGACY_GENERATED_TOKEN_RULE_PREFIX = "LCARS Q generated token ";
const SAVED_Q_THEMES_KEY = "savedQThemes";
// Mix wears one theme's workbench around another theme's editor colors. Like
// Q, its theme file is only a starting point; the chosen pair is written into
// its settings scope.
const MIX_COMMAND = "esperThemes.mixThemes";
const MIX_THEME_NAME = "Mix";
const MIX_SCOPE = "[Mix]";
const MIX_TOKEN_RULE_PREFIX = "Esper Themes Mix token ";
const LAST_MIX_KEY = "lastMix";
// VS Code's Modern UI draws the active editor tab's top and bottom strokes only
// from workbench.colorCustomizations, never from a theme file, so the fixed
// themes copy these roles into their theme-scoped settings.
const MODERN_UI_SETTING = "workbench.experimental.modernUI";
const MODERN_TAB_BORDER_KEYS = [
  "tab.activeBorder",
  "tab.activeBorderTop",
  "tab.unfocusedActiveBorder",
  "tab.unfocusedActiveBorderTop",
  "tab.selectedBorderTop",
];
const FIXED_THEMES = manifest.contributes.themes.filter(theme => theme.label !== "Q");
// What a mix can draw on: every contributed theme but Mix itself. Q counts,
// and contributes whatever palette it is currently showing.
const MIX_SOURCES = manifest.contributes.themes.filter(theme => theme.label !== MIX_THEME_NAME);
const MAX_SAVED_Q_THEMES = 50;
const Q_GENERATION_MESSAGES = [
  "The trial never ends.",
  "If you can't take a little bloody nose, maybe you ought to go back home and crawl under your bed. It's not safe out here.",
  "You judge yourselves against the pitiful adversaries you've encountered so far... formatting the universe to your tiny specifications. You're not ready.",
  "That is the exploration that awaits you. Not mapping stars and studying nebulae, but charting the unknown possibilities of existence.",
  "Consciousness. It's such a drag.",
  "Jean-Luc, sometimes I think the only reason I come here is to hear your delightful variations on the word 'no'.",
  "I have no powers! Q has regular human frailties!",
  "What do I have to do to convince you people? ... Eat any good books lately?",
  "And why shouldn't they go out the window? They're so inconvenient.",
  "Microscopic entities and bureaucratic minds are the only things that will survive the death of the universe.",
];

let statusBarItem;
let mixStatusBarItem;
let generationInProgress = false;
let generationPromise;
let extensionContext;

function isGeneratedTokenRuleName(name) {
  return (
    name.startsWith(GENERATED_TOKEN_RULE_PREFIX) ||
    name.startsWith(LEGACY_GENERATED_TOKEN_RULE_PREFIX)
  );
}

function isMixTokenRuleName(name) {
  return name.startsWith(MIX_TOKEN_RULE_PREFIX);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isQThemeActive() {
  const themeName = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  return (
    themeName === THEME_NAME ||
    (typeof themeName === "string" && /(?:^|[/\\])Q-color-theme\.json$/i.test(themeName))
  );
}

function isMixThemeActive() {
  const themeName = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  return (
    themeName === MIX_THEME_NAME ||
    (typeof themeName === "string" && /(?:^|[/\\])Mix-color-theme\.json$/i.test(themeName))
  );
}

function getGlobalSetting(section) {
  const inspection = vscode.workspace.getConfiguration().inspect(section);
  return inspection && isRecord(inspection.globalValue) ? { ...inspection.globalValue } : {};
}

function hasGeneratedQColors() {
  const customizations = getGlobalSetting("workbench.colorCustomizations");
  const qColors = customizations[THEME_SCOPE];
  return isRecord(qColors) && typeof qColors["editor.background"] === "string";
}

function isSavedQTheme(value) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.savedAt === "string" &&
    isRecord(value.colors) &&
    Array.isArray(value.tokenColors) &&
    isRecord(value.semanticTokenColors)
  );
}

function getSavedQThemes() {
  if (!extensionContext) {
    return [];
  }
  const savedThemes = extensionContext.globalState.get(SAVED_Q_THEMES_KEY, []);
  return Array.isArray(savedThemes) ? savedThemes.filter(isSavedQTheme) : [];
}

function getCurrentQTheme() {
  const colors = getGlobalSetting("workbench.colorCustomizations")[THEME_SCOPE];
  if (!isRecord(colors) || typeof colors["editor.background"] !== "string") {
    return undefined;
  }

  const tokenCustomizations = getGlobalSetting("editor.tokenColorCustomizations")[THEME_SCOPE];
  const generatedRules =
    isRecord(tokenCustomizations) && Array.isArray(tokenCustomizations.textMateRules)
      ? tokenCustomizations.textMateRules.filter(
          rule =>
            isRecord(rule) &&
            typeof rule.name === "string" &&
            isGeneratedTokenRuleName(rule.name) &&
            isRecord(rule.settings) &&
            typeof rule.settings.foreground === "string"
        )
      : [];
  const semanticCustomizations = getGlobalSetting(
    "editor.semanticTokenColorCustomizations"
  )[THEME_SCOPE];
  const semanticTokenColors =
    isRecord(semanticCustomizations) && isRecord(semanticCustomizations.rules)
      ? semanticCustomizations.rules
      : qThemeTemplate.semanticTokenColors || {};

  return {
    colors: clone(colors),
    tokenColors:
      generatedRules.length > 0
        ? generatedRules.map(rule => ({
            scope: Array.isArray(rule.scope) ? [...rule.scope] : rule.scope,
            settings: { foreground: rule.settings.foreground },
          }))
        : clone(qThemeTemplate.tokenColors || []),
    semanticTokenColors: clone(semanticTokenColors),
  };
}

/**
 * Writes `overrides` into one theme's scope of a customization setting. Q
 * merges over what is there; Mix replaces the scope, since a new pair may have
 * a different set of keys from the last.
 */
async function updateThemeScopedSetting(section, overrides, scope = THEME_SCOPE, replace = false) {
  const customizations = getGlobalSetting(section);
  const currentScope = !replace && isRecord(customizations[scope]) ? customizations[scope] : {};
  customizations[scope] = { ...currentScope, ...overrides };
  await vscode.workspace
    .getConfiguration()
    .update(section, customizations, vscode.ConfigurationTarget.Global);
}

function tokenColorOverrides(generated, prefix = GENERATED_TOKEN_RULE_PREFIX) {
  return generated.tokenColors
    .filter(entry => entry.settings && typeof entry.settings.foreground === "string")
    .map((entry, index) => ({
      name: `${prefix}${index}`,
      scope: entry.scope,
      settings: { foreground: entry.settings.foreground },
    }));
}

/** Replaces the rules this extension wrote into a theme's scope, keeping the user's own. */
async function updateTokenColors(
  generated,
  scope = THEME_SCOPE,
  prefix = GENERATED_TOKEN_RULE_PREFIX,
  isOwnRule = isGeneratedTokenRuleName
) {
  const customizations = getGlobalSetting("editor.tokenColorCustomizations");
  const currentScope = isRecord(customizations[scope]) ? customizations[scope] : {};
  const existingRules = Array.isArray(currentScope.textMateRules)
    ? currentScope.textMateRules.filter(
        rule => !(isRecord(rule) && typeof rule.name === "string" && isOwnRule(rule.name))
      )
    : [];

  customizations[scope] = {
    ...currentScope,
    textMateRules: [...existingRules, ...tokenColorOverrides(generated, prefix)],
  };
  await vscode.workspace
    .getConfiguration()
    .update(
      "editor.tokenColorCustomizations",
      customizations,
      vscode.ConfigurationTarget.Global
    );
}

async function updateSemanticTokenColors(generated, scope = THEME_SCOPE, replace = false) {
  const customizations = getGlobalSetting("editor.semanticTokenColorCustomizations");
  const currentScope = isRecord(customizations[scope]) ? customizations[scope] : {};
  const currentRules = !replace && isRecord(currentScope.rules) ? currentScope.rules : {};

  customizations[scope] = {
    ...currentScope,
    rules: { ...currentRules, ...generated.semanticTokenColors },
  };
  await vscode.workspace
    .getConfiguration()
    .update(
      "editor.semanticTokenColorCustomizations",
      customizations,
      vscode.ConfigurationTarget.Global
    );
}

async function setActiveTheme(name) {
  await vscode.workspace
    .getConfiguration("workbench")
    .update("colorTheme", name, vscode.ConfigurationTarget.Global);
}

/** VS Code only re-reads a theme's customizations on a theme change, so step away and back. */
async function refreshActiveTheme(name) {
  const workbenchConfiguration = vscode.workspace.getConfiguration("workbench");
  await workbenchConfiguration.update(
    "colorTheme",
    THEME_REFRESH_FALLBACK,
    vscode.ConfigurationTarget.Global
  );
  await workbenchConfiguration.update("colorTheme", name, vscode.ConfigurationTarget.Global);
}

async function applyQTheme(generated, switchToQ) {
  await updateThemeScopedSetting("workbench.colorCustomizations", generated.colors);
  await updateTokenColors(generated);
  await updateSemanticTokenColors(generated);

  if (switchToQ && !isQThemeActive()) {
    await setActiveTheme(THEME_NAME);
  } else if (isQThemeActive()) {
    await refreshActiveTheme(THEME_NAME);
  }
}

/** A theme as a mix source: its file, or for Q the palette it is showing now. */
function loadMixSource(theme) {
  if (theme.label === THEME_NAME) {
    return getCurrentQTheme() || clone(qThemeTemplate);
  }
  return require(path.join(__dirname, theme.path));
}

function getLastMix() {
  const last = extensionContext ? extensionContext.globalState.get(LAST_MIX_KEY) : undefined;
  return isRecord(last) && typeof last.workbench === "string" && typeof last.editor === "string"
    ? last
    : undefined;
}

async function applyMix(workbenchTheme, editorTheme) {
  const mixed = composeThemes(
    loadMixSource(workbenchTheme),
    loadMixSource(editorTheme),
    MIX_THEME_NAME
  );
  await updateThemeScopedSetting("workbench.colorCustomizations", mixed.colors, MIX_SCOPE, true);
  await updateTokenColors(mixed, MIX_SCOPE, MIX_TOKEN_RULE_PREFIX, isMixTokenRuleName);
  await updateSemanticTokenColors(mixed, MIX_SCOPE, true);
  if (extensionContext) {
    await extensionContext.globalState.update(LAST_MIX_KEY, {
      workbench: workbenchTheme.label,
      editor: editorTheme.label,
    });
  }

  if (isMixThemeActive()) {
    await refreshActiveTheme(MIX_THEME_NAME);
  } else {
    await setActiveTheme(MIX_THEME_NAME);
  }
  updateMixStatusBar();
}

async function pickMixSource(part, label, lastLabel) {
  if (typeof label === "string") {
    const theme = MIX_SOURCES.find(candidate => candidate.label === label);
    if (!theme) {
      throw new Error(`Unknown theme "${label}".`);
    }
    return theme;
  }
  const selected = await vscode.window.showQuickPick(
    MIX_SOURCES.map(theme => ({
      label: theme.label,
      description: theme.label === lastLabel ? "last used" : undefined,
      theme,
    })),
    {
      title: part === "workbench" ? "Mix Themes: workbench" : "Mix Themes: editor colors",
      placeHolder:
        part === "workbench"
          ? "Which theme's workbench? (chrome, panels and the editor background)"
          : "Which theme's editor colors? (syntax for code and markdown)",
    }
  );
  return selected ? selected.theme : undefined;
}

function updateMixStatusBar() {
  if (!mixStatusBarItem) {
    return;
  }
  if (!isMixThemeActive()) {
    mixStatusBarItem.hide();
    return;
  }
  // Before the first mix, the theme file is Helix's workbench around LCARS.
  const last = getLastMix() || { workbench: "Helix", editor: "LCARS" };
  mixStatusBarItem.text = `${last.workbench} ⨯ ${last.editor}`;
  mixStatusBarItem.tooltip = "Workbench ⨯ editor colors. Click to mix two themes.";
  mixStatusBarItem.show();
}

function reportMixError(error) {
  const message = error instanceof Error ? error.message : String(error);
  void vscode.window.showErrorMessage(`Unable to mix themes: ${message}`);
}

/** Two picks, or two labels when run programmatically. */
async function runMixCommand(workbenchLabel, editorLabel) {
  try {
    if (generationPromise) {
      await generationPromise;
    }
    const last = getLastMix();
    const workbenchTheme = await pickMixSource("workbench", workbenchLabel, last && last.workbench);
    if (!workbenchTheme) {
      return;
    }
    const editorTheme = await pickMixSource("editor", editorLabel, last && last.editor);
    if (!editorTheme) {
      return;
    }
    await applyMix(workbenchTheme, editorTheme);
    await vscode.window.showInformationMessage(
      `Mix applied: ${workbenchTheme.label}'s workbench around ${editorTheme.label}'s editor colors.`
    );
  } catch (error) {
    reportMixError(error);
  }
}

function updateStatusBarVisibility() {
  if (!statusBarItem) {
    return;
  }
  if (isQThemeActive()) {
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
  updateMixStatusBar();
}

function randomQGenerationMessage() {
  const index = Math.floor(Math.random() * Q_GENERATION_MESSAGES.length);
  return Q_GENERATION_MESSAGES[index];
}

async function regenerateQTheme(switchToQ) {
  if (generationPromise) {
    return generationPromise;
  }

  generationInProgress = true;
  const currentGeneration = (async () => {
    const generated = generateQTheme(qThemeTemplate);

    await applyQTheme(generated, switchToQ);

    if (statusBarItem) {
      statusBarItem.tooltip = "Generate a new accessible Q theme";
    }
    updateStatusBarVisibility();
    return generated;
  })();
  generationPromise = currentGeneration;

  try {
    return await currentGeneration;
  } finally {
    generationInProgress = false;
    if (generationPromise === currentGeneration) {
      generationPromise = undefined;
    }
  }
}

function reportGenerationError(error) {
  const message = error instanceof Error ? error.message : String(error);
  void vscode.window.showErrorMessage(`Unable to generate the Q theme: ${message}`);
}

function savedQThemeDescription(theme) {
  const savedDate = new Date(theme.savedAt);
  return Number.isNaN(savedDate.getTime())
    ? "Saved Q theme"
    : `Saved ${savedDate.toLocaleString()}`;
}

async function runGenerateCommand() {
  try {
    if (generationPromise) {
      await generationPromise;
    }
    const generated = await regenerateQTheme(true);
    if (generated) {
      await vscode.window.showInformationMessage(randomQGenerationMessage());
    }
  } catch (error) {
    reportGenerationError(error);
  }
}

async function runSaveQThemeCommand() {
  try {
    if (generationPromise) {
      await generationPromise;
    }
    if (!isQThemeActive()) {
      await vscode.window.showInformationMessage("Select Q before saving a generated theme.");
      return;
    }

    const currentTheme = getCurrentQTheme();
    if (!currentTheme || !extensionContext) {
      await vscode.window.showInformationMessage("Generate a Q theme before saving it.");
      return;
    }

    const defaultName = `Q theme ${new Date().toISOString().slice(0, 19).replace("T", " ")}`;
    const name = await vscode.window.showInputBox({
      prompt: "Name this generated Q theme",
      value: defaultName,
      validateInput: value => (value.trim() ? undefined : "Enter a name for the theme."),
    });
    if (typeof name !== "string" || !name.trim()) {
      return;
    }

    const trimmedName = name.trim();
    const savedThemes = getSavedQThemes().filter(
      theme => theme.name.toLowerCase() !== trimmedName.toLowerCase()
    );
    const savedTheme = {
      id: `q-${Date.now()}-${savedThemes.length}`,
      name: trimmedName,
      savedAt: new Date().toISOString(),
      ...currentTheme,
    };
    await extensionContext.globalState.update(SAVED_Q_THEMES_KEY, [
      savedTheme,
      ...savedThemes,
    ].slice(0, MAX_SAVED_Q_THEMES));
    await vscode.window.showInformationMessage(`Saved Q theme "${trimmedName}".`);
  } catch (error) {
    reportGenerationError(error);
  }
}

async function runPickSavedQThemeCommand() {
  try {
    if (generationPromise) {
      await generationPromise;
    }
    const savedThemes = getSavedQThemes();
    if (savedThemes.length === 0) {
      await vscode.window.showInformationMessage(
        "No saved Q themes yet. Use Esper Themes: Save Current Q Theme while Q is active."
      );
      return;
    }

    const selected = await vscode.window.showQuickPick(
      savedThemes.map(theme => ({
        label: theme.name,
        description: savedQThemeDescription(theme),
        detail: "Apply this saved Q workbench and syntax palette",
        theme,
      })),
      { placeHolder: "Select a saved Q theme" }
    );
    if (!selected) {
      return;
    }

    await applyQTheme(selected.theme, true);
    await vscode.window.showInformationMessage(`Q theme "${selected.theme.name}" applied.`);
  } catch (error) {
    reportGenerationError(error);
  }
}

function activeFixedTheme() {
  const themeName = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  return FIXED_THEMES.find(theme => theme.label === themeName);
}

/** Adds the active fixed theme's tab strokes to its settings scope, keeping user values. */
async function synchronizeModernTabBorders() {
  const theme = activeFixedTheme();
  if (!theme || !vscode.workspace.getConfiguration().get(MODERN_UI_SETTING)) {
    return;
  }
  const { colors } = require(path.join(__dirname, theme.path));
  const scope = `[${theme.label}]`;
  const customizations = getGlobalSetting("workbench.colorCustomizations");
  const current = isRecord(customizations[scope]) ? customizations[scope] : {};
  const missing = MODERN_TAB_BORDER_KEYS.filter(
    key => typeof colors[key] === "string" && current[key] === undefined
  );
  if (missing.length === 0) {
    return;
  }
  customizations[scope] = {
    ...current,
    ...Object.fromEntries(missing.map(key => [key, colors[key]])),
  };
  await vscode.workspace
    .getConfiguration()
    .update("workbench.colorCustomizations", customizations, vscode.ConfigurationTarget.Global);
}

function reportTabBorderError(error) {
  const message = error instanceof Error ? error.message : String(error);
  void vscode.window.showErrorMessage(`Unable to apply Modern UI tab borders: ${message}`);
}

function synchronizeThemes() {
  synchronizeQTheme();
  void synchronizeModernTabBorders().catch(reportTabBorderError);
}

function synchronizeQTheme() {
  updateStatusBarVisibility();
  if (isQThemeActive() && !hasGeneratedQColors() && !generationInProgress) {
    void regenerateQTheme(false).catch(reportGenerationError);
  }
}

async function activate(context) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.name = "Mon Capitan";
  statusBarItem.text = "Mon Capitan";
  statusBarItem.tooltip = "Generate a new accessible Q theme";
  statusBarItem.command = COMMAND;
  statusBarItem.accessibilityInformation = {
    label: "Mon Capitan",
    role: "button",
  };

  mixStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  mixStatusBarItem.name = "Mix Themes";
  mixStatusBarItem.command = MIX_COMMAND;
  mixStatusBarItem.accessibilityInformation = {
    label: "Mix themes",
    role: "button",
  };

  extensionContext = context;
  context.subscriptions.push(
    statusBarItem,
    mixStatusBarItem,
    vscode.commands.registerCommand(COMMAND, runGenerateCommand),
    vscode.commands.registerCommand(MIX_COMMAND, runMixCommand),
    vscode.commands.registerCommand(SAVE_COMMAND, runSaveQThemeCommand),
    vscode.commands.registerCommand(PICK_COMMAND, runPickSavedQThemeCommand),
    vscode.window.onDidChangeActiveColorTheme(() => synchronizeThemes()),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (
        event.affectsConfiguration("workbench.colorTheme") ||
        event.affectsConfiguration("workbench.colorCustomizations") ||
        event.affectsConfiguration(MODERN_UI_SETTING)
      ) {
        synchronizeThemes();
      }
    })
  );

  synchronizeThemes();
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
