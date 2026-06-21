import { describe, it, expect } from 'vitest';
import { computeBounds, nodePercent, edgePathD, edgeVisual, EDGE_COLORS, NODE_COLORS } from '../constellationGeometry';
import type { LoadedTree } from '@/domain/content/types';

const tree: LoadedTree = {
  subject: 'networking', title: 'Networking', bossNodeId: 'c',
  nodes: [
    { id: 'a', position: { x: 100, y: 300 }, prerequisites: [], meta: { id: 'a', title: 'A', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'b', position: { x: 100, y: 200 }, prerequisites: ['a'], meta: { id: 'b', title: 'B', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'c', position: { x: 100, y: 100 }, prerequisites: ['b'], meta: { id: 'c', title: 'C', type: 'lesson-quiz', xp: 200, estMinutes: 5, isBoss: true } },
  ],
};

describe('computeBounds', () => {
  it('bounds cover all nodes plus padding', () => {
    const b = computeBounds(tree, 50);
    expect(b.minX).toBe(50);          // 100 - 50
    expect(b.minY).toBe(50);          // 100 - 50
    expect(b.width).toBe(100);        // (100..100)=0 width +2*50
    expect(b.height).toBe(300);       // (100..300)=200 +2*50
  });
});

describe('nodePercent', () => {
  it('maps a position to 0-100 percentages within bounds', () => {
    const b = computeBounds(tree, 50);
    const p = nodePercent({ x: 100, y: 300 }, b);
    expect(p.left).toBeCloseTo(50);   // (100-50)/100*100
    expect(p.top).toBeCloseTo((300 - 50) / 300 * 100);
  });
});

describe('edgePathD', () => {
  it('starts at the source and ends at the target with a cubic curve', () => {
    const d = edgePathD({ x: 100, y: 300 }, { x: 100, y: 200 });
    expect(d.startsWith('M 100 300')).toBe(true);
    expect(d).toContain('C');
    expect(d.trim().endsWith('100 200')).toBe(true);
  });
});

describe('edgeVisual', () => {
  it('both mastered -> traveled', () => {
    expect(edgeVisual('mastered', 'mastered')).toBe('traveled');
  });
  it('reachable target -> open', () => {
    expect(edgeVisual('mastered', 'available')).toBe('open');
  });
  it('locked target -> locked', () => {
    expect(edgeVisual('available', 'locked')).toBe('locked');
  });
  it('color maps cover all states', () => {
    expect(EDGE_COLORS.traveled).toBe('#f59e0b');
    expect(NODE_COLORS.mastered).toBe('#f59e0b');
    expect(NODE_COLORS.locked).toBe('#334155');
  });
});
