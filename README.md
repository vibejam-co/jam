# VibeJam: Midnight Zenith

VibeJam now includes a production-ready backend path using **Vercel Functions + Supabase**.

## What is integrated

- `GET/POST /api/apps` for persistent jam/app publishing.
- `GET /api/notifications` for notification center hydration.
- `POST /api/newsletter` for newsletter subscriptions.
- `POST /api/canvas` for Canvas onboarding persistence.
- Supabase SQL migration for core data model + RLS.
- Supabase seed script for initial marketplace/ranking data.

## Stack

- Frontend: React 19 + Vite + Framer Motion + Recharts
- Backend: Vercel Serverless Functions (`/api`)
- Database: Supabase Postgres

## 1) Local setup

Prerequisites:

- Node.js 20+
- Supabase CLI (optional but recommended)

Install dependencies:

```bash
npm install
```

Create env file:

```bash
cp .env.example .env.local
```

Fill these values in `.env.local`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL` (optional today)
- `VITE_SUPABASE_ANON_KEY` (optional today)

Run app:

```bash
npm run dev
```

## 2) Supabase setup

Apply SQL migration from:

- `supabase/migrations/20260210193000_init_vibejam.sql`

Then seed data from:

- `supabase/seed.sql`

If using CLI locally:

```bash
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

## 3) Vercel setup

Deploy with Vercel (project root):

```bash
vercel
```

Required Vercel environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`vercel.json` is configured for Vite + Node.js 20 API runtime.

## 4) Git workflow

Repository branch used for this integration:

- `codex/backend-integration`

Typical flow:

```bash
git add .
git commit -m "feat: integrate Supabase + Vercel backend for core VibeJam flows"
git push -u origin codex/backend-integration
```

## API contract quick reference

- `GET /api/apps` -> `{ data: VibeApp[] }`
- `POST /api/apps` with `{ app: VibeApp }` -> `{ data: VibeApp[] }`
- `GET /api/notifications` -> `{ data: Notification[] }`
- `POST /api/newsletter` with `{ email: string }` -> `{ data: { success: true } }`
- `POST /api/canvas` with Canvas onboarding payload -> `{ data: { success: true } }`
