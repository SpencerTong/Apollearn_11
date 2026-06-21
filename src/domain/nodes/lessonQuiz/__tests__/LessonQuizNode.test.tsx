import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonQuizNode } from '../LessonQuizNode';
import type { NodeMeta } from '@/domain/content/types';

const node: NodeMeta = {
  id: 'packets', title: 'Packets', type: 'lesson-quiz', xp: 100, estMinutes: 5,
  body: 'A packet is a unit of data.',
  questions: [{ id: 'q1', prompt: 'What is a packet?', choices: ['Data unit', 'A cable'], answerIndex: 0 }],
};

describe('LessonQuizNode', () => {
  it('starts on the Learn phase showing the body, not the questions', () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} />);
    expect(screen.getByText(/unit of data/i)).toBeInTheDocument();
    expect(screen.queryByText(/What is a packet/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quiz me/i })).toBeInTheDocument();
  });

  it('advances to the Test phase and completes with a passing result', async () => {
    const onComplete = vi.fn();
    render(<LessonQuizNode node={node} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /quiz me/i }));
    expect(screen.getByText(/What is a packet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Data unit/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1, passed: true, xp: 100 });
  });

  it('shows per-answer feedback and an XP float after submitting a pass, then continues', async () => {
    const onComplete = vi.fn();
    render(<LessonQuizNode node={node} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /quiz me/i }));
    await userEvent.click(screen.getByRole('button', { name: /Data unit/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    // feedback shown, onComplete NOT called yet
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByTestId('xp-float')).toHaveTextContent('100');
    // the correct choice is marked
    expect(screen.getByRole('button', { name: /Data unit/i })).toHaveAttribute('data-correct', 'true');
    // continue fires onComplete
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1, passed: true, xp: 100 });
  });

  it('offers Skip to quiz when reviewing a mastered node', async () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} isReview />);
    await userEvent.click(screen.getByRole('button', { name: /skip to quiz/i }));
    expect(screen.getByText(/What is a packet/i)).toBeInTheDocument();
  });

  it('does NOT offer Skip to quiz for a non-review node', () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} />);
    expect(screen.queryByRole('button', { name: /skip to quiz/i })).not.toBeInTheDocument();
  });
});
