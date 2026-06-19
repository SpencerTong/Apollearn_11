import { describe, it, expect } from 'vitest';
import { validateTree } from '../validateTree';
import type { TreeData } from '../types';

const valid: TreeData = {
  subject: 'networking',
  title: 'Networking',
  bossNodeId: 'http',
  nodes: [
    { id: 'packets', position: { x: 0, y: 0 }, prerequisites: [] },
    { id: 'http', position: { x: 0, y: 100 }, prerequisites: ['packets'] },
  ],
};

describe('validateTree', () => {
  it('returns no problems for a valid tree', () => {
    expect(validateTree(valid)).toEqual([]);
  });

  it('flags duplicate node ids', () => {
    const t = { ...valid, nodes: [...valid.nodes, valid.nodes[0]] };
    expect(validateTree(t).some((p) => p.includes('duplicate'))).toBe(true);
  });

  it('flags a prerequisite that does not exist', () => {
    const t: TreeData = { ...valid, nodes: [{ id: 'a', position: { x: 0, y: 0 }, prerequisites: ['ghost'] }], bossNodeId: 'a' };
    expect(validateTree(t).some((p) => p.includes('ghost'))).toBe(true);
  });

  it('flags a bossNodeId that does not exist', () => {
    const t = { ...valid, bossNodeId: 'nope' };
    expect(validateTree(t).some((p) => p.includes('boss'))).toBe(true);
  });
});
