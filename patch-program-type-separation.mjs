import fs from "node:fs";

const file =
  "./frontend/src/pages/Profile.jsx";

const backup =
  "./frontend/src/pages/Profile.before-program-type-separation.jsx";

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
| 1. ENSURE ARCHITECTURE EXISTS AS A PROFILE OPTION
|--------------------------------------------------------------------------
*/

const branchesMatch =
  s.match(
    /const\s+BRANCHES\s*=\s*\[([\s\S]*?)\];/m
  );

if (!branchesMatch) {
  throw new Error(
    "BRANCHES constant not found."
  );
}

if (
  !branchesMatch[1]
    .toLowerCase()
    .includes(
      "'architecture'"
    ) &&
  !branchesMatch[1]
    .toLowerCase()
    .includes(
      '"architecture"'
    )
) {
  const updatedBranches =
    branchesMatch[0].replace(
      /\];$/,
`  'Architecture',
];`
    );

  s =
    s.replace(
      branchesMatch[0],
      updatedBranches
    );
}


/*
|--------------------------------------------------------------------------
| 2. ADD PROGRAM TYPE LOGIC
|--------------------------------------------------------------------------
*/

const profileMarker =
`  const p =
    profile || {};`;

if (
  !s.includes(
    profileMarker
  )
) {
  throw new Error(
    "Profile p marker not found."
  );
}

if (
  !s.includes(
    "const selectedProgramType ="
  )
) {
  const logic =
`

  /*
  |--------------------------------------------------------------------------
  | PROGRAM TYPE
  |--------------------------------------------------------------------------
  |
  | Engineering and Architecture are intentionally separate.
  |--------------------------------------------------------------------------
  */

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
    programType
  ) => {
    if (
      programType ===
      'architecture'
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


    const engineeringBranches =
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
        engineeringBranches.length
          ? engineeringBranches
          : [
              'CSE',
              'IT',
            ],
    });
  };
`;

  s =
    s.replace(
      profileMarker,
      profileMarker +
      logic
    );
}


/*
|--------------------------------------------------------------------------
| 3. ADD PROGRAM SELECTION ABOVE PREFERRED BRANCHES
|--------------------------------------------------------------------------
*/

const preferredField =
`          <div className="field">

            <label>
              Preferred Branches
            </label>`;

if (
  !s.includes(
    preferredField
  )
) {
  throw new Error(
    "Preferred Branches field not found."
  );
}


if (
  !s.includes(
    "Engineering / Architecture"
  )
) {
  const programSelector =
`          <div className="field">

            <label>
              Engineering / Architecture
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
      preferredField,
      programSelector +
      preferredField
    );
}


/*
|--------------------------------------------------------------------------
| 4. SHOW ONLY RELEVANT BRANCHES
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "{visibleBranches.map("
  )
) {
  const oldMap =
    /\{BRANCHES\.map\(/;

  if (
    !oldMap.test(
      s
    )
  ) {
    throw new Error(
      "BRANCHES.map not found."
    );
  }

  s =
    s.replace(
      oldMap,
      "{visibleBranches.map("
    );
}


/*
|--------------------------------------------------------------------------
| 5. CHANGE LABEL BASED ON PROGRAM
|--------------------------------------------------------------------------
*/

s =
  s.replace(
`            <label>
              Preferred Branches
            </label>`,
`            <label>
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
  "ENGINEERING / ARCHITECTURE SEPARATED"
);
console.log(
  "=============================================="
);
console.log(
  "Engineering -> engineering branches only"
);
console.log(
  "Architecture -> Architecture only"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Recommendation ranking: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
