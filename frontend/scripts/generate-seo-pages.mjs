import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR =
  path.resolve('dist');

const sourcePath =
  path.join(
    DIST_DIR,
    'index.html'
  );

if (!fs.existsSync(sourcePath)) {
  throw new Error(
    'dist/index.html not found. Run vite build first.'
  );
}

const baseHtml =
  fs.readFileSync(
    sourcePath,
    'utf8'
  );

const routes = [
  {
    path: 'college-predictor',
    title:
      'College Predictor 2026 - JEE Main & UPTAC | TruMarg',
    description:
      'Use TruMarg College Predictor 2026 to explore engineering colleges using JEE Main or UPTAC rank, category, quota and historical cutoff data.',
    canonical:
      'https://www.trumarg.com/college-predictor',
    heading:
      'College Predictor 2026 - JEE Main & UPTAC College Predictor',
    intro:
      'Explore college and branch possibilities using rank, category, quota, counselling preferences and historical cutoff data.'
  },

  {
    path: 'jee-main-college-predictor',
    title:
      'JEE Main College Predictor 2026 | TruMarg',
    description:
      'Use TruMarg JEE Main College Predictor 2026 to explore NIT, IIIT, GFTI and engineering college options using rank, category, quota and historical cutoff data.',
    canonical:
      'https://www.trumarg.com/jee-main-college-predictor',
    heading:
      'JEE Main College Predictor 2026',
    intro:
      'Predict relevant NIT, IIIT, GFTI and engineering college options using your JEE Main admission profile.'
  },

  {
    path: 'uptac-college-predictor',
    title:
      'UPTAC College Predictor 2026 | TruMarg',
    description:
      'Use TruMarg UPTAC College Predictor 2026 to explore engineering colleges and branches using rank, category, preferences and historical cutoff data.',
    canonical:
      'https://www.trumarg.com/uptac-college-predictor',
    heading:
      'UPTAC College Predictor 2026',
    intro:
      'Explore UPTAC college and branch possibilities using your rank, category and counselling preferences.'
  },

  {
    path: 'college-counselling',
    title:
      'College Counselling & Admission Guidance | TruMarg',
    description:
      'Explore college counselling and admission guidance with TruMarg. Understand colleges, branches, counselling rounds, cutoffs and admission possibilities.',
    canonical:
      'https://www.trumarg.com/college-counselling',
    heading:
      'College Counselling & Admission Guidance',
    intro:
      'Understand college options, counselling rounds, branches, previous cutoffs and admission possibilities with TruMarg.'
  },

  {
    path: 'career-guidance',
    title:
      'Career Guidance for Students & Career Assessment | TruMarg',
    description:
      'Get career guidance for students with TruMarg. Explore interests, strengths, preferences and suitable career paths through structured assessment.',
    canonical:
      'https://www.trumarg.com/career-guidance',
    heading:
      'Career Guidance for Students',
    intro:
      'Explore career directions based on interests, strengths, preferences and your academic journey.'
  },

  {
    path: 'about',
    title:
      'About TruMarg - College & Career Guidance Platform',
    description:
      'Learn about TruMarg, a college prediction and career guidance platform helping students make informed academic and career decisions.',
    canonical:
      'https://www.trumarg.com/about',
    heading:
      'About TruMarg',
    intro:
      'TruMarg helps students explore colleges, admission possibilities and career paths.'
  }
];

function replaceTitle(
  html,
  title
) {
  return html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${title}</title>`
  );
}

function replaceDescription(
  html,
  description
) {
  return html.replace(
    /<meta\s+name="description"[\s\S]*?>/i,
    `<meta name="description" content="${description}" />`
  );
}

function replaceCanonical(
  html,
  canonical
) {
  return html.replace(
    /<link\s+rel="canonical"[\s\S]*?>/i,
    `<link rel="canonical" href="${canonical}" />`
  );
}

function replaceOpenGraph(
  html,
  route
) {
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?>/i,
    `<meta property="og:title" content="${route.title}" />`
  );

  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?>/i,
    `<meta property="og:description" content="${route.description}" />`
  );

  html = html.replace(
    /<meta\s+property="og:url"[\s\S]*?>/i,
    `<meta property="og:url" content="${route.canonical}" />`
  );

  return html;
}

function addStaticContent(
  html,
  route
) {
  const content = `
      <main>
        <h1>${route.heading}</h1>
        <p>${route.intro}</p>
      </main>
  `;

  return html.replace(
    '<div id="root"></div>',
    `<div id="root">${content}</div>`
  );
}

for (const route of routes) {
  let html =
    baseHtml;

  html =
    replaceTitle(
      html,
      route.title
    );

  html =
    replaceDescription(
      html,
      route.description
    );

  html =
    replaceCanonical(
      html,
      route.canonical
    );

  html =
    replaceOpenGraph(
      html,
      route
    );

  html =
    addStaticContent(
      html,
      route
    );

  const targetDir =
    path.join(
      DIST_DIR,
      route.path
    );

  fs.mkdirSync(
    targetDir,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    path.join(
      targetDir,
      'index.html'
    ),
    html,
    'utf8'
  );

  console.log(
    `Generated: /${route.path}`
  );
}