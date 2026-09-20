import fs from "node:fs/promises";

const INPUT =
  "./fee-master-batch-extraction.json";

const READY_OUTPUT =
  "./fee-master-normalization-ready.json";

const REVIEW_OUTPUT =
  "./fee-master-extraction-review.json";

function classify(row) {
  const reasons = [];

  if (
    row.extraction_status !==
    "EXTRACTED"
  ) {
    reasons.push(
      "Source extraction failed."
    );
  }

  if (
    !row.signals?.btech
  ) {
    reasons.push(
      "B.Tech not detected."
    );
  }

  if (
    !row.signals?.tuition &&
    !row.signals?.total
  ) {
    reasons.push(
      "Neither tuition nor total fee detected."
    );
  }

  if (
    (row.text_characters || 0) < 2000 &&
    (row.tables_count || 0) === 0
  ) {
    reasons.push(
      "Source content too sparse for reliable normalization."
    );
  }

  if (
    (row.amounts_count || 0) < 5
  ) {
    reasons.push(
      "Too few fee amounts extracted."
    );
  }

  return {
    ready:
      reasons.length === 0,

    reasons
  };
}

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "FEE EXTRACTION QUALITY GATE"
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

  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );

  const ready = [];
  const review = [];

  for (
    const row
    of rows
  ) {
    const result =
      classify(row);

    if (
      result.ready
    ) {
      ready.push({
        ...row,
        normalization_gate:
          "READY"
      });

    } else {
      review.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        academic_year:
          row.academic_year,

        source_url:
          row.source_url,

        normalization_gate:
          "REVIEW_REQUIRED",

        reasons:
          result.reasons,

        extraction_summary: {
          chars:
            row.text_characters || 0,

          tables:
            row.tables_count || 0,

          amounts:
            row.amounts_count || 0,

          signals:
            row.signals || {}
        }
      });
    }
  }

  await fs.writeFile(
    READY_OUTPUT,

    JSON.stringify(
      ready,
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

  console.log(
    "QUALITY GATE SUMMARY"
  );

  console.table([
    {
      status:
        "NORMALIZATION_READY",

      count:
        ready.length
    },
    {
      status:
        "REVIEW_REQUIRED",

      count:
        review.length
    }
  ]);

  console.log("");

  console.log(
    "READY"
  );

  console.table(
    ready.map(
      row => ({
        college:
          row.college_name,

        year:
          row.academic_year,

        chars:
          row.text_characters,

        tables:
          row.tables_count,

        amounts:
          row.amounts_count
      })
    )
  );

  console.log("");

  console.log(
    "REVIEW"
  );

  console.table(
    review.map(
      row => ({
        college:
          row.college_name,

        reasons:
          row.reasons.join(
            " | "
          )
      })
    )
  );

  console.log("");

  console.log(
    "Saved:",
    READY_OUTPUT
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
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  }
);
