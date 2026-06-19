import type { NodeTypeId } from '@/domain/content/types';
import type { NodeTypeDefinition, NodeRuntimeState } from './types';
import { LessonQuizNode } from './lessonQuiz/LessonQuizNode';
import { scoreQuiz, lessonQuizXp } from './lessonQuiz/logic';

const lessonQuiz: NodeTypeDefinition = {
  id: 'lesson-quiz',
  isComplete: (node, state: NodeRuntimeState) => scoreQuiz(node.questions ?? [], state.answers).passed,
  xpAwarded: (node, state: NodeRuntimeState) => lessonQuizXp(node, scoreQuiz(node.questions ?? [], state.answers).ratio),
  Component: LessonQuizNode,
};

export const registry: Partial<Record<NodeTypeId, NodeTypeDefinition>> = {
  'lesson-quiz': lessonQuiz,
};

export function getNodeType(id: NodeTypeId): NodeTypeDefinition {
  const def = registry[id];
  if (!def) throw new Error(`No node type registered for "${id}"`);
  return def;
}
