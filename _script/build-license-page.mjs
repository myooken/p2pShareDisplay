#!/usr/bin/env node
/**
 * Build docs/licenses index files without inlining license text.
 * - Copies the scan outputs into docs/public
 * - Emits index.md / index.html that simply link to the raw text assets
 */
import fs from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join("docs", "licenses");
const LICENSE_TEXTS_DIR = path.join(DOCS_DIR, "texts");
const NOTICES_DIR = path.join(DOCS_DIR, "notices");
const INDEX_PATH = path.join(DOCS_DIR, "index.md");
const INDEX_HTML_PATH = path.join(DOCS_DIR, "index.html");
const ATTRIBUTION_PATH = path.join(DOCS_DIR, "ATTRIBUTION.md");
const ROOT_THIRD_PARTY = "THIRD-PARTY-LICENSES.md";
const DOCS_THIRD_PARTY = path.join(DOCS_DIR, "THIRD-PARTY-LICENSES.md");
const ROOT_LICENSES_JSON = "licenses.json";
const DOCS_LICENSES_JSON = path.join(DOCS_DIR, "licenses.json");
const PROJECT_LICENSE_PATH = "LICENSE";
const DOCS_PROJECT_LICENSE = path.join(DOCS_DIR, "PROJECT-LICENSE.txt");
const PUBLIC_LICENSES_DIR = path.join("public", "licenses");

fs.mkdirSync(LICENSE_TEXTS_DIR, { recursive: true });
fs.mkdirSync(NOTICES_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_LICENSES_DIR, { recursive: true });

const copyIfExists = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
};

const copyDirIfExists = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
};

const listFiles = (dir, predicate) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter(predicate).sort() : [];

// Copy root artifacts into docs for publishing
copyIfExists(ROOT_THIRD_PARTY, DOCS_THIRD_PARTY);
copyIfExists(ROOT_LICENSES_JSON, DOCS_LICENSES_JSON);
copyIfExists(PROJECT_LICENSE_PATH, DOCS_PROJECT_LICENSE);

const licenseTextFiles = listFiles(LICENSE_TEXTS_DIR, (f) => f.toLowerCase().endsWith(".txt"));
const noticeFiles = listFiles(NOTICES_DIR, (f) => f.toLowerCase().endsWith(".txt"));

// Markdown index (keeps texts external)
const lines = [];
lines.push("# Licenses");
lines.push("");
lines.push("## This Project");
if (fs.existsSync(DOCS_PROJECT_LICENSE)) {
  lines.push("- [PROJECT-LICENSE.txt](PROJECT-LICENSE.txt)");
} else {
  lines.push("- (LICENSE file not found)");
}
lines.push("");
lines.push("## Third-Party Summary");
if (fs.existsSync(DOCS_THIRD_PARTY)) {
  lines.push("- [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)");
}
if (fs.existsSync(DOCS_LICENSES_JSON)) {
  lines.push("- [licenses.json](licenses.json)");
}
if (!fs.existsSync(DOCS_THIRD_PARTY) && !fs.existsSync(DOCS_LICENSES_JSON)) {
  lines.push("- No summary files found.");
}
lines.push("");
lines.push("## License Texts");
if (licenseTextFiles.length === 0) {
  lines.push("- No license texts found in docs/licenses/texts.");
} else {
  for (const file of licenseTextFiles) {
    lines.push(`- [${file}](texts/${file})`);
  }
}
lines.push("");
lines.push("## Notices");
if (noticeFiles.length === 0) {
  lines.push("- No NOTICE files required.");
} else {
  for (const file of noticeFiles) {
    lines.push(`- [${file}](notices/${file})`);
  }
}
lines.push("");
if (fs.existsSync(ATTRIBUTION_PATH)) {
  lines.push("## Attribution");
  lines.push("- [ATTRIBUTION.md](ATTRIBUTION.md)");
  lines.push("");
}

fs.writeFileSync(INDEX_PATH, `${lines.join("\n")}\n`);
console.log(`[docs] Wrote ${INDEX_PATH}`);

// Simple HTML index (links only)
const html = [];
html.push("<!doctype html>");
html.push('<html lang="en">');
html.push("<head>");
html.push('  <meta charset="utf-8" />');
html.push("  <title>Licenses</title>");
html.push("  <style>");
html.push("    :root { color-scheme: light dark; }");
html.push("    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; line-height: 1.5; padding: 24px; max-width: 960px; margin: 0 auto; }");
html.push("    h1, h2 { margin-top: 0; }");
html.push("    ul { padding-left: 20px; }");
html.push("    section { margin-bottom: 24px; }");
html.push("    a { color: #2563eb; }");
html.push("  </style>");
html.push("</head>");
html.push("<body>");
html.push("  <h1>Licenses</h1>");
html.push("  <section>");
html.push("    <h2>This Project</h2>");
if (fs.existsSync(DOCS_PROJECT_LICENSE)) {
  html.push('    <ul><li><a href="./PROJECT-LICENSE.txt">PROJECT-LICENSE.txt</a></li></ul>');
} else {
  html.push("    <p>(LICENSE file not found)</p>");
}
html.push("  </section>");
html.push("");
html.push("  <section>");
html.push("    <h2>Third-Party Summary</h2>");
const summaryLinks = [];
if (fs.existsSync(DOCS_THIRD_PARTY)) {
  summaryLinks.push('<a href="./THIRD-PARTY-LICENSES.md">THIRD-PARTY-LICENSES.md</a>');
}
if (fs.existsSync(DOCS_LICENSES_JSON)) {
  summaryLinks.push('<a href="./licenses.json">licenses.json</a>');
}
if (summaryLinks.length > 0) {
  html.push("    <ul>");
  for (const link of summaryLinks) {
    html.push(`      <li>${link}</li>`);
  }
  html.push("    </ul>");
} else {
  html.push("    <p>No summary files found.</p>");
}
html.push("  </section>");
html.push("");
html.push("  <section>");
html.push("    <h2>License Texts</h2>");
if (licenseTextFiles.length === 0) {
  html.push("    <p>No license texts found in docs/licenses/texts.</p>");
} else {
  html.push("    <ul>");
  for (const file of licenseTextFiles) {
    html.push(`      <li><a href="./texts/${file}">${file}</a></li>`);
  }
  html.push("    </ul>");
}
html.push("  </section>");
html.push("");
html.push("  <section>");
html.push("    <h2>Notices</h2>");
if (noticeFiles.length === 0) {
  html.push("    <p>No NOTICE files required.</p>");
} else {
  html.push("    <ul>");
  for (const file of noticeFiles) {
    html.push(`      <li><a href="./notices/${file}">${file}</a></li>`);
  }
  html.push("    </ul>");
}
html.push("  </section>");
if (fs.existsSync(ATTRIBUTION_PATH)) {
  html.push("  <section>");
  html.push("    <h2>Attribution</h2>");
  html.push('    <ul><li><a href="./ATTRIBUTION.md">ATTRIBUTION.md</a></li></ul>');
  html.push("  </section>");
}
html.push("</body>");
html.push("</html>");

fs.writeFileSync(INDEX_HTML_PATH, `${html.join("\n")}\n`);
console.log(`[docs] Wrote ${INDEX_HTML_PATH}`);

copyIfExists(INDEX_PATH, path.join(PUBLIC_LICENSES_DIR, "index.md"));
copyIfExists(INDEX_HTML_PATH, path.join(PUBLIC_LICENSES_DIR, "index.html"));
copyIfExists(DOCS_THIRD_PARTY, path.join(PUBLIC_LICENSES_DIR, "THIRD-PARTY-LICENSES.md"));
copyIfExists(DOCS_LICENSES_JSON, path.join(PUBLIC_LICENSES_DIR, "licenses.json"));
copyIfExists(DOCS_PROJECT_LICENSE, path.join(PUBLIC_LICENSES_DIR, "PROJECT-LICENSE.txt"));
copyIfExists(ATTRIBUTION_PATH, path.join(PUBLIC_LICENSES_DIR, "ATTRIBUTION.md"));
copyDirIfExists(LICENSE_TEXTS_DIR, path.join(PUBLIC_LICENSES_DIR, "texts"));
copyDirIfExists(NOTICES_DIR, path.join(PUBLIC_LICENSES_DIR, "notices"));
