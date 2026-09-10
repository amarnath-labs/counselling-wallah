import {
  useEffect,
} from 'react';

import {
  useLocation,
} from 'react-router-dom';


const SITE_URL =
  'https://www.trumarg.com';


const ROUTE_SEO = {
  '/': {
    title:
      'TruMarg - College Predictor & Career Guidance for Students',

    description:
      'TruMarg helps students explore colleges, admission possibilities and career paths using rank, cutoff and personalized guidance.',

    robots:
      'index, follow',
  },

  '/college-predictor': {
    title:
      'College Predictor 2026 - JEE Main & UPTAC | TruMarg',

    description:
      'Use TruMarg College Predictor 2026 to explore engineering colleges using JEE Main or UPTAC rank, category, quota and historical cutoff data.',

    robots:
      'index, follow',
  },

  '/jee-main-college-predictor': {
    title:
      'JEE Main College Predictor 2026 | TruMarg',

    description:
      'Use TruMarg JEE Main College Predictor 2026 to explore NIT, IIIT, GFTI and engineering college options using rank, category, quota, preferences and historical cutoff data.',

    robots:
      'index, follow',
  },

  '/uptac-college-predictor': {
    title:
      'UPTAC College Predictor 2026 | TruMarg',

    description:
      'Use TruMarg UPTAC College Predictor 2026 to explore engineering college and branch options using rank, category, counselling preferences and historical UPTAC cutoff data.',

    robots:
      'index, follow',
  },
  '/career-guidance': {
    title:
      'Career Guidance for Students & Career Assessment | TruMarg',

    description:
      'Get career guidance for students with TruMarg. Explore interests, strengths, preferences and suitable career paths through a structured career assessment experience.',

    robots:
      'index, follow',
  },

  '/college-counselling': {
    title:
      'College Counselling & Admission Guidance | TruMarg',

    description:
      'Explore college counselling and admission guidance with TruMarg. Understand college options, branches, counselling rounds, cutoffs and admission possibilities.',

    robots:
      'index, follow',
  },

  '/about': {
    title:
      'About TruMarg - College & Career Guidance Platform',

    description:
      'Learn about TruMarg, a college prediction and career guidance platform helping students make informed academic and career decisions.',

    robots:
      'index, follow',
  },

  '/exams': {
    title:
      'Entrance Exams & College Prediction | TruMarg',

    description:
      'Select your entrance exam and explore personalized college options with TruMarg.',

    robots:
      'index, follow',
  },

  '/career-discovery': {
    title:
      'Career Explorer & Career Assessment | TruMarg',

    description:
      'Explore career paths with TruMarg Career Explorer and personalized student assessment tools.',

    robots:
      'index, follow',
  },
};


const NOINDEX_ROUTES = new Set([
  '/profile',
  '/results',
  '/compare',
  '/choice-list',
  '/payment-result',
  '/dashboard',
  '/documents',
  '/login',
  '/register',
  '/account',
]);


function ensureMeta(
  name,
  content
) {
  let element =
    document.querySelector(
      `meta[name="${name}"]`
    );

  if (!element) {
    element =
      document.createElement(
        'meta'
      );

    element.setAttribute(
      'name',
      name
    );

    document.head.appendChild(
      element
    );
  }

  element.setAttribute(
    'content',
    content
  );
}


function ensureCanonical(
  href
) {
  let element =
    document.querySelector(
      'link[rel="canonical"]'
    );

  if (!element) {
    element =
      document.createElement(
        'link'
      );

    element.setAttribute(
      'rel',
      'canonical'
    );

    document.head.appendChild(
      element
    );
  }

  element.setAttribute(
    'href',
    href
  );
}


export default function RouteSEO() {
  const location =
    useLocation();

  useEffect(
    () => {
      const path =
        location.pathname;

      const config =
        ROUTE_SEO[path];


      if (config) {
        document.title =
          config.title;

        ensureMeta(
          'description',
          config.description
        );

        ensureMeta(
          'robots',
          config.robots
        );

        ensureCanonical(
          path === '/'
            ? `${SITE_URL}/`
            : `${SITE_URL}${path}`
        );

        return;
      }


      if (
        path.startsWith(
          '/colleges/'
        )
      ) {
        document.title =
          'College Details, Fees & Cutoffs | TruMarg';

        ensureMeta(
          'description',
          'Explore college details, branches, fees, admission information and cutoff data on TruMarg.'
        );

        ensureMeta(
          'robots',
          'index, follow'
        );

        ensureCanonical(
          `${SITE_URL}${path}`
        );

        return;
      }


      if (
        NOINDEX_ROUTES.has(
          path
        )
      ) {
        document.title =
          'TruMarg';

        ensureMeta(
          'robots',
          'noindex, follow'
        );

        ensureCanonical(
          `${SITE_URL}${path}`
        );

        return;
      }


      document.title =
        'TruMarg';

      ensureMeta(
        'robots',
        'noindex, follow'
      );

      ensureCanonical(
        `${SITE_URL}${path}`
      );
    },
    [
      location.pathname,
    ]
  );

  return null;
}
