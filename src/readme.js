/**
 * readme.js — README generator for readme-pet.
 *
 * Pure ESM, zero dependencies. Builds three markdown documents:
 *   - full:    the readme-pet project README (install + usage)
 *   - profile: a ready-to-paste GitHub profile README embedding the pet
 *   - header:  the top section (pet + stats + status bars) used in `profile`
 *
 * @module readme
 */

/** Mood -> emoji. The egg state hatches to 🐣. */
const MOOD_EMOJI = {
  happy: '🙂',
  hungry: '😋',
  sad: '😢',
  sick: '🤒',
  sleepy: '😴',
  excited: '🤩',
  egg: '🐣',
};

/** Growth stage -> emoji. */
const STAGE_EMOJI = {
  egg: '🥚',
  baby: '🐣',
  teen: '🐥',
  adult: '🐓',
};

/**
 * Clamp a number to [min, max].
 * @param {number} n Input value
 * @param {number} min Lower bound (default 0)
 * @param {number} max Upper bound (default 100)
 * @returns {number} Clamped value
 */
const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/**
 * Render an emoji progress bar, e.g. `🍖 ████████░░ 80%`.
 * @param {string} icon Emoji shown before the bar
 * @param {number} value Current value
 * @param {number} max Full scale (default 100)
 * @param {number} width Bar width in blocks (default 10)
 * @returns {string} Emoji bar line
 */
function bar(icon, value, max = 100, width = 10) {
  const pct = clamp(Math.round((value / Math.max(1, max)) * 100));
  const filled = Math.round((pct / 100) * width);
  return `${icon} ${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${pct}%`;
}

/**
 * Resolve a mood emoji, falling back to happy.
 * @param {string|undefined} mood Pet mood key
 * @returns {string} Emoji
 */
function moodEmoji(mood) {
  return MOOD_EMOJI[mood] ?? MOOD_EMOJI.happy;
}

/**
 * Resolve a stage emoji, defaulting to newly-hatched 🐣.
 * @param {string|undefined} stage Growth stage key
 * @returns {string} Emoji
 */
function stageEmoji(stage) {
  return STAGE_EMOJI[stage] ?? '🐣';
}

/**
 * URL of the pet artwork in the readme-pet repo.
 * @param {string} username GitHub username
 * @returns {string} Raw GitHub URL
 */
function petSvgUrl(username) {
  return `https://raw.githubusercontent.com/${username}/readme-pet/main/assets/pet.svg`;
}

/**
 * Build the top section used in the profile README: a blockquote with
 * pet name + mood + level, the stats line, the pet SVG image, and the
 * emoji status bars.
 * @param {object} opts Options
 * @param {string} opts.username GitHub username
 * @param {string} opts.petName Pet display name
 * @param {string} opts.svg Raw pet SVG markup (written to assets/pet.svg at deploy time)
 * @param {object} opts.state Current pet state: mood, stage, level, streak,
 *   totalCommits, hunger, energy, happiness
 * @returns {string} Markdown header
 */
export function buildHeader({ username, petName, svg, state }) {
  const mood = state.mood ?? 'happy';
  const stage = state.stage ?? 'baby';
  const emoji = moodEmoji(mood);
  const stageEmo = stageEmoji(stage);
  const stats = [
    `🔥 **${state.streak ?? 0} day streak**`,
    `📝 \`${state.totalCommits ?? 0}\` commits all-time`,
    `${stageEmo} ${stage}`,
  ].join(' • ');
  const bars = [
    `${bar('🍖', state.hunger ?? 0)} hunger`,
    `${bar('⚡', state.health ?? 0)} health`,
    `${bar('💖', state.happiness ?? 0)} happiness`,
  ].join(' · ');
  const title = `${petName} — a readme-pet`;
  return [
    `> ${emoji} **${petName}** — level ${state.level ?? 1} · ${mood} ${emoji} · ${stageEmo} ${stage}`,
    '',
    stats,
    '',
    `![${title}](${petSvgUrl(username)})`,
    '',
    `> ${bars}`,
  ].join('\n');
}

/**
 * Build a ready-to-paste GitHub profile README embedding the pet.
 * @param {object} opts Same options as buildHeader
 * @returns {string} Full profile README markdown
 */
export function buildProfile({ username, petName, svg, state }) {
  const header = buildHeader({ username, petName, svg, state });
  return [
    `### Hi there 👋 I'm ${username}`,
    '',
    header,
    '',
    '## 🔥 Commit Arbiter',
    '',
    `Meet **${petName}**, the commit arbiter living in this README. It feeds on pushes, and it does not forgive silence.`,
    '',
    '- ✅ **Every commit feeds it** — work keeps it full and the streak alive.',
    '- ⚠️ **Silence makes it hungry, then sad, then sick** — a rotting streak is public.',
    '- 🏆 **Steady streaks level it up** — it hatches, grows, and evolves stages.',
    '',
    '**The stack that keeps it alive:** GitHub Actions · Node.js · Markdown · raw SVG',
    '',
    '---',
    '',
    `Built with [readme-pet](https://github.com/${username}/readme-pet) — a README that feeds on commits.`,
  ].join('\n');
}

/**
 * Build the readme-pet project README (this repo's own README).
 * @param {object} opts Options
 * @param {string} opts.username GitHub username
 * @param {string} opts.petName Pet display name for the examples
 * @returns {string} Full project README markdown
 */
export function buildFull({ username, petName }) {
  return `# readme-pet

> 🐣 A living, commit-powered pet that lives in your GitHub **profile README**. It feeds on pushes, gets hungry during quiet weeks, and levels up on streaks.

## ✨ Features

- 🍖 **Emoji status bars** — hunger, energy and happiness at a glance
- 🔥 **Stats line** — streak, all-time commits and growth stage
- 🤖 **Commit Arbiter** — a pet that visibly reacts to how you commit
- 🎨 **Raw SVG artwork** — one file, \`assets/pet.svg\`, no builds

## 📦 Install

\`\`\`
npm install readme-pet
\`\`\`

Pure ESM · Node.js 18+ · zero dependencies.

## 🚀 Usage

\`\`\`js
import { generateReadme } from 'readme-pet';

const { full, profile, header } = await generateReadme({
  username: '${username}',
  petName: '${petName}',
  svg: '<svg viewBox="0 0 96 96">…</svg>', // raw art; also pushed to assets/pet.svg
  state: {
    mood: 'happy',
    stage: 'baby',
    level: 1,
    streak: 14,
    totalCommits: 1203,
    hunger: 20,
    energy: 80,
    happiness: 100,
  },
});
\`\`\`

**What you get:**

- \`full\` — the readme-pet project README (this file)
- \`profile\` — a ready-to-paste \`${username}/${username}/README.md\`
- \`header\` — just the pet + stats + status bars section

## 🛠 Deploying to your profile

1. Push \`assets/pet.svg\` to \`${username}/readme-pet\` on \`main\`.
2. Paste \`profile\` into \`${username}/${username}/README.md\`.
3. Keep committing — the pet eats.

## 📈 How the pet works

| Commits | Effect on pet |
| --- | --- |
| Daily push | Fed, happy, streak grows |
| Quiet week | Hungry → sad → sick |
| Long streak | Levels up, evolves stage |

## 📄 LICENSE

MIT © ${username}
`;
}

/**
 * Generate the full set of README strings for readme-pet.
 * @param {object} opts Options
 * @param {string} opts.username GitHub username, e.g. "nolan"
 * @param {string} opts.petName Pet display name, e.g. "Mochi"
 * @param {string} opts.svg Raw pet SVG markup
 * @param {object} opts.state Current pet state: mood, stage, level, streak,
 *   totalCommits, hunger, energy, happiness
 * @returns {Promise<{full: string, profile: string, header: string}>} Markdown documents
 */
export async function generateReadme({ username, petName, svg, state }) {
  const header = buildHeader({ username, petName, svg, state });
  const profile = buildProfile({ username, petName, svg, state });
  const full = buildFull({ username, petName });
  return { full, profile, header };
}

/**
 * Render just the embeddable pet snippet (pet + stats + status bars).
 * Used by the CLI to write assets/profile.md — uses an absolute raw URL so
 * it works when pasted into <username>/<username>/README.md.
 * @param {object} opts Same options as buildHeader/buildProfile
 * @returns {string} Markdown snippet
 */
export function renderProfileSnippet({ username, petName, svg, state }) {
  const mood = state.mood ?? 'happy';
  const emoji = moodEmoji(mood);
  const stage = state.stage ?? 'baby';
  const stageEmo = stageEmoji(stage);
  return [
    `<!-- readme-pet: ${petName} (Lv.${state.level ?? 1} ${stage}) — auto-updated by GitHub Actions -->`,
    '',
    `> ${emoji} **${petName}** — level ${state.level ?? 1} · ${mood} · ${stageEmo} ${stage}`,
    '',
    `![${petName} — a readme-pet](${petSvgUrl(username)})`,
    '',
    `> 🔥 **${state.streak ?? 0} day streak** · 📝 \`${state.totalCommits ?? 0}\` commits all-time`,
    '',
    `> ${[
      `${bar('🍖', state.hunger ?? 0)} hunger`,
      `${bar('⚡', state.health ?? 0)} health`,
      `${bar('💖', state.happiness ?? 0)} happiness`,
    ].join(' · ')}`,
    `> *This pet feeds on commits — silence makes it sick.* → [readme-pet](https://github.com/${username}/readme-pet)`,
  ].join('\n');
}