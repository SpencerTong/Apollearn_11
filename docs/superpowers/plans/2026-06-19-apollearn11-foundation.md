# Apollearn 11 — Plan 1: Foundation, Content Engine & Playable Tree

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Apollearn 11 web app and build a playable Networking skill tree where completing a lesson-quiz node earns XP, raises the tree level, and unlocks neighbors.

**Architecture:** Next.js (App Router) single-player web app. Pure, framework-free domain logic (content schema, progression engine, quiz scoring, progress store) is built and tested first; React/React Flow UI is layered on top. Content lives as files on disk; progress lives in browser local storage behind one swappable module.

**Tech Stack:** Next.js + TypeScript, Tailwind CSS, shadcn/ui, `@xyflow/react` (React Flow) for the tree graph, Vitest + @testing-library/react + jsdom for tests, npm as the package manager.

## Global Constraints

- **Package manager:** npm (the spec's authoring CLI is `npm run author`).
- **Language:** TypeScript everywhere; `strict` mode on.
- **Domain logic is framework-free:** anything under `src/domain/**` must not import React, Next, or browser globals — so it is unit-testable in isolation.
- **Persistence seam:** all reads/writes of progress go through `ProgressStore` (`src/domain/progress/ProgressStore.ts`). No component touches `localStorage` directly.
- **Node-type contract:** every node type implements `isComplete()` and `xpAwarded()` and exposes a `Component`. The tree/XP machinery never special-cases a type.
- **Visual direction (for later UI tasks):** elegant "cosmos" — deep space background, indigo + gold accents. Node states: `mastered` = gold, `available` = glowing indigo, `locked` = dim.
- **TDD:** every logic change starts with a failing test. Commit after each task.

---

## File Structure

```
apollearn-11/
  package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, vitest.config.ts, vitest.setup.ts
  src/
    app/
      layout.tsx                      # root layout, global styles
      page.tsx                        # temporary redirect to /tree/networking
      tree/[subject]/page.tsx         # the skill tree screen (Task 9)
    domain/
      content/
        types.ts                      # TreeData, NodeMeta, LoadedTree, etc. (Task 2)
        validateTree.ts               # structural validation (Task 2)
        loadTree.ts                   # read tree.json + node files from disk (Task 3)
      progress/
        types.ts                      # ProgressData, NodeProgress (Task 4)
        ProgressStore.ts              # localStorage-backed store w/ injectable storage (Task 4)
      tree/
        treeState.ts                  # node UI states, XP, level/title (Task 5)
      nodes/
        types.ts                      # NodeTypeDefinition, NodeViewProps (Task 6)
        registry.ts                   # id -> NodeTypeDefinition (Task 6)
        lessonQuiz/
          logic.ts                    # scoreQuiz, xp (Task 6)
          LessonQuizNode.tsx          # quiz UI (Task 7)
    components/
      SkillTree.tsx                   # React Flow constellation (Task 8)
      NodeDetailPanel.tsx             # right-side detail panel (Task 8)
  content/
    networking/
      tree.json                       # (Task 9)
      nodes/
        packets.mdx
        ip-addressing.mdx
        subnetting.mdx
  test fixtures live under src/**/__fixtures__ and src/**/__tests__
```

---

### Task 1: Scaffold project + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`
- Test: `src/domain/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Next.js app and a working `npm test` (Vitest) command that the rest of the plan relies on.

- [ ] **Step 1: Scaffold Next.js app**

Run (in the project folder — rename the folder to `apollearn-11` first if desired):
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack --use-npm
```
Accept defaults if prompted. This creates `src/app`, Tailwind config, and `tsconfig.json`.

- [ ] **Step 2: Add `.superpowers/` to .gitignore**

Append to `.gitignore`:
```
# brainstorming visual companion artifacts
.superpowers/
```

- [ ] **Step 3: Install test tooling**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Add the test script**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Write the smoke test**

Create `src/domain/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('tooling', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 8: Run the smoke test**

Run: `npm test`
Expected: PASS (1 passed).

- [ ] **Step 9: Verify the app boots**

Run: `npm run dev`, open the printed URL, confirm the default page renders, then stop the server.

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

### Task 2: Content types + tree validation

**Files:**
- Create: `src/domain/content/types.ts`, `src/domain/content/validateTree.ts`
- Test: `src/domain/content/__tests__/validateTree.test.ts`

**Interfaces:**
- Produces:
  - Types: `NodeTypeId = 'lesson-quiz' | 'interactive' | 'flashcards' | 'ai-tutor'`;
    `QuizQuestion { id: string; prompt: string; choices: string[]; answerIndex: number }`;
    `NodeMeta { id: string; title: string; type: NodeTypeId; xp: number; estMinutes: number; isBoss?: boolean; body?: string; questions?: QuizQuestion[] }`;
    `TreeNode { id: string; position: { x: number; y: number }; prerequisites: string[] }`;
    `TreeData { subject: string; title: string; bossNodeId: string; nodes: TreeNode[] }`;
    `LoadedNode = TreeNode & { meta: NodeMeta }`;
    `LoadedTree { subject: string; title: string; bossNodeId: string; nodes: LoadedNode[] }`.
  - `validateTree(tree: TreeData): string[]` — returns a list of human-readable problems (empty = valid).

- [ ] **Step 1: Write the types file**

Create `src/domain/content/types.ts`:
```ts
export type NodeTypeId = 'lesson-quiz' | 'interactive' | 'flashcards' | 'ai-tutor';

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
}

export interface NodeMeta {
  id: string;
  title: string;
  type: NodeTypeId;
  xp: number;
  estMinutes: number;
  isBoss?: boolean;
  body?: string;
  questions?: QuizQuestion[];
}

export interface TreeNode {
  id: string;
  position: { x: number; y: number };
  prerequisites: string[];
}

export interface TreeData {
  subject: string;
  title: string;
  bossNodeId: string;
  nodes: TreeNode[];
}

export type LoadedNode = TreeNode & { meta: NodeMeta };

export interface LoadedTree {
  subject: string;
  title: string;
  bossNodeId: string;
  nodes: LoadedNode[];
}
```

- [ ] **Step 2: Write the failing test**

Create `src/domain/content/__tests__/validateTree.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateTree } from '../validateTree';
import type { TreeData } from '../types';

const valid: TreeData = {
  subject: 'networking',
  title: 'Networking',
  bossNodeId: 'http',
  nodes: [
    { id: 'packets', position: { x: 0, y: 0 }, prerequisites: [] },
    { id: 'http', position: { x: 0, y: 100 }, prerequisites: ['packets'] },
  ],
};

describe('validateTree', () => {
  it('returns no problems for a valid tree', () => {
    expect(validateTree(valid)).toEqual([]);
  });

  it('flags duplicate node ids', () => {
    const t = { ...valid, nodes: [...valid.nodes, valid.nodes[0]] };
    expect(validateTree(t).some((p) => p.includes('duplicate'))).toBe(true);
  });

  it('flags a prerequisite that does not exist', () => {
    const t: TreeData = { ...valid, nodes: [{ id: 'a', position: { x: 0, y: 0 }, prerequisites: ['ghost'] }], bossNodeId: 'a' };
    expect(validateTree(t).some((p) => p.includes('ghost'))).toBe(true);
  });

  it('flags a bossNodeId that does not exist', () => {
    const t = { ...valid, bossNodeId: 'nope' };
    expect(validateTree(t).some((p) => p.includes('boss'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- validateTree`
Expected: FAIL (cannot find module `../validateTree`).

- [ ] **Step 4: Implement `validateTree`**

Create `src/domain/content/validateTree.ts`:
```ts
import type { TreeData } from './types';

export function validateTree(tree: TreeData): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const node of tree.nodes) {
    if (ids.has(node.id)) problems.push(`duplicate node id: ${node.id}`);
    ids.add(node.id);
  }

  for (const node of tree.nodes) {
    for (const pre of node.prerequisites) {
      if (!ids.has(pre)) problems.push(`node "${node.id}" has unknown prerequisite "${pre}"`);
    }
  }

  if (!ids.has(tree.bossNodeId)) problems.push(`boss node "${tree.bossNodeId}" is not in the tree`);

  return problems;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- validateTree`
Expected: PASS (4 passed).

- [ ] **Step 6: Commit**

```bash
git add src/domain/content
git commit -m "feat: content types and tree validation"
```

---

### Task 3: Content loader

**Files:**
- Create: `src/domain/content/loadTree.ts`
- Test: `src/domain/content/__tests__/loadTree.test.ts`
- Test fixtures: `src/domain/content/__fixtures__/networking/tree.json`, `src/domain/content/__fixtures__/networking/nodes/packets.mdx`, `.../nodes/http.mdx`

**Interfaces:**
- Consumes: `TreeData`, `NodeMeta`, `LoadedTree`, `validateTree` from Task 2.
- Produces: `loadTree(contentRoot: string, subject: string): LoadedTree` — reads `<contentRoot>/<subject>/tree.json` and each node's `.mdx` file (frontmatter → `NodeMeta`, body → `meta.body`), merges into `LoadedTree`. Throws if `validateTree` reports problems.

- [ ] **Step 1: Install frontmatter parser**

Run: `npm install gray-matter`

- [ ] **Step 2: Create fixtures**

Create `src/domain/content/__fixtures__/networking/tree.json`:
```json
{
  "subject": "networking",
  "title": "Networking",
  "bossNodeId": "http",
  "nodes": [
    { "id": "packets", "position": { "x": 0, "y": 0 }, "prerequisites": [] },
    { "id": "http", "position": { "x": 0, "y": 120 }, "prerequisites": ["packets"] }
  ]
}
```

Create `src/domain/content/__fixtures__/networking/nodes/packets.mdx`:
```mdx
---
id: packets
title: Packets
type: lesson-quiz
xp: 100
estMinutes: 6
questions:
  - id: q1
    prompt: What is a packet?
    choices: ["A unit of data", "A type of cable", "A router"]
    answerIndex: 0
---
A packet is a small unit of data sent across a network.
```

Create `src/domain/content/__fixtures__/networking/nodes/http.mdx`:
```mdx
---
id: http
title: HTTP
type: lesson-quiz
xp: 200
estMinutes: 10
isBoss: true
questions:
  - id: q1
    prompt: HTTP is built on top of which protocol?
    choices: ["TCP", "USB", "HDMI"]
    answerIndex: 0
---
HTTP is the protocol of the web, layered on TCP.
```

- [ ] **Step 3: Write the failing test**

Create `src/domain/content/__tests__/loadTree.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadTree } from '../loadTree';

const root = path.join(__dirname, '..', '__fixtures__');

describe('loadTree', () => {
  it('loads tree shape and merges node frontmatter', () => {
    const tree = loadTree(root, 'networking');
    expect(tree.title).toBe('Networking');
    expect(tree.nodes).toHaveLength(2);

    const packets = tree.nodes.find((n) => n.id === 'packets')!;
    expect(packets.meta.title).toBe('Packets');
    expect(packets.meta.type).toBe('lesson-quiz');
    expect(packets.meta.xp).toBe(100);
    expect(packets.meta.body?.trim()).toContain('small unit of data');
    expect(packets.meta.questions?.[0].answerIndex).toBe(0);
    expect(packets.prerequisites).toEqual([]);
  });

  it('marks the boss node', () => {
    const tree = loadTree(root, 'networking');
    expect(tree.bossNodeId).toBe('http');
    expect(tree.nodes.find((n) => n.id === 'http')!.meta.isBoss).toBe(true);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- loadTree`
Expected: FAIL (cannot find module `../loadTree`).

- [ ] **Step 5: Implement `loadTree`**

Create `src/domain/content/loadTree.ts`:
```ts
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { TreeData, NodeMeta, LoadedTree, LoadedNode } from './types';
import { validateTree } from './validateTree';

export function loadTree(contentRoot: string, subject: string): LoadedTree {
  const dir = path.join(contentRoot, subject);
  const tree = JSON.parse(fs.readFileSync(path.join(dir, 'tree.json'), 'utf8')) as TreeData;

  const problems = validateTree(tree);
  if (problems.length) {
    throw new Error(`Invalid tree "${subject}":\n- ${problems.join('\n- ')}`);
  }

  const nodes: LoadedNode[] = tree.nodes.map((node) => {
    const file = path.join(dir, 'nodes', `${node.id}.mdx`);
    const parsed = matter(fs.readFileSync(file, 'utf8'));
    const meta = { ...(parsed.data as Omit<NodeMeta, 'body'>), body: parsed.content } as NodeMeta;
    return { ...node, meta };
  });

  return { subject: tree.subject, title: tree.title, bossNodeId: tree.bossNodeId, nodes };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- loadTree`
Expected: PASS (2 passed).

- [ ] **Step 7: Commit**

```bash
git add src/domain/content package.json package-lock.json
git commit -m "feat: content loader merging tree.json with node frontmatter"
```

---

### Task 4: ProgressStore (persistence seam)

**Files:**
- Create: `src/domain/progress/types.ts`, `src/domain/progress/ProgressStore.ts`
- Test: `src/domain/progress/__tests__/ProgressStore.test.ts`

**Interfaces:**
- Produces:
  - Types: `NodeStatus = 'not-started' | 'in-progress' | 'mastered'`;
    `NodeProgress { status: NodeStatus; bestScore: number; xpEarned: number }`;
    `SubjectProgress { nodes: Record<string, NodeProgress> }`;
    `ProgressData { subjects: Record<string, SubjectProgress>; streak: { count: number; lastActiveISO: string | null } }`.
  - `interface KeyValue { getItem(k: string): string | null; setItem(k: string, v: string): void }`.
  - `class ProgressStore` with:
    `constructor(storage: KeyValue)`;
    `load(): ProgressData`;
    `getSubject(subject: string): SubjectProgress`;
    `recordCompletion(subject: string, nodeId: string, opts: { score: number; xp: number; passed: boolean; todayISO: string }): void`;
    `getStreak(): { count: number; lastActiveISO: string | null }`.

- [ ] **Step 1: Write the types file**

Create `src/domain/progress/types.ts`:
```ts
export type NodeStatus = 'not-started' | 'in-progress' | 'mastered';

export interface NodeProgress {
  status: NodeStatus;
  bestScore: number;
  xpEarned: number;
}

export interface SubjectProgress {
  nodes: Record<string, NodeProgress>;
}

export interface ProgressData {
  subjects: Record<string, SubjectProgress>;
  streak: { count: number; lastActiveISO: string | null };
}
```

- [ ] **Step 2: Write the failing test**

Create `src/domain/progress/__tests__/ProgressStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressStore, type KeyValue } from '../ProgressStore';

function memStorage(): KeyValue {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe('ProgressStore', () => {
  let store: ProgressStore;
  beforeEach(() => {
    store = new ProgressStore(memStorage());
  });

  it('starts empty', () => {
    expect(store.getSubject('networking').nodes).toEqual({});
    expect(store.getStreak().count).toBe(0);
  });

  it('records a passing completion as mastered with xp', () => {
    store.recordCompletion('networking', 'packets', { score: 1, xp: 100, passed: true, todayISO: '2026-06-19' });
    const sub = store.getSubject('networking');
    expect(sub.nodes.packets.status).toBe('mastered');
    expect(sub.nodes.packets.xpEarned).toBe(100);
    expect(sub.nodes.packets.bestScore).toBe(1);
  });

  it('records a failing attempt as in-progress with no xp', () => {
    store.recordCompletion('networking', 'packets', { score: 0.5, xp: 0, passed: false, todayISO: '2026-06-19' });
    expect(store.getSubject('networking').nodes.packets.status).toBe('in-progress');
    expect(store.getSubject('networking').nodes.packets.xpEarned).toBe(0);
  });

  it('does not downgrade a mastered node or lower bestScore', () => {
    store.recordCompletion('networking', 'packets', { score: 1, xp: 100, passed: true, todayISO: '2026-06-19' });
    store.recordCompletion('networking', 'packets', { score: 0.5, xp: 0, passed: false, todayISO: '2026-06-19' });
    const n = store.getSubject('networking').nodes.packets;
    expect(n.status).toBe('mastered');
    expect(n.bestScore).toBe(1);
    expect(n.xpEarned).toBe(100);
  });

  it('increments streak on a new day and resets after a gap', () => {
    store.recordCompletion('networking', 'a', { score: 1, xp: 10, passed: true, todayISO: '2026-06-18' });
    expect(store.getStreak().count).toBe(1);
    store.recordCompletion('networking', 'b', { score: 1, xp: 10, passed: true, todayISO: '2026-06-19' });
    expect(store.getStreak().count).toBe(2);
    store.recordCompletion('networking', 'c', { score: 1, xp: 10, passed: true, todayISO: '2026-06-25' });
    expect(store.getStreak().count).toBe(1);
  });

  it('persists across instances sharing storage', () => {
    const shared = memStorage();
    new ProgressStore(shared).recordCompletion('networking', 'packets', { score: 1, xp: 100, passed: true, todayISO: '2026-06-19' });
    expect(new ProgressStore(shared).getSubject('networking').nodes.packets.status).toBe('mastered');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- ProgressStore`
Expected: FAIL (cannot find module `../ProgressStore`).

- [ ] **Step 4: Implement `ProgressStore`**

Create `src/domain/progress/ProgressStore.ts`:
```ts
import type { ProgressData, SubjectProgress } from './types';

export interface KeyValue {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const KEY = 'apollearn11:progress:v1';

function empty(): ProgressData {
  return { subjects: {}, streak: { count: 0, lastActiveISO: null } };
}

function dayDiff(aISO: string, bISO: string): number {
  const a = Date.parse(aISO + 'T00:00:00Z');
  const b = Date.parse(bISO + 'T00:00:00Z');
  return Math.round((b - a) / 86_400_000);
}

export class ProgressStore {
  constructor(private storage: KeyValue) {}

  load(): ProgressData {
    const raw = this.storage.getItem(KEY);
    if (!raw) return empty();
    try {
      return { ...empty(), ...(JSON.parse(raw) as ProgressData) };
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
      if (diff === 0) {
        // same day, no change to count
      } else if (diff === 1) {
        data.streak = { count: data.streak.count + 1, lastActiveISO: opts.todayISO };
      } else {
        data.streak = { count: 1, lastActiveISO: opts.todayISO };
      }
    }

    this.save(data);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- ProgressStore`
Expected: PASS (6 passed).

- [ ] **Step 6: Commit**

```bash
git add src/domain/progress
git commit -m "feat: ProgressStore with completion + streak logic"
```

---

### Task 5: Progression engine (node states, XP, level)

**Files:**
- Create: `src/domain/tree/treeState.ts`
- Test: `src/domain/tree/__tests__/treeState.test.ts`

**Interfaces:**
- Consumes: `LoadedTree` (Task 2), `SubjectProgress` (Task 4).
- Produces:
  - `type NodeUiState = 'locked' | 'available' | 'in-progress' | 'mastered'`.
  - `computeNodeStates(tree: LoadedTree, progress: SubjectProgress): Record<string, NodeUiState>` — a node is `mastered`/`in-progress` from stored status; otherwise `available` if all prerequisites are `mastered`, else `locked`.
  - `computeSubjectXp(progress: SubjectProgress): number` — sum of `xpEarned`.
  - `computeLevel(xp: number): { level: number; title: string; xpIntoLevel: number; xpForNext: number }` — `XP_PER_LEVEL = 300`; titles cycle `['Novice','Apprentice','Journeyman','Adept','Expert','Master']` by level (capped at last).

- [ ] **Step 1: Write the failing test**

Create `src/domain/tree/__tests__/treeState.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeNodeStates, computeSubjectXp, computeLevel } from '../treeState';
import type { LoadedTree } from '@/domain/content/types';
import type { SubjectProgress } from '@/domain/progress/types';

const tree: LoadedTree = {
  subject: 'networking',
  title: 'Networking',
  bossNodeId: 'c',
  nodes: [
    { id: 'a', position: { x: 0, y: 0 }, prerequisites: [], meta: { id: 'a', title: 'A', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'b', position: { x: 0, y: 1 }, prerequisites: ['a'], meta: { id: 'b', title: 'B', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'c', position: { x: 0, y: 2 }, prerequisites: ['b'], meta: { id: 'c', title: 'C', type: 'lesson-quiz', xp: 200, estMinutes: 5, isBoss: true } },
  ],
};

describe('computeNodeStates', () => {
  it('first node is available, rest locked when no progress', () => {
    const states = computeNodeStates(tree, { nodes: {} });
    expect(states.a).toBe('available');
    expect(states.b).toBe('locked');
    expect(states.c).toBe('locked');
  });

  it('mastering a node unlocks its dependents', () => {
    const progress: SubjectProgress = { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } };
    const states = computeNodeStates(tree, progress);
    expect(states.a).toBe('mastered');
    expect(states.b).toBe('available');
    expect(states.c).toBe('locked');
  });

  it('reflects in-progress status', () => {
    const progress: SubjectProgress = { nodes: { a: { status: 'in-progress', bestScore: 0.5, xpEarned: 0 } } };
    expect(computeNodeStates(tree, progress).a).toBe('in-progress');
  });
});

describe('computeSubjectXp', () => {
  it('sums earned xp', () => {
    const progress: SubjectProgress = { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 }, b: { status: 'mastered', bestScore: 1, xpEarned: 100 } } };
    expect(computeSubjectXp(progress)).toBe(200);
  });
});

describe('computeLevel', () => {
  it('level 1 Novice at 0 xp', () => {
    expect(computeLevel(0)).toEqual({ level: 1, title: 'Novice', xpIntoLevel: 0, xpForNext: 300 });
  });
  it('rolls to level 2 Apprentice at 300 xp', () => {
    const r = computeLevel(350);
    expect(r.level).toBe(2);
    expect(r.title).toBe('Apprentice');
    expect(r.xpIntoLevel).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- treeState`
Expected: FAIL (cannot find module `../treeState`).

- [ ] **Step 3: Implement `treeState`**

Create `src/domain/tree/treeState.ts`:
```ts
import type { LoadedTree } from '@/domain/content/types';
import type { SubjectProgress, NodeStatus } from '@/domain/progress/types';

export type NodeUiState = 'locked' | 'available' | 'in-progress' | 'mastered';

export const XP_PER_LEVEL = 300;
const TITLES = ['Novice', 'Apprentice', 'Journeyman', 'Adept', 'Expert', 'Master'];

export function computeNodeStates(tree: LoadedTree, progress: SubjectProgress): Record<string, NodeUiState> {
  const statusOf = (id: string): NodeStatus => progress.nodes[id]?.status ?? 'not-started';
  const result: Record<string, NodeUiState> = {};

  for (const node of tree.nodes) {
    const status = statusOf(node.id);
    if (status === 'mastered') {
      result[node.id] = 'mastered';
    } else if (status === 'in-progress') {
      result[node.id] = 'in-progress';
    } else {
      const unlocked = node.prerequisites.every((p) => statusOf(p) === 'mastered');
      result[node.id] = unlocked ? 'available' : 'locked';
    }
  }
  return result;
}

export function computeSubjectXp(progress: SubjectProgress): number {
  return Object.values(progress.nodes).reduce((sum, n) => sum + n.xpEarned, 0);
}

export function computeLevel(xp: number): { level: number; title: string; xpIntoLevel: number; xpForNext: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = TITLES[Math.min(level - 1, TITLES.length - 1)];
  return { level, title, xpIntoLevel: xp % XP_PER_LEVEL, xpForNext: XP_PER_LEVEL };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- treeState`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
git add src/domain/tree
git commit -m "feat: progression engine (node states, xp, level)"
```

---

### Task 6: Node-type contract + lesson-quiz logic + registry

**Files:**
- Create: `src/domain/nodes/types.ts`, `src/domain/nodes/lessonQuiz/logic.ts`, `src/domain/nodes/registry.ts`
- Test: `src/domain/nodes/lessonQuiz/__tests__/logic.test.ts`

**Interfaces:**
- Consumes: `NodeMeta`, `QuizQuestion` (Task 2).
- Produces:
  - `interface NodeRuntimeState { answers: Record<string, number>; submitted: boolean }`.
  - `interface NodeViewProps { node: NodeMeta; onComplete: (result: { score: number; passed: boolean; xp: number }) => void }`.
  - `interface NodeTypeDefinition { id: NodeTypeId; isComplete(node: NodeMeta, state: NodeRuntimeState): boolean; xpAwarded(node: NodeMeta, state: NodeRuntimeState): number; Component: React.ComponentType<NodeViewProps> }`.
  - lesson-quiz logic: `PASS_THRESHOLD = 0.8`; `scoreQuiz(questions, answers): { correct: number; total: number; ratio: number; passed: boolean }`; `lessonQuizXp(node, ratio): number` (full xp if passed, else 0).
  - `registry: Record<NodeTypeId, NodeTypeDefinition>` and `getNodeType(id): NodeTypeDefinition` (Task 6 wires only `lesson-quiz`; `Component` is attached in Task 7 — until then registry returns the logic + a placeholder component noted below).

- [ ] **Step 1: Write the failing test**

Create `src/domain/nodes/lessonQuiz/__tests__/logic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { scoreQuiz, lessonQuizXp, PASS_THRESHOLD } from '../logic';
import type { QuizQuestion, NodeMeta } from '@/domain/content/types';

const questions: QuizQuestion[] = [
  { id: 'q1', prompt: 'a', choices: ['x', 'y'], answerIndex: 0 },
  { id: 'q2', prompt: 'b', choices: ['x', 'y'], answerIndex: 1 },
];

describe('scoreQuiz', () => {
  it('scores all correct as ratio 1 and passed', () => {
    const r = scoreQuiz(questions, { q1: 0, q2: 1 });
    expect(r).toEqual({ correct: 2, total: 2, ratio: 1, passed: true });
  });
  it('scores half correct as not passed (below 0.8)', () => {
    const r = scoreQuiz(questions, { q1: 0, q2: 0 });
    expect(r.correct).toBe(1);
    expect(r.ratio).toBe(0.5);
    expect(r.passed).toBe(false);
  });
  it('treats missing answers as wrong', () => {
    expect(scoreQuiz(questions, {}).correct).toBe(0);
  });
});

describe('lessonQuizXp', () => {
  const node = { id: 'a', title: 'A', type: 'lesson-quiz', xp: 120, estMinutes: 5 } as NodeMeta;
  it('awards full xp when passed', () => {
    expect(lessonQuizXp(node, 1)).toBe(120);
  });
  it('awards 0 xp when below threshold', () => {
    expect(lessonQuizXp(node, PASS_THRESHOLD - 0.01)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lessonQuiz`
Expected: FAIL (cannot find module `../logic`).

- [ ] **Step 3: Implement lesson-quiz logic**

Create `src/domain/nodes/lessonQuiz/logic.ts`:
```ts
import type { QuizQuestion, NodeMeta } from '@/domain/content/types';

export const PASS_THRESHOLD = 0.8;

export function scoreQuiz(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): { correct: number; total: number; ratio: number; passed: boolean } {
  const total = questions.length;
  const correct = questions.filter((q) => answers[q.id] === q.answerIndex).length;
  const ratio = total === 0 ? 0 : correct / total;
  return { correct, total, ratio, passed: ratio >= PASS_THRESHOLD };
}

export function lessonQuizXp(node: NodeMeta, ratio: number): number {
  return ratio >= PASS_THRESHOLD ? node.xp : 0;
}
```

- [ ] **Step 4: Write the node-type contract**

Create `src/domain/nodes/types.ts`:
```ts
import type { ComponentType } from 'react';
import type { NodeMeta, NodeTypeId } from '@/domain/content/types';

export interface NodeRuntimeState {
  answers: Record<string, number>;
  submitted: boolean;
}

export interface NodeViewProps {
  node: NodeMeta;
  onComplete: (result: { score: number; passed: boolean; xp: number }) => void;
}

export interface NodeTypeDefinition {
  id: NodeTypeId;
  isComplete(node: NodeMeta, state: NodeRuntimeState): boolean;
  xpAwarded(node: NodeMeta, state: NodeRuntimeState): number;
  Component: ComponentType<NodeViewProps>;
}
```

- [ ] **Step 5: Run test to verify logic passes**

Run: `npm test -- lessonQuiz`
Expected: PASS (5 passed).

- [ ] **Step 6: Commit**

```bash
git add src/domain/nodes
git commit -m "feat: node-type contract and lesson-quiz scoring logic"
```

> The `registry.ts` file is created in Task 7, once `LessonQuizNode` exists to attach as `Component`.

---

### Task 7: LessonQuizNode UI + registry wiring

**Files:**
- Create: `src/domain/nodes/lessonQuiz/LessonQuizNode.tsx`, `src/domain/nodes/registry.ts`
- Test: `src/domain/nodes/lessonQuiz/__tests__/LessonQuizNode.test.tsx`

**Interfaces:**
- Consumes: `NodeViewProps` (Task 6), `scoreQuiz`, `lessonQuizXp` (Task 6).
- Produces: `LessonQuizNode` React component; `registry` / `getNodeType(id: NodeTypeId): NodeTypeDefinition` exporting a fully-wired `lesson-quiz` definition.

- [ ] **Step 1: Write the failing test**

Create `src/domain/nodes/lessonQuiz/__tests__/LessonQuizNode.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonQuizNode } from '../LessonQuizNode';
import type { NodeMeta } from '@/domain/content/types';

const node: NodeMeta = {
  id: 'packets', title: 'Packets', type: 'lesson-quiz', xp: 100, estMinutes: 5,
  body: 'A packet is a unit of data.',
  questions: [{ id: 'q1', prompt: 'What is a packet?', choices: ['Data unit', 'A cable'], answerIndex: 0 }],
};

describe('LessonQuizNode', () => {
  it('shows the explainer and question', () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} />);
    expect(screen.getByText(/unit of data/i)).toBeInTheDocument();
    expect(screen.getByText(/What is a packet/i)).toBeInTheDocument();
  });

  it('calls onComplete with passing result when answered correctly', async () => {
    const onComplete = vi.fn();
    render(<LessonQuizNode node={node} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /Data unit/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1, passed: true, xp: 100 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- LessonQuizNode`
Expected: FAIL (cannot find module `../LessonQuizNode`).

- [ ] **Step 3: Implement `LessonQuizNode`**

Create `src/domain/nodes/lessonQuiz/LessonQuizNode.tsx`:
```tsx
'use client';
import { useState } from 'react';
import type { NodeViewProps } from '@/domain/nodes/types';
import { scoreQuiz, lessonQuizXp } from './logic';

export function LessonQuizNode({ node, onComplete }: NodeViewProps) {
  const questions = node.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, number>>({});

  function submit() {
    const result = scoreQuiz(questions, answers);
    onComplete({ score: result.ratio, passed: result.passed, xp: lessonQuizXp(node, result.ratio) });
  }

  return (
    <div className="space-y-6">
      {node.body && <p className="text-slate-300 leading-relaxed">{node.body}</p>}
      {questions.map((q) => (
        <fieldset key={q.id} className="space-y-2">
          <legend className="font-medium text-slate-100">{q.prompt}</legend>
          {q.choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={answers[q.id] === i}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
              className={`block w-full rounded-lg border px-4 py-2 text-left ${
                answers[q.id] === i ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-700'
              }`}
            >
              {choice}
            </button>
          ))}
        </fieldset>
      ))}
      <button type="button" onClick={submit} className="rounded-xl bg-amber-400 px-5 py-2 font-bold text-amber-950">
        Submit
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- LessonQuizNode`
Expected: PASS (2 passed).

- [ ] **Step 5: Write the registry**

Create `src/domain/nodes/registry.ts`:
```ts
import type { NodeTypeId } from '@/domain/content/types';
import type { NodeTypeDefinition, NodeRuntimeState } from './types';
import { LessonQuizNode } from './lessonQuiz/LessonQuizNode';
import { scoreQuiz, lessonQuizXp } from './lessonQuiz/logic';

const lessonQuiz: NodeTypeDefinition = {
  id: 'lesson-quiz',
  isComplete: (node, state: NodeRuntimeState) => scoreQuiz(node.questions ?? [], state.answers).passed,
  xpAwarded: (node, state: NodeRuntimeState) => lessonQuizXp(node, scoreQuiz(node.questions ?? [], state.answers).ratio),
  Component: LessonQuizNode,
};

export const registry: Partial<Record<NodeTypeId, NodeTypeDefinition>> = {
  'lesson-quiz': lessonQuiz,
};

export function getNodeType(id: NodeTypeId): NodeTypeDefinition {
  const def = registry[id];
  if (!def) throw new Error(`No node type registered for "${id}"`);
  return def;
}
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS (all prior tests).

- [ ] **Step 7: Commit**

```bash
git add src/domain/nodes
git commit -m "feat: lesson-quiz UI component and node-type registry"
```

---

### Task 8: SkillTree (React Flow) + NodeDetailPanel

**Files:**
- Create: `src/components/SkillTree.tsx`, `src/components/NodeDetailPanel.tsx`
- Test: `src/components/__tests__/NodeDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `LoadedTree`, `LoadedNode` (Task 2), `NodeUiState` (Task 5).
- Produces:
  - `NodeDetailPanel({ node, state, onStart }: { node: LoadedNode | null; state: NodeUiState | undefined; onStart: () => void })` — renders title, type badge, XP/est, and a Start button enabled only when `state` is `available` or `in-progress`.
  - `SkillTree({ tree, states, onSelect }: { tree: LoadedTree; states: Record<string, NodeUiState>; onSelect: (nodeId: string) => void })` — renders a React Flow graph; node color reflects `states`; clicking a node calls `onSelect`.

- [ ] **Step 1: Install React Flow**

Run: `npm install @xyflow/react`

- [ ] **Step 2: Write the failing test (detail panel)**

Create `src/components/__tests__/NodeDetailPanel.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeDetailPanel } from '../NodeDetailPanel';
import type { LoadedNode } from '@/domain/content/types';

const node: LoadedNode = {
  id: 'subnetting', position: { x: 0, y: 0 }, prerequisites: ['ip'],
  meta: { id: 'subnetting', title: 'Subnetting', type: 'lesson-quiz', xp: 120, estMinutes: 8 },
};

describe('NodeDetailPanel', () => {
  it('shows node info and a disabled Start when locked', () => {
    render(<NodeDetailPanel node={node} state="locked" onStart={() => {}} />);
    expect(screen.getByText('Subnetting')).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
  });

  it('enables Start when available and fires onStart', async () => {
    const onStart = vi.fn();
    render(<NodeDetailPanel node={node} state="available" onStart={onStart} />);
    const btn = screen.getByRole('button', { name: /start/i });
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders nothing when no node selected', () => {
    const { container } = render(<NodeDetailPanel node={null} state={undefined} onStart={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- NodeDetailPanel`
Expected: FAIL (cannot find module `../NodeDetailPanel`).

- [ ] **Step 4: Implement `NodeDetailPanel`**

Create `src/components/NodeDetailPanel.tsx`:
```tsx
'use client';
import type { LoadedNode } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

export function NodeDetailPanel({
  node,
  state,
  onStart,
}: {
  node: LoadedNode | null;
  state: NodeUiState | undefined;
  onStart: () => void;
}) {
  if (!node) return null;
  const canStart = state === 'available' || state === 'in-progress';
  return (
    <aside className="w-64 border-l border-slate-800 bg-slate-900/80 p-5 text-slate-200">
      <div className="mb-3 inline-block rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
        {node.meta.type}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{node.meta.title}</h3>
      <p className="mb-4 text-xs text-slate-400">
        +{node.meta.xp} XP · ~{node.meta.estMinutes}m
      </p>
      <button
        type="button"
        disabled={!canStart}
        onClick={onStart}
        className="w-full rounded-xl bg-amber-400 px-4 py-2 font-bold text-amber-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === 'mastered' ? 'Review' : 'Start ▸'}
      </button>
    </aside>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- NodeDetailPanel`
Expected: PASS (3 passed).

- [ ] **Step 6: Implement `SkillTree` (React Flow)**

Create `src/components/SkillTree.tsx`:
```tsx
'use client';
import { ReactFlow, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

const COLORS: Record<NodeUiState, string> = {
  mastered: '#f59e0b',
  available: '#818cf8',
  'in-progress': '#a5b4fc',
  locked: '#334155',
};

export function SkillTree({
  tree,
  states,
  onSelect,
}: {
  tree: LoadedTree;
  states: Record<string, NodeUiState>;
  onSelect: (nodeId: string) => void;
}) {
  const nodes: Node[] = tree.nodes.map((n) => ({
    id: n.id,
    position: n.position,
    data: { label: n.meta.title },
    style: {
      background: COLORS[states[n.id] ?? 'locked'],
      color: states[n.id] === 'locked' ? '#94a3b8' : '#0b1020',
      border: 'none',
      borderRadius: 14,
      width: 120,
      fontWeight: 600,
    },
  }));

  const edges: Edge[] = tree.nodes.flatMap((n) =>
    n.prerequisites.map((p) => ({ id: `${p}->${n.id}`, source: p, target: n.id })),
  );

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_70%_90%,#15193a,#080a18_70%)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => onSelect(node.id)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={24} />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components package.json package-lock.json
git commit -m "feat: SkillTree (React Flow) and NodeDetailPanel"
```

---

### Task 9: Wire the Networking tree page (integration)

**Files:**
- Create: `content/networking/tree.json`, `content/networking/nodes/packets.mdx`, `content/networking/nodes/ip-addressing.mdx`, `content/networking/nodes/subnetting.mdx`
- Create: `src/app/tree/[subject]/page.tsx`, `src/app/tree/[subject]/TreeScreen.tsx`
- Modify: `src/app/page.tsx` (redirect to `/tree/networking`)
- Test: `src/app/tree/__tests__/TreeScreen.test.tsx`

**Interfaces:**
- Consumes: `loadTree` (Task 3), `ProgressStore` (Task 4), `computeNodeStates`/`computeSubjectXp`/`computeLevel` (Task 5), `getNodeType` (Task 7), `SkillTree`/`NodeDetailPanel` (Task 8).
- Produces: a working `/tree/networking` route. `page.tsx` is a server component that calls `loadTree(process.cwd() + '/content', subject)` and passes the `LoadedTree` to the client `TreeScreen`. `TreeScreen` owns selection, runs a node via its registry `Component` in a modal, records completions via `ProgressStore`, and recomputes states.

- [ ] **Step 1: Author the three real content nodes**

Create `content/networking/tree.json`:
```json
{
  "subject": "networking",
  "title": "Networking",
  "bossNodeId": "subnetting",
  "nodes": [
    { "id": "packets", "position": { "x": 250, "y": 320 }, "prerequisites": [] },
    { "id": "ip-addressing", "position": { "x": 250, "y": 180 }, "prerequisites": ["packets"] },
    { "id": "subnetting", "position": { "x": 250, "y": 40 }, "prerequisites": ["ip-addressing"] }
  ]
}
```

Create `content/networking/nodes/packets.mdx`:
```mdx
---
id: packets
title: Packets
type: lesson-quiz
xp: 100
estMinutes: 5
questions:
  - id: q1
    prompt: What is a network packet?
    choices: ["A small unit of data with headers + payload", "A physical cable", "A type of router"]
    answerIndex: 0
  - id: q2
    prompt: Why is data split into packets?
    choices: ["For efficient, resilient routing", "To make it heavier", "To encrypt it by default"]
    answerIndex: 0
---
Data sent over a network is broken into **packets** — small chunks, each wrapped with header information (where it's from, where it's going) around a payload. Splitting data this way lets the network route pieces independently and recover from loss.
```

Create `content/networking/nodes/ip-addressing.mdx`:
```mdx
---
id: ip-addressing
title: IP Addressing
type: lesson-quiz
xp: 120
estMinutes: 6
questions:
  - id: q1
    prompt: What does an IP address identify?
    choices: ["A device's location on a network", "The brand of a device", "A website's content"]
    answerIndex: 0
  - id: q2
    prompt: How many bits is an IPv4 address?
    choices: ["32", "8", "128"]
    answerIndex: 0
---
An **IP address** identifies a device on a network so packets can find it. IPv4 addresses are 32-bit numbers, usually written as four dotted octets like `192.168.1.10`.
```

Create `content/networking/nodes/subnetting.mdx`:
```mdx
---
id: subnetting
title: Subnetting
type: lesson-quiz
xp: 200
estMinutes: 9
isBoss: true
questions:
  - id: q1
    prompt: What does subnetting do?
    choices: ["Splits a network into smaller sub-networks", "Speeds up your CPU", "Encrypts traffic"]
    answerIndex: 0
  - id: q2
    prompt: What does a subnet mask define?
    choices: ["Which bits are network vs host", "The cable length", "The DNS server"]
    answerIndex: 0
---
**Subnetting** carves one network into smaller pieces. A **subnet mask** (e.g. `/24`) marks which bits of an address identify the network versus the host, letting you size and isolate sub-networks.
```

- [ ] **Step 2: Write the failing integration test**

Create `src/app/tree/__tests__/TreeScreen.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreeScreen } from '../[subject]/TreeScreen';
import type { LoadedTree } from '@/domain/content/types';

const tree: LoadedTree = {
  subject: 'networking', title: 'Networking', bossNodeId: 'b',
  nodes: [
    { id: 'a', position: { x: 0, y: 100 }, prerequisites: [], meta: { id: 'a', title: 'A', type: 'lesson-quiz', xp: 100, estMinutes: 5, body: 'About A', questions: [{ id: 'q1', prompt: 'pick x', choices: ['x', 'y'], answerIndex: 0 }] } },
    { id: 'b', position: { x: 0, y: 0 }, prerequisites: ['a'], meta: { id: 'b', title: 'B', type: 'lesson-quiz', xp: 100, estMinutes: 5, isBoss: true, questions: [{ id: 'q1', prompt: 'pick x', choices: ['x', 'y'], answerIndex: 0 }] } },
  ],
};

beforeEach(() => localStorage.clear());

describe('TreeScreen', () => {
  it('completing node A awards XP and unlocks B', async () => {
    render(<TreeScreen tree={tree} todayISO="2026-06-19" />);
    // open A via the detail panel
    await userEvent.click(screen.getByText('A'));
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    // answer + submit in the modal
    await userEvent.click(screen.getByRole('button', { name: /^x$/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    // XP reflected in the header
    expect(await screen.findByText(/100 XP/i)).toBeInTheDocument();
  });
});
```

> Note: React Flow needs layout measurement that jsdom lacks; the test interacts through the **detail panel + modal**, not by clicking React Flow canvas nodes. `TreeScreen` must therefore expose node selection via clickable titles in a list/legend alongside the canvas (a simple `<ul>` of node titles that also calls `onSelect`), which keeps the screen testable and accessible.

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- TreeScreen`
Expected: FAIL (cannot find module `../[subject]/TreeScreen`).

- [ ] **Step 4: Implement `TreeScreen` (client component)**

Create `src/app/tree/[subject]/TreeScreen.tsx`:
```tsx
'use client';
import { useMemo, useState } from 'react';
import type { LoadedTree } from '@/domain/content/types';
import { ProgressStore } from '@/domain/progress/ProgressStore';
import { computeNodeStates, computeSubjectXp, computeLevel } from '@/domain/tree/treeState';
import { getNodeType } from '@/domain/nodes/registry';
import { SkillTree } from '@/components/SkillTree';
import { NodeDetailPanel } from '@/components/NodeDetailPanel';

function browserStore(): ProgressStore {
  return new ProgressStore(typeof window !== 'undefined' ? window.localStorage : { getItem: () => null, setItem: () => {} });
}

export function TreeScreen({ tree, todayISO }: { tree: LoadedTree; todayISO: string }) {
  const store = useMemo(browserStore, []);
  const [progress, setProgress] = useState(() => store.getSubject(tree.subject));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const states = useMemo(() => computeNodeStates(tree, progress), [tree, progress]);
  const xp = computeSubjectXp(progress);
  const level = computeLevel(xp);
  const selected = tree.nodes.find((n) => n.id === selectedId) ?? null;

  function start() {
    if (selected) setRunning(true);
  }

  function complete(result: { score: number; passed: boolean; xp: number }) {
    if (!selected) return;
    store.recordCompletion(tree.subject, selected.id, { score: result.score, xp: result.xp, passed: result.passed, todayISO });
    setProgress(store.getSubject(tree.subject));
    setRunning(false);
  }

  const RunComponent = selected ? getNodeType(selected.meta.type).Component : null;

  return (
    <div className="flex h-screen flex-col bg-[#080a18] text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-sm">
        <span className="font-semibold">{tree.title}</span>
        <span className="text-amber-400">{level.title} · Lv {level.level} · {xp} XP</span>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex-1"><SkillTree tree={tree} states={states} onSelect={setSelectedId} /></div>
          {/* testable / accessible node list mirroring the canvas */}
          <ul className="flex gap-2 border-t border-slate-800 p-2 text-xs">
            {tree.nodes.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => setSelectedId(n.id)} className="rounded px-2 py-1 hover:bg-slate-800">
                  {n.meta.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <NodeDetailPanel node={selected} state={selected ? states[selected.id] : undefined} onStart={start} />
      </div>

      {running && selected && RunComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-bold">{selected.meta.title}</h2>
            <RunComponent node={selected.meta} onComplete={complete} />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- TreeScreen`
Expected: PASS (1 passed).

- [ ] **Step 6: Implement the server page + redirect**

Create `src/app/tree/[subject]/page.tsx`:
```tsx
import path from 'node:path';
import { loadTree } from '@/domain/content/loadTree';
import { TreeScreen } from './TreeScreen';

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const tree = loadTree(path.join(process.cwd(), 'content'), subject);
  const todayISO = new Date().toISOString().slice(0, 10);
  return <TreeScreen tree={tree} todayISO={todayISO} />;
}
```

Replace `src/app/page.tsx` with:
```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/tree/networking');
}
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, open `/tree/networking`. Confirm: Packets is available (indigo), others locked (dim); clicking Packets shows the detail panel; Start opens the quiz; answering correctly closes it, the header XP rises to 100, and IP Addressing becomes available. Reload the page → progress persists.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS (all tests).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: playable Networking skill tree wired end-to-end"
```

---

## Self-Review Notes

- **Spec coverage (Plan 1 portion):** content-as-files (Tasks 2–3, 9) ✓; pluggable node-type contract + lesson-quiz default (Tasks 6–7) ✓; per-tree XP + levels + titles + unlock gating + node states (Task 5) ✓; streak logic (Task 4) ✓; local-storage behind one swappable `ProgressStore` seam (Task 4, used only via `TreeScreen`) ✓; cosmos color language on nodes (Tasks 7–8) ✓; Networking first tree (Task 9) ✓. Deferred to later plans (correctly out of scope here): World Map, global level across trees, badges, interactive/ai-tutor/flashcards node types, AI authoring CLI, deploy, full motion polish.
- **Placeholders:** none — every code/test step contains real content.
- **Type consistency:** `LoadedTree`/`LoadedNode`/`NodeMeta`/`QuizQuestion` (Task 2) flow unchanged through Tasks 3, 5, 7, 8, 9; `NodeUiState` (Task 5) used in Tasks 8–9; `ProgressStore` signatures (Task 4) match `TreeScreen` usage (Task 9); `NodeViewProps`/`NodeTypeDefinition` (Task 6) match `LessonQuizNode` and registry (Task 7).
- **Known environment note:** React Flow does not lay out in jsdom, so the integration test drives the UI through the accessible node-list + detail panel + modal (Task 9, Step 2 note) rather than canvas clicks.
```
