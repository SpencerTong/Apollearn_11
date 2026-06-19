export type NodeTypeId = 'lesson-quiz' | 'interactive' | 'flashcards' | 'ai-tutor';

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
}

export interface NodeMeta {
  id: string;
  title: string;
  type: NodeTypeId;
  xp: number;
  estMinutes: number;
  isBoss?: boolean;
  body?: string;
  questions?: QuizQuestion[];
}

export interface TreeNode {
  id: string;
  position: { x: number; y: number };
  prerequisites: string[];
}

export interface TreeData {
  subject: string;
  title: string;
  bossNodeId: string;
  nodes: TreeNode[];
}

export type LoadedNode = TreeNode & { meta: NodeMeta };

export interface LoadedTree {
  subject: string;
  title: string;
  bossNodeId: string;
  nodes: LoadedNode[];
}
