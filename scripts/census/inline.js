"use strict";
// Fills a page template with the browser-side code both pages share: the theme
// analyzer, the specimen renderer with its icons, and the renderer's stylesheet,
// plus whatever data the caller passes. Each placeholder must be present.
const fs = require("fs");
const path = require("path");

const read = file => fs.readFileSync(path.join(__dirname, file), "utf8");
const safe = json => json.replace(/<\//g, "<\\/");

function fillTemplate(templatePath, extra = {}) {
  const specimen = read("specimen.js").replace(
    'typeof module !== "undefined" ? require("./codicons.json") : /*ICONS*/{}',
    safe(read("codicons.json").trim())
  );
  // Each module is wrapped so its top-level names stay out of the page's scope;
  // they publish themselves on window (EsperAnalyze, EsperReport, EsperSpecimen).
  const wrap = code => `(() => {\n${code}\n})();`;
  const fills = {
    "/*ANALYZE_JS*/": wrap(read("analyze-theme.js")),
    "/*REPORT_JS*/": wrap(read("report.js")),
    "/*SPECIMEN_JS*/": specimen,
    "/*SPECIMEN_CSS*/": require("./specimen").css,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, safe(v)])),
  };
  let page = fs.readFileSync(templatePath, "utf8");
  for (const [placeholder, value] of Object.entries(fills)) {
    if (placeholder === "/*REPORT_JS*/" && !page.includes(placeholder)) continue;
    if (!page.includes(placeholder)) throw new Error(`${path.basename(templatePath)} has no ${placeholder} placeholder.`);
    page = page.split(placeholder).join(value);
  }
  return page;
}

module.exports = { fillTemplate };
