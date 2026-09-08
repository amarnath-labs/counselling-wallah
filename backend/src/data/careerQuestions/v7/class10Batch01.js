import {
  buildAdaptiveQuestion,
} from './builders/adaptiveQuestionBuilder.js';


const CLASS_KEY =
  'class-10';


const TRAITS =
  Object.freeze([
    'analytical',
    'quantitative',
    'verbal',
    'creativity',
    'technology',
    'hands_on',
    'scientific_curiosity',
    'social_helping',
    'leadership',
    'collaboration',
    'independence',
    'structure',
    'adaptability',
    'achievement',
    'stability',
    'entrepreneurship',
  ]);


const COUNTS =
  Object.freeze({
    analytical: 32,
    quantitative: 32,
    verbal: 31,
    creativity: 31,
    technology: 31,
    hands_on: 31,
    scientific_curiosity: 32,
    social_helping: 31,
    leadership: 31,
    collaboration: 31,
    independence: 31,
    structure: 31,
    adaptability: 31,
    achievement: 31,
    stability: 31,
    entrepreneurship: 32,
  });


/*
|--------------------------------------------------------------------------
| CLASS-10 CONTEXTS
|--------------------------------------------------------------------------
|
| Class 10 is a transition stage.
| Contexts therefore include:
|
| - school academics
| - stream exploration
| - subject preference
| - practical application
| - career exploration
| - decision making
|
*/

const CONTEXTS =
  Object.freeze([

    {
      slug:
        'physics-concept',

      label:
        'understanding a physics concept',

      subjects: [
        'physics',
        'science',
      ],

      interests: [
        'science',
        'engineering',
      ],

      streams: [
        'pcm',
        'science',
      ],
    },


    {
      slug:
        'mathematics-problem',

      label:
        'solving a challenging mathematics problem',

      subjects: [
        'mathematics',
      ],

      interests: [
        'science',
        'engineering',
        'finance',
      ],

      streams: [
        'pcm',
        'commerce-with-maths',
      ],
    },


    {
      slug:
        'biology-investigation',

      label:
        'investigating a biology-related question',

      subjects: [
        'biology',
        'science',
      ],

      interests: [
        'science',
        'healthcare-medical',
      ],

      streams: [
        'pcb',
        'pcmb',
      ],
    },


    {
      slug:
        'chemistry-experiment',

      label:
        'working through a chemistry experiment',

      subjects: [
        'chemistry',
        'science',
      ],

      interests: [
        'science',
        'healthcare-medical',
        'engineering',
      ],

      streams: [
        'pcm',
        'pcb',
        'pcmb',
      ],
    },


    {
      slug:
        'computer-project',

      label:
        'developing a computer-based school project',

      subjects: [
        'computer-science',
      ],

      interests: [
        'computer-technology',
        'engineering',
      ],

      streams: [
        'pcm',
        'science',
      ],
    },


    {
      slug:
        'business-case',

      label:
        'examining a simple business situation',

      subjects: [
        'commerce',
        'business-studies',
      ],

      interests: [
        'commerce',
        'business-management',
        'entrepreneurship',
      ],

      streams: [
        'commerce',
        'commerce-with-maths',
        'commerce-without-maths',
      ],
    },


    {
      slug:
        'financial-planning',

      label:
        'planning how a limited amount of money should be used',

      subjects: [
        'mathematics',
        'commerce',
      ],

      interests: [
        'finance',
        'commerce',
      ],

      streams: [
        'commerce',
        'commerce-with-maths',
      ],
    },


    {
      slug:
        'social-issue',

      label:
        'studying a social issue affecting different groups of people',

      subjects: [
        'social-science',
      ],

      interests: [
        'humanities-social-sciences',
        'law-governance',
      ],

      streams: [
        'humanities',
        'arts',
      ],
    },


    {
      slug:
        'history-evidence',

      label:
        'examining different sources about a historical event',

      subjects: [
        'history',
        'social-science',
      ],

      interests: [
        'humanities-social-sciences',
        'law-governance',
      ],

      streams: [
        'humanities',
        'arts',
      ],
    },


    {
      slug:
        'creative-design',

      label:
        'creating a visual or design-based school project',

      subjects: [
        'fine-arts',
      ],

      interests: [
        'arts-design',
      ],

      streams: [
        'arts',
        'humanities',
      ],
    },


    {
      slug:
        'written-presentation',

      label:
        'preparing an important written or spoken presentation',

      subjects: [
        'english',
      ],

      interests: [
        'humanities-social-sciences',
        'law-governance',
      ],

      streams: [
        'humanities',
      ],
    },


    {
      slug:
        'practical-repair',

      label:
        'fixing or improving something using practical tools',

      subjects: [],

      interests: [
        'vocational-practical-learning',
        'engineering',
      ],

      streams: [
        'vocational',
      ],
    },


    {
      slug:
        'environment-problem',

      label:
        'finding a practical response to an environmental problem',

      subjects: [
        'science',
        'geography',
      ],

      interests: [
        'agriculture-environment',
        'science',
      ],

      streams: [
        'science',
        'humanities',
      ],
    },


    {
      slug:
        'health-awareness',

      label:
        'planning a school health-awareness activity',

      subjects: [
        'biology',
      ],

      interests: [
        'healthcare-medical',
        'social-helping',
      ],

      streams: [
        'pcb',
        'pcmb',
      ],
    },


    {
      slug:
        'team-competition',

      label:
        'preparing with a team for an important competition',

      subjects: [],

      interests: [
        'sports',
      ],

      streams: [],
    },


    {
      slug:
        'school-event',

      label:
        'organising an important school event',

      subjects: [],

      interests: [
        'business-management',
      ],

      streams: [],
    },


    {
      slug:
        'career-research',

      label:
        'researching different careers after Class 10',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'stream-comparison',

      label:
        'comparing different stream options for Class 11',

      subjects: [],

      interests: [],

      streams: [
        'pcm',
        'pcb',
        'pcmb',
        'commerce',
        'humanities',
        'arts',
        'vocational',
      ],
    },


    {
      slug:
        'subject-choice',

      label:
        'deciding which subjects match my strengths and interests',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'career-video',

      label:
        'evaluating information presented in a career video',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'future-course',

      label:
        'exploring a course I might study after school',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'group-disagreement',

      label:
        'working in a group where people strongly disagree',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'time-pressure',

      label:
        'completing an important task under time pressure',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'unexpected-result',

      label:
        'dealing with a result that is different from what I expected',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'limited-resources',

      label:
        'completing a project with limited time, money, or materials',

      subjects: [],

      interests: [
        'entrepreneurship',
      ],

      streams: [],
    },


    {
      slug:
        'new-digital-tool',

      label:
        'learning an unfamiliar digital tool for school work',

      subjects: [
        'computer-science',
      ],

      interests: [
        'computer-technology',
      ],

      streams: [],
    },


    {
      slug:
        'independent-assignment',

      label:
        'completing a demanding assignment independently',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'community-problem',

      label:
        'helping solve a practical problem in my community',

      subjects: [
        'social-science',
      ],

      interests: [
        'humanities-social-sciences',
        'social-helping',
      ],

      streams: [],
    },


    {
      slug:
        'small-enterprise',

      label:
        'thinking about a small product or service idea',

      subjects: [
        'commerce',
      ],

      interests: [
        'entrepreneurship',
        'business-management',
      ],

      streams: [
        'commerce',
      ],
    },


    {
      slug:
        'performance-improvement',

      label:
        'trying to improve my performance in a difficult subject',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'information-overload',

      label:
        'working through a large amount of information before making a decision',

      subjects: [],

      interests: [],

      streams: [],
    },


    {
      slug:
        'future-decision',

      label:
        'making an important decision about my future studies',

      subjects: [],

      interests: [],

      streams: [],
    },

  ]);


/*
|--------------------------------------------------------------------------
| TRAIT RULES
|--------------------------------------------------------------------------
*/

const RULES =
  Object.freeze({

    analytical: {
      families: [
        'cause-analysis',
        'evidence-evaluation',
        'decision-comparison',
        'pattern-reasoning',
        'error-investigation',
        'logical-decomposition',
        'assumption-checking',
        'consequence-analysis',
      ],

      texts: [
        c =>
          `When something unexpected happens while ${c}, I like identifying the most likely reasons behind it.`,

        c =>
          `Before accepting a conclusion while ${c}, I prefer checking whether the available evidence really supports it.`,

        c =>
          `When there are several possible approaches to ${c}, I like comparing their advantages and disadvantages.`,

        c =>
          `While ${c}, I enjoy noticing patterns or relationships that may explain what is happening.`,

        c =>
          `If something goes wrong while ${c}, I prefer tracing the process carefully to locate the source of the problem.`,

        c =>
          `When ${c} becomes complicated, I find it useful to separate the situation into smaller logical parts.`,

        c =>
          `While ${c}, I often question whether an important assumption might be incorrect.`,

        c =>
          `Before choosing what to do while ${c}, I like thinking through the likely consequences of each option.`,
      ],
    },


    quantitative: {
      families: [
        'estimation',
        'data-interpretation',
        'number-comparison',
        'measurement-reasoning',
        'resource-allocation',
        'numerical-verification',
        'rate-reasoning',
        'probability-thinking',
      ],

      texts: [
        c =>
          `When ${c} involves numbers, I like estimating a reasonable answer before calculating it exactly.`,

        c =>
          `I enjoy interpreting numerical information, tables, percentages, or graphs while ${c}.`,

        c =>
          `When several numbers matter while ${c}, I naturally compare them to see which differences are important.`,

        c =>
          `I enjoy thinking about quantities, measurements, or numerical relationships while ${c}.`,

        c =>
          `If ${c} involves limited resources, I like calculating how those resources could be allocated effectively.`,

        c =>
          `After reaching a numerical answer while ${c}, I usually check whether the result makes practical sense.`,

        c =>
          `I enjoy reasoning about ratios, rates, growth, or changing quantities while ${c}.`,

        c =>
          `When ${c} involves uncertainty, I like thinking about which outcomes are more or less likely.`,
      ],
    },


    verbal: {
      families: [
        'concept-explanation',
        'written-expression',
        'discussion',
        'persuasive-communication',
        'information-summary',
        'presentation',
        'question-formulation',
        'audience-adaptation',
      ],

      texts: [
        c =>
          `While ${c}, I enjoy explaining important ideas in words another person can understand.`,

        c =>
          `Writing my thoughts clearly helps me organise my understanding while ${c}.`,

        c =>
          `I enjoy discussing different viewpoints while ${c} and responding thoughtfully to them.`,

        c =>
          `If I believe one approach is stronger while ${c}, I enjoy explaining reasons that may persuade others.`,

        c =>
          `After ${c}, I like summarising the most important information in my own words.`,

        c =>
          `I feel comfortable presenting what I learned while ${c} to other people.`,

        c =>
          `While ${c}, I often think of questions that could lead to a deeper discussion.`,

        c =>
          `When explaining something while ${c}, I try to adjust my wording to the person listening.`,
      ],
    },


    creativity: {
      families: [
        'idea-generation',
        'alternative-solutions',
        'design-expression',
        'improvement-thinking',
        'imagination',
        'open-ended-creation',
        'constraint-creativity',
        'combination-thinking',
      ],

      texts: [
        c =>
          `While ${c}, I enjoy generating several original ideas before settling on one.`,

        c =>
          `If the usual method is not effective while ${c}, I like inventing a different approach.`,

        c =>
          `I enjoy adding my own visual, design, storytelling, or presentation ideas while ${c}.`,

        c =>
          `While ${c}, I often notice ways the existing approach could be improved.`,

        c =>
          `I enjoy imagining possibilities that other people may not immediately notice while ${c}.`,

        c =>
          `I prefer tasks where ${c} allows more than one good way to create the final result.`,

        c =>
          `When there are strict limits while ${c}, I enjoy finding creative ways to work within them.`,

        c =>
          `While ${c}, I like combining ideas from different sources to create something new.`,
      ],
    },


    technology: {
      families: [
        'digital-exploration',
        'technology-troubleshooting',
        'tool-learning',
        'system-curiosity',
        'digital-creation',
        'technology-application',
        'automation-thinking',
        'technology-evaluation',
      ],

      texts: [
        c =>
          `I enjoy exploring how digital technology could help while ${c}.`,

        c =>
          `If a digital tool fails while ${c}, I like investigating what may have caused the problem.`,

        c =>
          `I am comfortable learning a new digital tool when it could improve how I handle ${c}.`,

        c =>
          `When technology is involved while ${c}, I often become curious about how the system works internally.`,

        c =>
          `I enjoy creating something digital that could make ${c} easier or more effective.`,

        c =>
          `While ${c}, I like thinking about practical ways technology could improve the outcome.`,

        c =>
          `If part of ${c} becomes repetitive, I often wonder whether technology could automate it.`,

        c =>
          `Before choosing a digital tool while ${c}, I like comparing whether it is really suitable for the task.`,
      ],
    },


    hands_on: {
      families: [
        'building',
        'physical-testing',
        'repair',
        'practical-learning',
        'model-making',
        'tool-use',
        'iteration',
        'physical-observation',
      ],

      texts: [
        c =>
          `I enjoy building or assembling something practical while ${c}.`,

        c =>
          `I understand ideas better when ${c} allows me to test something physically myself.`,

        c =>
          `If something physical is not working while ${c}, I enjoy trying to fix or adjust it.`,

        c =>
          `I prefer learning through practical experience when ${c} gives me the opportunity.`,

        c =>
          `I enjoy making a model or prototype when it could help me understand ${c}.`,

        c =>
          `I feel comfortable using tools or physical materials when they are useful while ${c}.`,

        c =>
          `If my first practical attempt fails while ${c}, I like making an adjustment and testing again.`,

        c =>
          `While ${c}, I pay close attention to things I can directly observe, measure, or test.`,
      ],
    },


    scientific_curiosity: {
      families: [
        'why-questioning',
        'hypothesis-thinking',
        'evidence-seeking',
        'experiment-curiosity',
        'mechanism-curiosity',
        'independent-investigation',
        'prediction-testing',
        'variable-thinking',
      ],

      texts: [
        c =>
          `While ${c}, I often become curious about why something happens the way it does.`,

        c =>
          `Before testing an idea while ${c}, I enjoy predicting what may happen and why.`,

        c =>
          `While ${c}, I prefer explanations that are supported by observations or reliable evidence.`,

        c =>
          `I enjoy testing an idea while ${c} instead of accepting it only because someone says it is correct.`,

        c =>
          `While ${c}, I often want to understand the mechanism that produces the result.`,

        c =>
          `If ${c} interests me, I may investigate the topic further even when it is not required for school.`,

        c =>
          `I enjoy comparing what I predicted while ${c} with what actually happens.`,

        c =>
          `When testing something while ${c}, I like thinking about which factor may be affecting the result.`,
      ],
    },


    social_helping: {
      families: [
        'peer-support',
        'empathy',
        'teaching-help',
        'wellbeing',
        'community-support',
        'inclusive-behaviour',
        'needs-awareness',
        'encouragement',
      ],

      texts: [
        c =>
          `If another student struggles while ${c}, I usually want to help if I can.`,

        c =>
          `While ${c}, I try to understand how the situation may feel from another person's point of view.`,

        c =>
          `I enjoy helping another student understand something connected with ${c}.`,

        c =>
          `While ${c}, I tend to notice when someone appears stressed, uncomfortable, or excluded.`,

        c =>
          `I especially value ${c} when the outcome could help other people.`,

        c =>
          `During group work connected with ${c}, I try to make sure quieter people also have a chance to contribute.`,

        c =>
          `Before suggesting a solution while ${c}, I like understanding what the people involved actually need.`,

        c =>
          `When someone finds ${c} difficult, I prefer encouraging them instead of judging them quickly.`,
      ],
    },


    leadership: {
      families: [
        'direction-setting',
        'coordination',
        'decision-making',
        'responsibility',
        'team-motivation',
        'conflict-guidance',
        'delegation',
        'priority-setting',
      ],

      texts: [
        c =>
          `When working with others while ${c}, I am comfortable helping define the main goal.`,

        c =>
          `I would be comfortable coordinating people and responsibilities while ${c}.`,

        c =>
          `If a group becomes stuck while ${c}, I am comfortable helping everyone move toward a decision.`,

        c =>
          `I am willing to take responsibility for an important part of ${c}.`,

        c =>
          `If a group loses motivation while ${c}, I often want to help everyone regain focus.`,

        c =>
          `If disagreements appear while ${c}, I am comfortable helping the group find a workable way forward.`,

        c =>
          `While ${c}, I can divide responsibilities according to what different people can contribute.`,

        c =>
          `When several tasks compete for attention while ${c}, I am comfortable helping decide what should come first.`,
      ],
    },


    collaboration: {
      families: [
        'shared-work',
        'idea-integration',
        'feedback',
        'team-reliability',
        'conflict-resolution',
        'role-coordination',
        'knowledge-sharing',
        'mutual-adjustment',
      ],

      texts: [
        c =>
          `I enjoy working with other people when ${c} requires a shared result.`,

        c =>
          `While ${c}, I like combining useful suggestions from different people into one stronger approach.`,

        c =>
          `I am willing to revise my work while ${c} after receiving useful feedback from teammates.`,

        c =>
          `If I agree to complete one part while ${c}, I try to make sure the group can depend on me.`,

        c =>
          `When people disagree while ${c}, I prefer discussing the issue until the group finds a workable solution.`,

        c =>
          `I like making sure different people's roles fit together effectively while ${c}.`,

        c =>
          `While ${c}, I am comfortable sharing useful knowledge if it helps the group perform better.`,

        c =>
          `If the team's needs change while ${c}, I am willing to adjust my own role.`,
      ],
    },


    independence: {
      families: [
        'self-starting',
        'self-learning',
        'independent-judgement',
        'personal-responsibility',
        'autonomous-problem-solving',
        'self-directed-goals',
        'resourcefulness',
        'self-monitoring',
      ],

      texts: [
        c =>
          `If I know what is expected while ${c}, I can usually start without waiting for someone to remind me.`,

        c =>
          `If I need new knowledge while ${c}, I am comfortable exploring it independently first.`,

        c =>
          `While ${c}, I prefer forming my own opinion before copying what other people think.`,

        c =>
          `I prefer taking responsibility for my own contribution while ${c}.`,

        c =>
          `If I encounter a problem while ${c}, I usually try solving it myself before requesting detailed help.`,

        c =>
          `While ${c}, I can set my own smaller goals and continue working toward them.`,

        c =>
          `If I do not have everything I need while ${c}, I usually try finding another useful resource or method.`,

        c =>
          `When working independently while ${c}, I regularly check my own progress.`,
      ],
    },


    structure: {
      families: [
        'planning',
        'step-sequencing',
        'organisation',
        'checklist-use',
        'deadline-management',
        'procedure-following',
        'progress-tracking',
        'information-organisation',
      ],

      texts: [
        c =>
          `Before ${c}, I like having a clear plan for what needs to be done.`,

        c =>
          `I prefer dividing ${c} into an ordered sequence of smaller steps.`,

        c =>
          `While ${c}, I like keeping my materials, notes, and information organised.`,

        c =>
          `A checklist helps me avoid forgetting important tasks while ${c}.`,

        c =>
          `If ${c} has a deadline, I prefer deciding beforehand when different parts should be completed.`,

        c =>
          `If there is an established procedure while ${c}, I usually prefer understanding and following it carefully.`,

        c =>
          `While ${c}, I like checking how much progress has been made and what still remains.`,

        c =>
          `When ${c} involves a lot of information, I like organising it into clear categories.`,
      ],
    },


    adaptability: {
      families: [
        'plan-change',
        'method-switching',
        'new-environment',
        'unexpected-problem',
        'new-evidence',
        'role-change',
        'learning-adjustment',
        'uncertainty-tolerance',
      ],

      texts: [
        c =>
          `If circumstances change while ${c}, I can revise my original plan and continue.`,

        c =>
          `When one method fails while ${c}, I am willing to try a different approach.`,

        c =>
          `I can become comfortable with unfamiliar conditions while ${c}.`,

        c =>
          `If an unexpected difficulty appears while ${c}, I can adjust without becoming completely stuck.`,

        c =>
          `If new information challenges what I believed while ${c}, I am willing to update my view.`,

        c =>
          `If my responsibility changes while ${c}, I can adapt to the new role.`,

        c =>
          `If my current approach is ineffective while ${c}, I can change how I learn or work.`,

        c =>
          `I can continue making progress while ${c} even when the final outcome is uncertain.`,
      ],
    },


    achievement: {
      families: [
        'challenge-seeking',
        'goal-completion',
        'performance-improvement',
        'progress-tracking',
        'persistence',
        'high-standard',
        'feedback-use',
        'self-competition',
      ],

      texts: [
        c =>
          `I find ${c} more engaging when it gives me a meaningful challenge to overcome.`,

        c =>
          `Completing ${c} successfully gives me a strong sense of satisfaction.`,

        c =>
          `While ${c}, I often think about how I could improve my performance.`,

        c =>
          `I like seeing clear progress toward a goal while ${c}.`,

        c =>
          `If ${c} becomes difficult, I usually want to keep trying before giving up.`,

        c =>
          `I feel satisfied when I know I have handled ${c} to a high standard.`,

        c =>
          `I like using constructive feedback to improve the next time I face something similar to ${c}.`,

        c =>
          `While ${c}, I sometimes challenge myself to perform better than I did previously.`,
      ],
    },


    stability: {
      families: [
        'predictability',
        'routine',
        'risk-awareness',
        'clear-expectations',
        'security',
        'change-comfort',
        'consistency',
        'preparation',
      ],

      texts: [
        c =>
          `I feel more comfortable while ${c} when I have a reasonable idea of what to expect.`,

        c =>
          `A regular routine makes it easier for me to stay consistent while ${c}.`,

        c =>
          `Before making an important decision while ${c}, I like understanding the possible risks.`,

        c =>
          `I work better while ${c} when expectations are clearly explained.`,

        c =>
          `I generally prefer a dependable approach while ${c} rather than taking unnecessary risks.`,

        c =>
          `I can handle changes while ${c}, but I prefer understanding what the new situation requires.`,

        c =>
          `I prefer making steady and consistent progress while ${c} rather than changing direction repeatedly.`,

        c =>
          `I feel more confident while ${c} when I have enough time to prepare properly.`,
      ],
    },


    entrepreneurship: {
      families: [
        'opportunity-recognition',
        'value-creation',
        'initiative',
        'customer-thinking',
        'idea-testing',
        'calculated-risk',
        'resourcefulness',
        'problem-opportunity',
      ],

      texts: [
        c =>
          `While ${c}, I sometimes notice opportunities that other people may overlook.`,

        c =>
          `I enjoy thinking about how ${c} could create something useful or valuable for other people.`,

        c =>
          `If I notice a promising idea while ${c}, I like taking an initial step instead of only discussing it.`,

        c =>
          `When developing an idea while ${c}, I like considering what the people using it would actually need.`,

        c =>
          `Before investing a lot of effort in an idea while ${c}, I would prefer testing a smaller version first.`,

        c =>
          `If an idea has potential while ${c}, I am willing to take a reasonable risk after thinking it through.`,

        c =>
          `When resources are limited while ${c}, I enjoy finding ways to create useful results with what is available.`,

        c =>
          `When I notice a problem while ${c}, I sometimes think about whether solving it could become a useful product, service, or project.`,
      ],
    },

  });


const SECTIONS =
  Object.freeze([
    'strength',
    'problem-solving',
    'work-style',
    'interest',
    'decision-making',
    'preferences',
    'behaviour',
    'motivation',
  ]);


/*
|--------------------------------------------------------------------------
| TEXT DIVERSITY
|--------------------------------------------------------------------------
|
| Keeps repeated-family formulations sufficiently distinct without
| changing the intended trait.
|
*/

const TENDENCY_QUALIFIERS =
  Object.freeze([
    '',
    ' I tend to do this even when nobody specifically asks me to.',
    ' This is usually one of the first approaches I consider.',
    ' I would still prefer this approach when the task becomes more demanding.',
  ]);


function diversifyText({
  text,
  sequence,
}) {
  const cycle =
    Math.floor(
      (sequence - 1) /
      8
    );


  return (
    text +
    TENDENCY_QUALIFIERS[
      cycle %
      TENDENCY_QUALIFIERS.length
    ]
  );
}


function buildMetadataQuestion({
  trait,
  sequence,
  variant,
  context,
  rule,
}) {
  const family =
    rule.families[
      variant
    ];


  const base =
    buildAdaptiveQuestion({

      classKey:
        CLASS_KEY,

      sequence,

      section:
        SECTIONS[
          variant
        ],

      trait,

      text:
        diversifyText({
          text:
            rule.texts[
              variant
            ](
              context.label
            ),

          sequence,
        }),

      scenarioFamily:
        family,

      scenario:
        `${family}-${context.slug}`,

      subjects:
        context.subjects,

      interestClusters:
        context.interests,

      contextScope:
        'school-transition',

      difficulty:
        sequence % 5 === 0
          ? 3
          : 2,

      priority:
        sequence <= 12
          ? 4
          : 3,

      tags: [
        trait,
        family,
        context.slug,
        'class-10',
        'stream-selection',
        'v7-class10-bank',
      ],
    });


  /*
  |--------------------------------------------------------------------------
  | Extended metadata used by profile-aware selector
  |--------------------------------------------------------------------------
  */

  return Object.freeze({

    ...base,

    streams:
      context.streams ||
      [],

    goals: [
      'choose-stream',
      'explore-careers',
    ],

    careerFamilies:
      context.interests ||
      [],

  });
}


const QUESTIONS =
  [];


for (
  const trait of TRAITS
) {
  const count =
    COUNTS[
      trait
    ];


  const rule =
    RULES[
      trait
    ];


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const context =
      CONTEXTS[
        index %
        CONTEXTS.length
      ];


    const variant =
      index %
      rule.texts.length;


    QUESTIONS.push(
      buildMetadataQuestion({

        trait,

        sequence:
          index + 1,

        variant,

        context,

        rule,

      })
    );
  }
}


if (
  QUESTIONS.length !==
  500
) {
  throw new Error(
    `Expected 500 Class-10 questions, generated ${QUESTIONS.length}.`
  );
}


export default QUESTIONS;
