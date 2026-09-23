const fs = require("fs");

const file =
  "./backend/src/server.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const oldBlock =
`app.use(
  '/api/dev/cw-rec',
  cwRecV1DevRouter
);`;


const newBlock =
`app.use(
  '/api/dev/cw-rec',
  cwRecV1DevRouter
);


/*
|--------------------------------------------------------------------------
| TRUMARG PUBLIC RECOMMENDATION API V1
|--------------------------------------------------------------------------
|
| Stable production route.
| Old /api/dev/cw-rec remains temporarily for backward compatibility.
|
*/

app.use(
  '/api/v1',
  cwRecV1DevRouter
);`;


if (
  !text.includes(
    oldBlock
  )
) {
  throw new Error(
    "CW-REC mount block not found"
  );
}


text =
  text.replace(
    oldBlock,
    newBlock
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: /api/v1 production recommendation route added"
);
