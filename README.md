# Support Helpdesk Ticketing System

PwC Middle East Associate Frontend Candidate Case Study — submission-ready
build (Phases 1–4 complete).

## Overview

An internal helpdesk where employees submit support tickets, a small team
of support agents triages and resolves them from a shared queue, and an
administrator manages accounts, categories, and has full visibility across
the system.

| Role | What they can do |
|---|---|
| **User** | Create tickets, view/comment on only their own tickets, track status via "My tickets" |
| **Moderator** | View the entire shared ticket queue, filter/sort/search it, assign tickets to themselves or another moderator, change status/priority, reply to any ticket |
| **Admin** | Everything a moderator can do, plus: create/deactivate accounts and change roles, manage categories, hard-close (soft-delete) tickets |

Every role rule is enforced **server-side** — the UI hides controls a role
shouldn't see, but the API rejects the same actions independently (see
Security/RBAC below).

## Project structure

```
server/   Express + TypeScript + Prisma/SQLite REST API (Phases 1–2)
client/   React + TypeScript + Vite frontend (Phase 3), plus dark mode,
          English/Arabic i18n, and login form validation added as
          deliberate extras beyond the assignment's own requirements
```

## Setup

### 1. Server

```bash
cd server
npm install
```

Create `server/.env`:
```
DATABASE_URL="file:./dev.db"
PORT=5000
CLIENT_URL="http://localhost:5173"
SESSION_SECRET="dev-only-secret-change-me"
NODE_ENV="development"
```

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

**Note:** `prisma migrate reset` does **not** auto-seed in this Prisma
version — it must be followed by `prisma db seed` (or just use the
combined script below):
```bash
npm run db:fresh   # = prisma migrate reset --force && prisma db seed
```

### 2. Client

```bash
cd client
npm install
cp .env.example .env
```

`.env` already points at `http://localhost:5000/api` by default.

## Running it

Two terminals:
```bash
# Terminal 1
cd server && npm run dev     # http://localhost:5000

# Terminal 2
cd client && npm run dev     # http://localhost:5173
```

Swagger docs: `http://localhost:5000/api-docs`

## Seeded accounts

Pulled directly from `server/prisma/seed.ts` — these are the actual
credentials in the database after seeding, not placeholders:

| Name | Email | Password | Role |
|---|---|---|---|
| Amina Admin | `admin@example.com` | `Admin123!` | admin |
| Gokul Kumar | `gokul@example.com` | `Gokul123!` | admin |
| Zaid Taha | `zaid@example.com` | `Zaid123!` | moderator |
| Priya Agent | `priya@example.com` | `Moderator123!` | moderator |
| Jordan Employee | `jordan@example.com` | `User123!` | user |
| Ahmad Awartani | `ahmad@example.com` | `Ahmad123!` | user |
| Omar Rasheed | `omar@example.com` | `User123!` | user |

Plus 3 categories and ~16 tickets spread across every status × priority
combination with a mix of assigned/unassigned tickets, so filtering has
meaningful data to work with immediately.

## State management: why TanStack Query

Server data (the ticket list/detail, categories, users) is managed by
**TanStack Query** rather than hand-rolled `useState`/`useEffect`: it gives
cache, loading, and error states for free, de-duplicates in-flight
requests, and `invalidateQueries` after a mutation (e.g. updating a
ticket's status) keeps the list and detail view in sync without manual
refetch logic. The two pieces of state that *aren't* server data — the
current session and toast notifications — use plain **React Context**
instead, since there's nothing to cache or refetch there.

## API contract summary

| Method | Path | Roles allowed |
|---|---|---|
| GET | `/api/health` | none (public) |
| POST | `/api/auth/login` | none (public) |
| POST | `/api/auth/logout` | any authenticated |
| GET | `/api/auth/me` | any authenticated |
| GET | `/api/tickets` | any authenticated (user sees only their own) |
| POST | `/api/tickets` | any authenticated |
| GET | `/api/tickets/:id` | requester, or moderator/admin |
| PATCH | `/api/tickets/:id` | moderator, admin |
| DELETE | `/api/tickets/:id` | admin |
| POST | `/api/tickets/:id/comments` | requester, or moderator/admin |
| GET | `/api/categories` | any authenticated |
| POST | `/api/categories` | admin |
| GET | `/api/users` | admin |
| POST | `/api/users` | admin |
| PATCH | `/api/users/:id` | admin |

Full request/response schemas are in Swagger (`/api-docs`).

## Extra features beyond the assignment's requirements

Added deliberately as polish, not because the PDF asked for them — flagging
this explicitly so it reads as a scope choice, not scope confusion:

1. **Dark mode** — a `ThemeContext` toggling a `.dark` class on `<html>`,
   with the entire palette redefined as CSS custom properties under that
   class. Every component already uses semantic color tokens (`bg-surface`,
   `text-ink`, etc.) rather than raw Tailwind colors, so no component needed
   per-element `dark:` variant classes to support this.
2. **English/Arabic i18n** via `react-i18next`, with full text coverage
   across every page and component (verified during Phase 4 integration
   testing — see below for what was found and fixed).
3. **Inline client-side login validation** (email format, password length)
   with per-field error messages, in addition to the server's own
   validation.

## Scope deliberately left out

- **Full RTL layout mirroring.** Arabic sets `document.dir="rtl"` and all
  text genuinely translates, but layouts (flex/grid direction, icon
  placement, etc.) are not mirrored — the page reads right-to-left for
  text but the visual layout stays left-to-right structured. A conscious
  trade-off given time, not an oversight.
- **Admin metrics/analytics view** (tickets by status/category, average
  resolution time) — the assignment scopes this as dashboard polish; the
  ticket queue's own filters can answer most of these questions today, but
  there's no dedicated chart/summary view.
- **Native browser validation language on the admin "create account"
  form** — that form uses plain HTML `required`/`minLength` attributes
  rather than the custom validator pattern used on the login form, so its
  validation popups follow the browser's own locale, not the app's
  selected language. The New Ticket modal and Login form both use fully
  custom (translated) validation; this one form doesn't yet.

## Known limitations / decisions worth a reviewer's attention

- **Ticket assignment is restricted to moderator/admin accounts.** `PATCH
  /api/tickets/:id` with an `assigneeId` checks the target user's role and
  rejects (400) assigning to a plain `user` account. Not explicitly stated
  in the assignment, but assigning a ticket to a non-agent account doesn't
  match the "shared queue worked by agents" model.
- **`DELETE /api/tickets/:id` is a soft-delete** (status → `closed`), not a
  row deletion, reserved for admins; moderators reach the same status via
  `PATCH`. A hard delete would also orphan the ticket's comment history.
- **Sessions are stateless, signed HTTP-only cookies**, not a server-side
  session table. Logout clears the cookie; there's no way to server-side
  revoke a still-unexpired token before it's cleared/expires. A production
  version would likely add a `Session` table for true revocation.
- **Dark-mode button contrast**: solid primary-colored buttons (e.g. "Sign
  in", "Submit ticket") use white text on the dark-mode primary blue, which
  measures roughly 2.9:1 contrast — under WCAG AA's 3:1 threshold even for
  large/bold text. The same color token is also used for links/active-nav
  text in dark mode, where a *lighter* blue is correct for contrast against
  the dark background — one token can't satisfy both roles well. Fixing
  this properly needs a second, darker token reserved for button fills;
  flagged for a decision rather than changed without sign-off, per this
  phase's "don't redesign" scope.
- **Very long `search` query strings** now return a `400` validation error
  (added a 200-character cap during Phase 4 security testing) rather than
  being silently processed — verified this doesn't affect any legitimate
  search use case.
