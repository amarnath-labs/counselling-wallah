import fs from "node:fs/promises";

const INPUT = "./safe-50-fee-extracted.json";
const OUTPUT = "./safe-26-fee-evidence-pack.json";

function clean(v) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksFeeRelated(v) {
  return /b\.?\s*tech|bachelor of technology|fee|tuition|semester|annual|hostel|mess|admission|institute|caution|registration|development|category|income|sc\b|st\b|obc|ews|pwd|day scholar|hosteller|2026|2027|₹|rs\.?|inr/i.test(
    String(v || "")
  );
}

function moneyCount(v) {
  return (
    String(v || "").match(
      /₹\s*[\d,]+|rs\.?\s*[\d,]+|inr\s*[\d,]+|\b\d{1,3}(?:,\d{2,3})+\b/gi
    ) || []
  ).length;
}

function tableScore(table) {
  const txt = (table.rows || [])
    .map(r => r.join(" | "))
    .join("\n");

  let score = 0;

  if (/fee|tuition|semester|hostel|mess|total/i.test(txt))
    score += 25;

  if (/b\.?\s*tech|bachelor of technology/i.test(txt))
    score += 20;

  if (/2026|2027/i.test(txt))
    score += 15;

  const mc = moneyCount(txt);

  if (mc >= 2) score += 20;
  if (mc >= 5) score += 10;

  return {
    score,
    money_count: mc,
    text: txt
  };
}

async function main() {
  const input = JSON.parse(
    (
      await fs.readFile(
        INPUT,
        "utf8"
      )
    ).replace(/^\uFEFF/, "")
  );

  const output = [];

  for (const row of input) {
    const relevantLines =
      (row.relevant_lines || [])
        .filter(x =>
          looksFeeRelated(x.text)
        );

    const candidateTables =
      (row.tables || [])
        .map(table => {
          const evaluation =
            tableScore(table);

          return {
            table_index:
              table.table_index,

            score:
              evaluation.score,

            money_count:
              evaluation.money_count,

            rows:
              table.rows
          };
        })
        .filter(x =>
          x.score >= 25 ||
          x.money_count >= 2
        )
        .sort(
          (a, b) =>
            b.score - a.score
        );

    output.push({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      source_family:
        row.source_family,

      source_url:
        row.fetched_url,

      source_label:
        row.source_label,

      page_title:
        row.page_title,

      detected_years:
        row.detected_years,

      detected_amounts:
        row.detected_amounts,

      relevant_lines:
        relevantLines,

      candidate_tables:
        candidateTables,

      evidence_summary: {
        relevant_line_count:
          relevantLines.length,

        candidate_table_count:
          candidateTables.length,

        amount_count:
          row.detected_amounts?.length || 0
      },

      retrieval_status:
        "RAW_EVIDENCE_ONLY",

      verified:
        false
    });
  }

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      output,
      null,
      2
    )
  );

  console.log(
    "\n======================================="
  );

  console.log(
    "FEE EVIDENCE PACK CREATED"
  );

  console.log(
    "=======================================\n"
  );

  console.log(
    "Colleges:",
    output.length
  );

  console.log(
    "With candidate tables:",
    output.filter(
      x =>
        x.evidence_summary
          .candidate_table_count > 0
    ).length
  );

  console.log(
    "Without candidate tables:",
    output.filter(
      x =>
        x.evidence_summary
          .candidate_table_count === 0
    ).length
  );

  console.log(
    "\nSaved:",
    OUTPUT
  );

  console.log(
    "\nDATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(err => {
  console.error(
    "FATAL:",
    err
  );

  process.exitCode = 1;
});