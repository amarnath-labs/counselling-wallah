import fs from "node:fs";
import axios from "axios";
import * as cheerio from "cheerio";
import { pool } from "./pool.js";

const URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

const client = axios.create({
  maxRedirects: 5,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  }
});

function getHiddenFields(html) {
  const $ = cheerio.load(html);
  const data = {};

  $("form#aspnetForm input[type='hidden']").each((_, el) => {
    const name = $(el).attr("name");

    if (name) {
      data[name] = $(el).attr("value") || "";
    }
  });

  return data;
}

function getOptions(html, selector) {
  const $ = cheerio.load(html);

  return $(selector)
    .find("option")
    .map((_, el) => ({
      value: $(el).attr("value") || "",
      text: $(el).text().trim()
    }))
    .get()
    .filter(x => x.value && x.value !== "0");
}

async function postBack(html, eventTarget, values) {
  const form = getHiddenFields(html);

  form["__EVENTTARGET"] = eventTarget;
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
        "Referer": URL,
        "Origin":
          "https://josaa.admissions.nic.in"
      }
    }
  );

  return response.data;
}

function parseResults(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $("table").each((_, table) => {
    $(table)
      .find("tr")
      .each((index, tr) => {
        if (index === 0) return;

        const cells = $(tr)
          .find("td")
          .map((_, td) => $(td).text().replace(/\s+/g, " ").trim())
          .get();

        if (cells.length < 7) return;

        const openingRank = Number(
          cells[5].replace(/,/g, "")
        );

        const closingRank = Number(
          cells[6].replace(/,/g, "")
        );

        if (
          Number.isFinite(openingRank) &&
          Number.isFinite(closingRank)
        ) {
          rows.push({
            instituteName: cells[0],
            branchName: cells[1],
            quota: cells[2],
            seatType: cells[3],
            gender: cells[4],
            openingRank,
            closingRank
          });
        }
      });
  });

  return rows;
}

function makeId(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function main() {
  console.log("========================================");
  console.log("JOSAA 2026 FULL IIT DATA IMPORT");
  console.log("========================================");

  console.log("\n1. GET JoSAA page...");

  let response = await client.get(URL);

  let html = response.data;

  console.log("GET:", response.status);
  console.log("HTML:", html.length);

  console.log("\n2. Selecting Round 1...");

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlroundno",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno": "1"
    }
  );

  console.log("Round selected.");

  console.log("\n3. Selecting IIT...");

  html = await postBack(
    html,
    "ctl00$ContentPlaceHolder1$ddlInstype",
    {
      "ctl00$ContentPlaceHolder1$ddlroundno": "1",
      "ctl00$ContentPlaceHolder1$ddlInstype": "IIT"
    }
  );

  const institutes = getOptions(
    html,
    "#ctl00_ContentPlaceHolder1_ddlInstitute"
  );

  console.log("IIT institutes:", institutes.length);

  console.table(institutes);

  let totalBranches = 0;
  let totalRecords = 0;

  for (const institute of institutes) {

    if (institute.value === "ALL") continue;

    console.log(
      `\n========================================`
    );

    console.log(
      `INSTITUTE: ${institute.text} (${institute.value})`
    );

    console.log(
      `========================================`
    );

    html = await postBack(
      html,
      "ctl00$ContentPlaceHolder1$ddlInstitute",
      {
        "ctl00$ContentPlaceHolder1$ddlroundno": "1",
        "ctl00$ContentPlaceHolder1$ddlInstype": "IIT",
        "ctl00$ContentPlaceHolder1$ddlInstitute":
          institute.value
      }
    );

    const branches = getOptions(
      html,
      "#ctl00_ContentPlaceHolder1_ddlBranch"
    );

    console.log(
      "Branches:",
      branches.length
    );

    totalBranches += branches.length;

    for (const branch of branches) {

      if (branch.value === "ALL") continue;

      console.log(
        `  → ${branch.text}`
      );

      html = await postBack(
        html,
        "ctl00$ContentPlaceHolder1$ddlBranch",
        {
          "ctl00$ContentPlaceHolder1$ddlroundno": "1",
          "ctl00$ContentPlaceHolder1$ddlInstype": "IIT",
          "ctl00$ContentPlaceHolder1$ddlInstitute":
            institute.value,
          "ctl00$ContentPlaceHolder1$ddlBranch":
            branch.value
        }
      );

      const seatTypes = getOptions(
        html,
        "#ctl00_ContentPlaceHolder1_ddlSeattype"
      );

      const openSeat = seatTypes.find(
        x => x.value === "OPNO"
      );

      if (!openSeat) {
        console.log(
          "     OPEN seat type not available"
        );
        continue;
      }

      html = await postBack(
        html,
        "ctl00$ContentPlaceHolder1$ddlSeattype",
        {
          "ctl00$ContentPlaceHolder1$ddlroundno": "1",
          "ctl00$ContentPlaceHolder1$ddlInstype": "IIT",
          "ctl00$ContentPlaceHolder1$ddlInstitute":
            institute.value,
          "ctl00$ContentPlaceHolder1$ddlBranch":
            branch.value,
          "ctl00$ContentPlaceHolder1$ddlSeattype":
            "OPNO"
        }
      );

      const form = getHiddenFields(html);

      form["ctl00$ContentPlaceHolder1$ddlroundno"] = "1";
      form["ctl00$ContentPlaceHolder1$ddlInstype"] = "IIT";
      form["ctl00$ContentPlaceHolder1$ddlInstitute"] =
        institute.value;
      form["ctl00$ContentPlaceHolder1$ddlBranch"] =
        branch.value;
      form["ctl00$ContentPlaceHolder1$ddlSeattype"] =
        "OPNO";

      const submit = await client.post(
        URL,
        new URLSearchParams(form).toString(),
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            "Referer": URL,
            "Origin":
              "https://josaa.admissions.nic.in"
          }
        }
      );

      const results = parseResults(
        submit.data
      );

      for (const row of results) {

        console.log(
          `     ${row.gender} | ${row.quota} | ${row.openingRank}-${row.closingRank}`
        );

        totalRecords++;
      }
    }
  }

  console.log("\n========================================");
  console.log("IMPORT TEST COMPLETED");
  console.log("========================================");

  console.log(
    "Total branches discovered:",
    totalBranches
  );

  console.log(
    "Total cutoff records:",
    totalRecords
  );

  await pool.end();
}

main().catch(async error => {
  console.error("\nIMPORT FAILED");
  console.error(error);

  try {
    await pool.end();
  } catch {}

  process.exit(1);
});
