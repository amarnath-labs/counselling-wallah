import fs from 'node:fs';

const FILE =
  './src/data/careerQuestions/v7/class8Batch02.js';

const BACKUP =
  './src/data/careerQuestions/v7/class8Batch02.before-duplicate-text-fix.js';


if (!fs.existsSync(FILE)) {
  throw new Error(
    `File not found: ${FILE}`
  );
}


if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(
    FILE,
    BACKUP
  );

  console.log(
    'Backup created:',
    BACKUP
  );
}
else {
  console.log(
    'Backup already exists:',
    BACKUP
  );
}


let source =
  fs.readFileSync(
    FILE,
    'utf8'
  );


const MARKER =
  'const QUESTIONS = [];';


if (
  source.includes(
    'const TEXT_OVERRIDES = Object.freeze({'
  )
) {
  throw new Error(
    'TEXT_OVERRIDES already installed. Patch aborted.'
  );
}


if (
  !source.includes(
    MARKER
  )
) {
  throw new Error(
    'Could not locate QUESTIONS marker.'
  );
}


const OVERRIDE_BLOCK = String.raw`
/*
|--------------------------------------------------------------------------
| Duplicate-text quality overrides
|--------------------------------------------------------------------------
|
| Same trait/family/scenario metadata is preserved.
| Only repetitive question wording is diversified.
|
*/

const TEXT_OVERRIDES = Object.freeze({

  v7_class8_analytical_013:
    'When a sports team performs differently from what was expected, I like working out which factors may have caused the result.',

  v7_class8_analytical_019:
    'If a friend tells me about a problem, I prefer understanding what may have caused it before suggesting what they should do next.',

  v7_class8_analytical_020:
    'In a community activity, I like looking at the facts available before deciding which explanation makes the most sense.',

  v7_class8_analytical_025:
    'When something goes wrong under time pressure, I first try to identify the reason instead of immediately changing everything.',

  v7_class8_analytical_026:
    'When money is limited, I prefer examining the available information carefully before deciding what is actually causing a problem.',

  v7_class8_analytical_031:
    'When I notice an everyday problem, I like separating possible causes and deciding which ones are most likely to matter.',


  v7_class8_quantitative_016:
    'For a school competition with limited resources, I enjoy deciding how much time, money, or material each part should receive.',

  v7_class8_quantitative_020:
    'Before doing an exact calculation for a community activity, I like making a rough numerical prediction of the result.',

  v7_class8_quantitative_022:
    'When fixing a device with limited resources, I like calculating how the available time, materials, or money should be used.',

  v7_class8_quantitative_026:
    'When planning something on a limited budget, I often make a quick numerical estimate before working out the precise amount.',


  v7_class8_verbal_020:
    'For a community activity, I enjoy putting my thoughts into words that other people can understand clearly.',

  v7_class8_verbal_026:
    'When explaining a plan with a limited budget, I like organising my ideas into clear written points.',


  v7_class8_creativity_015:
    'For a classroom presentation, I enjoy choosing original ways to use visuals, stories, examples, or layout.',

  v7_class8_creativity_020:
    'When a common solution is not helping in a community activity, I enjoy inventing another way to approach the situation.',

  v7_class8_creativity_026:
    'A tight budget often makes me think creatively about completely different ways to get the result.',

  v7_class8_creativity_031:
    'When I notice an everyday problem, I enjoy generating several different solutions before deciding which one seems best.',


  v7_class8_technology_020:
    'If a digital tool fails during a community activity, I like checking what might have gone wrong instead of immediately giving up on it.',

  v7_class8_technology_026:
    'When technology causes trouble in a low-budget activity, I enjoy investigating the fault and thinking about a practical fix.',


  v7_class8_hands_on_020:
    'In a community activity, I learn best when I can handle materials, try things directly, or test an idea in practice.',

  v7_class8_hands_on_026:
    'For an activity with limited money, I would rather try a practical test myself than understand everything only through explanation.',


  v7_class8_scientific_curiosity_014:
    'Before trying something in a digital project, I enjoy predicting the result and thinking about what could explain it.',

  v7_class8_scientific_curiosity_020:
    'In a community activity, I like forming an expectation first and then seeing whether what actually happens matches it.',

  v7_class8_scientific_curiosity_026:
    'Even when resources are limited, I enjoy predicting what an idea will produce and thinking about why that result should occur.',


  v7_class8_social_helping_014:
    'During a digital project, I pay attention to how teammates may be feeling when they react differently from me.',

  v7_class8_social_helping_020:
    'When working in the community, I try to see a situation from the perspective of the people who are affected by it.',

  v7_class8_social_helping_026:
    'When a group has very limited resources, I still try to consider how different decisions may affect the people involved.',


  v7_class8_leadership_015:
    'During a classroom presentation, I am comfortable helping the group choose between different ideas when a decision is needed.',

  v7_class8_leadership_020:
    'In a community activity, I would be comfortable making sure people know their roles and that the different tasks stay coordinated.',


  v7_class8_collaboration_014:
    'On a digital project, I enjoy taking strong suggestions from different teammates and shaping them into one better solution.',

  v7_class8_collaboration_015:
    'When teammates give useful comments on my presentation, I am willing to revise my part rather than defend it automatically.',

  v7_class8_collaboration_020:
    'For a community activity, I prefer building a shared solution from several people''s suggestions instead of pushing one person''s idea.',

  v7_class8_collaboration_026:
    'When a team has limited resources, I like bringing different suggestions together so the final plan uses everyone''s best ideas.',


  v7_class8_independence_020:
    'If a community activity requires something I do not know yet, I am comfortable researching and learning the basics on my own first.',

  v7_class8_independence_026:
    'When I need new knowledge for a low-budget activity, I usually try exploring the topic independently before asking someone to guide me.',

  v7_class8_independence_031:
    'When I notice a real-life problem, I am usually comfortable taking the first useful step without needing detailed instructions.',


  v7_class8_structure_020:
    'For a community activity, I prefer arranging the work into ordered stages so everyone knows what should happen next.',

  v7_class8_structure_026:
    'When resources are limited, I like turning the work into a step-by-step plan before starting to spend time or money.',


  v7_class8_adaptability_016:
    'If an unexpected difficulty appears during a school competition, I can rethink what I am doing and continue with a new plan.',

  v7_class8_adaptability_020:
    'When the original way of doing a community activity fails, I am comfortable changing the method instead of repeatedly forcing it.',

  v7_class8_adaptability_026:
    'If an approach is wasting scarce resources, I can switch to another method without becoming too attached to the first plan.',

  v7_class8_adaptability_031:
    'If circumstances around an everyday problem suddenly change, I can revise my plan and keep moving toward a solution.',


  v7_class8_achievement_020:
    'Completing something useful for my community makes me feel proud that I followed the work through to the end.',


  v7_class8_stability_020:
    'I find it easier to contribute consistently to a community activity when there is a dependable schedule or routine.',


  v7_class8_entrepreneurship_014:
    'With a digital project, I enjoy thinking about what useful benefit it could provide to someone who actually uses it.',

  v7_class8_entrepreneurship_015:
    'If I see a good opportunity in a classroom presentation, I prefer acting on the idea and trying it rather than only discussing it.',

  v7_class8_entrepreneurship_016:
    'For a school competition, I find it interesting to think about what participants or visitors would genuinely find useful.',

  v7_class8_entrepreneurship_017:
    'When I have an idea about an unfamiliar topic, I would rather try a simple early version before investing a lot of effort in it.',

  v7_class8_entrepreneurship_020:
    'During a community activity, I enjoy looking for ways the work could solve a real need or provide practical value to people.',

  v7_class8_entrepreneurship_023:
    'If an experiment produces a surprising result, I would enjoy trying a small follow-up idea before deciding whether it deserves more work.',

  v7_class8_entrepreneurship_026:
    'When money is limited, I enjoy thinking about how an idea could still provide enough useful value to make the effort worthwhile.',

  v7_class8_entrepreneurship_031:
    'Everyday frustrations sometimes make me notice opportunities for a product, service, or solution that could help people.',

});


function getQuestionText({
  trait,
  sequence,
  fallback,
}) {
  const number =
    String(
      sequence
    ).padStart(
      3,
      '0'
    );


  const id =
    'v7_class8_' +
    trait +
    '_' +
    number;


  return (
    TEXT_OVERRIDES[id] ||
    fallback
  );
}


`;


source =
  source.replace(
    MARKER,
    OVERRIDE_BLOCK +
      '\n' +
      MARKER
  );


const OLD_TEXT_BLOCK = `        text:
          rule.texts[
            variant
          ](
            context.label
          ),`;


const NEW_TEXT_BLOCK = `        text:
          getQuestionText({
            trait,

            sequence:
              index + 7,

            fallback:
              rule.texts[
                variant
              ](
                context.label
              ),
          }),`;


if (
  !source.includes(
    OLD_TEXT_BLOCK
  )
) {
  throw new Error(
    'Could not locate original text-generation block.'
  );
}


source =
  source.replace(
    OLD_TEXT_BLOCK,
    NEW_TEXT_BLOCK
  );


fs.writeFileSync(
  FILE,
  source,
  'utf8'
);


console.log(
  '\nDuplicate-text patch installed successfully.'
);

console.log(
  'Modified:',
  FILE
);
