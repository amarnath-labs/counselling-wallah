import fs from "node:fs/promises";

const INPUT_ALL =
  "./safe-fee-child-links-all.json";

const INPUT_REVIEW =
  "./safe-fee-child-links-review.json";

const EVIDENCE_INPUT =
  "./safe-26-fee-evidence-pack.json";

const OUTPUT_READY =
  "./exact-btech-fee-links-ready.json";

const OUTPUT_REVIEW =
  "./exact-btech-fee-links-review.json";

const OUTPUT_REJECTED =
  "./exact-btech-fee-links-rejected.json";

const TARGET_YEAR = 2026;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function lower(value) {
  return clean(value).toLowerCase();
}

async function readJson(
  file,
  fallback = []
) {
  try {
    return JSON.parse(
      (
        await fs.readFile(
          file,
          "utf8"
        )
      ).replace(/^\uFEFF/, "")
    );
  } catch {
    return fallback;
  }
}

function combinedText(link) {
  return lower(
    [
      link.anchor_text,
      link.context,
      link.url
    ].join(" ")
  );
}

/*
|--------------------------------------------------------------------------
| Positive signals
|--------------------------------------------------------------------------
*/

function isFeeRelated(s) {
  return (
    /\bfee structure\b/.test(s) ||
    /\bfees structure\b/.test(s) ||
    /\bfee details\b/.test(s) ||
    /\binstitute fee\b/.test(s) ||
    /\bacademic fee\b/.test(s) ||
    /\btuition fee\b/.test(s) ||
    /\bhostel fee\b/.test(s) ||
    /\bmess (?:fee|charges)\b/.test(s) ||
    /\bhostel.{0,15}mess.{0,15}charges\b/.test(
      s
    )
  );
}

function isBtechRelated(s) {
  return (
    /\bb\.?\s*tech\b/.test(s) ||
    /\bbtech\b/.test(s) ||
    /\bbachelor of technology\b/.test(s)
  );
}

function isUgRelated(s) {
  return (
    /\bundergraduate\b/.test(s) ||
    /\bug programme\b/.test(s) ||
    /\bug program\b/.test(s) ||
    /\bug fee\b/.test(s) ||
    /\bug admission\b/.test(s)
  );
}

function isCurrentYear(s) {
  return (
    /2026\s*[-–]\s*27/.test(s) ||
    /2026\s*[-–]\s*2027/.test(s) ||
    /2026_27/.test(s) ||
    /2026_2027/.test(s) ||
    /\bay\s*2026/.test(s) ||
    /\bacademic year\s*2026/.test(s) ||
    /\bsession\s*2026/.test(s)
  );
}

function isNewEntrant(s) {
  return (
    /\bnew entrant/.test(s) ||
    /\bnew admission/.test(s) ||
    /\bnew student/.test(s) ||
    /\bfirst year\b/.test(s) ||
    /\b1st year\b/.test(s) ||
    /\bfirst semester\b/.test(s) ||
    /\b1st semester\b/.test(s) ||
    /\bjoining\b/.test(s) ||
    /\bfresher/.test(s)
  );
}

function isPdf(s) {
  return /\.pdf(?:$|[?#])/i.test(s);
}

/*
|--------------------------------------------------------------------------
| Hard rejection signals
|--------------------------------------------------------------------------
*/

function rejectionReason(link) {
  const s =
    combinedText(link);

  const anchor =
    lower(link.anchor_text);

  const url =
    lower(link.url);

  /*
   * Maps / external non-fee resources
   */
  if (
    /google\.com\/maps|goo\.gl\/maps/.test(
      url
    )
  ) {
    return "MAP_LINK";
  }

  /*
   * Refund policy is NOT fee structure.
   */
  if (
    /\brefund policy\b/.test(s) ||
    /\bfee refund\b/.test(s)
  ) {
    return "REFUND_POLICY";
  }

  /*
   * Academic calendar
   */
  if (
    /\bacademic calendar\b/.test(s) ||
    /academic_calendar/.test(url)
  ) {
    return "ACADEMIC_CALENDAR";
  }

  /*
   * Admission shortlist / merit / cut-off.
   */
  if (
    /\bshortlist\b/.test(s) ||
    /\bshort-listed\b/.test(s) ||
    /\bshortlisted\b/.test(s) ||
    /\bmerit list\b/.test(s) ||
    /\bcut[- ]?off\b/.test(s) ||
    /shortlist/.test(url)
  ) {
    return "ADMISSION_LIST";
  }

  /*
   * Loan documents.
   */
  if (
    /\beducation loan\b/.test(s) ||
    /\bvidya laxmi\b/.test(s) ||
    /\bloan scheme\b/.test(s)
  ) {
    return "LOAN_DOCUMENT";
  }

  /*
   * Admission brochure/checklist alone is
   * not automatically a fee structure.
   *
   * It can later be reviewed if the fee
   * table is actually inside the document.
   */
  if (
    /\bdocuments checklist\b/.test(s) ||
    /documents_checklist/.test(url)
  ) {
    return "DOCUMENT_CHECKLIST";
  }

  /*
   * Generic institute profile/brochure.
   */
  if (
    /\bat a glance\b/.test(anchor)
  ) {
    return "GENERIC_PROFILE";
  }

  /*
   * Bank/payment portal without actual
   * fee structure.
   */
  if (
    /nopaperforms\.com/.test(url)
  ) {
    return "ADMISSION_PORTAL";
  }

  /*
   * Old fee source with no 2026 context.
   */
  const oldYear =
    /2025\s*[-–]\s*26|2024\s*[-–]\s*25|2023\s*[-–]\s*24|2022\s*[-–]\s*23/.test(
      s
    );

  if (
    oldYear &&
    !isCurrentYear(s)
  ) {
    return "OLD_ACADEMIC_YEAR";
  }

  /*
   * Explicitly PG-only resources.
   */
  if (
    (
      /\bm\.?\s*tech\b/.test(s) ||
      /\bmtech\b/.test(s)
    ) &&
    !isBtechRelated(s) &&
    !isUgRelated(s)
  ) {
    return "MTECH_ONLY";
  }

  if (
    (
      /\bph\.?\s*d\b/.test(s) ||
      /\bdoctoral\b/.test(s)
    ) &&
    !isBtechRelated(s) &&
    !isUgRelated(s)
  ) {
    return "PHD_ONLY";
  }

  if (
    /\bpost graduate\b|\bpostgraduate\b|\bpg programme\b|\bpg program\b/.test(
      s
    ) &&
    !isBtechRelated(s) &&
    !isUgRelated(s)
  ) {
    return "PG_ONLY";
  }

  /*
   * Pure department links.
   */
  if (
    /\bdept\.?\s+of\b|\bdepartment of\b/.test(
      anchor
    )
  ) {
    return "DEPARTMENT_PAGE";
  }

  /*
   * Placement etc.
   */
  if (
    /\bplacement\b/.test(anchor) &&
    !isFeeRelated(s)
  ) {
    return "PLACEMENT_PAGE";
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Exact fee scoring
|--------------------------------------------------------------------------
*/

function evaluateLink(link) {
  const s =
    combinedText(link);

  let score = 0;

  const reasons = [];

  /*
   * Most important signal:
   * actual fee wording.
   */
  if (isFeeRelated(s)) {
    score += 45;

    reasons.push(
      "EXPLICIT_FEE_STRUCTURE"
    );
  }

  /*
   * B.Tech / UG programme identity.
   */
  if (isBtechRelated(s)) {
    score += 35;

    reasons.push(
      "BTECH"
    );
  } else if (isUgRelated(s)) {
    score += 20;

    reasons.push(
      "UG"
    );
  }

  /*
   * Current AY.
   */
  if (isCurrentYear(s)) {
    score += 35;

    reasons.push(
      "CURRENT_2026_27"
    );
  }

  /*
   * New entrants are preferred for
   * recommendation website because user
   * is evaluating admission.
   */
  if (isNewEntrant(s)) {
    score += 15;

    reasons.push(
      "NEW_ENTRANT"
    );
  }

  /*
   * Actual source document.
   */
  if (isPdf(link.url || "")) {
    score += 10;

    reasons.push(
      "PDF"
    );
  }

  /*
   * Hostel and mess are valid supplemental
   * fee documents.
   */
  const hostel =
    /\bhostel\b|\bboarding\b|\blodging\b/.test(
      s
    );

  const mess =
    /\bmess\b/.test(s);

  if (hostel) {
    score += 8;

    reasons.push(
      "HOSTEL"
    );
  }

  if (mess) {
    score += 8;

    reasons.push(
      "MESS"
    );
  }

  /*
   * Specific component indicators.
   */
  if (
    /\btuition\b/.test(s)
  ) {
    score += 5;

    reasons.push(
      "TUITION"
    );
  }

  /*
   * Penalise ambiguous generic links.
   */
  if (
    /^(click here|view|download)$/i.test(
      clean(link.anchor_text)
    )
  ) {
    score -= 5;

    reasons.push(
      "GENERIC_ANCHOR"
    );
  }

  /*
   * Generic homepage.
   */
  try {
    const u =
      new URL(link.url);

    if (
      u.pathname === "/" ||
      u.pathname === ""
    ) {
      score -= 30;

      reasons.push(
        "GENERIC_HOMEPAGE"
      );
    }
  } catch {
    // Ignore malformed URL here.
  }

  const reject =
    rejectionReason(link);

  if (reject) {
    return {
      score,
      accepted: false,
      decision:
        "REJECT",
      rejection_reason:
        reject,
      reasons
    };
  }

  /*
   * STRICT auto-ready rule:
   *
   * Must have fee wording,
   * and B.Tech/UG/current-year evidence.
   */
  const hasProgramme =
    isBtechRelated(s) ||
    isUgRelated(s);

  const current =
    isCurrentYear(s);

  const fee =
    isFeeRelated(s);

  let accepted = false;

  let decision =
    "REVIEW";

  /*
   * Best case:
   * current B.Tech/UG fee structure.
   */
  if (
    fee &&
    current &&
    hasProgramme &&
    score >= 80
  ) {
    accepted = true;

    decision =
      "EXACT_CURRENT_BTECH_FEE";
  }

  /*
   * Supplemental current hostel/mess
   * document. Useful alongside academic
   * fee source.
   */
  if (
    fee &&
    current &&
    (hostel || mess) &&
    score >= 75
  ) {
    accepted = true;

    decision =
      "CURRENT_HOSTEL_MESS_FEE";
  }

  /*
   * Named current fee document may omit
   * B.Tech because it applies institute-wide.
   *
   * Keep as REVIEW, not auto-ready.
   */
  if (
    fee &&
    current &&
    !hasProgramme &&
    decision === "REVIEW"
  ) {
    decision =
      "CURRENT_INSTITUTE_FEE_REVIEW";
  }

  /*
   * B.Tech fee structure but year omitted
   * from anchor/context.
   */
  if (
    fee &&
    isBtechRelated(s) &&
    !current &&
    decision === "REVIEW"
  ) {
    decision =
      "BTECH_FEE_YEAR_REVIEW";
  }

  return {
    score,
    accepted,
    decision,
    rejection_reason:
      null,
    reasons
  };
}

/*
|--------------------------------------------------------------------------
| Parent direct fee evidence
|--------------------------------------------------------------------------
*/

function parentDirectEvidence(
  evidence
) {
  const tables =
    evidence.candidate_tables || [];

  const usefulTables =
    tables.filter(table => {
      const text =
        lower(
          (table.rows || [])
            .map(row =>
              row.join(" | ")
            )
            .join(" ")
        );

      /*
       * Important:
       * Don't accept bank/seats tables.
       */
      const fee =
        /\btuition fee\b|\bfee structure\b|\binstitute fee\b|\bhostel fee\b|\bmess fee\b|\bcaution deposit\b|\bsub total\b|\btotal with hostel fee\b/.test(
          text
        );

      const numeric =
        /\b\d{4,6}\b/.test(text);

      return fee && numeric;
    });

  if (
    usefulTables.length === 0
  ) {
    return null;
  }

  return {
    type:
      "DIRECT_PARENT_EVIDENCE",

    source_url:
      evidence.source_url,

    academic_year:
      (
        evidence.detected_years || []
      ).some(year =>
        String(year).includes(
          String(TARGET_YEAR)
        )
      )
        ? TARGET_YEAR
        : null,

    tables:
      usefulTables
  };
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

async function main() {
  console.log(
    "\n=========================================="
  );

  console.log(
    "EXACT B.TECH FEE LINK SELECTOR"
  );

  console.log(
    "==========================================\n"
  );

  const childRecords =
    await readJson(
      INPUT_ALL
    );

  const childReview =
    await readJson(
      INPUT_REVIEW
    );

  const evidence =
    await readJson(
      EVIDENCE_INPUT
    );

  const evidenceMap =
    new Map(
      evidence.map(row => [
        String(row.college_id),
        row
      ])
    );

  const ready = [];

  const review = [];

  const rejected = [];

  /*
   * Child resolver all.json normally contains
   * successfully processed parent pages.
   */
  for (
    let i = 0;
    i < childRecords.length;
    i++
  ) {
    const college =
      childRecords[i];

    console.log(
      `[${i + 1}/${childRecords.length}] ${college.college_name}`
    );

    const evaluated =
      (
        college.candidates ||
        college.selected_links ||
        []
      )
        .map(link => {
          const result =
            evaluateLink(link);

          return {
            ...link,
            exact_score:
              result.score,

            exact_decision:
              result.decision,

            accepted:
              result.accepted,

            rejection_reason:
              result.rejection_reason,

            exact_reasons:
              result.reasons
          };
        })
        .sort(
          (a, b) =>
            b.exact_score -
            a.exact_score
        );

    const exactLinks =
      evaluated.filter(
        link =>
          link.accepted === true
      );

    const reviewLinks =
      evaluated.filter(
        link =>
          !link.accepted &&
          !link.rejection_reason &&
          link.exact_score >= 45
      );

    const rejectedLinks =
      evaluated.filter(
        link =>
          Boolean(
            link.rejection_reason
          )
      );

    const parentEvidence =
      parentDirectEvidence(
        evidenceMap.get(
          String(
            college.college_id
          )
        ) || {}
      );

    /*
     * Deduplicate exact URLs.
     */
    const exactByUrl =
      new Map();

    for (
      const link of exactLinks
    ) {
      const old =
        exactByUrl.get(
          link.url
        );

      if (
        !old ||
        link.exact_score >
          old.exact_score
      ) {
        exactByUrl.set(
          link.url,
          link
        );
      }
    }

    const selected =
      [...exactByUrl.values()]
        .sort(
          (a, b) =>
            b.exact_score -
            a.exact_score
        );

    /*
     * Separate academic and
     * hostel/mess documents.
     */
    const academicLinks =
      selected.filter(
        link =>
          link.exact_decision ===
          "EXACT_CURRENT_BTECH_FEE"
      );

    const hostelMessLinks =
      selected.filter(
        link =>
          link.exact_decision ===
          "CURRENT_HOSTEL_MESS_FEE"
      );

    /*
     * If same document qualifies for both,
     * academic copy takes precedence.
     */
    const academicUrls =
      new Set(
        academicLinks.map(
          x => x.url
        )
      );

    const supplemental =
      hostelMessLinks.filter(
        x =>
          !academicUrls.has(
            x.url
          )
      );

    if (
      academicLinks.length > 0 ||
      parentEvidence
    ) {
      const record = {
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        source_family:
          college.source_family,

        parent_url:
          college.parent_url,

        status:
          "EXACT_SOURCE_READY",

        academic_fee_links:
          academicLinks,

        hostel_mess_links:
          supplemental,

        direct_parent_evidence:
          parentEvidence,

        review_links:
          reviewLinks,

        rejected_links:
          rejectedLinks
      };

      ready.push(record);

      console.log(
        ` -> READY`
      );

      console.log(
        `    Academic docs: ${academicLinks.length}`
      );

      console.log(
        `    Hostel/Mess docs: ${supplemental.length}`
      );

      console.log(
        `    Direct table: ${parentEvidence ? "YES" : "NO"}`
      );

      for (
        const link of
        academicLinks.slice(
          0,
          3
        )
      ) {
        console.log(
          `    ${link.exact_score} | ${link.anchor_text || "(no text)"}`
        );

        console.log(
          `    ${link.url}`
        );
      }

      for (
        const link of
        supplemental.slice(
          0,
          2
        )
      ) {
        console.log(
          `    HOSTEL/MESS ${link.exact_score} | ${link.anchor_text || "(no text)"}`
        );

        console.log(
          `    ${link.url}`
        );
      }
    } else {
      const record = {
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        source_family:
          college.source_family,

        parent_url:
          college.parent_url,

        status:
          "EXACT_SOURCE_REVIEW",

        review_links:
          reviewLinks,

        rejected_links:
          rejectedLinks
      };

      review.push(record);

      console.log(
        ` -> REVIEW`
      );

      if (
        reviewLinks[0]
      ) {
        console.log(
          `    Best review candidate: ${reviewLinks[0].exact_score}`
        );

        console.log(
          `    ${reviewLinks[0].anchor_text || "(no text)"}`
        );

        console.log(
          `    ${reviewLinks[0].url}`
        );
      }
    }

    if (
      rejectedLinks.length > 0
    ) {
      rejected.push({
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        rejected_links:
          rejectedLinks
      });
    }
  }

  /*
   * Preserve colleges which parent resolver
   * itself could not resolve.
   */
  const seenReview =
    new Set(
      review.map(
        r =>
          String(
            r.college_id
          )
      )
    );

  const seenReady =
    new Set(
      ready.map(
        r =>
          String(
            r.college_id
          )
      )
    );

  for (
    const row of childReview
  ) {
    const id =
      String(
        row.college_id
      );

    if (
      seenReady.has(id) ||
      seenReview.has(id)
    ) {
      continue;
    }

    /*
     * A parent may still contain usable
     * direct fee table.
     */
    const direct =
      parentDirectEvidence(
        evidenceMap.get(id) ||
        {}
      );

    if (direct) {
      ready.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        parent_url:
          row.parent_url,

        status:
          "DIRECT_PARENT_FEE_READY",

        academic_fee_links:
          [],

        hostel_mess_links:
          [],

        direct_parent_evidence:
          direct,

        review_links:
          [],

        rejected_links:
          []
      });

      seenReady.add(id);
    } else {
      review.push({
        ...row,

        status:
          row.status ||
          "SOURCE_REDISCOVERY_REQUIRED"
      });

      seenReview.add(id);
    }
  }

  /*
   * Safety accounting by unique college id.
   */
  const readyIds =
    new Set(
      ready.map(
        r =>
          String(
            r.college_id
          )
      )
    );

  const reviewFinal =
    review.filter(
      r =>
        !readyIds.has(
          String(
            r.college_id
          )
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
      reviewFinal,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_REJECTED,
    JSON.stringify(
      rejected,
      null,
      2
    )
  );

  console.log(
    "\n=========================================="
  );

  console.log(
    "EXACT SOURCE SUMMARY"
  );

  console.log(
    "==========================================\n"
  );

  console.log(
    "Target year       :",
    TARGET_YEAR
  );

  console.log(
    "Exact source ready:",
    ready.length
  );

  console.log(
    "Review/rediscover :",
    reviewFinal.length
  );

  console.log(
    "Accounted         :",
    ready.length +
      reviewFinal.length
  );

  console.log(
    "\nOutput:"
  );

  console.log(
    OUTPUT_READY
  );

  console.log(
    OUTPUT_REVIEW
  );

  console.log(
    OUTPUT_REJECTED
  );

  console.log(
    "\nDATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(error => {
  console.error(
    "\nFATAL:",
    error
  );

  process.exitCode = 1;
});