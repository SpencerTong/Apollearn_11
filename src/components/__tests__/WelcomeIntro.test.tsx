import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeIntro } from '../WelcomeIntro';

describe('WelcomeIntro', () => {
  it('shows the loop and fires onDismiss on Start', async () => {
    const onDismiss = vi.fn();
    render(<WelcomeIntro onDismiss={onDismiss} />);
    expect(screen.getByText(/welcome to apollearn/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
