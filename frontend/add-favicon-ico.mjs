import fs from "node:fs";

const file =
  "./index.html";

let html =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  !html.includes(
    'href="/favicon.ico"'
  )
) {
  html =
    html.replace(
      '<!-- TRUMARG GOOGLE SEARCH SEO START -->',
      `<!-- TRUMARG GOOGLE SEARCH SEO START -->

  <link
    rel="icon"
    href="/favicon.ico"
    sizes="any"
  />`
    );

  fs.writeFileSync(
    file,
    html,
    "utf8"
  );

  console.log(
    "favicon.ico declaration added"
  );
} else {
  console.log(
    "favicon.ico already present"
  );
}
