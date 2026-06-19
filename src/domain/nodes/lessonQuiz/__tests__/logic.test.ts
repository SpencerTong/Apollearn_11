import { describe, it, expect } from 'vitest';
import { scoreQuiz, lessonQuizXp, PASS_THRESHOLD } from '../logic';
import type { QuizQuestion, NodeMeta } from '@/domain/content/types';

const questions: QuizQuestion[] = [
  { id: 'q1', prompt: 'a', choices: ['x', 'y'], answerIndex: 0 },
  { id: 'q2', prompt: 'b', choices: ['x', 'y'], answerIndex: 1 },
];

describe('scoreQuiz', () => {
  it('scores all correct as ratio 1 and passed', () => {
    const r = scoreQuiz(questions, { q1: 0, q2: 1 });
    expect(r).toEqual({ correct: 2, total: 2, ratio: 1, passed: true });
  });
  it('scores half correct as not passed (below 0.8)', () => {
    const r = scoreQuiz(questions, { q1: 0, q2: 0 });
    expect(r.correct).toBe(1);
    expect(r.ratio).toBe(0.5);
    expect(r.passed).toBe(false);
  });
  it('treats missing answers as wrong', () => {
    expect(scoreQuiz(questions, {}).correct).toBe(0);
  });
});

describe('lessonQuizXp', () => {
  const node = { id: 'a', title: 'A', type: 'lesson-quiz', xp: 120, estMinutes: 5 } as NodeMeta;
  it('awards full xp when passed', () => {
    expect(lessonQuizXp(node, 1)).toBe(120);
  });
  it('awards 0 xp when below threshold', () => {
    expect(lessonQuizXp(node, PASS_THRESHOLD - 0.01)).toBe(0);
  });
});
