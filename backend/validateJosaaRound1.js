import fs from "node:fs";
import path from "node:path";

const CSV_FILE = path.resolve(
  "./data/official/josaa-2026/josaa-round-1-full.csv"
);

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map(x => x.trim());
}

const text = fs.readFileSync(CSV_FILE, "utf8");

const lines = text
  .split(/\r?\n/)
  .filter(line => line.trim());

const headers = parseCSVLine(lines[0]);

let invalid = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);

  const row = {};

  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });

  const problems = [];

  if (!row["Institute"]?.trim())
    problems.push("Institute");

  if (!row["Academic Program Name"]?.trim())
    problems.push("Academic Program Name");

  if (!row["Quota"]?.trim())
    problems.push("Quota");

  if (!row["Seat Type"]?.trim())
    problems.push("Seat Type");

  if (!row["Gender"]?.trim())
    problems.push("Gender");

  if (!Number.isFinite(Number(row["Opening Rank"])))
    problems.push("Opening Rank");

  if (!Number.isFinite(Number(row["Closing Rank"])))
    problems.push("Closing Rank");

  if (problems.length) {
    invalid.push({
      line: i + 1,
      problems: problems.join(", "),
      institute: row["Institute"],
      program: row["Academic Program Name"],
      quota: row["Quota"],
      seatType: row["Seat Type"],
      gender: row["Gender"],
      opening: row["Opening Rank"],
      closing: row["Closing Rank"]
    });
  }
}

console.log("========================================");
console.log("JOSAA ROUND 1 VALIDATION");
console.log("========================================");

console.log("TOTAL DATA ROWS:", lines.length - 1);
console.log("INVALID ROWS:", invalid.length);

console.log("\nINVALID ROWS:");

console.table(invalid);

if (invalid.length) {
  fs.writeFileSync(
    "./data/official/josaa-2026/josaa-round-1-invalid.json",
    JSON.stringify(invalid, null, 2),
    "utf8"
  );

  console.log(
    "\nSaved:",
    "./data/official/josaa-2026/josaa-round-1-invalid.json"
  );
}
