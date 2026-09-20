import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "./src/db/pool.js";

const TARGET_YEAR = 2026;

const INPUT_FILES = [
  "./fee-all-remaining-source-ready.json",
  "./all-colleges-fee-source-ready-after-crawl.json",
  "./all-363-fee-source-recovered.json",
  "./all-colleges-fee-source-review-after-crawl.json",
  "./all-colleges-no-fee-source-after-crawl.json",
  "./all-colleges-fee-source-family-enriched.json",
  "./all-colleges-fee-source-family-enriched-uptac.json",
  "./all-colleges-official-fee-sources.json",
  "./fee-master-priority-source-ready.json",
  "./fee-master-priority-source-review.json"
];

const OUTPUT_MASTER =
  "./safe-363-fee-work-queue.json";

const OUTPUT_PROTECTED =
  "./safe-363-fee-protected-existing.json";

const OUTPUT_READY =
  "./safe-363-fee-source-ready.json";

const OUTPUT_REVIEW =
  "./safe-363-fee-review-required.json";

const OUTPUT_UNRESOLVED =
  "./safe-363-fee-unresolved.json";

function clean(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function normalizeUrl(value) {
  const url = clean(value);

  if (!url) {
    return null;
  }

  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {
    return null;
  }

  return url;
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bengg\b/g, "engineering")
    .replace(/\btech\b/g, "technology")
    .replace(/\binstitute\b/g, "institute")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCollegeId(row) {
  return (
    clean(row?.college_id) ||
    clean(row?.collegeId) ||
    clean(row?.id) ||
    null
  );
}

function getCollegeName(row) {
  return (
    clean(row?.college_name) ||
    clean(row?.collegeName) ||
    clean(row?.college) ||
    clean(row?.name) ||
    null
  );
}

function getWebsite(row) {
  return normalizeUrl(
    row?.official_website ||
    row?.officialWebsite ||
    row?.website ||
    row?.college_website
  );
}

function getSourceUrl(row) {
  return normalizeUrl(
    row?.resolved_source_url ||
    row?.source_url ||
    row?.sourceUrl ||
    row?.fee_source_url ||
    row?.feeUrl ||
    row?.url ||
    row?.candidate_url
  );
}

function getSourceLabel(row) {
  return (
    clean(row?.source_label) ||
    clean(row?.sourceLabel) ||
    clean(row?.label) ||
    clean(row?.title) ||
    null
  );
}

function getSourceFamily(row) {
  return (
    clean(row?.source_family) ||
    clean(row?.sourceFamily) ||
    clean(row?.family) ||
    null
  );
}

function getAcademicYear(row) {
  const value =
    row?.academic_year ??
    row?.academicYear ??
    row?.target_year ??
    row?.targetYear ??
    row?.year;

  const year = Number(value);

  return Number.isInteger(year)
    ? year
    : null;
}

function getStatus(row) {
  return String(
    row?.crawl_status ||
    row?.queue_status ||
    row?.status ||
    row?.verification_status ||
    ""
  )
    .trim()
    .toUpperCase();
}

function hasStrongFeeSignal(row) {
  const status = getStatus(row);

  if (
    status.includes("NORMALIZATION_READY") ||
    status.includes("CURRENT_OFFICIAL_BTECH_FEE_SOURCE") ||
    status.includes("SOURCE_READY") ||
    status.includes("IMPORT_READY")
  ) {
    return true;
  }

  const btech =
    row?.btech_relevant === true ||
    row?.signals?.btech === true ||
    row?.fee_signals?.btech === true;

  const fee =
    row?.fee_relevant === true ||
    row?.signals?.fee === true ||
    row?.fee_signals?.fee === true;

  const amounts =
    Array.isArray(row?.all_amounts) &&
    row.all_amounts.length > 0;

  return Boolean(
    btech &&
    fee &&
    (
      getSourceUrl(row) ||
      amounts
    )
  );
}

function sourceScore(row, filename) {
  let score = 0;

  const status = getStatus(row);
  const url = getSourceUrl(row);
  const year = getAcademicYear(row);

  if (
    filename.includes(
      "fee-all-remaining-source-ready"
    )
  ) {
    score += 100;
  }

  if (
    filename.includes(
      "priority-source-ready"
    )
  ) {
    score += 95;
  }

  if (
    filename.includes(
      "ready-after-crawl"
    )
  ) {
    score += 90;
  }

  if (
    filename.includes(
      "recovered"
    )
  ) {
    score += 70;
  }

  if (
    filename.includes(
      "official-fee-sources"
    )
  ) {
    score += 65;
  }

  if (
    filename.includes(
      "review"
    )
  ) {
    score += 30;
  }

  if (
    status.includes(
      "NORMALIZATION_READY"
    )
  ) {
    score += 100;
  }

  if (
    status.includes(
      "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
    )
  ) {
    score += 90;
  }

  if (
    status.includes("SOURCE_READY")
  ) {
    score += 80;
  }

  if (
    status.includes("PDF")
  ) {
    score += 20;
  }

  if (
    status.includes("REVIEW")
  ) {
    score += 10;
  }

  if (
    status.includes("UNRESOLVED") ||
    status.includes("NO_FEE_SOURCE")
  ) {
    score -= 50;
  }

  if (url) {
    score += 25;
  }

  if (year === TARGET_YEAR) {
    score += 30;
  }

  if (hasStrongFeeSignal(row)) {
    score += 30;
  }

  return score;
}

async function readJsonSafe(filename) {
  try {
    const raw =
      await fs.readFile(
        filename,
        "utf8"
      );

    const parsed =
      JSON.parse(
        raw.replace(/^\uFEFF/, "")
      );

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (
      Array.isArray(parsed?.results)
    ) {
      return parsed.results;
    }

    if (
      Array.isArray(parsed?.colleges)
    ) {
      return parsed.colleges;
    }

    if (
      Array.isArray(parsed?.data)
    ) {
      return parsed.data;
    }

    return [];
  } catch (error) {
    if (
      error?.code !== "ENOENT"
    ) {
      console.warn(
        `WARN ${filename}:`,
        error.message
      );
    }

    return [];
  }
}

async function loadDatabaseColleges() {
  const result =
    await pool.query(`
      SELECT
        id::text AS college_id,
        name AS college_name
      FROM colleges
      ORDER BY name
    `);

  return result.rows;
}

async function loadExistingFees() {
  const result =
    await pool.query(`
      SELECT
        bf.id::text AS branch_fee_id,
        bf.college_id::text,
        bf.branch_id,
        bf.program,
        bf.fee_scope,
        bf.academic_year,
        bf.source_label,
        bf.source_url,
        bf.verification_status,
        COUNT(fv.id)::int AS variant_count
      FROM branch_fees bf
      LEFT JOIN fee_variants fv
        ON fv.branch_fee_id = bf.id
      WHERE
        LOWER(COALESCE(bf.program, ''))
          LIKE '%b.tech%'
      GROUP BY
        bf.id,
        bf.college_id,
        bf.branch_id,
        bf.program,
        bf.fee_scope,
        bf.academic_year,
        bf.source_label,
        bf.source_url,
        bf.verification_status
      ORDER BY
        bf.college_id,
        bf.academic_year DESC NULLS LAST
    `);

  return result.rows;
}

function buildCollegeIndexes(
  colleges
) {
  const byId =
    new Map();

  const byName =
    new Map();

  for (
    const college of colleges
  ) {
    byId.set(
      college.college_id,
      college
    );

    const key =
      normalizeName(
        college.college_name
      );

    if (key) {
      if (!byName.has(key)) {
        byName.set(
          key,
          college
        );
      }
    }
  }

  return {
    byId,
    byName
  };
}

function resolveCollege(
  row,
  indexes
) {
  const candidateId =
    getCollegeId(row);

  if (
    candidateId &&
    indexes.byId.has(
      candidateId
    )
  ) {
    return indexes.byId.get(
      candidateId
    );
  }

  const candidateName =
    getCollegeName(row);

  if (!candidateName) {
    return null;
  }

  const key =
    normalizeName(
      candidateName
    );

  if (
    key &&
    indexes.byName.has(key)
  ) {
    return indexes.byName.get(
      key
    );
  }

  return null;
}

function classifyCandidate(
  candidate
) {
  const {
    source_url,
    source_score,
    status,
    academic_year
  } = candidate;

  if (
    source_url &&
    source_score >= 150 &&
    (
      academic_year === TARGET_YEAR ||
      academic_year === null
    )
  ) {
    return "SOURCE_READY";
  }

  if (
    source_url &&
    source_score >= 80
  ) {
    return "REVIEW_REQUIRED";
  }

  if (
    status.includes(
      "OFFICIAL_WEBSITE_UNRESOLVED"
    )
  ) {
    return "FALLBACK_DISCOVERY";
  }

  if (!source_url) {
    return "FALLBACK_DISCOVERY";
  }

  return "REVIEW_REQUIRED";
}

async function main() {
  console.log(
    "\n======================================="
  );

  console.log(
    "SAFE 363 FEE WORK QUEUE BUILDER"
  );

  console.log(
    "=======================================\n"
  );

  console.log(
    `Target academic year: ${TARGET_YEAR}`
  );

  const colleges =
    await loadDatabaseColleges();

  console.log(
    `DB colleges: ${colleges.length}`
  );

  if (
    colleges.length !== 363
  ) {
    throw new Error(
      `Expected 363 colleges, found ${colleges.length}`
    );
  }

  const existingFees =
    await loadExistingFees();

  const indexes =
    buildCollegeIndexes(
      colleges
    );

  const existingByCollege =
    new Map();

  for (
    const row of existingFees
  ) {
    if (
      !existingByCollege.has(
        row.college_id
      )
    ) {
      existingByCollege.set(
        row.college_id,
        []
      );
    }

    existingByCollege
      .get(row.college_id)
      .push(row);
  }

  const candidateMap =
    new Map();

  for (
    const filename of INPUT_FILES
  ) {
    const rows =
      await readJsonSafe(
        filename
      );

    console.log(
      `${path.basename(filename)}: ${rows.length}`
    );

    for (
      const row of rows
    ) {
      const college =
        resolveCollege(
          row,
          indexes
        );

      if (!college) {
        continue;
      }

      const candidate = {
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        source_file:
          path.basename(
            filename
          ),

        source_family:
          getSourceFamily(row),

        academic_year:
          getAcademicYear(row),

        official_website:
          getWebsite(row),

        source_url:
          getSourceUrl(row),

        source_label:
          getSourceLabel(row),

        status:
          getStatus(row),

        source_score:
          sourceScore(
            row,
            filename
          ),

        raw:
          row
      };

      if (
        !candidateMap.has(
          college.college_id
        )
      ) {
        candidateMap.set(
          college.college_id,
          []
        );
      }

      candidateMap
        .get(college.college_id)
        .push(candidate);
    }
  }

  const master =
    [];

  const protectedRows =
    [];

  const ready =
    [];

  const review =
    [];

  const unresolved =
    [];

  for (
    const college of colleges
  ) {
    const existing =
      existingByCollege.get(
        college.college_id
      ) || [];

    const currentVerified =
      existing.filter(row => {
        return (
          String(
            row.verification_status
          ).toLowerCase() ===
            "verified" &&
          Number(
            row.academic_year
          ) >= TARGET_YEAR
        );
      });

    const anyVerified =
      existing.filter(row => {
        return (
          String(
            row.verification_status
          ).toLowerCase() ===
          "verified"
        );
      });

    const candidates =
      (
        candidateMap.get(
          college.college_id
        ) || []
      )
        .sort(
          (
            a,
            b
          ) =>
            b.source_score -
            a.source_score
        );

    let finalStatus;
    let selectedSource = null;

    if (
      currentVerified.length > 0
    ) {
      finalStatus =
        "PROTECTED_EXISTING_VERIFIED";

      protectedRows.push({
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        existing_fee_records:
          currentVerified
      });
    } else if (
      candidates.length > 0
    ) {
      selectedSource =
        candidates[0];

      finalStatus =
        classifyCandidate(
          selectedSource
        );
    } else {
      finalStatus =
        "FALLBACK_DISCOVERY";
    }

    const record = {
      college_id:
        college.college_id,

      college_name:
        college.college_name,

      target_year:
        TARGET_YEAR,

      final_status:
        finalStatus,

      protected_current_verified:
        currentVerified.length,

      historical_verified:
        anyVerified.length,

      existing_fee_master_count:
        existing.length,

      selected_source:
        selectedSource
          ? {
              source_file:
                selectedSource.source_file,

              source_family:
                selectedSource.source_family,

              academic_year:
                selectedSource.academic_year,

              official_website:
                selectedSource.official_website,

              source_url:
                selectedSource.source_url,

              source_label:
                selectedSource.source_label,

              status:
                selectedSource.status,

              source_score:
                selectedSource.source_score
            }
          : null,

      candidate_count:
        candidates.length,

      candidate_sources:
        candidates.slice(
          0,
          10
        )
    };

    master.push(record);

    if (
      finalStatus ===
      "SOURCE_READY"
    ) {
      ready.push(record);
    } else if (
      finalStatus ===
      "REVIEW_REQUIRED"
    ) {
      review.push(record);
    } else if (
      finalStatus ===
      "FALLBACK_DISCOVERY"
    ) {
      unresolved.push(record);
    }
  }

  await fs.writeFile(
    OUTPUT_MASTER,
    JSON.stringify(
      master,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_PROTECTED,
    JSON.stringify(
      protectedRows,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_READY,
    JSON.stringify(
      ready,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_REVIEW,
    JSON.stringify(
      review,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_UNRESOLVED,
    JSON.stringify(
      unresolved,
      null,
      2
    )
  );

  const counts = {};

  for (
    const row of master
  ) {
    counts[
      row.final_status
    ] =
      (
        counts[
          row.final_status
        ] || 0
      ) + 1;
  }

  console.log(
    "\n======================================="
  );

  console.log(
    "FINAL 363 WORK QUEUE"
  );

  console.log(
    "=======================================\n"
  );

  console.table(
    Object.entries(counts).map(
      ([status, count]) => ({
        status,
        count
      })
    )
  );

  console.log(
    `TOTAL: ${master.length}`
  );

  console.log(
    `\nSOURCE READY: ${ready.length}`
  );

  console.log(
    `REVIEW REQUIRED: ${review.length}`
  );

  console.log(
    `FALLBACK DISCOVERY: ${unresolved.length}`
  );

  console.log(
    `PROTECTED VERIFIED: ${protectedRows.length}`
  );

  console.log(
    "\nSaved:"
  );

  console.log(
    OUTPUT_MASTER
  );

  console.log(
    OUTPUT_READY
  );

  console.log(
    OUTPUT_REVIEW
  );

  console.log(
    OUTPUT_UNRESOLVED
  );

  console.log(
    OUTPUT_PROTECTED
  );

  console.log(
    "\nDATABASE HAS NOT BEEN MODIFIED."
  );
}

main()
  .catch(error => {
    console.error(
      "\nFATAL:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  });