import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '../Markdown';

describe('Markdown', () => {
  it('renders headings, lists, and bold', () => {
    render(<Markdown>{`## Title\n\n- one\n- two\n\nSome **bold** text.`}</Markdown>);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });
});
