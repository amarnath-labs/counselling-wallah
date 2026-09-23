const fs =
  require("fs");

const file =
  "./frontend/src/components/DecisionIntelligencePanel.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| Add admission + location alternative variables
|--------------------------------------------------------------------------
*/

const branchMarker =
  "const branchAlternative =";


const branchIndex =
  text.indexOf(
    branchMarker
  );


if (
  branchIndex === -1
) {
  throw new Error(
    "branchAlternative not found"
  );
}


if (
  !text.includes(
    "const admissionAlternative ="
  )
) {
  const insert =
`const admissionAlternative =
    useMemo(
      () =>
        findBetterAlternativeV1(
          row,
          rows,
          'admission'
        ),
      [
        row,
        rows,
      ]
    );


  const locationAlternative =
    useMemo(
      () =>
        findBetterAlternativeV1(
          row,
          rows,
          'location'
        ),
      [
        row,
        rows,
      ]
    );


  `;


  text =
    text.slice(
      0,
      branchIndex
    ) +
    insert +
    text.slice(
      branchIndex
    );
}


/*
|--------------------------------------------------------------------------
| Add cards before Better for branch
|--------------------------------------------------------------------------
*/

const cardMarker =
`<AlternativeCard
            title="Better for branch"`;


const cardIndex =
  text.indexOf(
    cardMarker
  );


if (
  cardIndex === -1
) {
  throw new Error(
    "Better for branch card not found"
  );
}


if (
  !text.includes(
    'title="Better admission fit"'
  )
) {
  const cards =
`<AlternativeCard
            title="Better admission fit"
            row={
              admissionAlternative
            }
            reason="This option has a stronger verified admission-fit score."
          />

          `;


  text =
    text.slice(
      0,
      cardIndex
    ) +
    cards +
    text.slice(
      cardIndex
    );
}


/*
|--------------------------------------------------------------------------
| Location card after budget card block
|--------------------------------------------------------------------------
*/

const budgetReason =
  `reason="Ranks higher when affordability gets more importance."`;


const budgetReasonIndex =
  text.indexOf(
    budgetReason
  );


if (
  budgetReasonIndex === -1
) {
  throw new Error(
    "Budget alternative reason not found"
  );
}


const budgetCardEnd =
  text.indexOf(
    "/>",
    budgetReasonIndex
  );


if (
  budgetCardEnd === -1
) {
  throw new Error(
    "Budget AlternativeCard end not found"
  );
}


if (
  !text.includes(
    'title="Better for location"'
  )
) {
  const insertAt =
    budgetCardEnd +
    2;


  const locationCard =
`

          <AlternativeCard
            title="Better for location"
            row={
              locationAlternative
            }
            reason="This option has a stronger verified location-fit score."
          />`;


  text =
    text.slice(
      0,
      insertAt
    ) +
    locationCard +
    text.slice(
      insertAt
    );
}


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: admission/location alternatives added"
);
