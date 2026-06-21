import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreeScreen } from '../[subject]/TreeScreen';
import type { LoadedTree } from '@/domain/content/types';

const tree: LoadedTree = {
  subject: 'networking', title: 'Networking', bossNodeId: 'b',
  nodes: [
    { id: 'a', position: { x: 0, y: 100 }, prerequisites: [], meta: { id: 'a', title: 'A', type: 'lesson-quiz', xp: 100, estMinutes: 5, body: 'About A', questions: [{ id: 'q1', prompt: 'pick x', choices: ['x', 'y'], answerIndex: 0 }] } },
    { id: 'b', position: { x: 0, y: 0 }, prerequisites: ['a'], meta: { id: 'b', title: 'B', type: 'lesson-quiz', xp: 100, estMinutes: 5, isBoss: true, questions: [{ id: 'q1', prompt: 'pick x', choices: ['x', 'y'], answerIndex: 0 }] } },
  ],
};

beforeEach(() => localStorage.clear());

describe('TreeScreen', () => {
  it('completing node A awards XP and unlocks B', async () => {
    render(<TreeScreen tree={tree} todayISO="2026-06-19" nodeCountBySubject={{ networking: 2 }} />);
    // dismiss the welcome intro overlay (shown on first render because localStorage is cleared)
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));
    // open A via the Constellation node button
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    // advance through the Learn phase to the Test phase
    await userEvent.click(screen.getByRole('button', { name: /quiz me/i }));
    // answer + submit in the modal
    await userEvent.click(screen.getByRole('button', { name: /^x$/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    // XP reflected in the header (scoped to avoid matching the open detail panel)
    const header = screen.getByRole('banner');
    expect(await within(header).findByText(/100 XP/i)).toBeInTheDocument();
    // B is now unlocked — click B and verify its Start button is enabled
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getByRole('button', { name: /start|review/i })).toBeEnabled();
  });

  it('modal resets to Learn phase on re-open after completion', async () => {
    render(<TreeScreen tree={tree} todayISO="2026-06-19" nodeCountBySubject={{ networking: 2 }} />);
    // dismiss intro
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));
    // open A and complete it
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    await userEvent.click(screen.getByRole('button', { name: /quiz me/i }));
    await userEvent.click(screen.getByRole('button', { name: /^x$/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    // wait for modal to close
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
    // re-open node A (now mastered) via the node list button
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: /start|review/i }));
    // should be back on the Learn phase: at least one of the learn-phase controls is visible
    // (mastered review shows both "Got it — quiz me ▸" and "Skip to quiz")
    const learnPhaseButtons = screen.getAllByRole('button', { name: /quiz me|skip to quiz/i });
    expect(learnPhaseButtons.length).toBeGreaterThan(0);
    // question prompt should NOT yet be shown
    expect(screen.queryByText(/pick x/i)).not.toBeInTheDocument();
  });
});
