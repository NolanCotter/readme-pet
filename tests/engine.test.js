/**
 * Engine unit tests for readme-pet.
 * Run with: npm test  (project script: `vitest`)
 */
import { describe, it, expect } from 'vitest';
import PetEngine from '../src/engine.js';

describe('PetEngine', () => {
  describe('tick with commits feeds the pet', () => {
    it('lowers hunger, raises happiness and grants xp', () => {
      const pet = new PetEngine(); // defaults: hunger 50, happiness 50, xp 0
      pet.tick({ commitsToday: 1 });
      const s = pet.getStatus();
      expect(s.hunger).toBe(30); // 50 - 20
      expect(s.happiness).toBe(65); // 50 + 15
      expect(s.xp).toBe(10); // 10 * commitsToday
    });

    it('grants more xp for more commits and stores streak/total', () => {
      const pet = new PetEngine();
      pet.tick({ commitsToday: 2, streak: 14, totalCommits: 500 });
      const s = pet.getStatus();
      expect(s.xp).toBe(20);
      expect(s.streak).toBe(14);
      expect(s.totalCommits).toBe(500);
    });

    it('leaves health untouched when fed', () => {
      const pet = new PetEngine({ health: 80 });
      pet.tick({ commitsToday: 1 });
      expect(pet.getStatus().health).toBe(80);
    });
  });

  describe('tick without commits decays the pet', () => {
    it('raises hunger and lowers happiness', () => {
      const pet = new PetEngine();
      pet.tick({});
      const s = pet.getStatus();
      expect(s.hunger).toBe(65); // 50 + 15
      expect(s.happiness).toBe(40); // 50 - 10
    });

    it('drains health when hunger rises above 80', () => {
      const pet = new PetEngine({ hunger: 80, health: 100 });
      pet.tick({});
      const s = pet.getStatus();
      expect(s.hunger).toBe(95);
      expect(s.health).toBe(95); // 100 - 5
    });

    it('drains health after prolonged inactivity (>48h)', () => {
      const pet = new PetEngine({ health: 50 });
      pet.tick({ hoursSinceLastCommit: 49 });
      expect(pet.getStatus().health).toBe(45);
    });
  });

  describe('stat clamping at 0 and 100', () => {
    it('never lets hunger drop below 0', () => {
      const pet = new PetEngine({ hunger: 5 });
      pet.feed();
      expect(pet.getStatus().hunger).toBe(0);
    });

    it('never lets hunger exceed 100', () => {
      const pet = new PetEngine({ hunger: 90 });
      pet.tick({});
      expect(pet.getStatus().hunger).toBe(100);
    });

    it('never lets happiness drop below 0', () => {
      const pet = new PetEngine({ happiness: 0 });
      pet.tick({});
      expect(pet.getStatus().happiness).toBe(0);
    });

    it('never lets happiness exceed 100', () => {
      const pet = new PetEngine({ happiness: 95 });
      pet.tick({ commitsToday: 1 });
      expect(pet.getStatus().happiness).toBe(100);
    });

    it('never lets xp go negative', () => {
      const pet = new PetEngine();
      pet.addXP(-500);
      expect(pet.getStatus().xp).toBe(0);
    });
  });

  describe('addXP and level-ups', () => {
    it('levels up when reaching exactly 100 xp', () => {
      const pet = new PetEngine();
      const result = pet.addXP(100);
      expect(result).toEqual({ xp: 100, level: 2, leveledUp: true });
      expect(pet.getStatus().level).toBe(2);
    });

    it('does not level up below 100 xp', () => {
      const pet = new PetEngine();
      const result = pet.addXP(50);
      expect(result.leveledUp).toBe(false);
      expect(result.level).toBe(1);
    });

    it('accumulates xp across calls and levels at each 100', () => {
      const pet = new PetEngine();
      pet.addXP(60);
      pet.addXP(80); // 140 total
      const s = pet.getStatus();
      expect(s.xp).toBe(140);
      expect(s.level).toBe(2);
    });
  });

  describe('getMood priority', () => {
    it('returns sick when health < 30', () => {
      expect(new PetEngine({ stage: 'baby', health: 20 }).getMood()).toBe('sick');
    });

    it('returns hungry when hunger > 75', () => {
      expect(new PetEngine({ stage: 'baby', hunger: 80, health: 50 }).getMood()).toBe('hungry');
    });

    it('returns sad when happiness < 25', () => {
      expect(new PetEngine({ stage: 'baby', happiness: 10, hunger: 50, health: 50 }).getMood()).toBe('sad');
    });

    it('returns excited when everything is great', () => {
      expect(new PetEngine({ stage: 'baby', happiness: 90, hunger: 10, health: 90 }).getMood()).toBe('excited');
    });

    it('falls back to happy when nothing special triggers', () => {
      expect(new PetEngine({ stage: 'baby', happiness: 80, hunger: 20, health: 80 }).getMood()).toBe('happy');
    });

    it('returns egg while the pet is still an egg', () => {
      expect(new PetEngine({ stage: 'egg', happiness: 10, health: 10 }).getMood()).toBe('egg');
    });

    it('respects priority order: sick > hungry > sad', () => {
      expect(new PetEngine({ stage: 'baby', health: 20, hunger: 90, happiness: 90 }).getMood()).toBe('sick');
      expect(new PetEngine({ stage: 'baby', hunger: 80, happiness: 10, health: 50 }).getMood()).toBe('hungry');
    });
  });

  describe('feed / play / heal deltas', () => {
    it('feed: -30 hunger, +5 happiness', () => {
      const pet = new PetEngine({ hunger: 70, happiness: 60 });
      pet.feed();
      const s = pet.getStatus();
      expect(s.hunger).toBe(40);
      expect(s.happiness).toBe(65);
    });

    it('play: +20 happiness, +10 hunger', () => {
      const pet = new PetEngine({ happiness: 50, hunger: 30 });
      pet.play();
      const s = pet.getStatus();
      expect(s.happiness).toBe(70);
      expect(s.hunger).toBe(40);
    });

    it('heal: restores health to 100', () => {
      const pet = new PetEngine({ health: 30 });
      pet.heal();
      expect(pet.getStatus().health).toBe(100);
    });
  });

  describe('toJSON isolation', () => {
    it('mutating the snapshot does not mutate the engine', () => {
      const pet = new PetEngine({ hunger: 60, happiness: 70, health: 80 });
      const snapshot = pet.toJSON();
      expect(snapshot).not.toBe(pet.state);

      snapshot.hunger = 0;
      snapshot.happiness = 0;
      snapshot.health = 0;
      snapshot.evolutionHistory.push('master');

      const state = pet.getStatus();
      expect(state.hunger).toBe(60);
      expect(state.happiness).toBe(70);
      expect(state.health).toBe(80);
      expect(pet.state.evolutionHistory).toEqual(['egg']);
    });
  });
});