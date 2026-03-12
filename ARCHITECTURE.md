# Portfolio Application — Architecture Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Component Relationships](#5-component-relationships)
6. [Database Schema](#6-database-schema)
7. [API Routes](#7-api-routes)
8. [Authentication Flow](#8-authentication-flow)
9. [Visitor Tracking System](#9-visitor-tracking-system)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Environment Variables](#12-environment-variables)
13. [Security Model](#13-security-model)

---

## 1. Overview

A production-grade personal portfolio built on **Next.js 14 (App Router)** with an integrated visitor tracking system and a protected admin dashboard. The site is deployed on **Vercel**, uses **Turso (libSQL)** as the database, and **iron-session** for secure cookie-based authentication.

```
Browser  ──►  Vercel Edge / Serverless Functions  ──►  Turso (libSQL)
                        │
                   Next.js 14
                  (App Router)
                        │
          ┌─────────────┼─────────────┐
       Public Site   Admin API    Visitor API
```

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 14.2.35 |
| UI | React | 18 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3.4.1 |
| Font | Nunito (Google Fonts) | 400/600/700/800 |
| Database | Turso (libSQL) | `@libsql/client` 0.17 |
| Auth | iron-session | 8.0.4 |
| Password Hashing | bcryptjs | 3.0.3 |
| Analytics | Vercel Analytics | 2.0.0 |
| Hosting | Vercel | — |

---

## 3. Project Structure

```
atewari-portfolio/
│
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout — font, nav, footer, analytics
│   ├── page.tsx                    # Home page — assembles all sections
│   ├── globals.css                 # Global styles, scrollbar, selection, focus ring
│   │
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout (passthrough wrapper)
│   │   ├── page.tsx                # Dashboard — SSR, protected, stats + table
│   │   ├── AdminActions.tsx        # Client: logout + change password modal
│   │   ├── VisitorTable.tsx        # Client: paginated table, selection, delete
│   │   └── login/
│   │       └── page.tsx            # Login form (public, client component)
│   │
│   └── api/
│       ├── visitor/
│       │   └── route.ts            # POST (record) | PATCH (update) | DELETE (bulk delete)
│       └── admin/
│           ├── login/route.ts      # POST — verify credentials, create session
│           ├── logout/route.ts     # POST — destroy session
│           └── change-password/
│               └── route.ts        # POST — verify + update hashed password
│
├── components/                     # Shared UI components
│   ├── Nav.tsx                     # Sticky navbar — links + Home/Admin toggle
│   ├── Footer.tsx                  # Footer — social links + copyright
│   ├── Hero.tsx                    # Hero section — intro, resume modal, download
│   ├── ProjectsSection.tsx         # Grid of project cards
│   ├── ProjectCard.tsx             # Individual project card
│   ├── AboutSection.tsx            # Bio + technical skills grid
│   ├── CertificationsSection.tsx   # Certifications list
│   ├── PublicationsSection.tsx     # Publications list
│   ├── ContactSection.tsx          # Contact links (email, LinkedIn, GitHub)
│   └── VisitorModal.tsx            # Visitor tracking UI — cursor-following modal
│
├── lib/                            # Shared logic / data
│   ├── db.ts                       # Database connection, schema, all CRUD ops
│   ├── session.ts                  # iron-session config + SessionData type
│   ├── admin.ts                    # Admin auth: bcrypt verify, init default password
│   ├── projects.ts                 # Static project data (array of Project objects)
│   └── visitorNames.ts             # Name generator: adjectives + entity lists
│
├── middleware.ts                   # Route guard — redirects /admin/* to login
├── tailwind.config.ts              # Design tokens (colors, border radius)
└── public/resources/               # Static assets (resume PDF, profile image)
```

---

## 4. Data Flow Diagrams

### 4.1 Visitor Tracking (First Visit)

```
User opens portfolio
        │
        ▼
VisitorModal mounts
  readSession() → sessionStorage['pv_session']
        │
        ├── Session exists? ──► Skip (already tracked)
        │
        └── No session
              │
              ▼
        recordAnonymous()
          ├─ generateVisitorName()       ← lib/visitorNames.ts
          ├─ parseBrowser(userAgent)
          ├─ parseOS(userAgent)
          ├─ getDeviceType()
          └─ buildFingerprint()          ← DJB2 hash
              │
              ▼
        POST /api/visitor
          ├─ Server injects: IP, country, city, region  (Vercel headers)
          └─ recordVisitor(data)          ← lib/db.ts
               ├─ Query: fingerprint in last 60s?
               ├─ YES → return existing id (dedup)
               └─ NO  → INSERT into visitors
                         return { id, returning }
              │
              ▼
        Modal displayed with visitor name
              │
              ▼
        User submits real name
              │
              ▼
        PATCH /api/visitor { id, name, timeToSubmit }
          └─ updateVisitor()
              │
              ▼
        sessionStorage['pv_session'] = { id, done: true }
        Browsing tooltip shown while cursor moves
```

### 4.2 Admin Authentication Flow

```
Navigate to /admin/*
        │
        ▼
middleware.ts
  getIronSession() → check cookie 'portfolio_admin_session'
        │
        ├── Cookie valid? ──► Allow through to page
        │
        └── No cookie
              │
              ▼
        Redirect → /admin/login
              │
              ▼
        User submits username + password
              │
              ▼
        POST /api/admin/login
          └─ verifyCredentials(username, password)   ← lib/admin.ts
               ├─ username === 'admin'?
               └─ bcrypt.compare(password, hash)     ← admin_config table
                    │
                    ├── INVALID → 401 Unauthorized
                    └── VALID
                          │
                          ▼
                    session.isLoggedIn = true
                    session.username = 'admin'
                    session.save()                    ← encrypted httpOnly cookie
                          │
                          ▼
                    Redirect → /admin
```

### 4.3 Admin Dashboard Data Flow

```
/admin page request
        │
        ▼
app/admin/page.tsx  (Server Component, force-dynamic)
  getIronSession() → verify session
        │
        ├── Not logged in → redirect /admin/login
        │
        └── Logged in
              │
              ▼
        initAdminDb()    ← lib/admin.ts
        getAllVisitors()  ← lib/db.ts → SELECT * FROM visitors ORDER BY visit_time DESC
              │
              ▼
        Compute stats:
          total     = visitors.length
          unique    = distinct fingerprints
          returning = count where returning_visitor = 1
              │
              ▼
        Pass visitors[] to <VisitorTable> (Client Component)
              │
              ▼
        VisitorTable manages:
          - Local state (rows, page, pageSize, selected)
          - Pagination UI
          - Checkbox selection
          - DELETE /api/visitor { ids[] } on confirm
            └─ Server: verifySession → deleteVisitors(ids)
               └─ Optimistic UI: filter deleted rows from local state
```

---

## 5. Component Relationships

```
app/layout.tsx
  ├── <Nunito font>          loaded via next/font/google
  ├── <VisitorModal />       tracks every page visitor (client)
  ├── <Nav />                sticky top bar with section links
  ├── <main>{children}</main>
  │     └── app/page.tsx
  │           ├── <Hero />              resume modal (client)
  │           ├── <ProjectsSection />
  │           │     └── <ProjectCard /> × N
  │           ├── <AboutSection />
  │           ├── <CertificationsSection />
  │           ├── <PublicationsSection />
  │           └── <ContactSection />
  ├── <Footer />
  └── <Analytics />          Vercel Analytics

app/admin/page.tsx (server)
  ├── <AdminActions />        change password + logout (client)
  └── <VisitorTable />        pagination + delete (client)
```

### Component Rendering Modes

| Component | Mode | Reason |
|---|---|---|
| `app/page.tsx` | Server | Static content, no interactivity |
| `app/admin/page.tsx` | Server (`force-dynamic`) | Auth check + DB fetch per request |
| `Hero.tsx` | Client (`use client`) | Resume modal open/close state |
| `VisitorModal.tsx` | Client (`use client`) | Cursor tracking, form, API calls |
| `VisitorTable.tsx` | Client (`use client`) | Pagination, selection, delete |
| `AdminActions.tsx` | Client (`use client`) | Password modal, logout |
| `Nav.tsx` | Client (`use client`) | `usePathname()` for active link |
| All section components | Server | Pure display, no state needed |

---

## 6. Database Schema

### Table: `visitors`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | Unique row identifier |
| `name` | TEXT NOT NULL | Visitor alias (generated or user-supplied) |
| `visit_time` | TEXT DEFAULT now | ISO datetime of visit |
| `user_agent` | TEXT | Full browser UA string |
| `browser` | TEXT | Parsed browser name |
| `os` | TEXT | Parsed OS name |
| `screen_res` | TEXT | e.g. `1920x1080` |
| `color_depth` | TEXT | e.g. `24-bit` |
| `timezone` | TEXT | IANA timezone string |
| `language` | TEXT | Browser language |
| `platform` | TEXT | `navigator.platform` |
| `cookies_enabled` | INTEGER | Boolean 0/1 |
| `do_not_track` | TEXT | DNT header value |
| `referrer` | TEXT | `document.referrer` or `'direct'` |
| `fingerprint` | TEXT | DJB2 hash (used for dedup + returning detection) |
| `returning_visitor` | INTEGER DEFAULT 0 | 1 if prior fingerprint found |
| `device_type` | TEXT | `desktop` / `tablet` / `mobile` |
| `pixel_ratio` | TEXT | e.g. `2x` |
| `time_to_submit` | INTEGER | Milliseconds from load to name submission |
| `ip_address` | TEXT | Client IP (from Vercel headers) |
| `country` | TEXT | ISO country code |
| `city` | TEXT | City name |
| `region` | TEXT | Region/state code |

### Table: `admin_config`

| Column | Type | Description |
|---|---|---|
| `key` | TEXT PRIMARY KEY | Config key (e.g. `password_hash`) |
| `value` | TEXT NOT NULL | Config value (bcrypt hash) |

### Migration Strategy

Tables are created on first API request via `initDb()`. Additional columns introduced after initial release are added with non-blocking `ALTER TABLE` inside a `try/catch` — already-existing columns silently fail, making migrations zero-downtime.

---

## 7. API Routes

### `POST /api/visitor` — Record visit

**Called by**: `VisitorModal.tsx` on mount
**Auth**: None (public)
**Body**: `VisitorData` (browser telemetry)
**Server adds**: IP, country, city, region from Vercel request headers
**Returns**: `{ success, id, returning }`

### `PATCH /api/visitor` — Update visitor name

**Called by**: `VisitorModal.tsx` on form submit
**Auth**: None (public)
**Body**: `{ id, name, timeToSubmit }`
**Returns**: `{ success }`

### `DELETE /api/visitor` — Bulk delete visitors

**Called by**: `VisitorTable.tsx` delete button
**Auth**: Requires valid iron-session cookie
**Body**: `{ ids: number[] }`
**Returns**: `{ success, deleted: N }`

### `POST /api/admin/login` — Authenticate

**Called by**: Admin login page
**Auth**: None (public)
**Body**: `{ username, password }`
**Returns**: `{ success }` + sets session cookie

### `POST /api/admin/logout` — Sign out

**Called by**: `AdminActions.tsx`
**Auth**: Session (soft — destroys cookie regardless)
**Returns**: `{ success }`

### `POST /api/admin/change-password` — Update password

**Called by**: `AdminActions.tsx` change password modal
**Auth**: Requires valid iron-session cookie
**Body**: `{ currentPassword, newPassword }`
**Returns**: `{ success }`

---

## 8. Authentication Flow

### Session Configuration (`lib/session.ts`)

```typescript
cookieName: 'portfolio_admin_session'
cookieOptions: {
  httpOnly: true,           // not accessible via JS
  secure: true,             // HTTPS only in production
  sameSite: 'lax',          // CSRF protection
  maxAge: 60 * 60 * 24      // 24 hours
}
```

### Password Storage

- Passwords are hashed with **bcrypt (12 rounds)** and stored in `admin_config` table under key `password_hash`
- Default password (`password123`) is seeded on first `initAdminDb()` call
- Should be changed immediately after first login via the Change Password modal

### Route Guard (`middleware.ts`)

Intercepts all requests to `/admin/*` (except `/admin/login`). Checks for the session cookie. If absent, issues a `302` redirect to `/admin/login`.

---

## 9. Visitor Tracking System

### Name Generation (`lib/visitorNames.ts`)

Visitors receive a generated identity composed of:

```
<Adjective> + <Entity>
```

**Adjectives** (70+): grouped into mood/energy, texture/appearance, lively/fun, celestial-themed, mountain-themed, river-themed.

**Entities** (100+) across categories:
- Animals: mammals, birds, fish & aquatic, reptiles, insects
- Celestial: stars (Orion, Sirius, Vega), moons (Europa, Titan), nebulae, comets
- Mountains: Everest, Fuji, Kilimanjaro, Matterhorn, Denali, etc.
- Rivers: Amazon, Nile, Yangtze, Ganges, Thames, Mississippi, etc.

Examples: `CosmicNebula`, `WindsweptEverest`, `CuriousOtter`, `StellarAndromeda`

### Fingerprinting

```typescript
// DJB2 hash of:
[navigator.userAgent, navigator.language, screen.width,
 screen.height, screen.colorDepth, timezoneOffset,
 hardwareConcurrency, deviceMemory].join('|')
```

Used to detect returning visitors across sessions without cookies.

### Deduplication

If the same fingerprint visits within **60 seconds**, no new DB row is created. The existing row's ID is returned so the name can still be updated via `PATCH`. This prevents double-counting on hard refreshes.

### Cursor-Following Behaviour

The modal tracks `mousemove` events and positions itself `20px right / 16px below` the cursor with viewport clamping to prevent overflow. After submission, a compact tooltip replaces the modal and continues following the cursor.

---

## 10. Admin Dashboard

### Stats Calculation (server-side)

```typescript
total     = visitors.length
unique    = new Set(visitors.map(v => v.fingerprint)).size
returning = visitors.filter(v => v.returning_visitor === 1).length
```

### Visitor Table Features

- **Page sizes**: 20 (default), 50, 100
- **Pagination**: first / prev / numbered pills with ellipsis / next / last
- **Row selection**: per-row checkbox + select-all-on-page in header; clicking row also toggles
- **Bulk delete**: red `Delete N selected` button in toolbar; calls `DELETE /api/visitor`; removes rows from local state on success
- **Visual feedback**: selected rows get a subtle accent tint

---

## 11. Third-Party Integrations

### Vercel Analytics

Injected as `<Analytics />` in the root layout. Tracks pageviews automatically on Vercel deployments with zero configuration.

### Turso (libSQL)

A serverless SQLite-compatible database. The client is a lazy-initialized singleton (`getDb()`). Connection requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Geo-enrichment of visitor records is handled upstream by Vercel request headers, not Turso.

### iron-session

Stores session data as an **encrypted, signed payload** in an httpOnly cookie. No server-side session store needed. The encryption key comes from `ADMIN_SESSION_SECRET`.

### Vercel Geo Headers

When deployed to Vercel, each request automatically receives:
- `x-forwarded-for` — client IP
- `x-vercel-ip-country` — ISO country code
- `x-vercel-ip-city` — city
- `x-vercel-ip-country-region` — region/state

These are injected into visitor records server-side in the API route.

---

## 12. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | `libsql://db-name-org.turso.io` |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `ADMIN_SESSION_SECRET` | Yes | Min 32-char random string for cookie encryption |

---

## 13. Security Model

| Concern | Mitigation |
|---|---|
| XSS on session cookie | `httpOnly: true` on iron-session cookie |
| CSRF attacks | `sameSite: 'lax'` on session cookie |
| Password storage | bcrypt hash (12 rounds) in DB |
| Brute force | No explicit rate limiting (Vercel edge handles DDoS) |
| Unauthorized API access | DELETE endpoint verifies session; admin routes guarded by middleware |
| Secret leakage | All secrets in env vars, not in source |
| Session expiry | 24-hour maxAge on session cookie |
