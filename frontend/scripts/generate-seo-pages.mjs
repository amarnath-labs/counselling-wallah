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
      'Explore college and branch possibilities using rank, category, quota, counselling preferences and historical cutoff data.',

    staticHtml: `
      <section>
        <h2>Choose Your College Predictor</h2>

        <article>
          <h3>JEE Main College Predictor 2026</h3>
          <p>
            Explore relevant NIT, IIIT, GFTI and engineering
            college options using your JEE Main admission profile
            and historical cutoff information.
          </p>

          <p>
            <a href="/jee-main-college-predictor">
              JEE Main College Predictor 2026
            </a>
          </p>
        </article>

        <article>
          <h3>UPTAC College Predictor 2026</h3>
          <p>
            Explore UPTAC engineering college and branch
            possibilities using rank, category, counselling
            preferences and historical cutoff information.
          </p>

          <p>
            <a href="/uptac-college-predictor">
              UPTAC College Predictor 2026
            </a>
          </p>
        </article>
      </section>

      <section>
        <h2>How TruMarg College Predictor Works</h2>

        <ol>
          <li>Select the relevant entrance exam or counselling route.</li>
          <li>Enter your rank and applicable admission details.</li>
          <li>Add category, quota, home-state and branch preferences where applicable.</li>
          <li>TruMarg compares your profile with historical admission and cutoff information.</li>
          <li>Review relevant college and branch possibilities.</li>
        </ol>
      </section>

      <section>
        <h2>Historical Cutoff Based College Prediction</h2>

        <p>
          Historical opening and closing ranks help students
          understand previous admission patterns. Future cutoffs
          can change because of competition, seat availability,
          category, quota, counselling rules and student choices.
        </p>
      </section>

      <section>
        <h2>Dream, Target, Safe and Backup Options</h2>

        <p>
          TruMarg may organize college recommendations into
          Dream, Target, Safe and Backup categories to make
          counselling choices easier to compare. These categories
          are guidance estimates and do not guarantee admission.
        </p>
      </section>

      <section>
        <h2>Explore More TruMarg Guidance</h2>

        <ul>
          <li>
            <a href="/college-counselling">
              College Counselling and Admission Guidance
            </a>
          </li>

          <li>
            <a href="/career-guidance">
              Career Guidance for Students
            </a>
          </li>
        </ul>
      </section>
    `
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
      'Predict relevant NIT, IIIT, GFTI and engineering college options using your JEE Main admission profile.',

    staticHtml: `
      <section>
        <h2>JEE Main College Prediction Using Your Rank</h2>

        <p>
          TruMarg uses your JEE Main admission profile together
          with available historical opening and closing rank
          information to organize relevant college and branch
          possibilities.
        </p>
      </section>

      <section>
        <h2>Information Used by the JEE Main Predictor</h2>

        <ul>
          <li>JEE Main rank</li>
          <li>Category</li>
          <li>Home state</li>
          <li>Applicable quota</li>
          <li>Branch preferences</li>
          <li>Other relevant counselling details</li>
        </ul>
      </section>

      <section>
        <h2>JEE Main Predictor Coverage</h2>

        <ul>
          <li>NIT college and branch possibilities</li>
          <li>IIIT college and branch possibilities</li>
          <li>GFTI college and branch possibilities</li>
          <li>Historical opening and closing rank comparisons</li>
        </ul>
      </section>

      <section>
        <h2>How the JEE Main College Predictor Works</h2>

        <ol>
          <li>Start the JEE Main prediction flow.</li>
          <li>Enter your rank and admission details.</li>
          <li>Add category, home state, quota and branch preferences where applicable.</li>
          <li>TruMarg compares your profile with available historical cutoff information.</li>
          <li>Review relevant college and branch possibilities.</li>
        </ol>
      </section>

      <section>
        <h2>Historical Cutoff Methodology</h2>

        <p>
          Historical cutoffs are useful for understanding previous
          admission patterns but cannot guarantee future admission.
          Cutoffs may change because of applicant demand, seat
          availability, category, quota and counselling-round
          movement.
        </p>
      </section>

      <section>
        <h2>Related College Prediction Tools</h2>

        <ul>
          <li>
            <a href="/uptac-college-predictor">
              UPTAC College Predictor 2026
            </a>
          </li>

          <li>
            <a href="/college-predictor">
              All College Predictors
            </a>
          </li>

          <li>
            <a href="/college-counselling">
              College Counselling Guidance
            </a>
          </li>
        </ul>
      </section>
    `
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
      'Explore UPTAC college and branch possibilities using your rank, category and counselling preferences.',

    staticHtml: `
      <section>
        <h2>UPTAC College Prediction Using Historical Cutoffs</h2>

        <p>
          TruMarg compares your admission profile with available
          historical UPTAC opening and closing rank information
          to organize relevant engineering college and branch
          possibilities.
        </p>
      </section>

      <section>
        <h2>Information Used by the UPTAC Predictor</h2>

        <ul>
          <li>Applicable rank</li>
          <li>Category</li>
          <li>Counselling preferences</li>
          <li>Branch preferences</li>
          <li>Applicable quota and admission details</li>
        </ul>
      </section>

      <section>
        <h2>UPTAC Historical Data</h2>

        <p>
          TruMarg uses historical UPTAC counselling cutoff
          information where available, including college,
          branch, category and counselling-round data.
        </p>

        <p>
          Historical cutoff information is used as guidance.
          Future UPTAC cutoffs can change because of seat
          availability, applicant demand, counselling rules,
          category and student preferences.
        </p>
      </section>

      <section>
        <h2>How the UPTAC College Predictor Works</h2>

        <ol>
          <li>Start the UPTAC prediction flow.</li>
          <li>Enter your rank and applicable admission details.</li>
          <li>Add category and branch preferences.</li>
          <li>TruMarg compares your profile with historical UPTAC cutoff information.</li>
          <li>Review relevant college and branch possibilities.</li>
        </ol>
      </section>

      <section>
        <h2>Dream, Target, Safe and Backup Options</h2>

        <p>
          College possibilities may be organized into Dream,
          Target, Safe and Backup categories to support counselling
          planning. These classifications are guidance estimates,
          not guaranteed admission outcomes.
        </p>
      </section>

      <section>
        <h2>Related College Prediction Tools</h2>

        <ul>
          <li>
            <a href="/jee-main-college-predictor">
              JEE Main College Predictor 2026
            </a>
          </li>

          <li>
            <a href="/college-predictor">
              All College Predictors
            </a>
          </li>

          <li>
            <a href="/college-counselling">
              College Counselling Guidance
            </a>
          </li>
        </ul>
      </section>
    `
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
      'Understand college options, counselling rounds, branches, previous cutoffs and admission possibilities with TruMarg.',

    staticHtml: `
      <section>
        <h2>Data-Driven College Counselling Guidance</h2>

        <p>
          TruMarg helps students compare admission possibilities
          using rank information, historical cutoffs, college
          options and branch preferences.
        </p>
      </section>

      <section>
        <h2>College Counselling Tools</h2>

        <ul>
          <li>
            <a href="/college-predictor">
              College Predictor 2026
            </a>
          </li>

          <li>
            <a href="/jee-main-college-predictor">
              JEE Main College Predictor
            </a>
          </li>

          <li>
            <a href="/uptac-college-predictor">
              UPTAC College Predictor
            </a>
          </li>
        </ul>
      </section>
    `
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
      'Explore career directions based on interests, strengths, preferences and your academic journey.',

    staticHtml: `
      <section>
        <h2>Structured Career Guidance for Students</h2>

        <p>
          TruMarg career guidance helps students explore career
          directions by considering interests, strengths,
          preferences and academic context.
        </p>

        <p>
          <a href="/career-discovery">
            Start Career Assessment
          </a>
        </p>
      </section>

      <section>
        <h2>What Career Assessment Can Explore</h2>

        <ul>
          <li>Student interests</li>
          <li>Strength patterns</li>
          <li>Work preferences</li>
          <li>Academic context</li>
          <li>Suitable career directions</li>
        </ul>
      </section>
    `
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
      'TruMarg helps students explore colleges, admission possibilities and career paths.',

    staticHtml: `
      <section>
        <h2>College and Career Decision Support</h2>

        <p>
          TruMarg provides tools for college prediction,
          admission guidance and structured career exploration
          to help students make more informed academic decisions.
        </p>

        <ul>
          <li>
            <a href="/college-predictor">
              College Predictor
            </a>
          </li>

          <li>
            <a href="/college-counselling">
              College Counselling Guidance
            </a>
          </li>

          <li>
            <a href="/career-guidance">
              Career Guidance
            </a>
          </li>
        </ul>
      </section>
    `
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
    <main
      id="seo-static-content"
      data-seo-static="true"
    >
      <header>
        <h1>${route.heading}</h1>
        <p>${route.intro}</p>
      </header>

      ${route.staticHtml || ''}
    </main>
  `;

  const rootMarker =
    '<div id="root"></div>';

  if (!html.includes(rootMarker)) {
    throw new Error(
      `Root marker not found while generating /${route.path}`
    );
  }

  return html.replace(
    rootMarker,
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