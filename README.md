# atewari-bot.github.io

Personal portfolio site for **Ajay Tewari** — Staff Engineer & Technical Lead.

Live at: **[https://atewari-bot.github.io](https://atewari-bot.github.io)**

---

## Stack

- [Next.js 14](https://nextjs.org/) (App Router, static export)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript
- Deployed to GitHub Pages via GitHub Actions

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Pushing to `main` triggers the [deploy workflow](.github/workflows/deploy.yml), which builds the static site and pushes the `out/` directory to the `gh-pages` branch. GitHub Pages serves from `gh-pages`.

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
