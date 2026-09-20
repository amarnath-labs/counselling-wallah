import 'dotenv/config';

import axios from 'axios';

const URL =
  'https://www.nirfindia.org/Rankings/2025/EngineeringRankingALL.html';

const TARGET =
  'National Institute of Technology Agartala';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF SOURCE ID SEARCH');
  console.log('=======================================');
  console.log('');

  const response =
    await axios.get(
      URL,
      {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }
    );

  const html =
    String(response.data || '');

  console.log(
    '[SEARCH] HTML length:',
    html.length
  );

  const targetIndex =
    html
      .toLowerCase()
      .indexOf(
        TARGET.toLowerCase()
      );

  if (targetIndex < 0) {
    throw new Error(
      'Target college not found in raw HTML'
    );
  }

  console.log(
    '[SEARCH] Target found at index:',
    targetIndex
  );

  const start =
    Math.max(
      0,
      targetIndex - 1500
    );

  const end =
    Math.min(
      html.length,
      targetIndex + 3000
    );

  const nearby =
    html.slice(
      start,
      end
    );

  console.log('');
  console.log('---------------------------------------');
  console.log('RAW HTML AROUND COLLEGE');
  console.log('---------------------------------------');

  console.log(
    nearby
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('IR CODE SEARCH NEARBY');
  console.log('---------------------------------------');

  const ids =
    nearby.match(
      /IR-[A-Z]-[A-Z]-\d+/g
    ) || [];

  console.log(
    'IDs found:',
    [...new Set(ids)]
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  (error) => {
    console.error(
      '[SEARCH] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);
