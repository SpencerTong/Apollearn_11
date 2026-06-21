import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hud } from '../Hud';
import type { Badge } from '@/domain/progress/badges';

const badges: Badge[] = [
  { id: 'first-steps', label: 'First Steps', icon: '✦', earned: true },
  { id: 'streak-7', label: '7-Day Streak', icon: '🔥', earned: false },
];

describe('Hud', () => {
  it('shows level, xp, streak, and badges', () => {
    render(<Hud level={{ level: 3, title: 'Journeyman' }} xp={620} streak={5} badges={badges} />);
    expect(screen.getByText(/Journeyman/)).toBeInTheDocument();
    expect(screen.getByText(/Lv 3/)).toBeInTheDocument();
    expect(screen.getByText(/620/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByTitle('First Steps')).toBeInTheDocument();
  });
});
