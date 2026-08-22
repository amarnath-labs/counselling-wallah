const fs = require("fs");
const cheerio = require("cheerio");

const file = "./data/official/josaa-currentorcr-2026.html";
const html = fs.readFileSync(file, "utf8");
const $ = cheerio.load(html);

console.log("\n=== SELECT OPTIONS ===\n");

for (const id of [
  "ctl00_ContentPlaceHolder1_ddlroundno",
  "ctl00_ContentPlaceHolder1_ddlInstype",
  "ctl00_ContentPlaceHolder1_ddlInstitute",
  "ctl00_ContentPlaceHolder1_ddlBranch",
  "ctl00_ContentPlaceHolder1_ddlSeattype"
]) {
  const el = $("#" + id);

  console.log(`\n${id}`);

  el.find("option").each((i, option) => {
    console.log(
      i,
      "value=" + $(option).attr("value"),
      "text=" + $(option).text().trim()
    );
  });
}
