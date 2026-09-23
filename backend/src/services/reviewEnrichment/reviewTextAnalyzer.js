const ASPECT_RULES = {
  placements: [
    "placement",
    "placements",
    "package",
    "salary",
    "lpa",
    "recruiter",
    "recruiters",
    "company",
    "companies",
    "job offer",
    "job offers",
  ],

  faculty: [
    "faculty",
    "professor",
    "professors",
    "teacher",
    "teachers",
    "teaching",
    "lecturer",
  ],

  academics: [
    "academic",
    "academics",
    "curriculum",
    "syllabus",
    "coursework",
    "exam",
    "exams",
    "grading",
    "study",
  ],

  infrastructure: [
    "infrastructure",
    "laboratory",
    "laboratories",
    "lab ",
    "labs",
    "library",
    "classroom",
    "classrooms",
    "wifi",
    "campus facilities",
  ],

  hostel: [
    "hostel",
    "hostels",
    "mess",
    "room",
    "rooms",
    "warden",
    "accommodation",
  ],

  campus_life: [
    "campus life",
    "fest",
    "festival",
    "club",
    "clubs",
    "society",
    "societies",
    "student life",
    "sports",
    "cultural",
  ],

  administration: [
    "administration",
    "admin",
    "management",
    "office",
    "registration",
    "ragging",
    "bureaucracy",
    "permission",
  ],

  internships: [
    "internship",
    "internships",
    "intern",
    "industrial training",
    "training opportunity",
  ],

  value_for_money: [
    "fees",
    "fee",
    "cost",
    "expensive",
    "affordable",
    "worth",
    "value for money",
    "roi",
    "return on investment",
  ],

  location: [
    "location",
    "city",
    "transport",
    "railway",
    "airport",
    "metro",
    "nearby",
    "connectivity",
    "distance",
  ],
};


const POSITIVE_WORDS =
  new Set([
    "good",
    "great",
    "excellent",
    "amazing",
    "best",
    "strong",
    "helpful",
    "supportive",
    "friendly",
    "beautiful",
    "clean",
    "active",
    "decent",
    "impressive",
    "awesome",
    "positive",
    "affordable",
    "worth",
    "high",
    "better",
    "easy",
    "comfortable",
    "outstanding",
    "reputed",
  ]);


const NEGATIVE_WORDS =
  new Set([
    "bad",
    "poor",
    "worst",
    "terrible",
    "weak",
    "expensive",
    "dirty",
    "toxic",
    "negative",
    "problem",
    "problems",
    "issue",
    "issues",
    "difficult",
    "low",
    "worse",
    "crowded",
    "strict",
    "outdated",
    "slow",
    "ragging",
    "disappointing",
    "average",
  ]);


function clean(
  value
) {
  return String(
    value || ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function tokenize(
  text
) {
  return clean(
    text
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .split(
      /\s+/
    )
    .filter(
      Boolean
    );
}


export function
detectAspects(
  text
) {
  const normalized =
    clean(
      text
    )
      .toLowerCase();

  const result =
    [];

  for (
    const [
      aspect,
      keywords,
    ]
    of Object.entries(
      ASPECT_RULES
    )
  ) {
    const matched =
      keywords.some(
        keyword =>
          normalized.includes(
            keyword
          )
      );

    if (
      matched
    ) {
      result.push(
        aspect
      );
    }
  }

  return result;
}


export function
detectSentiment(
  text
) {
  const tokens =
    tokenize(
      text
    );

  let positive = 0;
  let negative = 0;

  for (
    const token
    of tokens
  ) {
    if (
      POSITIVE_WORDS.has(
        token
      )
    ) {
      positive++;
    }

    if (
      NEGATIVE_WORDS.has(
        token
      )
    ) {
      negative++;
    }
  }

  if (
    positive > 0 &&
    negative > 0 &&
    Math.abs(
      positive -
      negative
    ) <= 1
  ) {
    return "mixed";
  }

  if (
    positive >
    negative
  ) {
    return "positive";
  }

  if (
    negative >
    positive
  ) {
    return "negative";
  }

  return "neutral";
}


export function
analyzeReviewText(
  text
) {
  const cleaned =
    clean(
      text
    );

  return {
    text:
      cleaned,

    aspects:
      detectAspects(
        cleaned
      ),

    sentiment:
      detectSentiment(
        cleaned
      ),
  };
}
