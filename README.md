# atewari-bot.github.io

Personal portfolio site for **Ajay Tewari** — Staff Engineer & Technical Lead.

Live at: **[https://atewari-bot.github.io](https://atewari-bot.github.io)**

---

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript
- [Turso](https://turso.tech/) (libSQL) — visitor tracking database
- Deployed on [Vercel](https://vercel.com)

---

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Turso

**Install the CLI**

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

**Create a free account and database**

```bash
turso auth login
turso db create portfolio-visitors
```

**Get your credentials**

```bash
turso db show portfolio-visitors --url    # copy as TURSO_DATABASE_URL
turso db tokens create portfolio-visitors # copy as TURSO_AUTH_TOKEN
```

**Create `.env.local`**

```bash
cp .env.local.example .env.local
# paste the URL and token into .env.local
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The `visitors` table is created automatically on the first request.

**Inspect visitors**

```bash
turso db shell portfolio-visitors \
  "SELECT id, name, browser, os, timezone, visit_time FROM visitors ORDER BY visit_time DESC LIMIT 20;"
```

---

## Deploy to Vercel

### Step 1 — Push the repo to GitHub

Make sure the latest code is on the `main` branch.

### Step 2 — Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Click **Add New → Project**.
3. Find and select this repository, then click **Import**.
4. Vercel auto-detects Next.js — leave the build settings as-is.

### Step 3 — Add environment variables

In the **Environment Variables** section before clicking Deploy, add:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://portfolio-visitors-<your-org>.turso.io` |
| `TURSO_AUTH_TOKEN` | token from `turso db tokens create portfolio-visitors` |

Set both for **Production**, **Preview**, and **Development** environments.

### Step 4 — Deploy

Click **Deploy**. Vercel builds the project and gives you a live URL (e.g. `https://your-project.vercel.app`).

Every subsequent push to `main` triggers a new production deployment automatically.

### Step 5 (optional) — Add a custom domain

In the Vercel dashboard go to **Settings → Domains** and add your domain. Follow the DNS instructions shown.

### Step 6 — Add Turso secrets to GitHub (for CI checks)

So the build step in GitHub Actions can compile successfully, add the same two values as repository secrets:

1. Go to **GitHub repo → Settings → Secrets and variables → Actions**.
2. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

---

## Adding a project

Edit [`lib/projects.ts`](lib/projects.ts) — add an object to the `projects` array:

```ts
{
  title: 'My Project',
  description: 'What it does and the problem it solves.',
  tags: ['Python', 'React'],
  icon: '🚀',
  href: 'https://live-app-url.com',       // or null for placeholder
  githubHref: 'https://github.com/...',   // optional
}
```
