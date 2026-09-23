const fs = require("fs");

const file =
  "./backend/src/server.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


if (
  !text.includes(
    "cwRecV1DevRouter"
  )
) {
  throw new Error(
    "cwRecV1DevRouter import/reference not found"
  );
}


if (
  text.includes(
    "'/api/v1'"
  ) ||
  text.includes(
    '"/api/v1"'
  )
) {
  console.log(
    "SKIP: /api/v1 route already exists"
  );

  process.exit(0);
}


const pattern =
  /app\.use\(\s*['"]\/api\/dev\/cw-rec['"]\s*,\s*cwRecV1DevRouter\s*\)\s*;?/m;


const match =
  text.match(
    pattern
  );


if (
  !match
) {
  console.log(
    "Could not patch automatically."
  );

  const lines =
    text.split(/\r?\n/);

  lines.forEach(
    (line, index) => {
      if (
        line.includes(
          "cwRecV1DevRouter"
        ) ||
        line.includes(
          "/api/dev/cw-rec"
        )
      ) {
        console.log(
          `${index + 1}: ${line}`
        );
      }
    }
  );

  process.exit(2);
}


const replacement =
`${match[0]}


/*
|--------------------------------------------------------------------------
| TRUMARG PUBLIC RECOMMENDATION API V1
|--------------------------------------------------------------------------
|
| Stable production alias.
| Existing /api/dev/cw-rec route remains temporarily for compatibility.
|
*/

app.use(
  '/api/v1',
  cwRecV1DevRouter
);`;


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
  "PASS: /api/v1 route added successfully"
);
