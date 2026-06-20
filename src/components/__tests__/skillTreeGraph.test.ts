import { describe, it, expect } from 'vitest';
import { NODE_COLORS, buildFlowNodes, buildFlowEdges } from '../skillTreeGraph';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

const baseMeta = {
  id: 'packets',
  title: 'Packets',
  type: 'lesson-quiz' as const,
  xp: 100,
  estMinutes: 6,
};

const mockTree: LoadedTree = {
  subject: 'networking',
  title: 'Networking',
  bossNodeId: 'http',
  nodes: [
    {
      id: 'packets',
      position: { x: 0, y: 0 },
      prerequisites: [],
      meta: { ...baseMeta },
    },
    {
      id: 'http',
      position: { x: 0, y: 120 },
      prerequisites: ['packets'],
      meta: { ...baseMeta, id: 'http', title: 'HTTP', xp: 200, isBoss: true },
    },
  ],
};

describe('buildFlowNodes', () => {
  it('mastered node gets the gold color', () => {
    const states: Record<string, NodeUiState> = { packets: 'mastered', http: 'locked' };
    const nodes = buildFlowNodes(mockTree, states);
    const packets = nodes.find((n) => n.id === 'packets')!;
    expect(packets.style.background).toBe(NODE_COLORS.mastered);
    expect(packets.style.background).toBe('#f59e0b');
  });

  it('locked node gets the dim color', () => {
    const states: Record<string, NodeUiState> = { packets: 'locked', http: 'locked' };
    const nodes = buildFlowNodes(mockTree, states);
    const http = nodes.find((n) => n.id === 'http')!;
    expect(http.style.background).toBe(NODE_COLORS.locked);
    expect(http.style.background).toBe('#334155');
  });

  it('missing/unknown state falls back to locked color', () => {
    // No state provided — states is empty
    const nodes = buildFlowNodes(mockTree, {});
    for (const node of nodes) {
      expect(node.style.background).toBe(NODE_COLORS.locked);
    }
  });

  it('node data includes correct label', () => {
    const states: Record<string, NodeUiState> = { packets: 'available', http: 'locked' };
    const nodes = buildFlowNodes(mockTree, states);
    const packets = nodes.find((n) => n.id === 'packets')!;
    expect(packets.data.label).toBe('Packets');
  });
});

describe('buildFlowEdges', () => {
  it('builds edges with source=prereq and target=node', () => {
    const edges = buildFlowEdges(mockTree);
    // Only http has a prerequisite (packets)
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('packets');
    expect(edges[0].target).toBe('http');
    expect(edges[0].id).toBe('packets->http');
  });

  it('node with no prerequisites produces no edges', () => {
    const edges = buildFlowEdges(mockTree);
    const packetsEdges = edges.filter((e) => e.target === 'packets');
    expect(packetsEdges).toHaveLength(0);
  });
});
