import fs from 'node:fs';
import path from 'node:path';

import bank from
  './src/data/careerQuestions/v7/index.js';


const CLASS_KEY =
  'class-8';

const THRESHOLD =
  0.72;

const ROOT =
  path.resolve(
    './src/data/careerQuestions/v7'
  );


function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


const STOP_WORDS =
  new Set([
    'i',
    'a',
    'an',
    'the',
    'to',
    'of',
    'for',
    'in',
    'on',
    'with',
    'and',
    'or',
    'is',
    'are',
    'be',
    'when',
    'while',
    'if',
    'it',
    'my',
    'me',
    'that',
    'this',
  ]);


function tokenSet(text) {
  return new Set(
    normalize(text)
      .split(' ')
      .filter(
        token =>
          token.length > 1 &&
          !STOP_WORDS.has(token)
      )
  );
}


function similarity(a, b) {
  if (
    !a.size ||
    !b.size
  ) {
    return 0;
  }


  let common =
    0;


  for (
    const token of a
  ) {
    if (
      b.has(token)
    ) {
      common +=
        1;
    }
  }


  return (
    common /
    (
      a.size +
      b.size -
      common
    )
  );
}


function collectJsFiles(dir) {
  const result =
    [];


  for (
    const entry of
    fs.readdirSync(
      dir,
      {
        withFileTypes:
          true,
      }
    )
  ) {
    const fullPath =
      path.join(
        dir,
        entry.name
      );


    if (
      entry.isDirectory()
    ) {
      result.push(
        ...collectJsFiles(
          fullPath
        )
      );

      continue;
    }


    if (
      entry.isFile() &&
      entry.name.endsWith(
        '.js'
      )
    ) {
      result.push(
        fullPath
      );
    }
  }


  return result;
}


const questions =
  bank.filter(
    question =>
      question.classes?.includes(
        CLASS_KEY
      ) ||
      question.stage ===
        CLASS_KEY
  );


const affectedIds =
  new Set();


for (
  let i = 0;
  i < questions.length;
  i += 1
) {
  for (
    let j = i + 1;
    j < questions.length;
    j += 1
  ) {
    const left =
      questions[i];

    const right =
      questions[j];


    if (
      left.trait !==
      right.trait
    ) {
      continue;
    }


    const score =
      similarity(
        tokenSet(left.text),
        tokenSet(right.text)
      );


    if (
      score >=
      THRESHOLD
    ) {
      affectedIds.add(
        left.id
      );

      affectedIds.add(
        right.id
      );
    }
  }
}


const files =
  collectJsFiles(
    ROOT
  );


const locations =
  [];


for (
  const filePath of files
) {
  const content =
    fs.readFileSync(
      filePath,
      'utf8'
    );


  const relativePath =
    path.relative(
      process.cwd(),
      filePath
    );


  for (
    const id of affectedIds
  ) {
    if (
      content.includes(
        id
      )
    ) {
      locations.push({
        id,
        file:
          relativePath,
      });
    }
  }
}


const grouped =
  new Map();


for (
  const item of locations
) {
  if (
    !grouped.has(
      item.file
    )
  ) {
    grouped.set(
      item.file,
      []
    );
  }


  grouped
    .get(
      item.file
    )
    .push(
      item.id
    );
}


console.log(
  '\n========================================'
);

console.log(
  'CLASS-8 DUPLICATE SOURCE LOCATOR'
);

console.log(
  '========================================'
);

console.log(
  'Questions:',
  questions.length
);

console.log(
  'Affected IDs:',
  affectedIds.size
);

console.log(
  'Source files:',
  grouped.size
);


console.log(
  '\nFILES\n'
);


const sortedGroups =
  [...grouped.entries()]
    .sort(
      (a, b) =>
        a[0]
          .localeCompare(
            b[0]
          )
    );


for (
  const [
    file,
    ids,
  ] of sortedGroups
) {
  console.log(
    '----------------------------------------'
  );

  console.log(
    'FILE:',
    file
  );

  console.log(
    'AFFECTED:',
    ids.length
  );


  for (
    const id of ids.sort()
  ) {
    console.log(
      '  ',
      id
    );
  }
}


const locatedIds =
  new Set(
    locations.map(
      item =>
        item.id
    )
  );


const missing =
  [...affectedIds]
    .filter(
      id =>
        !locatedIds.has(
          id
        )
    )
    .sort();


console.log(
  '\n========================================'
);

console.log(
  'SUMMARY'
);

console.log(
  '========================================'
);

console.log(
  'Affected IDs:',
  affectedIds.size
);

console.log(
  'Located IDs:',
  locatedIds.size
);

console.log(
  'Missing IDs:',
  missing.length
);


if (
  missing.length
) {
  console.log(
    '\nMISSING:\n'
  );

  for (
    const id of missing
  ) {
    console.log(
      id
    );
  }
}


if (
  locatedIds.size ===
    affectedIds.size &&
  missing.length ===
    0
) {
  console.log(
    '\nSOURCE LOCATOR: PASS'
  );
}
else {
  console.log(
    '\nSOURCE LOCATOR: FAIL'
  );

  process.exitCode =
    1;
}


console.log(
  '\n========================================\n'
);
