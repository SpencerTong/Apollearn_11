'use client';
import { useMemo } from 'react';
import type { Subject } from '@/domain/content/subjects';
import { WorldMap } from '@/components/WorldMap';
import { browserStore } from '@/lib/browserStore';
import { computeGlobalXp, computeLevel } from '@/domain/tree/treeState';
import { computeBadges } from '@/domain/progress/badges';
import { Hud } from '@/components/Hud';

export function WorldMapScreen({ subjects }: { subjects: Subject[] }) {
  const masteredBySubject = useMemo(() => {
    const store = browserStore();
    const out: Record<string, number> = {};
    for (const s of subjects) {
      const nodes = store.getSubject(s.id).nodes;
      out[s.id] = Object.values(nodes).filter((n) => n.status === 'mastered').length;
    }
    return out;
  }, [subjects]);

  const hud = useMemo(() => {
    const store = browserStore();
    const data = store.load();
    const nodeCountBySubject = Object.fromEntries(subjects.map((s) => [s.id, s.nodeCount]));
    const xp = computeGlobalXp(data);
    return <Hud level={computeLevel(xp)} xp={xp} streak={data.streak.count} badges={computeBadges(data, nodeCountBySubject)} />;
  }, [subjects]);

  return <WorldMap subjects={subjects} masteredBySubject={masteredBySubject} hud={hud} />;
}
