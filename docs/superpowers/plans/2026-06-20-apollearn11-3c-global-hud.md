# Apollearn 11 — Plan 3c: Global Progression + HUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add cross-subject global progression (global XP/level), a small badge rule-set, and a shared HUD (global level, total XP, streak 🔥, badges) shown on both the World Map and the tree screen.

**Architecture:** Pure domain functions (`computeGlobalXp`, `computeBadges`) computed from the full `ProgressData`; a presentational `Hud` fed by the client screens, which read `ProgressData` via a now-shared `browserStore()` helper and pass `nodeCountBySubject` from the subjects registry.

**Tech Stack:** Next.js 16 + React 19 + TS, Tailwind, Vitest + RTL.

## Global Constraints
- Domain logic framework-free (no `window`/React under `src/domain/**`). The shared `browserStore()` (which touches `window.localStorage`) lives under `src/lib/`, NOT `src/domain/`.
- Persistence only via `ProgressStore`.
- HUD shows GLOBAL stats (across all subjects) on both screens; cosmos styling (indigo + gold).
- Each task ends with `npm test` green; page/build tasks also run `npx tsc --noEmit` and `npm run build`. Don't weaken tests.

## File Structure
```
src/lib/browserStore.ts                 # NEW: shared SSR-safe ProgressStore factory (Task 1)
src/domain/tree/treeState.ts            # MODIFY: add computeGlobalXp (Task 2)
src/domain/progress/badges.ts           # NEW: Badge type + computeBadges (Task 3)
src/components/Hud.tsx                   # NEW: presentational HUD (Task 4)
src/app/WorldMapScreen.tsx              # MODIFY: render Hud with global stats (Task 4)
src/app/tree/[subject]/TreeScreen.tsx   # MODIFY: use shared browserStore (Task 1) + Hud (Task 4)
src/app/tree/[subject]/page.tsx         # MODIFY: load subjects → pass nodeCountBySubject (Task 4)
src/app/page.tsx                        # (already loads subjects; pass nodeCountBySubject via WorldMapScreen) (Task 4)
```

---

### Task 1: Shared browserStore helper (dedup)

**Files:**
- Create: `src/lib/browserStore.ts`
- Modify: `src/app/tree/[subject]/TreeScreen.tsx`, `src/app/WorldMapScreen.tsx`
- Test: `src/lib/__tests__/browserStore.test.ts`

**Interfaces:**
- Produces: `browserStore(): ProgressStore` — constructs a `ProgressStore` over `window.localStorage` when available, else a no-op `KeyValue` (SSR-safe). Both `TreeScreen` and `WorldMapScreen` import this instead of defining their own local copy.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/browserStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { browserStore } from '../browserStore';

beforeEach(() => localStorage.clear());

describe('browserStore', () => {
  it('returns a ProgressStore backed by localStorage', () => {
    const store = browserStore();
    store.markIntroSeen();
    expect(browserStore().hasSeenIntro()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- browserStore`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement**

Create `src/lib/browserStore.ts`:
```ts
import { ProgressStore } from '@/domain/progress/ProgressStore';

export function browserStore(): ProgressStore {
  const storage =
    typeof window !== 'undefined'
      ? window.localStorage
      : { getItem: () => null, setItem: () => {} };
  return new ProgressStore(storage);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- browserStore`
Expected: PASS.

- [ ] **Step 5: Refactor the two screens to use it**

In `src/app/tree/[subject]/TreeScreen.tsx`: delete the local `function browserStore() {...}` and add `import { browserStore } from '@/lib/browserStore';`. Leave the `useMemo(browserStore, [])` call as-is (it now refers to the imported function).

In `src/app/WorldMapScreen.tsx`: same — delete the local `browserStore` definition, import it from `@/lib/browserStore`.

- [ ] **Step 6: Full suite + tsc**

Run: `npm test` (all green — the existing TreeScreen + WorldMapScreen tests must still pass), `npx tsc --noEmit` (clean).

- [ ] **Step 7: Commit**

```bash
git add src/lib src/app/tree src/app/WorldMapScreen.tsx
git commit -m "refactor: shared browserStore helper (dedup)"
```

---

### Task 2: computeGlobalXp

**Files:**
- Modify: `src/domain/tree/treeState.ts`
- Test: `src/domain/tree/__tests__/treeState.test.ts` (extend)

**Interfaces:**
- Consumes: `ProgressData` (`@/domain/progress/types`).
- Produces: `computeGlobalXp(data: ProgressData): number` — sum of `xpEarned` over every node of every subject. (Global level is then `computeLevel(computeGlobalXp(data))` using the existing `computeLevel`.)

- [ ] **Step 1: Write the failing test**

Append to `src/domain/tree/__tests__/treeState.test.ts`:
```ts
import { computeGlobalXp } from '../treeState';
import type { ProgressData } from '@/domain/progress/types';

describe('computeGlobalXp', () => {
  it('sums xpEarned across all subjects', () => {
    const data: ProgressData = {
      subjects: {
        networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 }, b: { status: 'mastered', bestScore: 1, xpEarned: 120 } } },
        finance: { nodes: { x: { status: 'mastered', bestScore: 1, xpEarned: 80 } } },
      },
      streak: { count: 0, lastActiveISO: null },
      seenIntro: true,
    };
    expect(computeGlobalXp(data)).toBe(300);
  });

  it('is 0 for empty progress', () => {
    expect(computeGlobalXp({ subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: false })).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- treeState`
Expected: FAIL (computeGlobalXp not exported).

- [ ] **Step 3: Implement**

In `src/domain/tree/treeState.ts`, add an import for the type and the function:
```ts
import type { ProgressData } from '@/domain/progress/types';

export function computeGlobalXp(data: ProgressData): number {
  return Object.values(data.subjects).reduce(
    (sum, subject) => sum + Object.values(subject.nodes).reduce((s, n) => s + n.xpEarned, 0),
    0,
  );
}
```
(Keep `SubjectProgress`/`NodeStatus` imports already present; add `ProgressData` to the import list or a new import line.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- treeState`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/tree
git commit -m "feat: computeGlobalXp across all subjects"
```

---

### Task 3: Badges

**Files:**
- Create: `src/domain/progress/badges.ts`
- Test: `src/domain/progress/__tests__/badges.test.ts`

**Interfaces:**
- Consumes: `ProgressData`.
- Produces:
  - `interface Badge { id: string; label: string; icon: string; earned: boolean }`
  - `computeBadges(data: ProgressData, nodeCountBySubject: Record<string, number>): Badge[]` returning these four badges (always all four, with `earned` set):
    - `first-steps` (icon `✦`, label "First Steps") — earned if ≥1 node is `mastered` anywhere.
    - `tree-complete` (icon `🌳`, label "Tree Complete") — earned if for some subject `nodeCountBySubject[s] > 0` and its mastered count `>= nodeCountBySubject[s]`.
    - `streak-7` (icon `🔥`, label "7-Day Streak") — earned if `data.streak.count >= 7`.
    - `polymath` (icon `🌌`, label "Polymath") — earned if ≥2 distinct subjects have ≥1 mastered node.

- [ ] **Step 1: Write the failing test**

Create `src/domain/progress/__tests__/badges.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeBadges } from '../badges';
import type { ProgressData } from '../types';

function earned(data: ProgressData, counts: Record<string, number>) {
  return new Set(computeBadges(data, counts).filter((b) => b.earned).map((b) => b.id));
}

const empty: ProgressData = { subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: false };

describe('computeBadges', () => {
  it('returns all four badges, none earned for empty progress', () => {
    const badges = computeBadges(empty, {});
    expect(badges.map((b) => b.id).sort()).toEqual(['first-steps', 'polymath', 'streak-7', 'tree-complete']);
    expect(badges.every((b) => !b.earned)).toBe(true);
  });

  it('earns first-steps with one mastered node', () => {
    const data: ProgressData = { ...empty, subjects: { networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } } } };
    expect(earned(data, { networking: 3 }).has('first-steps')).toBe(true);
    expect(earned(data, { networking: 3 }).has('tree-complete')).toBe(false);
  });

  it('earns tree-complete when a subject is fully mastered', () => {
    const data: ProgressData = { ...empty, subjects: { networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 }, b: { status: 'mastered', bestScore: 1, xpEarned: 100 } } } } };
    expect(earned(data, { networking: 2 }).has('tree-complete')).toBe(true);
  });

  it('earns streak-7 at 7 days and polymath across two subjects', () => {
    const data: ProgressData = {
      ...empty,
      streak: { count: 7, lastActiveISO: '2026-06-20' },
      subjects: {
        networking: { nodes: { a: { status: 'mastered', bestScore: 1, xpEarned: 100 } } },
        finance: { nodes: { x: { status: 'mastered', bestScore: 1, xpEarned: 80 } } },
      },
    };
    const e = earned(data, { networking: 3, finance: 3 });
    expect(e.has('streak-7')).toBe(true);
    expect(e.has('polymath')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- badges`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement**

Create `src/domain/progress/badges.ts`:
```ts
import type { ProgressData } from './types';

export interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
}

function masteredCount(data: ProgressData, subject: string): number {
  const nodes = data.subjects[subject]?.nodes ?? {};
  return Object.values(nodes).filter((n) => n.status === 'mastered').length;
}

export function computeBadges(data: ProgressData, nodeCountBySubject: Record<string, number>): Badge[] {
  const subjectIds = Object.keys(data.subjects);
  const totalMastered = subjectIds.reduce((sum, s) => sum + masteredCount(data, s), 0);
  const subjectsWithMastery = subjectIds.filter((s) => masteredCount(data, s) >= 1).length;
  const anyTreeComplete = Object.entries(nodeCountBySubject).some(
    ([s, count]) => count > 0 && masteredCount(data, s) >= count,
  );

  return [
    { id: 'first-steps', label: 'First Steps', icon: '✦', earned: totalMastered >= 1 },
    { id: 'tree-complete', label: 'Tree Complete', icon: '🌳', earned: anyTreeComplete },
    { id: 'streak-7', label: '7-Day Streak', icon: '🔥', earned: data.streak.count >= 7 },
    { id: 'polymath', label: 'Polymath', icon: '🌌', earned: subjectsWithMastery >= 2 },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- badges`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/progress/badges.ts src/domain/progress/__tests__/badges.test.ts
git commit -m "feat: badge rules (first-steps, tree-complete, streak-7, polymath)"
```

---

### Task 4: HUD component + wire into both screens

**Files:**
- Create: `src/components/Hud.tsx`
- Test: `src/components/__tests__/Hud.test.tsx`
- Modify: `src/app/WorldMapScreen.tsx`, `src/components/WorldMap.tsx` (accept a `hud` slot), `src/app/tree/[subject]/TreeScreen.tsx`, `src/app/tree/[subject]/page.tsx`

**Interfaces:**
- Consumes: `Badge` (Task 3).
- Produces:
  - `Hud({ level, xp, streak, badges }: { level: { level: number; title: string }; xp: number; streak: number; badges: Badge[] })` — presentational: shows `🔥 {streak}`, `◇ {xp} XP`, `{level.title} · Lv {level.level}`, and each badge's icon (earned = full opacity with `title={label}`, unearned = dimmed `opacity-30`).
  - `WorldMap` gains an optional `hud?: React.ReactNode` prop rendered in its header.
  - `WorldMapScreen` computes global stats from `store.load()` + `nodeCountBySubject` (from its `subjects` prop) and passes a `<Hud .../>` into `WorldMap`.
  - `TreeScreen` accepts a new `nodeCountBySubject: Record<string, number>` prop; its header right side becomes a `<Hud .../>` of GLOBAL stats (computed from `store.load()`); the per-subject `level/xp` span is replaced by the HUD. `tree/[subject]/page.tsx` loads subjects and passes `nodeCountBySubject`.

- [ ] **Step 1: Write the failing Hud test**

Create `src/components/__tests__/Hud.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hud } from '../Hud';
import type { Badge } from '@/domain/progress/badges';

const badges: Badge[] = [
  { id: 'first-steps', label: 'First Steps', icon: '✦', earned: true },
  { id: 'streak-7', label: '7-Day Streak', icon: '🔥', earned: false },
];

describe('Hud', () => {
  it('shows level, xp, streak, and badges', () => {
    render(<Hud level={{ level: 3, title: 'Journeyman' }} xp={620} streak={5} badges={badges} />);
    expect(screen.getByText(/Journeyman/)).toBeInTheDocument();
    expect(screen.getByText(/Lv 3/)).toBeInTheDocument();
    expect(screen.getByText(/620/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByTitle('First Steps')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Hud`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement `Hud`**

Create `src/components/Hud.tsx`:
```tsx
import type { Badge } from '@/domain/progress/badges';

export function Hud({
  level,
  xp,
  streak,
  badges,
}: {
  level: { level: number; title: string };
  xp: number;
  streak: number;
  badges: Badge[];
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-amber-400">🔥 {streak}</span>
      <span className="text-indigo-200">◇ {xp} XP</span>
      <span className="text-amber-300">{level.title} · Lv {level.level}</span>
      <span className="flex items-center gap-1">
        {badges.map((b) => (
          <span key={b.id} title={b.label} className={b.earned ? 'opacity-100' : 'opacity-30'}>
            {b.icon}
          </span>
        ))}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Hud`
Expected: PASS.

- [ ] **Step 5: Add a `hud` slot to WorldMap**

In `src/components/WorldMap.tsx`, extend the props with `hud?: React.ReactNode` and render it in the header:
```tsx
export function WorldMap({ subjects, masteredBySubject, hud }: { subjects: Subject[]; masteredBySubject: Record<string, number>; hud?: React.ReactNode }) {
  // ...
      <header className="relative flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-xl font-bold">Apollearn 11</h1>
          <p className="text-xs text-slate-400">Your learning universe</p>
        </div>
        {hud}
      </header>
  // ...
}
```
(The existing WorldMap test does not pass `hud`; it stays optional and the test still passes.)

- [ ] **Step 6: Wire the HUD into WorldMapScreen**

In `src/app/WorldMapScreen.tsx`, compute global stats and pass a Hud. Use `store.load()` for the full ProgressData, build `nodeCountBySubject` from `subjects`:
```tsx
import { computeGlobalXp, computeLevel } from '@/domain/tree/treeState';
import { computeBadges } from '@/domain/progress/badges';
import { Hud } from '@/components/Hud';
// inside the component, after computing masteredBySubject:
  const hud = useMemo(() => {
    const store = browserStore();
    const data = store.load();
    const nodeCountBySubject = Object.fromEntries(subjects.map((s) => [s.id, s.nodeCount]));
    const xp = computeGlobalXp(data);
    return <Hud level={computeLevel(xp)} xp={xp} streak={data.streak.count} badges={computeBadges(data, nodeCountBySubject)} />;
  }, [subjects]);

  return <WorldMap subjects={subjects} masteredBySubject={masteredBySubject} hud={hud} />;
```

- [ ] **Step 7: Wire the HUD into TreeScreen**

In `src/app/tree/[subject]/page.tsx`, also load subjects and pass `nodeCountBySubject`:
```tsx
import { loadSubjects } from '@/domain/content/subjects';
// inside Page, after loadTree:
  const subjects = loadSubjects(path.join(process.cwd(), 'content'));
  const nodeCountBySubject = Object.fromEntries(subjects.map((s) => [s.id, s.nodeCount]));
  return <TreeScreen tree={tree} todayISO={todayISO} nodeCountBySubject={nodeCountBySubject} />;
```
In `src/app/tree/[subject]/TreeScreen.tsx`:
- Add `nodeCountBySubject: Record<string, number>` to the props.
- Import `computeGlobalXp` (from treeState), `computeBadges`, `Hud`.
- Replace the header right-side per-subject span with a global HUD computed from `store.load()`:
```tsx
  const globalData = store.load();
  const globalXp = computeGlobalXp(globalData);
  // in the header, replace the old <span ...>{level.title} · Lv {level.level} · {xp} XP</span> with:
        <Hud
          level={computeLevel(globalXp)}
          xp={globalXp}
          streak={globalData.streak.count}
          badges={computeBadges(globalData, nodeCountBySubject)}
        />
```
Recompute `globalData` after `complete()` updates progress — simplest: derive it from a state that updates on completion. Since `complete()` already calls `setProgress(...)`, add the global read into the same render by reading `store.load()` during render (it reads localStorage synchronously each render — acceptable for this client screen), OR track a `version` state bumped in `complete()` to force recompute. Use the simplest correct approach: read `store.load()` in render (the component already re-renders after `setProgress`). Keep the per-subject `level`/`xp` variables only if still used elsewhere; otherwise remove them to avoid unused-var lint errors.

- [ ] **Step 8: Update tests touching TreeScreen props**

The TreeScreen integration test renders `<TreeScreen tree={...} todayISO=... />`. Add the new required prop: `nodeCountBySubject={{ networking: 2 }}` (or `{}`), keeping all assertions. The header now shows the global HUD (`🔥`, `◇ XP`, level, badges) instead of the old per-subject span — the test asserts header XP via `within(getByRole('banner')).findByText(/100 XP/i)`; after completing one 100-XP node the GLOBAL xp is also 100, so `/100 XP/` still matches. Confirm; if the format differs (e.g. `◇ 100 XP`), the regex `/100 XP/` still matches the substring. Keep all assertions.

- [ ] **Step 9: Full suite + tsc + build**

Run: `npm test` (all green), `npx tsc --noEmit` (clean), `npm run build` (succeeds).

- [ ] **Step 10: Manual verification**

Run `npm run dev`. The World Map header and the tree header both show the HUD: streak 🔥, total XP ◇, global level/title, and badge icons (earned bright, unearned dim). Completing a node updates the global XP and can light up "First Steps"; finishing the Networking tree lights "Tree Complete".

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: shared global HUD (level, XP, streak, badges) on both screens"
```

---

## Self-Review Notes
- **Spec coverage (3c):** `computeGlobalXp` + global level (Task 2) ✓; badges rule-set (Task 3) ✓; shared HUD on both screens (Task 4) ✓; `browserStore` dedup (Task 1, per 3b review) ✓. 
- **No placeholders:** all functions/components/tests complete.
- **Domain isolation:** `browserStore` (touches `window`) lives in `src/lib/`, not `src/domain/`; `computeGlobalXp`/`computeBadges` are pure domain.
- **Persistence seam:** HUD data derives from `ProgressStore.load()` via the shared `browserStore()`.
- **Type consistency:** `Badge` (Task 3) flows into `Hud` (Task 4); `computeGlobalXp`/`computeLevel` reused; `nodeCountBySubject: Record<string,number>` consistent across page → TreeScreen/WorldMapScreen → computeBadges.
- **Test integrity:** the TreeScreen integration test gets the new required prop; global XP after one 100-XP completion equals 100, so the existing header-XP assertion still holds.
```
