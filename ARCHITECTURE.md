# Architecture

Personal portfolio for **Ajay Tewari** — Staff Engineer & Technical Lead.
Built with Next.js 14 App Router, Turso (libSQL), Pusher Channels, and Vercel.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Data Flows](#4-data-flows)
5. [Feature Modules](#5-feature-modules)
   - [Visitor Tracking](#51-visitor-tracking)
   - [Real-Time Presence & Cursors](#52-real-time-presence--cursors)
   - [Journal — Feed Tab](#53-journal--feed-tab)
   - [Journal — Mindspace Tab](#54-journal--mindspace-tab)
   - [Q&A Section](#55-qa-section)
   - [Admin Dashboard](#56-admin-dashboard)
   - [Token Health Monitor](#57-token-health-monitor)
6. [Database Schema](#6-database-schema)
7. [API Routes Reference](#7-api-routes-reference)
8. [Authentication & Security](#8-authentication--security)
9. [Logging](#9-logging)
10. [Shared Utilities](#10-shared-utilities)
11. [Environment Variables](#11-environment-variables)
12. [External Services](#12-external-services)

---

## 1. High-Level Overview

```
Browser
  │
  ├─ Next.js App  (Vercel Edge + Serverless)
  │    ├─ Public pages     → server + client components, all section content
  │    ├─ Admin pages      → iron-session authenticated, server-rendered (force-dynamic)
  │    └─ API routes       → REST handlers for visitors, journal, Q&A, Pusher auth
  │
  ├─ Turso (libSQL)        → visitors · journal_entries · journal_reactions · visitor_questions
  ├─ Pusher Channels       → real-time presence channel, client-triggered cursor events
  └─ GitHub REST API       → journal feed (commits from top repos, cached 5 min)
```

The app follows Next.js App Router conventions: **server components** own data
fetching and auth checks; **client components** (`'use client'`) own interactivity,
state, and browser APIs.

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 |
| UI | React | 18 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS + inline styles | 3.4.1 |
| Font | Nunito (Google Fonts) | 400/600/700/800 |
| Database | Turso (libSQL / `@libsql/client`) | 0.17 |
| Auth | iron-session | 8.0.4 |
| Password Hashing | bcryptjs | 3.0.3 |
| Real-time | Pusher Channels (server + JS client) | 5.3 / 8.4 |
| Email (SMTP) | nodemailer | 6.x |
| Analytics | Vercel Analytics | 2.0.0 |
| Hosting | Vercel | — |

---

## 3. Directory Structure

```
atewari-portfolio/
│
├── app/
│   ├── layout.tsx                  Root layout — font, Nav, Footer, VisitorModal, Analytics
│   ├── page.tsx                    Home page — section order: Hero → Journal → Q&A →
│   │                               Projects → About → Certifications → Publications → Contact
│   ├── globals.css                 CSS custom properties (bg, surface, accent, border, muted…)
│   │
│   ├── admin/
│   │   ├── layout.tsx              Admin layout wrapper
│   │   ├── page.tsx                Dashboard (server, force-dynamic) — token health, stats,
│   │   │                           journal form, Q&A manager, visitor table
│   │   ├── login/page.tsx          Login form (public)
│   │   ├── AdminActions.tsx        Logout + change-password modal (client)
│   │   ├── TokenAlerts.tsx         Server component — credential health rows
│   │   ├── VisitorTable.tsx        Paginated/selectable visitor table (client)
│   │   ├── WriteJournalForm.tsx    Create + delete manual journal entries (client)
│   │   └── QuestionsAdmin.tsx      Answer + delete visitor questions (client)
│   │
│   └── api/
│       ├── visitor/route.ts        POST record · PATCH name · DELETE bulk (admin)
│       ├── journal/
│       │   ├── route.ts            GET paginated feed · POST manual entry (admin)
│       │   ├── [id]/route.ts       DELETE entry (admin)
│       │   └── react/route.ts      POST toggle like/dislike
│       ├── questions/
│       │   ├── route.ts            GET all · POST new question
│       │   └── [id]/route.ts       PATCH answer · DELETE (admin)
│       ├── pusher/
│       │   └── auth/route.ts       POST sign presence channel
│       └── admin/
│           ├── login/route.ts      POST authenticate, create session
│           ├── logout/route.ts     POST destroy session
│           └── change-password/
│               └── route.ts        POST update bcrypt hash
│
├── components/
│   ├── Nav.tsx                     Sticky header — section anchors, Home/Admin toggle
│   ├── Hero.tsx                    Profile, bio, resume viewer modal + download
│   ├── JournalSection.tsx          Feed + Mindspace tabs, pagination, reactions, date column
│   ├── QuestionsSection.tsx        Ask form + paginated Q&A list, answer overlay modal
│   ├── ProjectsSection.tsx         Filterable project card grid
│   ├── ProjectCard.tsx             Single project card
│   ├── AboutSection.tsx            Skills by domain
│   ├── CertificationsSection.tsx   Certification badges
│   ├── PublicationsSection.tsx     Substack article links
│   ├── ContactSection.tsx          Email, LinkedIn, GitHub contact cards
│   ├── Footer.tsx                  Footer with links + copyright
│   └── VisitorModal.tsx            First-visit modal — name capture, Pusher, remote cursors
│
└── lib/
    ├── logger.ts                   Structured JSON logger (debug/info/warn/error)
    ├── utils.ts                    Shared utilities — relativeTime()
    ├── db.ts                       Turso singleton + all DB queries (visitors, journal, Q&A)
    ├── journal.ts                  GitHub API → commits → JournalEntry[]
    ├── tokenHealth.ts              Credential health checks (GitHub, Turso, Pusher)
    ├── pusher.ts                   Pusher server-side singleton
    ├── admin.ts                    bcrypt password verify + update, admin_config table
    ├── session.ts                  iron-session cookie config (24 h maxAge)
    ├── projects.ts                 Static project data array
    └── visitorNames.ts             Whimsical alias generator (adjective + animal + emoji)
```

---

## 4. Data Flows

### 4.1 First Visit

```
Browser opens /
  └─ VisitorModal mounts (client component)
       │
       ├─ Reads sessionStorage['pv_session']
       │    └─ Entry exists? → restore { id, name, emoji }, connect Pusher, DONE
       │
       └─ No session → collect telemetry
            ├─ Build fingerprint (DJB2 hash of UA + screen + timezone + hardware)
            ├─ Parse browser / OS / device type
            └─ POST /api/visitor
                 ├─ Server injects: IP, country, city, region  (Vercel headers)
                 ├─ Dedup: same fingerprint within 60 s? → return existing id
                 └─ Otherwise: INSERT visitors, return { id, returning, recorded }
                      │
                      └─ Modal shown — user enters name or alias
                           │
                           └─ PATCH /api/visitor { id, name, timeToSubmit }
                                └─ updateVisitor() in Turso
                                     │
                                     └─ Save { id, done, name, emoji } to pv_session
                                          └─ Connect to Pusher presence channel
```

### 4.2 Page Refresh (F5)

```
sessionStorage['pv_session'] still intact
  └─ VisitorModal restores { id, name, emoji } synchronously before Pusher connects
       └─ Pusher auth carries correct identity — no name/alias loss on refresh
```

### 4.3 Admin Authentication

```
Request to /admin/*
  └─ middleware.ts — reads iron-session cookie
       ├─ Valid session → allow through
       └─ No session → redirect /admin/login
            └─ POST /api/admin/login { username, password }
                 └─ verifyCredentials() — bcrypt.compare against admin_config table
                      ├─ Fail → 401
                      └─ Pass → session.isLoggedIn = true, session.save()
                           └─ Redirect → /admin
```

### 4.4 Journal Feed Request

```
JournalSection mounts (client)
  └─ GET /api/journal?page=1&pageSize=10[&source=manual][&visitorId=N]
       │
       ├─ source=manual (Mindspace tab)?
       │    └─ Skip GitHub fetch, return only journal_entries rows
       │
       └─ Default (Feed tab)
            ├─ getCachedGitHubEntries()
            │    ├─ Cache hit (< 5 min old)? → return cached
            │    └─ Miss → fetchGitHubJournal()
            │         ├─ GET /users/atewari-bot/repos (top 5 by push time, non-fork)
            │         └─ GET /repos/{name}/commits (8 per repo, parallel)
            │              └─ Map to JournalEntry[], sort, dedup, cap at 25
            │
            ├─ getAllJournalEntries() → Turso SELECT journal_entries
            ├─ Merge + sort newest-first
            ├─ Slice page
            └─ getBulkReactionCounts(pageIds, visitorId) → annotate with likes/dislikes/userReaction
                 └─ Return { entries, total, page, pageSize }
```

### 4.5 Q&A Flow

```
Visitor submits question
  └─ POST /api/questions { question, visitorId, visitorName }
       └─ createQuestion() → INSERT visitor_questions
            └─ QuestionsSection refreshes list

Admin answers question (dashboard)
  └─ PATCH /api/questions/[id] { answer }
       └─ answerQuestion() → UPDATE visitor_questions SET answered=1, answer=?
            └─ Question moves to "answered" group on next load
```

---

## 5. Feature Modules

### 5.1 Visitor Tracking

**Key files:** `components/VisitorModal.tsx` · `lib/db.ts` · `app/api/visitor/route.ts`

Captures on every first session:

| Field | Source |
|---|---|
| Browser, OS, device | Parsed from `navigator.userAgent` |
| Screen, pixel ratio | `screen.*` |
| Timezone, language | `Intl` / `navigator.language` |
| Fingerprint | DJB2 hash of 8 browser properties |
| IP, country, city, region | Vercel request headers (server-side injection) |
| Time to submit | `performance.now()` delta — page load → name submitted |

A **60-second dedup window** prevents double-counts on hard refresh.
`returning_visitor = 1` when the fingerprint has been seen before.

Visitor name/alias is initially empty and updated after modal submission.
The name is also silently captured into Q&A submissions from `pv_session`.

---

### 5.2 Real-Time Presence & Cursors

**Key files:** `components/VisitorModal.tsx` · `lib/pusher.ts` · `app/api/pusher/auth/route.ts`

All active visitors join the Pusher **presence channel** `presence-portfolio`.

**Auth flow:**
1. Pusher.js client (VisitorModal) calls `/api/pusher/auth` with `{ socket_id, channel_name, user_id, user_info: { name, emoji } }`
2. Server signs the channel using the Pusher secret and returns the auth token

**Cursor sharing:**
- Mouse moves emit `client-cursor-moved` as **client-triggered events** — browser-to-browser, no server hop
- Position encoded as `{ x: 0–1, y: 0–1 }` (viewport fractions) for cross-screen-size compatibility
- Throttled to **50 ms intervals** (~20 fps)
- Remote cursors rendered as `position: fixed` overlays: SVG cursor arrow + name badge

> Pusher dashboard requirement: **App Settings → Enable Client Events**

---

### 5.3 Journal — Feed Tab

**Key files:** `components/JournalSection.tsx` · `lib/journal.ts` · `app/api/journal/route.ts`

Merges two entry sources and displays them in a compact table:

| Source | Entries | Category |
|---|---|---|
| GitHub commits (top 5 repos, 8 commits each) | Up to 40 | `coding` |
| Admin-written entries (`journal_entries`) | Unlimited | `note` / `coding` / `sports` |

**Display columns:** category dot · source badge · repo link · title · Date (day · full date + year · visitor timezone) · relative time · 👍 / 👎 reactions

**GitHub cache:** 5-minute in-process TTL. Busted immediately on admin POST (new manual entry). Lost on server restart (cold start re-fetches).

**Reactions:** `UNIQUE(entry_id, visitor_id)` in `journal_reactions`. Toggle: same reaction = remove; different reaction = update. Bulk-fetched per page. **Optimistic UI** updates instantly, reconciles on server response.

**Pagination:** page sizes 10 / 20 / 50 with first/prev/numbered/next/last controls.

---

### 5.4 Journal — Mindspace Tab

**Key files:** `components/JournalSection.tsx` · `app/api/journal/route.ts`

A second tab within the Journal section showing **only manually-written admin entries** (`source=manual`). GitHub commits are excluded entirely.

- Switching tabs resets to page 1 and re-fetches with `?source=manual`
- Content is created via **Admin → Write Journal** (Note / Coding / Sports category)
- Same `EntryRow` component as Feed — identical display, date column, and reactions
- Empty state shows a 🧠 icon and "No mindspace entries yet."

---

### 5.5 Q&A Section

**Key files:** `components/QuestionsSection.tsx` · `app/api/questions/route.ts` · `app/api/questions/[id]/route.ts`

Two-column layout:

**Left — Ask form:**
- Textarea (max 500 chars)
- Visitor name/alias silently pre-filled from `pv_session.name` — shown as `"as [name] · 0/500"`
- POST to `/api/questions` on submit
- Success flash message for 4 seconds

**Right — Q&A list:**
- Answered questions listed first, then pending
- Compact row: status badge (answered / pending) · truncated question · one-line answer preview
- **Read ↗** button opens a full-screen answer overlay (closes on Esc or backdrop click)
- Pagination: 5 / 10 / 20 per page

Admins answer and delete questions from the dashboard's `QuestionsAdmin` panel.

---

### 5.6 Admin Dashboard

**Key files:** `app/admin/page.tsx` · all `app/admin/*.tsx` components

Server-rendered on every request (`force-dynamic`). Requires valid iron-session cookie.

**Dashboard sections (top to bottom):**

1. **Token Health** — live credential checks (see §5.7)
2. **Stats** — Total Sessions · Unique Devices · Return Visits (computed server-side from full visitor table)
3. **Write Journal** — collapsible create form + scrollable list of existing manual entries with ✕ delete per row
4. **Questions** — pending questions with inline answer input (Enter or click); answered questions dimmed below; delete on both
5. **Visitor Table** — full record table
   - Page sizes: 10 (default) / 20 / 50 / 100
   - Checkbox multi-select + select-all-on-page
   - Bulk delete via `DELETE /api/visitor`

---

### 5.7 Token Health Monitor

**Key files:** `lib/tokenHealth.ts` · `app/admin/TokenAlerts.tsx`

Runs on every admin page load via `checkAllTokens()` (parallel checks):

| Service | Check method | Warn condition |
|---|---|---|
| **GitHub** | `GET /rate_limit` — reads `github-authentication-token-expiration` header | ≤ 7 days remaining, or 401 |
| **Turso** | JWT `exp` field decode → live `SELECT 1` | ≤ 7 days or connection/auth failure |
| **Pusher** | `GET /apps/{id}/channels` with Basic auth | Any 401 / 403 |

Alert severity displayed per row:
- 🟢 **OK** — valid, no expiry concern
- 🟡 **Expiring soon** — ≤ 14 days (amber glow)
- 🔴 **Action required** — invalid, revoked, or missing (red glow)

A summary badge ("All healthy" / "N issues") appears in the header row.

---

## 6. Database Schema

All tables in a single Turso database. Created lazily via `initDb()` / `initJournalDb()` using `CREATE TABLE IF NOT EXISTS`. Columns added after initial release use `ALTER TABLE` inside `try/catch` — already-existing columns fail silently (zero-downtime migrations).

### `visitors`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | Empty initially; updated after modal submit |
| `visit_time` | TEXT | ISO datetime, default `datetime('now')` |
| `fingerprint` | TEXT | DJB2 hash — used for dedup + returning detection |
| `returning_visitor` | INTEGER | `1` if fingerprint seen before |
| `browser` / `os` / `device_type` | TEXT | Parsed from user agent |
| `screen_res` / `pixel_ratio` | TEXT | Display info |
| `timezone` / `language` | TEXT | Browser locale |
| `ip_address` / `country` / `city` / `region` | TEXT | From Vercel edge headers |
| `time_to_submit` | INTEGER | ms from page load to name submit |
| `user_agent` / `platform` / `referrer` etc. | TEXT | Full telemetry |

### `admin_config`

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PK | e.g. `password_hash` |
| `value` | TEXT | bcrypt hash (12 rounds) |

### `journal_entries`

Manual entries written by admin (GitHub commits are not stored).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `title` | TEXT | Required |
| `body` | TEXT | Optional long-form content |
| `category` | TEXT | `note` / `coding` / `sports` |
| `tags` | TEXT | Comma-separated tag list |
| `created_at` | TEXT | ISO datetime |

### `journal_reactions`

Per-visitor reactions on any journal entry (GitHub or manual).

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `entry_id` | TEXT | GitHub commit SHA or `manual-{id}` |
| `reaction` | TEXT | `like` or `dislike` |
| `visitor_id` | INTEGER | References visitors.id |
| `created_at` | TEXT | ISO datetime |
| — | UNIQUE | `(entry_id, visitor_id)` — one reaction per visitor per entry |

### `visitor_questions`

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `question` | TEXT | Max 500 chars |
| `visitor_id` | INTEGER | Nullable — links to visitors.id |
| `visitor_name` | TEXT | Captured from pv_session at submit time |
| `created_at` | TEXT | ISO datetime |
| `answered` | INTEGER | `0` pending / `1` answered |
| `answer` | TEXT | Admin response text |

---

## 7. API Routes Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/visitor` | — | Record new visitor session |
| PATCH | `/api/visitor` | — | Update visitor name after modal submit |
| DELETE | `/api/visitor` | Admin | Bulk delete visitor records by ID array |
| GET | `/api/journal` | — | Paginated feed; `?source=manual` for Mindspace |
| POST | `/api/journal` | Admin | Create manual journal entry |
| DELETE | `/api/journal/[id]` | Admin | Delete a manual entry |
| POST | `/api/journal/react` | — | Toggle like/dislike on an entry |
| GET | `/api/questions` | — | List all questions (answered first) |
| POST | `/api/questions` | — | Submit a new visitor question |
| PATCH | `/api/questions/[id]` | Admin | Submit an answer |
| DELETE | `/api/questions/[id]` | Admin | Delete a question |
| POST | `/api/pusher/auth` | — | Sign Pusher presence channel for a visitor |
| POST | `/api/admin/login` | — | Authenticate; creates session cookie |
| POST | `/api/admin/logout` | Admin | Destroys session cookie |
| POST | `/api/admin/change-password` | Admin | Updates bcrypt hash in admin_config |

---

## 8. Authentication & Security

### Session (`lib/session.ts`)

```
Cookie name : portfolio_admin_session
httpOnly    : true   (JS cannot read it)
secure      : true   (HTTPS only in prod)
sameSite    : 'lax'  (CSRF protection)
maxAge      : 86400  (24 hours)
Encryption  : AES-256 via iron-session (key = ADMIN_SESSION_SECRET)
```

### Password storage

bcrypt hash (12 rounds) stored in `admin_config` under key `password_hash`.
Default seeded on first `initAdminDb()` — change immediately via Admin → Change Password.

### Route guard (`middleware.ts`)

Intercepts all `/admin/*` paths except `/admin/login`. Missing or invalid session cookie → `302` redirect to `/admin/login`. Protected API routes additionally call `getIronSession()` inside the handler and return `401` if the session is absent.

### Security model summary

| Concern | Mitigation |
|---|---|
| XSS on session | `httpOnly` cookie — JS cannot access |
| CSRF | `sameSite: lax` cookie |
| Password exposure | bcrypt 12 rounds in DB, never in logs |
| Unauthorized API | Session check on every admin endpoint |
| Secret leakage | All secrets in env vars only |
| Session expiry | 24-hour maxAge |

---

## 9. Logging

**File:** `lib/logger.ts`

Structured JSON logger used across all API routes and lib modules. Each call emits one JSON line to `stdout`/`stderr`, captured automatically by Vercel under **Functions → Logs**.

```json
{ "ts": "2026-03-13T08:00:00.000Z", "level": "info", "context": "journal", "message": "GitHub cache refreshed", "data": { "count": 23 } }
```

| Level | Used for | Emitted in prod |
|---|---|---|
| `debug` | Cache hits, query details, Pusher auth | No (suppressed) |
| `info` | Visitor recorded, entry created/deleted, question answered | Yes |
| `warn` | Token expiring, GitHub rate limit, missing env vars | Yes |
| `error` | DB failures, API errors, uncaught exceptions | Yes |

`Error` objects are serialized to `{ name, message, stack }` so stack traces appear in Vercel logs.

**Usage:**
```typescript
logger.debug('journal',  'Cache hit', { count: 40 })
logger.info ('visitor',  'Visitor recorded', { id: 12, returning: true })
logger.warn ('github',   'Rate limit low', { remaining: 5 })
logger.error('db',       'Query failed', err)
```

---

## 10. Shared Utilities

**File:** `lib/utils.ts`

| Export | Description | Used by |
|---|---|---|
| `relativeTime(iso)` | Converts ISO timestamp to human-readable relative string ("just now", "5m ago", "3h ago", "2d ago", "Mar 13") | `JournalSection`, `QuestionsSection` |

Previously duplicated in both components — centralised to avoid drift.

---

## 11. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | `libsql://…turso.io` database URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso JWT auth token |
| `ADMIN_SESSION_SECRET` | Yes | iron-session encryption key (≥ 32 chars) |
| `GITHUB_TOKEN` | Yes | GitHub PAT — 5,000 req/hr vs 60 unauthenticated |
| `NEXT_PUBLIC_PUSHER_KEY` | Yes | Pusher app key (exposed to client) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Yes | Pusher cluster (e.g. `us3`) |
| `PUSHER_APP_ID` | Yes | Pusher app ID (server-side only) |
| `PUSHER_SECRET` | Yes | Pusher secret (server-side only) |

> Without `GITHUB_TOKEN`, the journal Feed will be empty whenever the unauthenticated
> GitHub rate limit (60 req/hr per IP) is exceeded.

---

## 12. External Services

| Service | Purpose | Key detail |
|---|---|---|
| [Turso](https://turso.tech) | Managed SQLite over HTTP | Lazy singleton client in `lib/db.ts`; tables auto-created on first request |
| [Pusher Channels](https://pusher.com) | Real-time presence + cursor events | Presence channel `presence-portfolio`; client events must be enabled in dashboard |
| [GitHub REST API v3](https://docs.github.com/en/rest) | Journal feed — commits from `atewari-bot` repos | In-process 5-min cache; authenticated via `GITHUB_TOKEN` |
| [Vercel](https://vercel.com) | Hosting, serverless functions, geo headers, log aggregation | Geo enrichment via `x-vercel-ip-*` headers injected at edge |
| [Vercel Analytics](https://vercel.com/analytics) | Page-view analytics | Zero-config `<Analytics />` component in root layout |
