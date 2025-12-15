#!/usr/bin/env node
/**
 * Build docs/licenses/index.md for GitHub Pages consumption.
 * - Embeds project license
 * - Lists available license texts and NOTICE files
 * - Copies THIRD-PARTY-LICENSES.md into docs/licenses for web access
 *
 * 
 * - docs/licenses を走査して index.md を自動生成（追加されたテキスト/NOTICE が自動で反映される）
 * - ルートの THIRD-PARTY-LICENSES.md / licenses.json も docs 配下にコピーして Pages で閲覧可能にする
 */
import fs from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join("docs", "licenses");
const LICENSE_TEXTS_DIR = path.join(DOCS_DIR, "texts");
const NOTICES_DIR = path.join(DOCS_DIR, "notices");
const INDEX_PATH = path.join(DOCS_DIR, "index.md");
const ATTRIBUTION_PATH = path.join(DOCS_DIR, "ATTRIBUTION.md");
const ROOT_THIRD_PARTY = "THIRD-PARTY-LICENSES.md";
const DOCS_THIRD_PARTY = path.join(DOCS_DIR, "THIRD-PARTY-LICENSES.md");
const ROOT_LICENSES_JSON = "licenses.json";
const DOCS_LICENSES_JSON = path.join(DOCS_DIR, "licenses.json");
const PROJECT_LICENSE_PATH = "LICENSE";

fs.mkdirSync(LICENSE_TEXTS_DIR, { recursive: true });
fs.mkdirSync(NOTICES_DIR, { recursive: true });

// 存在する場合のみ中身を返す（末尾改行は削る）
const readIfExists = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8").trimEnd() : "");

// THIRD-PARTY-LICENSES.md を docs にコピー（Pages から閲覧できるように）
if (fs.existsSync(ROOT_THIRD_PARTY)) {
    fs.copyFileSync(ROOT_THIRD_PARTY, DOCS_THIRD_PARTY);
}

// licenses.json もコピーして監査用の生データを公開
if (fs.existsSync(ROOT_LICENSES_JSON)) {
    fs.copyFileSync(ROOT_LICENSES_JSON, DOCS_LICENSES_JSON);
}

// docs/licenses/texts 以下のライセンス本文を列挙
const licenseTextFiles = fs
    .readdirSync(LICENSE_TEXTS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".txt"))
    .sort();

// NOTICE 一覧も列挙
const noticeFiles = fs
    .readdirSync(NOTICES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".txt"))
    .sort();

const projectLicenseText = readIfExists(PROJECT_LICENSE_PATH); // 自身の LICENSE を埋め込むために読む

const lines = [];
lines.push("# Licenses");
lines.push("");
lines.push("## This Project");
lines.push("This project is licensed under MIT.");
lines.push("");

if (projectLicenseText) {
    lines.push("<details>");
    lines.push("<summary>MIT License (full text)</summary>");
    lines.push("");
    lines.push("```text");
    lines.push(projectLicenseText);
    lines.push("```");
    lines.push("</details>");
    lines.push("");
}

lines.push("## Third-Party Summary");
if (fs.existsSync(DOCS_THIRD_PARTY)) {
    lines.push("- Third-party list: [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md)");
}
if (fs.existsSync(DOCS_LICENSES_JSON)) {
    lines.push("- Raw scan: [licenses.json](licenses.json)");
}
lines.push("");

lines.push("## License Texts");
if (licenseTextFiles.length === 0) {
    lines.push("- No license texts found in docs/licenses/texts.");
} else {
    for (const file of licenseTextFiles) {
        const id = path.basename(file, ".txt");
        const content = readIfExists(path.join(LICENSE_TEXTS_DIR, file));
        lines.push("<details>");
        lines.push(`<summary>${id}</summary>`);
        lines.push("");
        lines.push("```text");
        lines.push(content);
        lines.push("```");
        lines.push("</details>");
        lines.push("");
    }
}

lines.push("## Notices");
if (noticeFiles.length === 0) {
    lines.push("- No NOTICE files required.");
} else {
    for (const file of noticeFiles) {
        const label = file.replace(/\\.NOTICE\\.txt$/i, "");
        const content = readIfExists(path.join(NOTICES_DIR, file));
        lines.push("<details>");
        lines.push(`<summary>${label}</summary>`);
        lines.push("");
        lines.push("```text");
        lines.push(content);
        lines.push("```");
        lines.push("</details>");
        lines.push("");
    }
}

if (fs.existsSync(ATTRIBUTION_PATH)) {
    lines.push("## Attribution");
    lines.push("- See [ATTRIBUTION.md](ATTRIBUTION.md) for CC-BY credits.");
    lines.push("");
}

fs.writeFileSync(INDEX_PATH, `${lines.join("\n")}\n`);
console.log(`[docs] Wrote ${INDEX_PATH}`);
