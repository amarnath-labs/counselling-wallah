import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const FILES = {
  workQueue:
    "./safe-363-fee-work-queue.json",

  extracted:
    "./fee-documents-2026-extracted.json",

  extractionReview:
    "./fee-documents-2026-extraction-review.json",

  exactReady:
    "./exact-btech-fee-links-ready.json",

  exactReview:
    "./exact-btech-fee-links-review.json",

  childReady:
    "./safe-fee-child-links-ready.json",

  sourceReady:
    "./safe-363-fee-source-ready.json",

  reviewRequired:
    "./safe-363-fee-review-required.json",

  unresolved:
    "./safe-363-fee-unresolved.json",

  protectedExisting:
    "./safe-363-fee-protected-existing.json"
};

const OUTPUT =
  "./all-363-fee-master.json";

const SUMMARY_OUTPUT =
  "./all-363-fee-master-summary.json";

const TARGET_YEAR = 2026;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

async function readJson(file, fallback = []) {
  try {
    const raw =
      await fs.readFile(
        path.resolve(ROOT, file),
        "utf8"
      );

    return JSON.parse(
      raw.replace(/^\uFEFF/, "")
    );
  } catch {
    return fallback;
  }
}

function clean(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function collegeId(row) {
  return clean(
    row?.college_id ??
    row?.collegeId ??
    row?.id
  );
}

function collegeName(row) {
  return clean(
    row?.college_name ??
    row?.collegeName ??
    row?.name
  );
}

function normalizeStatus(value) {
  return clean(value)
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function hasUsableExtraction(row) {
  return [
    "TEXT_EXTRACTED",
    "DIRECT_HTML_EXTRACTED"
  ].includes(
    normalizeStatus(
      row?.extraction_status
    )
  );
}

function hasScannedPdf(row) {
  return [
    "INSUFFICIENT_TEXT_REVIEW",
    "NO_FEE_EVIDENCE_REVIEW"
  ].includes(
    normalizeStatus(
      row?.extraction_status
    )
  );
}

function uniqueByUrl(rows = []) {
  const map = new Map();

  for (const row of rows) {
    const url =
      clean(
        row?.source_url ??
        row?.url
      );

    if (!url) continue;

    if (!map.has(url)) {
      map.set(url, row);
    }
  }

  return [...map.values()];
}

/*
|--------------------------------------------------------------------------
| Record model
|--------------------------------------------------------------------------
*/

function createMasterRecord(row) {
  return {
    college_id:
      collegeId(row),

    college_name:
      collegeName(row),

    target_academic_year:
      TARGET_YEAR,

    program:
      "B.Tech",

    /*
    |----------------------------------------------------------------------
    | Final fee model
    |----------------------------------------------------------------------
    */

    fee_scope:
      null,

    fee_period:
      null,

    semester:
      null,

    year_of_study:
      null,

    course_total:
      null,

    tuition_fee:
      null,

    admission_fee:
      null,

    institute_fee:
      null,

    hostel_fee:
      null,

    mess_fee:
      null,

    caution_deposit:
      null,

    other_fee:
      null,

    total_fee:
      null,

    student_category:
      null,

    income_min:
      null,

    income_max:
      null,

    residence_type:
      null,

    room_type:
      null,

    /*
    |----------------------------------------------------------------------
    | Multiple fee variants will eventually live here.
    |----------------------------------------------------------------------
    */

    fee_variants:
      [],

    /*
    |----------------------------------------------------------------------
    | Source metadata
    |----------------------------------------------------------------------
    */

    official_sources:
      [],

    source_family:
      clean(
        row?.source_family
      ) || null,

    /*
    |----------------------------------------------------------------------
    | Pipeline state
    |----------------------------------------------------------------------
    */

    source_status:
      null,

    extraction_status:
      null,

    normalization_status:
      "NOT_STARTED",

    verification_status:
      "NOT_VERIFIED",

    db_status:
      "NOT_IMPORTED",

    /*
    |----------------------------------------------------------------------
    | Safety / provenance
    |----------------------------------------------------------------------
    */

    protected_existing:
      false,

    direct_evidence:
      false,

    scanned_pdf:
      false,

    requires_review:
      false,

    unresolved:
      false,

    notes:
      []
  };
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

async function main() {
  console.log();
  console.log(
    "=================================================="
  );
  console.log(
    "ALL 363 B.TECH FEE MASTER BUILDER"
  );
  console.log(
    "=================================================="
  );
  console.log();

  const [
    workQueue,
    extracted,
    extractionReview,
    exactReady,
    exactReview,
    childReady,
    sourceReady,
    reviewRequired,
    unresolved,
    protectedExisting
  ] = await Promise.all([
    readJson(FILES.workQueue),
    readJson(FILES.extracted),
    readJson(FILES.extractionReview),
    readJson(FILES.exactReady),
    readJson(FILES.exactReview),
    readJson(FILES.childReady),
    readJson(FILES.sourceReady),
    readJson(FILES.reviewRequired),
    readJson(FILES.unresolved),
    readJson(FILES.protectedExisting)
  ]);

  console.log(
    "Work queue          :",
    workQueue.length
  );

  console.log(
    "Extracted documents :",
    extracted.length
  );

  console.log(
    "Extraction review   :",
    extractionReview.length
  );

  console.log(
    "Exact ready         :",
    exactReady.length
  );

  console.log(
    "Exact review        :",
    exactReview.length
  );

  console.log();

  /*
  |--------------------------------------------------------------------------
  | Master map
  |--------------------------------------------------------------------------
  */

  const master =
    new Map();

  for (const row of workQueue) {
    const id =
      collegeId(row);

    if (!id) {
      console.warn(
        "Skipping work-queue row without college_id:",
        collegeName(row)
      );

      continue;
    }

    master.set(
      id,
      createMasterRecord(row)
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Safety check
  |--------------------------------------------------------------------------
  */

  if (master.size !== 363) {
    console.warn(
      `WARNING: expected 363 colleges, found ${master.size}.`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Protected existing verified fees
  |--------------------------------------------------------------------------
  */

  for (const row of protectedExisting) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    record.protected_existing =
      true;

    record.source_status =
      "PROTECTED_EXISTING";

    record.normalization_status =
      "EXISTING_DATA";

    record.verification_status =
      "VERIFIED_CURRENT";

    record.db_status =
      "ALREADY_PRESENT";

    record.notes.push(
      "Existing current verified fee data is protected from overwrite."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Source-ready queue
  |--------------------------------------------------------------------------
  */

  for (const row of sourceReady) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    if (!record.source_status) {
      record.source_status =
        "SOURCE_READY";
    }

    const sourceUrl =
      clean(
        row?.source_url ??
        row?.url
      );

    if (sourceUrl) {
      record.official_sources.push({
        url:
          sourceUrl,

        label:
          clean(
            row?.source_label ??
            row?.label
          ) || null,

        academic_year:
          row?.academic_year ??
          null,

        stage:
          "SOURCE_DISCOVERY"
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Exact source-ready documents
  |--------------------------------------------------------------------------
  */

  for (const row of exactReady) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    record.source_status =
      "EXACT_SOURCE_READY";

    const academic =
      row?.academic_fee_links ??
      [];

    const hostel =
      row?.hostel_mess_links ??
      [];

    for (const link of [
      ...academic,
      ...hostel
    ]) {
      const url =
        clean(link?.url);

      if (!url) continue;

      record.official_sources.push({
        url,

        label:
          clean(
            link?.anchor_text
          ) || null,

        academic_year:
          TARGET_YEAR,

        stage:
          "EXACT_SOURCE",

        document_type:
          academic.includes(link)
            ? "academic_fee"
            : "hostel_mess_fee"
      });
    }

    if (
      row?.direct_parent_evidence
    ) {
      record.direct_evidence =
        true;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Actual extracted documents
  |--------------------------------------------------------------------------
  */

  const extractedByCollege =
    new Map();

  for (const row of extracted) {
    const id =
      collegeId(row);

    if (!id) continue;

    if (
      !extractedByCollege.has(id)
    ) {
      extractedByCollege.set(
        id,
        []
      );
    }

    extractedByCollege
      .get(id)
      .push(row);
  }

  for (
    const [
      id,
      rows
    ] of extractedByCollege
  ) {
    const record =
      master.get(id);

    if (!record) continue;

    const usable =
      rows.filter(
        hasUsableExtraction
      );

    const scanned =
      rows.filter(
        hasScannedPdf
      );

    if (usable.length > 0) {
      record.extraction_status =
        "EXTRACTED";

      record.normalization_status =
        "READY_FOR_NORMALIZATION";

      record.requires_review =
        false;
    }

    if (scanned.length > 0) {
      record.scanned_pdf =
        true;

      if (usable.length === 0) {
        record.extraction_status =
          "SCANNED_PDF_REVIEW";

        record.normalization_status =
          "WAITING_FOR_DOCUMENT_TEXT";

        record.requires_review =
          true;
      }
    }

    for (const row of rows) {
      const url =
        clean(row?.source_url);

      if (!url) continue;

      record.official_sources.push({
        url,

        label:
          row?.document_type ??
          null,

        academic_year:
          row?.academic_year ??
          TARGET_YEAR,

        stage:
          "DOCUMENT_EXTRACTION",

        extraction_status:
          row?.extraction_status ??
          null,

        local_path:
          row?.local_path ??
          null
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Exact review
  |--------------------------------------------------------------------------
  */

  for (const row of exactReview) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    if (
      record.extraction_status ===
      "EXTRACTED"
    ) {
      continue;
    }

    record.requires_review =
      true;

    if (!record.source_status) {
      record.source_status =
        "SOURCE_REVIEW";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | General review queue
  |--------------------------------------------------------------------------
  */

  for (const row of reviewRequired) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    if (
      record.extraction_status ===
      "EXTRACTED" ||
      record.protected_existing
    ) {
      continue;
    }

    record.requires_review =
      true;

    if (!record.source_status) {
      record.source_status =
        "REVIEW_REQUIRED";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Unresolved
  |--------------------------------------------------------------------------
  */

  for (const row of unresolved) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    if (
      record.extraction_status ===
      "EXTRACTED" ||
      record.protected_existing
    ) {
      continue;
    }

    record.unresolved =
      true;

    if (!record.source_status) {
      record.source_status =
        "SOURCE_UNRESOLVED";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Child-ready sources as additional provenance
  |--------------------------------------------------------------------------
  */

  for (const row of childReady) {
    const id =
      collegeId(row);

    const record =
      master.get(id);

    if (!record) continue;

    for (
      const link of
      row?.selected_links ??
      []
    ) {
      const url =
        clean(link?.url);

      if (!url) continue;

      record.official_sources.push({
        url,

        label:
          clean(
            link?.anchor_text
          ) || null,

        stage:
          "CHILD_LINK_DISCOVERY",

        score:
          link?.score ??
          null
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Deduplicate sources
  |--------------------------------------------------------------------------
  */

  for (const record of master.values()) {
    record.official_sources =
      uniqueByUrl(
        record.official_sources
      );

    if (
      !record.source_status
    ) {
      record.source_status =
        "DISCOVERY_REQUIRED";
    }

    /*
     * Missing data stays NULL.
     * Never default fee values to zero.
     */
  }

  const rows =
    [...master.values()]
      .sort(
        (a, b) =>
          a.college_name
            .localeCompare(
              b.college_name
            )
      );

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const summary = {
    target_colleges:
      363,

    actual_colleges:
      rows.length,

    target_academic_year:
      TARGET_YEAR,

    protected_existing:
      rows.filter(
        r =>
          r.protected_existing
      ).length,

    ready_for_normalization:
      rows.filter(
        r =>
          r.normalization_status ===
          "READY_FOR_NORMALIZATION"
      ).length,

    scanned_pdf_review:
      rows.filter(
        r =>
          r.extraction_status ===
          "SCANNED_PDF_REVIEW"
      ).length,

    requires_review:
      rows.filter(
        r =>
          r.requires_review
      ).length,

    unresolved:
      rows.filter(
        r =>
          r.unresolved
      ).length,

    discovery_required:
      rows.filter(
        r =>
          r.source_status ===
          "DISCOVERY_REQUIRED"
      ).length,

    normalized:
      rows.filter(
        r =>
          r.normalization_status ===
          "NORMALIZED"
      ).length,

    imported:
      rows.filter(
        r =>
          r.db_status ===
          "IMPORTED"
      ).length
  };

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      rows,
      null,
      2
    )
  );

  await fs.writeFile(
    SUMMARY_OUTPUT,
    JSON.stringify(
      summary,
      null,
      2
    )
  );

  console.log(
    "=================================================="
  );

  console.log(
    "ALL 363 MASTER SUMMARY"
  );

  console.log(
    "=================================================="
  );

  console.table(
    summary
  );

  console.log();
  console.log(
    "Saved:",
    OUTPUT
  );

  console.log(
    "Saved:",
    SUMMARY_OUTPUT
  );

  console.log();
  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );

  if (rows.length !== 363) {
    process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(
    "\nFATAL:",
    error
  );

  process.exitCode = 1;
});