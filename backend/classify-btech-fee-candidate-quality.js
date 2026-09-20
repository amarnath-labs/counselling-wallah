import fs from 'node:fs';

const INPUT =
  './btech-fee-best-document-candidates.json';

const OUTPUT =
  './btech-fee-candidate-quality.json';

function load(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function detectYear(url) {
  const text =
    String(url || '');

  const years =
    [
      ...text.matchAll(
        /(20\d{2})/g
      )
    ]
      .map(
        match =>
          Number(
            match[1]
          )
      )
      .filter(
        year =>
          year >= 2018 &&
          year <= 2030
      );

  if (
    years.length === 0
  ) {
    return null;
  }

  return Math.max(
    ...years
  );
}

function classify(row) {
  const chars =
    Number(
      row.extracted_characters || 0
    );

  const score =
    Number(
      row.score || 0
    );

  const candidateUrl =
    row.best_candidate_url ||
    row.original_source ||
    null;

  const detectedYear =
    detectYear(
      candidateUrl
    );

  let status =
    'REVIEW';

  const reasons = [];

  /*
  |--------------------------------------------------------------------------
  | NO CANDIDATE
  |--------------------------------------------------------------------------
  */

  if (
    !candidateUrl
  ) {
    return {
      ...row,

      detected_year:
        null,

      final_status:
        'SOURCE_DISCOVERY_REQUIRED',

      reasons: [
        'no_candidate_url'
      ]
    };
  }

  /*
  |--------------------------------------------------------------------------
  | WEAK DIRECT PDF TEXT
  |--------------------------------------------------------------------------
  */

  if (
    row.source_type ===
      'direct_pdf'
  ) {
    if (
      chars < 500
    ) {
      status =
        'PDF_DEEP_EXTRACTION_REQUIRED';

      reasons.push(
        'weak_pdf_text_layer'
      );
    } else {
      status =
        'READY_FOR_NORMALIZATION';

      reasons.push(
        'pdf_text_usable'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | HTML DISCOVERY
  |--------------------------------------------------------------------------
  */

  if (
    row.source_type ===
      'html_discovery'
  ) {
    if (
      score >= 70
    ) {
      status =
        'READY_FOR_DOWNLOAD';

      reasons.push(
        'strong_document_candidate'
      );
    } else {
      status =
        'HTML_DEEP_DISCOVERY_REQUIRED';

      reasons.push(
        'candidate_score_too_low'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | OLD DOCUMENT
  |--------------------------------------------------------------------------
  */

  if (
    detectedYear &&
    detectedYear < 2025
  ) {
    status =
      'OUTDATED_SOURCE_REVIEW';

    reasons.push(
      `old_year_${detectedYear}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | WEAK SOURCE
  |--------------------------------------------------------------------------
  */

  if (
    row.source_type ===
      'weak_source'
  ) {
    status =
      'SOURCE_DISCOVERY_REQUIRED';

    reasons.push(
      'weak_existing_source'
    );
  }

  return {
    ...row,

    detected_year:
      detectedYear,

    final_status:
      status,

    reasons
  };
}

function main() {
  const rows =
    load(INPUT);

  const results =
    rows.map(
      classify
    );

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      results,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'BTECH FEE CANDIDATE QUALITY'
  );

  console.log(
    '======================================='
  );

  console.log('');

  console.table(
    results.map(
      row => ({
        college:
          row.college_name,

        type:
          row.source_type,

        score:
          row.score,

        chars:
          row.extracted_characters,

        year:
          row.detected_year,

        status:
          row.final_status
      })
    )
  );

  const counts = {};

  for (const row of results) {
    counts[row.final_status] =
      (
        counts[row.final_status] ||
        0
      ) + 1;
  }

  console.log('');

  console.log(
    'SUMMARY'
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

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log('');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main();
