import fs from "node:fs";

const file =
  "./vercel.json";

let config = {};

if (
  fs.existsSync(file)
) {
  const raw =
    fs.readFileSync(
      file,
      "utf8"
    ).replace(/^\uFEFF/, "");

  try {
    config =
      JSON.parse(raw);
  }
  catch (error) {
    console.error("");
    console.error(
      "ERROR: Existing vercel.json is not valid JSON."
    );
    console.error(
      "Nothing has been changed."
    );
    console.error("");
    process.exit(1);
  }
}


/*
|--------------------------------------------------------------------------
| Keep existing redirects
|--------------------------------------------------------------------------
*/

const existingRedirects =
  Array.isArray(
    config.redirects
  )
    ? config.redirects
    : [];


/*
|--------------------------------------------------------------------------
| Remove previous copies of OUR domain redirects
|--------------------------------------------------------------------------
*/

const cleanedRedirects =
  existingRedirects.filter(
    rule => {
      const host =
        rule?.has?.find?.(
          condition =>
            condition?.type ===
            "host"
        )?.value;

      return (
        host !==
          "counselling-wallah-frontend.vercel.app" &&
        host !==
          "trumarg.com"
      );
    }
  );


/*
|--------------------------------------------------------------------------
| OLD VERCEL DOMAIN -> www.trumarg.com
|--------------------------------------------------------------------------
|
| Examples:
|
| counselling-wallah-frontend.vercel.app/
| -> www.trumarg.com/
|
| counselling-wallah-frontend.vercel.app/exams
| -> www.trumarg.com/exams
|
| counselling-wallah-frontend.vercel.app/dashboard
| -> www.trumarg.com/dashboard
|
|--------------------------------------------------------------------------
*/

const oldVercelRedirect = {
  source: "/:path*",

  has: [
    {
      type: "host",
      value:
        "counselling-wallah-frontend.vercel.app"
    }
  ],

  destination:
    "https://www.trumarg.com/:path*",

  statusCode: 301
};


/*
|--------------------------------------------------------------------------
| ROOT DOMAIN -> WWW
|--------------------------------------------------------------------------
|
| trumarg.com/abc
| -> www.trumarg.com/abc
|
|--------------------------------------------------------------------------
*/

const apexRedirect = {
  source: "/:path*",

  has: [
    {
      type: "host",
      value:
        "trumarg.com"
    }
  ],

  destination:
    "https://www.trumarg.com/:path*",

  statusCode: 301
};


/*
|--------------------------------------------------------------------------
| Domain redirects FIRST
|--------------------------------------------------------------------------
*/

config.redirects = [
  oldVercelRedirect,
  apexRedirect,
  ...cleanedRedirects,
];


/*
|--------------------------------------------------------------------------
| Add schema if absent
|--------------------------------------------------------------------------
*/

if (
  !config.$schema
) {
  config.$schema =
    "https://openapi.vercel.sh/vercel.json";
}


/*
|--------------------------------------------------------------------------
| Write
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  file,
  JSON.stringify(
    config,
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "TRUMARG DOMAIN REDIRECT FIX COMPLETE"
);
console.log(
  "========================================"
);
console.log("");
console.log(
  "OLD VERCEL -> www.trumarg.com"
);
console.log(
  "trumarg.com -> www.trumarg.com"
);
console.log("");
