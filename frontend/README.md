# Counselling Wallah Frontend

React + Vite frontend refactored from the existing single-file prototype. The existing repository already had a reasonable React/Vite setup, so Phase 1 reuses it instead of introducing unnecessary framework churn.

## Routes
`/`, `/exams`, `/profile`, `/results`, `/colleges/:id`, `/compare`, `/choice-list`, `/pricing`, `/dashboard`, `/counselling`, `/documents`.

## Data
Demo data is separated into `src/data/exams.js`, `colleges.js`, `branches.js`, `states.js`, and `demoData.js`. `appData.js` remains only as a compatibility barrel for imports.

## Services
`src/services/` contains local/mock exam, college, recommendation, counselling and payment modules. These are intended seams for future backend/API integration.

## Demo limitations
Authentication, persistence, real payments, verified production data, backend validation, and production recommendation logic are intentionally not implemented.
