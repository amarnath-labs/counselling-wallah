import {
  buildAdaptiveQuestion,
} from './builders/adaptiveQuestionBuilder.js';


const CLASS_KEY =
  'class-9';


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


const CONTEXTS =
  Object.freeze([
    {
      slug: 'science-project',
      label: 'a science project',
      subjects: ['science'],
      interests: ['science'],
    },
    {
      slug: 'mathematics-problem',
      label: 'a mathematics problem',
      subjects: ['mathematics'],
      interests: ['science', 'engineering'],
    },
    {
      slug: 'computer-task',
      label: 'a computer-related task',
      subjects: ['computer-science'],
      interests: ['computer-technology'],
    },
    {
      slug: 'group-assignment',
      label: 'a group assignment',
      subjects: [],
      interests: [],
    },
    {
      slug: 'school-event',
      label: 'a school event',
      subjects: [],
      interests: [],
    },
    {
      slug: 'community-task',
      label: 'a community activity',
      subjects: ['social-science'],
      interests: ['humanities-social-sciences'],
    },
    {
      slug: 'creative-project',
      label: 'a creative project',
      subjects: ['fine-arts'],
      interests: ['arts-design'],
    },
    {
      slug: 'business-idea',
      label: 'a simple business idea',
      subjects: ['commerce'],
      interests: ['commerce', 'entrepreneurship'],
    },
    {
      slug: 'health-topic',
      label: 'a health-related topic',
      subjects: ['biology'],
      interests: ['healthcare-medical'],
    },
    {
      slug: 'environment-task',
      label: 'an environment-related activity',
      subjects: ['science'],
      interests: ['agriculture-environment'],
    },
    {
      slug: 'sports-team',
      label: 'a sports team activity',
      subjects: ['physical-education'],
      interests: ['sports'],
    },
    {
      slug: 'presentation',
      label: 'a classroom presentation',
      subjects: ['english'],
      interests: [],
    },
    {
      slug: 'new-topic',
      label: 'an unfamiliar topic',
      subjects: [],
      interests: [],
    },
    {
      slug: 'time-pressure',
      label: 'a task with limited time',
      subjects: [],
      interests: [],
    },
    {
      slug: 'limited-budget',
      label: 'an activity with limited money',
      subjects: ['commerce'],
      interests: ['commerce'],
    },
    {
      slug: 'different-opinions',
      label: 'a situation where people have different opinions',
      subjects: ['social-science'],
      interests: ['humanities-social-sciences'],
    },
    {
      slug: 'new-tool',
      label: 'a new digital or practical tool',
      subjects: ['computer-science'],
      interests: ['computer-technology', 'vocational-practical-learning'],
    },
    {
      slug: 'long-assignment',
      label: 'a long school assignment',
      subjects: [],
      interests: [],
    },
    {
      slug: 'career-exploration',
      label: 'an activity about exploring careers',
      subjects: [],
      interests: [],
    },
    {
      slug: 'real-life-problem',
      label: 'a real-life problem',
      subjects: [],
      interests: [],
    },
    {
      slug: 'experiment',
      label: 'an experiment',
      subjects: ['science'],
      interests: ['science'],
    },
    {
      slug: 'data-task',
      label: 'a task involving data or numbers',
      subjects: ['mathematics'],
      interests: ['finance', 'engineering'],
    },
    {
      slug: 'helping-friend',
      label: 'helping a friend with a difficult situation',
      subjects: [],
      interests: ['humanities-social-sciences'],
    },
    {
      slug: 'design-task',
      label: 'a design-oriented task',
      subjects: ['fine-arts'],
      interests: ['arts-design'],
    },
    {
      slug: 'practical-task',
      label: 'a practical hands-on task',
      subjects: [],
      interests: ['vocational-practical-learning'],
    },
    {
      slug: 'leadership-task',
      label: 'a situation where someone needs to guide a group',
      subjects: [],
      interests: ['business-management'],
    },
    {
      slug: 'planning-task',
      label: 'a task that needs careful planning',
      subjects: [],
      interests: [],
    },
    {
      slug: 'decision-task',
      label: 'a situation that requires choosing between options',
      subjects: [],
      interests: [],
    },
    {
      slug: 'research-task',
      label: 'a task that requires finding reliable information',
      subjects: [],
      interests: ['science', 'humanities-social-sciences'],
    },
    {
      slug: 'competition',
      label: 'a school competition',
      subjects: [],
      interests: ['sports'],
    },
    {
      slug: 'project-improvement',
      label: 'a project-improvement activity',
      subjects: [],
      interests: [],
    },
    {
      slug: 'student-choice',
      label: 'a situation where I can choose how to work',
      subjects: [],
      interests: [],
    },
  ]);


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
        context =>
          `When something unexpected happens in ${context}, I like figuring out what probably caused it.`,

        context =>
          `Before accepting an explanation in ${context}, I prefer checking whether the evidence actually supports it.`,

        context =>
          `When there are several ways to handle ${context}, I like comparing the strengths and weaknesses of each option.`,

        context =>
          `I enjoy looking for patterns or connections while working on ${context}.`,

        context =>
          `If something goes wrong in ${context}, I like tracing the steps to find where the problem started.`,

        context =>
          `When ${context} feels complicated, I prefer breaking it into smaller logical parts.`,

        context =>
          `While working on ${context}, I often check whether an important assumption may be wrong.`,

        context =>
          `Before deciding what to do in ${context}, I like thinking through the likely consequences of each choice.`,
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
        context =>
          `Before doing exact calculations for ${context}, I like making a reasonable numerical estimate first.`,

        context =>
          `I enjoy interpreting tables, graphs, percentages, or numerical information connected with ${context}.`,

        context =>
          `When ${context} involves several numbers, I naturally compare them to understand what matters most.`,

        context =>
          `I enjoy thinking about measurements, quantities, or numerical relationships while doing ${context}.`,

        context =>
          `If ${context} has limited time, money, or materials, I like calculating how those resources should be divided.`,

        context =>
          `After calculating something for ${context}, I usually check whether the answer seems numerically reasonable.`,

        context =>
          `I enjoy problems in ${context} that involve speed, growth, ratios, or changing quantities.`,

        context =>
          `When ${context} involves uncertainty, I like thinking about which outcome is more or less likely.`,
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
        context =>
          `I enjoy explaining ideas from ${context} in words that another student can understand.`,

        context =>
          `Writing my thoughts clearly helps me organise what I think about ${context}.`,

        context =>
          `I enjoy discussing ${context} and responding thoughtfully to different viewpoints.`,

        context =>
          `If I strongly believe in an idea related to ${context}, I enjoy giving reasons that may convince others.`,

        context =>
          `After learning about ${context}, I like summarising the most important points in my own words.`,

        context =>
          `I am comfortable presenting what I learned from ${context} to other people.`,

        context =>
          `While learning about ${context}, I often think of questions that could lead to a deeper discussion.`,

        context =>
          `When explaining ${context}, I try to change my wording depending on who is listening.`,
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
        context =>
          `I enjoy generating several original ideas when working on ${context}.`,

        context =>
          `If the usual solution does not work for ${context}, I like inventing a different approach.`,

        context =>
          `I enjoy adding my own visual, design, storytelling, or presentation style to ${context}.`,

        context =>
          `When I see ${context}, I often think about how it could be improved.`,

        context =>
          `I enjoy imagining possibilities for ${context} that other people may not immediately notice.`,

        context =>
          `I like assignments related to ${context} where there is more than one good way to create the final result.`,

        context =>
          `When ${context} has strict limits, I enjoy finding creative ways to work within them.`,

        context =>
          `I like combining ideas from different places to create something new for ${context}.`,
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
        context =>
          `I enjoy exploring how digital tools could help with ${context}.`,

        context =>
          `If technology used in ${context} stops working, I like investigating what may be wrong.`,

        context =>
          `I am comfortable learning a new digital tool when it could make ${context} easier or better.`,

        context =>
          `While using technology for ${context}, I often become curious about how the system works behind the screen.`,

        context =>
          `I enjoy creating something digital that could support ${context}.`,

        context =>
          `I like thinking about practical ways technology could improve ${context}.`,

        context =>
          `If ${context} contains repetitive work, I wonder whether technology could automate part of it.`,

        context =>
          `Before using a digital tool for ${context}, I like comparing whether it is actually better than other options.`,
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
        context =>
          `I enjoy building or assembling something when working on ${context}.`,

        context =>
          `I understand ${context} better when I can physically test an idea myself.`,

        context =>
          `If something used in ${context} is not working properly, I enjoy trying to fix or adjust it.`,

        context =>
          `I prefer learning about ${context} through practical experience rather than only reading instructions.`,

        context =>
          `I enjoy making a simple model or prototype to understand ${context}.`,

        context =>
          `I feel comfortable using practical tools or materials when they are needed for ${context}.`,

        context =>
          `When my first practical attempt at ${context} does not work, I like adjusting it and testing again.`,

        context =>
          `While doing ${context}, I pay attention to what I can directly observe, measure, or test.`,
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
        context =>
          `When I notice something interesting in ${context}, I often wonder why it happens.`,

        context =>
          `Before testing an idea in ${context}, I enjoy predicting what might happen and why.`,

        context =>
          `I prefer explanations about ${context} that are supported by observations or evidence.`,

        context =>
          `I enjoy testing ideas connected with ${context} rather than only discussing them.`,

        context =>
          `When learning about ${context}, I become curious about the mechanism that makes it work.`,

        context =>
          `If ${context} interests me, I sometimes investigate it further even when no one asks me to.`,

        context =>
          `I enjoy comparing what I predicted about ${context} with what actually happened.`,

        context =>
          `When testing something in ${context}, I like thinking about which factor may be changing the result.`,
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
        context =>
          `If another student struggles with ${context}, I usually want to help if I can.`,

        context =>
          `While dealing with ${context}, I try to understand how the situation may feel from another person's point of view.`,

        context =>
          `I enjoy helping someone understand ${context} when I know how to explain it.`,

        context =>
          `During ${context}, I notice when someone seems stressed, uncomfortable, or left out.`,

        context =>
          `I like activities connected with ${context} when they can make life better for other people.`,

        context =>
          `During ${context}, I try to make sure quieter or less confident people also get a chance to participate.`,

        context =>
          `Before suggesting a solution for ${context}, I like understanding what the people involved actually need.`,

        context =>
          `When someone finds ${context} difficult, I am willing to encourage them instead of judging them quickly.`,
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
        context =>
          `During ${context}, I am comfortable helping a group decide what the main goal should be.`,

        context =>
          `I would be willing to coordinate people and tasks during ${context}.`,

        context =>
          `If a group becomes stuck during ${context}, I am comfortable helping the group move toward a decision.`,

        context =>
          `I am willing to take responsibility for an important part of ${context}.`,

        context =>
          `When a group loses energy during ${context}, I often want to help everyone stay motivated.`,

        context =>
          `If disagreements appear during ${context}, I am comfortable helping people find a workable way forward.`,

        context =>
          `During ${context}, I can divide responsibilities based on what different people are good at.`,

        context =>
          `When several things need attention during ${context}, I am comfortable helping decide what should be done first.`,
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
        context =>
          `I enjoy working with other people when ${context} requires a shared result.`,

        context =>
          `During ${context}, I like combining useful ideas from different people into one stronger approach.`,

        context =>
          `I am willing to improve my part of ${context} after receiving useful feedback from teammates.`,

        context =>
          `If I agree to complete part of ${context}, I try to make sure others can depend on me.`,

        context =>
          `When people disagree during ${context}, I prefer discussing the issue until the team finds a workable solution.`,

        context =>
          `I like making sure different team roles fit together properly during ${context}.`,

        context =>
          `During ${context}, I am comfortable sharing what I know if it helps the group perform better.`,

        context =>
          `If the team's needs change during ${context}, I am willing to adjust my own role.`,
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
        context =>
          `If I know what needs to be done in ${context}, I can usually start without waiting for someone to remind me.`,

        context =>
          `If I need new knowledge for ${context}, I am comfortable exploring it independently first.`,

        context =>
          `Before copying what others think about ${context}, I prefer forming my own opinion.`,

        context =>
          `I prefer taking responsibility for my own part of ${context} instead of depending heavily on others.`,

        context =>
          `When I face a problem during ${context}, I usually try solving it myself before asking for detailed help.`,

        context =>
          `I can set my own small goals and keep moving forward during ${context}.`,

        context =>
          `If I do not have everything I need for ${context}, I usually try finding another useful resource or approach.`,

        context =>
          `While working independently on ${context}, I check my own progress without needing constant supervision.`,
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
        context =>
          `Before starting ${context}, I like having a clear plan for what needs to be done.`,

        context =>
          `I prefer breaking ${context} into an ordered sequence of smaller steps.`,

        context =>
          `I like keeping the materials, notes, or information for ${context} organised.`,

        context =>
          `For ${context}, a checklist helps me make sure I do not forget important tasks.`,

        context =>
          `When ${context} has a deadline, I prefer deciding in advance when different parts should be completed.`,

        context =>
          `If ${context} has an established procedure, I usually prefer understanding and following it carefully.`,

        context =>
          `While working through ${context}, I like checking how much progress has been completed and what still remains.`,

        context =>
          `When ${context} includes a lot of information, I like grouping it into clear categories.`,
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
        context =>
          `If conditions change during ${context}, I can revise my original plan and continue.`,

        context =>
          `When one method fails during ${context}, I am willing to try a different approach.`,

        context =>
          `I can become comfortable with unfamiliar situations while working on ${context}.`,

        context =>
          `If an unexpected difficulty appears during ${context}, I can adjust instead of getting completely stuck.`,

        context =>
          `If new information changes what I thought about ${context}, I am willing to update my view.`,

        context =>
          `If my role changes during ${context}, I can adapt to the new responsibility.`,

        context =>
          `If I realise my current way of approaching ${context} is ineffective, I can change how I study or practise it.`,

        context =>
          `During ${context}, I can continue working even when I do not know exactly how everything will turn out.`,
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
        context =>
          `I enjoy ${context} more when it gives me a meaningful challenge to overcome.`,

        context =>
          `Completing ${context} successfully gives me a strong sense of satisfaction.`,

        context =>
          `While doing ${context}, I often think about how I could improve my performance.`,

        context =>
          `I like seeing clear progress while working toward a goal in ${context}.`,

        context =>
          `If ${context} becomes difficult, I usually want to keep trying before giving up.`,

        context =>
          `I feel satisfied when I know I have done ${context} to a high standard.`,

        context =>
          `I like using constructive feedback to perform better the next time I do ${context}.`,

        context =>
          `During ${context}, I sometimes challenge myself to do better than my previous attempt.`,
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
        context =>
          `I feel more comfortable with ${context} when I have a reasonable idea of what to expect.`,

        context =>
          `A regular routine makes it easier for me to stay consistent with ${context}.`,

        context =>
          `Before making an important decision in ${context}, I like understanding the possible risks.`,

        context =>
          `I work better on ${context} when expectations are clearly explained.`,

        context =>
          `I generally prefer a dependable approach to ${context} rather than taking unnecessary risks.`,

        context =>
          `I can handle changes in ${context}, but I prefer knowing what the new situation will require.`,

        context =>
          `I prefer working on ${context} in a steady and consistent way rather than making frequent sudden changes.`,

        context =>
          `I feel more confident about ${context} when I have enough time to prepare properly.`,
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
        context =>
          `While thinking about ${context}, I sometimes notice opportunities that other people may overlook.`,

        context =>
          `I enjoy thinking about how ${context} could create something useful or valuable for other people.`,

        context =>
          `If I have a promising idea related to ${context}, I like taking a first step instead of only talking about it.`,

        context =>
          `When developing an idea around ${context}, I like thinking about what the people using it would actually want.`,

        context =>
          `Before investing a lot of effort in an idea for ${context}, I would prefer testing a small version first.`,

        context =>
          `If an idea connected with ${context} has potential, I am willing to take a reasonable risk after thinking it through.`,

        context =>
          `When resources are limited during ${context}, I enjoy finding ways to create useful results with what is available.`,

        context =>
          `When I notice a problem during ${context}, I sometimes think about whether solving it could become a useful service, product, or project.`,
      ],
    },

  });



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


const SECTION_NAMES =
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


const QUESTIONS =
  [];


for (
  const trait of TRAITS
) {
  const count =
    COUNTS[trait];

  const rule =
    RULES[trait];


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


    const family =
      rule.families[
        variant
      ];


    const sequence =
      index + 1;


    QUESTIONS.push(
      buildAdaptiveQuestion({
        classKey:
          CLASS_KEY,

        sequence,

        section:
          SECTION_NAMES[
            variant
          ],

        trait,

        text:
          diversifyQuestionText({
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
          context.subjects ||
          [],

        interestClusters:
          context.interests ||
          [],

        contextScope:
          'school',

        difficulty:
          index % 5 === 4
            ? 3
            : 2,

        priority:
          index < 12
            ? 4
            : 3,

        tags: [
          trait,
          family,
          context.slug,
          'class-9',
          'v7-class9-bank',
        ],
      })
    );
  }
}


if (
  QUESTIONS.length !==
  500
) {
  throw new Error(
    `Expected 500 Class-9 questions, generated ${QUESTIONS.length}.`
  );
}


export default QUESTIONS;
