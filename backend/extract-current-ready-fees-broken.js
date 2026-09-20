import fs from 'node:fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';

const INPUT =
  './fee-pilot-source-priority-ready.json';

const OUTPUT =
  './fee-priority-current-source-extraction.json';


/*
|--------------------------------------------------------------------------
| TEXT HELPERS
|--------------------------------------------------------------------------
*/

function cleanText(value) {
  return String(value ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


function isBankIdentifierLine(value) {
  const text =
    String(value ?? '')
      .toLowerCase();

  return (
    /a\/c\s*number/.test(text) ||
    /account\s*number/.test(text) ||
    /account\s*no/.test(text) ||
    /\bifsc\b/.test(text) ||
    /bank\s*account/.test(text) ||
    /bank\s*name/.test(text)
  );
}


/*
|--------------------------------------------------------------------------
| MONEY PARSER
|--------------------------------------------------------------------------
*/

function parseMoneyLine(
  value,
  options = {}
) {
  const original =
    String(value ?? '');

  if (
    isBankIdentifierLine(
      original
    )
  ) {
    return [];
  }

  const lower =
    original.toLowerCase();

  const feeContext =
    /fee|tuition|total|registration|admission|development|skills|caution|hostel|mess|security|deposit|semester|annual/.test(
      lower
    );

  const hasCurrency =
    /₹|rs\.?|inr/i.test(
      original
    );

  const hasCommaMoney =
    /\d{1,3}(?:,\d{2,3})+/.test(
      original
    );

  const hasSlashMoney =
    /\d{4,6}\s*\/-/.test(
      original
    );

  if (
    !feeContext &&
    !hasCurrency &&
    !hasCommaMoney &&
    !hasSlashMoney &&
    !options.allowPlainNumbers
  ) {
    return [];
  }

  const matches =
    original.match(
      /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{2,3})+|\d{3,6})(?:\.\d+)?\s*(?:\/-)?/gi
    ) || [];

  const values = [];

  for (
    const item
    of matches
  ) {
    const numeric =
      item
        .replace(
          /₹|Rs\.?|INR/gi,
          ''
        )
        .replace(
          /\/-/g,
          ''
        )
        .replace(
          /,/g,
          ''
        )
        .trim();

    const number =
      Number(
        numeric
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Reject academic years
    |--------------------------------------------------------------------------
    */

    if (
      Number.isInteger(
        number
      ) &&
      number >= 2000 &&
      number <= 2100
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Reject unrealistic fee amounts
    |--------------------------------------------------------------------------
    */

    if (
      number < 100 ||
      number > 2000000
    ) {
      continue;
    }

    values.push(
      number
    );
  }

  return [
    ...new Set(
      values
    )
  ];
}


function extractAmounts(
  value,
  options = {}
) {
  const text =
    String(value ?? '');

  /*
  |--------------------------------------------------------------------------
  | Process line-by-line.
  |
  | Important because a PDF may contain fee lines AND bank-account lines.
  |--------------------------------------------------------------------------
  */

  const lines =
    text
      .split(
        /\r?\n/
      )
      .map(
        line =>
          String(line)
            .trim()
      )
      .filter(Boolean);

  const values = [];

  if (
    lines.length <= 1
  ) {
    values.push(
      ...parseMoneyLine(
        text,
        options
      )
    );

  } else {
    for (
      const line
      of lines
    ) {
      values.push(
        ...parseMoneyLine(
          line,
          options
        )
      );
    }
  }

  return [
    ...new Set(
      values
    )
  ].sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


/*
|--------------------------------------------------------------------------
| TEXT SCORING
|--------------------------------------------------------------------------
*/

function scoreText(value) {
  const text =
    String(value ?? '');

  const lower =
    text.toLowerCase();

  let score = 0;

  if (
    /b\.?\s*tech|btech/.test(
      lower
    )
  ) {
    score += 25;
  }

  if (
    /tuition/.test(
      lower
    )
  ) {
    score += 20;
  }

  if (
    /fee structure|annual fee|semester fee|total fee/.test(
      lower
    )
  ) {
    score += 20;
  }

  if (
    /hostel/.test(
      lower
    )
  ) {
    score += 10;
  }

  if (
    /mess/.test(
      lower
    )
  ) {
    score += 10;
  }

  if (
    /admission/.test(
      lower
    )
  ) {
    score += 5;
  }

  if (
    /2026|2025/.test(
      lower
    )
  ) {
    score += 5;
  }

  if (
    extractAmounts(
      text
    ).length > 0
  ) {
    score += 5;
  }

  return score;
}


/*
|--------------------------------------------------------------------------
| HTTP FETCH
|--------------------------------------------------------------------------
*/

async function fetchSource(url) {
  const response =
    await axios.get(
      url,
      {
        timeout:
          60000,

        maxRedirects:
          8,

        responseType:
          'arraybuffer',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          Accept:
            'text/html,application/xhtml+xml,application/pdf,*/*'
        }
      }
    );

  const contentType =
    String(
      response.headers[
        'content-type'
      ] || ''
    )
      .toLowerCase();

  return {
    buffer:
      Buffer.from(
       