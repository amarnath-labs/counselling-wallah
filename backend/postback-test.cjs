const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

const client = axios.create({
  maxRedirects: 5,
  timeout: 30000,

  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36",

    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },

  validateStatus: (status) =>
    status >= 200 && status < 400,
});


/* =========================================================
   GET HIDDEN ASP.NET FIELDS
   ========================================================= */

function getHiddenFields(html) {
  const $ = cheerio.load(html);

  const data = {};

  $("form#aspnetForm input[type=hidden]").each(
    (_, el) => {
      const name = $(el).attr("name");

      if (name) {
        data[name] =
          $(el).attr("value") || "";
      }
    }
  );

  return data;
}


/* =========================================================
   GET SELECT OPTIONS
   ========================================================= */

function getOptions(html, id) {
  const $ = cheerio.load(html);

  return $("#" + id)
    .find("option")
    .map((_, el) => ({
      value:
        $(el).attr("value") || "",

      text:
        $(el)
          .text()
          .replace(/\s+/g, " ")
          .trim(),
    }))
    .get();
}


/* =========================================================
   POST BACK
   ========================================================= */

async function postBack(
  html,
  control,
  value,
  selectedValues = {}
) {
  const data =
    getHiddenFields(html);

  /*
   * ASP.NET event information
   */

  data.__EVENTTARGET = control;
  data.__EVENTARGUMENT = "";


  /*
   * Preserve current dropdown values
   */

  const roundName =
    "ctl00$ContentPlaceHolder1$ddlroundno";

  const instypeName =
    "ctl00$ContentPlaceHolder1$ddlInstype";

  const instituteName =
    "ctl00$ContentPlaceHolder1$ddlInstitute";

  const branchName =
    "ctl00$ContentPlaceHolder1$ddlBranch";

  const seatName =
    "ctl00$ContentPlaceHolder1$ddlSeattype";


  data[roundName] =
    selectedValues.round ??
    data[roundName] ??
    "0";

  data[instypeName] =
    selectedValues.instype ??
    data[instypeName] ??
    "";

  data[instituteName] =
    selectedValues.institute ??
    data[instituteName] ??
    "";

  data[branchName] =
    selectedValues.branch ??
    data[branchName] ??
    "";

  data[seatName] =
    selectedValues.seat ??
    data[seatName] ??
    "";


  /*
   * Current control gets new value
   */

  data[control] = value;


  console.log("");
  console.log("----------------------------------------");
  console.log("POST BACK");
  console.log("----------------------------------------");

  console.log("CONTROL:", control);
  console.log("VALUE:", value);


  const response =
    await client.post(
      URL,
      new URLSearchParams(data).toString(),
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
    "STATUS:",
    response.status
  );

  console.log(
    "RESPONSE SIZE:",
    response.data.length
  );


  return response.data;
}


/* =========================================================
   PARSE CUTOFF TABLE
   ========================================================= */

function parseCutoffs(html) {
  const $ = cheerio.load(html);

  const records = [];


  $("table").each(
    (tableIndex, table) => {

      const rows =
        $(table).find("tr");


      rows.each(
        (rowIndex, tr) => {

          const cells =
            $(tr)
              .find("th, td")
              .map(
                (_, cell) =>
                  $(cell)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim()
              )
              .get();


          /*
           * Need at least:
           *
           * Institute
           * Academic Program
           * Quota
           * Seat Type
           * Gender
           * Opening
           * Closing
           */

          if (cells.length < 7) {
            return;
          }


          /*
           * Skip header row
           */

          if (
            cells[0]
              .toLowerCase()
              .includes("institute") &&
            cells[1]
              .toLowerCase()
              .includes("academic")
          ) {
            return;
          }


          /*
           * Opening rank
           */

          const openingRaw =
            cells[5]
              .replace(/,/g, "")
              .trim();


          /*
           * Closing rank
           */

          const closingRaw =
            cells[6]
              .replace(/,/g, "")
              .trim();


          /*
           * JOSAA may have P suffix
           *
           * Example:
           * 123P
           */

          const openingRank =
            parseInt(
              openingRaw.replace(
                /P$/i,
                ""
              ),
              10
            );


          const closingRank =
            parseInt(
              closingRaw.replace(
                /P$/i,
                ""
              ),
              10
            );


          if (
            !Number.isFinite(
              openingRank
            ) ||
            !Number.isFinite(
              closingRank
            )
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

            openingRaw,

            closingRaw,
          });
        }
      );
    }
  );


  return records;
}


/* =========================================================
   FIND RESULT TABLES
   ========================================================= */

function showTables(html) {
  const $ = cheerio.load(html);

  console.log("");
  console.log(
    "RESULT TABLE COUNT:",
    $("table").length
  );


  $("table").each(
    (tableIndex, table) => {

      const rows =
        $(table).find("tr");


      if (rows.length === 0) {
        return;
      }


      console.log("");
      console.log(
        "TABLE:",
        tableIndex
      );


      const output = [];


      rows.each(
        (_, tr) => {

          const cells =
            $(tr)
              .find("th, td")
              .map(
                (_, td) =>
                  $(td)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim()
              )
              .get();


          if (cells.length > 0) {
            output.push(cells);
          }
        }
      );


      console.table(output);
    }
  );
}


/* =========================================================
   SUBMIT FINAL FORM
   ========================================================= */

async function submitForm(
  html,
  values
) {

  const data =
    getHiddenFields(html);


  /*
   * Set all dropdown values
   */

  data[
    "ctl00$ContentPlaceHolder1$ddlroundno"
  ] = values.round;

  data[
    "ctl00$ContentPlaceHolder1$ddlInstype"
  ] = values.instype;

  data[
    "ctl00$ContentPlaceHolder1$ddlInstitute"
  ] = values.institute;

  data[
    "ctl00$ContentPlaceHolder1$ddlBranch"
  ] = values.branch;

  data[
    "ctl00$ContentPlaceHolder1$ddlSeattype"
  ] = values.seat;


  /*
   * Important:
   *
   * Real submit button
   */

  data[
    "ctl00$ContentPlaceHolder1$btnSubmit"
  ] = "Submit";


  /*
   * Do NOT use ddlBranch etc as EVENTTARGET here.
   */

  data.__EVENTTARGET = "";

  data.__EVENTARGUMENT = "";


  console.log("");
  console.log("----------------------------------------");
  console.log("FINAL SUBMIT");
  console.log("----------------------------------------");

  console.log(
    "Round:",
    values.round
  );

  console.log(
    "Institute Type:",
    values.instype
  );

  console.log(
    "Institute:",
    values.institute
  );

  console.log(
    "Branch:",
    values.branch
  );

  console.log(
    "Seat Type:",
    values.seat
  );


  const response =
    await client.post(
      URL,
      new URLSearchParams(data).toString(),
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
    "SUBMIT STATUS:",
    response.status
  );

  console.log(
    "SUBMIT SIZE:",
    response.data.length
  );


  return response.data;
}


/* =========================================================
   MAIN
   ========================================================= */

async function main() {

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "JOSAA FULL CUTOFF TEST"
  );

  console.log(
    "========================================"
  );


  /*
   * ======================================
   * 1. GET LIVE PAGE
   * ======================================
   */

  console.log("");
  console.log("1. GET LIVE JOSAA PAGE");


  const response =
    await client.get(URL);


  let html =
    response.data;


  console.log(
    "GET STATUS:",
    response.status
  );

  console.log(
    "HTML SIZE:",
    html.length
  );


  /*
   * Save initial page
   */

  fs.writeFileSync(
    "./data/official/josaa-live.html",
    html,
    "utf8"
  );


  /*
   * ======================================
   * 2. ROUND 1
   * ======================================
   */

  console.log("");
  console.log("2. ROUND 1");


  html =
    await postBack(
      html,

      "ctl00$ContentPlaceHolder1$ddlroundno",

      "1",

      {
        round: "1",
      }
    );


  /*
   * ======================================
   * 3. IIT
   * ======================================
   */

  console.log("");
  console.log("3. INSTITUTE TYPE = IIT");


  html =
    await postBack(
      html,

      "ctl00$ContentPlaceHolder1$ddlInstype",

      "IIT",

      {
        round: "1",
        instype: "IIT",
      }
    );


  /*
   * Print IIT institutes
   */

  const institutes =
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlInstitute"
    );


  console.log("");
  console.log(
    "IIT INSTITUTES:"
  );

  console.table(
    institutes
  );


  /*
   * ======================================
   * 4. IIT BOMBAY
   * ======================================
   */

  console.log("");
  console.log(
    "4. INSTITUTE = IIT BOMBAY (102)"
  );


  html =
    await postBack(
      html,

      "ctl00$ContentPlaceHolder1$ddlInstitute",

      "102",

      {
        round: "1",
        instype: "IIT",
        institute: "102",
      }
    );


  /*
   * Get branches
   */

  const branches =
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlBranch"
    );


  console.log("");
  console.log(
    "IIT BOMBAY BRANCHES:"
  );

  console.table(
    branches
  );


  /*
   * ======================================
   * 5. CSE
   * ======================================
   */

  console.log("");
  console.log(
    "5. BRANCH = CSE (4110)"
  );


  html =
    await postBack(
      html,

      "ctl00$ContentPlaceHolder1$ddlBranch",

      "4110",

      {
        round: "1",
        instype: "IIT",
        institute: "102",
        branch: "4110",
      }
    );


  /*
   * ======================================
   * 6. OPEN
   * ======================================
   */

  console.log("");
  console.log(
    "6. SEAT TYPE = OPEN (OPNO)"
  );


  html =
    await postBack(
      html,

      "ctl00$ContentPlaceHolder1$ddlSeattype",

      "OPNO",

      {
        round: "1",
        instype: "IIT",
        institute: "102",
        branch: "4110",
        seat: "OPNO",
      }
    );


  /*
   * Save page BEFORE submit
   */

  fs.writeFileSync(
    "./data/official/josaa-before-submit.html",
    html,
    "utf8"
  );


  /*
   * ======================================
   * 7. SUBMIT
   * ======================================
   */

  console.log("");
  console.log(
    "7. SUBMIT CUTOFF REQUEST"
  );


  const resultHTML =
    await submitForm(
      html,
      {
        round: "1",

        instype: "IIT",

        institute: "102",

        branch: "4110",

        seat: "OPNO",
      }
    );


  /*
   * Save final result
   */

  fs.writeFileSync(
    "./data/official/josaa-result.html",
    resultHTML,
    "utf8"
  );


  /*
   * ======================================
   * 8. SHOW RESULT TABLE
   * ======================================
   */

  console.log("");
  console.log(
    "8. RESULT TABLE"
  );


  showTables(
    resultHTML
  );


  /*
   * ======================================
   * 9. PARSE CUTOFFS
   * ======================================
   */

  console.log("");
  console.log(
    "9. PARSING CUTOFF DATA"
  );


  const records =
    parseCutoffs(
      resultHTML
    );


  console.log("");
  console.log(
    "TOTAL CUTOFF RECORDS:",
    records.length
  );


  console.log("");

  console.table(
    records
  );


  /*
   * ======================================
   * 10. SAVE JSON
   * ======================================
   */

  fs.writeFileSync(
    "./data/official/josaa-iit-bombay-cse-open.json",

    JSON.stringify(
      records,
      null,
      2
    ),

    "utf8"
  );


  /*
   * ======================================
   * 11. SUMMARY
   * ======================================
   */

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "TEST COMPLETED"
  );

  console.log(
    "========================================"
  );

  console.log(
    "Records:",
    records.length
  );

  console.log(
    "HTML:",
    "./data/official/josaa-result.html"
  );

  console.log(
    "JSON:",
    "./data/official/josaa-iit-bombay-cse-open.json"
  );

  console.log(
    "========================================"
  );
}


/* =========================================================
   ERROR HANDLER
   ========================================================= */

main().catch(
  (error) => {

    console.log("");
    console.log(
      "========================================"
    );

    console.error(
      "JOSAA TEST FAILED"
    );

    console.log(
      "========================================"
    );

    console.error(
      "MESSAGE:",
      error.message
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

      console.error(
        "RESPONSE:",
        String(
          error.response.data
        ).slice(0, 2000)
      );
    }


    console.error(
      error.stack
    );


    process.exitCode = 1;
  }
);