# Counselling Wallah Backend — Phase 2

Phase 2 introduces the first real backend boundary and PostgreSQL integration.

## Stack

- Node.js
- Express
- PostgreSQL
- `pg` for database access
- `dotenv` for local configuration
- CORS for local frontend development

## What is implemented

- `GET /api/health` — verifies API + PostgreSQL connectivity
- `GET /api/exams`
- `GET /api/exams/:id`
- `GET /api/colleges`
- `GET /api/colleges/:id`
- `GET /api/colleges/:id/cutoffs`
- `GET /api/counselling/events`
- PostgreSQL migrations
- Demo-data seed process
- Frontend catalog loading from the backend with local demo fallback

## What is intentionally NOT implemented

- Real authentication/authorization — planned for Phase 5
- Real payment processing — planned for Phase 7
- Production recommendation engine — planned for Phase 4
- Verified admission-data pipeline — planned for Phase 3
- Admin panel — planned for Phase 6
- AI counsellor — planned for Phase 8

The imported dataset remains the prototype's local/demo dataset. Database rows are marked `is_verified = false`; moving data into PostgreSQL does not make it verified.

## Setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL:

```powershell
docker compose up -d postgres
```

3. Install backend dependencies:

```powershell
cd backend
npm install
```

4. Run migration:

```powershell
npm run db:migrate
```

5. Seed the prototype dataset:

```powershell
npm run db:seed
```

6. Start the API:

```powershell
npm run dev
```

API: `http://localhost:4000`

Health check: `http://localhost:4000/api/health`

## If PostgreSQL is installed locally

Docker is optional. You can use a local PostgreSQL server instead, as long as `DATABASE_URL` points to it.
