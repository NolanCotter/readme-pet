# Contributing to readme-pet

Thanks for wanting to help! readme-pet is intentionally small, so most
contributions are quick and focused. This guide gets you from clone to merged
PR (hopefully with a happy pet) in a few minutes.

## Setup

```bash
git clone git@github.com:YOUR_USERNAME/readme-pet.git
cd readme-pet
npm install
```

No build step required — the project is plain ESM and targets Node.js 18+.

## Run it locally

Tick the pet once using your local git history, then inspect the status board:

```bash
node src/cli.js
```

You can also interact with the pet directly:

```bash
node src/cli.js --feed   # -30 hunger, +5 happiness
node src/cli.js --play   # +20 happiness, +10 hunger
node src/cli.js --heal   # restore health to 100
```

To sync real stats from GitHub (works unauthenticated, more accurate with a
token):

```bash
node src/cli.js --github YOUR_USERNAME --token ghp_xxxxxxxx
```

Every run writes `pet-state.json` back to the repo root. In `--github` mode it
also regenerates `assets/pet.svg` and `assets/profile.md`. Preview the SVG in
the browser demo with `npm run demo`.

## How the pet ticks

A GitHub Actions workflow (`.github/workflows/update-pet.yml`) runs every 6
hours by default — see the `cron` line, which is in UTC. You can also trigger
it manually with the "Run workflow" button on the Actions tab. Each run:

1. Fetches your commit stats for the day (`src/stats.js`).
2. Advances the pet one "tick" via `engine.tick(...)` (`src/engine.js`).
3. Renders the new artwork to `assets/pet.svg` (`src/renderer.js`).
4. Writes the profile snippet (`src/readme.js`) to `assets/profile.md`.
5. Commits and pushes those files back.

Commits feed the pet: hunger drops 20, happiness rises 15, and you earn 10 XP
per commit. Silence is the opposite — hunger climbs 15, happiness falls 10,
and health starts to chip away once hunger sits above 80 or it's been 48+
hours since your last commit.

## Adding a mood

Moods are the pet's emotional state: `happy`, `hungry`, `sad`, `sick`,
`sleepy`, `excited`.

1. In `src/engine.js`, extend the `Mood` typedef and add a branch to
   `getMood()`. Keep the priority order clear: sick > hungry > sad > sleepy >
   excited > happy.
2. In `src/renderer.js`, add cases to the `eyes(mood)` and `mouth(mood)`
   switches. Keep the SVG minimal and cute.
3. Add tests in `tests/engine.test.js` (and a renderer assertion in
   `tests/render-readme.test.js` if the art changes shape).

## Adding a stage

Stages are the growth tiers: `egg`, `baby`, `child`, `teen`, `adult`,
`master` (`master` renders as gold "legendary" artwork).

1. In `src/engine.js`, extend the `Stage` typedef and any evolution logic.
2. In `src/renderer.js`, add an entry to `COLORS` and `STROKES`, plus a
   `body(stage)` case.
3. In `src/readme.js`, extend `STAGE_EMOJI` if the new stage earns its own
   emoji.
4. Add tests covering the new stage's defaults, colors, and rendering.

## Running tests

```bash
npm test
```

The suite uses Vitest: engine unit tests live in `tests/engine.test.js`;
renderer and README-generator coverage live in
`tests/render-readme.test.js`.

## PR etiquette

- Keep diffs small and focused — one mood, one stage, one fix per PR.
- Run `npm test` before opening the PR and make sure everything passes.
- If your change affects the pet's art or stats, update the README example
  so people can see what they're about to adopt.
- Update existing tests or add new ones for whatever you touched.
- Use a descriptive title: "Add 'sleepy' mood for midday silence" beats
  "update stuff".

Questions are better as an issue than a drive-by PR. Otherwise, have fun —
the pet is hungry for good diffs. 🐾