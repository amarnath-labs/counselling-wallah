import fs from "node:fs/promises";

const INPUT =
  "./fee-master-remaining-after-completed.json";

const OUTPUT =
  "./fee-master-priority-source-ready.json";

const REVIEW =
  "./fee-master-priority-source-review.json";


const SOURCE_UPDATES = {
  "uptac-abss-institute-of-technology-meerut-meerut": {
    academic_year: 2026,

    official_website:
      "https://www.abss.edu.in/",

    fee_source_url:
      "https://www.abss.edu.in/content.php?c=l&id=38",

    source_type:
      "official_html",

    source_status:
      "CURRENT_OFFICIAL_SOURCE",

    confidence_score:
      99
  },


  /*
  |--------------------------------------------------------------------------
  | Keep Assam in review until exact academic year/source is confirmed.
  |--------------------------------------------------------------------------
  */

  "assam-university-silchar": {
    source_status:
      "REVIEW_YEAR_OR_SOURCE"
  },


  /*
  |--------------------------------------------------------------------------
  | BBDNIIT current known official fee PDF is 2023-24.
  |--------------------------------------------------------------------------
  */

  "uptac-babu-banarasi-das-northern-india-institute-of-technology-lucknow": {
    academic_year:
      2023,

    official_website:
      "https://bbdniit.ac.in/",

    fee_source_url:
      "https://bbdniit.ac.in/wp-content/uploads/2022/05/bbdniit-fee-structure-23-24-.pdf",

    source_type:
      "official_pdf",

    source_status:
      "OUTDATED_SOURCE",

    confidence_score:
      99
  }
};


function getUpdate(
  row
) {
  /*
  |--------------------------------------------------------------------------
  | First try exact ID.
  |--------------------------------------------------------------------------
  */

  if (
    SOURCE_UPDATES[
      row.college_id
    ]
  ) {
    return SOURCE_UPDATES[
      row.college_id
    ];
  }


  /*
  |--------------------------------------------------------------------------
  | Name fallback only for known priority colleges.
  |--------------------------------------------------------------------------
  */

  const name =
    String(
      row.college_name ||
      ""
    );


  if (
    /ABSS INSTITUTE/i.test(
      name
    )
  ) {
    return SOURCE_UPDATES[
      "uptac-abss-institute-of-technology-meerut-meerut"
    ];
  }


  if (
    /Assam University/i.test(
      name
    )
  ) {
    return {
      source_status:
        "REVIEW_YEAR_OR_SOURCE"
    };
  }


  if (
    /NORTHERN INDIA INSTITUTE/i.test(
      name
    )
  ) {
    return SOURCE_UPDATES[
      "uptac-babu-banarasi-das-northern-india-institute-of-technology-lucknow"
    ];
  }


  return null;
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


  const ready = [];
  const review = [];


  for (
    const row
    of rows
  ) {
    const update =
      getUpdate(
        row
      );


    const merged =
      update
        ? {
            ...row,
            ...update
          }
        : row;


    if (
      merged.source_status ===
      "CURRENT_OFFICIAL_SOURCE"
    ) {
      ready.push(
        merged
      );

      continue;
    }


    review.push(
      merged
    );
  }


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      ready,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    REVIEW,

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
    "PRIORITY FEE SOURCE UPDATE"
  );

  console.log(
    "======================================="
  );

  console.log("");


  console.log(
    "CURRENT SOURCE READY"
  );


  console.table(
    ready.map(
      row => ({
        college:
          row.college_name,

        year:
          row.academic_year,

        type:
          row.source_type,

        status:
          row.source_status,

        source:
          row.fee_source_url
            ? "yes"
            : "no"
      })
    )
  );


  console.log("");

  console.log(
    "READY:",
    ready.length
  );


  console.log(
    "REVIEW / DISCOVERY:",
    review.length
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log(
    "Saved:",
    REVIEW
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

    process.exitCode =
      1;
  }
);