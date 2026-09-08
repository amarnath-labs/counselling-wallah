import {
  buildAdaptiveQuestion,
} from './builders/adaptiveQuestionBuilder.js';


const CLASS_KEY =
  'class-8';


const TRAITS = [
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
];


const EXTRA_COUNTS = Object.freeze({
  analytical: 26,
  quantitative: 26,
  verbal: 26,
  creativity: 26,

  technology: 25,
  hands_on: 25,
  scientific_curiosity: 25,
  social_helping: 25,
  leadership: 25,
  collaboration: 25,
  independence: 25,
  structure: 25,
  adaptability: 25,
  achievement: 25,
  stability: 25,
  entrepreneurship: 25,
});


const CONTEXTS = [
  {
    slug: 'school-project',
    label: 'a school project',
    scope: 'class',
  },
  {
    slug: 'science-activity',
    label: 'a science activity',
    scope: 'subject',
    subjects: ['science'],
  },
  {
    slug: 'maths-task',
    label: 'a mathematics task',
    scope: 'subject',
    subjects: ['mathematics'],
  },
  {
    slug: 'group-assignment',
    label: 'a group assignment',
    scope: 'class',
  },
  {
    slug: 'school-event',
    label: 'a school event',
    scope: 'class',
  },
  {
    slug: 'club-activity',
    label: 'a club activity',
    scope: 'class',
  },
  {
    slug: 'sports-team',
    label: 'a sports team activity',
    scope: 'class',
  },
  {
    slug: 'digital-project',
    label: 'a digital project',
    scope: 'interest',
    interests: ['technology'],
  },
  {
    slug: 'presentation',
    label: 'a classroom presentation',
    scope: 'class',
  },
  {
    slug: 'competition',
    label: 'a school competition',
    scope: 'class',
  },
  {
    slug: 'new-topic',
    label: 'an unfamiliar topic',
    scope: 'class',
  },
  {
    slug: 'home-task',
    label: 'a responsibility at home',
    scope: 'class',
  },
  {
    slug: 'friend-problem',
    label: 'a problem a friend is facing',
    scope: 'class',
  },
  {
    slug: 'community-activity',
    label: 'a community activity',
    scope: 'class',
  },
  {
    slug: 'creative-assignment',
    label: 'an open-ended creative assignment',
    scope: 'interest',
    interests: ['design-creative'],
  },
  {
    slug: 'device-problem',
    label: 'a device that is not working properly',
    scope: 'interest',
    interests: ['technology'],
  },
  {
    slug: 'experiment-result',
    label: 'an unexpected experiment result',
    scope: 'subject',
    subjects: ['science'],
  },
  {
    slug: 'information-search',
    label: 'information from several sources',
    scope: 'class',
  },
  {
    slug: 'time-pressure',
    label: 'a task with limited time',
    scope: 'class',
  },
  {
    slug: 'limited-budget',
    label: 'an activity with a limited budget',
    scope: 'class',
  },
  {
    slug: 'different-opinions',
    label: 'a situation where people have different opinions',
    scope: 'class',
  },
  {
    slug: 'new-tool',
    label: 'a tool I have never used before',
    scope: 'class',
  },
  {
    slug: 'long-assignment',
    label: 'a long assignment spread across several days',
    scope: 'class',
  },
  {
    slug: 'career-video',
    label: 'a video explaining a future career',
    scope: 'career-discriminator',
  },
  {
    slug: 'real-life-problem',
    label: 'an everyday problem around me',
    scope: 'class',
  },
  {
    slug: 'student-choice',
    label: 'a choice between several school activities',
    scope: 'class',
  },
];


const RULES = {

  analytical: {
    families: [
      'cause-analysis',
      'evidence-evaluation',
      'decision-comparison',
      'pattern-reasoning',
      'error-investigation',
      'logical-decomposition',
    ],

    texts: [
      (c) =>
        `When ${c} does not go as expected, I like identifying the possible reasons before deciding what to change.`,

      (c) =>
        `While working with ${c}, I prefer checking the available information before accepting the first explanation.`,

      (c) =>
        `If there are several ways to handle ${c}, I like comparing the advantages and disadvantages of each.`,

      (c) =>
        `I enjoy noticing patterns or connections while working with ${c}.`,

      (c) =>
        `When I find a mistake in ${c}, I like tracing back through the steps to understand where it began.`,

      (c) =>
        `I find it useful to break ${c} into smaller parts before trying to solve the whole problem.`,
    ],
  },


  quantitative: {
    families: [
      'number-comparison',
      'estimation',
      'data-interpretation',
      'resource-allocation',
      'numerical-verification',
      'measurement-reasoning',
    ],

    texts: [
      (c) =>
        `When ${c} includes numbers, I naturally compare the values before making a decision.`,

      (c) =>
        `I like estimating an approximate numerical answer for ${c} before calculating it exactly.`,

      (c) =>
        `I enjoy interpreting tables, graphs, scores, or other numerical information connected with ${c}.`,

      (c) =>
        `If ${c} has limited money, time, or materials, I like working out how they can be divided efficiently.`,

      (c) =>
        `After calculating something for ${c}, I usually check whether the result is numerically reasonable.`,

      (c) =>
        `I am comfortable using measurements or quantities to understand ${c}.`,
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
    ],

    texts: [
      (c) =>
        `I enjoy explaining my understanding of ${c} in words that another student can easily follow.`,

      (c) =>
        `I like writing clear sentences to express my ideas about ${c}.`,

      (c) =>
        `I enjoy discussing ${c} and listening carefully before responding to other viewpoints.`,

      (c) =>
        `When people disagree about ${c}, I like giving reasons that clearly explain my point of view.`,

      (c) =>
        `After learning about ${c}, I can usually summarize the main ideas in my own words.`,

      (c) =>
        `I would be comfortable presenting my understanding of ${c} to a group.`,
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
    ],

    texts: [
      (c) =>
        `When working on ${c}, I enjoy thinking of several possible ideas instead of using only the first one.`,

      (c) =>
        `If the usual approach to ${c} is not working, I like trying an unusual alternative.`,

      (c) =>
        `I enjoy adding my own visual, design, storytelling, or presentation ideas to ${c}.`,

      (c) =>
        `When I see ${c}, I often think about how it could be improved or made more interesting.`,

      (c) =>
        `I enjoy imagining possibilities for ${c} that are different from what already exists.`,

      (c) =>
        `I prefer ${c} when there is room to create something in my own way.`,
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
    ],

    texts: [
      (c) =>
        `I become curious about how technology could be used while working with ${c}.`,

      (c) =>
        `If technology involved in ${c} stops working, I like trying to understand the problem.`,

      (c) =>
        `I enjoy learning a new digital tool when it could help with ${c}.`,

      (c) =>
        `When ${c} involves a device or digital system, I often wonder how that system works internally.`,

      (c) =>
        `I enjoy creating something digital as part of ${c}.`,

      (c) =>
        `I like thinking about ways technology could make ${c} easier, faster, or better.`,
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
    ],

    texts: [
      (c) =>
        `I would enjoy building or assembling something physical as part of ${c}.`,

      (c) =>
        `I understand ${c} better when I can physically test or try something myself.`,

      (c) =>
        `If something physical used in ${c} is not working, I enjoy trying to fix or adjust it.`,

      (c) =>
        `I prefer learning about ${c} through practical activity rather than only reading about it.`,

      (c) =>
        `Making a model or prototype would make ${c} more interesting to me.`,

      (c) =>
        `I am comfortable using simple tools or materials when working on ${c}.`,
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
    ],

    texts: [
      (c) =>
        `When I notice something interesting in ${c}, I often wonder why it happens.`,

      (c) =>
        `Before checking the answer to ${c}, I like thinking about what I expect might happen and why.`,

      (c) =>
        `I prefer evidence over guesses when trying to understand ${c}.`,

      (c) =>
        `I would enjoy testing an idea connected with ${c} to see whether it is actually correct.`,

      (c) =>
        `I become curious about the process or mechanism behind ${c}.`,

      (c) =>
        `If ${c} interests me, I sometimes want to investigate it beyond what is required.`,
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
    ],

    texts: [
      (c) =>
        `If another student is struggling with ${c}, I naturally want to help when I can.`,

      (c) =>
        `While dealing with ${c}, I try to understand how the situation may feel from another person's point of view.`,

      (c) =>
        `I enjoy helping someone understand ${c} when I know how to explain it.`,

      (c) =>
        `I care about whether ${c} has a positive effect on the people involved.`,

      (c) =>
        `I would enjoy using ${c} in a way that helps other people or the community.`,

      (c) =>
        `During ${c}, I notice when someone is being left out and try to include them.`,
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
    ],

    texts: [
      (c) =>
        `If nobody knows how to begin ${c}, I am comfortable suggesting a starting direction.`,

      (c) =>
        `I would be willing to coordinate people and tasks during ${c}.`,

      (c) =>
        `When a group must make a decision about ${c}, I am comfortable helping the group move toward a choice.`,

      (c) =>
        `I am willing to take responsibility for an important part of ${c}.`,

      (c) =>
        `If the group loses motivation during ${c}, I would try to help everyone continue.`,

      (c) =>
        `When disagreement affects ${c}, I am comfortable helping people focus on a workable solution.`,
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
    ],

    texts: [
      (c) =>
        `I enjoy ${c} when different people contribute different strengths.`,

      (c) =>
        `During ${c}, I like combining useful ideas from several people rather than insisting on only my own idea.`,

      (c) =>
        `I am comfortable changing part of my work on ${c} after receiving useful feedback from teammates.`,

      (c) =>
        `When others depend on my part of ${c}, I make an effort to finish it reliably.`,

      (c) =>
        `If teammates disagree during ${c}, I try to help find a solution everyone can work with.`,

      (c) =>
        `I am comfortable dividing responsibilities with others during ${c}.`,
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
    ],

    texts: [
      (c) =>
        `When I receive ${c}, I usually try to begin without waiting for someone to guide every step.`,

      (c) =>
        `If I need to learn something for ${c}, I am comfortable exploring it by myself first.`,

      (c) =>
        `I prefer forming my own opinion about ${c} before copying what others think.`,

      (c) =>
        `I can take responsibility for completing my part of ${c} without frequent reminders.`,

      (c) =>
        `When ${c} becomes difficult, I usually try solving it myself before asking for help.`,

      (c) =>
        `I enjoy having some freedom to decide how I will approach ${c}.`,
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
    ],

    texts: [
      (c) =>
        `Before starting ${c}, I prefer having a basic plan for what needs to be done.`,

      (c) =>
        `I like breaking ${c} into a clear sequence of smaller steps.`,

      (c) =>
        `I prefer keeping the materials and information for ${c} organised.`,

      (c) =>
        `For ${c}, I find checklists useful for making sure important steps are not missed.`,

      (c) =>
        `If ${c} has a deadline, I like deciding in advance when each part should be completed.`,

      (c) =>
        `When ${c} has a proven procedure, I am comfortable following it carefully.`,
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
    ],

    texts: [
      (c) =>
        `If the plan for ${c} suddenly changes, I can usually adjust without losing too much momentum.`,

      (c) =>
        `When one method does not work for ${c}, I am willing to try a different approach.`,

      (c) =>
        `I can become comfortable with unfamiliar conditions while working on ${c}.`,

      (c) =>
        `When an unexpected problem appears during ${c}, I can change my approach rather than getting stuck.`,

      (c) =>
        `If new information changes what I understood about ${c}, I am willing to revise my thinking.`,

      (c) =>
        `I can take on a different role during ${c} if the situation requires it.`,
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
    ],

    texts: [
      (c) =>
        `I feel motivated when ${c} gives me a difficult but achievable challenge.`,

      (c) =>
        `Finishing ${c} successfully gives me a strong sense of satisfaction.`,

      (c) =>
        `I like finding ways to improve my performance while doing ${c}.`,

      (c) =>
        `I stay motivated by noticing measurable progress in ${c}.`,

      (c) =>
        `If ${c} is important to me, I can continue working even when progress is slow.`,

      (c) =>
        `I usually try to produce work I can be proud of when completing ${c}.`,
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
    ],

    texts: [
      (c) =>
        `I feel more comfortable with ${c} when I know roughly what to expect.`,

      (c) =>
        `A regular routine makes it easier for me to stay consistent with ${c}.`,

      (c) =>
        `Before making an important decision about ${c}, I like understanding the possible risks.`,

      (c) =>
        `I prefer ${c} when the responsibilities and expectations are clearly explained.`,

      (c) =>
        `When comparing choices related to ${c}, reliability is important to me.`,

      (c) =>
        `Too many sudden changes in ${c} would make it harder for me to enjoy the activity.`,
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
    ],

    texts: [
      (c) =>
        `While thinking about ${c}, I sometimes notice problems that could become opportunities for a useful new solution.`,

      (c) =>
        `I enjoy thinking about how ${c} could create something useful or valuable for other people.`,

      (c) =>
        `If I have a promising idea connected with ${c}, I like taking the first step instead of only talking about it.`,

      (c) =>
        `When thinking about ${c}, I find it interesting to consider what different people would actually want or use.`,

      (c) =>
        `I would enjoy testing a small version of an idea related to ${c} before deciding whether it is worth developing further.`,

      (c) =>
        `I am willing to explore a promising idea connected with ${c} even when success is not guaranteed.`,
    ],
  },
};



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
    'For a community activity, I prefer building a shared solution from several people\'s suggestions instead of pushing one person\'s idea.',

  v7_class8_collaboration_026:
    'When a team has limited resources, I like bringing different suggestions together so the final plan uses everyone\'s best ideas.',


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



const QUESTIONS = [];


for (
  const trait of TRAITS
) {
  const rule =
    RULES[trait];

  const count =
    EXTRA_COUNTS[trait];


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const context =
      CONTEXTS[index];


    const variant =
      index %
      rule.texts.length;


    const family =
      rule.families[
        variant
      ];


    QUESTIONS.push(
      buildAdaptiveQuestion({
        classKey:
          CLASS_KEY,

        /*
        | Existing Class-8 has
        | 001 through 006
        | for every trait.
        */
        sequence:
          index + 7,

        section:
          variant === 0
            ? 'strength'
            : variant === 1
              ? 'problem-solving'
              : variant === 2
                ? 'work-style'
                : variant === 3
                  ? 'interest'
                  : variant === 4
                    ? 'decision-making'
                    : 'preferences',

        trait,

        text:
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
          }),

        scenarioFamily:
          family,

        /*
        | Unique semantic situation.
        |
        | Same family can legitimately
        | contain many different scenarios.
        */
        scenario:
          `${family}-${context.slug}`,

        subjects:
          context.subjects || [],

        interestClusters:
          context.interests || [],

        contextScope:
          context.scope,

        difficulty:
          (
            index % 4
          ) === 3
            ? 3
            : 2,

        priority:
          index < 10
            ? 4
            : 3,

        tags: [
          trait,
          family,
          context.slug,
          'class-8',
          'v7-batch-02',
        ],
      })
    );
  }
}


if (
  QUESTIONS.length !== 404
) {
  throw new Error(
    `Class-8 Batch-02 expected 404 questions, found ${QUESTIONS.length}`
  );
}


export {
  QUESTIONS,
};


export default QUESTIONS;


