import type { LoadedTree } from '@/domain/content/types';
import type { SubjectProgress, NodeStatus } from '@/domain/progress/types';

export type NodeUiState = 'locked' | 'available' | 'in-progress' | 'mastered';

export const XP_PER_LEVEL = 300;
const TITLES = ['Novice', 'Apprentice', 'Journeyman', 'Adept', 'Expert', 'Master'];

export function computeNodeStates(tree: LoadedTree, progress: SubjectProgress): Record<string, NodeUiState> {
  const statusOf = (id: string): NodeStatus => progress.nodes[id]?.status ?? 'not-started';
  const result: Record<string, NodeUiState> = {};

  for (const node of tree.nodes) {
    const status = statusOf(node.id);
    if (status === 'mastered') {
      result[node.id] = 'mastered';
    } else if (status === 'in-progress') {
      result[node.id] = 'in-progress';
    } else {
      const unlocked = node.prerequisites.every((p) => statusOf(p) === 'mastered');
      result[node.id] = unlocked ? 'available' : 'locked';
    }
  }
  return result;
}

export function computeSubjectXp(progress: SubjectProgress): number {
  return Object.values(progress.nodes).reduce((sum, n) => sum + n.xpEarned, 0);
}

export function computeLevel(xp: number): { level: number; title: string; xpIntoLevel: number; xpForNext: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = TITLES[Math.min(level - 1, TITLES.length - 1)];
  return { level, title, xpIntoLevel: xp % XP_PER_LEVEL, xpForNext: XP_PER_LEVEL };
}
