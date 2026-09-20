import fs from 'node:fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';

const INPUT =
  './fee-pilot-source-priority-ready.json';

const OUTPUT =
  './fee-priority-current-source-extraction.json';

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

  return /a\/c\s*(?:number|no)|account\s*(?:number|no)|\bifsc\b|bank\s*account|bank\s*name/.test(
    text
  );
}

function parseMoneyLine(value) {
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
    /\d{3,6}\s*\/-/.test(
      original
    );

  if (
    !feeContext &&
    !hasCurrency &&
    !hasCommaMoney &&
    !hasSlashMoney
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

    if (
      Number.isInteger(
        number
      ) &&
      number >= 2000 &&
      number <= 2100
    ) {
      continue;
    }

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

function extractAmounts(value) {
  const lines =
    String(value ?? '')
      .split(/\r?\n/)
      .filter(Boolean);

  const values = [];

  for (
    const line
    of lines.length
      ? lines
      : ['']
  ) {
    values.push(
      ...parseMoneyLine(
        line
      )
    );
  }

  return [
    ...new Set(
      values
    )
  ].sort(
    (a, b) =>
      a - b
  );
}

function scoreText(value) {
  const text =
    String(value ?? '')
      .toLowerCase();

  let score = 0;

  if (
    /b\.?\s*tech|btech/.test(
      text
    )
  ) {
    score += 25;
  }

  if (
    /tuition/.test(
      text
    )
  ) {
    score += 20;
  }

  if (
    /fee structure|annual fee|semester fee|total fee/.test(
      text
    )
  ) {
    score += 20;
  }

  if (
    /hostel/.test(
      text
    )
  ) {
    score += 10;
  }

  if (
    /mess/.test(
      text
    )
  ) {
    score += 10;
  }

  if (
    /admission/.test(
      text
    )
  ) {
    score += 5;
  }

  if (
    /2026|2025/.test(
      text
    )
  ) {
    score += 5;
  }

  if (
    extractAmounts(
      value
    ).length
  ) {
    score += 5;
  }

  return score;
}

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

  return {
    buffer:
      Buffer.from(
        response.data
      ),

    contentType:
      String(
        response.headers[
          'content-type'
        ] || ''
      ).toLowerCase()
  };
}

function extractHtmlStructured(html) {
  const $ =
    cheerio.load(
      html
    );

  const tables = [];

  $('table').each(
    (
      tableIndex,
      table
    ) => {
      const rows = [];

      $(table)
        .find('tr')
        .each(
          (
            _,
            tr
          ) => {
            const cells =
              $(tr)
                .find(
                  'th,td'
                )
                .map(
                  (
                    __,
                    cell
                  ) =>
                    cleanText(
                      $(cell)
                        .text()
                    )
                )
                .get();

            if (
              cells.length
            ) {
              rows.push(
                cells
              );
            }
          }
        );

      const flat =
        rows
          .flat()
          .join(
            ' | '
          );

      const score =
        scoreText(
          flat
        );

      if (
        score > 0
      ) {
        tables.push({
          type:
            'table',

          table_index:
            tableIndex,

          score,

          rows,

          amounts:
            extractAmounts(
              flat
            )
        });
      }
    }
  );

  tables.sort(
    (a, b) =>
      b.score -
      a.score
  );

  const bodyText =
    cleanText(
      $('body')
        .text()
    );

  const textBlocks = [];

  $('body *').each(
    (
      _,
      element
    ) => {
      const text =
        cleanText(
          $(element)
            .clone()
            .children()
            .remove()
            .end()
            .text()
        );

      if (
        !text ||
        text.length < 8
      ) {
        return;
      }

      const score =
        scoreText(
          text
        );

      if (
        score >= 10
      ) {
        textBlocks.push({
          text,

          score,

          amounts:
            extractAmounts(
              text
            )
        });
      }
    }
  );

  textBlocks.sort(
    (a, b) =>
      b.score -
      a.score
  );

  return {
    source_type:
      'html',

    text:
      bodyText,

    raw_text:
      html,

    lines:
      bodyText
        ? [bodyText]
        : [],

    tables:
      tables.slice(
        0,
        30
      ),

    text_blocks:
      textBlocks.slice(
        0,
        150
      )
  };
}

async function extractPdfStructured(
  buffer
) {
  const parser =
    new PDFParse({
      data:
        buffer
    });

  try {
    const result =
      await parser.getText();

    const rawText =
      String(
        result.text ||
        ''
      );

    const text =
      cleanText(
        rawText
      );

    const lines =
      rawText
        .split(
          /\r?\n/
        )
        .map(
          cleanText
        )
        .filter(
          Boolean
        );

    const textBlocks =
      lines
        .map(
          (
            line,
            lineIndex
          ) => ({
            line_index:
              lineIndex,

            text:
              line,

            score:
              scoreText(
                line
              ),

            amounts:
              extractAmounts(
                line
              )
          })
        )
        .filter(
          row =>
            row.score >= 5 ||
            row.amounts.length > 0
        );

    return {
      source_type:
        'pdf',

      text,

      raw_text:
        rawText,

      lines,

      tables:
        [],

      text_blocks:
        textBlocks.slice(
          0,
          500
        )
    };

  } finally {
    await parser.destroy();
  }
}

async function extractOne(row) {
  const url =
    row.fee_source_url;

  if (!url) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      extraction_status:
        'SKIPPED_NO_SOURCE'
    };
  }

  const source =
    await fetchSource(
      url
    );

  const looksPdf =
    source.contentType.includes(
      'application/pdf'
    ) ||
    /\.pdf(?:$|\?)/i.test(
      url
    );

  const extracted =
    looksPdf
      ? await extractPdfStructured(
          source.buffer
        )
      : extractHtmlStructured(
          source.buffer
            .toString(
              'utf8'
            )
        );

  const text =
    extracted.text ||
    '';

  const amountSource =
    extracted.raw_text ||
    text;

  return {
    college_id:
      row.college_id,

    college_name:
      row.college_name,

    academic_year:
      row.academic_year,

    source_url:
      url,

    official_website:
      row.official_website ||
      null,

    source_type:
      extracted.source_type,

    content_type:
      source.contentType,

    text_characters:
      text.length,

    text,

    raw_text:
      extracted.raw_text ||
      null,

    lines:
      extracted.lines ||
      [],

    btech_detected:
      /b\.?\s*tech|btech/i.test(
        text
      ),

    tuition_detected:
      /tuition/i.test(
        text
      ),

    hostel_detected:
      /hostel/i.test(
        text
      ),

    mess_detected:
      /mess/i.test(
        text
      ),

    amounts:
      extractAmounts(
        amountSource
      ),

    tables:
      extracted.tables ||
      [],

    text_blocks:
      extracted.text_blocks ||
      [],

    extraction_status:
      text.length
        ? 'EXTRACTED'
        : 'EMPTY_TEXT'
  };
}

async function main() {
  console.log(
    '\n======================================='
  );

  console.log(
    'MASTER CURRENT FEE SOURCE EXTRACTOR V2'
  );

  console.log(
    '=======================================\n'
  );

  const raw =
    await fs.readFile(
      INPUT,
      'utf8'
    );

  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ''
      )
    );

  if (
    !Array.isArray(
      rows
    )
  ) {
    throw new Error(
      'Priority source input must contain an array.'
    );
  }

  const ready =
    rows.filter(
      row =>
        row.discovery_status ===
          'SOURCE_FOUND_CURRENT' &&
        row.fee_source_url
    );

  console.log(
    'Current-ready sources:',
    ready.length,
    '\n'
  );

  const results = [];

  for (
    let i = 0;
    i < ready.length;
    i++
  ) {
    const row =
      ready[i];

    console.log(
      `[${i + 1}/${ready.length}] ${row.college_name}`
    );

    try {
      const result =
        await extractOne(
          row
        );

      results.push(
        result
      );

      console.log(
        '[OK]',
        result.source_type,
        'chars:',
        result.text_characters,
        'amounts:',
        result.amounts?.length ||
        0,
        'blocks:',
        result.text_blocks?.length ||
        0,
        'lines:',
        result.lines?.length ||
        0
      );

    } catch (error) {
      results.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        academic_year:
          row.academic_year,

        source_url:
          row.fee_source_url,

        extraction_status:
          'FAILED',

        error:
          error.message
      });

      console.log(
        '[FAILED]',
        error.message
      );
    }

    console.log('');
  }

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    'utf8'
  );

  console.log(
    '---------------------------------------'
  );

  console.log(
    'EXTRACTION SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.table(
    results.map(
      row => ({
        college:
          row.college_name,

        type:
          row.source_type ||
          null,

        status:
          row.extraction_status,

        chars:
          row.text_characters ||
          0,

        amounts:
          row.amounts?.length ||
          0,

        blocks:
          row.text_blocks?.length ||
          0,

        lines:
          row.lines?.length ||
          0,

        btech:
          row.btech_detected ??
          null,

        tuition:
          row.tuition_detected ??
          null,

        hostel:
          row.hostel_detected ??
          null,

        mess:
          row.mess_detected ??
          null
      })
    )
  );

  console.log(
    '\nSaved:',
    OUTPUT
  );

  console.log(
    '\nDATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      'FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);