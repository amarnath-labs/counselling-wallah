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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Safari/537.36",

    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

    "Accept-Language":
      "en-US,en;q=0.9"
  },

  validateStatus:
    status => status >= 200 && status < 400
});

function getHiddenFields(html) {
  const $ = cheerio.load(html);

  const data = {};

  $("form#aspnetForm input[type='hidden']").each(
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

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "JOSAA ROUND 1 POST TEST"
  );

  console.log(
    "========================================"
  );

  // ==================================================
  // 1. GET
  // ==================================================

  console.log("\n1. GET JOSAA");

  const getResponse =
    await client.get(URL);

  const html =
    getResponse.data;

  console.log(
    "GET HTTP:",
    getResponse.status
  );

  console.log(
    "GET SIZE:",
    html.length
  );

  fs.writeFileSync(
    "./data/official/working-get.html",
    html,
    "utf8"
  );

  // ==================================================
  // 2. READ HIDDEN FIELDS
  // ==================================================

  const data =
    getHiddenFields(html);

  console.log(
    "\nHIDDEN FIELD COUNT:",
    Object.keys(data).length
  );

  console.log(
    "\nHIDDEN FIELDS:"
  );

  for (
    const [key, value]
    of Object.entries(data)
  ) {

    console.log(
      key,
      "=",
      String(value).slice(0, 100)
    );
  }

  // ==================================================
  // 3. BUILD EXACT ROUND POST
  // ==================================================

  data.__EVENTTARGET =
    "ctl00$ContentPlaceHolder1$ddlroundno";

  data.__EVENTARGUMENT =
    "";

  data[
    "ctl00$ContentPlaceHolder1$ddlroundno"
  ] =
    "1";

  data[
    "ctl00$ContentPlaceHolder1$ddlInstype"
  ] =
    "";

  data[
    "ctl00$ContentPlaceHolder1$ddlInstitute"
  ] =
    "";

  data[
    "ctl00$ContentPlaceHolder1$ddlBranch"
  ] =
    "";

  data[
    "ctl00$ContentPlaceHolder1$ddlSeattype"
  ] =
    "";

  // IMPORTANT:
  // This is a dropdown postback, NOT Submit.

  delete data[
    "ctl00$ContentPlaceHolder1$btnSubmit"
  ];

  console.log(
    "\n========================================"
  );

  console.log(
    "ROUND POST DATA"
  );

  console.log(
    "========================================"
  );

  console.log(
    "EVENTTARGET:",
    data.__EVENTTARGET
  );

  console.log(
    "ROUND:",
    data[
      "ctl00$ContentPlaceHolder1$ddlroundno"
    ]
  );

  console.log(
    "INSTYPE:",
    data[
      "ctl00$ContentPlaceHolder1$ddlInstype"
    ]
  );

  console.log(
    "INSTITUTE:",
    data[
      "ctl00$ContentPlaceHolder1$ddlInstitute"
    ]
  );

  console.log(
    "BRANCH:",
    data[
      "ctl00$ContentPlaceHolder1$ddlBranch"
    ]
  );

  console.log(
    "SEAT:",
    data[
      "ctl00$ContentPlaceHolder1$ddlSeattype"
    ]
  );

  // ==================================================
  // 4. POST ROUND 1
  // ==================================================

  console.log(
    "\n2. POST ROUND 1"
  );

  const postResponse =
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

          "Cache-Control":
            "no-cache"
        }
      }
    );

  console.log(
    "POST HTTP:",
    postResponse.status
  );

  console.log(
    "POST SIZE:",
    postResponse.data.length
  );

  // ==================================================
  // 5. SAVE RESPONSE
  // ==================================================

  fs.writeFileSync(
    "./data/official/working-round1.html",
    postResponse.data,
    "utf8"
  );

  console.log(
    "SAVED:",
    "./data/official/working-round1.html"
  );

  // ==================================================
  // 6. ANALYSE RESPONSE
  // ==================================================

  const $ =
    cheerio.load(
      postResponse.data
    );

  console.log(
    "\n========================================"
  );

  console.log(
    "ROUND 1 RESPONSE"
  );

  console.log(
    "========================================"
  );

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
    $(
      "#ctl00_ContentPlaceHolder1_ddlroundno"
    ).length
  );

  console.log(
    "INSTYPE SELECT:",
    $(
      "#ctl00_ContentPlaceHolder1_ddlInstype"
    ).length
  );

  // ==================================================
  // ROUND OPTIONS
  // ==================================================

  console.log(
    "\nROUND OPTIONS:"
  );

  console.table(
    getOptions(
      postResponse.data,
      "ctl00_ContentPlaceHolder1_ddlroundno"
    )
  );

  // ==================================================
  // INSTITUTE TYPES
  // ==================================================

  console.log(
    "\nINSTITUTE TYPES:"
  );

  const instituteTypes =
    getOptions(
      postResponse.data,
      "ctl00_ContentPlaceHolder1_ddlInstype"
    );

  console.table(
    instituteTypes
  );

  // ==================================================
  // IIT CHECK
  // ==================================================

  const iit =
    instituteTypes.find(
      x => x.value === "IIT"
    );

  console.log(
    "\nIIT OPTION:",
    iit
  );

  // ==================================================
  // BODY
  // ==================================================

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

  // ==================================================
  // FINAL RESULT
  // ==================================================

  console.log(
    "\n========================================"
  );

  if (
    instituteTypes.length > 0
  ) {

    console.log(
      "SUCCESS: ROUND POST WORKED"
    );

    console.log(
      "Institute types returned:",
      instituteTypes.length
    );

  } else {

    console.log(
      "FAILED: NO INSTITUTE TYPES"
    );

    if (
      body.includes(
        "Something Went Wrong"
      )
    ) {

      console.log(
        "\nJOSAA RETURNED:"
      );

      console.log(
        "Something Went Wrong"
      );

      console.log(
        "This is a SERVER-SIDE POSTBACK ERROR."
      );
    }
  }

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
      "TEST FAILED"
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

    process.exitCode = 1;
  }
);