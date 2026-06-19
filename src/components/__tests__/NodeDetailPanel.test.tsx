import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeDetailPanel } from '../NodeDetailPanel';
import type { LoadedNode } from '@/domain/content/types';

const node: LoadedNode = {
  id: 'subnetting', position: { x: 0, y: 0 }, prerequisites: ['ip'],
  meta: { id: 'subnetting', title: 'Subnetting', type: 'lesson-quiz', xp: 120, estMinutes: 8 },
};

describe('NodeDetailPanel', () => {
  it('shows node info and a disabled Start when locked', () => {
    render(<NodeDetailPanel node={node} state="locked" onStart={() => {}} />);
    expect(screen.getByText('Subnetting')).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
  });

  it('enables Start when available and fires onStart', async () => {
    const onStart = vi.fn();
    render(<NodeDetailPanel node={node} state="available" onStart={onStart} />);
    const btn = screen.getByRole('button', { name: /start/i });
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders nothing when no node selected', () => {
    const { container } = render(<NodeDetailPanel node={null} state={undefined} onStart={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
