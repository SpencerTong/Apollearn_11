'use client';
import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';
import { buildFlowNodes, buildFlowEdges } from './skillTreeGraph';

export function SkillTree({
  tree,
  states,
  onSelect,
}: {
  tree: LoadedTree;
  states: Record<string, NodeUiState>;
  onSelect: (nodeId: string) => void;
}) {
  const nodes = buildFlowNodes(tree, states);
  const edges = buildFlowEdges(tree);

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_70%_90%,#15193a,#080a18_70%)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => onSelect(node.id)}
        fitView
      >
        <Background color="#1e293b" gap={24} />
      </ReactFlow>
    </div>
  );
}
