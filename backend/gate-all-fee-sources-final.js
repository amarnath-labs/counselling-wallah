import fs from "node:fs/promises";
import { URL } from "node:url";

/*
|--------------------------------------------------------------------------
| FILES
|--------------------------------------------------------------------------
*/

const INPUT =
  "./fee-all-remaining-master-report.json";

const NORMALIZATION_READY_OUTPUT =
  "./fee-final-normalization-ready.json";

const HOLD_OUTPUT =
  "./fee-final-hold.json";

const DISCOVERY_OUTPUT =
  "./fee-final-discovery.json";

const POLICY_REPORT_OUTPUT =
  "./fee-final-import-policy-report.json";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const TARGET_YEAR = 2026;

/*
|--------------------------------------------------------------------------
| COMPLETED COLLEGES
|--------------------------------------------------------------------------
|
| These colleges have already had verified fee data imported.
| Stale queue entries must never re-enter normalization/import.
|--------------------------------------------------------------------------
*/

const COMPLETED_COLLEGE_IDS = new Set([
  "uptac-ajay-kumar-garg-engg-college-ghaziabad",

  "uptac-abss-institute-of-technology-meerut-meerut",

  "uptac-ashoka-institute-of-technology-management-varanasi",

  "uptac-accurate-institute-of-management-technology-gautam-buddh-nagar"
]);

/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function getHostname(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

function domainsRelated(
  sourceUrl,
  officialWebsite
) {
  const sourceDomain =
    getHostname(sourceUrl);

  const officialDomain =
    getHostname(officialWebsite);

  if (
    !sourceDomain ||
    !officialDomain
  ) {
    return null;
  }

  if (
    sourceDomain ===
    officialDomain
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Official subdomain support
  |--------------------------------------------------------------------------
  */

  if (
    sourceDomain.endsWith(
      `.${officialDomain}`
    ) ||
    officialDomain.endsWith(
      `.${sourceDomain}`
    )
  ) {
    return true;
  }

  return false;
}

function getSignals(row) {
  return (
    row.extraction?.signals ||
    {}
  );
}

function getAmountCount(row) {
  return Number(
    row.extraction?.amounts_count ??
    0
  );
}

function isOfficialSourceType(row) {
  return [
    "official_pdf",
    "official_html"
  ].includes(
    row.source_type
  );
}

function hasCurrentYear(row) {
  return (
    Number(
      row.academic_year
    ) ===
    TARGET_YEAR
  );
}

/*
|--------------------------------------------------------------------------
| B.TECH FEE EVIDENCE
|--------------------------------------------------------------------------
*/

function hasClearBtechFee(row) {
  const signals =
    getSignals(row);

  const amountCount =
    getAmountCount(row);

  return (
    signals.btech === true &&
    signals.fee === true &&
    amountCount >= 2
  );
}

/*
|--------------------------------------------------------------------------
| FW EVIDENCE
|--------------------------------------------------------------------------
*/

function hasFwSpecificEvidence(row) {
  const signals =
    getSignals(row);

  return (
    signals.fee_waiver === true
  );
}

/*
|--------------------------------------------------------------------------
| HOSTEL EVIDENCE
|--------------------------------------------------------------------------
*/

function hasHostelEvidence(row) {
  const signals =
    getSignals(row);

  return (
    signals.hostel === true
  );
}

/*
|--------------------------------------------------------------------------
| SOURCE TRUST
|--------------------------------------------------------------------------
*/

function classifySourceTrust(row) {
  if (!row.source_url) {
    return {
      trust:
        "NO_SOURCE",

      domain_match:
        null
    };
  }

  const officialType =
    isOfficialSourceType(row);

  const domainMatch =
    domainsRelated(
      row.source_url,
      row.official_website
    );

  /*
  |--------------------------------------------------------------------------
  | Official source + valid/unknown official domain
  |--------------------------------------------------------------------------
  */

  if (
    officialType &&
    domainMatch !== false
  ) {
    return {
      trust:
        "OFFICIAL",

      domain_match:
        domainMatch
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Manifest says official but official website unavailable.
  |--------------------------------------------------------------------------
  */

  if (
    officialType &&
    !row.official_website
  ) {
    return {
      trust:
        "OFFICIAL_UNVERIFIED_DOMAIN",

      domain_match:
        null
    };
  }

  return {
    trust:
      "THIRD_PARTY_OR_UNVERIFIED",

    domain_match:
      domainMatch
  };
}

/*
|--------------------------------------------------------------------------
| FINAL POLICY
|--------------------------------------------------------------------------
|
| LOCKED RULES
|
| CURRENT OFFICIAL SOURCE + CLEAR B.TECH FEE
|       -> NORMALIZE
|
| OLD SOURCE
|       -> HOLD
|
| THIRD-PARTY ONLY
|       -> HOLD
|
| NO SOURCE
|       -> DISCOVERY_REQUIRED
|
| FW WITHOUT FW-SPECIFIC SOURCE
|       -> HOLD FW
|
| HOSTEL NOT PUBLISHED
|       -> NULL
|       -> NEVER 0
|--------------------------------------------------------------------------
*/

function applyPolicy(row) {
  /*
  |--------------------------------------------------------------------------
  | 1. Already completed
  |--------------------------------------------------------------------------
  */

  if (
    COMPLETED_COLLEGE_IDS.has(
      row.college_id
    )
  ) {
    return {
      ...row,

      policy_status:
        "ALREADY_COMPLETED",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "NOT_APPLICABLE_COMPLETED",

      hostel_fee_policy:
        null,

      reasons: [
        "College already completed; stale queue entry ignored."
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Common evidence
  |--------------------------------------------------------------------------
  */

  const sourceTrust =
    classifySourceTrust(row);

  const currentYear =
    hasCurrentYear(row);

  const clearBtechFee =
    hasClearBtechFee(row);

  const fwSpecific =
    hasFwSpecificEvidence(row);

  const hostelSpecific =
    hasHostelEvidence(row);

  /*
  |--------------------------------------------------------------------------
  | 2. No source
  |--------------------------------------------------------------------------
  */

  if (
    !row.source_url ||
    row.final_status ===
      "SOURCE_DISCOVERY_REQUIRED"
  ) {
    return {
      ...row,

      policy_status:
        "DISCOVERY_REQUIRED",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "HOLD_NO_SOURCE",

      hostel_fee_policy:
        null,

      reasons: [
        "No verified fee source available."
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 3. Source fetch failure
  |--------------------------------------------------------------------------
  */

  if (
    row.final_status ===
    "SOURCE_FETCH_FAILED"
  ) {
    return {
      ...row,

      policy_status:
        "DISCOVERY_OR_SOURCE_FIX_REQUIRED",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "HOLD_SOURCE_FETCH_FAILED",

      hostel_fee_policy:
        null,

      reasons: [
        "Stored source could not be fetched.",
        ...(row.reasons || [])
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 4. Third-party / unverified source
  |--------------------------------------------------------------------------
  */

  if (
    sourceTrust.trust ===
    "THIRD_PARTY_OR_UNVERIFIED"
  ) {
    return {
      ...row,

      policy_status:
        "HOLD_THIRD_PARTY",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "HOLD_THIRD_PARTY",

      hostel_fee_policy:
        hostelSpecific
          ? "REVIEW_ONLY"
          : null,

      reasons: [
        "Source is third-party or cannot be verified as official."
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 5. Outdated official source
  |--------------------------------------------------------------------------
  */

  const sourceYear =
    Number(
      row.academic_year
    );

  if (
    Number.isFinite(
      sourceYear
    ) &&
    sourceYear <
      TARGET_YEAR
  ) {
    return {
      ...row,

      policy_status:
        "HOLD_OUTDATED",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "HOLD_OUTDATED",

      hostel_fee_policy:
        hostelSpecific
          ? "OLD_SOURCE_HOLD"
          : null,

      reasons: [
        `Official fee source is for ${sourceYear}; target year is ${TARGET_YEAR}.`
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 6. Academic year not verified
  |--------------------------------------------------------------------------
  */

  if (!currentYear) {
    return {
      ...row,

      policy_status:
        "HOLD_YEAR_UNVERIFIED",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "HOLD_YEAR_UNVERIFIED",

      hostel_fee_policy:
        hostelSpecific
          ? "REVIEW_ONLY"
          : null,

      reasons: [
        "Academic year is not verified as current."
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 7. Current official source but fee unclear
  |--------------------------------------------------------------------------
  */

  if (!clearBtechFee) {
    return {
      ...row,

      policy_status:
        "HOLD_FEE_STRUCTURE_UNCLEAR",

      normalization_allowed:
        false,

      general_import_allowed:
        false,

      fw_import_allowed:
        false,

      hostel_import_allowed:
        false,

      fw_policy:
        "HOLD_FEE_STRUCTURE_UNCLEAR",

      hostel_fee_policy:
        hostelSpecific
          ? "REVIEW_ONLY"
          : null,

      reasons: [
        "Current official source found, but clear B.Tech fee structure is not extractable."
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | 8. NORMALIZATION READY
  |--------------------------------------------------------------------------
  |
  | General fees can proceed.
  |
  | FW proceeds only when source explicitly contains FW/TFW fee evidence.
  |
  | Hostel proceeds only when official source explicitly publishes hostel fee.
  |--------------------------------------------------------------------------
  */

  return {
    ...row,

    policy_status:
      "NORMALIZATION_READY",

    normalization_allowed:
      true,

    general_import_allowed:
      true,

    fw_import_allowed:
      fwSpecific,

    fw_policy:
      fwSpecific
        ? "SOURCE_AVAILABLE"
        : "HOLD_FW_NO_SPECIFIC_SOURCE",

    hostel_import_allowed:
      hostelSpecific,

    hostel_fee_policy:
      hostelSpecific
        ? "EXPLICIT_SOURCE_ONLY"
        : null,

    reasons: [
      "Current official source verified.",

      "Clear B.Tech fee structure detected.",

      fwSpecific
        ? "FW-specific evidence detected."
        : "No FW-specific source; FW branches must remain on hold.",

      hostelSpecific
        ? "Hostel evidence detected; exact hostel values still require normalization."
        : "Hostel not explicitly published; store NULL, never 0."
    ]
  };
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "FINAL FEE SOURCE POLICY GATE"
  );

  console.log(
    "======================================="
  );

  console.log("");

  const raw =
    await fs.readFile(
      INPUT,
      "utf8"
    );

  const inputRows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );

  if (
    !Array.isArray(
      inputRows
    )
  ) {
    throw new Error(
      "Input JSON must contain an array."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Apply policy
  |--------------------------------------------------------------------------
  */

  const results =
    inputRows.map(
      applyPolicy
    );

  /*
  |--------------------------------------------------------------------------
  | GROUP RESULTS
  |--------------------------------------------------------------------------
  */

  const normalizationReady =
    results.filter(
      row =>
        row.policy_status ===
        "NORMALIZATION_READY"
    );

  const discovery =
    results.filter(
      row =>
        [
          "DISCOVERY_REQUIRED",
          "DISCOVERY_OR_SOURCE_FIX_REQUIRED"
        ].includes(
          row.policy_status
        )
    );

  const hold =
    results.filter(
      row =>
        [
          "HOLD_THIRD_PARTY",
          "HOLD_OUTDATED",
          "HOLD_YEAR_UNVERIFIED",
          "HOLD_FEE_STRUCTURE_UNCLEAR"
        ].includes(
          row.policy_status
        )
    );

  const completed =
    results.filter(
      row =>
        row.policy_status ===
        "ALREADY_COMPLETED"
    );

  /*
  |--------------------------------------------------------------------------
  | SAVE OUTPUT FILES
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    NORMALIZATION_READY_OUTPUT,

    JSON.stringify(
      normalizationReady,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    HOLD_OUTPUT,

    JSON.stringify(
      hold,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    DISCOVERY_OUTPUT,

    JSON.stringify(
      discovery,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    POLICY_REPORT_OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    "utf8"
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = {};

  for (
    const row
    of results
  ) {
    counts[
      row.policy_status
    ] =
      (
        counts[
          row.policy_status
        ] ||
        0
      ) +
      1;
  }

  console.log(
    "POLICY SUMMARY"
  );

  console.table(
    Object.entries(
      counts
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
      .map(
        (
          [
            status,
            count
          ]
        ) => ({
          status,
          count
        })
      )
  );

  /*
  |--------------------------------------------------------------------------
  | NORMALIZATION READY TABLE
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "NORMALIZATION READY"
  );

  console.table(
    normalizationReady.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        year:
          row.academic_year,

        source:
          row.source_type,

        general:
          row.general_import_allowed
            ? "READY"
            : "HOLD",

        fw:
          row.fw_import_allowed
            ? "READY"
            : "HOLD",

        hostel:
          row.hostel_import_allowed
            ? "SOURCE_FOUND"
            : "NULL"
      })
    )
  );

  /*
  |--------------------------------------------------------------------------
  | HOLD TABLE
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "HOLD"
  );

  console.table(
    hold.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        year:
          row.academic_year,

        status:
          row.policy_status,

        reason:
          (
            row.reasons ||
            []
          ).join(
            " | "
          )
      })
    )
  );

  /*
  |--------------------------------------------------------------------------
  | DISCOVERY TABLE
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "DISCOVERY REQUIRED"
  );

  console.table(
    discovery.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        status:
          row.policy_status
      })
    )
  );

  /*
  |--------------------------------------------------------------------------
  | COMPLETED TABLE
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "ALREADY COMPLETED / STALE"
  );

  console.table(
    completed.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name
      })
    )
  );

  /*
  |--------------------------------------------------------------------------
  | FINAL COUNTS
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "FINAL COUNTS"
  );

  console.log(
    "======================================="
  );

  console.log(
    "Input colleges:",
    results.length
  );

  console.log(
    "Normalization ready:",
    normalizationReady.length
  );

  console.log(
    "Hold:",
    hold.length
  );

  console.log(
    "Discovery/source fix:",
    discovery.length
  );

  console.log(
    "Already completed:",
    completed.length
  );

  /*
  |--------------------------------------------------------------------------
  | POLICY DISPLAY
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "POLICY LOCKED:"
  );

  console.log(
    "- Current official + clear B.Tech fee => NORMALIZE"
  );

  console.log(
    "- Old source => HOLD"
  );

  console.log(
    "- Third-party => HOLD"
  );

  console.log(
    "- No source => DISCOVERY"
  );

  console.log(
    "- FW without FW-specific source => HOLD FW"
  );

  console.log(
    "- Hostel missing => NULL, never 0"
  );

  /*
  |--------------------------------------------------------------------------
  | OUTPUT FILES
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "Saved:",
    NORMALIZATION_READY_OUTPUT
  );

  console.log(
    "Saved:",
    HOLD_OUTPUT
  );

  console.log(
    "Saved:",
    DISCOVERY_OUTPUT
  );

  console.log(
    "Saved:",
    POLICY_REPORT_OUTPUT
  );

  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(
  error => {
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  }
);