import {
  API_BASE_URL,
} from './apiClient';


function normalizeCategory(
  value
) {
  const raw =
    String(
      value ||
      'General'
    )
      .trim();


  const key =
    raw
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ''
      );


  const map = {
    general:
      'Open',

    gen:
      'Open',

    open:
      'Open',

    ur:
      'Open',

    obcncl:
      'OBC',

    obc:
      'OBC',

    ews:
      'EWS',

    sc:
      'SC',

    st:
      'ST',
  };


  return (
    map[key] ||
    raw
  );
}


export async function fetchNeetRecommendations(
  profile = {},
  {
    limit = 100,
  } = {}
) {
  const rank =
    Number(
      profile?.rank
    );


  if (
    !Number.isInteger(
      rank
    ) ||
    rank <= 0
  ) {
    return [];
  }


  const courses =
    Array.isArray(
      profile?.medicalCourses
    )
      ? profile.medicalCourses
          .map(
            course =>
              String(
                course ||
                ''
              ).trim()
          )
          .filter(
            Boolean
          )
      : [];


  const params =
    new URLSearchParams();


  params.set(
    'rank',
    String(
      rank
    )
  );


  params.set(
    'year',
    String(
      Number(
        profile?.year ||
        profile?.examYear ||
        2026
      )
    )
  );


  params.set(
    'round',
    String(
      profile?.round ||
      1
    )
  );


  params.set(
    'category',
    normalizeCategory(
      profile?.category
    )
  );


  const rawCounsellingMode =
    String(
      profile?.counsellingMode ||
      ''
    )
      .trim()
      .toLowerCase();


  const neetCounsellingMode =
    rawCounsellingMode ===
      'state'
      ? 'state'
      : 'mcc';


  params.set(
    'counsellingMode',
    neetCounsellingMode
  );


  if (
    neetCounsellingMode ===
      'state'
  ) {

    const selectedState =
      String(
        profile?.prefState ||
        profile?.state ||
        ''
      )
        .trim();


    if (
      selectedState
    ) {
      params.set(
        'state',
        selectedState
      );
    }
  }


  params.set(
    'limit',
    String(
      limit
    )
  );


  if (
    courses.length
  ) {
    params.set(
      'courses',
      courses.join(',')
    );
  }


  const url =
    `${API_BASE_URL}/neet/recommendations?${params.toString()}`;


  console.log(
    '[NEET FRONTEND]',
    url
  );


  const response =
    await fetch(
      url
    );


  let payload =
    null;


  try {

    payload =
      await response.json();

  } catch {

    payload =
      null;
  }


  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error ||
      `NEET API failed: ${response.status}`
    );
  }


  const rows =
    Array.isArray(
      payload?.data
    )
      ? payload.data
      : [];


  console.log(
    '[NEET] Rows received:',
    rows.length
  );


  console.log(
    '[NEET] Meta:',
    payload?.meta ||
    null
  );


  return rows;
}



export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category,
  quota,
  rank,
  round,
}) {
  const params =
    new URLSearchParams();


  params.set(
    'collegeName',
    String(
      collegeName ||
      ''
    )
  );


  params.set(
    'course',
    String(
      course ||
      ''
    )
  );


  params.set(
    'category',
    String(
      category ||
      'Open'
    )
  );


  if (
    quota
  ) {
    params.set(
      'quota',
      String(
        quota
      )
    );
  }


  if (
    rank
  ) {
    params.set(
      'rank',
      String(
        rank
      )
    );
  }


  if (
    round
  ) {
    params.set(
      'round',
      String(
        round
      )
    );
  }


  const url =
    `${API_BASE_URL}/neet/history?${params.toString()}`;


  console.log(
    '[NEET HISTORY]',
    url
  );


  const response =
    await fetch(
      url
    );


  let payload =
    null;


  try {

    payload =
      await response.json();

  } catch {

    payload =
      null;
  }


  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error ||
      `NEET history API failed: ${response.status}`
    );
  }


  return payload;
}
