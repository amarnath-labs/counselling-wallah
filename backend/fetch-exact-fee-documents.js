import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";

const EVIDENCE_FILE =
  "./safe-26-fee-evidence-pack.json";

const CHILD_FILE =
  "./safe-fee-child-links-all.json";

const OUTPUT_DIR =
  "./fee-documents-2026";

const MANIFEST =
  "./fee-documents-2026-manifest.json";

const REVIEW =
  "./fee-documents-2026-review.json";

const TIMEOUT = 35000;

/*
|--------------------------------------------------------------------------
| Explicit high-confidence current fee documents
|--------------------------------------------------------------------------
|
| We intentionally do NOT rely on generic scoring here.
| These URLs came from official college pages and have strong fee identity.
|
*/

const OVERRIDES = {
  "Bharat Ratna Sardar Vallabhbhai Patel Rajkiya Engineering College, Basti": [
    {
      type: "academic_fee",
      url:
        "https://recbasti.ac.in/wp-content/uploads/2026/07/Fee-structure-2026-27.pdf",
      academic_year: 2026
    }
  ],

  "INDIAN INSTITUTE OF INFORMATION TECHNOLOGY SENAPATI MANIPUR": [
    {
      type: "combined_fee",
      url:
        "https://www.iiitmanipur.ac.in/pages/academic/admission2026/FeeSstructure2026_27.pdf",
      academic_year: 2026
    }
  ],

  "Indian Institute of Information Technology, Agartala": [
    {
      type: "combined_fee",
      url:
        "https://iiitagartala.s3.ap-south-1.amazonaws.com/website/uploads/notices/2249de93-c2eb-4446-ae4a-bc9b50a47a6e.pdf",
      academic_year: 2026
    }
  ],

  "Indian Institute of Science, Bangalore": [
    {
      type: "combined_fee",
      url:
        "https://www.iisc.ac.in/wp-content/uploads/2026/04/Circular-Fee-Structure-AY-2026-27.pdf",
      academic_year: 2026
    }
  ],

  "Indian Institute of Technology Dharwad": [
    {
      type: "combined_fee",
      url:
        "https://www.iitdh.ac.in/sites/default/files/2026-06/B.Tech-BS%20fee%20pdf.pdf",
      academic_year: 2026
    }
  ],

  "Indian Institute of Technology Mandi": [
    {
      type: "academic_fee",
      url:
        "https://academics.iitmandi.ac.in/pdf/fees/Academic_Fee_Structure_ODD_Semester_AY_2026_2027_New_Entrants_August_2026.pdf",
      academic_year: 2026
    },
    {
      type: "hostel_mess_fee",
      url:
        "https://academics.iitmandi.ac.in/pdf/fees/Hostel_Mess_Charges2026_27_New_admission.pdf",
      academic_year: 2026
    }
  ],

  "Indian Institute of Technology Palakkad": [
    {
      type: "combined_fee",
      url:
        "https://iitpkd.ac.in/sites/default/files/2026-07/05640537-0097-42c9-8968-f0aac63124b9.pdf",
      academic_year: 2026
    }
  ],

  "National Institute of Technology Karnataka, Surathkal": [
    {
      type: "combined_fee",
      url:
        "https://www.nitk.ac.in/document/attachments/9831/Fees_Structure_removed.pdf",
      academic_year: 2026
    }
  ],

  "National Institute of Technology Sikkim": [
    {
      type: "combined_fee",
      url:
        "https://nitsikkim.ac.in/documents/Fee%20Structure/2026_April/B.Tech.%20Fee%20structure%20for%20Academic%20Year%202026-27.pdf",
      academic_year: 2026
    }
  ]
};

function safeName(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

function extensionFromType(contentType, url) {
  const ct =
    String(contentType || "")
      .toLowerCase();

  if (
    ct.includes("application/pdf")
  ) {
    return ".pdf";
  }

  if (
    ct.includes("text/html")
  ) {
    return ".html";
  }

  try {
    const ext =
      path.extname(
        new URL(url).pathname
      );

    if (
      ext &&
      ext.length <= 8
    ) {
      return ext;
    }
  } catch {
    // ignore
  }

  return ".bin";
}

async function fetchDocument(url) {
  return axios.get(url, {
    responseType: "arraybuffer",
    timeout: TIMEOUT,
    maxRedirects: 10,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CounsellingWallahFeeResearch/1.0)",

      Accept:
        "application/pdf,text/html,application/xhtml+xml,*/*"
    },

    validateStatus(status) {
      return (
        status >= 200 &&
        status < 400
      );
    }
  });
}

async function main() {
  console.log(
    "\n=========================================="
  );

  console.log(
    "EXACT 2026 B.TECH FEE DOCUMENT FETCHER"
  );

  console.log(
    "==========================================\n"
  );

  await fs.mkdir(
    OUTPUT_DIR,
    {
      recursive: true
    }
  );

  const evidence =
    JSON.parse(
      (
        await fs.readFile(
          EVIDENCE_FILE,
          "utf8"
        )
      ).replace(/^\uFEFF/, "")
    );

  // Read for traceability.
  try {
    await fs.readFile(
      CHILD_FILE,
      "utf8"
    );
  } catch {
    console.warn(
      "Warning: child-link JSON not found."
    );
  }

  const manifest = [];
  const review = [];

  /*
  |--------------------------------------------------------------------------
  | Direct HTML evidence already captured
  |--------------------------------------------------------------------------
  */

  const directNames = new Set([
    "Indian Institute of Information Technology Bhagalpur",

    "Indian Institute of Information Technology(IIIT), Vadodara, Gujrat",

    "Indian Institute of Information Technology, Vadodara International Campus Diu (IIITVICD)"
  ]);

  for (const college of evidence) {
    if (
      directNames.has(
        college.college_name
      )
    ) {
      manifest.push({
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        source_type:
          "DIRECT_HTML_EVIDENCE",

        document_type:
          "combined_fee",

        academic_year:
          2026,

        source_url:
          college.source_url,

        local_path:
          null,

        fetch_status:
          "DIRECT_EVIDENCE_ALREADY_CAPTURED",

        verification_status:
          "EXTRACTION_PENDING"
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Download explicit current fee documents
  |--------------------------------------------------------------------------
  */

  const evidenceByName =
    new Map(
      evidence.map(
        row => [
          row.college_name,
          row
        ]
      )
    );

  for (
    const [
      collegeName,
      documents
    ] of Object.entries(
      OVERRIDES
    )
  ) {
    const college =
      evidenceByName.get(
        collegeName
      );

    if (!college) {
      review.push({
        college_name:
          collegeName,

        status:
          "COLLEGE_NOT_FOUND_IN_EVIDENCE"
      });

      continue;
    }

    for (
      let index = 0;
      index < documents.length;
      index++
    ) {
      const document =
        documents[index];

      console.log(
        `${collegeName}`
      );

      console.log(
        ` -> ${document.type}`
      );

      console.log(
        ` -> ${document.url}`
      );

      try {
        const response =
          await fetchDocument(
            document.url
          );

        const contentType =
          String(
            response.headers[
              "content-type"
            ] || ""
          );

        const extension =
          extensionFromType(
            contentType,
            document.url
          );

        const filename =
          `${safeName(
            collegeName
          )}__${document.type}__${index + 1}${extension}`;

        const filepath =
          path.join(
            OUTPUT_DIR,
            filename
          );

        await fs.writeFile(
          filepath,
          Buffer.from(
            response.data
          )
        );

        const size =
          Buffer.byteLength(
            response.data
          );

        manifest.push({
          college_id:
            college.college_id,

          college_name:
            collegeName,

          source_type:
            "OFFICIAL_CHILD_DOCUMENT",

          document_type:
            document.type,

          academic_year:
            document.academic_year,

          source_url:
            document.url,

          content_type:
            contentType,

          local_path:
            filepath,

          bytes:
            size,

          fetch_status:
            "FETCHED",

          verification_status:
            "EXTRACTION_PENDING"
        });

        console.log(
          ` -> SAVED ${filename}`
        );

        console.log(
          ` -> ${size} bytes\n`
        );
      } catch (error) {
        console.log(
          ` -> FAILED: ${error.message}\n`
        );

        review.push({
          college_id:
            college.college_id,

          college_name:
            collegeName,

          document_type:
            document.type,

          source_url:
            document.url,

          status:
            "FETCH_FAILED",

          error:
            error.message
        });
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            350
          )
      );
    }
  }

  await fs.writeFile(
    MANIFEST,
    JSON.stringify(
      manifest,
      null,
      2
    )
  );

  await fs.writeFile(
    REVIEW,
    JSON.stringify(
      review,
      null,
      2
    )
  );

  const downloaded =
    manifest.filter(
      x =>
        x.fetch_status ===
        "FETCHED"
    );

  const direct =
    manifest.filter(
      x =>
        x.fetch_status ===
        "DIRECT_EVIDENCE_ALREADY_CAPTURED"
    );

  console.log(
    "\n=========================================="
  );

  console.log(
    "DOCUMENT FETCH SUMMARY"
  );

  console.log(
    "==========================================\n"
  );

  console.log(
    "Downloaded documents :",
    downloaded.length
  );

  console.log(
    "Direct HTML sources  :",
    direct.length
  );

  console.log(
    "Review / failed      :",
    review.length
  );

  console.log(
    "Manifest entries     :",
    manifest.length
  );

  console.log(
    "\nOutput directory:",
    OUTPUT_DIR
  );

  console.log(
    "Manifest:",
    MANIFEST
  );

  console.log(
    "Review:",
    REVIEW
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