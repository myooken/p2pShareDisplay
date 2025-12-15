#!/usr/bin/env node
/**
 * Collect NOTICE files from node_modules based on licenses.json (license-checker output).
 * Copies them into docs/licenses/notices using a sanitized package identifier.
 *
 * 
 * - Apache-2.0 等で NOTICE がある依存のファイルを docs/licenses/notices に集約する
 * - パッケージ名はファイル名に使えるように "/" を "__" に置換して保存
 */
import fs from "node:fs";
import path from "node:path";

const LICENSES_JSON = "licenses.json";
const NOTICES_DIR = path.join("docs", "licenses", "notices");
const REPORTS_DIR = "reports";

const safeNoticeName = (pkgId) => `${pkgId.replace(/\//g, "__")}.NOTICE.txt`;

// JSON を読み込み（license-checker の出力を前提）
const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// まず licenses.json の有無を確認
if (!fs.existsSync(LICENSES_JSON)) {
    console.error(`::error ::${LICENSES_JSON} not found. Run license-checker first.`);
    process.exit(1);
}

const data = readJSON(LICENSES_JSON); // 依存ごとの情報を読む
fs.mkdirSync(NOTICES_DIR, { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const results = [];
let copied = 0;
let missing = 0;

for (const [pkgId, info] of Object.entries(data)) {
    if (!info.noticeFile) continue; // NOTICE がない依存はスキップ

    const dest = path.join(NOTICES_DIR, safeNoticeName(pkgId));
    const result = { package: pkgId, source: info.noticeFile, dest, status: "" };

    try {
        const content = fs.readFileSync(info.noticeFile, "utf8"); // node_modules 側から読む
        fs.writeFileSync(dest, content); // docs/licenses/notices に保存
        result.status = "copied";
        copied += 1;
    } catch (err) {
        result.status = "missing-source";
        result.error = err.message;
        missing += 1;
        console.warn(`::warning ::NOTICE missing for ${pkgId}: ${err.message}`);
    }

    results.push(result); // レポート用に結果を集約
}

fs.writeFileSync(path.join(REPORTS_DIR, "collect-notices.json"), JSON.stringify(results, null, 2));

console.log(`[notice] copied ${copied} NOTICE file(s), missing ${missing}.`);

if (missing > 0) {
    process.exitCode = 1;
}
