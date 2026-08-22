import fs from "node:fs";
import axios from "axios";
import * as cheerio from "cheerio";

const URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

const FIELDS = {
  round: "ctl00$ContentPlaceHolder1$ddlroundno",
  instype: "ctl00$ContentPlaceHolder1$ddlInstype",
  institute: "ctl00$ContentPlaceHolder1$ddlInstitute",
  branch: "ctl00$ContentPlaceHolder1$ddlBranch",
  seat: "ctl00$ContentPlaceHolder1$ddlSeattype"
};

const client = axios.create({
  maxRedirects: 5,
  timeout: 30000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  },
  validateStatus: s => s >= 200 && s < 400
});

function hidden(html) {
  const $ = cheerio.load(html);
  const data = {};

  $("form#aspnetForm input[type=hidden]").each((_, el) => {
    const name = $(el).attr("name");

    if (name) {
      data[name] = $(el).attr("value") || "";
    }
  });

  return data;
}

function getOptions(html, id) {
  const $ = cheerio.load(html);

  return $("#" + id)
    .find("option")
    .map((_, el) => ({
      value: $(el).attr("value") || "",
      text: $(el)
        .text()
        .replace(/\s+/g, " ")
        .trim()
    }))
    .get();
}

async function postBack(html, control, values) {
  const data = hidden(html);

  data.__EVENTTARGET = control;
  data.__EVENTARGUMENT = "";

  data[FIELDS.round] = values.round ?? "";
  data[FIELDS.instype] = values.instype ?? "";
  data[FIELDS.institute] = values.institute ?? "";
  data[FIELDS.branch] = values.branch ?? "";
  data[FIELDS.seat] = values.seat ?? "";

  const response = await client.post(
    URL,
    new URLSearchParams(data).toString(),
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Referer: URL,
        Origin:
          "https://josaa.admissions.nic.in"
      }
    }
  );

  console.log(
    "POST:",
    control,
    "=>",
    response.status,
    response.data.length
  );

  return response.data;
}

async function main() {
  console.log("========================================");
  console.log("JOSAA WORKING CHAIN TEST");
  console.log("========================================");

  // GET
  console.log("\n1. GET");

  let html = (await client.get(URL)).data;

  console.log("GET SIZE:", html.length);

  // ROUND
  console.log("\n2. ROUND 1");

  html = await postBack(
    html,
    FIELDS.round,
    {
      round: "1",
      instype: "",
      institute: "",
      branch: "",
      seat: ""
    }
  );

  // IIT
  console.log("\n3. IIT");

  html = await postBack(
    html,
    FIELDS.instype,
    {
      round: "1",
      instype: "IIT",
      institute: "",
      branch: "",
      seat: ""
    }
  );

  const institutes = getOptions(
    html,
    "ctl00_ContentPlaceHolder1_ddlInstitute"
  ).filter(x => x.value && x.value !== "0");

  console.log("\nIIT INSTITUTES:", institutes.length);
  console.table(institutes);

  if (!institutes.length) {
    throw new Error(
      "IIT institutes were not populated. POST chain is broken."
    );
  }

  // IIT BOMBAY
  const bombay = institutes.find(
    x =>
      x.value === "102" ||
      x.text.toLowerCase().includes("bombay")
  );

  if (!bombay) {
    throw new Error("IIT Bombay not found.");
  }

  console.log("\n4. IIT BOMBAY");
  console.log(bombay);

  html = await postBack(
    html,
    FIELDS.institute,
    {
      round: "1",
      instype: "IIT",
      institute: bombay.value,
      branch: "",
      seat: ""
    }
  );

  const branches = getOptions(
    html,
    "ctl00_ContentPlaceHolder1_ddlBranch"
  ).filter(x => x.value && x.value !== "0");

  console.log("\nIIT BOMBAY BRANCHES:", branches.length);
  console.table(branches);

  if (!branches.length) {
    throw new Error("IIT Bombay branches were not populated.");
  }

  // CSE
  const cse = branches.find(
    x =>
      x.value === "4110" ||
      x.text
        .toLowerCase()
        .includes("computer science and engineering")
  );

  if (!cse) {
    throw new Error("CSE branch not found.");
  }

  console.log("\n5. CSE");
  console.log(cse);

  html = await postBack(
    html,
    FIELDS.branch,
    {
      round: "1",
      instype: "IIT",
      institute: bombay.value,
      branch: cse.value,
      seat: ""
    }
  );

  const seats = getOptions(
    html,
    "ctl00_ContentPlaceHolder1_ddlSeattype"
  ).filter(x => x.value && x.value !== "0");

  console.log("\n6. SEAT TYPES:", seats.length);
  console.table(seats);

  if (!seats.length) {
    throw new Error("Seat types were not populated.");
  }

  // OPEN
  const open = seats.find(
    x =>
      x.value === "OPNO" ||
      x.text.toLowerCase() === "open"
  );

  if (!open) {
    throw new Error("OPEN seat type not found.");
  }

  console.log("\n7. OPEN");
  console.log(open);

  html = await postBack(
    html,
    FIELDS.seat,
    {
      round: "1",
      instype: "IIT",
      institute: bombay.value,
      branch: cse.value,
      seat: open.value
    }
  );

  fs.writeFileSync(
    "./data/official/josaa-iit-cse-open-before-submit.html",
    html,
    "utf8"
  );

  console.log("\n========================================");
  console.log("CHAIN SUCCESS");
  console.log("========================================");

  console.log("Final HTML:", html.length);
  console.log(
    "Saved: data/official/josaa-iit-cse-open-before-submit.html"
  );
}

main().catch(error => {
  console.error("\n========================================");
  console.error("FAILED");
  console.error("========================================");
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
