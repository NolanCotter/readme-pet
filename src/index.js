/**
 * readme-pet — public module entry point.
 * A Tamagotchi that lives in your GitHub README and feeds on commits.
 * @module readme-pet
 */

export { PetEngine, default as PetEngineDefault } from './engine.js';
export { calculateStreak, getGitHubStats, getLocalStats } from './stats.js';
export { renderPet, getStageColor, default as renderPetDefault } from './renderer.js';
export {
  generateReadme,
  buildHeader,
  buildProfile,
  buildFull,
  renderProfileSnippet,
} from './readme.js';