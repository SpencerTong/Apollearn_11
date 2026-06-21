import { ProgressStore } from '@/domain/progress/ProgressStore';

export function browserStore(): ProgressStore {
  const storage =
    typeof window !== 'undefined'
      ? window.localStorage
      : { getItem: () => null, setItem: () => {} };
  return new ProgressStore(storage);
}
