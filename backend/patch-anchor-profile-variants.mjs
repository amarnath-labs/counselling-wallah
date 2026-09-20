import fs from "node:fs";

const path =
  "./src/services/career/questionRetriever.js";

let content =
  fs.readFileSync(
    path,
    "utf8"
  );


const startMarker =
  "function buildAnchorPool(";

const endMarker =
  "function buildAdaptivePool(";


const start =
  content.indexOf(
    startMarker
  );

const end =
  content.indexOf(
    endMarker,
    start
  );


if (
  start === -1 ||
  end === -1 ||
  end <= start
) {
  throw new Error(
    "Could not locate buildAnchorPool/buildAdaptivePool boundaries. No changes made."
  );
}


const replacement = `function buildAnchorPool(
  candidates,
  profile,
  requiredNeutralCount = 1
) {
  /*
  |--------------------------------------------------------------------------
  | Stage/class neutral anchor pool + deterministic profile variants
  |--------------------------------------------------------------------------
  |
  | Important:
  |
  | - Anchors remain neutral.
  | - We DO NOT use hardEligible() here.
  | - Stream / subject / degree etc. do not make an anchor "relevant".
  |
  | Instead, the complete profile is used only as a deterministic seed
  | for choosing among multiple equally valid neutral anchor variants.
  |
  | Result:
  |
  | same exact profile
  |   -> same anchor variants
  |
  | same selections in another click order
  |   -> same anchor variants
  |
  | different profile combination
  |   -> different neutral anchor variants
  |
  | different stage/class
  |   -> repository class/stage isolation remains unchanged
  |--------------------------------------------------------------------------
  */


  /*
  |--------------------------------------------------------------------------
  | Canonical profile
  |--------------------------------------------------------------------------
  |
  | Arrays are sorted so:
  |
  | [Mathematics, Physics]
  |
  | and
  |
  | [Physics, Mathematics]
  |
  | represent the SAME profile.
  |--------------------------------------------------------------------------
  */

  function canonicalize(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value
        .map(
          canonicalize
        )
        .sort(
          (
            left,
            right
          ) =>
            JSON.stringify(
              left
            ).localeCompare(
              JSON.stringify(
                right
              )
            )
        );
    }


    if (
      value &&
      typeof value ===
        'object'
    ) {
      const result = {};


      for (
        const key
        of Object.keys(
          value
        ).sort()
      ) {
        if (
          value[key] ===
          undefined
        ) {
          continue;
        }


        result[key] =
          canonicalize(
            value[key]
          );
      }


      return result;
    }


    if (
      typeof value ===
      'string'
    ) {
      return value
        .trim()
        .toLowerCase();
    }


    return value;
  }


  const profileFingerprint =
    JSON.stringify(
      canonicalize(
        profile || {}
      )
    );


  /*
  |--------------------------------------------------------------------------
  | Stable 32-bit hash
  |--------------------------------------------------------------------------
  */

  function hash32(
    text
  ) {
    let hash =
      2166136261;


    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );


      hash =
        Math.imul(
          hash,
          16777619
        );
    }


    return hash >>> 0;
  }


  function anchorVariantScore(
    question
  ) {
    return (
      hash32(
        \`\${profileFingerprint}|\${question.id}\`
      ) /
      4294967295
    );
  }


  const prepared =
    candidates.map(
      question => {
        /*
        | Neutrality is evaluated AFTER
        | question profile/domain mapping.
        */

        const profileMap =
          buildQuestionProfileMap(
            question
          );


        const mappedQuestion = {
          ...question,

          profileMap,

          inferredDomains:
            profileMap.domains,

          metadataTier:
            0,

          classSpecificity:
            classSpecificity(
              question,
              profile
            ),
        };


        const neutral =
          isNeutralAnchorQuestion(
            mappedQuestion
          );


        const variantScore =
          anchorVariantScore(
            mappedQuestion
          );


        return {
          ...mappedQuestion,

          /*
          | Keep this available for diagnostics.
          */
          anchorVariantScore:
            variantScore,

          /*
          | Neutral questions remain strongly preferred.
          |
          | Small deterministic variation is intentionally
          | introduced only between valid neutral variants.
          |
          | It does NOT turn profile-specific questions
          | into anchors.
          */
          contextSpecificity:
            neutral
              ? (
                  0.78 +
                  variantScore *
                    0.22
                )
              : 0.05,
        };
      }
    );


  const neutral =
    prepared.filter(
      question =>
        isNeutralAnchorQuestion(
          question
        )
    );


  /*
  |--------------------------------------------------------------------------
  | Deterministic variant pool by trait
  |--------------------------------------------------------------------------
  |
  | We keep several variants per trait instead of choosing only one.
  |
  | This preserves the existing ranker's ability to handle:
  | - broad trait coverage
  | - uncertainty
  | - diversity
  | - priority
  |
  | while preventing every same-stage profile from receiving the exact
  | same candidate universe.
  |--------------------------------------------------------------------------
  */

  const byTrait =
    new Map();


  for (
    const question
    of neutral
  ) {
    const trait =
      String(
        question.trait ||
        'unknown'
      );


    if (
      !byTrait.has(
        trait
      )
    ) {
      byTrait.set(
        trait,
        []
      );
    }


    byTrait
      .get(
        trait
      )
      .push(
        question
      );
  }


  const diversifiedNeutral =
    [];


  const MAX_VARIANTS_PER_TRAIT =
    8;


  for (
    const questions
    of byTrait.values()
  ) {
    questions
      .sort(
        (
          left,
          right
        ) => {
          const scoreDifference =
            (
              right.anchorVariantScore ||
              0
            ) -
            (
              left.anchorVariantScore ||
              0
            );


          if (
            scoreDifference !==
            0
          ) {
            return scoreDifference;
          }


          return String(
            left.id
          ).localeCompare(
            String(
              right.id
            )
          );
        }
      );


    diversifiedNeutral.push(
      ...questions.slice(
        0,
        MAX_VARIANTS_PER_TRAIT
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Safe fallback
  |--------------------------------------------------------------------------
  */

  if (
    diversifiedNeutral.length >=
    requiredNeutralCount
  ) {
    return diversifiedNeutral;
  }


  if (
    neutral.length >=
    requiredNeutralCount
  ) {
    return neutral;
  }


  return prepared;
}


`;

content =
  content.slice(
    0,
    start
  ) +
  replacement +
  content.slice(
    end
  );


fs.writeFileSync(
  path,
  content,
  "utf8"
);


console.log("");
console.log(
  "ANCHOR PROFILE-VARIANT PATCH COMPLETE"
);

console.log(
  "Neutral anchors preserved."
);

console.log(
  "Same profile -> deterministic same variants."
);

console.log(
  "Different profile -> different neutral variants."
);

console.log(
  "Array selection order -> ignored."
);

console.log("");
