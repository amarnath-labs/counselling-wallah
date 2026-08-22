# Counselling Wallah Database — Phase 2

Phase 2 creates the PostgreSQL foundation. The schema is designed so later phases can add verified admission data without changing the frontend data shape unnecessarily.

## Current tables

- `exams`
- `colleges`
- `branches`
- `cutoffs`
- `data_sources`
- `counselling_events`

## Future domains from the roadmap

The project requirements identify future database domains such as users/profiles, choice lists, and additional counselling/payment data. Authentication and user-specific persistence are intentionally deferred to later phases.

## Data provenance rule

The current seed comes from the Phase-1 prototype. It is **demo/local data**. PostgreSQL storage does not imply that a record is verified. Cutoff rows therefore default to `is_verified = false` and retain their source labels for future provenance work.

## Migration

```powershell
cd backend
npm run db:migrate
```

## Seed

```powershell
npm run db:seed
```

Do not edit generated seed data to make demo numbers look official. Phase 3 is where the verified admission-data pipeline should be built.
