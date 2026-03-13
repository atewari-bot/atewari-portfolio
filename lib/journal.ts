/**
 * GitHub Journal fetcher.
 *
 * Pulls recent commits from the user's top-5 most-recently-pushed repos and
 * maps them to the shared JournalEntry shape consumed by the journal API.
 */

import { logger } from './logger'

// ─── Types ────────────────────────────────────────────────────────────────────

export type JournalCategory = 'coding' | 'sports' | 'note'

export type JournalSource =
  | 'github_push'
  | 'github_pr'
  | 'github_create'
  | 'strava'
  | 'manual'

export interface JournalEntry {
  id:        string
  source:    JournalSource
  category:  JournalCategory
  title:     string
  body?:     string
  repo?:     string      // "owner/repo"
  repoUrl?:  string
  url?:      string
  timestamp: string      // ISO 8601
  tags?:     string[]
  // Populated by the API after bulk-fetching reactions
  likes:        number
  dislikes:     number
  userReaction?: 'like' | 'dislike' | null
}

// Raw shapes returned by the GitHub API (only fields we care about)
interface GHRepo   { full_name: string; fork: boolean }
interface GHCommit { sha: string; html_url: string; commit: { message: string; author?: { date?: string }; committer?: { date?: string } } }

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

/** Fetches the 8 most-recently-pushed repos for the user, excluding forks. */
async function fetchActiveRepos(headers: Record<string, string>): Promise<string[]> {
  const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=8&type=owner`
  const res = await fetch(url, { headers, cache: 'no-store' })

  if (!res.ok) {
    logger.warn('github', 'Failed to fetch repos', { status: res.status, statusText: res.statusText })
    return []
  }

  const repos = await res.json() as GHRepo[]
  const names = repos.filter(r => !r.fork).map(r => r.full_name)
  logger.debug('github', 'Fetched repos', { count: names.length, repos: names })
  return names
}

// ─── Commits ──────────────────────────────────────────────────────────────────

/** Fetches the 8 most recent commits for a single repo. */
async function fetchRepoCommits(
  repoName: string,
  headers:  Record<string, string>,
): Promise<JournalEntry[]> {
  const url = `https://api.github.com/repos/${repoName}/commits?per_page=8`
  const res = await fetch(url, { headers, cache: 'no-store' })

  if (!res.ok) {
    logger.warn('github', `Failed to fetch commits for ${repoName}`, { status: res.status })
    return []
  }

  const commits = await res.json() as GHCommit[]
  if (!Array.isArray(commits)) {
    logger.warn('github', `Unexpected commits response for ${repoName}`)
    return []
  }

  logger.debug('github', `Fetched commits for ${repoName}`, { count: commits.length })

  const repoUrl = `https://github.com/${repoName}`
  return commits.map(c => ({
    id:        c.sha ?? `${repoName}-${Math.random()}`,
    source:    'github_push' as JournalSource,
    category:  'coding'      as JournalCategory,
    title:     (c.commit?.message ?? '').split('\n')[0].slice(0, 140),
    repo:      repoName,
    repoUrl,
    url:       c.html_url ?? `${repoUrl}/commit/${c.sha}`,
    timestamp: c.commit?.author?.date ?? c.commit?.committer?.date ?? new Date().toISOString(),
    likes:     0,
    dislikes:  0,
  }))
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetches and merges commits from the top 5 most-active repos.
 * Results are sorted newest-first, deduplicated by SHA, and capped at 25.
 */
export async function fetchGitHubJournal(): Promise<JournalEntry[]> {
  logger.debug('github', 'Starting GitHub journal fetch')
  const headers = buildHeaders()

  const repos = await fetchActiveRepos(headers)
  if (!repos.length) {
    logger.warn('github', 'No repos returned — journal feed will be empty')
    return []
  }

  const commitBatches = await Promise.all(repos.slice(0, 5).map(r => fetchRepoCommits(r, headers)))
  const all = commitBatches.flat()

  // Sort newest-first, deduplicate by id, cap at 25 entries
  const seen = new Set<string>()
  const result = all
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })
    .slice(0, 25)

  logger.info('github', 'GitHub journal fetch complete', { total: result.length })
  return result
}
