import type { QuizQuestion, NodeMeta } from '@/domain/content/types';

export const PASS_THRESHOLD = 0.8;

export function scoreQuiz(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): { correct: number; total: number; ratio: number; passed: boolean } {
  const total = questions.length;
  const correct = questions.filter((q) => answers[q.id] === q.answerIndex).length;
  const ratio = total === 0 ? 0 : correct / total;
  return { correct, total, ratio, passed: ratio >= PASS_THRESHOLD };
}

export function lessonQuizXp(node: NodeMeta, ratio: number): number {
  return ratio >= PASS_THRESHOLD ? node.xp : 0;
}
