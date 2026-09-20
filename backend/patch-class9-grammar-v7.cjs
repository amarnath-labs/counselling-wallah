const fs =
  require('fs');


const path =
  './src/data/careerQuestions/v7/class9Batch01.js';


let source =
  fs.readFileSync(
    path,
    'utf8'
  );


const replacements = [

  /*
  |--------------------------------------------------------------------------
  | Fix awkward project-improvement context
  |--------------------------------------------------------------------------
  */

  [
    "label: 'improving an existing project',",
    "label: 'a project-improvement activity',",
  ],


  /*
  |--------------------------------------------------------------------------
  | Fix structure grammar
  |
  | OLD examples:
  | During a long a creative project...
  | During a long an activity with limited money...
  |--------------------------------------------------------------------------
  */

  [
    "`During a long ${context}, I like checking how much progress has been completed and what still remains.`",
    "`While working through ${context}, I like checking how much progress has been completed and what still remains.`",
  ],


  /*
  |--------------------------------------------------------------------------
  | Fix adaptability grammar
  |
  | OLD:
  | my current way of learning improving an existing project...
  |--------------------------------------------------------------------------
  */

  [
    "`If I realise my current way of learning ${context} is ineffective, I can change how I study or practise it.`",
    "`If I realise my current way of approaching ${context} is ineffective, I can change how I study or practise it.`",
  ],

];


for (
  const [
    oldText,
    newText,
  ] of replacements
) {

  if (
    !source.includes(
      oldText
    )
  ) {
    throw new Error(
      'Expected source text not found:\n' +
      oldText
    );
  }


  source =
    source.replace(
      oldText,
      newText
    );
}


fs.writeFileSync(
  path,
  source,
  'utf8'
);


console.log(
  'Class-9 grammar fixes installed successfully.'
);
