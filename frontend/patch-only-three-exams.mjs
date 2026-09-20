import fs from "node:fs";

const file =
  "./src/pages/Exams.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    "src/pages/Exams.jsx not found."
  );
}

let source =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| Remove previous enabledExams import
|--------------------------------------------------------------------------
|
| Current page ki apni exact 3-exam catalog use karenge.
|
*/

source =
  source.replace(
    /\n?import\s*\{\s*filterEnabledExams,\s*\}\s*from\s*["']\.\.\/config\/enabledExams\.js["'];?\s*/g,
    "\n"
  );


/*
|--------------------------------------------------------------------------
| Replace COUNSELLING_CARDS
|--------------------------------------------------------------------------
|
| OLD:
| JoSAA + CSAB
|
| NEW:
| JEE Main + JEE Advanced + UPTAC
|
|--------------------------------------------------------------------------
*/

const cardsRegex =
  /const\s+COUNSELLING_CARDS\s*=\s*\[[\s\S]*?\];/;

if (!cardsRegex.test(source)) {
  throw new Error(
    "COUNSELLING_CARDS block not found. Nothing changed."
  );
}

source =
  source.replace(
    cardsRegex,
`const ENABLED_EXAM_CARDS = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    desc:
      'Explore NITs, IIITs and GFTIs using your JEE Main rank and admission profile.',
    active: true,
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    desc:
      'Explore IIT admission options using your JEE Advanced rank and profile.',
    active: true,
  },
  {
    id: 'uptac',
    name: 'UPTAC',
    desc:
      'Explore Uttar Pradesh engineering college options through UPTAC counselling.',
    active: true,
  },
];`
  );


/*
|--------------------------------------------------------------------------
| Replace DISPLAY CATALOG useMemo block
|--------------------------------------------------------------------------
|
| Important:
| Backend catalog ko delete/change nahi kar rahe.
| Is page par sirf above 3 cards render honge.
|
|--------------------------------------------------------------------------
*/

const startMarker =
  "  const exams =";

const endMarker =
  "\n\n  /*\n  |--------------------------------------------------------------------------\n  | NORMAL EXAM SELECTION";

const startIndex =
  source.indexOf(
    startMarker
  );

const endIndex =
  source.indexOf(
    endMarker,
    startIndex
  );

if (
  startIndex === -1 ||
  endIndex === -1
) {
  throw new Error(
    "Exams useMemo block boundaries not found. Nothing changed."
  );
}

const replacement =
`  const exams =
    useMemo(() => {
      const search =
        String(q || '')
          .trim()
          .toLowerCase();

      const list =
        ENABLED_EXAM_CARDS;

      if (!search) {
        return list;
      }

      return list.filter(
        (exam) =>
          String(
            exam?.name || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            exam?.desc || ''
          )
            .toLowerCase()
            .includes(search)
      );
    }, [
      q,
    ]);`;

source =
  source.slice(
    0,
    startIndex
  ) +
  replacement +
  source.slice(
    endIndex
  );


/*
|--------------------------------------------------------------------------
| Remove JoSAA / CSAB counselling-first interception
|--------------------------------------------------------------------------
|
| JEE Main, JEE Advanced, UPTAC direct normal exam selection use karenge.
|
|--------------------------------------------------------------------------
*/

const counsellingFirstRegex =
  /\n\s*\/\*[\s\S]*?\|\s*COUNSELLING FIRST[\s\S]*?\*\/\s*\n\s*if\s*\(\s*examId\s*===\s*['"]josaa['"]\s*\|\|\s*examId\s*===\s*['"]csab['"]\s*\)\s*\{[\s\S]*?return;\s*\}/;

if (
  counsellingFirstRegex.test(
    source
  )
) {
  source =
    source.replace(
      counsellingFirstRegex,
      ""
    );
}


/*
|--------------------------------------------------------------------------
| Safety guard
|--------------------------------------------------------------------------
|
| Kisi bhi unexpected card se selection call aaye to block.
|
|--------------------------------------------------------------------------
*/

const guardAnchor =
`      if (!examId) {
        console.error(
          '[EXAMS] Could not determine exam ID:',
          exam
        );
        return;
      }`;

if (
  source.includes(
    guardAnchor
  ) &&
  !source.includes(
    "TRUMARG ONLY THREE EXAMS"
  )
) {
  source =
    source.replace(
      guardAnchor,
`${guardAnchor}

      /*
      |--------------------------------------------------------------------------
      | TRUMARG ONLY THREE EXAMS
      |--------------------------------------------------------------------------
      */

      const enabledExamIds =
        new Set([
          'jee-main',
          'jee-advanced',
          'uptac',
        ]);

      if (
        !enabledExamIds.has(
          examId
        )
      ) {
        console.warn(
          '[EXAMS] Disabled exam blocked:',
          examId
        );

        return;
      }`
    );
}


/*
|--------------------------------------------------------------------------
| Write
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);

console.log(
  "TRUMARG ONLY-3-EXAMS PATCH COMPLETE"
);

console.log(
  "========================================"
);

console.log("");
console.log(
  "ENABLED: JEE Main"
);
console.log(
  "ENABLED: JEE Advanced"
);
console.log(
  "ENABLED: UPTAC"
);
console.log(
  "DISABLED: everything else"
);
console.log("");
