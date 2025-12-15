#!/usr/bin/env node
/**
 * Collect NOTICE files from node_modules based on licenses.json (license-checker output).
 * Copies them into docs/licenses/notices using a sanitized package identifier.
 */
import fs from "node:fs";
import path from "node:path";

const LICENSES_JSON = "licenses.json";
const NOTICES_DIR = path.join("docs", "licenses", "notices");
const REPORTS_DIR = "reports";

const safeNoticeName = (pkgId) => `${pkgId.replace(/\//g, "__")}.NOTICE.txt`;

const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

if (!fs.existsSync(LICENSES_JSON)) {
    console.error(`::error ::${LICENSES_JSON} not found. Run license-checker first.`);
    process.exit(1);
}

const data = readJSON(LICENSES_JSON);
fs.mkdirSync(NOTICES_DIR, { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const results = [];
let copied = 0;
let missing = 0;

for (const [pkgId, info] of Object.entries(data)) {
    if (!info.noticeFile) continue;

    const dest = path.join(NOTICES_DIR, safeNoticeName(pkgId));
    const result = { package: pkgId, source: info.noticeFile, dest, status: "" };

    try {
        const content = fs.readFileSync(info.noticeFile, "utf8");
        fs.writeFileSync(dest, content);
        result.status = "copied";
        copied += 1;
    } catch (err) {
        result.status = "missing-source";
        result.error = err.message;
        missing += 1;
        console.warn(`::warning ::NOTICE missing for ${pkgId}: ${err.message}`);
    }

    results.push(result);
}

fs.writeFileSync(path.join(REPORTS_DIR, "collect-notices.json"), JSON.stringify(results, null, 2));

console.log(`[notice] copied ${copied} NOTICE file(s), missing ${missing}.`);

if (missing > 0) {
    process.exitCode = 1;
}
