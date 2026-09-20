$ErrorActionPreference = "Stop"

$path = ".\src\routes\counselling.js"

if (-not (Test-Path $path)) {
    throw "counselling.js not found: $path"
}

$content = Get-Content $path -Raw

Write-Host ""
Write-Host "========================================"
Write-Host "PATCH REVIEW V2 - ROBUST VERSION"
Write-Host "========================================"
Write-Host ""

# ============================================================
# 1. REVIEW SERVICE IMPORT
# ============================================================

if (
    $content.Contains(
        "from '../services/reviewScoringService.js'"
    )
) {
    Write-Host "Review service import already exists"
}
else {

    $needle =
        "import { pool } from '../db/pool.js';"

    if (-not $content.Contains($needle)) {
        throw "pool import not found"
    }

    $replacement = @'
import { pool } from '../db/pool.js';
import {
  getCollegeReviewScore,
  getReviewComponent,
} from '../services/reviewScoringService.js';
'@

    $content =
        $content.Replace(
            $needle,
            $replacement
        )

    Write-Host "Review service import added"
}


# ============================================================
# 2. REVIEW INTELLIGENCE BLOCK
# ============================================================

if (
    $content.Contains(
        "REVIEW INTELLIGENCE V2"
    )
) {

    Write-Host "Review Intelligence V2 already exists"

}
else {

    # --------------------------------------------------------
    # Find LAST return res.json({
    # --------------------------------------------------------

    $responseNeedle =
        "      return res.json({"

    $responseIndex =
        $content.LastIndexOf(
            $responseNeedle
        )

    if ($responseIndex -lt 0) {
        throw "Final return res.json({ not found"
    }


    $reviewBlock = @'

      /*
      |--------------------------------------------------------------------------
      | REVIEW INTELLIGENCE V2
      |--------------------------------------------------------------------------
      |
      | Deterministic review scoring from review evidence tables.
      |
      | IMPORTANT:
      | - Admission bucket logic is untouched.
      | - Missing review data remains null.
      | - Review component maximum contribution = 10 points.
      |
      */

      const reviewScoreCache =
        new Map();


      async function getReviewDataForRow(
        row
      ) {

        const collegeId =
          row.college_id ??
          row.collegeId ??
          null;


        const branch =
          row.branch_name ??
          row.branchName ??
          row.branch ??
          null;


        if (!collegeId) {

          return {

            reviewScoreV2:
              null,

            sentimentScore:
              null,

            aggregateReviewScore:
              null,

            reviewConfidenceV2:
              0,

            reviewComponent:
              null,

            reviewEvidence:
              null,

          };
        }


        /*
        |--------------------------------------------------------------------------
        | CACHE KEY
        |--------------------------------------------------------------------------
        */

        const cacheKey =
          [
            collegeId,
            branch || '',
          ].join('::');


        if (
          reviewScoreCache.has(
            cacheKey
          )
        ) {

          return reviewScoreCache.get(
            cacheKey
          );
        }


        /*
        |--------------------------------------------------------------------------
        | CALCULATE
        |--------------------------------------------------------------------------
        */

        try {

          const reviewResult =
            await getCollegeReviewScore(
              pool,
              {
                collegeId,
                branch,
              }
            );


          const reviewComponent =
            getReviewComponent(
              reviewResult.reviewScore,
              10
            );


          const result = {

            reviewScoreV2:
              reviewResult.reviewScore,

            sentimentScore:
              reviewResult.sentimentScore,

            aggregateReviewScore:
              reviewResult.aggregateScore,

            reviewConfidenceV2:
              reviewResult.confidence,

            reviewComponent,

            reviewEvidence:
              reviewResult.evidence,

          };


          reviewScoreCache.set(
            cacheKey,
            result
          );


          return result;

        }
        catch (error) {

          console.error(
            '[REVIEW SCORE] failed:',
            {
              collegeId,
              branch,
              message:
                error.message,
            }
          );


          const fallback = {

            reviewScoreV2:
              null,

            sentimentScore:
              null,

            aggregateReviewScore:
              null,

            reviewConfidenceV2:
              0,

            reviewComponent:
              null,

            reviewEvidence:
              null,

          };


          reviewScoreCache.set(
            cacheKey,
            fallback
          );


          return fallback;
        }
      }


      /*
      |--------------------------------------------------------------------------
      | ATTACH REVIEW DATA
      |--------------------------------------------------------------------------
      */

      finalRows =
        await Promise.all(

          finalRows.map(

            async (row) => {

              const reviewData =
                await getReviewDataForRow(
                  row
                );


              return {

                ...row,

                ...reviewData,

              };
            }

          )

        );


'@

    $content =
        $content.Insert(
            $responseIndex,
            $reviewBlock
        )

    Write-Host "Review Intelligence V2 added"
}


# ============================================================
# 3. REVIEW WEIGHT IN RESPONSE META
# ============================================================

if (
    $content.Contains(
        "reviewWeight:"
    )
) {

    Write-Host "reviewWeight already exists"

}
else {

    # Find LAST budgetWeight, because response meta is near end.
    $budgetNeedle =
        "          budgetWeight:"

    $budgetIndex =
        $content.LastIndexOf(
            $budgetNeedle
        )

    if ($budgetIndex -lt 0) {
        throw "Final budgetWeight block not found"
    }


    # Find the comma after the value 7
    $afterBudget =
        $content.IndexOf(
            ",",
            $budgetIndex
        )

    if ($afterBudget -lt 0) {
        throw "budgetWeight value ending not found"
    }


    $insertPosition =
        $afterBudget + 1


    $weightBlock = @'


          reviewWeight:
            10,
'@


    $content =
        $content.Insert(
            $insertPosition,
            $weightBlock
        )

    Write-Host "reviewWeight: 10 added"
}


# ============================================================
# 4. SAVE
# ============================================================

Set-Content `
    -Path $path `
    -Value $content `
    -Encoding UTF8


Write-Host ""
Write-Host "========================================"
Write-Host "PATCH COMPLETE"
Write-Host "========================================"
Write-Host ""