const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://counsellingwallah-backend.onrender.com/api';


/*
|--------------------------------------------------------------------------
| API REQUEST
|--------------------------------------------------------------------------
*/

async function request(path) {
  console.log(
    '[API REQUEST]',
    `${API_BASE}${path}`
  );

  const response =
    await fetch(
      `${API_BASE}${path}`
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  console.log(
    '[API STATUS]',
    response.status
  );

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `API request failed: ${response.status}`
    );
  }

  return data;
}


/*
|--------------------------------------------------------------------------
| COUNSELLING EVENTS
|--------------------------------------------------------------------------
*/

export async function getCounsellingEvents(
  examId
) {
  const params =
    new URLSearchParams();

  if (examId) {
    params.set(
      'examId',
      examId
    );
  }

  const query =
    params.toString();

  const response =
    await request(
      `/counselling/events${
        query
          ? `?${query}`
          : ''
      }`
    );

  return response?.data || [];
}


/*
|--------------------------------------------------------------------------
| NORMALIZE UPTAC ROW
|--------------------------------------------------------------------------
*/

function normalizeUptacRow(
  row,
  profile = {}
) {

  const rank =
    Number(
      profile.rank || 0
    );

  const closingRank =
    Number(
      row.closingRank || 0
    );

  const openingRank =
    Number(
      row.openingRank || 0
    );

  const fees =
    Number(
      row.fees || 0
    );

  const medianPackage =
    Number(
      row.medianPackage || 0
    );

  const averagePackage =
    Number(
      row.averagePackage || 0
    );

  const highestPackage =
    Number(
      row.highestPackage || 0
    );


  /*
  |--------------------------------------------------------------------------
  | RANK BUCKET
  |--------------------------------------------------------------------------
  */

  let bucket =
    'dream';

  if (
    closingRank > 0 &&
    rank > 0
  ) {

    const ratio =
      rank / closingRank;

    if (
      ratio <= 0.35
    ) {
      bucket =
        'backup';

    } else if (
      ratio <= 0.65
    ) {
      bucket =
        'safe';

    } else if (
      ratio <= 0.95
    ) {
      bucket =
        'target';

    } else {
      bucket =
        'dream';
    }
  }


  /*
  |--------------------------------------------------------------------------
  | BRANCH MATCHING
  |--------------------------------------------------------------------------
  */

  const branchName =
    String(
      row.branch_name || ''
    );

  const preferredBranches =
    Array.isArray(
      profile.branches
    )
      ? profile.branches
      : [];

  const branchLower =
    branchName.toLowerCase();

  const branchMatches =
    preferredBranches.length === 0 ||
    preferredBranches.some(
      (branch) => {

        const b =
          String(
            branch || ''
          )
            .toLowerCase()
            .trim();


        if (
          b === 'cse' ||
          b === 'computer science'
        ) {
          return branchLower.includes(
            'computer science'
          );
        }


        if (
          b === 'it'
        ) {
          return branchLower.includes(
            'information technology'
          );
        }


        if (
          b === 'ece'
        ) {
          return (
            branchLower.includes(
              'electronics'
            ) &&
            branchLower.includes(
              'communication'
            )
          );
        }


        if (
          b === 'ee'
        ) {
          return branchLower.includes(
            'electrical engineering'
          );
        }


        if (
          b === 'me'
        ) {
          return branchLower.includes(
            'mechanical engineering'
          );
        }


        return branchLower.includes(
          b
        );
      }
    );


  const branchScore =
    branchMatches
      ? 95
      : 62;


  /*
  |--------------------------------------------------------------------------
  | RANK SCORE
  |--------------------------------------------------------------------------
  */

  let rankScore =
    70;

  if (
    rank > 0 &&
    closingRank > 0
  ) {

    const ratio =
      rank / closingRank;

    rankScore =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 -
              Math.abs(
                ratio - 0.6
              ) *
                70
          )
        )
      );
  }


  /*
  |--------------------------------------------------------------------------
  | BUDGET SCORE
  |--------------------------------------------------------------------------
  */

  const budget =
    Number(
      profile.budget || 0
    );

  const budgetScore =
    budget <= 0
      ? 75
      : fees <= 0
      ? 75
      : fees <= budget
      ? 92
      : fees <=
        budget * 1.25
      ? 68
      : 40;


  /*
  |--------------------------------------------------------------------------
  | LOCATION SCORE
  |--------------------------------------------------------------------------
  */

  const preferredState =
    profile.prefState ||
    '';

  const homeState =
    profile.homeState ||
    '';

  let locationScore =
    82;

  if (
    preferredState &&
    preferredState !== 'Any'
  ) {

    locationScore =
      String(
        row.state || ''
      ).toLowerCase() ===
      String(
        preferredState
      ).toLowerCase()
        ? 96
        : 60;

  } else if (
    homeState &&
    String(
      row.state || ''
    ).toLowerCase() ===
      String(
        homeState
      ).toLowerCase()
  ) {

    locationScore =
      96;
  }


  /*
  |--------------------------------------------------------------------------
  | OVERALL SCORE
  |--------------------------------------------------------------------------
  */

  const overall =
    Math.round(
      rankScore * 0.4 +
      branchScore * 0.25 +
      budgetScore * 0.2 +
      locationScore * 0.15
    );


  /*
  |--------------------------------------------------------------------------
  | FINAL NORMALIZED OBJECT
  |--------------------------------------------------------------------------
  */

  return {

    collegeId:
      row.college_id,

    college: {

      id:
        row.college_id,

      name:
        row.college_name ||
        'Unknown College',

      city:
        row.city || '',

      state:
        row.state || '',

      type:
        row.type ||
        'Unknown',
    },


    branch: {

      id:
        row.branch_id,

      name:
        branchName,

      openingRank:
        openingRank,

      closingRank:
        closingRank,

      fees:
        fees,

      medianPackage:
        medianPackage,

      averagePackage:
        averagePackage,

      highestPackage:
        highestPackage,

      placement:
        Number(
          row.placementRate ||
          row.placement_rate ||
          0
        ),
    },


    bucket,

    overall,


    breakdown: {

      rank:
        rankScore,

      branch:
        branchScore,

      budget:
        budgetScore,

      location:
        locationScore,
    },


    /*
    |--------------------------------------------------------------------------
    | ORIGINAL COUNSELLING DATA
    |--------------------------------------------------------------------------
    */

    counselling: {

      year:
        Number(
          row.year || 2025
        ),

      round:
        row.round,

      category:
        row.category,

      quota:
        row.quota,

      gender:
        row.gender,

      openingRank:
        openingRank,

      closingRank:
        closingRank,

      source:
        row.source,

      isVerified:
        Boolean(
          row.isVerified
        ),

      verificationStatus:
        row.verificationStatus,

      sourceUrl:
        row.sourceUrl,

      retrievedAt:
        row.retrievedAt,
    },
  };
}


/*
|--------------------------------------------------------------------------
| GET COUNSELLING RESULTS
|--------------------------------------------------------------------------
*/

export async function getCounsellingResults({
  examId = 'jee-main',
  rank,
  category = 'OPEN',
  year,
  round = 1,
  quota,
  gender,
  homeState,
  profile,
}) {

  if (
    rank === undefined ||
    rank === null ||
    rank === ''
  ) {

    throw new Error(
      'Rank is required'
    );
  }


  const params =
    new URLSearchParams();


  params.set(
    'examId',
    examId
  );


  params.set(
    'rank',
    String(rank)
  );


  params.set(
    'category',
    category
  );


  params.set(
    'year',
    String(
      year ||
      (
        examId === 'uptac'
          ? 2025
          : 2026
      )
    )
  );


  params.set(
    'round',
    String(round)
  );


  /*
  |--------------------------------------------------------------------------
  | UPTAC
  |--------------------------------------------------------------------------
  |
  | Do NOT send gender/homeState/quota
  | as strict backend filters.
  |
  */

  if (
    examId !== 'uptac'
  ) {

    if (quota) {
      params.set(
        'quota',
        quota
      );
    }

    if (gender) {
      params.set(
        'gender',
        gender
      );
    }

    if (homeState) {
      params.set(
        'homeState',
        homeState
      );
    }
  }


  const url =
    `/counselling/results?${params.toString()}`;


  console.log(
    '[COUNSELLING] Request URL:',
    `${API_BASE}${url}`
  );


  return request(url);
}


/*
|--------------------------------------------------------------------------
| FETCH + NORMALIZE COUNSELLING RESULTS
|--------------------------------------------------------------------------
*/

export async function fetchCounsellingResults(
  options = {}
) {

  const response =
    await getCounsellingResults(
      options
    );


  /*
  |--------------------------------------------------------------------------
  | DEBUG
  |--------------------------------------------------------------------------
  */

  console.log(
    '[UPTAC] API response:',
    response
  );


  /*
  |--------------------------------------------------------------------------
  | EXTRACT RAW ROWS
  |--------------------------------------------------------------------------
  |
  | Backend response:
  |
  | {
  |   data: [...],
  |   meta: {...}
  | }
  |
  |--------------------------------------------------------------------------
  */

  let rawRows = [];


  /*
  | Case 1:
  | API directly returns array
  */

  if (
    Array.isArray(
      response
    )
  ) {

    rawRows =
      response;
  }


  /*
  | Case 2:
  | Normal backend response:
  |
  | response.data = [...]
  */

  else if (
    response &&
    Array.isArray(
      response.data
    )
  ) {

    rawRows =
      response.data;
  }


  /*
  | Case 3:
  | response.rows = [...]
  */

  else if (
    response &&
    Array.isArray(
      response.rows
    )
  ) {

    rawRows =
      response.rows;
  }


  /*
  | Case 4:
  | response.data.data = [...]
  */

  else if (
    response &&
    response.data &&
    Array.isArray(
      response.data.data
    )
  ) {

    rawRows =
      response.data.data;
  }


  console.log(
    '[UPTAC] Raw API rows:',
    rawRows.length
  );


  console.log(
    '[UPTAC] First raw row:',
    rawRows[0]
  );


  /*
  |--------------------------------------------------------------------------
  | NO DATA
  |--------------------------------------------------------------------------
  */

  if (
    rawRows.length === 0
  ) {

    console.warn(
      '[UPTAC] API returned zero rows.',
      {
        examId:
          options.examId,

        rank:
          options.rank,

        category:
          options.category,

        year:
          options.year,

        round:
          options.round,
      }
    );

    return [];
  }


  /*
  |--------------------------------------------------------------------------
  | UPTAC NORMALIZATION
  |--------------------------------------------------------------------------
  */

  if (
    String(
      options.examId || ''
    )
      .toLowerCase() ===
    'uptac'
  ) {

    const normalized =
      rawRows
        .map(
          (row) => {

            try {

              return normalizeUptacRow(
                row,
                options
              );

            } catch (error) {

              console.error(
                '[UPTAC] Row normalization failed:',
                error,
                row
              );

              return null;
            }
          }
        )
        .filter(Boolean);


    console.log(
      '[UPTAC] Normalized rows:',
      normalized.length
    );


    console.log(
      '[UPTAC] First normalized row:',
      normalized[0]
    );


    return normalized;
  }


  /*
  |--------------------------------------------------------------------------
  | OTHER EXAMS
  |--------------------------------------------------------------------------
  */

  return rawRows;
}


/*
|--------------------------------------------------------------------------
| COUNSELLING EVENTS
|--------------------------------------------------------------------------
*/

export async function fetchCounsellingEvents(
  examId
) {

  return getCounsellingEvents(
    examId
  );
}


/*
|--------------------------------------------------------------------------
| DOCUMENTS
|--------------------------------------------------------------------------
*/

export function getDocuments(
  profile,
  examName
) {

  return [

    'Class 10 Certificate & Marksheet',

    'Class 12 Certificate & Marksheet',

    `${examName} Rank / Score Card`,

    profile?.category !== 'General'
      ? `${profile?.category} Category Certificate`
      : null,

    'Domicile / Residence Certificate',

    'Income Certificate (if applicable)',

    'Government ID Proof (Aadhaar/Passport)',

    'Passport-size Photographs (multiple)',

    'Medical Fitness Certificate (where required)',

  ].filter(Boolean);
}