import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldMapScreen } from '../WorldMapScreen';
import type { Subject } from '@/domain/content/subjects';

const subjects: Subject[] = [
  { id: 'networking', title: 'Networking', icon: '🌐', status: 'available', nodeCount: 3, blurb: 'x' },
];

beforeEach(() => localStorage.clear());

describe('WorldMapScreen', () => {
  it('shows 0 mastered with no progress and reflects stored progress', () => {
    render(<WorldMapScreen subjects={subjects} />);
    expect(screen.getByText(/0 \/ 3/)).toBeInTheDocument();
  });

  it('counts mastered nodes from ProgressStore', () => {
    localStorage.setItem(
      'apollearn11:progress:v1',
      JSON.stringify({ subjects: { networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } } }, streak: { count: 0, lastActiveISO: null }, seenIntro: true }),
    );
    render(<WorldMapScreen subjects={subjects} />);
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
  });
});
