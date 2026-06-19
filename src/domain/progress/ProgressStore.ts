import type { ProgressData, SubjectProgress } from './types';

export interface KeyValue {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const KEY = 'apollearn11:progress:v1';

function empty(): ProgressData {
  return { subjects: {}, streak: { count: 0, lastActiveISO: null } };
}

function dayDiff(aISO: string, bISO: string): number {
  const a = Date.parse(aISO + 'T00:00:00Z');
  const b = Date.parse(bISO + 'T00:00:00Z');
  return Math.round((b - a) / 86_400_000);
}

export class ProgressStore {
  constructor(private storage: KeyValue) {}

  load(): ProgressData {
    const raw = this.storage.getItem(KEY);
    if (!raw) return empty();
    try {
      return { ...empty(), ...(JSON.parse(raw) as ProgressData) };
    } catch {
      return empty();
    }
  }

  private save(data: ProgressData): void {
    this.storage.setItem(KEY, JSON.stringify(data));
  }

  getSubject(subject: string): SubjectProgress {
    return this.load().subjects[subject] ?? { nodes: {} };
  }

  getStreak(): { count: number; lastActiveISO: string | null } {
    return this.load().streak;
  }

  recordCompletion(
    subject: string,
    nodeId: string,
    opts: { score: number; xp: number; passed: boolean; todayISO: string },
  ): void {
    const data = this.load();
    const sub = data.subjects[subject] ?? { nodes: {} };
    const prev = sub.nodes[nodeId] ?? { status: 'not-started', bestScore: 0, xpEarned: 0 };

    const mastered = prev.status === 'mastered' || opts.passed;
    sub.nodes[nodeId] = {
      status: mastered ? 'mastered' : 'in-progress',
      bestScore: Math.max(prev.bestScore, opts.score),
      xpEarned: Math.max(prev.xpEarned, opts.passed ? opts.xp : 0),
    };
    data.subjects[subject] = sub;

    // streak
    const last = data.streak.lastActiveISO;
    if (last === null) {
      data.streak = { count: 1, lastActiveISO: opts.todayISO };
    } else {
      const diff = dayDiff(last, opts.todayISO);
      if (diff === 0) {
        // same day, no change to count
      } else if (diff === 1) {
        data.streak = { count: data.streak.count + 1, lastActiveISO: opts.todayISO };
      } else {
        data.streak = { count: 1, lastActiveISO: opts.todayISO };
      }
    }

    this.save(data);
  }
}
