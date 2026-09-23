import fs from "node:fs";

const path =
  "./src/services/reviewScoringServiceV3.js";

const backup =
  "./src/services/reviewScoringServiceV3.before-branch-conflict-fix.js";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );


if (
  original.includes(
    "branch_target_item_conflict"
  )
) {
  throw new Error(
    "Branch conflict fix already applied."
  );
}


const oldBlock = `    const evidenceBranch =
      canonicalizeBranch(
        targetBranch ||
        itemBranch
      );

    if (!evidenceBranch) {
      return {
        usable: false,
        reason:
          "branch_scope_missing_branch",
      };
    }

    if (
      evidenceBranch !==
      requestedBranch
    ) {
      return {
        usable: false,
        reason:
          "different_branch",
      };
    }

    return {
      usable: true,
      scope: "branch",
      scopeReason:
        branchVerified
          ? "verified_exact_branch"
          : "exact_branch_alias_match",
    };`;


const newBlock = `    /*
    |--------------------------------------------------------------------------
    | Resolve branch evidence safely
    |--------------------------------------------------------------------------
    |
    | target_branch and a VERIFIED item branch are two independent
    | pieces of branch evidence.
    |
    | If both exist and disagree, the observation is ambiguous and must
    | NOT be attributed to the requested branch.
    |
    |--------------------------------------------------------------------------
    */

    const targetEvidenceBranch =
      canonicalizeBranch(
        targetBranch
      );


    const verifiedItemBranch =
      branchVerified &&
      itemBranch
        ? canonicalizeBranch(
            itemBranch
          )
        : null;


    /*
    |--------------------------------------------------------------------------
    | Conflicting branch evidence
    |--------------------------------------------------------------------------
    */

    if (
      targetEvidenceBranch &&
      verifiedItemBranch &&
      targetEvidenceBranch !==
        verifiedItemBranch
    ) {
      return {
        usable: false,

        reason:
          "different_branch",

        scopeReason:
          "branch_target_item_conflict",
      };
    }


    /*
    |--------------------------------------------------------------------------
    | Prefer explicit target branch, otherwise VERIFIED item branch
    |--------------------------------------------------------------------------
    */

    const evidenceBranch =
      targetEvidenceBranch ||
      verifiedItemBranch;


    if (!evidenceBranch) {
      return {
        usable: false,

        reason:
          "branch_scope_missing_branch",
      };
    }


    if (
      evidenceBranch !==
      requestedBranch
    ) {
      return {
        usable: false,

        reason:
          "different_branch",
      };
    }


    return {
      usable: true,

      scope:
        "branch",

      scopeReason:
        verifiedItemBranch
          ? "verified_exact_branch"
          : "exact_branch_alias_match",
    };`;


if (
  !original.includes(
    oldBlock
  )
) {
  throw new Error(
    "Target branch eligibility block not found. No changes written."
  );
}


const updated =
  original.replace(
    oldBlock,
    newBlock
  );


if (
  updated ===
  original
) {
  throw new Error(
    "No replacement occurred."
  );
}


for (
  const token
  of [
    "targetEvidenceBranch",
    "verifiedItemBranch",
    "branch_target_item_conflict",
  ]
) {
  if (
    !updated.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  backup,
  original,
  "utf8"
);


fs.writeFileSync(
  path,
  updated,
  "utf8"
);


console.log(
  "SUCCESS: verified target/item branch conflict protection applied."
);

console.log(
  "Backup:",
  backup
);
