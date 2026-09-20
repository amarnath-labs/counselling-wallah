import fs from "node:fs";

const file =
  "./src/pages/CollegeDetail.jsx";

let code =
  fs.readFileSync(file, "utf8");


/*
|--------------------------------------------------------------------------
| 1. ADD OFFICIAL WEBSITE RESOLVER
|--------------------------------------------------------------------------
*/

const marker1 =
`  const c = currentCollege;
  const b = c.branches[currentBranchIdx];`;

const replacement1 =
`  const c = currentCollege;
  const b = c.branches[currentBranchIdx];

  /*
  |--------------------------------------------------------------------------
  | OFFICIAL COLLEGE WEBSITE
  |--------------------------------------------------------------------------
  */

  const officialWebsiteRaw =
    c?.officialWebsite ??
    c?.official_website ??
    c?.websiteUrl ??
    c?.website_url ??
    c?.website ??
    null;

  const officialWebsite =
    typeof officialWebsiteRaw === 'string' &&
    /^https?:\\/\\//i.test(
      officialWebsiteRaw.trim()
    )
      ? officialWebsiteRaw.trim()
      : null;`;

if (
  !code.includes(
    "const officialWebsiteRaw"
  )
) {
  if (!code.includes(marker1)) {
    console.error(
      "FAILED: college data marker not found"
    );
    process.exit(1);
  }

  code =
    code.replace(
      marker1,
      replacement1
    );

  console.log(
    "PATCHED: official website resolver"
  );
}
else {
  console.log(
    "SKIPPED: website resolver already exists"
  );
}


/*
|--------------------------------------------------------------------------
| 2. ADD OFFICIAL WEBSITE BUTTON
|--------------------------------------------------------------------------
*/

const marker2 =
`          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              addCompare(c.id, b.name)
            }
          >
            + Add to Compare
          </Button>`;

const replacement2 =
`          {officialWebsite ? (
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                textDecoration: 'none',
              }}
            >
              Visit Official Website ↗
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled
              title="Official college website is not available in our database yet."
              style={{
                opacity: 0.55,
                cursor: 'not-allowed',
              }}
            >
              Official Website Unavailable
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              addCompare(c.id, b.name)
            }
          >
            + Add to Compare
          </Button>`;

if (
  !code.includes(
    "Visit Official Website"
  )
) {
  if (!code.includes(marker2)) {
    console.error(
      "FAILED: action button marker not found"
    );
    process.exit(1);
  }

  code =
    code.replace(
      marker2,
      replacement2
    );

  console.log(
    "PATCHED: official website button"
  );
}
else {
  console.log(
    "SKIPPED: website button already exists"
  );
}


fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log(
  "OFFICIAL WEBSITE UI COMPLETE"
);
