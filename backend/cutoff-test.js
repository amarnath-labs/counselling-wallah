const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

const client = axios.create({
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 400,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
});

// ------------------------------------------------------------
// Get hidden ASP.NET fields
// ------------------------------------------------------------

function hidden(html) {
  const $ = cheerio.load(html);
  const data = {};

  $("input[type='hidden']").each((_, el) => {
    const name = $(el).attr("name");

    if (name) {
      data[name] = $(el).attr("value") || "";
    }
  });

  return data;
}

// ------------------------------------------------------------
// Get <select> options
// ------------------------------------------------------------

function options(html, id) {
  const $ = cheerio.load(html);

  return $("#" + id)
    .find("option")
    .map((_, el) => ({
      value: $(el).attr("value") || "",
      text: $(el)
        .text()
        .replace(/\s+/g, " ")
        .trim(),
    }))
    .get();
}

// ------------------------------------------------------------
// ASP.NET dropdown postback
// ------------------------------------------------------------

async function postBack(html, target, values) {
  const form = hidden(html);

  form["__EVENTTARGET"] = target;
  form["__EVENTARGUMENT"] = "";

  for (const [key, value] of Object.entries(values)) {
    form[key] = value;
  }

  const response = await client.post(
    URL,
    new URLSearchParams(form).toString(),
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Referer: URL,
        Origin: "https://josaa.admissions.nic.in",
      },
    }
  );

  console.log(
    "POST:",
    target,
    "HTTP:",
    response.status,
    "SIZE:",
    response.data.length
  );

  return response.data;
}

// ------------------------------------------------------------
// Parse cutoff table
// ------------------------------------------------------------

function parseCutoffs(html) {
  const $ = cheerio.load(html);

  const records = [];

  $("table").each((tableIndex, table) => {
    const rows = $(table).find("tr");

    rows.each((rowIndex, tr) => {
      const cells = $(tr)
        .find("th,td")
        .map((_, cell) =>
          $(cell)
            .text()
            .replace(/\s+/g, " ")
            .trim()
        )
        .get();

      if (cells.length < 7) {
        return;
      }

      // Header row
      if (
        cells[0].toLowerCase() === "institute" ||
        cells[1].toLowerCase().includes("academic program")
      ) {
        return;
      }

      const openingRank = Number(
        cells[5].replace(/,/g, "")
      );

      const closingRank = Number(
        cells[6].replace(/,/g, "")
      );

      if (
        !Number.isFinite(openingRank) ||
        !Number.isFinite(closingRank)
      ) {
        return;
      }

      records.push({
        institute: cells[0],
        branch: cells[1],
        quota: cells[2],
        seatType: cells[3],
        gender: cells[4],
        openingRank,
        closingRank,
      });
    });
  });

  return records;
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  console.log("========================================");
  console.log("JOSAA IIT BOMBAY CSE OPEN TEST");
  console.log("========================================");

  // ----------------------------------------------------------
  // 1. GET PAGE
  // ----------------------------------------------------------

  console.log("\n1. GET LIVE PAGE...");

  let html =
    (await client.get(URL)).data;

  console.log(
    "GET HTTP: 200"
  );

  console.log(
    "GET SIZE:",
    html.length
  );

  fs.writeFileSync(
    "./data/official/josaa-step1.html",
    html,
    "utf8"
  );

  // ----------------------------------------------------------
  // 2. ROUND 1
  // ----------------------------------------------------------

  console.log("\n2. ROUND 1");

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlroundno",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno":
        "1",
    }
  );

  console.log(
    "\nRound options:"
  );

  console.table(
    options(
      html,
      "ctl00_ContentPlaceHolder1_ddlroundno"
    )
  );

  // ----------------------------------------------------------
  // 3. IIT
  // ----------------------------------------------------------

  console.log("\n3. INSTITUTE TYPE = IIT");

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlInstype",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno":
        "1",

      "ctl00$ContentPlaceHolder1$ddlInstype":
        "IIT",
    }
  );

  const institutes = options(
    html,
    "ctl00_ContentPlaceHolder1_ddlInstitute"
  );

  console.log(
    "\nIIT INSTITUTES:"
  );

  console.table(institutes);

  // ----------------------------------------------------------
  // 4. IIT BOMBAY
  // ----------------------------------------------------------

  console.log(
    "\n4. INSTITUTE = IIT BOMBAY (102)"
  );

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlInstitute",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno":
        "1",

      "ctl00$ContentPlaceHolder1$ddlInstype":
        "IIT",

      "ctl00$ContentPlaceHolder1$ddlInstitute":
        "102",
    }
  );

  const branches = options(
    html,
    "ctl00_ContentPlaceHolder1_ddlBranch"
  );

  console.log(
    "\nIIT BOMBAY BRANCHES:"
  );

  console.table(branches);

  // ----------------------------------------------------------
  // 5. CSE
  // ----------------------------------------------------------

  console.log(
    "\n5. BRANCH = CSE (4110)"
  );

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlBranch",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno":
        "1",

      "ctl00$ContentPlaceHolder1$ddlInstype":
        "IIT",

      "ctl00$ContentPlaceHolder1$ddlInstitute":
        "102",

      "ctl00$ContentPlaceHolder1$ddlBranch":
        "4110",
    }
  );

  // ----------------------------------------------------------
  // 6. OPEN
  // ----------------------------------------------------------

  console.log(
    "\n6. SEAT TYPE = OPEN (OPNO)"
  );

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlSeattype",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno":
        "1",

      "ctl00$ContentPlaceHolder1$ddlInstype":
        "IIT",

      "ctl00$ContentPlaceHolder1$ddlInstitute":
        "102",

      "ctl00$ContentPlaceHolder1$ddlBranch":
        "4110",

      "ctl00$ContentPlaceHolder1$ddlSeattype":
        "OPNO",
    }
  );

  console.log(
    "\nSeat types:"
  );

  console.table(
    options(
      html,
      "ctl00_ContentPlaceHolder1_ddlSeattype"
    )
  );

  // ----------------------------------------------------------
  // 7. FINAL SUBMIT
  // ----------------------------------------------------------

  console.log(
    "\n7. FINAL SUBMIT"
  );

  const form = hidden(html);

  // Selected values
  form[
    "ctl00$ContentPlaceHolder1$ddlroundno"
  ] = "1";

  form[
    "ctl00$ContentPlaceHolder1$ddlInstype"
  ] = "IIT";

  form[
    "ctl00$ContentPlaceHolder1$ddlInstitute"
  ] = "102";

  form[
    "ctl00$ContentPlaceHolder1$ddlBranch"
  ] = "4110";

  form[
    "ctl00$ContentPlaceHolder1$ddlSeattype"
  ] = "OPNO";

  // IMPORTANT
  // Clear EVENTTARGET because this is a normal submit.
  form["__EVENTTARGET"] = "";
  form["__EVENTARGUMENT"] = "";

  // IMPORTANT
  // Simulate clicking the actual submit button.
  //
  // We first inspect the page to determine the actual button.
  const $ = cheerio.load(html);

  let submitName = null;
  let submitValue = null;

  $("input[type='submit'], input[type='button'], button")
    .each((_, el) => {
      const name = $(el).attr("name");
      const value =
        $(el).attr("value") ||
        $(el).text().trim();

      if (
        !submitName &&
        (
          String(value).toLowerCase().includes("submit") ||
          String(value).toLowerCase().includes("show") ||
          String(value).toLowerCase().includes("view") ||
          String(name).toLowerCase().includes("submit")
        )
      ) {
        submitName = name;
        submitValue = value;
      }
    });

  console.log(
    "\nDetected submit button:"
  );

  console.log(
    "Name:",
    submitName
  );

  console.log(
    "Value:",
    submitValue
  );

  if (submitName) {
    form[submitName] =
      submitValue || "Submit";
  }

  // ----------------------------------------------------------
  // SEND FINAL REQUEST
  // ----------------------------------------------------------

  const submit =
    await client.post(
      URL,
      new URLSearchParams(form).toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Referer: URL,

          Origin:
            "https://josaa.admissions.nic.in",
        },
      }
    );

  console.log(
    "\nSUBMIT HTTP:",
    submit.status
  );

  console.log(
    "SUBMIT SIZE:",
    submit.data.length
  );

  // ----------------------------------------------------------
  // SAVE RESULT
  // ----------------------------------------------------------

  fs.writeFileSync(
    "./data/official/cutoff-test.html",
    submit.data,
    "utf8"
  );

  console.log(
    "Saved:",
    "./data/official/cutoff-test.html"
  );

  // ----------------------------------------------------------
  // PARSE CUTOFFS
  // ----------------------------------------------------------

  const records =
    parseCutoffs(submit.data);

  console.log(
    "\n========================================"
  );

  console.log(
    "CUTOFF RECORDS:",
    records.length
  );

  console.log(
    "========================================"
  );

  if (records.length > 0) {
    console.table(records);
  } else {
    console.log(
      "\nNO CUTOFF RECORDS FOUND."
    );

    const result$ =
      cheerio.load(submit.data);

    const bodyText =
      result$("body")
        .text()
        .replace(/\s+/g, " ")
        .trim();

    console.log(
      "\nPAGE TEXT SAMPLE:"
    );

    console.log(
      bodyText.slice(-3000)
    );
  }

  console.log(
    "\nDONE"
  );
}

// ------------------------------------------------------------
// ERROR HANDLER
// ------------------------------------------------------------

main().catch((error) => {
  console.error(
    "\n========================================"
  );

  console.error(
    "ERROR"
  );

  console.error(
    "========================================"
  );

  console.error(
    error.stack || error.message
  );

  if (error.response) {
    console.error(
      "HTTP:",
      error.response.status
    );

    console.error(
      "URL:",
      error.config?.url
    );
  }

  process.exitCode = 1;
});