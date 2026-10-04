# Frontend – Smart Workforce

## Quick Start

```bash
npm install
npm run dev
```

Default URL: `http://localhost:5173`

The dev server proxies `/api/*` requests to `http://localhost:5000` (configured in `vite.config.js`).

## Folder Layout

```
frontend/
└── src/
    ├── main.jsx          # Entry, mounts React + Router + AuthProvider
    ├── App.jsx           # Routes & ProtectedRoute
    ├── index.css         # Tailwind directives
    ├── components/       # Reusable UI: Badge, Card, WorkloadBar, Modal, Spinner, EmptyState, ErrorBanner
    ├── layouts/          # AppLayout (Sidebar + Header)
    ├── pages/            # Login, Dashboard, Employees, Skills, Projects, Tasks, TaskAssignment
    ├── services/api.js   # Axios instance + API helpers
    └── hooks/            # useAuth (Context-based auth state)
```

## Demo Credentials

- **Admin**: `admin@smartworkforce.com` / `admin123`
- **Employee**: `rahim@example.com` / `employee123`