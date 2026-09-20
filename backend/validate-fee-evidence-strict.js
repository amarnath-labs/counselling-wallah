import fs from "node:fs/promises";

const INPUT = "./safe-50-fee-extracted.json";

const OUTPUT_PASS =
  "./safe-50-fee-strict-pass.json";

const OUTPUT_REVIEW =
  "./safe-50-fee-strict-review.json";

function text(v) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim();
}

function lower(v) {
  return text(v).toLowerCase();
}

function hasBtech(v) {
  return /\bb\.?\s*tech\b|bachelor of technology/i.test(v);
}

function hasFee(v) {
  return /\bfee\b|\bfees\b|tuition|institute fee|admission fee/i.test(v);
}

function hasCurrentYear(v) {
  return /2026\s*[-–]\s*(?:2027|27)|2026-27|2026–27|academic\s+(?:year|session).*2026|session.*2026/i.test(
    v
  );
}

function hasMoney(v) {
  return /₹\s*[\d,]+|rs\.?\s*[\d,]+|inr\s*[\d,]+|\b\d{1,3}(?:,\d{2,3})+\b/i.test(
    v
  );
}

function countMoney(v) {
  return (
    String(v || "").match(
      /₹\s*[\d,]+|rs\.?\s*[\d,]+|inr\s*[\d,]+|\b\d{1,3}(?:,\d{2,3})+\b/gi
    ) || []
  ).length;
}

function feeComponentCount(v) {
  const s = lower(v);

  const tests = [
    /\btuition\b/,
    /\badmission\b/,
    /\binstitute\s+fee\b/,
    /\bhostel\b/,
    /\bmess\b/,
    /\bcaution\b/,
    /\bregistration\b/,
    /\bdevelopment\b/,
    /\bsemester\b|\bsem\b/,
    /\bannual\b|\bper year\b/,
    /\btotal\b/
  ];

  return tests.filter(r => r.test(s)).length;
}

function categoryCount(v) {
  const s = lower(v);

  const tests = [
    /\bsc\b/,
    /\bst\b/,
    /\bobc\b/,
    /\bews\b/,
    /\bpwd\b/,
    /\bincome\b/,
    /\bday scholar\b/,
    /\bhosteller\b/
  ];

  return tests.filter(r => r.test(s)).length;
}

function relevantText(record) {
  return (record.relevant_lines || [])
    .map(x => x.text)
    .join("\n");
}

function tableEvidence(record) {
  const evidence = [];

  for (const table of record.tables || []) {
    const tableText = (table.rows || [])
      .map(row => row.join(" | "))
      .join("\n");

    const btech = hasBtech(tableText);
    const fee = hasFee(tableText);
    const money = countMoney(tableText);
    const components =
      feeComponentCount(tableText);

    /*
     * Table can be accepted as strong fee evidence
     * even when "B.Tech" is stated immediately outside
     * the table. Therefore B.Tech is evaluated again
     * against nearby relevant text later.
     */
    if (
      fee &&
      money >= 2 &&
      components >= 1
    ) {
      evidence.push({
        table_index:
          table.table_index,

        btech_inside_table:
          btech,

        money_count:
          money,

        component_count:
          components,

        text:
          tableText
      });
    }
  }

  return evidence;
}

function buildEvidenceBlocks(record) {
  const lines =
    record.relevant_lines || [];

  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const current =
      lines[i];

    const window = lines
      .slice(
        Math.max(0, i - 3),
        Math.min(lines.length, i + 5)
      )
      .map(x => x.text)
      .join("\n");

    if (
      hasFee(current.text) ||
      hasMoney(current.text)
    ) {
      blocks.push(window);
    }
  }

  return [...new Set(blocks)];
}

function strongestBlock(record) {
  const blocks =
    buildEvidenceBlocks(record);

  let best = null;

  for (const block of blocks) {
    const money =
      countMoney(block);

    const components =
      feeComponentCount(block);

    const categories =
      categoryCount(block);

    const btech =
      hasBtech(block);

    const year =
      hasCurrentYear(block);

    let score = 0;

    if (hasFee(block)) score += 20;
    if (money >= 2) score += 25;
    if (money >= 4) score += 5;
    if (components >= 2) score += 20;
    if (components >= 4) score += 5;
    if (btech) score += 20;
    if (year) score += 20;
    if (categories > 0) score += 5;

    const result = {
      score,
      money_count: money,
      component_count:
        components,
      category_count:
        categories,
      btech,
      current_year:
        year,
      text: block
    };

    if (
      !best ||
      result.score > best.score
    ) {
      best = result;
    }
  }

  return best;
}

function suspiciousUrl(url) {
  const u =
    lower(url);

  /*
   * Important:
   * Do NOT reject mixed B.Tech URLs such as
   * ABV-IIITM's B.Tech + M.Tech admission page.
   */

  if (
    /\/mtech(?:\.|\/|$)/.test(u) &&
    !/btech/.test(u)
  ) {
    return "MTECH_ONLY_URL";
  }

  if (
    /\/pg(?:\/|$)/.test(u) &&
    !/btech/.test(u)
  ) {
    return "PG_ONLY_URL";
  }

  if (
    /phd/.test(u) &&
    !/btech/.test(u)
  ) {
    return "PHD_ONLY_URL";
  }

  if (
    /hostels?\.php|\/hostels?(?:\/|$)/.test(u)
  ) {
    return "HOSTEL_ONLY_URL";
  }

  if (
    /stakeholder-feedback/.test(u)
  ) {
    return "FEEDBACK_URL";
  }

  return null;
}

function validate(record) {
  const nearby =
    relevantText(record);

  const tables =
    tableEvidence(record);

  const strongest =
    strongestBlock(record);

  const badUrl =
    suspiciousUrl(
      record.fetched_url
    );

  const nearbyBtech =
    hasBtech(nearby);

  const nearbyYear =
    hasCurrentYear(nearby);

  const nearbyFee =
    hasFee(nearby);

  const nearbyMoney =
    countMoney(nearby);

  const tablePass =
    tables.some(table =>
      (
        table.btech_inside_table ||
        nearbyBtech
      ) &&
      nearbyYear &&
      table.money_count >= 2
    );

  const blockPass =
    strongest &&
    strongest.btech &&
    strongest.current_year &&
    strongest.money_count >= 2 &&
    strongest.component_count >= 1 &&
    strongest.score >= 80;

  /*
   * URL is a hard blocker only when it looks like
   * another programme/hostel-only page AND we do not
   * have exceptionally strong local B.Tech evidence.
   */
  const strongOverride =
    strongest &&
    strongest.btech &&
    strongest.current_year &&
    strongest.money_count >= 3 &&
    strongest.component_count >= 2 &&
    strongest.score >= 95;

  const structuralPass =
    tablePass ||
    blockPass;

  const pass =
    structuralPass &&
    (!badUrl || strongOverride);

  const reasons = [];

  if (tablePass)
    reasons.push(
      "STRONG_FEE_TABLE"
    );

  if (blockPass)
    reasons.push(
      "STRONG_LOCAL_FEE_BLOCK"
    );

  if (nearbyBtech)
    reasons.push(
      "BTECH_NEAR_FEE_EVIDENCE"
    );

  if (nearbyYear)
    reasons.push(
      "CURRENT_YEAR_NEAR_EVIDENCE"
    );

  if (nearbyFee)
    reasons.push(
      "FEE_LABEL_PRESENT"
    );

  if (nearbyMoney >= 2)
    reasons.push(
      "MULTIPLE_LOCAL_AMOUNTS"
    );

  if (badUrl)
    reasons.push(
      badUrl
    );

  if (
    badUrl &&
    strongOverride
  ) {
    reasons.push(
      "SUSPICIOUS_URL_OVERRIDDEN_BY_STRONG_EVIDENCE"
    );
  }

  return {
    pass,
    reasons,
    suspicious_url:
      badUrl,

    table_pass:
      tablePass,

    block_pass:
      Boolean(blockPass),

    strongest_block:
      strongest,

    strong_tables:
      tables
  };
}

async function main() {
  console.log(
    "\n======================================="
  );
  console.log(
    "STRICT B.TECH FEE EVIDENCE VALIDATOR"
  );
  console.log(
    "=======================================\n"
  );

  const input =
    JSON.parse(
      (
        await fs.readFile(
          INPUT,
          "utf8"
        )
      ).replace(/^\uFEFF/, "")
    );

  const passed = [];
  const review = [];

  for (
    let i = 0;
    i < input.length;
    i++
  ) {
    const record =
      input[i];

    const result =
      validate(record);

    const output = {
      ...record,

      strict_validation:
        result,

      strict_status:
        result.pass
          ? "STRICT_PASS"
          : "STRICT_REVIEW"
    };

    console.log(
      `[${i + 1}/${input.length}] ` +
      `${record.college_name}`
    );

    console.log(
      ` -> ${
        result.pass
          ? "PASS"
          : "REVIEW"
      }`
    );

    if (
      result.suspicious_url
    ) {
      console.log(
        ` -> URL SIGNAL: ${result.suspicious_url}`
      );
    }

    if (
      result.strongest_block
    ) {
      console.log(
        ` -> Evidence score: ${result.strongest_block.score}`
      );
    }

    if (result.pass) {
      passed.push(output);
    } else {
      review.push(output);
    }
  }

  await fs.writeFile(
    OUTPUT_PASS,
    JSON.stringify(
      passed,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_REVIEW,
    JSON.stringify(
      review,
      null,
      2
    )
  );

  console.log(
    "\n======================================="
  );
  console.log(
    "STRICT VALIDATION SUMMARY"
  );
  console.log(
    "=======================================\n"
  );

  console.log(
    "Input       :",
    input.length
  );

  console.log(
    "STRICT PASS :",
    passed.length
  );

  console.log(
    "REVIEW      :",
    review.length
  );

  console.log(
    "Accounted   :",
    passed.length +
      review.length
  );

  console.log(
    "\nSaved:"
  );

  console.log(
    OUTPUT_PASS
  );

  console.log(
    OUTPUT_REVIEW
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