export type NodeStatus = 'not-started' | 'in-progress' | 'mastered';

export interface NodeProgress {
  status: NodeStatus;
  bestScore: number;
  xpEarned: number;
}

export interface SubjectProgress {
  nodes: Record<string, NodeProgress>;
}

export interface ProgressData {
  subjects: Record<string, SubjectProgress>;
  streak: { count: number; lastActiveISO: string | null };
  seenIntro: boolean;
}
