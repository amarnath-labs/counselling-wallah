import fs from 'node:fs';
import axios from 'axios';
import * as cheerio from 'cheerio';

const VALIDATION_INPUT =
  './btech-fee-source-validation.json';

const TEXT_SUMMARY_INPUT =
  './btech-fee-source-text-summary.json';

const OUTPUT =
  './btech-fee-document-candidates.json';

const TOP_OUTPUT =
  './btech-fee-best-document-candidates.json';

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function absoluteUrl(
  href,
  base
) {
  try {
    return new URL(
      href,
      base
    ).href;
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(
    value || ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreLink({
  href,
  text
}) {
  const combined =
    `${href} ${text}`
      .toLowerCase();

  let score = 0;

  const reasons = [];

  function add(
    condition,
    points,
    reason
  ) {
    if (condition) {
      score += points;

      reasons.push(
        reason
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | POSITIVE SIGNALS
  |--------------------------------------------------------------------------
  */

  add(
    /b\.?\s*tech|btech/.test(
      combined
    ),
    35,
    'btech'
  );

  add(
    /undergraduate|\bug\b/.test(
      combined
    ),
    15,
    'ug'
  );

  add(
    /fee\s*structure|fee-structure|fees/.test(
      combined
    ),
    30,
    'fee'
  );

  add(
    /tuition/.test(
      combined
    ),
    15,
    'tuition'
  );

  add(
    /2026|2026-27|2026_27/.test(
      combined
    ),
    15,
    '2026'
  );

  add(
    /2025|2025-26|2025_26/.test(
      combined
    ),
    12,
    '2025'
  );

  add(
    /\.pdf(?:$|\?)/i.test(
      href
    ),
    25,
    'pdf'
  );

  add(
    /hostel|mess/.test(
      combined
    ),
    5,
    'hostel_or_mess'
  );

  add(
    /new\s*entrant|new\s*admission|new\s*batch/.test(
      combined
    ),
    8,
    'new_entrant'
  );

  /*
  |--------------------------------------------------------------------------
  | NEGATIVE SIGNALS
  |--------------------------------------------------------------------------
  */

  add(
    /phd|doctoral/.test(
      combined
    ),
    -30,
    'phd'
  );

  add(
    /m\.?\s*tech|mtech/.test(
      combined
    ) &&
    !/b\.?\s*tech|btech/.test(
      combined
    ),
    -20,
    'mtech_only'
  );

  add(
    /mba|msc|m\.sc|postgraduate|\bpg\b/.test(
      combined
    ) &&
    !/undergraduate|\bug\b|btech|b\.tech/.test(
      combined
    ),
    -20,
    'pg_only'
  );

  add(
    /tender|recruitment|vacancy|notice board/.test(
      combined
    ),
    -25,
    'unrelated'
  );

  return {
    score,
    reasons
  };
}

async function fetchHtml(url) {
  const response =
    await axios.get(
      url,
      {
        timeout:
          30000,

        maxRedirects:
          8,

        responseType:
          'text',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36'
        }
      }
    );

  return {
    html:
      String(
        response.data || ''
      ),

    finalUrl:
      response.request
        ?.res
        ?.responseUrl ||
      url
  };
}

async function extractLinks(
  sourceUrl
) {
  const {
    html,
    finalUrl
  } =
    await fetchHtml(
      sourceUrl
    );

  const $ =
    cheerio.load(
      html
    );

  const found =
    new Map();

  $('a[href]').each(
    (
      _,
      element
    ) => {
      const rawHref =
        $(element)
          .attr('href');

      if (!rawHref) {
        return;
      }

      const href =
        absoluteUrl(
          rawHref,
          finalUrl
        );

      if (!href) {
        return;
      }

      if (
        !/^https?:\/\//i.test(
          href
        )
      ) {
        return;
      }

      const text =
        normalizeText(
          $(element)
            .text()
        );

      const {
        score,
        reasons
      } =
        scoreLink({
          href,
          text
        });

      if (
        score <= 0
      ) {
        return;
      }

      const previous =
        found.get(
          href
        );

      if (
        !previous ||
        score >
          previous.score
      ) {
        found.set(
          href,
          {
            url:
              href,

            anchor_text:
              text,

            score,

            reasons
          }
        );
      }
    }
  );

  return [
    ...found.values()
  ].sort(
    (
      a,
      b
    ) =>
      b.score -
      a.score
  );
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'BTECH FEE DOCUMENT LINK RESOLVER'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const validation =
    loadJson(
      VALIDATION_INPUT
    );

  const textSummary =
    loadJson(
      TEXT_SUMMARY_INPUT
    );

  const textMap =
    new Map(
      textSummary.map(
        row => [
          row.college_id,
          row
        ]
      )
    );

  const results = [];

  let index = 0;

  for (
    const row
    of validation
  ) {
    index++;

    console.log(
      `[${index}/${validation.length}] ${row.college_name}`
    );

    const textInfo =
      textMap.get(
        row.college_id
      );

    /*
    |--------------------------------------------------------------------------
    | DIRECT PDF
    |--------------------------------------------------------------------------
    */

    if (
      row.status ===
        'USABLE_PDF'
    ) {
      const characters =
        textInfo
          ?.characters ||
        0;

      const candidate = {
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        source_type:
          'direct_pdf',

        source_url:
          row.final_url ||
          row.original_url,

        candidates: [
          {
            url:
              row.final_url ||
              row.original_url,

            anchor_text:
              'Existing direct PDF source',

            score:
              characters >= 1000
                ? 100
                : 70,

            reasons: [
              'existing_pdf',
              characters < 500
                ? 'weak_text_layer'
                : 'text_layer_available'
            ],

            extracted_characters:
              characters
          }
        ]
      };

      results.push(
        candidate
      );

      console.log(
        '[PDF]',
        characters,
        'text chars'
      );

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | HTML SOURCE
    |--------------------------------------------------------------------------
    */

    if (
      row.status ===
        'USABLE_HTML'
    ) {
      try {
        const candidates =
          await extractLinks(
            row.final_url ||
            row.original_url
          );

        results.push({
          college_id:
            row.college_id,

          college_name:
            row.college_name,

          source_type:
            'html_discovery',

          source_url:
            row.final_url ||
            row.original_url,

          candidates:
            candidates.slice(
              0,
              20
            )
        });

        console.log(
          '[HTML] candidates:',
          candidates.length
        );

        if (
          candidates.length > 0
        ) {
          console.log(
            'BEST:',
            candidates[0].score,
            candidates[0].url
          );
        }

      } catch (error) {
        console.log(
          '[HTML FAILED]',
          error.message
        );

        results.push({
          college_id:
            row.college_id,

          college_name:
            row.college_name,

          source_type:
            'html_discovery',

          source_url:
            row.final_url ||
            row.original_url,

          candidates: [],

          error:
            error.message
        });
      }

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | WEAK SOURCE
    |--------------------------------------------------------------------------
    */

    results.push({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      source_type:
        'weak_source',

      source_url:
        row.final_url ||
        row.original_url,

      candidates: []
    });

    console.log(
      '[WEAK SOURCE]'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE ALL CANDIDATES
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      results,
      null,
      2
    ),
    'utf8'
  );

  /*
  |--------------------------------------------------------------------------
  | SELECT BEST CANDIDATE
  |--------------------------------------------------------------------------
  */

  const best =
    results.map(
      row => {
        const first =
          row.candidates?.[0] ||
          null;

        return {
          college_id:
            row.college_id,

          college_name:
            row.college_name,

          source_type:
            row.source_type,

          original_source:
            row.source_url,

          best_candidate_url:
            first?.url ||
            null,

          score:
            first?.score ||
            0,

          reasons:
            first?.reasons ||
            [],

          extracted_characters:
            first
              ?.extracted_characters ??
            null,

          status:
            !first
              ? 'NEEDS_DISCOVERY'
              : first.score >= 70
                ? 'CANDIDATE_READY'
                : 'REVIEW'
        };
      }
    );

  fs.writeFileSync(
    TOP_OUTPUT,
    JSON.stringify(
      best,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    '---------------------------------------'
  );

  console.log(
    'BEST DOCUMENT CANDIDATES'
  );

  console.log(
    '---------------------------------------'
  );

  console.table(
    best.map(
      row => ({
        college:
          row.college_name,

        type:
          row.source_type,

        score:
          row.score,

        status:
          row.status,

        chars:
          row.extracted_characters
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
    TOP_OUTPUT
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      '[RESOLVER] FATAL:',
      error.message
    );

    process.exitCode = 1;
  }
);
