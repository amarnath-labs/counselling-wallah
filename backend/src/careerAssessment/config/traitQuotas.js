export const CORE_TRAITS =
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


export const INTEREST_TRAIT_BOOSTS =
  Object.freeze({

    science: [
      'scientific_curiosity',
      'analytical',
      'quantitative',
      'hands_on',
    ],


    engineering: [
      'analytical',
      'quantitative',
      'technology',
      'hands_on',
    ],


    'computer-technology': [
      'technology',
      'analytical',
      'quantitative',
      'scientific_curiosity',
    ],


    'healthcare-medical': [
      'scientific_curiosity',
      'social_helping',
      'analytical',
      'structure',
    ],


    commerce: [
      'quantitative',
      'analytical',
      'entrepreneurship',
      'structure',
    ],


    finance: [
      'quantitative',
      'analytical',
      'structure',
      'achievement',
    ],


    'business-management': [
      'leadership',
      'entrepreneurship',
      'verbal',
      'collaboration',
    ],


    entrepreneurship: [
      'entrepreneurship',
      'leadership',
      'adaptability',
      'creativity',
    ],


    'humanities-social-sciences': [
      'verbal',
      'social_helping',
      'analytical',
      'collaboration',
    ],


    'law-governance': [
      'verbal',
      'analytical',
      'leadership',
      'structure',
    ],


    'arts-design': [
      'creativity',
      'verbal',
      'independence',
      'adaptability',
    ],


    'performing-arts': [
      'creativity',
      'verbal',
      'achievement',
      'collaboration',
    ],


    sports: [
      'achievement',
      'leadership',
      'collaboration',
      'adaptability',
    ],


    'agriculture-environment': [
      'scientific_curiosity',
      'hands_on',
      'analytical',
      'social_helping',
    ],


    'vocational-practical-learning': [
      'hands_on',
      'technology',
      'independence',
      'adaptability',
    ],


    'hotel-tourism-hospitality': [
      'social_helping',
      'verbal',
      'collaboration',
      'leadership',
    ],

  });


export const STREAM_TRAIT_BOOSTS =
  Object.freeze({

    'science-pcm': [
      'analytical',
      'quantitative',
      'technology',
      'scientific_curiosity',
    ],

    'science-pcb': [
      'scientific_curiosity',
      'analytical',
      'social_helping',
      'structure',
    ],

    'science-pcmb': [
      'scientific_curiosity',
      'analytical',
      'quantitative',
      'adaptability',
    ],

    'science-pcm-computer-science': [
      'technology',
      'analytical',
      'quantitative',
      'scientific_curiosity',
    ],

    'science-pcb-psychology': [
      'scientific_curiosity',
      'social_helping',
      'verbal',
      'analytical',
    ],

    'science-biotechnology': [
      'scientific_curiosity',
      'analytical',
      'hands_on',
      'technology',
    ],

    'commerce-with-mathematics': [
      'quantitative',
      'analytical',
      'entrepreneurship',
      'achievement',
    ],

    'commerce-without-mathematics': [
      'entrepreneurship',
      'verbal',
      'leadership',
      'structure',
    ],

    'humanities-arts': [
      'verbal',
      'social_helping',
      'analytical',
      'creativity',
    ],

    'humanities-with-mathematics': [
      'verbal',
      'quantitative',
      'analytical',
      'structure',
    ],

    'humanities-with-psychology': [
      'social_helping',
      'verbal',
      'analytical',
      'scientific_curiosity',
    ],

    'humanities-with-legal-studies': [
      'verbal',
      'analytical',
      'leadership',
      'structure',
    ],

    'fine-arts-visual-arts': [
      'creativity',
      'verbal',
      'independence',
      'achievement',
    ],

    'performing-arts': [
      'creativity',
      'verbal',
      'achievement',
      'collaboration',
    ],

    agriculture: [
      'scientific_curiosity',
      'hands_on',
      'analytical',
      'social_helping',
    ],

    'home-science': [
      'social_helping',
      'scientific_curiosity',
      'structure',
      'hands_on',
    ],

    'vocational-skill-based': [
      'hands_on',
      'technology',
      'independence',
      'adaptability',
    ],

    'sports-physical-education': [
      'achievement',
      'leadership',
      'collaboration',
      'adaptability',
    ],

  });

export function getBoostedTraits(
  profile
) {
  return [
    ...new Set([
      ...(
        INTEREST_TRAIT_BOOSTS[
          profile.interestDirection
        ] ||
        []
      ),

      ...(
        STREAM_TRAIT_BOOSTS[
          profile.stream
        ] ||
        []
      ),

      ...(
        STREAM_TRAIT_BOOSTS[
          profile.targetStream
        ] ||
        []
      ),
    ]),
  ];
}


export function getTraitQuota({
  trait,
  stageConfig,
}) {
  return {
    trait,

    min:
      stageConfig
        .minQuestionsPerTrait,

    max:
      stageConfig
        .maxQuestionsPerTrait,
  };
}


export default CORE_TRAITS;

