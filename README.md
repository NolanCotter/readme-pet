<p align="center">
  <img src="https://raw.githubusercontent.com/{USERNAME}/readme-pet/main/assets/pet.svg" width="420" alt="readme-pet">
</p>

# 🐾 readme-pet

> A living, tamagotchi-style pet that **lives in your GitHub profile README**.
> It feeds on your commits, gets hungry during quiet weeks, and levels up on streaks.

```text
Your scenario       What your pet does
──────────────────────────────────────────────
Push code today     🍖 Fed, happy, +XP, streak grows
Quiet week          🥺 Hungry → sad → sick
Long streak         🏆 Levels up, evolves to new stages
```

## ✨ Features

- 🤖 **Commit Arbiter** — a pet that visibly reacts to how you commit
- 🥚 **Stages** — `egg → baby → child → teen → adult → legendary` (wip: evolution thresholds)
- 😄 **Moods** — `happy · hungry · sad · sick · sleepy · excited` derived from real stats
- 🍖 **Stat bars** — hunger / happiness / health rendered as emoji progress bars
- 🔥 **Streak display** — burned into the pet SVG itself
- 🎨 **Pure SVG artwork** — one static file (`assets/pet.svg`), no JS, no builds, renders anywhere
- ⚡ **Zero dependencies** — plain Node 18+, one GitHub Action, done

## 🚀 Quick start (your profile)

1. **Fork / copy** this repo — call it `readme-pet`, or keep it as your own.
2. Open **`.github/workflows/update-pet.yml`** and confirm the cron is the cadence you want (default: **every 6 hours**).
3. Run it once from the **Actions** tab (`workflow_dispatch`) so the pet hatches.
4. Copy `assets/profile.md` from your run into **`<you>/<you>/README.md`**.
5. Keep committing — the pet eats. 🍽️

> Want the pet to represent *you*? Edit `pet-state.json` (name, species) and enable the `script` in the Action if you keep the repo private.

## 🛠️ Local play

```bash
# tick once from your local git log — prints a status board
node src/cli.js

# interact with your pet (writes state back to pet-state.json)
node src/cli.js --feed
node src/cli.js --play
node src/cli.js --heal

# pull real GitHub stats (rate-limited without a token)
node src/cli.js --github YOUR_USERNAME [--token ghp_...]

# preview the pet SVG + profile snippet
node src/cli.js --github YOUR_USERNAME   # writes assets/pet.svg + assets/profile.md
```

**Scratch avatar** serverless demo:

```bash
npm run demo   # needs `npm i -D vite`
# or anything static:
npx serve demo/
```

## 🧠 How it works

| Piece | File | Role |
| --- | --- | --- |
| State machine | `src/engine.js` | tick math, moods, level ups — pure & testable |
| GitHub stats | `src/stats.js` | commits today, streak, totals (API + local git fallback) |
| Artwork | `src/renderer.js` | stage/mood-aware SVG generator |
| README glue | `src/readme.js` | builds your profile header + bars |
| Scheduler | `.github/workflows/update-pet.yml` | cron tick + auto-commit |

```text
cron (every 6h) ──► cli.js --github ──► stats.js ──► engine.tick()
                                              │
                                              ├──► renderer.js ──► assets/pet.svg
                                              └──► readme.js   ──► assets/profile.md
                                               then Action commits both + state
```

## 📦 Install as a library

```bash
npm install readme-pet
```

```js
import { PetEngine, renderPet, generateReadme } from 'readme-pet';

const pet = new PetEngine({ name: 'Mochi' });
pet.tick({ commitsToday: 3 });         // fed, +30 XP
const svg  = renderPet(pet.getStatus());
const docs = await generateReadme({
  username: 'nolan',
  petName: 'Mochi',
  svg,
  state: pet.getStatus(),
});                                    // { full, profile, header }
```

## 🧪 Tests

```bash
npm i -D vitest && npm test
```

## 🤝 Contributing

Ping a stage, charm, or mood idea in an issue — or read `CONTRIBUTING.md` and open a PR.

## 📄 License

MIT © Nolan