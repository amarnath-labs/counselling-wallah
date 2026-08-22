# Counselling Wallah

Counselling Wallah is an independent college-counselling guidance platform for Indian students. The original single-file HTML prototype has been refactored into a structured frontend and is now being extended with the Phase-2 backend/PostgreSQL boundary.

## Current status

- Phase 1: Frontend architecture — completed
- Phase 2: Backend + PostgreSQL — implemented in this branch/package
- Phase 3: Verified admission data — not implemented
- Phase 4: Real recommendation engine — not implemented
- Phase 5: Authentication + persistent dashboard — not implemented
- Phase 6: Admin panel — not implemented
- Phase 7: Payments — not implemented
- Phase 8: AI counsellor — not implemented

The original HTML prototype is preserved under `prototype/` as the source-of-truth reference.

## Phase 2 architecture

```text
React + Vite frontend
        |
        | HTTP JSON API
        v
Node.js + Express backend
        |
        | pg
        v
PostgreSQL
```

The frontend loads exams, colleges and counselling events from the backend when available. If the API is unavailable during development, it falls back to the Phase-1 local/demo catalog so the UI remains usable.

## Run locally

### 1. Start PostgreSQL

If Docker is installed:

```powershell
docker compose up -d postgres
```

### 2. Start the backend

```powershell
cd backend
copy .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend: `http://localhost:4000`

### 3. Start the frontend in another terminal

```powershell
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

The frontend uses `VITE_API_BASE_URL=http://localhost:4000/api` by default.

## Demo limitations

The current dataset remains prototype/demo data. It includes illustrative fees/placements and cutoff records that may be estimated or secondary-sourced. Database storage does not turn them into verified admission data.

The recommendation engine remains the Phase-1 local heuristic. Real eligibility/recommendation logic belongs after the verified-data phase.

Authentication, user persistence, real payments, admin tooling and AI counselling are intentionally deferred to later roadmap phases.
