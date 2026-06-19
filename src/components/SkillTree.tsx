'use client';
import { ReactFlow, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

const COLORS: Record<NodeUiState, string> = {
  mastered: '#f59e0b',
  available: '#818cf8',
  'in-progress': '#a5b4fc',
  locked: '#334155',
};

export function SkillTree({
  tree,
  states,
  onSelect,
}: {
  tree: LoadedTree;
  states: Record<string, NodeUiState>;
  onSelect: (nodeId: string) => void;
}) {
  const nodes: Node[] = tree.nodes.map((n) => ({
    id: n.id,
    position: n.position,
    data: { label: n.meta.title },
    style: {
      background: COLORS[states[n.id] ?? 'locked'],
      color: states[n.id] === 'locked' ? '#94a3b8' : '#0b1020',
      border: 'none',
      borderRadius: 14,
      width: 120,
      fontWeight: 600,
    },
  }));

  const edges: Edge[] = tree.nodes.flatMap((n) =>
    n.prerequisites.map((p) => ({ id: `${p}->${n.id}`, source: p, target: n.id })),
  );

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_70%_90%,#15193a,#080a18_70%)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => onSelect(node.id)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={24} />
      </ReactFlow>
    </div>
  );
}
