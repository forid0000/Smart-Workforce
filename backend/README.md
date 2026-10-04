# Backend – Smart Workforce API

## Quick Start

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Default URL: `http://localhost:5000`

## Folder Layout

```
backend/
├── prisma/
│   ├── schema.prisma    # Prisma schema (data model)
│   └── seed.js          # Sample data
└── src/
    ├── server.js        # Bootstraps Express
    ├── app.js           # Express app, routes, error handler
    ├── lib/             # Prisma client + ApiError
    ├── middleware/      # JWT auth middleware
    ├── routes/          # Route definitions (REST endpoints)
    ├── controllers/     # Request handlers
    ├── services/        # Business logic (recommendation engine)
    └── utils/           # Pure functions (workload calc)
```

## Health Check

```
GET /api/health
```

Returns `{ success: true, db: "connected" }` if PostgreSQL is reachable.

## Recommendation Engine

See `src/services/recommendation.service.js`. Weights are exported as
`WEIGHTS` and documented in the root README.