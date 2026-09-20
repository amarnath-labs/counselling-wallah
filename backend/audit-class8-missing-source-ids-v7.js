import fs from 'node:fs';
import path from 'node:path';

import bank from
  './src/data/careerQuestions/v7/index.js';


const CLASS_KEY =
  'class-8';

const THRESHOLD =
  0.72;


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


function collectFiles(dir) {
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
        ...collectFiles(
          fullPath
        )
      );

      continue;
    }

    if (
      entry.isFile()
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


const searchRoots =
  [
    path.resolve(
      './src/data/careerQuestions/v7'
    ),

    path.resolve(
      './src/data/careerQuestions'
    ),
  ];


const allFiles =
  new Set();


for (
  const root of searchRoots
) {
  if (
    fs.existsSync(
      root
    )
  ) {
    for (
      const file of
      collectFiles(root)
    ) {
      allFiles.add(
        file
      );
    }
  }
}


const locations =
  new Map();


for (
  const id of affectedIds
) {
  locations.set(
    id,
    []
  );
}


for (
  const filePath of allFiles
) {
  let content;

  try {
    content =
      fs.readFileSync(
        filePath,
        'utf8'
      );
  }
  catch {
    continue;
  }


  for (
    const id of affectedIds
  ) {
    if (
      content.includes(
        id
      )
    ) {
      locations
        .get(id)
        .push(
          path.relative(
            process.cwd(),
            filePath
          )
        );
    }
  }
}


const missing =
  [];


console.log(
  '\n========================================'
);

console.log(
  'CLASS-8 MISSING SOURCE AUDIT'
);

console.log(
  '========================================'
);


for (
  const question of questions
) {
  if (
    !affectedIds.has(
      question.id
    )
  ) {
    continue;
  }

  const files =
    locations.get(
      question.id
    ) || [];


  if (
    files.length ===
    0
  ) {
    missing.push(
      question
    );
  }
}


console.log(
  'Affected IDs:',
  affectedIds.size
);

console.log(
  'Located IDs:',
  affectedIds.size -
    missing.length
);

console.log(
  'Missing IDs:',
  missing.length
);


console.log(
  '\nMISSING QUESTION DETAILS\n'
);


for (
  const question of missing
) {
  console.log(
    '----------------------------------------'
  );

  console.log(
    'ID:',
    question.id
  );

  console.log(
    'Trait:',
    question.trait
  );

  console.log(
    'Family:',
    question.scenarioFamily
  );

  console.log(
    'Scenario:',
    question.scenario
  );

  console.log(
    'Text:',
    question.text
  );

  console.log(
    'Tags:',
    question.tags
  );
}


console.log(
  '\n========================================'
);


if (
  missing.length ===
  0
) {
  console.log(
    'MISSING SOURCE AUDIT: PASS'
  );
}
else {
  console.log(
    'MISSING SOURCE AUDIT: REVIEW REQUIRED'
  );
}


console.log(
  '========================================\n'
);
