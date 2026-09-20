import fs from "node:fs/promises";

const INPUT =
  "./fee-master-discovery-queue.json";

const OUTPUT =
  "./fee-master-remaining-after-completed.json";

const COMPLETED_COLLEGES = new Set([
  "uptac-abes-engg-college-ghaziabad",
  "uptac-abes-institute-of-technology-ghaziabad",
  "uptac-ashoka-institute-of-technology-management-varanasi",
  "uptac-ajay-kumar-garg-engg-college-ghaziabad"
]);

function priority(row) {
  if (
    row.college_name ===
    "Assam University, Silchar"
  ) {
    return 1;
  }

  if (
    /ABSS INSTITUTE/i.test(
      row.college_name
    )
  ) {
    return 2;
  }

  if (
    /ACCURATE INSTITUTE/i.test(
      row.college_name
    )
  ) {
    return 3;
  }

  if (
    /ALLENHOUSE/i.test(
      row.college_name
    )
  ) {
    return 4;
  }

  if (
    /B\.N\.COLLEGE|BNCET/i.test(
      row.college_name
    )
  ) {
    return 5;
  }

  if (
    /NORTHERN INDIA INSTITUTE/i.test(
      row.college_name
    )
  ) {
    return 6;
  }

  return 100;
}

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

  const remaining =
    rows
      .filter(
        row =>
          !COMPLETED_COLLEGES.has(
            row.college_id
          )
      )
      .sort(
        (a, b) =>
          priority(a) -
          priority(b)
      );

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      remaining,
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
    "REFRESHED REMAINING FEE QUEUE"
  );
  console.log(
    "======================================="
  );
  console.log("");

  console.table(
    remaining.map(
      (row, index) => ({
        no:
          index + 1,

        college:
          row.college_name,

        year:
          row.academic_year ?? null,

        status:
          row.queue_status ||
          row.discovery_status,

        source:
          row.fee_source_url ||
          row.source_url
            ? "yes"
            : "no"
      })
    )
  );

  console.log("");
  console.log(
    "Remaining:",
    remaining.length
  );

  console.log(
    "Completed excluded:",
    COMPLETED_COLLEGES.size
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
