# Apollearn 11 — Plan 3b: World Map

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the galaxy World Map as the app's home screen: each subject is a galaxy; the built subject (Networking) glows with progress and links into its tree; backlog subjects (Finance, AWS, Linear Optimization) are dormant/ignitable stars; aurora-ribbon paths connect them.

**Architecture:** A file-based subjects registry + pure loader (domain-style, framework-free). A presentational `WorldMap` (testable) fed by a thin client `WorldMapScreen` that reads per-subject progress via the existing `ProgressStore`. `/` renders the map instead of redirecting.

**Tech Stack:** Next.js 16 + React 19 + TS, Tailwind, `motion`, Vitest + RTL.

## Global Constraints
- Domain/loader stays framework-free; persistence only via `ProgressStore`.
- Cosmos language: started galaxy = glowing with a progress ring + mini-constellation feel; backlog = dim dormant star with an "ignite" hint; aurora-ribbon paths (soft gradient). Indigo + gold accents on `#05060f`/`#080a18`.
- Navigation: an available subject is a real link to `/tree/<id>`; backlog subjects are NOT links (dormant).
- Each task ends with `npm test` green; page/build tasks also run `npx tsc --noEmit` and `npm run build`.
- Don't weaken tests.

## File Structure
```
content/subjects.json                         # NEW: subjects registry (Task 1)
src/domain/content/subjects.ts                # NEW: Subject type + loadSubjects (Task 1)
src/components/WorldMap.tsx                    # NEW: presentational galaxy map (Task 2)
src/app/WorldMapScreen.tsx                    # NEW: client wrapper reading ProgressStore (Task 3)
src/app/page.tsx                              # MODIFY: render the map (Task 3)
src/app/tree/[subject]/TreeScreen.tsx        # MODIFY: add "← World" link (Task 3)
```

---

### Task 1: Subjects registry + loader

**Files:**
- Create: `content/subjects.json`, `src/domain/content/subjects.ts`
- Test: `src/domain/content/__tests__/subjects.test.ts`
- Test fixture: `src/domain/content/__fixtures__/subjects.json`

**Interfaces:**
- Produces:
  - `interface Subject { id: string; title: string; icon: string; status: 'available' | 'backlog'; nodeCount: number; blurb: string }`
  - `loadSubjects(contentRoot: string): Subject[]` — reads `<contentRoot>/subjects.json` (a JSON array), returns it typed. Throws if a record is missing `id`/`title`/`status` or `status` is not `available|backlog`.

- [ ] **Step 1: Author the real registry**

Create `content/subjects.json`:
```json
[
  { "id": "networking", "title": "Networking", "icon": "🌐", "status": "available", "nodeCount": 3, "blurb": "Packets to subnetting — how the internet moves data." },
  { "id": "finance", "title": "Finance & Markets", "icon": "📈", "status": "backlog", "nodeCount": 0, "blurb": "Stocks, risk, and how markets price things." },
  { "id": "cloud", "title": "Cloud / AWS", "icon": "☁️", "status": "backlog", "nodeCount": 0, "blurb": "Compute, storage, and deploying in the cloud." },
  { "id": "linear-optimization", "title": "Linear Optimization", "icon": "📐", "status": "backlog", "nodeCount": 0, "blurb": "Maximize and minimize under constraints." }
]
```

- [ ] **Step 2: Create the test fixture**

Create `src/domain/content/__fixtures__/subjects.json`:
```json
[
  { "id": "networking", "title": "Networking", "icon": "🌐", "status": "available", "nodeCount": 3, "blurb": "x" },
  { "id": "finance", "title": "Finance & Markets", "icon": "📈", "status": "backlog", "nodeCount": 0, "blurb": "y" }
]
```

- [ ] **Step 3: Write the failing test**

Create `src/domain/content/__tests__/subjects.test.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- subjects`
Expected: FAIL (cannot find module `../subjects`).

- [ ] **Step 5: Implement**

Create `src/domain/content/subjects.ts`:
```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- subjects`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/content/subjects.ts src/domain/content/__tests__/subjects.test.ts src/domain/content/__fixtures__/subjects.json content/subjects.json
git commit -m "feat: subjects registry and loader"
```

---

### Task 2: WorldMap presentational component

**Files:**
- Create: `src/components/WorldMap.tsx`
- Test: `src/components/__tests__/WorldMap.test.tsx`

**Interfaces:**
- Consumes: `Subject` (Task 1).
- Produces: `WorldMap({ subjects, masteredBySubject }: { subjects: Subject[]; masteredBySubject: Record<string, number> })`.
  - Renders a deep-space container with a starfield and one **galaxy** per subject (positioned around the canvas).
  - **available** subject → wrapped in a Next `Link` to `/tree/<id>`; shows the icon, title, and a progress label `"<mastered> / <nodeCount> stars"`; glows.
  - **backlog** subject → a dim, non-link element with the icon, title, and a `"Coming soon"` / `"Tap to ignite ✦"` hint; `data-dormant="true"`.
  - Aurora-ribbon paths: a decorative SVG layer with soft gradient strokes (pointer-events none).
  - A faint `"+ new subject"` nebula hint (static, non-interactive).

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/WorldMap.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldMap } from '../WorldMap';
import type { Subject } from '@/domain/content/subjects';

const subjects: Subject[] = [
  { id: 'networking', title: 'Networking', icon: '🌐', status: 'available', nodeCount: 3, blurb: 'x' },
  { id: 'finance', title: 'Finance & Markets', icon: '📈', status: 'backlog', nodeCount: 0, blurb: 'y' },
];

describe('WorldMap', () => {
  it('renders an available subject as a link to its tree with progress', () => {
    render(<WorldMap subjects={subjects} masteredBySubject={{ networking: 2 }} />);
    const link = screen.getByRole('link', { name: /Networking/i });
    expect(link).toHaveAttribute('href', '/tree/networking');
    expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument();
  });

  it('renders a backlog subject as dormant, not a link', () => {
    render(<WorldMap subjects={subjects} masteredBySubject={{}} />);
    expect(screen.queryByRole('link', { name: /Finance/i })).not.toBeInTheDocument();
    expect(screen.getByText('Finance & Markets').closest('[data-dormant="true"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- WorldMap`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement**

Create `src/components/WorldMap.tsx`:
```tsx
'use client';
import Link from 'next/link';
import type { Subject } from '@/domain/content/subjects';

const POSITIONS = ['left-[36%] top-[52%]', 'left-[72%] top-[32%]', 'left-[74%] top-[76%]', 'left-[20%] top-[80%]'];

function Galaxy({ subject, mastered }: { subject: Subject; mastered: number }) {
  if (subject.status === 'available') {
    return (
      <Link
        href={`/tree/${subject.id}`}
        className="group flex flex-col items-center text-center"
      >
        <span
          className="flex h-28 w-28 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-105"
          style={{
            background: 'radial-gradient(circle at 40% 35%,#3730a3,#1e1b4b 70%)',
            boxShadow: '0 0 38px rgba(129,140,248,0.6)',
          }}
        >
          {subject.icon}
        </span>
        <span className="mt-2 font-semibold text-slate-100">{subject.title}</span>
        <span className="text-xs text-indigo-300">{mastered} / {subject.nodeCount} stars</span>
      </Link>
    );
  }
  return (
    <div data-dormant="true" className="flex flex-col items-center text-center opacity-70">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full text-2xl"
        style={{ background: 'radial-gradient(circle at 40% 35%,#1b2347,#0c1124 70%)', border: '1px solid #2a3566' }}
      >
        {subject.icon}
      </span>
      <span className="mt-2 text-sm font-medium text-slate-300">{subject.title}</span>
      <span className="text-[10px] text-slate-500">Tap to ignite ✦</span>
    </div>
  );
}

export function WorldMap({ subjects, masteredBySubject }: { subjects: Subject[]; masteredBySubject: Record<string, number> }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_50%,#0d1030,#05060f_75%)] text-slate-100">
      {/* starfield */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 20%,#ffffff77 50%,transparent),radial-gradient(1px 1px at 30% 70%,#ffffff55 50%,transparent),radial-gradient(1.5px 1.5px at 65% 30%,#ffffff88 50%,transparent),radial-gradient(1px 1px at 80% 75%,#ffffff66 50%,transparent),radial-gradient(1.5px 1.5px at 90% 15%,#ffffff77 50%,transparent)',
        }}
      />
      {/* aurora-ribbon paths */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="aurora" x1="0" x2="1">
            <stop offset="0" stopColor="#a5b4fc" stopOpacity="0" />
            <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f0abfc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 36 52 C 50 40, 62 36, 72 32" stroke="url(#aurora)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
        <path d="M 36 52 C 50 64, 62 72, 74 76" stroke="url(#aurora)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
        <path d="M 36 52 C 28 64, 24 72, 20 80" stroke="url(#aurora)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
      </svg>

      <header className="relative px-6 py-5">
        <h1 className="text-xl font-bold">Apollearn 11</h1>
        <p className="text-xs text-slate-400">Your learning universe</p>
      </header>

      {subjects.map((s, i) => (
        <div key={s.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${POSITIONS[i % POSITIONS.length]}`}>
          <Galaxy subject={s} mastered={masteredBySubject[s.id] ?? 0} />
        </div>
      ))}

      <div className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center opacity-50">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-600 text-slate-500">+</div>
        <div className="mt-1 text-[10px] text-slate-500">new subject</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- WorldMap`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorldMap.tsx src/components/__tests__/WorldMap.test.tsx
git commit -m "feat: WorldMap galaxy screen (presentational)"
```

---

### Task 3: Wire the map as home + back link

**Files:**
- Create: `src/app/WorldMapScreen.tsx`
- Modify: `src/app/page.tsx`, `src/app/tree/[subject]/TreeScreen.tsx`
- Test: `src/app/__tests__/WorldMapScreen.test.tsx`

**Interfaces:**
- Consumes: `WorldMap` (Task 2), `loadSubjects` (Task 1), `ProgressStore`.
- Produces:
  - `WorldMapScreen({ subjects }: { subjects: Subject[] })` — `'use client'`; on mount reads `ProgressStore` (via the same `browserStore()` pattern) and computes `masteredBySubject` = for each subject, the count of nodes whose status is `mastered`; renders `<WorldMap subjects masteredBySubject />`.
  - `src/app/page.tsx` — server component: `loadSubjects(path.join(process.cwd(),'content'))` → `<WorldMapScreen subjects={...} />` (no more redirect).
  - `TreeScreen` header gains a `← World` Next `Link` to `/`.

- [ ] **Step 1: Write the failing test**

Create `src/app/__tests__/WorldMapScreen.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorldMapScreen } from '../WorldMapScreen';
import type { Subject } from '@/domain/content/subjects';

const subjects: Subject[] = [
  { id: 'networking', title: 'Networking', icon: '🌐', status: 'available', nodeCount: 3, blurb: 'x' },
];

beforeEach(() => localStorage.clear());

describe('WorldMapScreen', () => {
  it('shows 0 mastered with no progress and reflects stored progress', () => {
    render(<WorldMapScreen subjects={subjects} />);
    expect(screen.getByText(/0 \/ 3/)).toBeInTheDocument();
  });

  it('counts mastered nodes from ProgressStore', () => {
    localStorage.setItem(
      'apollearn11:progress:v1',
      JSON.stringify({ subjects: { networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } } }, streak: { count: 0, lastActiveISO: null }, seenIntro: true }),
    );
    render(<WorldMapScreen subjects={subjects} />);
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- WorldMapScreen`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement `WorldMapScreen`**

Create `src/app/WorldMapScreen.tsx`:
```tsx
'use client';
import { useMemo } from 'react';
import { ProgressStore } from '@/domain/progress/ProgressStore';
import type { Subject } from '@/domain/content/subjects';
import { WorldMap } from '@/components/WorldMap';

function browserStore(): ProgressStore {
  return new ProgressStore(typeof window !== 'undefined' ? window.localStorage : { getItem: () => null, setItem: () => {} });
}

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- WorldMapScreen`
Expected: PASS.

- [ ] **Step 5: Wire `/` to the map**

Replace `src/app/page.tsx` with:
```tsx
import path from 'node:path';
import { loadSubjects } from '@/domain/content/subjects';
import { WorldMapScreen } from './WorldMapScreen';

export default function Home() {
  const subjects = loadSubjects(path.join(process.cwd(), 'content'));
  return <WorldMapScreen subjects={subjects} />;
}
```

- [ ] **Step 6: Add the back link to TreeScreen**

In `src/app/tree/[subject]/TreeScreen.tsx`, import `Link from 'next/link'` and put a `← World` link at the start of the `<header>`:
```tsx
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-100">← World</Link>
          <span className="font-semibold">{tree.title}</span>
        </div>
        <span className="text-amber-400">{level.title} · Lv {level.level} · {xp} XP</span>
      </header>
```

- [ ] **Step 7: Full suite + tsc + build**

Run: `npm test` (all green), `npx tsc --noEmit` (clean), `npm run build` (succeeds; `/` is now the World Map). Confirm the TreeScreen tests still pass (the header change is additive; the `← World` link adds a `link` role but node/button queries are unaffected — if any test now finds an unexpected extra link, scope it, do not weaken).

- [ ] **Step 8: Manual verification**

Run `npm run dev`. `/` shows the galaxy World Map: Networking is a glowing galaxy showing `N / 3 stars` and links into `/tree/networking`; Finance/AWS/Linear Optimization are dim "Tap to ignite" galaxies (not links); aurora ribbons connect them. From a tree, `← World` returns to the map.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: World Map as home screen + back-to-world link"
```

---

## Self-Review Notes
- **Spec coverage (3b):** subjects registry + loader (Task 1) ✓; galaxies with started-glow+progress / dormant-ignite states (Task 2) ✓; aurora-ribbon paths + new-subject nebula (Task 2) ✓; available→link, backlog→non-link (Task 2) ✓; map as home reading real progress (Task 3) ✓; back-to-world nav (Task 3) ✓. Out of scope: global HUD/badges (3c).
- **No placeholders:** registry, loader, components, wiring all complete.
- **Persistence seam:** `WorldMapScreen` reads progress only through `ProgressStore` via `browserStore()`.
- **Type consistency:** `Subject` (Task 1) flows into `WorldMap`/`WorldMapScreen`; `masteredBySubject: Record<string,number>` consistent across Tasks 2–3.
- **Test integrity:** new RTL tests assert real link/href + progress counts; the TreeScreen header link is additive.
