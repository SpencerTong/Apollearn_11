import { describe, it, expect, beforeEach } from 'vitest';
import { browserStore } from '../browserStore';

beforeEach(() => localStorage.clear());

describe('browserStore', () => {
  it('returns a ProgressStore backed by localStorage', () => {
    const store = browserStore();
    store.markIntroSeen();
    expect(browserStore().hasSeenIntro()).toBe(true);
  });
});
