import { describe, it, expect } from 'vitest';
import { computeNodeStates, computeSubjectXp, computeLevel, computeGlobalXp } from '../treeState';
import type { LoadedTree } from '@/domain/content/types';
import type { SubjectProgress, ProgressData } from '@/domain/progress/types';

const tree: LoadedTree = {
  subject: 'networking',
  title: 'Networking',
  bossNodeId: 'c',
  nodes: [
    { id: 'a', position: { x: 0, y: 0 }, prerequisites: [], meta: { id: 'a', title: 'A', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'b', position: { x: 0, y: 1 }, prerequisites: ['a'], meta: { id: 'b', title: 'B', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'c', position: { x: 0, y: 2 }, prerequisites: ['b'], meta: { id: 'c', title: 'C', type: 'lesson-quiz', xp: 200, estMinutes: 5, isBoss: true } },
  ],
};

describe('computeNodeStates', () => {
  it('first node is available, rest locked when no progress', () => {
    const states = computeNodeStates(tree, { nodes: {} });
    expect(states.a).toBe('available');
    expect(states.b).toBe('locked');
    expect(states.c).toBe('locked');
  });

  it('mastering a node unlocks its dependents', () => {
    const progress: SubjectProgress = { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } };
    const states = computeNodeStates(tree, progress);
    expect(states.a).toBe('mastered');
    expect(states.b).toBe('available');
    expect(states.c).toBe('locked');
  });

  it('reflects in-progress status', () => {
    const progress: SubjectProgress = { nodes: { a: { status: 'in-progress', bestScore: 0.5, xpEarned: 0 } } };
    expect(computeNodeStates(tree, progress).a).toBe('in-progress');
  });
});

describe('computeSubjectXp', () => {
  it('sums earned xp', () => {
    const progress: SubjectProgress = { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 }, b: { status: 'mastered', bestScore: 1, xpEarned: 100 } } };
    expect(computeSubjectXp(progress)).toBe(200);
  });
});

describe('computeLevel', () => {
  it('level 1 Novice at 0 xp', () => {
    expect(computeLevel(0)).toEqual({ level: 1, title: 'Novice', xpIntoLevel: 0, xpForNext: 300 });
  });
  it('rolls to level 2 Apprentice at 300 xp', () => {
    const r = computeLevel(350);
    expect(r.level).toBe(2);
    expect(r.title).toBe('Apprentice');
    expect(r.xpIntoLevel).toBe(50);
  });
});

describe('computeGlobalXp', () => {
  it('sums xpEarned across all subjects', () => {
    const data: ProgressData = {
      subjects: {
        networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 }, b: { status: 'mastered', bestScore: 1, xpEarned: 120 } } },
        finance: { nodes: { x: { status: 'mastered', bestScore: 1, xpEarned: 80 } } },
      },
      streak: { count: 0, lastActiveISO: null },
      seenIntro: true,
    };
    expect(computeGlobalXp(data)).toBe(300);
  });

  it('is 0 for empty progress', () => {
    expect(computeGlobalXp({ subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: false })).toBe(0);
  });
});
