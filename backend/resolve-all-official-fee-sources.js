import "dotenv/config";

import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";


/*
|--------------------------------------------------------------------------
| INPUT / OUTPUT
|--------------------------------------------------------------------------
*/

const INPUT =
  "./all-colleges-fee-source-family.json";

const OUTPUT =
  "./all-colleges-official-fee-sources.json";

const READY_OUTPUT =
  "./all-colleges-source-ready.json";

const DISCOVERY_OUTPUT =
  "./all-colleges-source-discovery-required.json";

const HOLD_OUTPUT =
  "./all-colleges-source-hold.json";


/*
|--------------------------------------------------------------------------
| TARGET
|--------------------------------------------------------------------------
*/

const TARGET_YEAR = 2026;


/*
|--------------------------------------------------------------------------
| OFFICIAL CENTRAL SOURCES
|--------------------------------------------------------------------------
*/

const JOSAA_FEE_PAGE =
  "https://josaa.nic.in/document/fee-details-of-participating-institutes-pis/";

const JOSAA_PARTICIPATING_PAGE =
  "https://josaa.nic.in/participating-institutes/";

const UPTAC_2026 =
  "https://uptac.samarth.edu.in/";


/*
|--------------------------------------------------------------------------
| VERIFIED OFFICIAL OVERRIDES
|--------------------------------------------------------------------------
*/

const VERIFIED_OVERRIDES = {

  "ambalika institute of management & technology,lucknow": {
    academic_year: 2026,

    source_type:
      "official_html",

    official_website:
      "https://www.aimt.edu.in/",

    fee_source_url:
      "https://www.profile.aimt.edu.in/aimt-fee-structure/",

    source_status:
      "CURRENT_OFFICIAL_SOURCE"
  },


  "assam university, silchar": {
    academic_year: 2026,

    source_type:
      "official_html",

    official_website:
      "https://www.aus.ac.in/",

    fee_source_url:
      "https://www.ausexamination.ac.in/admission/",

    source_status:
      "CURRENT_OFFICIAL_SOURCE_REVIEW"
  }

};


/*
|--------------------------------------------------------------------------
| GLOBAL CENTRAL SOURCE STATUS
|--------------------------------------------------------------------------
*/

let JOSAA_SOURCE_OK = false;
let JOSAA_SOURCE_CHECK = null;

let UPTAC_SOURCE_OK = false;
let UPTAC_SOURCE_CHECK = null;


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function clean(value) {
  return String(
    value ?? ""
  )
    .replace(
      /\uFEFF/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function normalizeName(value) {
  return clean(
    value
  ).toLowerCase();
}


/*
|--------------------------------------------------------------------------
| HTTP CHECK
|--------------------------------------------------------------------------
*/

async function checkUrl(url) {

  if (!url) {
    return {
      ok: false,
      error: "Missing URL"
    };
  }


  try {

    const response =
      await axios.get(
        url,
        {
          timeout:
            30000,

          maxRedirects:
            8,

          responseType:
            "arraybuffer",

          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

            Accept:
              "text/html,application/xhtml+xml,application/pdf,*/*"
          },

          validateStatus:
            status =>
              status >= 200 &&
              status < 400
        }
      );


    return {
      ok:
        true,

      status:
        response.status,

      final_url:
        response.request
          ?.res
          ?.responseUrl ||
        url,

      content_type:
        String(
          response.headers[
            "content-type"
          ] || ""
        ).toLowerCase(),

      bytes:
        Buffer.byteLength(
          response.data
        )
    };


  } catch (error) {

    return {
      ok:
        false,

      error:
        error.message
    };
  }

}


/*
|--------------------------------------------------------------------------
| FIND FEE PAGE FROM OFFICIAL WEBSITE
|--------------------------------------------------------------------------
*/

async function discoverFeePage(
  officialWebsite
) {

  if (!officialWebsite) {
    return null;
  }


  try {

    const response =
      await axios.get(
        officialWebsite,
        {
          timeout:
            30000,

          maxRedirects:
            8,

          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142 Safari/537.36",

            Accept:
              "text/html,application/xhtml+xml,*/*"
          }
        }
      );


    const html =
      String(
        response.data || ""
      );


    const $ =
      cheerio.load(
        html
      );


    const candidates = [];


    $("a[href]").each(
      (
        _,
        element
      ) => {

        const href =
          clean(
            $(element)
              .attr("href")
          );


        const text =
          clean(
            $(element)
              .text()
          );


        const combined =
          `${text} ${href}`;


        if (
          /fee\s*structure|fee\s*details|fees|tuition\s*fee|admission\s*fee|course\s*fee/i.test(
            combined
          )
        ) {

          try {

            const absolute =
              new URL(
                href,
                officialWebsite
              ).href;


            candidates.push(
              absolute
            );

          } catch {}

        }

      }
    );


    const unique =
      [
        ...new Set(
          candidates
        )
      ]
        .slice(
          0,
          15
        );


    for (
      const candidate
      of unique
    ) {

      const check =
        await checkUrl(
          candidate
        );


      if (
        !check.ok
      ) {
        continue;
      }


      return {
        fee_source_url:
          check.final_url ||
          candidate,

        source_type:
          check.content_type
            .includes(
              "pdf"
            )
            ? "official_pdf"
            : "official_html",

        discovery_method:
          "OFFICIAL_SITE_FEE_LINK",

        source_check:
          check
      };

    }


  } catch {}


  return null;
}


/*
|--------------------------------------------------------------------------
| RESOLVE ONE COLLEGE
|--------------------------------------------------------------------------
*/

async function resolveRow(row) {

  const name =
    normalizeName(
      row.college_name
    );


  /*
  |--------------------------------------------------------------------------
  | COMPLETED
  |--------------------------------------------------------------------------
  */

  if (
    row.source_family ===
    "COMPLETED"
  ) {

    return {
      ...row,

      source_resolution_status:
        "ALREADY_COMPLETED",

      import_candidate:
        false
    };

  }


  /*
  |--------------------------------------------------------------------------
  | VERIFIED OVERRIDE
  |--------------------------------------------------------------------------
  */

  const override =
    VERIFIED_OVERRIDES[
      name
    ];


  if (
    override
  ) {

    const check =
      await checkUrl(
        override
          .fee_source_url
      );


    return {
      ...row,
      ...override,

      source_resolution_status:
        check.ok
          ? "SOURCE_READY"
          : "SOURCE_FETCH_FAILED",

      source_check:
        check,

      import_candidate:
        (
          check.ok &&
          override
            .source_status ===
            "CURRENT_OFFICIAL_SOURCE"
        )
    };

  }


  /*
  |--------------------------------------------------------------------------
  | EXISTING SOURCE URL FROM MANIFEST
  |--------------------------------------------------------------------------
  */

  const existingFeeSource =
    row.fee_source_url ||
    row.source_url ||
    null;


  if (
    existingFeeSource
  ) {

    const check =
      await checkUrl(
        existingFeeSource
      );


    if (
      check.ok
    ) {

      return {
        ...row,

        academic_year:
          row.academic_year ||
          TARGET_YEAR,

        fee_source_url:
          check.final_url ||
          existingFeeSource,

        source_type:
          check.content_type
            .includes(
              "pdf"
            )
            ? "official_pdf"
            : (
              row.source_type ||
              "official_html"
            ),

        source_resolution_status:
          "SOURCE_READY_REVIEW",

        source_check:
          check,

        import_candidate:
          false
      };

    }

  }


  /*
  |--------------------------------------------------------------------------
  | JOSAA FAMILY
  |--------------------------------------------------------------------------
  */

  if (
    row.source_family ===
    "JOSAA"
  ) {

    if (
      !JOSAA_SOURCE_OK
    ) {

      return {
        ...row,

        academic_year:
          TARGET_YEAR,

        source_resolution_status:
          "CENTRAL_SOURCE_FETCH_FAILED",

        source_status:
          "JOSAA_2026_SOURCE_UNAVAILABLE",

        fee_source_url:
          JOSAA_FEE_PAGE,

        source_check:
          JOSAA_SOURCE_CHECK,

        import_candidate:
          false
      };

    }


    return {
      ...row,

      academic_year:
        TARGET_YEAR,

      source_type:
        "official_josaa_2026",

      official_website:
        row.official_website ||
        JOSAA_PARTICIPATING_PAGE,

      fee_source_url:
        JOSAA_FEE_PAGE,

      source_status:
        "CURRENT_OFFICIAL_CENTRAL_SOURCE",

      source_resolution_status:
        "SOURCE_READY",

      normalization_strategy:
        "MATCH_INSTITUTE_INSIDE_JOSAA_FEE_SOURCE",

      source_check:
        JOSAA_SOURCE_CHECK,

      import_candidate:
        false
    };

  }


  /*
  |--------------------------------------------------------------------------
  | UPTAC FAMILY
  |--------------------------------------------------------------------------
  */

  if (
    row.source_family ===
    "UPTAC"
  ) {

    /*
    |--------------------------------------------------------------------------
    | Official institute website available
    |--------------------------------------------------------------------------
    */

    if (
      row.official_website
    ) {

      const discovered =
        await discoverFeePage(
          row.official_website
        );


      if (
        discovered
      ) {

        return {
          ...row,

          academic_year:
            TARGET_YEAR,

          ...discovered,

          source_status:
            "CURRENT_OFFICIAL_SOURCE_CANDIDATE",

          source_resolution_status:
            "SOURCE_READY_REVIEW",

          uptac_portal:
            UPTAC_2026,

          uptac_portal_ok:
            UPTAC_SOURCE_OK,

          import_candidate:
            false
        };

      }

    }


    /*
    |--------------------------------------------------------------------------
    | No exact institute fee source
    |--------------------------------------------------------------------------
    */

    return {
      ...row,

      academic_year:
        TARGET_YEAR,

      uptac_portal:
        UPTAC_2026,

      uptac_portal_ok:
        UPTAC_SOURCE_OK,

      source_status:
        UPTAC_SOURCE_OK
          ? "CURRENT_COUNSELLING_PORTAL_ONLY"
          : "UPTAC_2026_PORTAL_UNAVAILABLE",

      source_resolution_status:
        "INSTITUTE_FEE_SOURCE_REQUIRED",

      import_candidate:
        false
    };

  }


  /*
  |--------------------------------------------------------------------------
  | OTHER FAMILY
  |--------------------------------------------------------------------------
  */

  if (
    row.source_family ===
    "OTHER"
  ) {

    if (
      row.official_website
    ) {

      const discovered =
        await discoverFeePage(
          row.official_website
        );


      if (
        discovered
      ) {

        return {
          ...row,

          academic_year:
            TARGET_YEAR,

          ...discovered,

          source_status:
            "CURRENT_OFFICIAL_SOURCE_CANDIDATE",

          source_resolution_status:
            "SOURCE_READY_REVIEW",

          import_candidate:
            false
        };

      }

    }


    return {
      ...row,

      source_resolution_status:
        "OFFICIAL_WEBSITE_REQUIRED",

      import_candidate:
        false
    };

  }


  /*
  |--------------------------------------------------------------------------
  | UNKNOWN
  |--------------------------------------------------------------------------
  */

  return {
    ...row,

    source_resolution_status:
      "UNCLASSIFIED",

    import_candidate:
      false
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
    "ALL OFFICIAL FEE SOURCE RESOLVER"
  );

  console.log(
    "======================================="
  );

  console.log("");


  /*
  |--------------------------------------------------------------------------
  | READ INPUT
  |--------------------------------------------------------------------------
  */

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


  if (
    !Array.isArray(
      rows
    )
  ) {

    throw new Error(
      "Input must be an array."
    );

  }


  console.log(
    "Input file:",
    INPUT
  );


  console.log(
    "Input colleges:",
    rows.length
  );


  console.log(
    "Target year:",
    TARGET_YEAR
  );


  /*
  |--------------------------------------------------------------------------
  | CENTRAL SOURCE CHECKS
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "Checking JoSAA 2026 official fee source..."
  );


  JOSAA_SOURCE_CHECK =
    await checkUrl(
      JOSAA_FEE_PAGE
    );


  JOSAA_SOURCE_OK =
    JOSAA_SOURCE_CHECK.ok;


  console.log(
    JOSAA_SOURCE_OK
      ? `JoSAA source: OK (${JOSAA_SOURCE_CHECK.bytes} bytes)`
      : `JoSAA source failed: ${JOSAA_SOURCE_CHECK.error}`
  );


  console.log("");

  console.log(
    "Checking UPTAC 2026 portal..."
  );


  UPTAC_SOURCE_CHECK =
    await checkUrl(
      UPTAC_2026
    );


  UPTAC_SOURCE_OK =
    UPTAC_SOURCE_CHECK.ok;


  console.log(
    UPTAC_SOURCE_OK
      ? `UPTAC 2026: OK (${UPTAC_SOURCE_CHECK.bytes} bytes)`
      : `UPTAC 2026 failed: ${UPTAC_SOURCE_CHECK.error}`
  );


  console.log("");


  /*
  |--------------------------------------------------------------------------
  | PROCESS ALL COLLEGES
  |--------------------------------------------------------------------------
  */

  const results = [];


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i];


    console.log(
      `[${i + 1}/${rows.length}] ${row.college_name}`
    );


    try {

      const resolved =
        await resolveRow(
          row
        );


      results.push(
        resolved
      );


      console.log(
        " ->",
        resolved
          .source_resolution_status
      );


    } catch (error) {

      results.push({
        ...row,

        source_resolution_status:
          "RESOLUTION_FAILED",

        import_candidate:
          false,

        error:
          error.message
      });


      console.log(
        " -> RESOLUTION_FAILED:",
        error.message
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | GROUPS
  |--------------------------------------------------------------------------
  */

  const ready =
    results.filter(
      row =>
        [
          "SOURCE_READY",
          "SOURCE_READY_REVIEW"
        ].includes(
          row
            .source_resolution_status
        )
    );


  const discovery =
    results.filter(
      row =>
        [
          "INSTITUTE_FEE_SOURCE_REQUIRED",
          "OFFICIAL_WEBSITE_REQUIRED"
        ].includes(
          row
            .source_resolution_status
        )
    );


  const completed =
    results.filter(
      row =>
        row
          .source_resolution_status ===
        "ALREADY_COMPLETED"
    );


  const hold =
    results.filter(
      row =>
        ![
          "SOURCE_READY",
          "SOURCE_READY_REVIEW",
          "INSTITUTE_FEE_SOURCE_REQUIRED",
          "OFFICIAL_WEBSITE_REQUIRED",
          "ALREADY_COMPLETED"
        ].includes(
          row
            .source_resolution_status
        )
    );


  /*
  |--------------------------------------------------------------------------
  | SAVE FILES
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    "utf8"
  );


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
    DISCOVERY_OUTPUT,

    JSON.stringify(
      discovery,
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


  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = {};


  for (
    const row
    of results
  ) {

    const status =
      row
        .source_resolution_status;


    counts[
      status
    ] =
      (
        counts[
          status
        ] ||
        0
      ) +
      1;

  }


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "SOURCE RESOLUTION SUMMARY"
  );

  console.log(
    "======================================="
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


  console.log("");

  console.log(
    "TOTAL:",
    results.length
  );


  console.log(
    "SOURCE READY:",
    ready.length
  );


  console.log(
    "DISCOVERY REQUIRED:",
    discovery.length
  );


  console.log(
    "HOLD / FAILED:",
    hold.length
  );


  console.log(
    "ALREADY COMPLETED:",
    completed.length
  );


  console.log("");

  console.log(
    "JOSAA central source:",
    JOSAA_SOURCE_OK
      ? "AVAILABLE"
      : "FAILED"
  );


  console.log(
    "UPTAC 2026 portal:",
    UPTAC_SOURCE_OK
      ? "AVAILABLE"
      : "FAILED"
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log(
    "Saved:",
    READY_OUTPUT
  );


  console.log(
    "Saved:",
    DISCOVERY_OUTPUT
  );


  console.log(
    "Saved:",
    HOLD_OUTPUT
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