#!/usr/bin/env node
/**
 * Generate THIRD-PARTY-LICENSE.md using @myooken/license-output.
 * - Writes main output to public/THIRD-PARTY-LICENSE.md (served by the app)
 * - Writes review notes to review/THIRD-PARTY-LICENSE-REVIEW.md (gitignored)
 * - Supports `--fail-on-missing` to surface missing LICENSE/NOTICE/COPYING files
 */
import fs from "node:fs/promises";
import path from "node:path";
import { collectThirdPartyLicenses } from "@myooken/license-output";

const OUTPUT_FILE = path.resolve("public", "THIRD-PARTY-LICENSE.md");
const REVIEW_FILE = path.resolve("review", "THIRD-PARTY-LICENSE-REVIEW.md");
const FAIL_ON_MISSING = process.argv.includes("--fail-on-missing");

async function main() {
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.mkdir(path.dirname(REVIEW_FILE), { recursive: true });

  const result = await collectThirdPartyLicenses({
    outFile: OUTPUT_FILE,
    reviewFile: REVIEW_FILE,
    writeMain: false,
    writeReview: false,
    failOnMissing: false, // evaluate exit code ourselves to keep it stable
  });

  await Promise.all([
    fs.writeFile(OUTPUT_FILE, result.mainContent, "utf8"),
    fs.writeFile(REVIEW_FILE, result.reviewContent, "utf8"),
  ]);

  console.log(`[license] main: ${OUTPUT_FILE}`);
  console.log(`[license] review: ${REVIEW_FILE}`);
  console.log(`[license] packages: ${result.stats.packages}`);
  console.log(
    `[license] missing LICENSE/NOTICE/COPYING: ${result.stats.missingFiles.length}`
  );

  if (FAIL_ON_MISSING && result.stats.missingFiles.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(2);
});
