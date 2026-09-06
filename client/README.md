# Support Helpdesk Ticketing System — Frontend (Phase 3)

React + TypeScript + Vite frontend for the helpdesk system. Talks to the
Phase 1/2 backend over the REST API -- this project has no server of its
own beyond Vite's dev server.

## Stack

React 19 - TypeScript - Vite - React Router - TanStack Query - Tailwind v4

- **TanStack Query** manages all server data (the ticket list/detail,
  categories, users) -- cache, loading, and error states are handled by
  the library rather than hand-rolled `useState`/`useEffect` per request.
- **React Context** manages the two pieces of state that aren't "server
  data": the current authenticated user/session (`AuthContext`) and toast
  notifications (`ToastContext`).
- **The URL is the source of truth for the ticket queue's filters**
  (`useTicketFilters` reads/writes `useSearchParams`), so a filtered/sorted/
  paginated view is shareable and survives a refresh, per the assignment.

## Setup

```bash
npm install
cp .env.example .env    # defaults already point at http://localhost:5000/api
npm run dev
```

Open `http://localhost:5173`. **The backend must already be running** on
`http://localhost:5000` (Phase 1/2) -- this app is just the client.

If your backend runs on a different port/host, edit `.env`:
```
VITE_API_URL="http://localhost:5000/api"
```

## Project structure

```
client/
|-- src/
|   |-- api/          # typed fetch functions per resource (auth, tickets, categories, users)
|   |-- components/   # Layout, route guards, badges, filter bar, ticket table, modals
|   |-- context/       # AuthContext (session), ToastContext (notifications)
|   |-- hooks/         # TanStack Query hooks, URL-synced filter state
|   |-- pages/         # one file per route
|   |-- types/         # shared TS types mirroring the backend's shapes
|   |-- App.tsx        # routes + role-based guards
|   `-- main.tsx        # provider wiring
|-- .env.example
|-- package.json
`-- vite.config.ts
```

## Role-based dashboards

Per the assignment, each role lands on a dashboard suited to what it
actually needs -- not one generic screen with parts hidden by role:

- **User** (`/dashboard` when logged in as `user`) -- "My tickets" with
  Open/Resolved tabs, a "New ticket" button, click-through to detail +
  comments. Scoped server-side to the user's own tickets (the backend
  enforces this regardless of what the client sends).
- **Moderator** (`/dashboard`) -- the shared, paginated, filterable ticket
  queue: status/priority/category toggle filters, assignee (anyone /
  unassigned / assigned to me / a specific moderator), free-text search,
  sort by date or priority, and a summary strip (unassigned / assigned to
  me / urgent counts).
- **Admin** (`/dashboard`, `/admin/users`, `/admin/categories`) -- the same
  ticket queue as moderator (per the assignment: "Admins should also be
  able to open the same ticket table/queue as moderators"), plus user
  role/active-status management and category management.

## Ticket detail & quick actions

Clicking any ticket (from any dashboard) opens `/tickets/:id`: full
description, category/assignee/timestamps, the comment thread, and a
reply box. For moderator/admin, an actions bar lets them change
status/priority/assignee inline without leaving the page -- admin also
gets a "Close ticket" button (calls `DELETE`, the Phase 2 soft-delete).
A plain `user` viewing their own ticket sees no management controls at
all, only the read view + reply box.

## UX details worth noting

- Every async action (create ticket, update status, assign, add comment,
  create category, update a user) shows a disabled/"...ing" button state
  while in flight, and a toast on success or a specific inline/toast error
  on failure -- no silent failures.
- The ticket table distinguishes **"no tickets match these filters"**
  (filters are active) from **"no tickets yet"** (truly empty), per the
  assignment's explicit callout.
- Free-text search is debounced (400ms) so it doesn't fire a request per
  keystroke.
- Self-deactivation is blocked in the UI too (the Deactivate button is
  disabled on your own row in Admin -> Users), on top of the backend's 400.

## What's a conscious simplification (not an oversight)

- **Quick actions live on the ticket detail page, not inline in the queue
  table row.** The assignment says the moderator dashboard needs "quick
  actions to assign, reprioritize, change status, and reply" -- I read
  "quick" as "without a page reload / full form," which the detail page's
  inline selects satisfy, rather than literally in-row dropdowns in the
  table itself. Happy to move these inline if you'd prefer that reading.
- **Category multi-select filter is rendered as toggle pills**, not a
  native `<select multiple>` -- functionally equivalent, better UX, and
  reasonable given the small number of seeded categories.
- No dedicated admin "metrics" view (tickets by status/category, average
  resolution time) yet -- the assignment scopes that as Phase 3/4 dashboard
  polish; the ticket queue's own filters can answer most of these
  questions today. Flagging this as the one piece of Section 4's Admin
  dashboard description not yet built, rather than silently skipping it.
