# Final Review Fixes Report

## Fix 1 — Validate node frontmatter in the content loader

**Files touched:**
- `src/domain/content/validateNodeMeta.ts` (new) — `validateNodeMeta(id, data)` checks title, type, xp, estMinutes, and questions array items
- `src/domain/content/loadTree.ts` — after parsing each node's frontmatter, collects problems and throws with aggregated message
- `src/domain/content/__fixtures__/malformed/tree.json` (new) — single-node fixture tree
- `src/domain/content/__fixtures__/malformed/nodes/bad-node.mdx` (new) — missing `xp`, `answerIndex` as string
- `src/domain/content/__tests__/loadTree.test.ts` — added test: `loadTree(root, 'malformed')` throws `'Invalid node frontmatter'`

## Fix 2 — Shape-normalize parsed progress in ProgressStore.load()

**Files touched:**
- `src/domain/progress/ProgressStore.ts` — added `normalizeProgressData()` helper; replaces the previous `{ ...empty(), ...JSON.parse(raw) }` spread; coerces each node's status (default `'not-started'`), xpEarned and bestScore (default 0 via `Number.isFinite`), and streak.count (default 0)
- `src/domain/progress/__tests__/ProgressStore.test.ts` — added test: corrupt blob `{"subjects":{"net":{"nodes":{"a":{"status":"weird"}}}},"streak":{}}` yields `status === 'not-started'`, `xpEarned === 0`, `getStreak().count === 0`

## Fix 3 — Guard streak against non-positive day-diff (clock rollback)

**Files touched:**
- `src/domain/progress/ProgressStore.ts` — added `diff < 0` branch before `diff === 0`; when diff is negative, does nothing (no count or lastActiveISO change)
- `src/domain/progress/__tests__/ProgressStore.test.ts` — added test: completion on `2026-06-19`, then `2026-06-17`, leaves count=1 and lastActiveISO=`'2026-06-19'`

## Fix 4 — Remove the React Flow Pro-only attribution flag

**Files touched:**
- `src/components/SkillTree.tsx` — removed `proOptions={{ hideAttribution: true }}` from `<ReactFlow>` props

## Fix 5 — Extract SkillTree's graph mapping into a pure, tested helper

**Files touched:**
- `src/components/skillTreeGraph.ts` (new) — exports `NODE_COLORS`, `buildFlowNodes()`, `buildFlowEdges()` as pure functions
- `src/components/SkillTree.tsx` — imports and uses `buildFlowNodes`/`buildFlowEdges`; removed inline COLORS map and mapping logic
- `src/components/__tests__/skillTreeGraph.test.ts` (new) — 6 pure unit tests: mastered→gold, locked→dim, missing state→locked, label check, edge source/target, no-prereq node produces no edges
- `vitest.config.ts` — added one-line comment explaining the `@xyflow/react` mock is intentional; canvas mapping is covered by skillTreeGraph tests

## Fix 6 — Remove the dead `submitted` field

**Files touched:**
- `src/domain/nodes/types.ts` — removed `submitted: boolean` from `NodeRuntimeState`; verified no other file referenced `.submitted`

## Final Results

- **Full suite:** 10 test files, 39 tests — all passed
- **TypeScript (`npx tsc --noEmit`):** Clean (no errors)
- **Build (`npm run build`):** Compiled successfully; all static and dynamic routes generated
