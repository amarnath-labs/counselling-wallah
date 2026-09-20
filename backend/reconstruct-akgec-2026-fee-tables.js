import fs from "node:fs/promises";

const INPUT =
  "./akgec-2026-pdf-extraction.json";

const NORMALIZED_INPUT =
  "./akgec-2026-normalized-preview.json";

const OUTPUT =
  "./akgec-2026-fee-table-reconstruction.json";

const REVIEW_OUTPUT =
  "./akgec-2026-fee-table-reconstruction-review.json";


/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/

function cleanText(value) {
  return String(
    value ?? ""
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


function getLines(text) {
  return cleanText(text)
    .split("\n")
    .map(
      line =>
        line
          .replace(/[|[\]{}]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
    )
    .filter(Boolean);
}


function getSource(rows, key) {
  return rows.find(
    row =>
      row.source_key === key
  );
}


function unique(values) {
  return [
    ...new Set(values)
  ];
}


/*
|--------------------------------------------------------------------------
| NUMBER EXTRACTION
|--------------------------------------------------------------------------
*/

function extractRawNumbers(text) {
  const matches =
    String(
      text ?? ""
    ).match(
      /\d[\d,.]*/g
    ) || [];

  return matches.map(
    raw => {
      const normalized =
        raw
          .replace(/,/g, "")
          .replace(/\.$/, "");

      const value =
        Number(normalized);

      return {
        raw,
        value
      };
    }
  ).filter(
    row =>
      Number.isFinite(
        row.value
      )
  );
}


function isYear(value) {
  return (
    Number.isInteger(value) &&
    value >= 2000 &&
    value <= 2100
  );
}


function isLikelyFee(value) {
  return (
    Number.isInteger(value) &&
    value >= 500 &&
    value <= 500000 &&
    !isYear(value)
  );
}


function isSuspicious(value) {
  if (
    !Number.isFinite(value)
  ) {
    return true;
  }

  if (
    isYear(value)
  ) {
    return true;
  }

  if (
    value > 500000
  ) {
    return true;
  }

  if (
    value > 0 &&
    !Number.isInteger(value)
  ) {
    return true;
  }

  return false;
}


/*
|--------------------------------------------------------------------------
| LINE CLASSIFICATION
|--------------------------------------------------------------------------
*/

function classifyLine(line) {
  const lower =
    line.toLowerCase();

  const labels = [];

  if (
    /tuition/.test(lower)
  ) {
    labels.push(
      "TUITION"
    );
  }

  if (
    /registration/.test(lower)
  ) {
    labels.push(
      "REGISTRATION"
    );
  }

  if (
    /development/.test(lower)
  ) {
    labels.push(
      "DEVELOPMENT"
    );
  }

  if (
    /admission/.test(lower)
  ) {
    labels.push(
      "ADMISSION"
    );
  }

  if (
    /activity/.test(lower)
  ) {
    labels.push(
      "ACTIVITY"
    );
  }

  if (
    /placement|career planning/.test(
      lower
    )
  ) {
    labels.push(
      "PLACEMENT"
    );
  }

  if (
    /exam|examination/.test(
      lower
    )
  ) {
    labels.push(
      "EXAMINATION"
    );
  }

  if (
    /digital library/.test(
      lower
    )
  ) {
    labels.push(
      "DIGITAL_LIBRARY"
    );
  }

  if (
    /caution|security/.test(
      lower
    )
  ) {
    labels.push(
      "CAUTION_SECURITY"
    );
  }

  if (
    /\btotal\b/.test(lower)
  ) {
    labels.push(
      "TOTAL"
    );
  }

  if (
    /hostel/.test(lower)
  ) {
    labels.push(
      "HOSTEL"
    );
  }

  if (
    /mess/.test(lower)
  ) {
    labels.push(
      "MESS"
    );
  }

  if (
    /single.*seater|single seater/.test(
      lower
    )
  ) {
    labels.push(
      "SINGLE_SEATER"
    );
  }

  if (
    /double.*seater|double seater/.test(
      lower
    )
  ) {
    labels.push(
      "DOUBLE_SEATER"
    );
  }

  if (
    /triple.*seater|triple seater/.test(
      lower
    )
  ) {
    labels.push(
      "TRIPLE_SEATER"
    );
  }

  if (
    /fee waiver|tfw|\bfw\b/.test(
      lower
    )
  ) {
    labels.push(
      "FEE_WAIVER"
    );
  }

  if (
    /1st year|first year|ist year/.test(
      lower
    )
  ) {
    labels.push(
      "YEAR_1"
    );
  }

  if (
    /2nd year|second year|iind year/.test(
      lower
    )
  ) {
    labels.push(
      "YEAR_2"
    );
  }

  if (
    /3rd year|third year|iiird year/.test(
      lower
    )
  ) {
    labels.push(
      "YEAR_3"
    );
  }

  if (
    /4th year|fourth year|ivth year/.test(
      lower
    )
  ) {
    labels.push(
      "YEAR_4"
    );
  }

  return labels;
}


/*
|--------------------------------------------------------------------------
| BUILD LINE EVIDENCE
|--------------------------------------------------------------------------
*/

function buildLineEvidence(source) {
  const lines =
    getLines(
      source.text
    );

  return lines.map(
    (line, index) => {
      const numbers =
        extractRawNumbers(
          line
        );

      return {
        line_no:
          index + 1,

        text:
          line,

        labels:
          classifyLine(
            line
          ),

        numbers,

        plausible_fees:
          numbers
            .map(
              row =>
                row.value
            )
            .filter(
              isLikelyFee
            ),

        suspicious:
          numbers
            .map(
              row =>
                row.value
            )
            .filter(
              isSuspicious
            )
      };
    }
  );
}


/*
|--------------------------------------------------------------------------
| CONTEXT BUILDER
|--------------------------------------------------------------------------
*/

function buildContexts(
  evidence,
  radius = 2
) {
  const output = [];

  for (
    let i = 0;
    i < evidence.length;
    i++
  ) {
    const row =
      evidence[i];

    if (
      row.labels.length === 0 &&
      row.plausible_fees.length === 0
    ) {
      continue;
    }

    const start =
      Math.max(
        0,
        i - radius
      );

    const end =
      Math.min(
        evidence.length,
        i + radius + 1
      );

    output.push({
      focus_line:
        row.line_no,

      focus_labels:
        row.labels,

      focus_fees:
        row.plausible_fees,

      context:
        evidence.slice(
          start,
          end
        )
    });
  }

  return output;
}


/*
|--------------------------------------------------------------------------
| COMPONENT CANDIDATES
|--------------------------------------------------------------------------
*/

function componentCandidates(
  evidence,
  label
) {
  const candidates = [];

  for (
    let i = 0;
    i < evidence.length;
    i++
  ) {
    const row =
      evidence[i];

    if (
      !row.labels.includes(
        label
      )
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Same line + one line before/after.
    |--------------------------------------------------------------------------
    */

    const nearby =
      evidence.slice(
        Math.max(
          0,
          i - 1
        ),
        Math.min(
          evidence.length,
          i + 2
        )
      );

    const values =
      unique(
        nearby.flatMap(
          item =>
            item.plausible_fees
        )
      );

    candidates.push({
      line_no:
        row.line_no,

      text:
        row.text,

      values,

      nearby:
        nearby.map(
          item => ({
            line_no:
              item.line_no,

            text:
              item.text,

            plausible_fees:
              item.plausible_fees
          })
        )
    });
  }

  return candidates;
}


/*
|--------------------------------------------------------------------------
| YEAR CANDIDATES
|--------------------------------------------------------------------------
*/

function yearCandidates(
  evidence
) {
  const result = {
    year_1: [],
    year_2: [],
    year_3: [],
    year_4: []
  };

  const mapping = [
    [
      "YEAR_1",
      "year_1"
    ],
    [
      "YEAR_2",
      "year_2"
    ],
    [
      "YEAR_3",
      "year_3"
    ],
    [
      "YEAR_4",
      "year_4"
    ]
  ];

  for (
    const [
      label,
      key
    ]
    of mapping
  ) {
    for (
      let i = 0;
      i < evidence.length;
      i++
    ) {
      if (
        !evidence[i]
          .labels
          .includes(
            label
          )
      ) {
        continue;
      }

      const nearby =
        evidence.slice(
          Math.max(
            0,
            i - 2
          ),
          Math.min(
            evidence.length,
            i + 5
          )
        );

      result[key].push({
        line_no:
          evidence[i]
            .line_no,

        text:
          evidence[i]
            .text,

        candidates:
          unique(
            nearby.flatMap(
              row =>
                row.plausible_fees
            )
          ),

        context:
          nearby.map(
            row =>
              row.text
          )
      });
    }
  }

  return result;
}


/*
|--------------------------------------------------------------------------
| GENERAL / FW ANALYSIS
|--------------------------------------------------------------------------
*/

function analyzeAcademic(
  source,
  category
) {
  const evidence =
    buildLineEvidence(
      source
    );

  const components = {
    tuition:
      componentCandidates(
        evidence,
        "TUITION"
      ),

    registration:
      componentCandidates(
        evidence,
        "REGISTRATION"
      ),

    development:
      componentCandidates(
        evidence,
        "DEVELOPMENT"
      ),

    admission:
      componentCandidates(
        evidence,
        "ADMISSION"
      ),

    activity:
      componentCandidates(
        evidence,
        "ACTIVITY"
      ),

    placement:
      componentCandidates(
        evidence,
        "PLACEMENT"
      ),

    examination:
      componentCandidates(
        evidence,
        "EXAMINATION"
      ),

    digital_library:
      componentCandidates(
        evidence,
        "DIGITAL_LIBRARY"
      ),

    caution_security:
      componentCandidates(
        evidence,
        "CAUTION_SECURITY"
      ),

    total:
      componentCandidates(
        evidence,
        "TOTAL"
      )
  };


  const years =
    yearCandidates(
      evidence
    );


  const allPlausible =
    unique(
      evidence.flatMap(
        row =>
          row.plausible_fees
      )
    ).sort(
      (
        a,
        b
      ) =>
        a - b
    );


  const allSuspicious =
    unique(
      evidence.flatMap(
        row =>
          row.suspicious
      )
    );


  /*
  |--------------------------------------------------------------------------
  | Known high-confidence values from previous safety normalizer.
  |--------------------------------------------------------------------------
  */

  const highConfidence = {
    career_planning_placement_one_time:
      allPlausible.includes(
        10000
      )
        ? 10000
        : null,

    counselling_general_obc_adjustment:
      allPlausible.includes(
        20000
      )
        ? 20000
        : null,

    counselling_sc_st_adjustment:
      allPlausible.includes(
        12000
      )
        ? 12000
        : null
  };


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | Candidate extraction != verified reconstruction.
  |--------------------------------------------------------------------------
  */

  const reviewReasons = [];

  const yearCandidateCounts =
    Object.values(
      years
    ).map(
      groups =>
        groups.length
    );


  if (
    yearCandidateCounts.some(
      count =>
        count === 0
    )
  ) {
    reviewReasons.push(
      "One or more academic-year labels were not reliably reconstructed."
    );
  }


  const totalCandidates =
    unique(
      components.total.flatMap(
        row =>
          row.values
      )
    );


  if (
    totalCandidates.length < 4
  ) {
    reviewReasons.push(
      "Four verified annual total-fee values are not available."
    );
  }


  return {
    source_key:
      source.source_key,

    source_url:
      source.source_url,

    category,

    academic_year:
      2026,

    session:
      "2026-27",

    line_count:
      evidence.length,

    high_confidence:
      highConfidence,

    all_plausible_fee_numbers:
      allPlausible,

    suspicious_numbers:
      allSuspicious,

    components,

    year_candidates:
      years,

    contexts:
      buildContexts(
        evidence
      ),

    verified_year_fees:
      [],

    reconstruction_status:
      reviewReasons.length === 0
        ? "CANDIDATES_FOUND_REVIEW_REQUIRED"
        : "TABLE_RECONSTRUCTION_REQUIRED",

    review_reasons:
      reviewReasons
  };
}


/*
|--------------------------------------------------------------------------
| HOSTEL ANALYSIS
|--------------------------------------------------------------------------
*/

function analyzeHostel(
  source
) {
  const evidence =
    buildLineEvidence(
      source
    );


  const roomTypes = {
    single_seater:
      componentCandidates(
        evidence,
        "SINGLE_SEATER"
      ),

    double_seater:
      componentCandidates(
        evidence,
        "DOUBLE_SEATER"
      ),

    triple_seater:
      componentCandidates(
        evidence,
        "TRIPLE_SEATER"
      )
  };


  const hostelCandidates =
    componentCandidates(
      evidence,
      "HOSTEL"
    );


  const messCandidates =
    componentCandidates(
      evidence,
      "MESS"
    );


  const allPlausible =
    unique(
      evidence.flatMap(
        row =>
          row.plausible_fees
      )
    ).sort(
      (
        a,
        b
      ) =>
        a - b
    );


  const detectedRoomTypes =
    Object.entries(
      roomTypes
    )
      .filter(
        (
          [
            ,
            values
          ]
        ) =>
          values.length > 0
      )
      .map(
        (
          [
            key
          ]
        ) =>
          key
      );


  const reviewReasons = [];


  if (
    detectedRoomTypes.length === 0
  ) {
    reviewReasons.push(
      "No hostel room type could be reliably identified."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Even if OCR gives numbers, do not automatically attach them to room types.
  |--------------------------------------------------------------------------
  */

  reviewReasons.push(
    "Room-wise hostel amounts require row/column verification before import."
  );


  return {
    source_key:
      source.source_key,

    source_url:
      source.source_url,

    academic_year:
      2026,

    session:
      "2026-27",

    line_count:
      evidence.length,

    room_types_detected:
      detectedRoomTypes,

    room_type_candidates:
      roomTypes,

    hostel_candidates:
      hostelCandidates,

    mess_candidates:
      messCandidates,

    all_plausible_fee_numbers:
      allPlausible,

    contexts:
      buildContexts(
        evidence
      ),

    verified_hostel_fees:
      [],

    reconstruction_status:
      "TABLE_RECONSTRUCTION_REQUIRED",

    review_reasons:
      reviewReasons
  };
}


/*
|--------------------------------------------------------------------------
| CONSOLE PREVIEW
|--------------------------------------------------------------------------
*/

function printAcademicSummary(
  title,
  result
) {
  console.log("");

  console.log(
    "---------------------------------------"
  );

  console.log(
    title
  );

  console.log(
    "---------------------------------------"
  );


  console.log(
    "Status:",
    result.reconstruction_status
  );


  console.log(
    "Plausible fee numbers:"
  );

  console.log(
    result.all_plausible_fee_numbers
  );


  console.log("");

  console.log(
    "High-confidence known values:"
  );

  console.dir(
    result.high_confidence,
    {
      depth:
        null
    }
  );


  console.log("");

  console.log(
    "Component candidate counts:"
  );


  console.table(
    Object.entries(
      result.components
    ).map(
      (
        [
          component,
          rows
        ]
      ) => ({
        component,
        matches:
          rows.length,

        values:
          unique(
            rows.flatMap(
              row =>
                row.values
            )
          ).join(
            ", "
          )
      })
    )
  );


  console.log("");

  console.log(
    "Year candidate counts:"
  );


  console.table(
    Object.entries(
      result.year_candidates
    ).map(
      (
        [
          year,
          rows
        ]
      ) => ({
        year,

        matches:
          rows.length,

        values:
          unique(
            rows.flatMap(
              row =>
                row.candidates
            )
          ).join(
            ", "
          )
      })
    )
  );


  console.log("");

  console.log(
    "Review reasons:"
  );


  for (
    const reason
    of result.review_reasons
  ) {
    console.log(
      "-",
      reason
    );
  }
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
    "AKGEC 2026 FEE TABLE RECONSTRUCTOR"
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


  const sources =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );


  /*
  |--------------------------------------------------------------------------
  | Ensure previous safety normalizer exists too.
  |--------------------------------------------------------------------------
  */

  try {
    await fs.access(
      NORMALIZED_INPUT
    );
  } catch {
    throw new Error(
      `Missing ${NORMALIZED_INPUT}. Run normalize-akgec-2026-fees.js first.`
    );
  }


  const general =
    getSource(
      sources,
      "btech_general"
    );


  const feeWaiver =
    getSource(
      sources,
      "btech_fee_waiver"
    );


  const hostel =
    getSource(
      sources,
      "hostel"
    );


  if (
    !general
  ) {
    throw new Error(
      "Missing btech_general extraction."
    );
  }


  if (
    !feeWaiver
  ) {
    throw new Error(
      "Missing btech_fee_waiver extraction."
    );
  }


  if (
    !hostel
  ) {
    throw new Error(
      "Missing hostel extraction."
    );
  }


  for (
    const source
    of [
      general,
      feeWaiver,
      hostel
    ]
  ) {
    if (
      source.status !==
      "EXTRACTED"
    ) {
      throw new Error(
        `${source.source_key} is not EXTRACTED. Current status: ${source.status}`
      );
    }
  }


  const generalResult =
    analyzeAcademic(
      general,
      "GENERAL"
    );


  const feeWaiverResult =
    analyzeAcademic(
      feeWaiver,
      "FEE_WAIVER"
    );


  const hostelResult =
    analyzeHostel(
      hostel
    );


  printAcademicSummary(
    "GENERAL B.TECH",
    generalResult
  );


  printAcademicSummary(
    "FEE WAIVER B.TECH",
    feeWaiverResult
  );


  console.log("");

  console.log(
    "---------------------------------------"
  );

  console.log(
    "HOSTEL"
  );

  console.log(
    "---------------------------------------"
  );


  console.log(
    "Status:",
    hostelResult
      .reconstruction_status
  );


  console.log(
    "Room types detected:",
    hostelResult
      .room_types_detected
  );


  console.log(
    "Plausible hostel numbers:"
  );


  console.log(
    hostelResult
      .all_plausible_fee_numbers
  );


  /*
  |--------------------------------------------------------------------------
  | FINAL RESULT
  |--------------------------------------------------------------------------
  */

  const result = {
    college_id:
      "uptac-ajay-kumar-garg-engg-college-ghaziabad",

    college_name:
      "AJAY KUMAR GARG ENGG. COLLEGE,GHAZIABAD",

    academic_year:
      2026,

    session:
      "2026-27",

    general:
      generalResult,

    fee_waiver:
      feeWaiverResult,

    hostel:
      hostelResult,

    final_status:
      "REVIEW_REQUIRED_BEFORE_IMPORT",

    database_modified:
      false
  };


  /*
  |--------------------------------------------------------------------------
  | Compact review file
  |--------------------------------------------------------------------------
  */

  const review = {
    college_id:
      result.college_id,

    academic_year:
      2026,

    sections: [
      {
        section:
          "GENERAL",

        status:
          generalResult
            .reconstruction_status,

        reasons:
          generalResult
            .review_reasons
      },

      {
        section:
          "FEE_WAIVER",

        status:
          feeWaiverResult
            .reconstruction_status,

        reasons:
          feeWaiverResult
            .review_reasons
      },

      {
        section:
          "HOSTEL",

        status:
          hostelResult
            .reconstruction_status,

        reasons:
          hostelResult
            .review_reasons
      }
    ],

    import_allowed:
      false
  };


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      result,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    REVIEW_OUTPUT,

    JSON.stringify(
      review,
      null,
      2
    ),

    "utf8"
  );


  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "RECONSTRUCTION SUMMARY"
  );

  console.log(
    "======================================="
  );


  console.table([
    {
      section:
        "GENERAL",

      status:
        generalResult
          .reconstruction_status,

      verified:
        generalResult
          .verified_year_fees
          .length
    },

    {
      section:
        "FEE_WAIVER",

      status:
        feeWaiverResult
          .reconstruction_status,

      verified:
        feeWaiverResult
          .verified_year_fees
          .length
    },

    {
      section:
        "HOSTEL",

      status:
        hostelResult
          .reconstruction_status,

      verified:
        hostelResult
          .verified_hostel_fees
          .length
    }
  ]);


  console.log("");

  console.log(
    "FINAL STATUS:",
    result.final_status
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log(
    "Saved:",
    REVIEW_OUTPUT
  );


  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
}


main().catch(
  error => {
    console.error("");

    console.error(
      "FAILED:",
      error.message
    );

    console.error(
      error.stack
    );

    process.exitCode =
      1;
  }
);