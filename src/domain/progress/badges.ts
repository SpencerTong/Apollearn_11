import type { ProgressData } from './types';

export interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
}

function masteredCount(data: ProgressData, subject: string): number {
  const nodes = data.subjects[subject]?.nodes ?? {};
  return Object.values(nodes).filter((n) => n.status === 'mastered').length;
}

export function computeBadges(data: ProgressData, nodeCountBySubject: Record<string, number>): Badge[] {
  const subjectIds = Object.keys(data.subjects);
  const totalMastered = subjectIds.reduce((sum, s) => sum + masteredCount(data, s), 0);
  const subjectsWithMastery = subjectIds.filter((s) => masteredCount(data, s) >= 1).length;
  const anyTreeComplete = Object.entries(nodeCountBySubject).some(
    ([s, count]) => count > 0 && masteredCount(data, s) >= count,
  );

  return [
    { id: 'first-steps', label: 'First Steps', icon: '✦', earned: totalMastered >= 1 },
    { id: 'tree-complete', label: 'Tree Complete', icon: '🌳', earned: anyTreeComplete },
    { id: 'streak-7', label: '7-Day Streak', icon: '🔥', earned: data.streak.count >= 7 },
    { id: 'polymath', label: 'Polymath', icon: '🌌', earned: subjectsWithMastery >= 2 },
  ];
}
