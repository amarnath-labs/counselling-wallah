const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

const client = axios.create({
  timeout: 30000,
  maxRedirects: 5,

  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Safari/537.36",

    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

    "Accept-Language":
      "en-US,en;q=0.9",

    "Connection":
      "keep-alive"
  },

  validateStatus: s => s >= 200 && s < 400
});

function getHidden(html) {

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

  console.log("========================================");
  console.log("JOSAA ROUND POST DEBUG");
  console.log("========================================");

  // =================================================
  // GET
  // =================================================

  console.log("\n1. GET");

  const get =
    await client.get(URL);

  const html =
    get.data;

  console.log(
    "HTTP:",
    get.status
  );

  console.log(
    "SIZE:",
    html.length
  );

  // =================================================
  // HIDDEN FIELDS
  // =================================================

  const data =
    getHidden(html);

  console.log(
    "\nHIDDEN FIELD COUNT:",
    Object.keys(data).length
  );

  // =================================================
  // SHOW ORIGINAL SELECTS
  // =================================================

  console.log(
    "\nORIGINAL ROUND OPTIONS:"
  );

  console.table(
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlroundno"
    )
  );

  console.log(
    "\nORIGINAL INSTITUTE TYPE OPTIONS:"
  );

  console.table(
    getOptions(
      html,
      "ctl00_ContentPlaceHolder1_ddlInstype"
    )
  );

  // =================================================
  // IMPORTANT:
  // KEEP ALL ORIGINAL HIDDEN FIELDS
  // =================================================

  data.__EVENTTARGET =
    "ctl00$ContentPlaceHolder1$ddlroundno";

  data.__EVENTARGUMENT =
    "";

  data[
    "ctl00$ContentPlaceHolder1$ddlroundno"
  ] = "1";

  // DO NOT ADD EMPTY SELECT VALUES
  // unless they actually exist in the original form.

  console.log(
    "\nEVENTTARGET:",
    data.__EVENTTARGET
  );

  console.log(
    "ROUND:",
    data[
      "ctl00$ContentPlaceHolder1$ddlroundno"
    ]
  );

  // =================================================
  // SHOW EXACT FORM KEYS
  // =================================================

  console.log(
    "\nFORM KEYS:"
  );

  console.table(
    Object.keys(data).map(
      key => ({
        key,
        value:
          String(data[key]).slice(0, 150)
      })
    )
  );

  // =================================================
  // POST
  // =================================================

  console.log(
    "\n2. POST ROUND 1"
  );

  const encoded =
    new URLSearchParams(data).toString();

  console.log(
    "POST BODY LENGTH:",
    encoded.length
  );

  const post =
    await client.post(
      URL,
      encoded,
      {
        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded",

          "Referer":
            URL,

          "Origin":
            "https://josaa.admissions.nic.in",

          "Upgrade-Insecure-Requests":
            "1"
        }
      }
    );

  console.log(
    "\nPOST HTTP:",
    post.status
  );

  console.log(
    "POST SIZE:",
    post.data.length
  );

  fs.writeFileSync(
    "./data/official/debug-round-post.html",
    post.data,
    "utf8"
  );

  console.log(
    "SAVED: data/official/debug-round-post.html"
  );

  // =================================================
  // ANALYSE
  // =================================================

  const $ =
    cheerio.load(post.data);

  console.log(
    "\nTITLE:",
    $("title").text().trim()
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

  // =================================================
  // BODY
  // =================================================

  const body =
    $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

  console.log(
    "\nBODY:"
  );

  console.log(
    body.slice(-3000)
  );

  // =================================================
  // INSTITUTE TYPES
  // =================================================

  const types =
    getOptions(
      post.data,
      "ctl00_ContentPlaceHolder1_ddlInstype"
    );

  console.log(
    "\nINSTITUTE TYPES:"
  );

  console.table(types);

  // =================================================
  // FINAL
  // =================================================

  console.log(
    "\n========================================"
  );

  if (types.length) {

    console.log(
      "ROUND POST SUCCESS"
    );

    console.log(
      "Institute types:",
      types.length
    );

  } else {

    console.log(
      "ROUND POST FAILED"
    );

    console.log(
      "JOSAA returned no institute types."
    );
  }

  console.log(
    "========================================"
  );
}

main().catch(error => {

  console.error(
    "\nERROR:"
  );

  console.error(
    error.stack ||
    error.message
  );

});
