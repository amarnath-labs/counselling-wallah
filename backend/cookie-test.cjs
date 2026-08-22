const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

const OUTPUT_DIR = "./data/official";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ======================================================
// COOKIE SESSION
// ======================================================

const jar = new CookieJar();

const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,

    maxRedirects: 5,

    timeout: 30000,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Safari/537.36",

      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

      "Accept-Language":
        "en-US,en;q=0.9",

      "Cache-Control":
        "no-cache",

      Pragma:
        "no-cache"
    },

    validateStatus: status =>
      status >= 200 && status < 400
  })
);

// ======================================================
// FIELD NAMES
// ======================================================

const FIELDS = {
  round:
    "ctl00$ContentPlaceHolder1$ddlroundno",

  instype:
    "ctl00$ContentPlaceHolder1$ddlInstype",

  institute:
    "ctl00$ContentPlaceHolder1$ddlInstitute",

  branch:
    "ctl00$ContentPlaceHolder1$ddlBranch",

  seat:
    "ctl00$ContentPlaceHolder1$ddlSeattype"
};

// ======================================================
// HIDDEN ASP.NET FIELDS
// ======================================================

function getHiddenFields(html) {
  const $ = cheerio.load(html);

  const data = {};

  $("input[type='hidden']").each((_, el) => {
    const name = $(el).attr("name");

    if (name) {
      data[name] =
        $(el).attr("value") || "";
    }
  });

  return data;
}

// ======================================================
// SELECT OPTIONS
// ======================================================

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
          .trim()
    }))
    .get();
}

// ======================================================
// SAVE HTML
// ======================================================

function saveHTML(filename, html) {
  const file =
    `${OUTPUT_DIR}/${filename}`;

  fs.writeFileSync(
    file,
    html,
    "utf8"
  );

  console.log(
    "SAVED:",
    file,
    `(${html.length} bytes)`
  );
}

// ======================================================
// DEBUG RESPONSE
// ======================================================

function debugHTML(label, html) {
  const $ = cheerio.load(html);

  console.log("\n========================================");
  console.log(`DEBUG: ${label}`);
  console.log("========================================");

  console.log(
    "TITLE:",
    $("title")
      .text()
      .replace(/\s+/g, " ")
      .trim()
  );

  console.log(
    "FORMS:",
    $("form").length
  );

  console.log(
    "ROUND SELECT:",
    $("#ctl00_ContentPlaceHolder1_ddlroundno").length
  );

  console.log(
    "ROUND OPTIONS:",
    $("#ctl00_ContentPlaceHolder1_ddlroundno option").length
  );

  console.log(
    "INSTYPE SELECT:",
    $("#ctl00_ContentPlaceHolder1_ddlInstype").length
  );

  console.log(
    "INSTYPE OPTIONS:",
    $("#ctl00_ContentPlaceHolder1_ddlInstype option").length
  );

  console.log(
    "INSTITUTE OPTIONS:",
    $("#ctl00_ContentPlaceHolder1_ddlInstitute option").length
  );

  console.log(
    "BRANCH OPTIONS:",
    $("#ctl00_ContentPlaceHolder1_ddlBranch option").length
  );

  console.log(
    "SEAT OPTIONS:",
    $("#ctl00_ContentPlaceHolder1_ddlSeattype option").length
  );

  const body =
    $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

  console.log(
    "\nBODY TEXT:"
  );

  console.log(
    body.slice(0, 3000)
  );

  console.log(
    "\n========================================"
  );
}

// ======================================================
// POSTBACK
// ======================================================

async function postBack(
  html,
  target,
  values,
  saveName
) {
  const data =
    getHiddenFields(html);

  // ASP.NET postback
  data.__EVENTTARGET =
    target;

  data.__EVENTARGUMENT =
    "";

  // IMPORTANT:
  // Send ALL dropdown values every time.

  data[FIELDS.round] =
    values.round ?? "";

  data[FIELDS.instype] =
    values.instype ?? "";

  data[FIELDS.institute] =
    values.institute ?? "";

  data[FIELDS.branch] =
    values.branch ?? "";

  data[FIELDS.seat] =
    values.seat ?? "";

  // Remove submit button from dropdown postback
  delete data[
    "ctl00$ContentPlaceHolder1$btnSubmit"
  ];

  console.log("\n----------------------------------------");

  console.log(
    "POSTBACK:",
    target
  );

  console.log(
    "VALUES:",
    values
  );

  console.log(
    "HIDDEN FIELDS:",
    Object.keys(data).length
  );

  const response =
    await client.post(
      URL,

      new URLSearchParams(data)
        .toString(),

      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Referer:
            URL,

          Origin:
            "https://josaa.admissions.nic.in",

          "Upgrade-Insecure-Requests":
            "1"
        }
      }
    );

  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "SIZE:",
    response.data.length
  );

  console.log(
    "COOKIES:",
    await jar.getCookieString(URL)
  );

  if (saveName) {
    saveHTML(
      saveName,
      response.data
    );
  }

  debugHTML(
    target,
    response.data
  );

  return response.data;
}

// ======================================================
// MAIN
// ======================================================

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "JOSAA COMPLETE COOKIE POSTBACK TEST"
  );

  console.log(
    "========================================"
  );

  // ====================================================
  // 1. GET
  // ====================================================

  console.log(
    "\n1. GET LIVE JOSAA PAGE"
  );

  const getResponse =
    await client.get(URL);

  let html =
    getResponse.data;

  console.log(
    "GET HTTP:",
    getResponse.status
  );

  console.log(
    "GET SIZE:",
    html.length
  );

  console.log(
    "GET URL:",
    getResponse.request?.res?.responseUrl ||
      URL
  );

  console.log(
    "\nCOOKIES AFTER GET:"
  );

  console.log(
    await jar.getCookieString(URL)
  );

  saveHTML(
    "cookie-get.html",
    html
  );

  // ====================================================
  // SHOW INITIAL ROUND OPTIONS
  // ====================================================

  console.log(
    "\nINITIAL ROUND OPTIONS:"
  );

  console.table(
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlroundno"
    )
  );

  // ====================================================
  // 2. ROUND 1
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "2. SELECT ROUND 1"
  );

  console.log(
    "========================================"
  );

  html =
    await postBack(
      html,

      FIELDS.round,

      {
        round: "1",
        instype: "",
        institute: "",
        branch: "",
        seat: ""
      },

      "cookie-round1.html"
    );

  // ====================================================
  // SHOW INSTITUTE TYPES
  // ====================================================

  console.log(
    "\nINSTITUTE TYPE OPTIONS:"
  );

  const instituteTypes =
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlInstype"
    );

  console.table(
    instituteTypes
  );

  // ====================================================
  // IMPORTANT FAILURE CHECK
  // ====================================================

  if (
    instituteTypes.length === 0
  ) {

    console.log(
      "\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );

    console.log(
      "JOSAA DID NOT RETURN INSTITUTE TYPES"
    );

    console.log(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );

    console.log(
      "\nInspect this file:"
    );

    console.log(
      "data/official/cookie-round1.html"
    );

    return;
  }

  // ====================================================
  // 3. IIT
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "3. SELECT IIT"
  );

  console.log(
    "========================================"
  );

  html =
    await postBack(
      html,

      FIELDS.instype,

      {
        round: "1",
        instype: "IIT",
        institute: "",
        branch: "",
        seat: ""
      },

      "cookie-iit.html"
    );

  // ====================================================
  // IIT INSTITUTES
  // ====================================================

  const institutes =
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlInstitute"
    );

  console.log(
    "\nIIT INSTITUTES:",
    institutes.length
  );

  console.table(
    institutes
  );

  // ====================================================
  // FAILURE CHECK
  // ====================================================

  if (
    institutes.length === 0
  ) {

    console.log(
      "\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );

    console.log(
      "IIT INSTITUTES ARE EMPTY"
    );

    console.log(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );

    console.log(
      "\nThis is the exact response saved at:"
    );

    console.log(
      "data/official/cookie-iit.html"
    );

    return;
  }

  // ====================================================
  // FIND IIT BOMBAY
  // ====================================================

  const bombay =
    institutes.find(
      x =>
        x.value === "102"
    ) ||
    institutes.find(
      x =>
        x.text
          .toLowerCase()
          .includes("bombay")
    );

  console.log(
    "\nIIT BOMBAY:"
  );

  console.log(
    bombay
  );

  if (!bombay) {

    throw new Error(
      "IIT Bombay was not found."
    );
  }

  // ====================================================
  // 4. IIT BOMBAY
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "4. SELECT IIT BOMBAY"
  );

  console.log(
    "========================================"
  );

  html =
    await postBack(
      html,

      FIELDS.institute,

      {
        round: "1",
        instype: "IIT",
        institute: bombay.value,
        branch: "",
        seat: ""
      },

      "cookie-iit-bombay.html"
    );

  // ====================================================
  // BRANCHES
  // ====================================================

  const branches =
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlBranch"
    );

  console.log(
    "\nIIT BOMBAY BRANCHES:",
    branches.length
  );

  console.table(
    branches
  );

  if (
    branches.length === 0
  ) {

    console.log(
      "\nNO BRANCHES RETURNED."
    );

    return;
  }

  // ====================================================
  // FIND CSE
  // ====================================================

  const cse =
    branches.find(
      x =>
        x.value === "4110"
    ) ||
    branches.find(
      x =>
        x.text
          .toLowerCase()
          .includes(
            "computer science and engineering"
          )
    );

  console.log(
    "\nCSE:"
  );

  console.log(
    cse
  );

  if (!cse) {

    throw new Error(
      "CSE branch was not found."
    );
  }

  // ====================================================
  // 5. CSE
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "5. SELECT CSE"
  );

  console.log(
    "========================================"
  );

  html =
    await postBack(
      html,

      FIELDS.branch,

      {
        round: "1",
        instype: "IIT",
        institute: bombay.value,
        branch: cse.value,
        seat: ""
      },

      "cookie-cse.html"
    );

  // ====================================================
  // SEAT TYPES
  // ====================================================

  const seats =
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlSeattype"
    );

  console.log(
    "\nSEAT TYPES:",
    seats.length
  );

  console.table(
    seats
  );

  // ====================================================
  // FIND OPEN
  // ====================================================

  const open =
    seats.find(
      x =>
        x.value === "OPNO"
    ) ||
    seats.find(
      x =>
        x.text
          .toLowerCase()
          .trim() === "open"
    );

  console.log(
    "\nOPEN:"
  );

  console.log(
    open
  );

  if (!open) {

    throw new Error(
      "OPEN seat type was not found."
    );
  }

  // ====================================================
  // 6. OPEN
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "6. SELECT OPEN"
  );

  console.log(
    "========================================"
  );

  html =
    await postBack(
      html,

      FIELDS.seat,

      {
        round: "1",
        instype: "IIT",
        institute: bombay.value,
        branch: cse.value,
        seat: open.value
      },

      "cookie-open.html"
    );

  // ====================================================
  // 7. SUBMIT
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "7. SUBMIT CUTOFF QUERY"
  );

  console.log(
    "========================================"
  );

  const data =
    getHiddenFields(html);

  data[FIELDS.round] =
    "1";

  data[FIELDS.instype] =
    "IIT";

  data[FIELDS.institute] =
    bombay.value;

  data[FIELDS.branch] =
    cse.value;

  data[FIELDS.seat] =
    open.value;

  data.__EVENTTARGET =
    "";

  data.__EVENTARGUMENT =
    "";

  data[
    "ctl00$ContentPlaceHolder1$btnSubmit"
  ] =
    "Submit";

  const submitResponse =
    await client.post(
      URL,

      new URLSearchParams(data)
        .toString(),

      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Referer:
            URL,

          Origin:
            "https://josaa.admissions.nic.in"
        }
      }
    );

  console.log(
    "SUBMIT HTTP:",
    submitResponse.status
  );

  console.log(
    "SUBMIT SIZE:",
    submitResponse.data.length
  );

  console.log(
    "COOKIES:",
    await jar.getCookieString(URL)
  );

  saveHTML(
    "cookie-submit.html",
    submitResponse.data
  );

  // ====================================================
  // PARSE RESULT TABLES
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "RESULT TABLE ANALYSIS"
  );

  console.log(
    "========================================"
  );

  const $ =
    cheerio.load(
      submitResponse.data
    );

  console.log(
    "TOTAL TABLES:",
    $("table").length
  );

  let resultRows = [];

  $("table").each(
    (tableIndex, table) => {

      const rows =
        $(table)
          .find("tr")
          .map((_, tr) =>
            $(tr)
              .find("th,td")
              .map(
                (_, td) =>
                  $(td)
                    .text()
                    .replace(
                      /\s+/g,
                      " "
                    )
                    .trim()
              )
              .get()
          )
          .get();

      if (
        rows.length === 0
      ) {
        return;
      }

      console.log(
        `\nTABLE ${tableIndex}`
      );

      console.table(
        rows.slice(0, 10)
      );

      // Parse cutoff rows
      for (
        const cells of rows
      ) {

        if (
          cells.length < 7
        ) {
          continue;
        }

        const opening =
          parseInt(
            cells[5]
              .replace(
                /,/g,
                ""
              )
              .replace(
                /P$/i,
                ""
              ),
            10
          );

        const closing =
          parseInt(
            cells[6]
              .replace(
                /,/g,
                ""
              )
              .replace(
                /P$/i,
                ""
              ),
            10
          );

        if (
          Number.isFinite(
            opening
          ) &&
          Number.isFinite(
            closing
          )
        ) {

          resultRows.push({
            institute:
              cells[0],

            branch:
              cells[1],

            quota:
              cells[2],

            seatType:
              cells[3],

            gender:
              cells[4],

            openingRank:
              opening,

            closingRank:
              closing
          });
        }
      }
    }
  );

  // ====================================================
  // RESULT
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "CUTOFF RECORDS:",
    resultRows.length
  );

  console.log(
    "========================================"
  );

  if (
    resultRows.length > 0
  ) {

    console.table(
      resultRows
    );

    fs.writeFileSync(
      `${OUTPUT_DIR}/cookie-cse-open-results.json`,
      JSON.stringify(
        resultRows,
        null,
        2
      ),
      "utf8"
    );

    console.log(
      "\nRESULT JSON SAVED:"
    );

    console.log(
      `${OUTPUT_DIR}/cookie-cse-open-results.json`
    );

  } else {

    console.log(
      "\nNO CUTOFF RECORDS FOUND."
    );

    const body =
      $("body")
        .text()
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    console.log(
      "\nLAST 3000 CHARACTERS OF BODY:"
    );

    console.log(
      body.slice(-3000)
    );
  }

  // ====================================================
  // FINAL
  // ====================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "TEST FINISHED"
  );

  console.log(
    "========================================"
  );
}

main().catch(
  error => {

    console.error(
      "\n========================================"
    );

    console.error(
      "JOSAA TEST FAILED"
    );

    console.error(
      "========================================"
    );

    console.error(
      error.stack ||
      error.message
    );

    if (error.response) {

      console.error(
        "\nHTTP:",
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

    process.exitCode = 1;
  }
);