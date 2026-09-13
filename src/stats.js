/**
 * src/stats.js — GitHub / local git commit stats.
 *
 * Every export is safe: none throw. On failure they resolve to zeros/nulls.
 *
 * @typedef {Object} Stats
 * @property {number} commitsToday Number of commits made today (best effort)
 * @property {number} streak Consecutive days with commits, ending today
 * @property {number} totalCommits Total commits found (source dependent)
 * @property {number|null} hoursSinceLastCommit Hours since the last commit
 * @property {string|null} lastCommitDate ISO timestamp of the last commit
 */

import { execSync } from 'node:child_process';

/** @returns {Stats} A zeroed stats object. */
function emptyStats() {
  return { commitsToday: 0, streak: 0, totalCommits: 0, hoursSinceLastCommit: null, lastCommitDate: null };
}

/** Format a Date as a local-time 'YYYY-MM-DD' string. */
function toLocalDateStr(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Hours elapsed between now and an ISO timestamp (null if unparseable). */
function hoursSince(iso) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? null : (Date.now() - t) / 3.6e6;
}

/**
 * Count consecutive days with a commit, ending today. Walking back from
 * today, each covered day extends the streak; the first gap stops it, so a
 * day without a commit today yields 0.
 *
 * @param {string[]} commitDates 'YYYY-MM-DD' local-time strings (full ISO
 *   timestamps also accepted).
 * @returns {number} Streak length.
 */
export function calculateStreak(commitDates) {
  if (!Array.isArray(commitDates)) return 0;
  const days = new Set(commitDates.filter((d) => typeof d === 'string' && d.length >= 10).map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (days.has(toLocalDateStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const GITHUB_API = 'https://api.github.com';

/** GET a GitHub API endpoint with auth headers. Throws on non-OK. */
async function githubFetch(url, token) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'readme-pet' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/** Stats from the commit-search response (covers only today's commits). */
function fromSearch(json) {
  const items = Array.isArray(json.items) ? json.items : [];
  const commitsToday = json.total_count ?? items.length;
  const last = items.find((i) => i.commit && (i.commit.committer || i.commit.author));
  const lastCommitDate = last ? (last.commit.committer?.date ?? last.commit.author?.date ?? null) : null;
  return {
    commitsToday,
    streak: commitsToday > 0 ? 1 : 0, // search only covers today
    totalCommits: commitsToday, // best available from this endpoint
    hoursSinceLastCommit: hoursSince(lastCommitDate),
    lastCommitDate,
  };
}

/** Stats from the public events feed (recent, paginated, best effort). */
function fromEvents(body) {
  const events = Array.isArray(body) ? body.filter((e) => e.type === 'PushEvent' && e.created_at) : [];
  const today = toLocalDateStr(new Date());
  const localDates = events.map((e) => toLocalDateStr(new Date(e.created_at)));
  const lastCommitDate = events.length
    ? events.reduce((a, b) => (Date.parse(a.created_at) > Date.parse(b.created_at) ? a : b)).created_at
    : null;
  return {
    commitsToday: localDates.filter((d) => d === today).length,
    streak: calculateStreak(localDates),
    totalCommits: events.reduce((sum, e) => sum + (e.payload?.size ?? 1), 0),
    hoursSinceLastCommit: hoursSince(lastCommitDate),
    lastCommitDate,
  };
}

/**
 * Fetch commit stats from the GitHub API. Primary source: commit search for
 * today (`author:USER committer-date:>TODAY`, `application/vnd.github+json`,
 * Bearer auth when a token is given). On failure, falls back to
 * `/users/USER/events/public`. Never throws.
 *
 * @param {{username?: string, token?: string}} [opts]
 * @returns {Promise<Stats>}
 */
export async function getGitHubStats({ username, token } = {}) {
  if (!username) return emptyStats();
  const today = toLocalDateStr(new Date());
  try {
    const q = encodeURIComponent(`author:${username} committer-date:>${today}`);
    return fromSearch(await githubFetch(`${GITHUB_API}/search/commits?q=${q}&per_page=100`, token));
  } catch {
    try {
      return fromEvents(await githubFetch(`${GITHUB_API}/users/${encodeURIComponent(username)}/events/public?per_page=100`, token));
    } catch {
      return emptyStats();
    }
  }
}

/**
 * Compute stats from the local repository with `git log`. `commitsToday`
 * comes from `git log --since="24 hours ago"`; the full log supplies the
 * commit dates used for streak, totals and recency. Never throws.
 *
 * @returns {Stats}
 */
export async function getLocalStats() {
  try {
    const commitsToday =
      parseInt(execSync('git log --since="24 hours ago" --format=%H --oneline | wc -l', { encoding: 'utf8' }), 10) ||
      0;
    const log = execSync('git log --format=%cI', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).trim();
    const dates = log ? log.split('\n').filter(Boolean) : [];
    const lastCommitDate = dates[0] ?? null;
    return {
      commitsToday,
      streak: calculateStreak(dates.map((d) => toLocalDateStr(new Date(d)))),
      totalCommits: dates.length,
      hoursSinceLastCommit: hoursSince(lastCommitDate),
      lastCommitDate,
    };
  } catch {
    return emptyStats();
  }
}