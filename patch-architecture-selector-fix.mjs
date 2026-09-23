import fs from "node:fs";

const file =
  "./frontend/src/pages/Profile.jsx";

const backup =
  "./frontend/src/pages/Profile.before-architecture-selector-fix.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    `File not found: ${file}`
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| 1. ADD ARCHITECTURE TO BRANCHES
|--------------------------------------------------------------------------
*/

const branchBlockRegex =
  /const\s+BRANCHES\s*=\s*\[[\s\S]*?\];/m;

const match =
  s.match(
    branchBlockRegex
  );

if (!match) {
  throw new Error(
    "BRANCHES block not found."
  );
}

if (
  !/['"]Architecture['"]/.test(
    match[0]
  )
) {
  const updated =
    match[0].replace(
      /\];$/,
`  'Architecture',
];`
    );

  s =
    s.replace(
      match[0],
      updated
    );
}


/*
|--------------------------------------------------------------------------
| 2. ADD PROGRAM TYPE HELPERS
|--------------------------------------------------------------------------
*/

const pRegex =
  /const\s+p\s*=\s*profile\s*\|\|\s*\{\s*\}\s*;/m;

const pMatch =
  s.match(
    pRegex
  );

if (!pMatch) {
  throw new Error(
    "const p = profile || {} not found."
  );
}

if (
  !s.includes(
    "const selectedProgramType ="
  )
) {
  const logic =
`

  const isArchitectureBranch = (
    branch
  ) =>
    /architecture|b\\.arch/i.test(
      String(
        branch || ''
      )
    );


  const selectedProgramType =
    p?.programType ||
    (
      Array.isArray(
        p?.branches
      ) &&
      p.branches.some(
        isArchitectureBranch
      )
        ? 'architecture'
        : 'engineering'
    );


  const visibleBranches =
    selectedProgramType ===
    'architecture'
      ? BRANCHES.filter(
          isArchitectureBranch
        )
      : BRANCHES.filter(
          (branch) =>
            !isArchitectureBranch(
              branch
            )
        );


  const selectProgramType = (
    type
  ) => {
    if (
      type === 'architecture'
    ) {
      setProfile({
        ...p,
        programType:
          'architecture',
        branches: [
          'Architecture',
        ],
      });

      return;
    }

    const engineering =
      Array.isArray(
        p?.branches
      )
        ? p.branches.filter(
            (branch) =>
              !isArchitectureBranch(
                branch
              )
          )
        : [];

    setProfile({
      ...p,
      programType:
        'engineering',
      branches:
        engineering.length
          ? engineering
          : ['CSE'],
    });
  };
`;

  s =
    s.replace(
      pMatch[0],
      pMatch[0] +
      logic
    );
}


/*
|--------------------------------------------------------------------------
| 3. REPLACE BRANCH MAP
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /\{BRANCHES\.map\(/,
    "{visibleBranches.map("
  );


/*
|--------------------------------------------------------------------------
| 4. INSERT ENGINEERING / ARCHITECTURE SELECTOR
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "Program Type"
  )
) {
  const labelRegex =
    /<label>\s*Preferred Branches\s*<\/label>/m;

  const labelMatch =
    s.match(
      labelRegex
    );

  if (!labelMatch) {
    throw new Error(
      "Preferred Branches label not found."
    );
  }

  const selector =
`<div className="field">
            <label>
              Program Type
            </label>

            <div className="chip-select">
              <button
                type="button"
                className={
                  \`chip \${
                    selectedProgramType ===
                    'engineering'
                      ? 'on'
                      : ''
                  }\`
                }
                onClick={() =>
                  selectProgramType(
                    'engineering'
                  )
                }
              >
                Engineering
              </button>

              <button
                type="button"
                className={
                  \`chip \${
                    selectedProgramType ===
                    'architecture'
                      ? 'on'
                      : ''
                  }\`
                }
                onClick={() =>
                  selectProgramType(
                    'architecture'
                  )
                }
              >
                Architecture
              </button>
            </div>
          </div>

          `;

  s =
    s.replace(
      labelMatch[0],
      selector +
      labelMatch[0]
    );
}


/*
|--------------------------------------------------------------------------
| 5. DYNAMIC LABEL
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /<label>\s*Preferred Branches\s*<\/label>/m,
`<label>
              {
                selectedProgramType ===
                'architecture'
                  ? 'Preferred Architecture Program'
                  : 'Preferred Engineering Branches'
              }
            </label>`
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "=============================================="
);
console.log(
  "ARCHITECTURE SELECTOR FIX APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Engineering -> engineering branches"
);
console.log(
  "Architecture -> Architecture"
);
console.log(
  "Backup:",
  backup
);
