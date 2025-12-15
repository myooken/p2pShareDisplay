#!/usr/bin/env node
/**
 * License policy checker
 *
 * - Validates project license (MIT)
 * - Evaluates dependency licenses from licenses.json (license-checker output)
 * - Verifies required license texts / NOTICE / attribution files exist under docs/licenses
 * - Emits GitHub Actions annotations and a report for artifact upload
 */
import fs from "node:fs";
import path from "node:path";

const LICENSES_JSON = "licenses.json";
const PKG_JSON = "package.json";
const LICENSE_TEXTS_DIR = path.join("docs", "licenses", "texts");
const NOTICES_DIR = path.join("docs", "licenses", "notices");
const ATTRIBUTION_PATH = path.join("docs", "licenses", "ATTRIBUTION.md");
const REPORTS_DIR = "reports";

const EXPECTED_PROJECT_LICENSE = "MIT";

// Allow list is strict; extend when a newly added dependency uses a different allowed license.
const ALLOWED_LICENSES = new Set([
    "MIT",
    "ISC",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "Apache-2.0",
    "CC0-1.0",
    "CC-BY-3.0",
    "CC-BY-4.0",
    "Python-2.0",
]);

const DENY_LICENSES = new Set(["UNLICENSED", "UNKNOWN"]);
const DENY_PATTERNS = [/^GPL/i, /^AGPL/i, /^LGPL/i, /^MPL/i, /^CC-BY-NC/i];

const errors = [];
const warnings = [];
const missingLicenseTexts = new Set();
const missingNotices = [];

const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const safeNoticeName = (pkgId) => `${pkgId.replace(/\//g, "__")}.NOTICE.txt`;

const ensureReportsDir = () => fs.mkdirSync(REPORTS_DIR, { recursive: true });

const normalizeLicensesField = (licensesField) => {
    const items = Array.isArray(licensesField) ? licensesField : [licensesField];
    const tokens = [];

    for (const item of items) {
        if (!item) continue;
        const normalized = String(item).replace(/[()]/g, " ");
        for (const token of normalized.split(/[\s+]+/).filter(Boolean)) {
            const upper = token.toUpperCase();
            if (upper === "AND" || upper === "OR" || upper === "WITH") continue;
            tokens.push(token);
        }
    }

    return [...new Set(tokens)];
};

const annotateError = (message) => {
    console.error(`::error ::${message}`);
    errors.push(message);
};

const annotateWarning = (message) => {
    console.warn(`::warning ::${message}`);
    warnings.push(message);
};

const requireFile = (filePath, description) => {
    if (!fs.existsSync(filePath)) {
        annotateError(`Missing ${description}: ${filePath}`);
    }
};

const writeStepSummary = (content) => {
    if (!process.env.GITHUB_STEP_SUMMARY) return;
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${content}\n`);
};

// 1) Project license check
const pkg = readJSON(PKG_JSON);
const projectLicense = pkg.license ?? "(not set)";
const projectId = `${pkg.name}@${pkg.version}`;

if (projectLicense !== EXPECTED_PROJECT_LICENSE) {
    annotateError(
        `package.json license must be "${EXPECTED_PROJECT_LICENSE}" but is "${projectLicense}".`
    );
}

// 2) Dependency license scan
if (!fs.existsSync(LICENSES_JSON)) {
    annotateError(`licenses.json not found. Run "npx license-checker --json > ${LICENSES_JSON}".`);
}

let licensesData = {};
try {
    licensesData = readJSON(LICENSES_JSON);
} catch (err) {
    annotateError(`Failed to parse ${LICENSES_JSON}: ${err.message}`);
}

const dependencyEntries = Object.entries(licensesData);
const uniqueLicenseIds = new Set();
let ccByDetected = false;
let scannedCount = 0;

for (const [pkgId, info] of dependencyEntries) {
    if (pkgId === projectId) continue; // Skip this project itself
    scannedCount += 1;

    const licenseIds = normalizeLicensesField(info.licenses);
    if (licenseIds.length === 0) {
        annotateError(`No license detected for ${pkgId}.`);
        continue;
    }

    for (const licenseId of licenseIds) {
        uniqueLicenseIds.add(licenseId);

        if (DENY_LICENSES.has(licenseId)) {
            annotateError(`Dependency ${pkgId} uses disallowed license "${licenseId}".`);
            continue;
        }

        if (DENY_PATTERNS.some((re) => re.test(licenseId))) {
            annotateError(`Dependency ${pkgId} uses prohibited license "${licenseId}".`);
            continue;
        }

        if (!ALLOWED_LICENSES.has(licenseId)) {
            annotateWarning(
                `Dependency ${pkgId} uses license "${licenseId}" which is not in the allow list.`
            );
        }

        const textPath = path.join(LICENSE_TEXTS_DIR, `${licenseId}.txt`);
        if (!fs.existsSync(textPath)) {
            missingLicenseTexts.add(licenseId);
        }

        if (licenseId.startsWith("CC-BY-")) {
            ccByDetected = true;
        }
    }

    if (licenseIds.includes("Apache-2.0") && info.noticeFile) {
        const noticeTarget = path.join(NOTICES_DIR, safeNoticeName(pkgId));
        if (!fs.existsSync(noticeTarget)) {
            missingNotices.push({
                package: pkgId,
                expected: noticeTarget,
                source: info.noticeFile,
            });
        }
    }
}

// 3) Required artifacts
for (const licenseId of missingLicenseTexts) {
    annotateError(
        `Missing license text for "${licenseId}". Place it at ${path.join(
            LICENSE_TEXTS_DIR,
            `${licenseId}.txt`
        )}`
    );
}

for (const notice of missingNotices) {
    annotateError(
        `Missing NOTICE for ${notice.package}. Expected file: ${notice.expected} (source hint: ${notice.source})`
    );
}

if (ccByDetected) {
    requireFile(ATTRIBUTION_PATH, "CC-BY attribution file");
}

// 4) Report + summary
ensureReportsDir();
const report = {
    project: {
        id: projectId,
        license: projectLicense,
        expectedLicense: EXPECTED_PROJECT_LICENSE,
    },
    stats: {
        dependencyCount: scannedCount,
        uniqueLicenses: [...uniqueLicenseIds].sort(),
    },
    missingLicenseTexts: [...missingLicenseTexts].sort(),
    missingNotices,
    ccByDetected,
    warnings,
    errors,
};

fs.writeFileSync(path.join(REPORTS_DIR, "license-check-report.json"), JSON.stringify(report, null, 2));

const summaryLines = [
    "## License Check",
    `- Project license: ${projectLicense} (expected ${EXPECTED_PROJECT_LICENSE})`,
    `- Dependencies scanned: ${scannedCount}`,
    `- Unique licenses: ${[...uniqueLicenseIds].sort().join(", ") || "(none)"}`,
];

if (missingLicenseTexts.size > 0) {
    summaryLines.push(
        `- Missing license texts: ${[...missingLicenseTexts].sort().join(", ")}`
    );
}

if (missingNotices.length > 0) {
    summaryLines.push(`- Missing NOTICE files: ${missingNotices.length}`);
}

if (ccByDetected) {
    summaryLines.push(
        `- CC-BY detected: require ${ATTRIBUTION_PATH}`
    );
}

if (warnings.length > 0) {
    summaryLines.push(`- Warnings: ${warnings.length}`);
}

if (errors.length > 0) {
    summaryLines.push(`- Errors: ${errors.length} (see annotations above)`);
}

writeStepSummary(`${summaryLines.join("\n")}\n`);

if (errors.length > 0) {
    process.exitCode = 1;
    console.error(`[FAIL] License check failed with ${errors.length} error(s).`);
} else {
    console.log("[OK] License check passed.");
}
