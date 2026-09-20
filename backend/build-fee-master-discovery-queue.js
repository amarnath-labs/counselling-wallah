import fs from "node:fs/promises";

const INPUT =
  "./fee-master-batch-manifest.json";

const OUTPUT =
  "./fee-master-discovery-queue.json";

const COMPLETED =
  new Set([
    "uptac-ashoka-institute-of-technology-management-varanasi"
  ]);

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueries(row) {
  const college =
    clean(row.college_name);

  const year =
    row.academic_year || 2026;

  return [
    `"${college}" B.Tech fee structure ${year}`,
    `"${college}" official fee structure ${year}-${String(year + 1).slice(-2)}`,
    `"${college}" BTech tuition fee official PDF`,
    `site:ac.in "${college}" fee structure B.Tech`,
    `site:edu.in "${college}" fee structure B.Tech`
  ];
}

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "MASTER FEE SOURCE DISCOVERY QUEUE"
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

  const queue = [];

  for (
    const row
    of rows
  ) {
    if (
      COMPLETED.has(
        row.college_id
      )
    ) {
      queue.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        queue_status:
          "COMPLETED",

        previous_status:
          row.batch_status,

        source_url:
          row.source_url ||
          null,

        queries:
          []
      });

      continue;
    }

    let queueStatus =
      "DISCOVERY_REQUIRED";

    if (
      row.batch_status ===
      "REVIEW_REQUIRED"
    ) {
      queueStatus =
        "REVIEW_YEAR_OR_SOURCE";
    }

    if (
      row.batch_status ===
      "AUTO_READY_SOURCE"
    ) {
      queueStatus =
        "SOURCE_READY";
    }

    if (
      row.batch_status ===
      "BRANCH_MAPPING_REQUIRED"
    ) {
      queueStatus =
        "BRANCH_MAPPING_REQUIRED";
    }

    queue.push({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      academic_year:
        row.academic_year ||
        null,

      source_url:
        row.source_url ||
        null,

      previous_status:
        row.batch_status,

      queue_status:
        queueStatus,

      review_reasons:
        row.review_reasons ||
        [],

      queries:
        buildQueries(
          row
        )
    });
  }

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      queue,
      null,
      2
    ),

    "utf8"
  );

  const summary = {};

  for (
    const row
    of queue
  ) {
    summary[
      row.queue_status
    ] =
      (
        summary[
          row.queue_status
        ] ||
        0
      ) + 1;
  }

  console.log(
    "QUEUE SUMMARY"
  );

  console.table(
    Object.entries(
      summary
    ).map(
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

  console.log("");

  console.log(
    "ACTIVE DISCOVERY QUEUE"
  );

  console.table(
    queue
      .filter(
        row =>
          row.queue_status !==
          "COMPLETED"
      )
      .map(
        (
          row,
          index
        ) => ({
          no:
            index + 1,

          college:
            row.college_name,

          status:
            row.queue_status,

          year:
            row.academic_year,

          has_source:
            row.source_url
              ? "yes"
              : "no",

          queries:
            row.queries.length
        })
      )
  );

  console.log("");

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
