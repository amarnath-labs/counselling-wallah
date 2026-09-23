import fs from "node:fs";

const file =
  "./src/routes/colleges.js";

const backup =
  "./src/routes/colleges.before-cloudflare-header.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


const oldText =
`res.set(
          'CDN-Cache-Control',
          'public, s-maxage=300, stale-while-revalidate=60'
        );`;


const newText =
`res.set(
          'Cache-Control',
          'public, max-age=0, must-revalidate'
        );

        res.set(
          'CDN-Cache-Control',
          'public, s-maxage=300, stale-while-revalidate=600'
        );

        res.set(
          'Cloudflare-CDN-Cache-Control',
          'public, max-age=300, stale-while-revalidate=600'
        );`;


if (!s.includes(oldText)) {
  throw new Error(
    "Existing colleges CDN cache block not found."
  );
}


s =
  s.replace(
    oldText,
    newText
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "College Cloudflare cache headers patched."
);
