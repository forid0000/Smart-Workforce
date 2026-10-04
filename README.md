# Smart Workforce & Task Allocation System

**CP-1 (First 10% Working Version)**

A DBMS-focused web project that manages employees, departments, skills, projects, tasks, and assigns tasks using a skill-based, workload-aware recommendation engine.

## Tech Stack

- **Frontend**: React 18 (Vite) + Tailwind CSS + React Router
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (with Prisma ORM)
- **Auth**: JWT-ready (basic login implemented, ready for full JWT middleware)

## Folder Structure

```
Smart Workfroce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── lib/         (prisma client, api error)
│       ├── middleware/  (jwt auth)
│       ├── routes/      (express routes)
│       ├── controllers/ (request handlers)
│       ├── services/    (recommendation engine)
│       └── utils/       (workload calc)
└── frontend/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── components/  (Badge, Card, WorkloadBar, Modal, Spinner, EmptyState, ErrorBanner)
        ├── layouts/     (AppLayout with Sidebar)
        ├── pages/       (Login, Dashboard, Employees, Skills, Projects, Tasks, TaskAssignment)
        ├── services/    (axios api client)
        └── hooks/       (useAuth)
```

## Prerequisites

1. Node.js 18+
2. PostgreSQL 13+ running locally
3. A database called `smart_workforce`

## Setup

### 1. Database

```sql
CREATE DATABASE smart_workforce;
```

(Use default `postgres` user with password `postgres`, or update `DATABASE_URL` in `backend/.env`.)

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init     # or: npx prisma db push
npm run prisma:seed                     # loads sample departments, employees, skills, projects, tasks
npm run dev                             # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                             # starts on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`.

## Environment

### `backend/.env`

```
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_workforce?schema=public"
JWT_SECRET=change_me_to_a_long_random_string_for_viva_demo
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### `frontend/.env`

```
VITE_API_URL=http://localhost:5000/api
```

## Demo Credentials

| Role     | Email                          | Password      |
|----------|--------------------------------|---------------|
| ADMIN    | admin@smartworkforce.com       | admin123      |
| EMPLOYEE | rahim@example.com              | employee123   |

## API Endpoints

| Method | Endpoint                              | Description                       |
|--------|---------------------------------------|-----------------------------------|
| GET    | `/api/health`                         | Health and DB connection check    |
| POST   | `/api/auth/login`                     | Login → returns JWT               |
| GET    | `/api/auth/me`                        | Current user (JWT)                |
| GET    | `/api/dashboard`                      | Dashboard stats + workload        |
| GET    | `/api/departments`                    | List departments                  |
| POST   | `/api/departments`                    | Create department                 |
| GET    | `/api/employees`                      | List employees (search `?q=`)     |
| GET    | `/api/employees/:id`                  | Get employee                      |
| POST   | `/api/employees`                      | Create employee                   |
| GET    | `/api/skills`                         | List skills                       |
| POST   | `/api/skills`                         | Create skill                      |
| GET    | `/api/projects`                       | List projects                     |
| POST   | `/api/projects`                       | Create project                    |
| GET    | `/api/tasks`                          | List tasks                        |
| POST   | `/api/tasks`                          | Create task                       |
| GET    | `/api/tasks/:id`                      | Task details                      |
| GET    | `/api/tasks/:id/recommendations`      | Ranked employee recommendations   |
| POST   | `/api/tasks/:id/assign`               | Assign task → employee            |

## Smart Recommendation Algorithm

Weighted scoring model used during CP-1:

| Component        | Weight |
|------------------|--------|
| Skill Match      | 40%    |
| Workload Balance | 25%    |
| Availability     | 20%    |
| Deadline Fit     | 15%    |

- **Skill Match**: % of required skills the employee has, plus average skill level.
- **Workload Balance**: lower workload % → higher score.
- **Availability**: AVAILABLE → 100, BUSY → 50, UNAVAILABLE → 0.
- **Deadline Fit**: based on remaining capacity (capacity × daysToDeadline − alreadyAssignedHours) vs. estimated task hours.

Final score = 0.40·Skill + 0.25·Workload + 0.20·Availability + 0.15·Deadline.

Result labels:
- ≥ 80 → HIGHLY RECOMMENDED
- ≥ 60 → RECOMMENDED
- ≥ 40 → POSSIBLE
- <  40 → NOT RECOMMENDED

## Workload Formula

```
Workload% = (sum of estimated hours of active assigned tasks) / (daily capacity) * 100
```

Thresholds:
- < 60%   → Available
- 60–79%  → Normal
- 80–99%  → High
- ≥ 100%  → Overloaded

## Database Relationships

```
Department 1 ── N Employee
Employee   N ── M Skill  (via EmployeeSkill)
Project    1 ── N Task
Task       N ── M Skill  (via TaskSkill)
Task       N ── M Employee (via TaskAssignment)
User       1 ── 1 Employee (optional)
```

All relationships are enforced with foreign keys. EmployeeSkill and TaskSkill are M:N junction tables (3NF). Ondelete rules: cascade for skills and assignments, restrict for department.

## CP-1 Demo Flow

1. Open `http://localhost:5173`.
2. Log in as Admin.
3. Show Dashboard (numbers come from PostgreSQL).
4. Open Employees → see 5 employees with departments, capacity, workload, skills.
5. Open Skills → see all skills with employee counts.
6. Open Projects → see sample projects.
7. Open Tasks → see existing tasks.
8. Create a new task (title, project, priority, hours, deadline, required skills).
9. Open Task Assignment → select the new task → see ranked employees.
10. Click "Assign" on the best employee.
11. Confirm the assignment was saved (task status → ASSIGNED).

## CP-1 Acceptance Checklist

- [x] Frontend runs (Vite + React 18)
- [x] Backend runs (Express)
- [x] PostgreSQL connects via Prisma
- [x] Migration / `db push` works
- [x] Seed loads sample data
- [x] All REST endpoints work
- [x] Login flow works (JWT token issued)
- [x] Dashboard fetches real data
- [x] Employee / Skill / Project / Task pages work
- [x] Recommendation engine calculates scores
- [x] Assignment saves to DB and updates task status

## Next Phases

- Work logs, task history, comments
- AI task classification, deadline risk detection
- Notifications
- Mobile app
- Advanced analytics and forecasting