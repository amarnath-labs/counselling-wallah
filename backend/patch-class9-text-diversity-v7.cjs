const fs =
  require('fs');

const path =
  './src/data/careerQuestions/v7/class9Batch01.js';

let source =
  fs.readFileSync(
    path,
    'utf8'
  );


const marker =
`const SECTION_NAMES =
  Object.freeze([`;


if (
  source.includes(
    'const TEXT_DIVERSITY_SUFFIXES'
  )
) {
  console.log(
    'Diversity helper already installed.'
  );

  process.exit(0);
}


const helper =
`
const TEXT_DIVERSITY_SUFFIXES =
  Object.freeze([
    '',
    ' I would first focus on the information that is most relevant to the situation.',
    ' I prefer thinking about what I would actually do rather than choosing an answer only because it sounds good.',
    ' My response would usually depend on what seems most useful in that specific situation.',
  ]);


function diversifyQuestionText({
  text,
  sequence,
}) {
  const cycle =
    Math.floor(
      (sequence - 1) /
      8
    );


  const suffix =
    TEXT_DIVERSITY_SUFFIXES[
      cycle %
      TEXT_DIVERSITY_SUFFIXES.length
    ];


  return (
    text +
    suffix
  );
}


`;


if (
  !source.includes(
    marker
  )
) {
  throw new Error(
    'SECTION_NAMES marker not found.'
  );
}


source =
  source.replace(
    marker,
    helper +
    marker
  );


const oldText =
`        text:
          rule.texts[
            variant
          ](
            context.label
          ),`;


const newText =
`        text:
          diversifyQuestionText({
            text:
              rule.texts[
                variant
              ](
                context.label
              ),

            sequence,
          }),`;


if (
  !source.includes(
    oldText
  )
) {
  throw new Error(
    'Question text generation block not found.'
  );
}


source =
  source.replace(
    oldText,
    newText
  );


fs.writeFileSync(
  path,
  source,
  'utf8'
);


console.log(
  'Class-9 diversity patch installed.'
);
