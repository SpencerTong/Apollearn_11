import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressStore, type KeyValue } from '../ProgressStore';

function memStorage(): KeyValue {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe('ProgressStore', () => {
  let store: ProgressStore;
  beforeEach(() => {
    store = new ProgressStore(memStorage());
  });

  it('starts empty', () => {
    expect(store.getSubject('networking').nodes).toEqual({});
    expect(store.getStreak().count).toBe(0);
  });

  it('records a passing completion as mastered with xp', () => {
    store.recordCompletion('networking', 'packets', { score: 1, xp: 100, passed: true, todayISO: '2026-06-19' });
    const sub = store.getSubject('networking');
    expect(sub.nodes.packets.status).toBe('mastered');
    expect(sub.nodes.packets.xpEarned).toBe(100);
    expect(sub.nodes.packets.bestScore).toBe(1);
  });

  it('records a failing attempt as in-progress with no xp', () => {
    store.recordCompletion('networking', 'packets', { score: 0.5, xp: 0, passed: false, todayISO: '2026-06-19' });
    expect(store.getSubject('networking').nodes.packets.status).toBe('in-progress');
    expect(store.getSubject('networking').nodes.packets.xpEarned).toBe(0);
  });

  it('does not downgrade a mastered node or lower bestScore', () => {
    store.recordCompletion('networking', 'packets', { score: 1, xp: 100, passed: true, todayISO: '2026-06-19' });
    store.recordCompletion('networking', 'packets', { score: 0.5, xp: 0, passed: false, todayISO: '2026-06-19' });
    const n = store.getSubject('networking').nodes.packets;
    expect(n.status).toBe('mastered');
    expect(n.bestScore).toBe(1);
    expect(n.xpEarned).toBe(100);
  });

  it('increments streak on a new day and resets after a gap', () => {
    store.recordCompletion('networking', 'a', { score: 1, xp: 10, passed: true, todayISO: '2026-06-18' });
    expect(store.getStreak().count).toBe(1);
    store.recordCompletion('networking', 'b', { score: 1, xp: 10, passed: true, todayISO: '2026-06-19' });
    expect(store.getStreak().count).toBe(2);
    store.recordCompletion('networking', 'c', { score: 1, xp: 10, passed: true, todayISO: '2026-06-25' });
    expect(store.getStreak().count).toBe(1);
  });

  it('persists across instances sharing storage', () => {
    const shared = memStorage();
    new ProgressStore(shared).recordCompletion('networking', 'packets', { score: 1, xp: 100, passed: true, todayISO: '2026-06-19' });
    expect(new ProgressStore(shared).getSubject('networking').nodes.packets.status).toBe('mastered');
  });

  it('normalizes a corrupt blob: invalid status → not-started, missing xpEarned → 0, missing streak → 0', () => {
    const storage = memStorage();
    storage.setItem(
      'apollearn11:progress:v1',
      JSON.stringify({ subjects: { net: { nodes: { a: { status: 'weird' } } } }, streak: {} }),
    );
    const s = new ProgressStore(storage);
    const node = s.getSubject('net').nodes.a;
    expect(node.status).toBe('not-started');
    expect(node.xpEarned).toBe(0);
    expect(typeof node.xpEarned).toBe('number');
    expect(s.getStreak().count).toBe(0);
  });

  it('ignores clock rollback (todayISO earlier than lastActiveISO)', () => {
    store.recordCompletion('networking', 'a', { score: 1, xp: 10, passed: true, todayISO: '2026-06-19' });
    expect(store.getStreak().count).toBe(1);
    expect(store.getStreak().lastActiveISO).toBe('2026-06-19');
    // Rollback date — should be ignored
    store.recordCompletion('networking', 'b', { score: 1, xp: 10, passed: true, todayISO: '2026-06-17' });
    expect(store.getStreak().count).toBe(1);
    expect(store.getStreak().lastActiveISO).toBe('2026-06-19');
  });
});
