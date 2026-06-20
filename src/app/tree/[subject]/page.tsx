import path from 'node:path';
import { loadTree } from '@/domain/content/loadTree';
import { TreeScreen } from './TreeScreen';

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const tree = loadTree(path.join(process.cwd(), 'content'), subject);
  const todayISO = new Date().toISOString().slice(0, 10);
  return <TreeScreen tree={tree} todayISO={todayISO} />;
}
