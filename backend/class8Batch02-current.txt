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
          rule.texts[
            variant
          ](
            context.label
          ),

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
