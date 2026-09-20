import fs from "node:fs/promises";

const INPUT =
  "./fee-master-discovery-queue.json";

const OUTPUT =
  "./fee-master-discovery-queue-updated.json";

const VERIFIED_SOURCES = {
  "uptac-abss-institute-of-technology-meerut-meerut": {
    academic_year: 2026,
    official_website: "https://abss.edu.in/",
    fee_source_url: "https://abss.edu.in/content.php?c=l&id=38",
    source_type: "official_html",
    discovery_status: "SOURCE_FOUND_CURRENT",
    confidence_score: 99
  },

  "uptac-ajay-kumar-garg-engg-college-ghaziabad": {
    academic_year: 2026,
    official_website: "https://www.akgec.ac.in/",
    fee_source_url: "https://www.akgec.ac.in/fee-new-students/",
    source_type: "official_html",
    discovery_status: "SOURCE_FOUND_CURRENT",
    confidence_score: 99
  }
};

async function main() {
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

  let updated = 0;

  for (
    const row
    of rows
  ) {
    const source =
      VERIFIED_SOURCES[
        row.college_id
      ];

    if (!source) {
      continue;
    }

    Object.assign(
      row,
      source
    );

    row.source_url =
      source.fee_source_url;

    row.queue_status =
      "SOURCE_READY";

    row.review_reasons =
      [];

    updated++;
  }

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      rows,
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
    "BULK VERIFIED SOURCE UPDATE"
  );
  console.log(
    "======================================="
  );
  console.log("");

  console.table(
    rows
      .filter(
        row =>
          row.queue_status ===
          "SOURCE_READY"
      )
      .map(
        row => ({
          college:
            row.college_name,

          year:
            row.academic_year,

          type:
            row.source_type,

          confidence:
            row.confidence_score,

          status:
            row.discovery_status
        })
      )
  );

  console.log("");

  console.log(
    "New verified sources added:",
    updated
  );

  console.log(
    "Saved:",
    OUTPUT
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
