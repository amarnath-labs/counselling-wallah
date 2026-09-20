import fs from 'node:fs';
import axios from 'axios';

const INPUT =
  './btech-fee-source-discovery-targets.json';

const OUTPUT =
  './btech-fee-source-validation.json';

const FAILED =
  './btech-fee-source-validation-failed.json';

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function normalizeContentType(value) {
  return String(
    value || ''
  )
    .toLowerCase()
    .split(';')[0]
    .trim();
}

function looksLikePdf(buffer) {
  if (!buffer || buffer.length < 5) {
    return false;
  }

  return (
    buffer
      .subarray(0, 5)
      .toString('ascii') === '%PDF-'
  );
}

function htmlText(buffer) {
  return Buffer
    .from(buffer)
    .toString('utf8')
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      ' '
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      ' '
    )
    .replace(
      /<[^>]+>/g,
      ' '
    )
    .replace(
      /&nbsp;/gi,
      ' '
    )
    .replace(
      /&amp;/gi,
      '&'
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

function analyzeText(text) {
  const lower =
    String(text || '')
      .toLowerCase();

  return {
    btech:
      /\bb\.?\s*tech\b|\bbtech\b|bachelor of technology/.test(
        lower
      ),

    fee:
      /fee structure|tuition fee|institute fee|hostel fee|academic fee/.test(
        lower
      ),

    semester:
      /semester|1st sem|2nd sem|3rd sem|4th sem|5th sem|6th sem|7th sem|8th sem/.test(
        lower
      ),

    hostel:
      /hostel|hosteller|seat rent|room rent/.test(
        lower
      ),

    mess:
      /mess|dining|food charge/.test(
        lower
      ),

    income:
      /income|1 lakh|5 lakh|100000|500000/.test(
        lower
      )
  };
}

async function validateTarget(target) {
  const url =
    target.current_source_url;

  if (!url) {
    return {
      college_id:
        target.college_id,

      college_name:
        target.college_name,

      original_url:
        null,

      final_url:
        null,

      status:
        'NO_URL',

      http_status:
        null,

      content_type:
        null,

      bytes:
        0,

      source_kind:
        null,

      signals:
        null
    };
  }

  const response =
    await axios.get(
      url,
      {
        responseType:
          'arraybuffer',

        timeout:
          30000,

        maxRedirects:
          8,

        validateStatus:
          () => true,

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          'Accept':
            'text/html,application/pdf,application/xhtml+xml,*/*'
        }
      }
    );

  const buffer =
    Buffer.from(
      response.data || []
    );

  const contentType =
    normalizeContentType(
      response.headers[
        'content-type'
      ]
    );

  const finalUrl =
    response.request
      ?.res
      ?.responseUrl ||
    url;

  const pdf =
    looksLikePdf(buffer) ||
    contentType ===
      'application/pdf';

  let sourceKind =
    'unknown';

  let signals = {
    btech: false,
    fee: false,
    semester: false,
    hostel: false,
    mess: false,
    income: false
  };

  if (pdf) {
    sourceKind =
      'pdf';

  } else if (
    contentType.includes(
      'text/html'
    ) ||
    contentType.includes(
      'application/xhtml'
    )
  ) {
    sourceKind =
      'html';

    const text =
      htmlText(buffer);

    signals =
      analyzeText(text);
  }

  let status =
    'WEAK';

  if (
    response.status >= 200 &&
    response.status < 300
  ) {
    if (pdf) {
      status =
        'USABLE_PDF';

    } else if (
      sourceKind ===
        'html' &&
      (
        signals.btech ||
        signals.fee
      )
    ) {
      status =
        'USABLE_HTML';

    } else {
      status =
        'WEAK';
    }

  } else {
    status =
      'HTTP_FAILED';
  }

  return {
    college_id:
      target.college_id,

    college_name:
      target.college_name,

    original_status:
      target.current_status,

    original_url:
      url,

    final_url:
      finalUrl,

    status,

    http_status:
      response.status,

    content_type:
      contentType,

    bytes:
      buffer.length,

    source_kind:
      sourceKind,

    signals
  };
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'BTECH FEE SOURCE VALIDATOR'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const targets =
    loadJson(INPUT);

  const results = [];

  const failed = [];

  let index = 0;

  for (const target of targets) {
    index++;

    console.log(
      `[${index}/${targets.length}] ${target.college_name}`
    );

    try {
      const result =
        await validateTarget(
          target
        );

      results.push(
        result
      );

      console.log(
        `[${result.status}]`,
        result.http_status,
        result.source_kind,
        result.bytes
      );

    } catch (error) {
      const row = {
        college_id:
          target.college_id,

        college_name:
          target.college_name,

        original_url:
          target.current_source_url ||
          null,

        status:
          'REQUEST_FAILED',

        error:
          error.message
      };

      results.push(
        row
      );

      failed.push(
        row
      );

      console.log(
        '[REQUEST_FAILED]',
        error.message
      );
    }
  }

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      results,
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    FAILED,
    JSON.stringify(
      failed,
      null,
      2
    ),
    'utf8'
  );

  const counts = {};

  for (const row of results) {
    counts[row.status] =
      (
        counts[row.status] ||
        0
      ) + 1;
  }

  console.log('');
  console.log(
    '---------------------------------------'
  );

  console.log(
    'SOURCE VALIDATION SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.table(
    Object.entries(
      counts
    ).map(
      ([status, count]) => ({
        status,
        count
      })
    )
  );

  console.log('');

  console.table(
    results.map(
      row => ({
        college:
          row.college_name,

        status:
          row.status,

        http:
          row.http_status ||
          null,

        type:
          row.source_kind ||
          null,

        bytes:
          row.bytes ||
          0,

        btech:
          row.signals?.btech ??
          null,

        fee:
          row.signals?.fee ??
          null
      })
    )
  );

  console.log('');
  console.log(
    'Saved:',
    OUTPUT
  );

  console.log(
    'Saved:',
    FAILED
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      '[VALIDATOR] FATAL:',
      error.message
    );

    process.exitCode = 1;
  }
);
