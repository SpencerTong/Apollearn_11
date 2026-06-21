import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldMap } from '../WorldMap';
import type { Subject } from '@/domain/content/subjects';

const subjects: Subject[] = [
  { id: 'networking', title: 'Networking', icon: '🌐', status: 'available', nodeCount: 3, blurb: 'x' },
  { id: 'finance', title: 'Finance & Markets', icon: '📈', status: 'backlog', nodeCount: 0, blurb: 'y' },
];

describe('WorldMap', () => {
  it('renders an available subject as a link to its tree with progress', () => {
    render(<WorldMap subjects={subjects} masteredBySubject={{ networking: 2 }} />);
    const link = screen.getByRole('link', { name: /Networking/i });
    expect(link).toHaveAttribute('href', '/tree/networking');
    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
  });

  it('renders a backlog subject as dormant, not a link', () => {
    render(<WorldMap subjects={subjects} masteredBySubject={{}} />);
    expect(screen.queryByRole('link', { name: /Finance/i })).not.toBeInTheDocument();
    expect(screen.getByText('Finance & Markets').closest('[data-dormant="true"]')).toBeTruthy();
  });
});
