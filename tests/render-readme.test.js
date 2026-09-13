/**
 * Renderer + README generator tests for readme-pet.
 * Run with: npm test  (project script: `vitest`)
 */
import { describe, it, expect } from 'vitest';
import { renderPet, getStageColor } from '../src/renderer.js';
import { generateReadme, buildHeader } from '../src/readme.js';

const baseState = {
  name: 'Mochi',
  stage: 'baby',
  mood: 'happy',
  level: 2,
  streak: 0,
  hunger: 50,
  happiness: 50,
  health: 100,
};

describe('renderPet', () => {
  it('returns a string wrapped in <svg>...</svg>', () => {
    const svg = renderPet(baseState);
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('includes the pet name text', () => {
    const svg = renderPet(baseState);
    expect(svg).toContain('Mochi');
  });

  it('includes the streak flame when streak > 0', () => {
    const svg = renderPet({ ...baseState, streak: 7 });
    expect(svg).toContain('7 day streak');
  });

  it('omits the streak flame when streak is 0', () => {
    expect(renderPet(baseState)).not.toContain('day streak');
  });

  it('never emits a <script> tag', () => {
    expect(renderPet(baseState)).not.toContain('<script');
  });

  it('defaults to Mochi + egg stage when given an empty state', () => {
    const svg = renderPet({});
    expect(svg).toContain('Mochi');
    expect(svg).toContain('EGG');
  });
});

describe('getStageColor', () => {
  it('returns the color for a known stage', () => {
    expect(getStageColor('adult')).toBe('#57606A');
  });

  it('maps master to the legendary gold', () => {
    expect(getStageColor('master')).toBe('#FFD700');
  });

  it('falls back to the egg color for unknown stages', () => {
    expect(getStageColor('unicorn')).toBe('#F5E6C8');
  });
});

describe('generateReadme', () => {
  const opts = {
    username: 'nolan',
    petName: 'Mochi',
    svg: '<svg viewBox="0 0 96 96">…</svg>',
    state: {
      mood: 'happy',
      stage: 'baby',
      level: 2,
      streak: 5,
      totalCommits: 1203,
      hunger: 20,
      health: 80,
      happiness: 90,
    },
  };

  it('returns full, profile and header markdown strings', async () => {
    const { full, profile, header } = await generateReadme(opts);
    expect(typeof full).toBe('string');
    expect(typeof profile).toBe('string');
    expect(typeof header).toBe('string');
  });

  it('full README covers install and usage (case-insensitive)', async () => {
    const { full } = await generateReadme(opts);
    const lower = full.toLowerCase();
    expect(lower).toContain('readme-pet');
    expect(lower).toContain('npm install');
    expect(lower).toContain('usage');
    expect(lower).toContain('mochi');
  });

  it('profile README greets and embeds the commit arbiter (case-insensitive)', async () => {
    const { profile } = await generateReadme(opts);
    const lower = profile.toLowerCase();
    expect(lower).toContain("hi there");
    expect(lower).toContain('commit arbiter');
    expect(lower).toContain('nolan');
    expect(lower).toContain('readme-pet');
  });

  it('header includes pet name, streak and status bars (case-insensitive)', async () => {
    const { header } = await generateReadme(opts);
    const lower = header.toLowerCase();
    expect(lower).toContain('mochi');
    expect(lower).toContain('day streak');
    expect(lower).toContain('commits all-time');
    expect(lower).toContain('hunger');
  });
});

describe('buildHeader', () => {
  const opts = {
    username: 'nolan',
    petName: 'Mochi',
    svg: '<svg></svg>',
    state: {
      mood: 'happy',
      stage: 'baby',
      level: 3,
      streak: 12,
      totalCommits: 500,
      hunger: 30,
      health: 90,
      happiness: 85,
    },
  };

  it('includes the streak number', () => {
    expect(buildHeader(opts)).toContain('12 day streak');
  });

  it('includes the stage emoji', () => {
    expect(buildHeader(opts)).toContain('🐣'); // baby
  });
});