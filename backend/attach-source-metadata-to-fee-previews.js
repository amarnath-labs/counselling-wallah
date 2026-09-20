import fs from 'node:fs/promises';

const PREVIEW_INPUT =
  './fee-pilot-batch-01-db-previews-clean.json';

const SOURCE_MAP_INPUT =
  './fee-pilot-batch-01-source-map.json';

const OUTPUT =
  './fee-pilot-batch-01-db-previews-final.json';

const REVIEW_OUTPUT =
  './fee-pilot-batch-01-db-previews-final-review.json';


async function loadJson(file) {
  const raw =
    await fs.readFile(
      file,
      'utf8'
    );

  return JSON.parse(
    raw.replace(
      /^\uFEFF/,
      ''
    )
  );
}


function clean(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value)
      .trim();

  return text || null;
}


function isOfficialSource(row) {
  const website =
    clean(
      row.official_website
    );

  const sourceUrl =
    clean(
      row.fee_source_url
    );

  if (
    !website ||
    !sourceUrl
  ) {
    return false;
  }

  try {
    const websiteHost =
      new URL(
        website
      ).hostname
        .replace(
          /^www\./,
          ''
        );

    const sourceHost =
      new URL(
        sourceUrl
      ).hostname
        .replace(
          /^www\./,
          ''
        );

    return (
      sourceHost ===
        websiteHost ||
      sourceHost.endsWith(
        `.${websiteHost}`
      ) ||
      websiteHost.endsWith(
        `.${sourceHost}`
      )
    );

  } catch {
    return false;
  }
}


function attachMetadata(
  preview,
  sourceMap
) {
  const source =
    sourceMap.find(
      row =>
        row.college_id ===
        preview.college_id
    );

  const errors = [];

  if (!source) {
    errors.push(
      'SOURCE_MAP_NOT_FOUND'
    );
  }

  if (
    source &&
    !clean(
      source.fee_source_url
    )
  ) {
    errors.push(
      'FEE_SOURCE_URL_MISSING'
    );
  }

  if (
    source &&
    !clean(
      source.official_website
    )
  ) {
    errors.push(
      'OFFICIAL_WEBSITE_MISSING'
    );
  }

  if (
    source &&
    !isOfficialSource(
      source
    )
  ) {
    errors.push(
      'SOURCE_NOT_ON_OFFICIAL_DOMAIN'
    );
  }

  if (
    source &&
    source.discovery_status !==
      'SOURCE_FOUND_CURRENT'
  ) {
    errors.push(
      `SOURCE_STATUS_${source.discovery_status}`
    );
  }

  if (
    source &&
    source.academic_year &&
    preview.branch_fee
      .academic_year !==
      source.academic_year
  ) {
    errors.push(
      'ACADEMIC_YEAR_MISMATCH'
    );
  }

  const sourceLabel =
    source
      ? `Official ${preview.college_name} B.Tech Fee Source`
      : null;

  const branchFee = {
    ...preview.branch_fee,

    source_label:
      sourceLabel,

    source_url:
      source?.fee_source_url ??
      null,

    verification_status:
      errors.length === 0
        ? 'verified'
        : 'pending_review'
  };

  const feeVariants =
    (
      preview.fee_variants ||
      []
    ).map(
      variant => ({
        ...variant,

        verification_status:
          errors.length === 0
            ? 'verified'
            : 'pending_review'
      })
    );

  return {
    ...preview,

    branch_fee:
      branchFee,

    fee_variants:
      feeVariants,

    source_metadata: {
      official_website:
        source?.official_website ??
        null,

      fee_source_url:
        source?.fee_source_url ??
        null,

      source_type:
        source?.source_type ??
        null,

      source_year:
        source?.academic_year ??
        null,

      discovery_status:
        source?.discovery_status ??
        null,

      confidence_score:
        source?.confidence_score ??
        0
    },

    final_validation_errors:
      errors,

    preview_status:
      errors.length === 0
        ? 'FINAL_READY_FOR_IMPORT'
        : 'FINAL_REVIEW_REQUIRED'
  };
}


async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'FINAL FEE PREVIEW SOURCE GATE'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const previews =
    await loadJson(
      PREVIEW_INPUT
    );

  const sourceMap =
    await loadJson(
      SOURCE_MAP_INPUT
    );

  const final =
    previews.map(
      preview =>
        attachMetadata(
          preview,
          sourceMap
        )
    );

  const ready =
    final.filter(
      row =>
        row.preview_status ===
        'FINAL_READY_FOR_IMPORT'
    );

  const review =
    final.filter(
      row =>
        row.preview_status !==
        'FINAL_READY_FOR_IMPORT'
    );

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      ready,
      null,
      2
    ),

    'utf8'
  );

  await fs.writeFile(
    REVIEW_OUTPUT,

    JSON.stringify(
      review,
      null,
      2
    ),

    'utf8'
  );

  console.table(
    final.map(
      row => ({
        college:
          row.college_name,

        year:
          row.branch_fee
            .academic_year,

        variants:
          row.fee_variants
            .length,

        source:
          row.branch_fee
            .source_url
            ? 'yes'
            : 'no',

        official:
          row.final_validation_errors
            .includes(
              'SOURCE_NOT_ON_OFFICIAL_DOMAIN'
            )
            ? 'no'
            : 'yes',

        status:
          row.preview_status,

        errors:
          row.final_validation_errors
            .join(',')
      })
    )
  );

  console.log('');

  console.log(
    'READY FOR IMPORT:',
    ready.length
  );

  console.log(
    'REVIEW REQUIRED:',
    review.length
  );

  console.log('');

  console.log(
    'Total final variants:',
    ready.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.fee_variants
          .length,

      0
    )
  );

  console.log('');

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log(
    'Saved:',
    REVIEW_OUTPUT
  );

  console.log('');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
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
