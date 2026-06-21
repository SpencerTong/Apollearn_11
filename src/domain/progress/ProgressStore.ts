import type { ProgressData, SubjectProgress, NodeStatus } from './types';

export interface KeyValue {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const KEY = 'apollearn11:progress:v1';
const VALID_STATUSES: NodeStatus[] = ['not-started', 'in-progress', 'mastered'];

function empty(): ProgressData {
  return { subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: false };
}

function dayDiff(aISO: string, bISO: string): number {
  const a = Date.parse(aISO + 'T00:00:00Z');
  const b = Date.parse(bISO + 'T00:00:00Z');
  return Math.round((b - a) / 86_400_000);
}

function normalizeNumber(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProgressData(raw: unknown): ProgressData {
  const out = empty();
  if (typeof raw !== 'object' || raw === null) return out;
  const obj = raw as Record<string, unknown>;

  // Normalize subjects
  const subjects = obj.subjects;
  if (typeof subjects === 'object' && subjects !== null) {
    for (const [subjectKey, subjectVal] of Object.entries(subjects as Record<string, unknown>)) {
      const subjectObj = (typeof subjectVal === 'object' && subjectVal !== null)
        ? (subjectVal as Record<string, unknown>)
        : {};
      const nodes = subjectObj.nodes;
      const normalizedNodes: SubjectProgress['nodes'] = {};

      if (typeof nodes === 'object' && nodes !== null) {
        for (const [nodeId, nodeVal] of Object.entries(nodes as Record<string, unknown>)) {
          const nodeObj = (typeof nodeVal === 'object' && nodeVal !== null)
            ? (nodeVal as Record<string, unknown>)
            : {};
          const status: NodeStatus = VALID_STATUSES.includes(nodeObj.status as NodeStatus)
            ? (nodeObj.status as NodeStatus)
            : 'not-started';
          normalizedNodes[nodeId] = {
            status,
            xpEarned: normalizeNumber(nodeObj.xpEarned, 0),
            bestScore: normalizeNumber(nodeObj.bestScore, 0),
          };
        }
      }
      out.subjects[subjectKey] = { nodes: normalizedNodes };
    }
  }

  // Normalize streak
  const streak = obj.streak;
  if (typeof streak === 'object' && streak !== null) {
    const s = streak as Record<string, unknown>;
    out.streak = {
      count: normalizeNumber(s.count, 0),
      lastActiveISO: typeof s.lastActiveISO === 'string' ? s.lastActiveISO : null,
    };
  }

  // Normalize seenIntro
  out.seenIntro = obj.seenIntro === true;

  return out;
}

export class ProgressStore {
  constructor(private storage: KeyValue) {}

  load(): ProgressData {
    const raw = this.storage.getItem(KEY);
    if (!raw) return empty();
    try {
      return normalizeProgressData(JSON.parse(raw));
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
      if (diff < 0) {
        // clock rollback or out-of-order date — ignore, do not touch count or lastActiveISO
      } else if (diff === 0) {
        // same day, no change to count
      } else if (diff === 1) {
        data.streak = { count: data.streak.count + 1, lastActiveISO: opts.todayISO };
      } else {
        // gap > 1 day: reset streak to 1
        data.streak = { count: 1, lastActiveISO: opts.todayISO };
      }
    }

    this.save(data);
  }

  hasSeenIntro(): boolean {
    return this.load().seenIntro === true;
  }

  markIntroSeen(): void {
    const data = this.load();
    data.seenIntro = true;
    this.save(data);
  }
}
