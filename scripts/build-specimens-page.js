#!/usr/bin/env node
// Builds theme-specimens.html: every Esper theme as it ships, drawn as VS Code
// draws it in either layout, with an inspector that edits any key from the
// theme's own palette, the accessibility audit and the color-theory recipes,
// all recomputed in the browser as the theme is edited. The themes are read
// from themes/ on every build, so the page always shows what ships.
//
// Usage: node scripts/build-specimens-page.js

const fs = require("fs");
const path = require("path");
const { CONTEXT } = require("./census/report");
const { fillTemplate } = require("./census/inline");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(ROOT, "theme-specimens.html");
const TEMPLATE = path.join(__dirname, "specimens", "page.html");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const themes = manifest.contributes.themes.map(contribution => ({
  label: contribution.label,
  uiTheme: contribution.uiTheme,
  theme: JSON.parse(fs.readFileSync(path.join(ROOT, contribution.path), "utf8")),
}));

const data = {
  built: new Date().toISOString().slice(0, 10),
  version: manifest.version,
  themes,
  context: {
    ...CONTEXT,
    Mix: "The shipped Mix file: Helix's workbench around LCARS's syntax. The Mix Themes command composes any pair at runtime.",
  },
};
fs.writeFileSync(PAGE, fillTemplate(TEMPLATE, { "/*DATA*/": JSON.stringify(data) }));
console.log(`theme-specimens.html: ${themes.length} themes`);
