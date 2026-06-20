import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

export const NODE_COLORS: Record<NodeUiState, string> = {
  mastered: '#f59e0b',
  available: '#818cf8',
  'in-progress': '#a5b4fc',
  locked: '#334155',
};

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  style: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export function buildFlowNodes(
  tree: LoadedTree,
  states: Record<string, NodeUiState>,
): FlowNode[] {
  return tree.nodes.map((n) => {
    const state = states[n.id] ?? 'locked';
    return {
      id: n.id,
      position: n.position,
      data: { label: n.meta.title },
      style: {
        background: NODE_COLORS[state],
        color: state === 'locked' ? '#94a3b8' : '#0b1020',
        border: 'none',
        borderRadius: 14,
        width: 120,
        fontWeight: 600,
      },
    };
  });
}

export function buildFlowEdges(tree: LoadedTree): FlowEdge[] {
  return tree.nodes.flatMap((n) =>
    n.prerequisites.map((p) => ({ id: `${p}->${n.id}`, source: p, target: n.id })),
  );
}
