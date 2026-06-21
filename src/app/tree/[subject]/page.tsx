import path from 'node:path';
import { loadTree } from '@/domain/content/loadTree';
import { loadSubjects } from '@/domain/content/subjects';
import { TreeScreen } from './TreeScreen';

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const tree = loadTree(path.join(process.cwd(), 'content'), subject);
  const todayISO = new Date().toISOString().slice(0, 10);
  const subjects = loadSubjects(path.join(process.cwd(), 'content'));
  const nodeCountBySubject = Object.fromEntries(subjects.map((s) => [s.id, s.nodeCount]));
  return <TreeScreen tree={tree} todayISO={todayISO} nodeCountBySubject={nodeCountBySubject} />;
}
