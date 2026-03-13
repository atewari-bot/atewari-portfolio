export type JournalCategory = 'coding' | 'sports' | 'note'
export type JournalSource =
  | 'github_push'
  | 'github_pr'
  | 'github_create'
  | 'strava'
  | 'manual'

export interface JournalCommit {
  sha: string
  message: string
  url: string
}

export interface JournalEntry {
  id: string
  source: JournalSource
  category: JournalCategory
  title: string
  body?: string
  repo?: string        // "owner/repo"
  repoUrl?: string
  url?: string
  timestamp: string    // ISO 8601
  tags?: string[]
  // reactions — populated by API
  likes: number
  dislikes: number
  userReaction?: 'like' | 'dislike' | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const GITHUB_USER = 'atewari-bot'

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) h['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

// ─── Repos ────────────────────────────────────────────────────────────────────

async function fetchActiveRepos(headers: Record<string, string>): Promise<string[]> {
  const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=8&type=owner`
  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repos: any[] = await res.json()
  return repos
    .filter(r => !r.fork)        // skip forks
    .map(r => r.full_name as string)
}

// ─── Commits per repo ─────────────────────────────────────────────────────────

async function fetchRepoCommits(
  repoName: string,
  headers: Record<string, string>,
): Promise<JournalEntry[]> {
  const url = `https://api.github.com/repos/${repoName}/commits?per_page=8`
  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commits: any[] = await res.json()
  if (!Array.isArray(commits)) return []

  const repoUrl = `https://github.com/${repoName}`

  return commits.map(c => {
    const message: string = (c.commit?.message ?? '').split('\n')[0].slice(0, 140)
    return {
      id: c.sha ?? `${repoName}-${Math.random()}`,
      source: 'github_push' as JournalSource,
      category: 'coding' as JournalCategory,
      title: message,
      repo: repoName,
      repoUrl,
      url: c.html_url ?? `${repoUrl}/commit/${c.sha}`,
      timestamp: c.commit?.author?.date ?? c.commit?.committer?.date ?? new Date().toISOString(),
      likes: 0,
      dislikes: 0,
    }
  })
}

// ─── PRs ──────────────────────────────────────────────────────────────────────

async function fetchRecentPRs(
  repoName: string,
  headers: Record<string, string>,
): Promise<JournalEntry[]> {
  const url = `https://api.github.com/repos/${repoName}/pulls?state=all&per_page=3&sort=updated`
  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prs: any[] = await res.json()
  if (!Array.isArray(prs)) return []

  const repoUrl = `https://github.com/${repoName}`
  return prs.map(pr => ({
    id: `pr-${pr.id}`,
    source: 'github_pr' as JournalSource,
    category: 'coding' as JournalCategory,
    title: pr.title ?? 'Pull request',
    body: pr.merged_at ? 'Merged' : pr.state === 'open' ? 'Open' : 'Closed',
    repo: repoName,
    repoUrl,
    url: pr.html_url,
    timestamp: pr.merged_at ?? pr.updated_at ?? pr.created_at,
    likes: 0,
    dislikes: 0,
  }))
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchGitHubJournal(): Promise<JournalEntry[]> {
  const headers = buildHeaders()

  const repos = await fetchActiveRepos(headers)
  if (!repos.length) return []

  // Fetch commits + PRs for top 5 repos in parallel
  const top = repos.slice(0, 5)
  const [commitBatches] = await Promise.all([
    Promise.all(top.map(r => fetchRepoCommits(r, headers))),
  ])

  const all: JournalEntry[] = commitBatches.flat()

  // Sort by newest first, deduplicate by id, cap at 25
  const seen = new Set<string>()
  return all
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })
    .slice(0, 25)
}
