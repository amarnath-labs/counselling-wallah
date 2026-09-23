const fs = require("fs");

const file =
  "./frontend/src/services/apiClient.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


text =
  text.replace(
    /const\s+localApiUrl\s*=\s*['"`][^'"`]+['"`]\s*;/,
    `const localApiUrl =
  'http://localhost:4000/api';`
  );


text =
  text.replace(
    /const\s+productionApiUrl\s*=\s*['"`][^'"`]+['"`]\s*;/,
    `const productionApiUrl =
  '/api';`
  );


const configuredPattern =
  /const\s+configuredApiUrl\s*=\s*[\s\S]*?;\s*\n\s*\n/;


if (
  configuredPattern.test(
    text
  )
) {
  text =
    text.replace(
      configuredPattern,
`const configuredApiUrl =
  import.meta.env.DEV
    ? (
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        ''
      )
    : '';


`
    );
}


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: API base contract normalized"
);
