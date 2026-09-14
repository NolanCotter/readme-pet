#!/usr/bin/env node
/**
 * readme-pet CLI — local pet board, interactions, and GitHub sync.
 * ES module, Node >= 18, zero dependencies.
 *
 * @module cli
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import PetEngine from './engine.js';
import { getGitHubStats, getLocalStats } from './stats.js';
import renderPet from './renderer.js';

const ROOT = dirname(fileURLToPath(import.meta.url)); // .../src
const STATE_FILE = join(ROOT, '..', 'pet-state.json');
const ASSETS_DIR = join(ROOT, '..', 'assets');

const MOOD_EMOJI = { happy: '😊', hungry: '😋', sad: '😢', sick: '🤒', sleepy: '😴', excited: '🤩', egg: '🐣' };
const FACES = ['(◕‿◕)', '(´･ᴗ･`)', '(◡ ω ◡)', '(・ω・)'];

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripAnsi = (t) => String(t).replace(/\x1b\[[0-9;]*m/g, '');

/** Pick an ANSI color for a stat: green = healthy, yellow = meh, red = bad. */
function statColor(value, greaterIsBetter = true) {
  const v = Number(value) || 0;
  if (greaterIsBetter ? v > 60 : v < 40) return 'green';
  if (greaterIsBetter ? v > 30 : v < 70) return 'yellow';
  return 'red';
}

/**
 * A 12-cell bar: █ filled, ░ empty, colour-coded.
 * @param {string} label
 * @param {number} value 0-100
 * @param {keyof typeof C} [color]
 * @returns {string}
 */
function bar(label, value, color = 'green') {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const filled = Math.round((v / 100) * 12);
  const cells = C[color] + '█'.repeat(filled) + C.reset + C.dim + '░'.repeat(12 - filled) + C.reset;
  return `${label.padEnd(9)} ${cells} ${String(Math.round(v)).padStart(3)}/100`;
}

/** One-line encouragement matching the pet's mood. */
function tip(mood) {
  const tips = {
    hungry: '🍽️ Run --feed before the growling wakes the neighbours.',
    sad: '🎾 Run --play — it loves a good chase.',
    sick: '💊 Run --heal and tuck it in.',
    sleepy: '💤 Stay active — more commits, fewer zzz.',
    excited: '✨ It is on fire. Keep committing!',
    happy: '🌱 Healthy and happy. Keep the streak alive!',
  };
  return tips[mood] || '';
}

/**
 * Box-drawing status board: name, level, stage, mood, stat bars, streak, last update.
 * @param {PetEngine} engine
 * @returns {string}
 */
function statusBoard(engine) {
  const s = engine.getStatus();
  const mood = engine.getMood();
  const hours = s.lastUpdate ? Math.max(0, Math.round((Date.now() - Date.parse(s.lastUpdate)) / 3.6e6)) : null;
  const inner = [
    `${s.name}  ·  Lv.${s.level}  ·  ${s.stage}  ${MOOD_EMOJI[mood] || '🙂'}`,
    ` ${bar('Hunger', s.hunger, statColor(s.hunger, false))}`,
    ` ${bar('Happiness', s.happiness, statColor(s.happiness))}`,
    ` ${bar('Health', s.health, statColor(s.health))}`,
    `Streak: ${s.streak} day${s.streak === 1 ? '' : 's'} · updated ${hours === null ? 'never' : `${hours}h ago`}`,
  ];
  const w = Math.max(...inner.map((l) => stripAnsi(l).length)) + 4;
  const frame = (l) => `│ ${l}${' '.repeat(w - 2 - stripAnsi(l).length)} │`;
  return ['╭' + '─'.repeat(w) + '╮', ...inner.map(frame), '╰' + '─'.repeat(w) + '╯'].join('\n');
}

/** 🐾 Short TTY-only animation while the pet "tick"s. */
async function animate(engine) {
  if (!process.stdout.isTTY) return;
  for (let i = 0; i < 8; i++) {
    const bump = i % 2 ? '·' : '●';
    process.stdout.write(`\x1b[2K\r${FACES[i % FACES.length]} ${engine.state.name} is ${i % 4 < 2 ? 'growing' : 'thinking'} ${bump}`);
    await sleep(120);
  }
  process.stdout.write('\x1b[2K\r');
}

/** @returns {Promise<PetEngine>} Pet state from disk, or a fresh default. */
async function loadEngine() {
  try {
    return new PetEngine(JSON.parse(await readFile(STATE_FILE, 'utf8')));
  } catch {
    return new PetEngine();
  }
}

/** Write pet-state.json back to the repo root, in place. */
async function saveState(engine) {
  await writeFile(STATE_FILE, JSON.stringify(engine.toJSON(), null, 2) + '\n');
}

/**
 * Profile-README markdown snippet. Uses src/readme.js when available (loaded
 * lazily so the CLI works even before that module exists); otherwise falls
 * back to an inline snippet embedding the SVG.
 * @param {string} svg
 * @param {object} state
 * @returns {Promise<string>}
 */
async function profileSnippet(svg, state) {
  try {
    const readme = await import('./readme.js');
    const fn = readme.renderProfileSnippet ?? readme.default;
    if (typeof fn === 'function') {
      return await fn({ username: process.env.GITHUB_USERNAME || 'your-username', petName: state.name, svg, state });
    }
  } catch {
    /* readme.js not present yet — inline default below */
  }
  return `<!-- readme-pet: ${state.name} (Lv.${state.level} ${state.stage}) -->
<p align="center"><img src="pet.svg" width="400" alt="${state.name} — ${state.stage} pet"/></p>
`;
}

/** Parse argv into a command descriptor. */
function parseArgs(argv) {
  const out = { cmd: 'local', username: null, token: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--github') { out.cmd = 'github'; out.username = argv[++i]; }
    else if (a === '--token') out.token = argv[++i];
    else if (a === '--feed' || a === '--play' || a === '--heal') out.cmd = a.slice(2);
    else if (a === '--help' || a === '-h') out.cmd = 'help';
  }
  return out;
}

const HELP = `readme-pet — a Tamagotchi that lives in your README.

Usage:
  node src/cli.js                Local mode: tick from git log, print status board
  node src/cli.js --feed         Feed the pet
  node src/cli.js --play         Play with the pet
  node src/cli.js --heal         Heal the pet
  node src/cli.js --github USER  Sync stats from GitHub (optional --token TOKEN)
  node src/cli.js --help         Show this help
`;

/**
 * CLI entrypoint.
 * @param {string[]} [argv] defaults to process.argv.slice(2)
 * @returns {Promise<number>} exit code
 */
export async function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    if (args.cmd === 'help') return console.log(HELP), 0;

    const engine = await loadEngine();
    let synced = '';

    if (args.cmd === 'feed' || args.cmd === 'play' || args.cmd === 'heal') {
      engine[args.cmd]();
    } else if (args.cmd === 'github') {
      if (!args.username) return console.error('⚠️  --github needs a username, e.g. --github octocat'), 1;
      const stats = await getGitHubStats(args);
      await animate(engine);
      engine.tick({
        commitsToday: stats.commitsToday,
        streak: stats.streak,
        totalCommits: stats.totalCommits,
        hoursSinceLastCommit: stats.hoursSinceLastCommit,
      });
      synced = `🐙 Synced ${args.username} — ${stats.commitsToday} commits today, ${stats.streak}-day streak.`;
    } else {
      const stats = await getLocalStats();
      await animate(engine);
      engine.tick({
        commitsToday: stats.commitsToday,
        streak: stats.streak,
        totalCommits: stats.totalCommits,
        hoursSinceLastCommit: stats.hoursSinceLastCommit,
      });
    }

    await saveState(engine);
    if (synced) console.log(synced);
    console.log(statusBoard(engine));
    console.log(tip(engine.getMood()));

    if (args.cmd === 'github') {
      const status = { ...engine.getStatus(), mood: engine.getMood() };
      const svg = renderPet(status);
      await mkdir(ASSETS_DIR, { recursive: true });
      await Promise.all([
        writeFile(join(ASSETS_DIR, 'pet.svg'), svg),
        writeFile(join(ASSETS_DIR, 'profile.md'), await profileSnippet(svg, status)),
      ]);
      console.log(`💾 Saved assets/pet.svg and assets/profile.md`);
    }
    return 0;
  } catch (err) {
    console.error('🐾 Pet is fine but GitHub API is sleepy...');
    if (err.message) console.error(`   (${err.message})`);
    try {
      console.log(statusBoard(new PetEngine())); // defaults
    } catch {
      /* never */
    }
    return 1;
  }
}

// Run directly: `node src/cli.js`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code ?? 0; }).catch(() => { process.exitCode = 1; });
}