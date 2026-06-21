# Apollearn 11 — Plan 2 "Feel & Learn" · Design Spec

**Date:** 2026-06-20
**Status:** Approved (design), pending plan
**Builds on:** Plan 1 (foundation) — see `2026-06-19-apollearn11-foundation.md`

---

## 1. Summary

Make the existing playable tree *feel good to use* and *teach before it tests*.
Three threads:

1. **Learn → Test node flow** — a lesson node becomes two phases: a formatted
   Learn screen, then the quiz. Mastered nodes can skip to the quiz for review.
2. **Interaction feel** — smooth selection/panel/modal animations, hover states,
   answer feedback, and a floating "+XP" on success (interaction polish, not the
   full cosmos theme).
3. **First-run app intro** — a small one-time welcome that orients the user to the
   loop (pick → learn → prove → level up).

This is the moment-to-moment payoff the user asked for. It does NOT include the
full cosmos visual theme or the World Map (those remain Plan 3).

## 2. Goals / Non-Goals

### Goals
- Two-phase Learn→Test inside the lesson node, with "Skip to quiz" for review.
- Rich, properly-rendered markdown lesson content (headings, lists, bold, code).
- Meaningfully richer explainer text for the 3 existing Networking nodes.
- A small, well-scoped animation layer for select / panel / modal / answer feedback / XP float.
- A one-time first-run welcome overlay, persisted via the existing `ProgressStore` seam.

### Non-Goals (later plans)
- Full cosmos visual theme: starfield, gold/indigo glow, World Map galaxies, gliding-token travel animation (Plan 3).
- Global level across trees, streak UI, badges (Plan 3).
- AI authoring CLI (Plan 4). Deploy (Plan 5).
- Sound/haptics/confetti (possible future; out of scope now).

## 3. New Dependencies
- **`react-markdown`** — render the existing MDX `body` string as formatted content (no new content format; no MDX/JSX compilation needed).
- **`motion`** (formerly framer-motion) — the React animation standard; used for select/panel/modal transitions, hover, answer feedback, XP float.

## 4. Design Detail

### 4.1 Learn → Test flow
- `LessonQuizNode` gains an internal phase: `'learn' | 'test'`.
- **Learn phase:** renders the node's `body` via a `Markdown` component; primary
  button **"Got it — quiz me ▸"** advances to `test`.
- **Test phase:** the existing questions UI, plus per-answer feedback after submit.
- **Review:** when the node is already mastered, the Learn phase shows a secondary
  **"Skip to quiz"** action. The node receives a new prop to know this.
- **Contract change:** `NodeViewProps` gains `isReview?: boolean` (true when the
  node's state is `mastered`). `TreeScreen` passes `states[id] === 'mastered'`.
  The registry's `isComplete`/`xpAwarded` are unaffected.

### 4.2 Markdown rendering
- A small `Markdown` component (`src/components/Markdown.tsx`) wraps
  `react-markdown` with a fixed, safe component map (headings, p, ul/ol/li,
  strong/em, code, a). Used by the Learn phase. No raw HTML passthrough.

### 4.3 Animation layer (`motion`)
- **Node select:** detail panel slides/fades in (panel wrapped in `motion`).
- **Hover:** nodes and answer choices lift subtly.
- **Modal:** the node modal fades + scales in/out; Learn↔Test transition is animated.
- **Answer feedback:** after submit, correct choices pulse green, wrong shake + the
  correct one is revealed. The *logical* feedback state (which choice is correct/
  chosen) is set in component state so it is testable; `motion` only animates it.
- **XP float:** on a passing result, a "+<xp> XP" element floats up and fades.
- Respects `prefers-reduced-motion` (motion's reduced-motion support).

### 4.4 First-run welcome
- `WelcomeIntro` component: a small overlay with ~3 cards summarizing the loop;
  a "Start learning" button dismisses it.
- Persistence: `ProgressStore` gains `hasSeenIntro()` and `markIntroSeen()`,
  backed by a `seenIntro: boolean` field on `ProgressData` (the single seam).
- Shown by `TreeScreen` (or app shell) only when `!hasSeenIntro()`.

## 5. Testing Strategy
- **Pure/logic (full TDD):** `ProgressStore` intro flag (seen/mark/persist).
- **Component (RTL):** `Markdown` renders headings/lists; `LessonQuizNode`
  phase transitions (starts on Learn, body shown not questions; advance shows
  questions; review → skip-to-quiz; onComplete still fires correct payload);
  answer-feedback state after submit; `WelcomeIntro` shows when unseen, hides on
  dismiss.
- **Animations:** not asserted pixel-wise; tests assert the underlying logical
  state and that wrapped components still render/behave. `motion` is allowed in
  components (not in `src/domain/**`).
- **Build gates:** `npm test`, `tsc --noEmit`, `npm run build` all green.

## 6. Roadmap After This
- Plan 3: full cosmos theme + World Map + global level/streak/badges + travel animation.
- Plan 4: AI authoring CLI. Plan 5: deploy to Vercel.
