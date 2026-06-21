import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadSubjects } from '../subjects';

const root = path.join(__dirname, '..', '__fixtures__');

describe('loadSubjects', () => {
  it('loads typed subjects from the registry', () => {
    const subjects = loadSubjects(root);
    expect(subjects).toHaveLength(2);
    expect(subjects[0]).toMatchObject({ id: 'networking', status: 'available', nodeCount: 3 });
    expect(subjects[1].status).toBe('backlog');
  });

  it('throws on an invalid status', () => {
    expect(() => loadSubjects(path.join(__dirname, '..', '__fixtures__', 'does-not-exist'))).toThrow();
  });
});
