TRUMARG CAREER ADAPTIVE V2

This package implements:
- session-based adaptive assessment
- PostgreSQL persistence
- deterministic trait scoring
- deterministic career matching
- confidence-based stopping
- metadata-based adaptive question retrieval

It intentionally does NOT add a fake "true vector RAG" implementation without
a real embedding provider. The retrieval interface is modular so pgvector can
be added cleanly after the core session flow is stable.

INSTALLATION

1) Copy backend/src/* files into your backend/src tree.

2) Run migrations against counselling_wallah:
   psql "$DATABASE_URL" -f backend/src/db/migrations/20260907_career_adaptive_v2.sql
   psql "$DATABASE_URL" -f backend/src/db/migrations/20260907_seed_career_questions.sql

3) In your CURRENT backend/src/server.js add:

   import careerAssessmentV2Router
     from './routes/careerAssessmentV2.js';

   and BEFORE your 404 handler:

   app.use(
     '/api/career',
     careerAssessmentV2Router
   );

4) Restart backend:
   npm run dev

5) Test:
   POST /api/career/assessment/start
   POST /api/career/assessment/:id/answer
   GET  /api/career/assessment/:id/report

Do not overwrite your production server.js with an older version.
