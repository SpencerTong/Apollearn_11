import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { TreeData, NodeMeta, LoadedTree, LoadedNode } from './types';
import { validateTree } from './validateTree';

export function loadTree(contentRoot: string, subject: string): LoadedTree {
  const dir = path.join(contentRoot, subject);
  const tree = JSON.parse(fs.readFileSync(path.join(dir, 'tree.json'), 'utf8')) as TreeData;

  const problems = validateTree(tree);
  if (problems.length) {
    throw new Error(`Invalid tree "${subject}":\n- ${problems.join('\n- ')}`);
  }

  const nodes: LoadedNode[] = tree.nodes.map((node) => {
    const file = path.join(dir, 'nodes', `${node.id}.mdx`);
    const parsed = matter(fs.readFileSync(file, 'utf8'));
    const meta = { ...(parsed.data as Omit<NodeMeta, 'body'>), body: parsed.content } as NodeMeta;
    return { ...node, meta };
  });

  return { subject: tree.subject, title: tree.title, bossNodeId: tree.bossNodeId, nodes };
}
