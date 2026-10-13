# Fastrack Tracker

A placement-cell app for tracking **fastrack** students across batches: daily attendance, company drives, applications, and per-student interview progress.

| Role | What they do |
|---|---|
| **Student** | View attendance, browse and apply to drives, follow each application's interview timeline |
| **Faculty** | Mark daily attendance for assigned batches, log interview stages for their students |
| **Dean** | Post company drives, view cross-batch analytics, assign faculty to batches |
| **Admin** | Manage users, roles and batches (and everything the dean can do) |

**Stack:** React + TypeScript + Vite + Tailwind 3 · TanStack Query · React Router 6 · Recharts · lucide-react — FastAPI — Supabase (Postgres, RLS, Auth) — Render.

```
supabase/   migrations (schema, RLS, analytics views), seed, RLS test suite
backend/    FastAPI app (app/), pytest suite (tests/)
frontend/   Vite React app (src/)
render.yaml Render Blueprint for both services
```

## Quick start: demo mode (no Supabase, no backend)

Want to see the app before setting anything up? Run only the frontend:

```bash
cd frontend
npm install
npm run dev        # open http://localhost:5173
```

When `VITE_DEMO_MODE=true`, or when the Supabase values are missing or still the `.env.example` placeholders, the app starts in **demo mode**. You'll see a dark **Demo mode** bar at the top:
- Pick **Student, Faculty, Dean or Admin** on the login page.
- You can also sign in with a demo email such as `ananya@demo.edu`, `meera@demo.edu`, `dean@demo.edu` or `admin@demo.edu`. The password is `demo1234`.
- The app comes loaded with sample data: 3 batches, 19 students, about 5 weeks of attendance, 6 drives, and applications with interview history.
- Everything works: applying, marking attendance, logging stages, posting drives, creating users. Users the admin creates can sign in too.
- Data is saved in **this browser's localStorage only**. It isn't shared between browsers or devices. Use **Reset** in the top bar to restore the sample data.

Demo mode applies the same role rules as the real API, but it is a preview, not a deployment. For real use, set up Supabase and the backend as described below.

## How security works

- **Supabase Auth** issues the JWT. The frontend signs in with `supabase.auth.signInWithPassword` and sends the access token to FastAPI as `Authorization: Bearer …`.
- **FastAPI verifies the token** (HS256 with `SUPABASE_JWT_SECRET`, or the project's JWKS for asymmetric signing keys; audience and issuer checked), then reads the caller's role from `profiles` and enforces it per route with `Depends(require_role([...]))`.
- **Every database call is made as the user**: the API forwards the user's JWT to PostgREST with the anon key, so **Row Level Security applies on every query**. Route guards are the first line of defence; RLS is the backstop. The service-role key is only used to create, update and delete auth users from the Admin screen.
- Roles live in `profiles.role` (and are mirrored into `app_metadata`). They are **never** taken from `user_metadata`, which any user can set at sign-up.

## Data model notes

The schema follows the spec, plus a few additions:

- `company_drives.eligible_departments text[]`: structured eligibility used for "drives matching me". An empty array means every department is eligible.
- `unique(drive_id, student_id)` on `drive_applications`, so a student can only apply once.
- Triggers:
  - `on_auth_user_created` creates the `profiles` row.
  - `on_status_logged` copies the latest `interview_status_log.stage` into `drive_applications.current_stage`.
- Analytics views (`security_invoker`, so they respect RLS): `batch_attendance_summary`, `student_attendance_summary`, `application_stage_counts`, `drive_application_counts`. Aggregating in SQL avoids PostgREST's 1000-row response cap.
- Interview stages: `applied → shortlisted → aptitude_cleared → round1_completed → round2_completed → hr_round → offered`, with `rejected` and `withdrawn` as terminal stages. Faculty can't change a closed application; dean and admin can.
- Faculty can read the `profiles` rows (names) of students in their batches. The spec's profile rule didn't allow this, but the attendance and interview screens need it.

## Local development

### 1. Supabase
1. Create a project at supabase.com. To run Supabase locally instead, use `supabase start`.
2. In the SQL editor, run the files in `supabase/migrations/` in order: `0001`, `0002`, `0003`, `0004`. If you already ran the first three, just run `0004` (review ratings, staff names readable by students, daily trend views).
3. Under **Authentication → Providers → Email**, turn off public sign-ups. Accounts are created by the admin.
4. Create your first user under **Authentication → Users → Add user** with auto-confirm on. Put that email into `supabase/seed.sql` and run it to make the user an admin.

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
python -m pytest -q
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm run dev                 # http://localhost:5173  (set VITE_DEMO_MODE=false)
```

### RLS tests
`supabase/tests/run_rls_tests.sh` applies the migrations to a throwaway database on any Postgres 15+ server, using a small stand-in for Supabase's `auth` schema. It then checks each role's access:
- students can't mark attendance, apply for someone else, or raise their own role
- faculty can't see or edit other batches
- dean and admin have the access they should

```bash
PGHOST=localhost PGUSER=postgres ./supabase/tests/run_rls_tests.sh
```

CI (`.github/workflows/ci.yml`) runs the backend tests, the frontend build and the RLS suite.

## API overview

| Method & path | Roles |
|---|---|
| `GET /health` | public |
| `GET /auth/me` | any signed-in user |
| `GET /batches` | any (faculty get only assigned batches) |
| `POST/PATCH/DELETE /batches…` | dean, admin |
| `GET /batches/{id}/students` | assigned faculty, dean, admin |
| `GET /batches/assignments/all`, `POST /batches/assignments`, `DELETE /batches/assignments/{id}` | dean, admin |
| `GET /attendance/me` | student |
| `GET /attendance/batch/{id}?date=`, `POST /attendance/bulk` | assigned faculty, dean, admin |
| `GET /drives` (`?upcoming=&eligible_only=`) | any |
| `POST/PATCH/DELETE /drives…` | dean, admin |
| `POST /drives/{id}/apply` | student |
| `GET /applications/me` | student |
| `GET /applications?batch_id=` | faculty (own batches), dean, admin |
| `POST /applications/{id}/stages` | faculty, dean, admin |
| `GET/POST/PATCH/DELETE /users…` | admin (dean can list) |
| `GET /analytics` | dean, admin |

## Deploying to Render

`render.yaml` is a Blueprint. In Render, choose **New → Blueprint** and select this repo. It creates:

- **`fastrack-api`**: Python web service.
  - Build: `pip install -r requirements.txt`
  - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Health check: `/health`
  - Env vars: the shared `fastrack-supabase` group (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), plus `SUPABASE_SERVICE_KEY`, `CORS_ORIGINS` and optionally `SUPABASE_JWT_SECRET`.
- **`fastrack-web`**: static site.
  - Build: `npm ci && npm run build`
  - Publish directory: `dist`
  - SPA rewrite: `/* → /index.html`
  - Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`.

After the first deploy:
1. Set the API's `CORS_ORIGINS` to the static site's URL.
2. Set `VITE_API_BASE_URL` to the API's URL.
3. Redeploy the static site. Vite bakes env vars in at build time.

> Vite only exposes `VITE_`-prefixed variables to the browser. The frontend can't read the shared group's `SUPABASE_*` names, so it has its own `VITE_*` copies with the same values.
