import { describe, it, expect } from 'vitest';
import { computeBadges } from '../badges';
import type { ProgressData } from '../types';

function earned(data: ProgressData, counts: Record<string, number>) {
  return new Set(computeBadges(data, counts).filter((b) => b.earned).map((b) => b.id));
}

const empty: ProgressData = { subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: false };

describe('computeBadges', () => {
  it('returns all four badges, none earned for empty progress', () => {
    const badges = computeBadges(empty, {});
    expect(badges.map((b) => b.id).sort()).toEqual(['first-steps', 'polymath', 'streak-7', 'tree-complete']);
    expect(badges.every((b) => !b.earned)).toBe(true);
  });

  it('earns first-steps with one mastered node', () => {
    const data: ProgressData = { ...empty, subjects: { networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } } } };
    expect(earned(data, { networking: 3 }).has('first-steps')).toBe(true);
    expect(earned(data, { networking: 3 }).has('tree-complete')).toBe(false);
  });

  it('earns tree-complete when a subject is fully mastered', () => {
    const data: ProgressData = { ...empty, subjects: { networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 }, b: { status: 'mastered', bestScore: 1, xpEarned: 100 } } } } };
    expect(earned(data, { networking: 2 }).has('tree-complete')).toBe(true);
  });

  it('earns streak-7 at 7 days and polymath across two subjects', () => {
    const data: ProgressData = {
      ...empty,
      streak: { count: 7, lastActiveISO: '2026-06-20' },
      subjects: {
        networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } },
        finance: { nodes: { x: { status: 'mastered', bestScore: 1, xpEarned: 80 } } },
      },
    };
    const e = earned(data, { networking: 3, finance: 3 });
    expect(e.has('streak-7')).toBe(true);
    expect(e.has('polymath')).toBe(true);
  });
});
