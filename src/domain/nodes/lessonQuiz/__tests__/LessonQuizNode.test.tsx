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
  it('shows the explainer and question', () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} />);
    expect(screen.getByText(/unit of data/i)).toBeInTheDocument();
    expect(screen.getByText(/What is a packet/i)).toBeInTheDocument();
  });

  it('calls onComplete with passing result when answered correctly', async () => {
    const onComplete = vi.fn();
    render(<LessonQuizNode node={node} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /Data unit/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1, passed: true, xp: 100 });
  });
});
