import fs from 'fs';
import path from 'path';

const DIST =
  path.resolve(
    './dist'
  );

const BASE_FILE =
  path.join(
    DIST,
    'index.html'
  );

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| Replace this with your real production domain.
|--------------------------------------------------------------------------
*/

const SITE_URL =
  'https://YOUR-DOMAIN.com'
    .replace(
      /\/+$/,
      ''
    );


if (
  SITE_URL.includes(
    'YOUR-DOMAIN'
  )
) {
  throw new Error(
    'Set the real production domain in SITE_URL before running the SEO generator.'
  );
}


if (
  !fs.existsSync(
    BASE_FILE
  )
) {
  throw new Error(
    'dist/index.html not found. Run Vite build first.'
  );
}


const baseHtml =
  fs.readFileSync(
    BASE_FILE,
    'utf8'
  );


const pages = [

  {
    path:
      '/college-predictor',

    title:
      'College Predictor 2026 – JEE Main, UPTAC & More | TruMarg',

    description:
      'Use TruMarg College Predictor 2026 to discover college and branch options based on rank, category, quota and historical counselling data.',

    h1:
      'College Predictor 2026 – Find Colleges Based on Your Rank',

    intro:
      'TruMarg helps students discover realistic college and branch options using rank, category, quota, counselling history and admission trends.',

    sections: [
      {
        title:
          'How TruMarg College Predictor Works',

        text:
          'Enter your exam details, rank, category and preferences. TruMarg compares your profile with historical counselling data and organizes relevant options into Dream, Target, Safe and Backup admission ranges.'
      },

      {
        title:
          'Admission Data Used',

        text:
          'TruMarg uses historical counselling information such as opening ranks, closing ranks, counselling rounds, category, quota and branch information where reliable official data is available.'
      },

      {
        title:
          'Personalized College Recommendations',

        text:
          'Recommendations can consider admission feasibility, branch preference, college information and other student preferences rather than showing only a raw cutoff list.'
      }
    ],

    faq: [
      {
        q:
          'What is a college predictor?',

        a:
          'A college predictor compares student admission details with historical counselling data to identify relevant college and course options.'
      },

      {
        q:
          'Does TruMarg guarantee admission?',

        a:
          'No. Historical cutoffs and counselling patterns can help estimate admission possibilities, but future cutoffs can change.'
      },

      {
        q:
          'Which exams are supported?',

        a:
          'TruMarg currently supports selected engineering counselling systems including JEE Main and UPTAC, with additional admission systems being added.'
      }
    ],

    links: [
      [
        '/jee-main-college-predictor',
        'JEE Main College Predictor 2026'
      ],

      [
        '/uptac-college-predictor',
        'UPTAC College Predictor 2026'
      ],

      [
        '/college-counselling',
        'College Counselling'
      ]
    ]
  },


  {
    path:
      '/jee-main-college-predictor',

    title:
      'JEE Main College Predictor 2026 – NIT, IIIT & GFTI | TruMarg',

    description:
      'Predict NIT, IIIT and GFTI college options using JEE Main rank, category, quota and historical JoSAA and CSAB counselling data with TruMarg.',

    h1:
      'JEE Main College Predictor 2026',

    intro:
      'Use your JEE Main rank, category, quota and preferences to explore NIT, IIIT, GFTI and other counselling options using historical admission data.',

    sections: [
      {
        title:
          'Predict NIT, IIIT and GFTI Options',

        text:
          'TruMarg evaluates relevant college and branch combinations using historical JoSAA and CSAB admission information.'
      },

      {
        title:
          'JoSAA and CSAB Historical Cutoffs',

        text:
          'Opening rank, closing rank, counselling round, category and quota can materially change admission possibilities. TruMarg keeps these dimensions separate while evaluating historical admission data.'
      },

      {
        title:
          'Home State and Other State Quota',

        text:
          'For institutions where state quota rules apply, the applicable quota is considered separately instead of treating every candidate as belonging to the same seat pool.'
      },

      {
        title:
          'Dream, Target, Safe and Backup Options',

        text:
          'TruMarg groups admission possibilities to make large counselling result sets easier to understand. These are historical-data-based guidance categories and are not admission guarantees.'
      }
    ],

    faq: [
      {
        q:
          'Can I predict NIT admission using JEE Main rank?',

        a:
          'Historical JoSAA and CSAB opening and closing ranks can be used to compare your JEE Main rank with previous counselling outcomes.'
      },

      {
        q:
          'Does category affect JEE college prediction?',

        a:
          'Yes. Admission cutoffs differ across categories, quotas, branches and counselling rounds.'
      },

      {
        q:
          'Are JoSAA and CSAB the same?',

        a:
          'They are separate counselling processes and should be evaluated using their respective historical admission data.'
      }
    ],

    links: [
      [
        '/college-predictor',
        'College Predictor 2026'
      ],

      [
        '/uptac-college-predictor',
        'UPTAC College Predictor'
      ],

      [
        '/college-counselling',
        'College Counselling Guide'
      ]
    ]
  },


  {
    path:
      '/uptac-college-predictor',

    title:
      'UPTAC College Predictor 2026 – AKTU College Predictor | TruMarg',

    description:
      'Use TruMarg UPTAC College Predictor to discover AKTU and UPTAC college and branch options using JEE Main rank, category and historical counselling cutoffs.',

    h1:
      'UPTAC College Predictor 2026',

    intro:
      'Explore UPTAC college and branch options using your admission profile and historical counselling data.',

    sections: [
      {
        title:
          'UPTAC and AKTU College Prediction',

        text:
          'TruMarg analyzes college, branch, category and historical opening and closing rank information from UPTAC counselling data.'
      },

      {
        title:
          'College and Branch Options',

        text:
          'Instead of showing only a cutoff table, TruMarg can organize eligible college and branch combinations according to admission feasibility and student preferences.'
      },

      {
        title:
          'Historical UPTAC Cutoffs',

        text:
          'Previous counselling rounds provide useful evidence about admission patterns, although actual future cutoffs may change because of seat availability and applicant demand.'
      }
    ],

    faq: [
      {
        q:
          'Is UPTAC based on JEE Main rank?',

        a:
          'Admission rules depend on the applicable UPTAC programme and counselling process. TruMarg uses the relevant counselling data for supported programmes.'
      },

      {
        q:
          'Is UPTAC College Predictor the same as AKTU College Predictor?',

        a:
          'Students often use both terms while searching for engineering college options participating in the UPTAC counselling ecosystem.'
      }
    ],

    links: [
      [
        '/college-predictor',
        'College Predictor'
      ],

      [
        '/jee-main-college-predictor',
        'JEE Main College Predictor'
      ],

      [
        '/uptac-cutoff-2025',
        'UPTAC Cutoff 2025'
      ]
    ]
  },


  {
    path:
      '/uptac-cutoff-2025',

    title:
      'UPTAC Cutoff 2025 – College & Branch Closing Ranks | TruMarg',

    description:
      'Explore UPTAC 2025 college and branch cutoff information including historical opening and closing ranks for counselling analysis on TruMarg.',

    h1:
      'UPTAC Cutoff 2025',

    intro:
      'Explore historical UPTAC college and branch admission data to understand previous counselling outcomes.',

    sections: [
      {
        title:
          'UPTAC Opening and Closing Ranks',

        text:
          'Opening and closing ranks provide historical evidence about the range in which seats were allotted for specific college and branch combinations.'
      },

      {
        title:
          'Use Cutoffs With College Predictor',

        text:
          'Historical cutoffs become more useful when compared with the student rank, category and programme preferences.'
      }
    ],

    faq: [
      {
        q:
          'Can past UPTAC cutoffs predict future admission?',

        a:
          'They can provide useful historical context, but they do not guarantee future admission because counselling outcomes change each year.'
      }
    ],

    links: [
      [
        '/uptac-college-predictor',
        'UPTAC College Predictor'
      ],

      [
        '/college-predictor',
        'College Predictor'
      ]
    ]
  },


  {
    path:
      '/college-counselling',

    title:
      'College Counselling Guide 2026 – Admission Choices | TruMarg',

    description:
      'Understand college counselling, admission cutoffs, branch choices, counselling rounds and college selection with TruMarg.',

    h1:
      'College Counselling Guide 2026',

    intro:
      'Understand how ranks, cutoffs, categories, quotas and counselling rounds affect college admission decisions.',

    sections: [
      {
        title:
          'How College Counselling Works',

        text:
          'Counselling generally combines student eligibility, rank, category, seat availability, preferences and programme rules to determine allotment outcomes.'
      },

      {
        title:
          'Understanding Historical Cutoffs',

        text:
          'Historical opening and closing ranks are useful references, but future counselling outcomes can move because demand and seat availability change.'
      }
    ],

    faq: [],

    links: [
      [
        '/college-predictor',
        'College Predictor 2026'
      ],

      [
        '/jee-main-college-predictor',
        'JEE Main College Predictor'
      ]
    ]
  },


  {
    path:
      '/career-guidance',

    title:
      'Career Guidance for Students – Explore Career Paths | TruMarg',

    description:
      'Explore student career guidance, interests, strengths, education pathways and career possibilities with TruMarg.',

    h1:
      'Career Guidance for Students',

    intro:
      'Explore education and career pathways using interests, strengths and personal preferences.',

    sections: [],

    faq: [],

    links: [
      [
        '/college-predictor',
        'College Predictor'
      ]
    ]
  },


  {
    path:
      '/about',

    title:
      'About TruMarg – College & Career Guidance Platform',

    description:
      'Learn about TruMarg, a student-focused platform for college recommendations, counselling intelligence and career guidance.',

    h1:
      'About TruMarg',

    intro:
      'TruMarg is designed to help students understand college admission options and explore education and career pathways.',

    sections: [],

    faq: [],

    links: [
      [
        '/college-predictor',
        'College Predictor'
      ],

      [
        '/career-guidance',
        'Career Guidance'
      ]
    ]
  }

];


function escapeHtml(
  value
) {

  return String(
    value || ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    );
}


function removeExistingSeo(
  html
) {

  return html
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      ''
    )

    .replace(
      /<meta[^>]+name=["']description["'][^>]*>/gi,
      ''
    )

    .replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/gi,
      ''
    )

    .replace(
      /<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,
      ''
    )

    .replace(
      /<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi,
      ''
    );
}


function faqSchema(
  faq
) {

  if (
    !faq?.length
  ) {
    return null;
  }


  return {
    '@context':
      'https://schema.org',

    '@type':
      'FAQPage',

    mainEntity:
      faq.map(
        item => ({
          '@type':
            'Question',

          name:
            item.q,

          acceptedAnswer: {
            '@type':
              'Answer',

            text:
              item.a
          }
        })
      )
  };
}


function breadcrumbSchema(
  page
) {

  return {
    '@context':
      'https://schema.org',

    '@type':
      'BreadcrumbList',

    itemListElement: [
      {
        '@type':
          'ListItem',

        position:
          1,

        name:
          'Home',

        item:
          SITE_URL
      },

      {
        '@type':
          'ListItem',

        position:
          2,

        name:
          page.h1,

        item:
          SITE_URL +
          page.path
      }
    ]
  };
}


function webpageSchema(
  page
) {

  return {
    '@context':
      'https://schema.org',

    '@type':
      'WebPage',

    name:
      page.h1,

    description:
      page.description,

    url:
      SITE_URL +
      page.path,

    isPartOf: {
      '@type':
        'WebSite',

      name:
        'TruMarg',

      url:
        SITE_URL
    }
  };
}


function createStaticContent(
  page
) {

  const sections =
    page.sections
      .map(
        section =>
          `
<section>
  <h2>${escapeHtml(section.title)}</h2>
  <p>${escapeHtml(section.text)}</p>
</section>
`
      )
      .join(
        '\n'
      );


  const faq =
    page.faq?.length
      ? `
<section>
  <h2>Frequently Asked Questions</h2>

  ${page.faq
    .map(
      item =>
        `
<div>
  <h3>${escapeHtml(item.q)}</h3>
  <p>${escapeHtml(item.a)}</p>
</div>
`
    )
    .join('\n')}
</section>
`
      : '';


  const links =
    page.links?.length
      ? `
<nav aria-label="Related TruMarg tools">
  <h2>Related Tools</h2>

  <ul>
    ${page.links
      .map(
        ([url, label]) =>
          `
<li>
  <a href="${url}">
    ${escapeHtml(label)}
  </a>
</li>
`
      )
      .join('\n')}
  </ul>
</nav>
`
      : '';


  return `
<div
  id="trumarg-seo-content"
  style="
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px;
    font-family: Arial, sans-serif;
    line-height: 1.65;
  "
>
  <main>
    <h1>
      ${escapeHtml(page.h1)}
    </h1>

    <p>
      ${escapeHtml(page.intro)}
    </p>

    ${sections}

    ${faq}

    ${links}
  </main>
</div>
`;
}


function generatePage(
  page
) {

  const canonical =
    SITE_URL +
    page.path;


  let html =
    removeExistingSeo(
      baseHtml
    );


  const schemas = [
    webpageSchema(
      page
    ),

    breadcrumbSchema(
      page
    )
  ];


  const faq =
    faqSchema(
      page.faq
    );


  if (faq) {
    schemas.push(
      faq
    );
  }


  const head =
`
<title>${escapeHtml(page.title)}</title>

<meta
  name="description"
  content="${escapeHtml(page.description)}"
/>

<meta
  name="robots"
  content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
/>

<link
  rel="canonical"
  href="${canonical}"
/>

<meta
  property="og:type"
  content="website"
/>

<meta
  property="og:site_name"
  content="TruMarg"
/>

<meta
  property="og:title"
  content="${escapeHtml(page.title)}"
/>

<meta
  property="og:description"
  content="${escapeHtml(page.description)}"
/>

<meta
  property="og:url"
  content="${canonical}"
/>

<meta
  name="twitter:card"
  content="summary_large_image"
/>

<meta
  name="twitter:title"
  content="${escapeHtml(page.title)}"
/>

<meta
  name="twitter:description"
  content="${escapeHtml(page.description)}"
/>

${schemas
  .map(
    schema =>
      `
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
`
  )
  .join('\n')}
`;


  html =
    html.replace(
      '</head>',
      `${head}
</head>`
    );


  const staticContent =
    createStaticContent(
      page
    );


  html =
    html.replace(
      /<div\s+id=["']root["']\s*><\/div>/i,
      `<div id="root">${staticContent}</div>`
    );


  const folder =
    path.join(
      DIST,
      page.path.replace(
        /^\/+/,
        ''
      )
    );


  fs.mkdirSync(
    folder,
    {
      recursive:
        true
    }
  );


  fs.writeFileSync(
    path.join(
      folder,
      'index.html'
    ),
    html,
    'utf8'
  );


  console.log(
    'Generated:',
    page.path
  );
}


for (
  const page of pages
) {

  generatePage(
    page
  );
}


/*
|--------------------------------------------------------------------------
| HOMEPAGE
|--------------------------------------------------------------------------
*/

let homepage =
  removeExistingSeo(
    baseHtml
  );


const homeTitle =
  'TruMarg – College Predictor & Career Guidance';


const homeDescription =
  'TruMarg helps students discover college options using counselling data, admission intelligence and personalized education guidance.';


const homepageSchema = [

  {
    '@context':
      'https://schema.org',

    '@type':
      'WebSite',

    name:
      'TruMarg',

    url:
      SITE_URL
  },

  {
    '@context':
      'https://schema.org',

    '@type':
      'Organization',

    name:
      'TruMarg',

    url:
      SITE_URL
  }

];


homepage =
  homepage.replace(
    '</head>',

`
<title>${homeTitle}</title>

<meta
  name="description"
  content="${homeDescription}"
/>

<link
  rel="canonical"
  href="${SITE_URL}/"
/>

<meta
  name="robots"
  content="index,follow,max-image-preview:large"
/>

${homepageSchema
  .map(
    schema =>
      `
<script type="application/ld+json">
${JSON.stringify(schema)}
</script>
`
  )
  .join('\n')}

</head>
`
  );


fs.writeFileSync(
  BASE_FILE,
  homepage,
  'utf8'
);


/*
|--------------------------------------------------------------------------
| SITEMAP
|--------------------------------------------------------------------------
*/

const sitemapUrls = [
  '/',
  ...pages.map(
    page =>
      page.path
  )
];


const sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${sitemapUrls
  .map(
    url =>
      `  <url>
    <loc>${SITE_URL}${url === '/' ? '/' : url}</loc>
    <changefreq>${url === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${url === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;


fs.writeFileSync(
  path.join(
    DIST,
    'sitemap.xml'
  ),
  sitemap,
  'utf8'
);


/*
|--------------------------------------------------------------------------
| ROBOTS
|--------------------------------------------------------------------------
*/

const robots =
`User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;


fs.writeFileSync(
  path.join(
    DIST,
    'robots.txt'
  ),
  robots,
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'TRUMARG SEO GENERATION COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  'Domain:',
  SITE_URL
);

console.log(
  'SEO pages:',
  pages.length
);

console.log(
  'Sitemap:',
  SITE_URL + '/sitemap.xml'
);

console.log(
  'Robots:',
  SITE_URL + '/robots.txt'
);
