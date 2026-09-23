const fs = require("fs");
const path = require("path");

const root =
  "./frontend/src";


function walk(dir) {
  const entries =
    fs.readdirSync(
      dir,
      {
        withFileTypes: true
      }
    );

  for (
    const entry
    of entries
  ) {
    const full =
      path.join(
        dir,
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
      !/\.(js|jsx|css|html)$/.test(
        entry.name
      )
    ) {
      continue;
    }


    let text =
      fs.readFileSync(
        full,
        "utf8"
      );


    const original =
      text;


    text =
      text
        .replaceAll(
          "\u00e2\u0153\u201c",
          "\u2713"
        )
        .replaceAll(
          "\u00e2\u0153\u2013",
          "\u2717"
        )
        .replaceAll(
          "\u00e2\u20ac\u201c",
          "\u2013"
        )
        .replaceAll(
          "\u00e2\u20ac\u201d",
          "\u2014"
        )
        .replaceAll(
          "\u00e2\u2020\u2018",
          "\u2191"
        )
        .replaceAll(
          "\u00e2\u2020\u201c",
          "\u2193"
        );


    if (
      text !== original
    ) {
      fs.writeFileSync(
        full,
        text,
        "utf8"
      );

      console.log(
        "Fixed unicode:",
        full
      );
    }
  }
}


walk(
  root
);

console.log(
  "Unicode scan complete."
);
