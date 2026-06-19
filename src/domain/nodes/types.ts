import type { ComponentType } from 'react';
import type { NodeMeta, NodeTypeId } from '@/domain/content/types';

export interface NodeRuntimeState {
  answers: Record<string, number>;
  submitted: boolean;
}

export interface NodeViewProps {
  node: NodeMeta;
  onComplete: (result: { score: number; passed: boolean; xp: number }) => void;
}

export interface NodeTypeDefinition {
  id: NodeTypeId;
  isComplete(node: NodeMeta, state: NodeRuntimeState): boolean;
  xpAwarded(node: NodeMeta, state: NodeRuntimeState): number;
  Component: ComponentType<NodeViewProps>;
}
