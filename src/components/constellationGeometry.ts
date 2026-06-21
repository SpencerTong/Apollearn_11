import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

export interface Bounds { minX: number; minY: number; width: number; height: number }

export function computeBounds(tree: LoadedTree, pad = 60): Bounds {
  const xs = tree.nodes.map((n) => n.position.x);
  const ys = tree.nodes.map((n) => n.position.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(1, Math.max(...xs) - Math.min(...xs) + pad * 2);
  const height = Math.max(1, Math.max(...ys) - Math.min(...ys) + pad * 2);
  return { minX, minY, width, height };
}

export function nodePercent(pos: { x: number; y: number }, b: Bounds): { left: number; top: number } {
  return { left: ((pos.x - b.minX) / b.width) * 100, top: ((pos.y - b.minY) / b.height) * 100 };
}

export function edgePathD(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

export type EdgeVisual = 'traveled' | 'open' | 'locked';

export function edgeVisual(fromState: NodeUiState, toState: NodeUiState): EdgeVisual {
  if (fromState === 'mastered' && toState === 'mastered') return 'traveled';
  if (toState === 'available' || toState === 'in-progress' || toState === 'mastered') return 'open';
  return 'locked';
}

export const EDGE_COLORS: Record<EdgeVisual, string> = { traveled: '#f59e0b', open: '#818cf8', locked: '#2a3160' };

export const NODE_COLORS: Record<NodeUiState, string> = {
  mastered: '#f59e0b',
  available: '#818cf8',
  'in-progress': '#a5b4fc',
  locked: '#334155',
};
