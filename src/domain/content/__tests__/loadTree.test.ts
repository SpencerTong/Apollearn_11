import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadTree } from '../loadTree';

const root = path.join(__dirname, '..', '__fixtures__');

describe('loadTree', () => {
  it('loads tree shape and merges node frontmatter', () => {
    const tree = loadTree(root, 'networking');
    expect(tree.title).toBe('Networking');
    expect(tree.nodes).toHaveLength(2);

    const packets = tree.nodes.find((n) => n.id === 'packets')!;
    expect(packets.meta.title).toBe('Packets');
    expect(packets.meta.type).toBe('lesson-quiz');
    expect(packets.meta.xp).toBe(100);
    expect(packets.meta.body?.trim()).toContain('small unit of data');
    expect(packets.meta.questions?.[0].answerIndex).toBe(0);
    expect(packets.prerequisites).toEqual([]);
  });

  it('marks the boss node', () => {
    const tree = loadTree(root, 'networking');
    expect(tree.bossNodeId).toBe('http');
    expect(tree.nodes.find((n) => n.id === 'http')!.meta.isBoss).toBe(true);
  });

  it('throws on malformed frontmatter (missing xp, answerIndex as string)', () => {
    expect(() => loadTree(root, 'malformed')).toThrowError('Invalid node frontmatter');
  });
});
