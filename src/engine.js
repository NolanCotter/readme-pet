/**
 * Tamagotchi state machine — pure JS, no dependencies.
 * @module engine
 */

/** @typedef {'egg'|'baby'|'child'|'teen'|'adult'|'master'} Stage */
/** @typedef {'happy'|'hungry'|'sad'|'sick'|'sleepy'|'excited'} Mood */

/**
 * @typedef {Object} PetState
 * @property {string} name
 * @property {string} species
 * @property {number} level
 * @property {number} xp
 * @property {Stage} stage
 * @property {number} hunger - 0 (full) to 100 (starving)
 * @property {number} happiness - 0 to 100
 * @property {number} health - 0 to 100
 * @property {number} streak
 * @property {number} totalCommits
 * @property {string} lastUpdate - ISO timestamp
 * @property {string} lastFed - ISO timestamp
 * @property {string} birthDate - ISO timestamp
 * @property {string[]} evolutionHistory
 */

/** Clamp value to 0-100 */
const clamp = (n) => Math.max(0, Math.min(100, n));

/** Default state factory */
function defaults() {
  const now = new Date().toISOString();
  return {
    name: 'Mochi',
    species: 'octocat',
    level: 1,
    xp: 0,
    stage: 'egg',
    hunger: 50,
    happiness: 50,
    health: 100,
    streak: 0,
    totalCommits: 0,
    lastUpdate: now,
    lastFed: now,
    birthDate: now,
    evolutionHistory: ['egg'],
  };
}

export class PetEngine {
  /** @param {Partial<PetState>} [state] */
  constructor(state = {}) {
    const d = defaults();
    this.state = {
      ...d,
      ...state,
      evolutionHistory: [...(state.evolutionHistory ?? d.evolutionHistory)],
    };
    // ensure derived level matches xp if caller only set xp
    if (state.xp !== undefined && state.level === undefined) {
      this.state.level = Math.floor(this.state.xp / 100) + 1;
    }
  }

  /**
   * Advance pet by one tick based on GitHub activity.
   * @param {Object} opts
   * @param {number} [opts.commitsToday=0]
   * @param {number} [opts.streak]
   * @param {number} [opts.totalCommits]
   * @param {number} [opts.hoursSinceLastCommit=0]
   * @returns {PetState}
   */
  tick({ commitsToday = 0, streak, totalCommits, hoursSinceLastCommit = 0 } = {}) {
    if (commitsToday > 0) {
      this.state.hunger = clamp(this.state.hunger - 20);
      this.state.happiness = clamp(this.state.happiness + 15);
      this.addXP(10 * commitsToday);
    } else {
      this.state.hunger = clamp(this.state.hunger + 15);
      this.state.happiness = clamp(this.state.happiness - 10);
      if (this.state.hunger > 80) {
        this.state.health = clamp(this.state.health - 5);
      }
      // prolonged inactivity chips health slowly
      if (hoursSinceLastCommit > 48) {
        this.state.health = clamp(this.state.health - 5);
      }
    }

    if (streak !== undefined) this.state.streak = streak;
    if (totalCommits !== undefined) this.state.totalCommits = totalCommits;
    this.state.lastUpdate = new Date().toISOString();

    return this.getStatus();
  }

  /**
   * Add XP and recalculate level.
   * @param {number} amount
   * @returns {{ xp: number, level: number, leveledUp: boolean }}
   */
  addXP(amount) {
    const prev = this.state.level;
    this.state.xp += amount;
    if (this.state.xp < 0) this.state.xp = 0;
    this.state.level = Math.floor(this.state.xp / 100) + 1;
    return { xp: this.state.xp, level: this.state.level, leveledUp: this.state.level > prev };
  }

  /**
   * Derive mood from current stats. Priority: sick > hungry > sad > sleepy > excited > happy.
   * @returns {Mood}
   */
  getMood() {
    const { stage, hunger, happiness, health } = this.state;
    if (stage === 'egg') return 'egg';
    if (health < 30) return 'sick';
    if (hunger > 75) return 'hungry';
    if (happiness < 25) return 'sad';
    if (health < 60 && hunger > 50) return 'sleepy';
    if (happiness > 85 && hunger < 30 && health > 70) return 'excited';
    return 'happy';
  }

  /** @returns {PetState} deep copy of current state */
  getStatus() {
    return {
      ...this.state,
      evolutionHistory: [...this.state.evolutionHistory],
    };
  }

  /** Feed the pet: -30 hunger, +5 happiness */
  feed() {
    this.state.hunger = clamp(this.state.hunger - 30);
    this.state.happiness = clamp(this.state.happiness + 5);
    this.state.lastFed = new Date().toISOString();
    return this.getStatus();
  }

  /** Play with the pet: +20 happiness, +10 hunger */
  play() {
    this.state.happiness = clamp(this.state.happiness + 20);
    this.state.hunger = clamp(this.state.hunger + 10);
    return this.getStatus();
  }

  /** Fully restore health */
  heal() {
    this.state.health = 100;
    return this.getStatus();
  }

  /** @returns {PetState} JSON-serialisable snapshot */
  toJSON() {
    return this.getStatus();
  }
}

export default PetEngine;
