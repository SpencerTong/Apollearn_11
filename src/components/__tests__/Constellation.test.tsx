import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Constellation } from '../Constellation';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

const tree: LoadedTree = {
  subject: 'networking', title: 'Networking', bossNodeId: 'c',
  nodes: [
    { id: 'a', position: { x: 100, y: 300 }, prerequisites: [], meta: { id: 'a', title: 'Packets', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'b', position: { x: 100, y: 200 }, prerequisites: ['a'], meta: { id: 'b', title: 'IP', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'c', position: { x: 100, y: 100 }, prerequisites: ['b'], meta: { id: 'c', title: 'Subnetting', type: 'lesson-quiz', xp: 200, estMinutes: 5, isBoss: true } },
  ],
};
const states: Record<string, NodeUiState> = { a: 'mastered', b: 'available', c: 'locked' };

describe('Constellation', () => {
  it('renders a button per node with its state', () => {
    render(<Constellation tree={tree} states={states} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Packets' })).toHaveAttribute('data-state', 'mastered');
    expect(screen.getByRole('button', { name: 'IP' })).toHaveAttribute('data-state', 'available');
    expect(screen.getByRole('button', { name: 'Subnetting' })).toHaveAttribute('data-boss', 'true');
  });

  it('locked nodes are disabled and available nodes fire onSelect', async () => {
    const onSelect = vi.fn();
    render(<Constellation tree={tree} states={states} selectedId={null} onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Subnetting' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'IP' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
