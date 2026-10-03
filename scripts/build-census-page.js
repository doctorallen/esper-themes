#!/usr/bin/env node
// Builds theme-census.html: the thirty most-installed VS Code color themes set
// against Esper's, the regrade that study led to, and each Esper theme's named
// palette and accessibility audit. The popular themes and the earlier Esper
// versions come from the measured snapshot in docs/census/snapshot.json; the
// current Esper themes are measured from themes/ on every build, so the page
// always shows what ships.
//
// Usage: node scripts/build-census-page.js

const fs = require("fs");
const path = require("path");
const { ROLES, analyzeTheme } = require("./census/analyze-theme");
const { CONTEXT, paletteFor, auditFor, recipesFor } = require("./census/report");

const ROOT = path.join(__dirname, "..");
const PAGE = path.join(ROOT, "theme-census.html");
const TEMPLATE = path.join(__dirname, "census", "page.html");
const SNAPSHOT = path.join(ROOT, "docs", "census", "snapshot.json");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
const now = [];
const esper = {};
for (const contribution of manifest.contributes.themes) {
  if (contribution.label === "Mix") continue; // assembled from the others at runtime
  const theme = JSON.parse(fs.readFileSync(path.join(ROOT, contribution.path), "utf8"));
  const analysis = analyzeTheme(theme, contribution.uiTheme, {
    label: contribution.label, esper: true, ext: "esperinnovations.esper-themes", extName: "Esper Themes",
  });
  now.push(analysis);
  esper[contribution.label] = {
    context: CONTEXT[contribution.label] || "",
    palette: paletteFor(theme),
    primary: (theme.colors.focusBorder || "").toUpperCase(),
    audit: auditFor(theme),
    recipes: recipesFor(theme, analysis),
  };
}

const data = {
  measured: snapshot.measured,
  roles: ROLES.map(([key, label, group, stack]) => ({ key, label, group, scope: stack[stack.length - 1] })),
  extraScopes: snapshot.extraScopes,
  popular: snapshot.popular,
  light: snapshot.light,
  sets: { ...Object.fromEntries(Object.entries(snapshot.history).map(([k, v]) => [k, v.themes])), now },
  versions: [...Object.entries(snapshot.history).map(([k, v]) => [k, v.label, v.detail]), ["now", "Now", "built from themes/"]],
  esper,
};
const { fillTemplate } = require("./census/inline");
fs.writeFileSync(PAGE, fillTemplate(TEMPLATE, { "/*DATA*/": JSON.stringify(data) }));

console.log(`theme-census.html: ${snapshot.popular.length} popular themes, ${now.length} Esper themes`);
for (const t of now) {
  console.log(`  ${t.label}: ${esper[t.label].palette.length} palette colors, near-collisions ${t.nearCollisions.length}, color-blind merges ${t.cvd3}`);
}
