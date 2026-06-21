'use client';
import { useMemo } from 'react';
import type { Subject } from '@/domain/content/subjects';
import { WorldMap } from '@/components/WorldMap';
import { browserStore } from '@/lib/browserStore';

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

  return <WorldMap subjects={subjects} masteredBySubject={masteredBySubject} />;
}
