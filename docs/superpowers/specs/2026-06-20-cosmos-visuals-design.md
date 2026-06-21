# Apollearn 11 — Plan 3 "Cosmos Visuals" · Design Spec

**Date:** 2026-06-20
**Status:** Approved (design), executing in three sub-plans
**Builds on:** Plans 1 & 2.

---

## 1. Summary

Deliver the visual payoff approved in the earlier mockup brainstorm: the elegant
**cosmos** aesthetic, the **constellation** skill tree you climb, the
**gliding-token travel** animation, the **galaxy World Map**, and the cross-cutting
**global progression HUD** (level / streak / badges).

Decision (confirmed): the skill tree is rendered with a **custom SVG constellation
renderer**, replacing React Flow — for aesthetic fidelity, full control of the
travel animation, and to drop the React Flow Pro-attribution + jsdom-mock baggage.

Executed in three sub-plans:

- **3a — Cosmos skill-tree + travel animation** (custom SVG renderer).
- **3b — World Map** (galaxy universe, ignite/dormant subjects, aurora paths).
- **3c — Global progression + HUD** (`computeGlobalXp`, global level, streak, badges).

## 2. Visual Language (from the approved mockups)
- **Theme:** deep-space background, **indigo + gold** accents, soft glow, rounded
  refined nodes. Warm but premium ("elegant-leaning cosmos").
- **Node states:** mastered = **gold** (glow), available = **indigo** (glow + gentle
  pulse), in-progress = lighter indigo, locked = **dim/slate**. Boss node = crowned.
- **Edges:** traveled = solid gold; available route = indigo; locked = faint.
- **Travel:** selecting a reachable node glides a glowing **token along the path
  curve** from the prior node; available nodes pulse; respects reduced-motion.
- **World Map:** subjects are galaxies; started ones glow with a progress ring +
  mini-constellation; backlog subjects are dormant stars that **ignite** when begun;
  inter-galaxy paths are **aurora ribbons** with an occasional comet.

## 3. Sub-Plan 3a — Cosmos skill-tree + travel (this plan's first build)

### Scope
- A **custom SVG/HTML constellation renderer** replacing `SkillTree` (React Flow).
- Starfield background; curved glowing **bezier edges** colored by state; nodes as
  **accessible buttons** styled per state with the cosmos look; **Boss crown**.
- **Travel token** that glides along the path from the previously-selected node to
  the newly-selected node on select (motion; reduced-motion aware).
- Restyle the tree screen shell + node detail panel to the cosmos theme.
- **Remove** the `@xyflow/react` dependency, its import, the vitest mock, and the
  accessibility `<ul>` legend (real node buttons replace it).

### Pure geometry (testable)
- `constellationGeometry.ts`: map tree node `{x,y}` positions into an SVG viewBox;
  build **bezier path strings** between prerequisite→node; classify each edge's
  visual state from node states. Pure functions, fully unit-tested.

### Non-goals for 3a
- World Map (3b); global level/streak/badges (3c). Keep the existing per-subject
  header for now.

## 4. Sub-Plan 3b — World Map (later)
- `/` (or `/map`) renders the galaxy universe: one galaxy per subject from a
  subjects registry; started galaxies show progress; backlog (Finance, AWS, Linear
  Optimization) are dormant/ignitable; aurora-ribbon paths; click → `/tree/<id>`.
- A `subjects` registry (file-based) listing available + backlog subjects.

## 5. Sub-Plan 3c — Global progression + HUD (later)
- `computeGlobalXp(ProgressData)` + global level; a shared **HUD** (global level,
  total XP, streak 🔥, badges) shown on both screens.
- Badges: a small rule set (e.g. "finish a tree", "7-day streak") computed from
  `ProgressData`; a badges display. Streak UI surfacing the existing streak data.

## 6. Testing & Gates
- Pure geometry + progression: full TDD.
- Components (now jsdom-friendly without React Flow): RTL for node render, state
  classes/data-attrs, click→select, World Map galaxy render/navigation, HUD values.
- Animations asserted by logical state, not pixels; reduced-motion honored via the
  existing app-wide `MotionConfig`.
- Each task: `npm test` green, `tsc --noEmit` clean, `npm run build` succeeds.
