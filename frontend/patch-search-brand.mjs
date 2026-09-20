import fs from "node:fs";

const file =
  "./index.html";

let html =
  fs.readFileSync(
    file,
    "utf8"
  );

const marker =
  "<!-- TRUMARG SEARCH BRAND -->";

if (
  html.includes(
    marker
  )
) {
  console.log(
    "Search brand tags already installed."
  );

  process.exit(0);
}

const headEnd =
  html.indexOf(
    "</head>"
  );

if (
  headEnd === -1
) {
  throw new Error(
    "</head> not found."
  );
}

const block =
`
  ${marker}

  <link
    rel="icon"
    type="image/png"
    sizes="48x48"
    href="/favicon-48x48.png"
  />

  <link
    rel="icon"
    type="image/png"
    sizes="96x96"
    href="/favicon-96x96.png"
  />

  <link
    rel="icon"
    type="image/png"
    sizes="192x192"
    href="/favicon-192x192.png"
  />

  <meta
    name="application-name"
    content="TruMarg"
  />

  <meta
    name="apple-mobile-web-app-title"
    content="TruMarg"
  />

`;

html =
  html.slice(
    0,
    headEnd
  ) +
  block +
  html.slice(
    headEnd
  );

fs.writeFileSync(
  file,
  html,
  "utf8"
);

console.log(
  "Search favicon metadata added."
);
