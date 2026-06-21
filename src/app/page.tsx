import path from 'node:path';
import { loadSubjects } from '@/domain/content/subjects';
import { WorldMapScreen } from './WorldMapScreen';

export default function Home() {
  const subjects = loadSubjects(path.join(process.cwd(), 'content'));
  return <WorldMapScreen subjects={subjects} />;
}
