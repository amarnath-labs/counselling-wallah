const fs = require("fs");

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const old =
`<div className="rec-card__rank">#{index + 1}</div>`;


const replacement =
`<div className="rec-card__rank">
        #{
          row?.ranking?.globalRank ??
          row?.premium?.ranking?.globalRank ??
          index + 1
        }
      </div>`;


if (
  !text.includes(
    old
  )
) {
  throw new Error(
    "Card rank block not found"
  );
}


text =
  text.replace(
    old,
    replacement
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: card numbering now uses globalRank"
);
