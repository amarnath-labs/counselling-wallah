const fs = require("fs");

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const pattern =
  /<div\s+className=["']rec-card__rank["']>\s*#\s*\{\s*index\s*\+\s*1\s*\}\s*<\/div>/m;


const replacement =
`<div className="rec-card__rank">
        #{
          row?.ranking?.globalRank ??
          row?.premium?.ranking?.globalRank ??
          index + 1
        }
      </div>`;


const count =
  (text.match(
    new RegExp(
      pattern.source,
      "gm"
    )
  ) || []).length;


if (
  count < 1
) {
  console.log(
    "Could not find simple rank block."
  );

  console.log(
    "Showing current rec-card__rank occurrences:"
  );

  const lines =
    text.split(/\r?\n/);

  lines.forEach(
    (line, i) => {
      if (
        line.includes(
          "rec-card__rank"
        )
      ) {
        console.log(
          `${i + 1}: ${line}`
        );
      }
    }
  );

  process.exit(2);
}


text =
  text.replace(
    pattern,
    replacement
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  `PASS: patched ${count} rank block(s) to globalRank`
);
