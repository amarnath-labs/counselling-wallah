import 'dotenv/config';

import axios from 'axios';
import * as cheerio from 'cheerio';

const NIRF_URL =
  'https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF HTML STRUCTURE INSPECTOR');
  console.log('=======================================');
  console.log('');

  console.log(
    '[INSPECT] Downloading NIRF page...'
  );

  const response =
    await axios.get(
      NIRF_URL,
      {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0',
        },
      }
    );

  console.log(
    '[INSPECT] HTTP:',
    response.status
  );

  const $ =
    cheerio.load(
      response.data
    );

  const rows =
    $('table tbody tr');

  console.log(
    '[INSPECT] Table rows:',
    rows.length
  );

  console.log('');

  let found = 0;

  rows.each(
    (rowIndex, element) => {
      if (found >= 3) {
        return false;
      }

      const cells =
        $(element).find('td');

      if (!cells.length) {
        return;
      }

      const firstCell =
        $(cells[0])
          .text()
          .replace(/\s+/g, ' ')
          .trim();

      if (
        !firstCell.startsWith(
          'IR-E-'
        )
      ) {
        return;
      }

      found++;

      console.log('');
      console.log(
        '======================================='
      );

      console.log(
        `ROW ${found}`
      );

      console.log(
        '======================================='
      );

      console.log(
        'CELL COUNT:',
        cells.length
      );

      console.log('');

      cells.each(
        (cellIndex, cell) => {
          const text =
            $(cell)
              .text()
              .replace(/\s+/g, ' ')
              .trim();

          console.log(
            `CELL [${cellIndex}]`
          );

          console.log(
            JSON.stringify(text)
          );

          console.log(
            '---------------------------------------'
          );
        }
      );
    }
  );

  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'INSPECTION COMPLETE'
  );

  console.log(
    '======================================='
  );
}

main().catch(
  (error) => {
    console.error(
      '[INSPECT] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);