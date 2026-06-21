'use client';
import { useState } from 'react';
import type { NodeViewProps } from '@/domain/nodes/types';
import { scoreQuiz, lessonQuizXp } from './logic';
import { Markdown } from '@/components/Markdown';

export function LessonQuizNode({ node, onComplete, isReview }: NodeViewProps) {
  const questions = node.questions ?? [];
  const [phase, setPhase] = useState<'learn' | 'test'>('learn');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  function submit() {
    const result = scoreQuiz(questions, answers);
    onComplete({ score: result.ratio, passed: result.passed, xp: lessonQuizXp(node, result.ratio) });
  }

  if (phase === 'learn') {
    return (
      <div className="space-y-5">
        {node.body && <Markdown>{node.body}</Markdown>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPhase('test')}
            className="rounded-xl bg-amber-400 px-5 py-2 font-bold text-amber-950"
          >
            Got it — quiz me ▸
          </button>
          {isReview && (
            <button type="button" onClick={() => setPhase('test')} className="text-sm text-slate-400 underline">
              Skip to quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <fieldset key={q.id} className="space-y-2">
          <legend className="font-medium text-slate-100">{q.prompt}</legend>
          {q.choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={answers[q.id] === i}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
              className={`block w-full rounded-lg border px-4 py-2 text-left ${
                answers[q.id] === i ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-700'
              }`}
            >
              {choice}
            </button>
          ))}
        </fieldset>
      ))}
      <button type="button" onClick={submit} className="rounded-xl bg-amber-400 px-5 py-2 font-bold text-amber-950">
        Submit
      </button>
    </div>
  );
}
