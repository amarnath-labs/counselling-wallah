const fs =
  require("fs");

const path =
  require("path");

const root =
  "./frontend/src";

const allowed =
  new Set([
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".css",
  ]);


let changedFiles =
  0;


function fixText(
  text
) {
  return text

    /*
    | ✓
    */
    .replaceAll(
      "\u00e2\u0153\u201c",
      "\u2713"
    )

    /*
    | ✗
    */
    .replaceAll(
      "\u00e2\u0153\u2014",
      "\u2717"
    )

    /*
    | –
    */
    .replaceAll(
      "\u00e2\u20ac\u201c",
      "\u2013"
    )

    /*
    | —
    */
    .replaceAll(
      "\u00e2\u20ac\u201d",
      "\u2014"
    )

    /*
    | ↑
    */
    .replaceAll(
      "\u00e2\u2020\u2018",
      "\u2191"
    )

    /*
    | ↓
    */
    .replaceAll(
      "\u00e2\u2020\u201c",
      "\u2193"
    )

    /*
    | →
    */
    .replaceAll(
      "\u00e2\u2020\u2019",
      "\u2192"
    )

    /*
    | bullet
    */
    .replaceAll(
      "\u00e2\u20ac\u00a2",
      "\u2022"
    );
}


function walk(
  directory
) {
  for (
    const entry
    of fs.readdirSync(
      directory,
      {
        withFileTypes: true,
      }
    )
  ) {
    const full =
      path.join(
        directory,
        entry.name
      );


    if (
      entry.isDirectory()
    ) {
      walk(
        full
      );

      continue;
    }


    if (
      !allowed.has(
        path.extname(
          entry.name
        )
      )
    ) {
      continue;
    }


    const before =
      fs.readFileSync(
        full,
        "utf8"
      );


    const after =
      fixText(
        before
      );


    if (
      after !== before
    ) {
      fs.writeFileSync(
        full,
        after,
        "utf8"
      );

      changedFiles += 1;

      console.log(
        "FIXED:",
        full
      );
    }
  }
}


walk(
  root
);


console.log(
  `Unicode fixed in ${changedFiles} file(s).`
);
