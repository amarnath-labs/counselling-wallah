import fs from "fs";

const aliasSql = `
        CASE c.id::text

          WHEN 'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior'
            THEN 'iiitm-gwalior'

          WHEN 'iiit-allahabad'
            THEN 'indian-institute-of-information-technology-allahabad'

          WHEN 'iiit-pune'
            THEN 'indian-institute-of-information-technology-pune'

          WHEN 'nit-calicut'
            THEN 'national-institute-of-technology-calicut'

          WHEN 'nit-rourkela'
            THEN 'national-institute-of-technology-rourkela'

          WHEN 'nit-trichy'
            THEN 'national-institute-of-technology-tiruchirappalli'

          WHEN 'nit-warangal'
            THEN 'national-institute-of-technology-warangal'

          ELSE c.id::text

        END
`;

function backup(path) {
  const backupPath =
    `${path}.before-fee-alias-v14`;

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(path, backupPath);
    console.log(
      `Backup created: ${backupPath}`
    );
  }
}

function patchCwRec() {
  const path =
    "./src/services/cwRecDataV1.js";

  backup(path);

  let text =
    fs.readFileSync(path, "utf8");

  const pattern =
    /fp\.college_id\s*=\s*c\.id::text/;

  const matches =
    text.match(
      new RegExp(
        pattern.source,
        "g"
      )
    );

  if (!matches || matches.length !== 1) {
    throw new Error(
      `cwRecDataV1.js expected exactly 1 fee college_id match, found ${matches?.length ?? 0}`
    );
  }

  text = text.replace(
    pattern,
    `fp.college_id = ${aliasSql}`
  );

  fs.writeFileSync(
    path,
    text,
    "utf8"
  );

  console.log(
    "✅ Patched cwRecDataV1.js"
  );
}

function patchColleges() {
  const path =
    "./src/routes/colleges.js";

  backup(path);

  let text =
    fs.readFileSync(path, "utf8");

  const pattern =
    /fp\.college_id::text\s*=\s*c\.id::text/;

  const matches =
    text.match(
      new RegExp(
        pattern.source,
        "g"
      )
    );

  if (!matches || matches.length !== 1) {
    throw new Error(
      `colleges.js expected exactly 1 fee college_id match, found ${matches?.length ?? 0}`
    );
  }

  text = text.replace(
    pattern,
    `fp.college_id::text = ${aliasSql}`
  );

  fs.writeFileSync(
    path,
    text,
    "utf8"
  );

  console.log(
    "✅ Patched colleges.js"
  );
}

patchCwRec();
patchColleges();

console.log("");
console.log(
  "✅ VERIFIED FEE ALIAS PATCH V14 COMPLETE"
);
