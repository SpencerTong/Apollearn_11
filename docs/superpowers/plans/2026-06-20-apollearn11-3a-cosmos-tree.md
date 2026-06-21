# Apollearn 11 — Plan 3a: Cosmos Skill-Tree + Travel Animation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React Flow skill tree with a custom SVG **constellation** renderer matching the approved cosmos mockups (starfield, gold/indigo glow, curved glowing edges, Boss crown), and add a token that **glides along the path** to a node on select.

**Architecture:** Pure geometry helpers (positions → SVG viewBox %, bezier edge paths, edge/node visual state) under `src/components`, consumed by a presentational `Constellation` component. React Flow is removed entirely. Domain logic untouched.

**Tech Stack:** Next.js 16 + React 19 + TS, Tailwind, `motion` (already installed), Vitest + RTL. No `@xyflow/react`.

## Global Constraints

- **Domain stays framework-free:** no UI imports under `src/domain/**`.
- **Persistence seam unchanged:** `ProgressStore` via `browserStore()` only.
- **Cosmos visual language:** background deep space `#080a18`; node states — mastered = gold `#f59e0b` (glow), available = indigo `#818cf8` (glow + gentle pulse), in-progress = lighter indigo `#a5b4fc`, locked = dim `#334155`. Edges — traveled (both ends mastered) = gold, open (target reachable) = indigo, locked = faint `#2a3160`. Boss node is crowned.
- **Accessibility:** every node is a real `<button>` with its title as the accessible name; reduced-motion is already honored app-wide via `MotionConfig` (Plan 2) — do not regress it.
- **No React Flow:** by end of this plan `@xyflow/react` is uninstalled and unreferenced; the `src/__mocks__/xyflow-react.tsx` mock and its `vitest.config.ts` alias are removed.
- **Don't weaken tests.** Each task ends with `npm test` green; tasks touching pages/build also run `npx tsc --noEmit` and `npm run build`.

---

## File Structure

```
src/components/
  constellationGeometry.ts          # NEW: pure geometry/state helpers (Task 1)
  Constellation.tsx                 # NEW: SVG constellation renderer (Tasks 2-3)
  SkillTree.tsx                     # DELETE (Task 4)
  skillTreeGraph.ts                 # DELETE (replaced by constellationGeometry) (Task 4)
  __tests__/skillTreeGraph.test.ts  # DELETE (Task 4)
  __mocks__/xyflow-react.tsx        # DELETE (Task 4)  (path: src/__mocks__/xyflow-react.tsx)
src/app/tree/[subject]/TreeScreen.tsx  # MODIFY: use Constellation, drop <ul> + React Flow (Task 4)
vitest.config.ts                    # MODIFY: remove @xyflow alias (Task 4)
```

---

### Task 1: Constellation geometry (pure helpers)

**Files:**
- Create: `src/components/constellationGeometry.ts`
- Test: `src/components/__tests__/constellationGeometry.test.ts`

**Interfaces:**
- Consumes: `LoadedTree` (`@/domain/content/types`), `NodeUiState` (`@/domain/tree/treeState`).
- Produces:
  - `interface Bounds { minX: number; minY: number; width: number; height: number }`
  - `computeBounds(tree: LoadedTree, pad?: number): Bounds` — bounding box of all node positions, expanded by `pad` (default 60) on each side; `width`/`height` are never 0 (min 1).
  - `nodePercent(pos: {x:number;y:number}, b: Bounds): { left: number; top: number }` — position as 0–100 percentages within bounds.
  - `edgePathD(from: {x:number;y:number}, to: {x:number;y:number}): string` — a cubic-bezier SVG path `d` in raw tree coords, e.g. `M x1 y1 C cx1 cy1, cx2 cy2, x2 y2` (control points pulled toward the vertical midpoint for a gentle S-curve).
  - `type EdgeVisual = 'traveled' | 'open' | 'locked'`
  - `edgeVisual(fromState: NodeUiState, toState: NodeUiState): EdgeVisual` — `traveled` if both `mastered`; `open` if target is `available`/`in-progress`/`mastered` (reachable) and not both-mastered; else `locked`.
  - `const EDGE_COLORS: Record<EdgeVisual, string>` = `{ traveled: '#f59e0b', open: '#818cf8', locked: '#2a3160' }`.
  - `const NODE_COLORS: Record<NodeUiState, string>` = `{ mastered:'#f59e0b', available:'#818cf8', 'in-progress':'#a5b4fc', locked:'#334155' }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/constellationGeometry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeBounds, nodePercent, edgePathD, edgeVisual, EDGE_COLORS, NODE_COLORS } from '../constellationGeometry';
import type { LoadedTree } from '@/domain/content/types';

const tree: LoadedTree = {
  subject: 'networking', title: 'Networking', bossNodeId: 'c',
  nodes: [
    { id: 'a', position: { x: 100, y: 300 }, prerequisites: [], meta: { id: 'a', title: 'A', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'b', position: { x: 100, y: 200 }, prerequisites: ['a'], meta: { id: 'b', title: 'B', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'c', position: { x: 100, y: 100 }, prerequisites: ['b'], meta: { id: 'c', title: 'C', type: 'lesson-quiz', xp: 200, estMinutes: 5, isBoss: true } },
  ],
};

describe('computeBounds', () => {
  it('bounds cover all nodes plus padding', () => {
    const b = computeBounds(tree, 50);
    expect(b.minX).toBe(50);          // 100 - 50
    expect(b.minY).toBe(50);          // 100 - 50
    expect(b.width).toBe(100);        // (100..100)=0 width +2*50
    expect(b.height).toBe(300);       // (100..300)=200 +2*50
  });
});

describe('nodePercent', () => {
  it('maps a position to 0-100 percentages within bounds', () => {
    const b = computeBounds(tree, 50);
    const p = nodePercent({ x: 100, y: 300 }, b);
    expect(p.left).toBeCloseTo(50);   // (100-50)/100*100
    expect(p.top).toBeCloseTo((300 - 50) / 300 * 100);
  });
});

describe('edgePathD', () => {
  it('starts at the source and ends at the target with a cubic curve', () => {
    const d = edgePathD({ x: 100, y: 300 }, { x: 100, y: 200 });
    expect(d.startsWith('M 100 300')).toBe(true);
    expect(d).toContain('C');
    expect(d.trim().endsWith('100 200')).toBe(true);
  });
});

describe('edgeVisual', () => {
  it('both mastered -> traveled', () => {
    expect(edgeVisual('mastered', 'mastered')).toBe('traveled');
  });
  it('reachable target -> open', () => {
    expect(edgeVisual('mastered', 'available')).toBe('open');
  });
  it('locked target -> locked', () => {
    expect(edgeVisual('available', 'locked')).toBe('locked');
  });
  it('color maps cover all states', () => {
    expect(EDGE_COLORS.traveled).toBe('#f59e0b');
    expect(NODE_COLORS.mastered).toBe('#f59e0b');
    expect(NODE_COLORS.locked).toBe('#334155');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- constellationGeometry`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement**

Create `src/components/constellationGeometry.ts`:
```ts
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

export interface Bounds { minX: number; minY: number; width: number; height: number }

export function computeBounds(tree: LoadedTree, pad = 60): Bounds {
  const xs = tree.nodes.map((n) => n.position.x);
  const ys = tree.nodes.map((n) => n.position.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(1, Math.max(...xs) - Math.min(...xs) + pad * 2);
  const height = Math.max(1, Math.max(...ys) - Math.min(...ys) + pad * 2);
  return { minX, minY, width, height };
}

export function nodePercent(pos: { x: number; y: number }, b: Bounds): { left: number; top: number } {
  return { left: ((pos.x - b.minX) / b.width) * 100, top: ((pos.y - b.minY) / b.height) * 100 };
}

export function edgePathD(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

export type EdgeVisual = 'traveled' | 'open' | 'locked';

export function edgeVisual(fromState: NodeUiState, toState: NodeUiState): EdgeVisual {
  if (fromState === 'mastered' && toState === 'mastered') return 'traveled';
  if (toState === 'available' || toState === 'in-progress' || toState === 'mastered') return 'open';
  return 'locked';
}

export const EDGE_COLORS: Record<EdgeVisual, string> = { traveled: '#f59e0b', open: '#818cf8', locked: '#2a3160' };

export const NODE_COLORS: Record<NodeUiState, string> = {
  mastered: '#f59e0b',
  available: '#818cf8',
  'in-progress': '#a5b4fc',
  locked: '#334155',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- constellationGeometry`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/constellationGeometry.ts src/components/__tests__/constellationGeometry.test.ts
git commit -m "feat: pure constellation geometry helpers"
```

---

### Task 2: Constellation component (starfield + edges + nodes)

**Files:**
- Create: `src/components/Constellation.tsx`
- Test: `src/components/__tests__/Constellation.test.tsx`

**Interfaces:**
- Consumes: geometry from Task 1, `LoadedTree`, `NodeUiState`.
- Produces: `Constellation({ tree, states, selectedId, onSelect }: { tree: LoadedTree; states: Record<string, NodeUiState>; selectedId: string | null; onSelect: (id: string) => void })`.
  - Renders a relative full-size container with a starfield background, an SVG edge layer (`viewBox` = bounds, `preserveAspectRatio="none"`, `pointer-events:none`), and one `<button>` per node positioned by `nodePercent` (transform translate(-50%,-50%)).
  - Each node button: accessible name = node title; `data-state={state}`; `data-boss={String(!!n.meta.isBoss)}`; `data-selected={String(n.id === selectedId)}`; glow via inline `boxShadow`/`background` keyed by `NODE_COLORS[state]`; locked buttons are `disabled`.
  - Each edge: a `<path>` with `d = edgePathD(...)`, `stroke = EDGE_COLORS[edgeVisual(fromState,toState)]`, no fill.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Constellation.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Constellation } from '../Constellation';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

const tree: LoadedTree = {
  subject: 'networking', title: 'Networking', bossNodeId: 'c',
  nodes: [
    { id: 'a', position: { x: 100, y: 300 }, prerequisites: [], meta: { id: 'a', title: 'Packets', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'b', position: { x: 100, y: 200 }, prerequisites: ['a'], meta: { id: 'b', title: 'IP', type: 'lesson-quiz', xp: 100, estMinutes: 5 } },
    { id: 'c', position: { x: 100, y: 100 }, prerequisites: ['b'], meta: { id: 'c', title: 'Subnetting', type: 'lesson-quiz', xp: 200, estMinutes: 5, isBoss: true } },
  ],
};
const states: Record<string, NodeUiState> = { a: 'mastered', b: 'available', c: 'locked' };

describe('Constellation', () => {
  it('renders a button per node with its state', () => {
    render(<Constellation tree={tree} states={states} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Packets' })).toHaveAttribute('data-state', 'mastered');
    expect(screen.getByRole('button', { name: 'IP' })).toHaveAttribute('data-state', 'available');
    expect(screen.getByRole('button', { name: 'Subnetting' })).toHaveAttribute('data-boss', 'true');
  });

  it('locked nodes are disabled and available nodes fire onSelect', async () => {
    const onSelect = vi.fn();
    render(<Constellation tree={tree} states={states} selectedId={null} onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Subnetting' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'IP' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Constellation`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement**

Create `src/components/Constellation.tsx`:
```tsx
'use client';
import type { LoadedTree } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';
import { computeBounds, nodePercent, edgePathD, edgeVisual, EDGE_COLORS, NODE_COLORS } from './constellationGeometry';

export function Constellation({
  tree,
  states,
  selectedId,
  onSelect,
}: {
  tree: LoadedTree;
  states: Record<string, NodeUiState>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const bounds = computeBounds(tree);
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const stateOf = (id: string): NodeUiState => states[id] ?? 'locked';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_70%_90%,#15193a,#080a18_70%)]">
      {/* starfield */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 15% 25%,#ffffff66 50%,transparent),radial-gradient(1px 1px at 60% 15%,#ffffff44 50%,transparent),radial-gradient(1.5px 1.5px at 88% 50%,#ffffff77 50%,transparent),radial-gradient(1px 1px at 40% 70%,#ffffff33 50%,transparent),radial-gradient(1px 1px at 25% 88%,#ffffff55 50%,transparent)',
        }}
      />
      {/* edges */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="none"
      >
        {tree.nodes.flatMap((n) =>
          n.prerequisites.map((p) => {
            const from = byId.get(p);
            if (!from) return null;
            const visual = edgeVisual(stateOf(p), stateOf(n.id));
            return (
              <path
                key={`${p}->${n.id}`}
                d={edgePathD(from.position, n.position)}
                fill="none"
                stroke={EDGE_COLORS[visual]}
                strokeWidth={2}
                opacity={visual === 'locked' ? 0.7 : 0.9}
              />
            );
          }),
        )}
      </svg>
      {/* nodes */}
      {tree.nodes.map((n) => {
        const state = stateOf(n.id);
        const pct = nodePercent(n.position, bounds);
        const color = NODE_COLORS[state];
        const glow = state === 'locked' ? 'none' : `0 0 22px ${color}aa`;
        const isSelected = n.id === selectedId;
        return (
          <button
            key={n.id}
            type="button"
            data-state={state}
            data-boss={String(!!n.meta.isBoss)}
            data-selected={String(isSelected)}
            disabled={state === 'locked'}
            onClick={() => onSelect(n.id)}
            style={{ left: `${pct.left}%`, top: `${pct.top}%`, boxShadow: glow, borderColor: color }}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 ${
              state === 'available' ? 'motion-safe:animate-pulse' : ''
            }`}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-lg"
              style={{
                borderColor: color,
                background: state === 'locked' ? '#11152e' : `${color}22`,
                color: state === 'locked' ? '#5b6390' : '#e8ecff',
                boxShadow: glow,
                outline: isSelected ? '2px solid #fff' : 'none',
                outlineOffset: 3,
              }}
            >
              {n.meta.isBoss ? '👑' : state === 'mastered' ? '✦' : '✧'}
            </span>
            <span className="whitespace-nowrap text-[10px] text-slate-300">{n.meta.title}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Constellation`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Constellation.tsx src/components/__tests__/Constellation.test.tsx
git commit -m "feat: custom SVG constellation renderer (starfield, edges, nodes)"
```

---

### Task 3: Travel token animation

**Files:**
- Modify: `src/components/Constellation.tsx`
- Test: `src/components/__tests__/Constellation.test.tsx` (extend)

**Interfaces:**
- Produces: when `selectedId` refers to a node that has at least one prerequisite, the component renders a glowing **travel token** (`data-testid="travel-token"`) on the incoming edge path (from the node's first prerequisite to the node), animated along the curve via `motion` (`offsetPath` + animate `offsetDistance` 0→100%). When the selected node has no prerequisites (or nothing is selected), no token renders.

- [ ] **Step 1: Write the failing tests**

Append to `Constellation.test.tsx`:
```tsx
  it('renders a travel token to a selected node that has a prerequisite', () => {
    render(<Constellation tree={tree} states={states} selectedId="b" onSelect={() => {}} />);
    expect(screen.getByTestId('travel-token')).toBeInTheDocument();
  });

  it('renders no travel token for a root node or when nothing is selected', () => {
    const { rerender } = render(<Constellation tree={tree} states={states} selectedId="a" onSelect={() => {}} />);
    expect(screen.queryByTestId('travel-token')).not.toBeInTheDocument();
    rerender(<Constellation tree={tree} states={states} selectedId={null} onSelect={() => {}} />);
    expect(screen.queryByTestId('travel-token')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- Constellation`
Expected: FAIL (no travel-token element).

- [ ] **Step 3: Implement the token**

In `Constellation.tsx`, import motion: `import { motion } from 'motion/react';`. After computing the selected node, compute its incoming path and render the token. Add before the closing `</div>`:
```tsx
      {(() => {
        if (!selectedId) return null;
        const node = byId.get(selectedId);
        if (!node || node.prerequisites.length === 0) return null;
        const from = byId.get(node.prerequisites[0]);
        if (!from) return null;
        const d = edgePathD(from.position, node.position);
        return (
          <motion.span
            key={`travel-${selectedId}`}
            data-testid="travel-token"
            className="pointer-events-none absolute h-3 w-3 rounded-full"
            style={{
              offsetPath: `path('${d}')`,
              background: 'radial-gradient(circle,#fff,#a5b4fc)',
              boxShadow: '0 0 14px 4px rgba(165,180,252,0.9)',
            }}
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        );
      })()}
```
Note: the token's `offsetPath` uses raw tree coords; place the token inside the same coordinate context as the SVG by wrapping it so the path coordinates map correctly. Since the SVG uses `preserveAspectRatio="none"` over the full container while `offset-path` uses CSS pixels, exact pixel alignment of the token to the rendered curve may differ from the SVG edge under non-uniform scaling. ACCEPTABLE for this task: the token animates along the curve shape from origin toward the node. If precise alignment is needed, the implementer may render the token as an SVG `<circle>` with `<animateMotion path={d} dur="0.9s" />` INSIDE the existing `<svg>` (which shares the viewBox) instead of a motion.span — this guarantees alignment. Either approach satisfies the tests; prefer the SVG `<animateMotion>` approach for correctness, keeping `data-testid="travel-token"` on the `<circle>`. Respect reduced motion: if using motion.span it inherits the app `MotionConfig`; if using `<animateMotion>`, that's fine to leave (decorative).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- Constellation`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Constellation.tsx src/components/__tests__/Constellation.test.tsx
git commit -m "feat: gliding travel token along the path to a selected node"
```

---

### Task 4: Integrate into TreeScreen + remove React Flow

**Files:**
- Modify: `src/app/tree/[subject]/TreeScreen.tsx`, `vitest.config.ts`, `src/app/tree/__tests__/TreeScreen.test.tsx`
- Delete: `src/components/SkillTree.tsx`, `src/components/skillTreeGraph.ts`, `src/components/__tests__/skillTreeGraph.test.ts`, `src/__mocks__/xyflow-react.tsx`
- Uninstall: `@xyflow/react`

**Interfaces:**
- Consumes: `Constellation` (Tasks 2–3).
- Produces: `TreeScreen` renders `<Constellation tree={tree} states={states} selectedId={selectedId} onSelect={setSelectedId} />` filling the main area (no `aria-hidden`, no `<ul>` legend). All other behavior (detail panel, modal, intro, completion) unchanged.

- [ ] **Step 1: Swap the renderer in TreeScreen**

In `src/app/tree/[subject]/TreeScreen.tsx`:
- Replace the import `import { SkillTree } from '@/components/SkillTree';` with `import { Constellation } from '@/components/Constellation';`.
- Replace the main canvas block (the `aria-hidden` div + the `<ul>` legend) with:
```tsx
        <div className="relative flex-1">
          <Constellation tree={tree} states={states} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
```
  (Remove the surrounding `flex flex-col` wrapper's now-unneeded `<ul>`; keep the detail panel `<NodeDetailPanel .../>` as the right column. The main row stays `flex flex-1 overflow-hidden` with the Constellation div and the panel as the two columns.)

- [ ] **Step 2: Update the TreeScreen integration test to click real nodes**

In `src/app/tree/__tests__/TreeScreen.test.tsx`, the test previously clicked node-list buttons via `getByText('A')`. Now nodes are buttons in the Constellation. Update node selection to `await userEvent.click(screen.getByRole('button', { name: 'A' }))` and the B-unlock step to `await userEvent.click(screen.getByRole('button', { name: 'B' }))`. Keep ALL assertions (intro dismiss first, Learn→quiz me→answer→Submit→Continue, header `100 XP`, B Start enabled, reopen-resets-to-Learn). Note the detail panel shows the selected title in an `<h3>` (not a button), so the node `button` query stays unambiguous.

- [ ] **Step 3: Remove React Flow**

- Delete files: `src/components/SkillTree.tsx`, `src/components/skillTreeGraph.ts`, `src/components/__tests__/skillTreeGraph.test.ts`, `src/__mocks__/xyflow-react.tsx`.
- In `vitest.config.ts`, remove the `@xyflow/react` `resolve.alias` entry (and the explanatory comment). Leave the `@` alias intact.
- Uninstall: `npm uninstall @xyflow/react`.
- Grep to confirm zero references: `grep -rn "xyflow\|SkillTree\|skillTreeGraph\|buildFlowNodes" src` returns nothing.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS (all tests; the deleted skillTreeGraph test is gone, Constellation + geometry tests present). If a test references a removed symbol, fix the test to use the Constellation equivalent — do not weaken assertions.

- [ ] **Step 5: tsc + build**

Run: `npx tsc --noEmit` (clean) and `npm run build` (succeeds; confirm no `@xyflow/react` import errors).

- [ ] **Step 6: Manual verification**

Run `npm run dev`, open `/tree/networking`: the tree renders as a glowing constellation over a starfield — Packets glows gold (mastered) or indigo (available), locked nodes dim, Subnetting crowned. Clicking an available node glides a token to it and opens the detail panel; the full Learn→quiz flow still works; reduced-motion OS setting suppresses the glide.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: render skill tree as cosmos constellation; remove React Flow"
```

---

## Self-Review Notes

- **Spec coverage (3a):** custom SVG constellation replacing React Flow (Tasks 2,4) ✓; starfield + glow + state colors + Boss crown (Task 2) ✓; curved glowing edges by state (Tasks 1–2) ✓; gliding travel token (Task 3) ✓; React Flow + mock removed (Task 4) ✓; accessible node buttons replace the `<ul>` (Tasks 2,4) ✓. Out of scope (3b World Map, 3c global HUD/badges) excluded.
- **No placeholders:** geometry + component code is complete; the travel-token step offers two concrete implementations and mandates the SVG `<animateMotion>` route for alignment correctness — both satisfy the tests.
- **Test integrity:** the TreeScreen integration test changes only the *selectors* (list buttons → node buttons), keeping every assertion; the obsolete skillTreeGraph test is deleted because its subject (React Flow mapping) is removed, replaced by constellationGeometry tests.
- **Type consistency:** `NodeUiState`/`LoadedTree` flow from domain unchanged; `Constellation` props (`tree, states, selectedId, onSelect`) match TreeScreen's state (`selectedId: string | null`, `setSelectedId`).
- **Reduced motion:** preserved via the app-wide `MotionConfig`; available-node pulse uses `motion-safe:` so it's also reduced-motion aware.
```
