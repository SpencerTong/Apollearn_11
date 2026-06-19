import type { TreeData } from './types';

export function validateTree(tree: TreeData): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const node of tree.nodes) {
    if (ids.has(node.id)) problems.push(`duplicate node id: ${node.id}`);
    ids.add(node.id);
  }

  for (const node of tree.nodes) {
    for (const pre of node.prerequisites) {
      if (!ids.has(pre)) problems.push(`node "${node.id}" has unknown prerequisite "${pre}"`);
    }
  }

  if (!ids.has(tree.bossNodeId)) problems.push(`boss node "${tree.bossNodeId}" is not in the tree`);

  return problems;
}
