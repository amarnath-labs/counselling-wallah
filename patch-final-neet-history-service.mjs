import fs from 'fs';

const file =
  './frontend/src/services/neetRecommendationService.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );

if (
  !src.includes(
    'export async function fetchNeetAdmissionHistory'
  )
) {
  src += `


export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category = 'Open',
  quota = '',
  rank,
}) {
  const params =
    new URLSearchParams();

  params.set(
    'collegeName',
    String(
      collegeName || ''
    )
  );

  params.set(
    'course',
    String(
      course || ''
    )
  );

  params.set(
    'category',
    String(
      category || 'Open'
    )
  );

  if (quota) {
    params.set(
      'quota',
      String(quota)
    );
  }

  if (rank) {
    params.set(
      'rank',
      String(rank)
    );
  }

  const response =
    await fetch(
      \`\${API_BASE_URL}/neet/history?\${params.toString()}\`
    );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
      \`NEET history API failed: \${response.status}\`
    );
  }

  return payload;
}
`;

  fs.writeFileSync(
    file,
    src,
    'utf8'
  );

  console.log(
    'Added fetchNeetAdmissionHistory().'
  );
} else {
  console.log(
    'fetchNeetAdmissionHistory already exists.'
  );
}
