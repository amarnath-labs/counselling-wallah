import fs from 'fs';

const file =
  './backend/src/server.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


const importLine =
  "import neetRecommendationsRouter from './routes/neetRecommendations.js';";


if (
  !src.includes(
    importLine
  )
) {

  const cwImportRegex =
    /import[\s\S]*?cwRecV1DevRouter[\s\S]*?from\s+['"][^'"]+['"];\s*/;


  const match =
    src.match(
      cwImportRegex
    );


  if (
    match
  ) {

    src =
      src.replace(
        cwImportRegex,
        match[0] +
        '\n' +
        importLine +
        '\n'
      );

  } else {

    const appAnchor =
      src.search(
        /\bconst\s+app\s*=/
      );


    if (
      appAnchor ===
      -1
    ) {
      throw new Error(
        'Could not locate server import insertion point.'
      );
    }


    src =
      src.slice(
        0,
        appAnchor
      ) +
      importLine +
      '\n\n' +
      src.slice(
        appAnchor
      );
  }
}


const mountBlock =
`app.use(
  '/api/neet',
  neetRecommendationsRouter
);`;


if (
  !src.includes(
    mountBlock
  )
) {

  const cwMountRegex =
    /app\.use\([\s\S]{0,250}?cwRecV1DevRouter[\s\S]{0,100}?\);/;


  const mountMatch =
    src.match(
      cwMountRegex
    );


  if (
    !mountMatch
  ) {
    throw new Error(
      'Could not locate CW-REC router mount in server.js.'
    );
  }


  src =
    src.replace(
      cwMountRegex,
      mountMatch[0] +
      '\n\n' +
      mountBlock
    );
}


fs.writeFileSync(
  file,
  src,
  'utf8'
);

console.log(
  'server.js NEET route patch complete.'
);
