import fs from 'node:fs';
import path from 'node:path';

export interface Subject {
  id: string;
  title: string;
  icon: string;
  status: 'available' | 'backlog';
  nodeCount: number;
  blurb: string;
}

export function loadSubjects(contentRoot: string): Subject[] {
  const raw = fs.readFileSync(path.join(contentRoot, 'subjects.json'), 'utf8');
  const data = JSON.parse(raw) as Subject[];
  for (const s of data) {
    if (!s.id || !s.title || (s.status !== 'available' && s.status !== 'backlog')) {
      throw new Error(`Invalid subject record: ${JSON.stringify(s)}`);
    }
  }
  return data;
}
