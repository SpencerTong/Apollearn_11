# Apollearn 11 — Plan 2: Feel & Learn

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the lesson node teach before it tests (two-phase Learn→Test with rich markdown), add an interaction-animation layer, and show a one-time first-run welcome.

**Architecture:** Builds on Plan 1. Domain logic stays framework-free; new UI deps (`react-markdown`, `motion`) live only in `src/components` / node components. Persistence still flows solely through `ProgressStore`.

**Tech Stack:** Next.js 16 + React 19 + TypeScript, Tailwind, `react-markdown`, `motion` (framer-motion), Vitest + @testing-library/react.

## Global Constraints

- **Domain stays framework-free:** no React/Next/browser/`react-markdown`/`motion` imports under `src/domain/**`.
- **Persistence seam:** all reads/writes still go through `ProgressStore`. No component touches `localStorage` directly except the existing `browserStore()` factory.
- **Do not break existing tests:** the suite is green at 39 tests on entry. Every task ends with the full suite green, `tsc --noEmit` clean, and (for tasks touching pages/build) `npm run build` succeeding.
- **Node-type contract:** node types still run via the registry; the only contract change permitted here is adding an OPTIONAL `isReview?: boolean` to `NodeViewProps`.
- **Reduced motion:** animations must respect `prefers-reduced-motion` (use `motion`'s reduced-motion handling; never gate core functionality on animation).
- **TDD:** behavior changes start with a failing test. Commit after each task.
- **Versions:** use the latest stable `react-markdown` and `motion`. Import paths below assume `react-markdown` v9 (`import ReactMarkdown from 'react-markdown'`, `components` prop, no `className` prop) and `motion` v11+ (`import { motion, AnimatePresence } from 'motion/react'`). If the installed version differs, adapt the import/`prop` shape minimally to compile — do not downgrade.

---

## File Structure

```
src/
  components/
    Markdown.tsx                 # NEW: react-markdown wrapper (Task 2)
    WelcomeIntro.tsx             # NEW: first-run overlay (Task 6)
    NodeDetailPanel.tsx          # MODIFY: motion slide-in (Task 5)
  domain/
    nodes/
      types.ts                   # MODIFY: add isReview? to NodeViewProps (Task 3)
      lessonQuiz/
        LessonQuizNode.tsx       # MODIFY: Learn→Test phases (Task 3), feedback + XP float (Task 4), hover/motion (Task 5)
    progress/
      types.ts                   # MODIFY: add seenIntro to ProgressData (Task 1)
      ProgressStore.ts           # MODIFY: hasSeenIntro/markIntroSeen + normalize (Task 1)
  app/tree/[subject]/
    TreeScreen.tsx               # MODIFY: pass isReview, modal motion, render WelcomeIntro (Tasks 3,5,6)
content/networking/nodes/
    packets.mdx, ip-addressing.mdx, subnetting.mdx   # MODIFY: richer markdown bodies (Task 3)
```

---

### Task 1: Dependencies + ProgressStore intro flag

**Files:**
- Modify: `src/domain/progress/types.ts`, `src/domain/progress/ProgressStore.ts`
- Test: `src/domain/progress/__tests__/ProgressStore.test.ts` (extend)

**Interfaces:**
- Consumes: existing `ProgressData`, `ProgressStore`.
- Produces: `ProgressData` gains `seenIntro: boolean`; `ProgressStore` gains `hasSeenIntro(): boolean` and `markIntroSeen(): void`. `empty()` defaults `seenIntro: false`; `load()` normalization coerces a missing/non-boolean `seenIntro` to `false`.

- [ ] **Step 1: Install dependencies**

Run: `npm install react-markdown motion`

- [ ] **Step 2: Add the field to the type**

In `src/domain/progress/types.ts`, add `seenIntro: boolean;` to `ProgressData`:
```ts
export interface ProgressData {
  subjects: Record<string, SubjectProgress>;
  streak: { count: number; lastActiveISO: string | null };
  seenIntro: boolean;
}
```

- [ ] **Step 3: Write the failing test**

Append to `src/domain/progress/__tests__/ProgressStore.test.ts` inside the `describe('ProgressStore', ...)` block:
```ts
  it('intro is unseen by default and persists once marked', () => {
    const shared = memStorage();
    const a = new ProgressStore(shared);
    expect(a.hasSeenIntro()).toBe(false);
    a.markIntroSeen();
    expect(a.hasSeenIntro()).toBe(true);
    // persists across instances
    expect(new ProgressStore(shared).hasSeenIntro()).toBe(true);
  });

  it('coerces a corrupt seenIntro to false on load', () => {
    const shared = memStorage();
    shared.setItem('apollearn11:progress:v1', JSON.stringify({ subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: 'yes' }));
    expect(new ProgressStore(shared).hasSeenIntro()).toBe(false);
  });
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- ProgressStore`
Expected: FAIL (`hasSeenIntro` is not a function).

- [ ] **Step 5: Implement**

In `src/domain/progress/ProgressStore.ts`:
- Update `empty()`:
```ts
function empty(): ProgressData {
  return { subjects: {}, streak: { count: 0, lastActiveISO: null }, seenIntro: false };
}
```
- In `load()`, after parsing and the existing normalization, force a boolean:
```ts
    data.seenIntro = data.seenIntro === true;
```
(Place this on the normalized `data` object before returning it. If `load()` currently returns `{ ...empty(), ...parsed }` then normalizes, ensure `seenIntro` ends as a strict boolean: `data.seenIntro = parsed.seenIntro === true;`.)
- Add the two methods to the class:
```ts
  hasSeenIntro(): boolean {
    return this.load().seenIntro === true;
  }

  markIntroSeen(): void {
    const data = this.load();
    data.seenIntro = true;
    this.save(data);
  }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- ProgressStore`
Expected: PASS (8 ProgressStore tests).

- [ ] **Step 7: Full suite + commit**

Run: `npm test` (all green), then:
```bash
git add src/domain/progress package.json package-lock.json
git commit -m "feat: ProgressStore intro flag + react-markdown/motion deps"
```

---

### Task 2: Markdown component

**Files:**
- Create: `src/components/Markdown.tsx`
- Test: `src/components/__tests__/Markdown.test.tsx`

**Interfaces:**
- Produces: `Markdown({ children }: { children: string })` — renders a markdown string with a fixed component map (h2/h3, p, ul/ol/li, strong/em, code, a), no raw HTML passthrough. Styled with Tailwind classes suited to a dark UI.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Markdown.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '../Markdown';

describe('Markdown', () => {
  it('renders headings, lists, and bold', () => {
    render(<Markdown>{`## Title\n\n- one\n- two\n\nSome **bold** text.`}</Markdown>);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Markdown`
Expected: FAIL (cannot find module `../Markdown`).

- [ ] **Step 3: Implement**

Create `src/components/Markdown.tsx`:
```tsx
'use client';
import ReactMarkdown from 'react-markdown';

const components = {
  h2: (props: React.ComponentProps<'h2'>) => <h2 className="mt-4 mb-2 text-lg font-semibold text-white" {...props} />,
  h3: (props: React.ComponentProps<'h3'>) => <h3 className="mt-3 mb-1 font-semibold text-slate-100" {...props} />,
  p: (props: React.ComponentProps<'p'>) => <p className="mb-3 leading-relaxed text-slate-300" {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-slate-300" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-slate-300" {...props} />,
  li: (props: React.ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  strong: (props: React.ComponentProps<'strong'>) => <strong className="font-semibold text-white" {...props} />,
  em: (props: React.ComponentProps<'em'>) => <em className="italic" {...props} />,
  code: (props: React.ComponentProps<'code'>) => <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-amber-300" {...props} />,
  a: (props: React.ComponentProps<'a'>) => <a className="text-indigo-300 underline" {...props} />,
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-slate-300">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Markdown`
Expected: PASS.

- [ ] **Step 5: Full suite + commit**

Run: `npm test`, then:
```bash
git add src/components/Markdown.tsx src/components/__tests__/Markdown.test.tsx
git commit -m "feat: Markdown rendering component (react-markdown)"
```

---

### Task 3: Learn → Test two-phase flow + richer content

**Files:**
- Modify: `src/domain/nodes/types.ts` (add `isReview?`), `src/domain/nodes/lessonQuiz/LessonQuizNode.tsx`, `src/app/tree/[subject]/TreeScreen.tsx` (pass `isReview`)
- Modify content: `content/networking/nodes/packets.mdx`, `ip-addressing.mdx`, `subnetting.mdx`
- Test: `src/domain/nodes/lessonQuiz/__tests__/LessonQuizNode.test.tsx` (extend)

**Interfaces:**
- Consumes: `Markdown` (Task 2), `scoreQuiz`/`lessonQuizXp` (Plan 1).
- Produces: `NodeViewProps` gains `isReview?: boolean`. `LessonQuizNode` renders a Learn phase first (body via `Markdown` + "Got it — quiz me ▸"), then the Test phase (questions + Submit). When `isReview` is true, the Learn phase also shows a "Skip to quiz" button. `onComplete` payload is unchanged. `TreeScreen` passes `isReview={states[selected.id] === 'mastered'}` to the rendered node Component.

- [ ] **Step 1: Add the optional prop to the contract**

In `src/domain/nodes/types.ts`, add `isReview?: boolean;` to `NodeViewProps`:
```ts
export interface NodeViewProps {
  node: NodeMeta;
  onComplete: (result: { score: number; passed: boolean; xp: number }) => void;
  isReview?: boolean;
}
```

- [ ] **Step 2: Write the failing tests**

Replace the body of `src/domain/nodes/lessonQuiz/__tests__/LessonQuizNode.test.tsx` describe block with these (keep the existing imports + `node` fixture; the fixture must have a `body` and at least one question):
```tsx
  it('starts on the Learn phase showing the body, not the questions', () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} />);
    expect(screen.getByText(/unit of data/i)).toBeInTheDocument();
    expect(screen.queryByText(/What is a packet/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quiz me/i })).toBeInTheDocument();
  });

  it('advances to the Test phase and completes with a passing result', async () => {
    const onComplete = vi.fn();
    render(<LessonQuizNode node={node} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /quiz me/i }));
    expect(screen.getByText(/What is a packet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Data unit/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1, passed: true, xp: 100 });
  });

  it('offers Skip to quiz when reviewing a mastered node', async () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} isReview />);
    await userEvent.click(screen.getByRole('button', { name: /skip to quiz/i }));
    expect(screen.getByText(/What is a packet/i)).toBeInTheDocument();
  });

  it('does NOT offer Skip to quiz for a non-review node', () => {
    render(<LessonQuizNode node={node} onComplete={() => {}} />);
    expect(screen.queryByRole('button', { name: /skip to quiz/i })).not.toBeInTheDocument();
  });
```
Ensure the `node` fixture has `body: 'A packet is a unit of data.'` and the question with choice `Data unit` (as in the Plan 1 test).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- LessonQuizNode`
Expected: FAIL (no "quiz me" button; questions render immediately).

- [ ] **Step 4: Implement the two-phase node**

Replace `src/domain/nodes/lessonQuiz/LessonQuizNode.tsx`:
```tsx
'use client';
import { useState } from 'react';
import type { NodeViewProps } from '@/domain/nodes/types';
import { scoreQuiz, lessonQuizXp } from './logic';
import { Markdown } from '@/components/Markdown';

export function LessonQuizNode({ node, onComplete, isReview }: NodeViewProps) {
  const questions = node.questions ?? [];
  const [phase, setPhase] = useState<'learn' | 'test'>('learn');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  function submit() {
    const result = scoreQuiz(questions, answers);
    onComplete({ score: result.ratio, passed: result.passed, xp: lessonQuizXp(node, result.ratio) });
  }

  if (phase === 'learn') {
    return (
      <div className="space-y-5">
        {node.body && <Markdown>{node.body}</Markdown>}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPhase('test')}
            className="rounded-xl bg-amber-400 px-5 py-2 font-bold text-amber-950"
          >
            Got it — quiz me ▸
          </button>
          {isReview && (
            <button type="button" onClick={() => setPhase('test')} className="text-sm text-slate-400 underline">
              Skip to quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

- [ ] **Step 5: Pass `isReview` from TreeScreen**

In `src/app/tree/[subject]/TreeScreen.tsx`, where the node Component is rendered in the modal, pass the review flag:
```tsx
            <RunComponent node={selected.meta} onComplete={complete} isReview={states[selected.id] === 'mastered'} />
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- LessonQuizNode`
Expected: PASS (the 4 phase tests). Then `npm test -- TreeScreen` to confirm the integration test still passes (it clicks through Learn→Test now — if the integration test clicks Start then expects the quiz directly, update it to first click "quiz me"; keep all assertions).

- [ ] **Step 7: Write richer Networking content**

Replace the body (below the frontmatter `---`) of each file with real markdown. Keep each file's existing frontmatter unchanged.

`content/networking/nodes/packets.mdx` body:
```mdx
## What is a packet?

When you send data across a network, it isn't sent as one big blob. It's chopped
into small units called **packets**.

Each packet carries two things:

- **Header** — control info: where it's from, where it's going, and its order.
- **Payload** — a slice of the actual data.

### Why split data up?

- **Resilience** — if one packet is lost, only that piece is re-sent.
- **Efficiency** — packets from many conversations share the same links.
- **Routing** — each packet can take the best available path independently.

You now know the unit every network is built on. Prove it below.
```

`content/networking/nodes/ip-addressing.mdx` body:
```mdx
## Finding a device: IP addresses

For a packet to reach the right machine, that machine needs an address. That's an
**IP address** — a number identifying a device on a network.

### IPv4 in one minute

- An IPv4 address is **32 bits**, written as four octets: `192.168.1.10`.
- Each octet is 0–255 (8 bits).
- Some ranges are **private** (like `192.168.x.x`) and used inside home/office
  networks; others are **public** and routable across the internet.

Addresses are how routers know where to forward each packet. Ready to test it?
```

`content/networking/nodes/subnetting.mdx` body:
```mdx
## Splitting a network: subnetting

A single network can be carved into smaller pieces called **subnets**. This keeps
traffic local, improves security, and uses address space efficiently.

### Subnet masks

A **subnet mask** marks which bits of an address are the *network* part versus the
*host* part.

- `/24` means the first 24 bits are the network → up to 254 hosts.
- A smaller host portion = fewer devices but more subnets.

This is the boss of the Networking tree — pass it to master the basics.
```

- [ ] **Step 8: Full suite + tsc + commit**

Run: `npm test` (all green), `npx tsc --noEmit` (clean), then:
```bash
git add src/domain/nodes src/app/tree content/networking
git commit -m "feat: two-phase Learn->Test node flow with rich markdown content"
```

---

### Task 4: Answer feedback + XP float

**Files:**
- Modify: `src/domain/nodes/lessonQuiz/LessonQuizNode.tsx`
- Test: `src/domain/nodes/lessonQuiz/__tests__/LessonQuizNode.test.tsx` (extend)

**Interfaces:**
- Produces: after Submit, the Test phase enters a `submitted` state that (a) marks each choice as correct/incorrect/chosen via stable hooks, and (b) on a passing result shows a "+<xp> XP" float element (`data-testid="xp-float"`). A "Continue" button then fires `onComplete` (so the user sees feedback before the modal closes). `onComplete` payload unchanged.

- [ ] **Step 1: Write the failing tests**

Append to the LessonQuizNode test describe:
```tsx
  it('shows per-answer feedback and an XP float after submitting a pass, then continues', async () => {
    const onComplete = vi.fn();
    render(<LessonQuizNode node={node} onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /quiz me/i }));
    await userEvent.click(screen.getByRole('button', { name: /Data unit/i }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    // feedback shown, onComplete NOT called yet
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByTestId('xp-float')).toHaveTextContent('100');
    // the correct choice is marked
    expect(screen.getByRole('button', { name: /Data unit/i })).toHaveAttribute('data-correct', 'true');
    // continue fires onComplete
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onComplete).toHaveBeenCalledWith({ score: 1, passed: true, xp: 100 });
  });
```
Adjust the earlier "advances to the Test phase and completes" test from Task 3: it must now click **Submit** then **Continue** before asserting `onComplete` (since submit shows feedback first). Keep its assertions.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- LessonQuizNode`
Expected: FAIL (no `xp-float`, no `data-correct`, onComplete fires on submit not continue).

- [ ] **Step 3: Implement feedback + float**

Update the Test-phase render in `LessonQuizNode.tsx`. Add state and split submit/continue:
```tsx
  const [submitted, setSubmitted] = useState(false);
  const result = scoreQuiz(questions, answers);

  function onSubmit() {
    setSubmitted(true);
  }
  function onContinue() {
    onComplete({ score: result.ratio, passed: result.passed, xp: lessonQuizXp(node, result.ratio) });
  }
```
For each choice button, when `submitted`, set `data-correct={String(i === q.answerIndex)}` and style: correct → green border/bg; chosen-but-wrong → red. The choices become non-interactive after submit (`disabled={submitted}`). After the questions:
```tsx
      {!submitted ? (
        <button type="button" onClick={onSubmit} className="rounded-xl bg-amber-400 px-5 py-2 font-bold text-amber-950">
          Submit
        </button>
      ) : (
        <div className="space-y-3">
          {result.passed && (
            <div data-testid="xp-float" className="text-lg font-bold text-amber-300">
              +{lessonQuizXp(node, result.ratio)} XP
            </div>
          )}
          <p className="text-slate-300">
            {result.passed ? 'Nailed it!' : `You got ${result.correct}/${result.total}. Review and try again.`}
          </p>
          <button type="button" onClick={onContinue} className="rounded-xl bg-amber-400 px-5 py-2 font-bold text-amber-950">
            Continue ▸
          </button>
        </div>
      )}
```
(The full-file replacement should integrate this with the Task 3 structure. Keep the Learn phase unchanged. Move `const result = scoreQuiz(...)` so it is computed from current `answers` for the feedback render.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- LessonQuizNode`
Expected: PASS.

- [ ] **Step 5: Update the TreeScreen integration test if needed**

The TreeScreen integration flow now ends Submit → Continue. Update `src/app/tree/__tests__/TreeScreen.test.tsx`: after clicking the answer and Submit, click **Continue** before asserting the header XP. Keep all existing assertions (XP in header, B unlocks).

Run: `npm test -- TreeScreen`
Expected: PASS.

- [ ] **Step 6: Full suite + tsc + commit**

Run: `npm test`, `npx tsc --noEmit`, then:
```bash
git add src/domain/nodes src/app/tree
git commit -m "feat: answer feedback and XP float before continuing"
```

---

### Task 5: Motion interaction layer

**Files:**
- Modify: `src/components/NodeDetailPanel.tsx`, `src/domain/nodes/lessonQuiz/LessonQuizNode.tsx`, `src/app/tree/[subject]/TreeScreen.tsx`
- No new behavior test (animation is visual); existing tests must stay green.

**Interfaces:**
- Produces: visual-only motion. The DOM structure and all roles/text/test hooks used by existing tests must remain queryable (motion renders normal DOM in jsdom).

- [ ] **Step 1: Animate the detail panel**

In `NodeDetailPanel.tsx`, wrap the returned `<aside>` content in a `motion.aside` that fades + slides in:
```tsx
import { motion } from 'motion/react';
// ...
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="w-64 border-l border-slate-800 bg-slate-900/80 p-5 text-slate-200"
    >
      {/* same inner content as before */}
    </motion.aside>
  );
```
Keep `if (!node) return null;` and all inner markup/labels identical.

- [ ] **Step 2: Animate the modal and Learn↔Test transition**

In `TreeScreen.tsx`, wrap the modal overlay/content with `AnimatePresence` + `motion.div` (fade backdrop, scale-in panel). Keep the `{running && selected && RunComponent && (...)}` condition and all inner content/roles unchanged:
```tsx
import { AnimatePresence, motion } from 'motion/react';
// ...
      <AnimatePresence>
        {running && selected && RunComponent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
              initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-4 text-xl font-bold">{selected.meta.title}</h2>
              <RunComponent node={selected.meta} onComplete={complete} isReview={states[selected.id] === 'mastered'} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
```

- [ ] **Step 3: Add hover lift to answer choices and the node-list buttons**

In `LessonQuizNode.tsx`, make each choice a `motion.button` with `whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}` (only when not submitted). Keep `type`, `onClick`, `aria-pressed`, `data-correct`, text, and `key` exactly as before so tests still match.

- [ ] **Step 4: Run the FULL suite to confirm nothing broke**

Run: `npm test`
Expected: PASS (all tests — motion renders standard DOM in jsdom, so role/text/testid queries still resolve). If any test fails because an element is no longer found, the motion wrapper changed the markup — fix the wrapper to preserve the original element/attributes; do not weaken tests.

- [ ] **Step 5: tsc + build + commit**

Run: `npx tsc --noEmit` (clean), `npm run build` (succeeds), then:
```bash
git add src/components src/domain/nodes src/app/tree
git commit -m "feat: motion interaction layer (panel, modal, hover)"
```

---

### Task 6: First-run welcome overlay

**Files:**
- Create: `src/components/WelcomeIntro.tsx`
- Modify: `src/app/tree/[subject]/TreeScreen.tsx` (show it once)
- Test: `src/components/__tests__/WelcomeIntro.test.tsx`

**Interfaces:**
- Consumes: nothing from the store directly — `WelcomeIntro` is presentational.
- Produces: `WelcomeIntro({ onDismiss }: { onDismiss: () => void })` — an overlay with a heading, ~3 cards describing the loop (Pick → Learn → Prove → Level up), and a "Start learning" button that calls `onDismiss`. `TreeScreen` renders it only when `!store.hasSeenIntro()`, and on dismiss calls `store.markIntroSeen()` and hides it.

- [ ] **Step 1: Write the failing component test**

Create `src/components/__tests__/WelcomeIntro.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeIntro } from '../WelcomeIntro';

describe('WelcomeIntro', () => {
  it('shows the loop and fires onDismiss on Start', async () => {
    const onDismiss = vi.fn();
    render(<WelcomeIntro onDismiss={onDismiss} />);
    expect(screen.getByText(/welcome to apollearn/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- WelcomeIntro`
Expected: FAIL (cannot find module `../WelcomeIntro`).

- [ ] **Step 3: Implement `WelcomeIntro`**

Create `src/components/WelcomeIntro.tsx`:
```tsx
'use client';
import { motion } from 'motion/react';

const STEPS = [
  { icon: '✦', title: 'Pick a node', body: 'Choose a glowing node on the tree.' },
  { icon: '📖', title: 'Learn', body: 'Read a short explainer of the concept.' },
  { icon: '✓', title: 'Prove it', body: 'Pass a quick quiz to master the node.' },
  { icon: '⚡', title: 'Level up', body: 'Earn XP and unlock the next nodes.' },
];

export function WelcomeIntro({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-200"
      >
        <h2 className="mb-1 text-2xl font-bold text-white">Welcome to Apollearn 11</h2>
        <p className="mb-5 text-sm text-slate-400">Level up the subjects you want to learn. Here&apos;s the loop:</p>
        <ul className="mb-6 grid grid-cols-2 gap-3">
          {STEPS.map((s) => (
            <li key={s.title} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <div className="text-xl">{s.icon}</div>
              <div className="font-semibold text-white">{s.title}</div>
              <div className="text-xs text-slate-400">{s.body}</div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onDismiss} className="w-full rounded-xl bg-amber-400 px-4 py-2.5 font-bold text-amber-950">
          Start learning ▸
        </button>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- WelcomeIntro`
Expected: PASS.

- [ ] **Step 5: Wire it into TreeScreen (shown once)**

In `src/app/tree/[subject]/TreeScreen.tsx`, add state initialized from the store and render the overlay:
```tsx
  const [showIntro, setShowIntro] = useState(() => !store.hasSeenIntro());

  function dismissIntro() {
    store.markIntroSeen();
    setShowIntro(false);
  }
```
And in the returned JSX (e.g. just before the modal `AnimatePresence`):
```tsx
      {showIntro && <WelcomeIntro onDismiss={dismissIntro} />}
```
Import `WelcomeIntro` at the top. Note: `store` is created via `useMemo(browserStore, [])`, so `hasSeenIntro()` reads localStorage on mount (client component) — acceptable.

- [ ] **Step 6: Extend the TreeScreen integration test to dismiss the intro**

Because the intro now overlays on first render in tests (localStorage is cleared in `beforeEach`), the existing TreeScreen test must dismiss it first. At the start of the test body, add:
```tsx
    await userEvent.click(screen.getByRole('button', { name: /start learning/i }));
```
Keep every existing assertion. Run: `npm test -- TreeScreen` → PASS.

- [ ] **Step 7: Full suite + tsc + build + commit**

Run: `npm test` (all green), `npx tsc --noEmit` (clean), `npm run build` (succeeds), then:
```bash
git add src/components src/app/tree
git commit -m "feat: first-run welcome intro shown once via ProgressStore"
```

- [ ] **Step 8: Manual verification**

Run `npm run dev`. On first load (clear localStorage / new private window): the welcome overlay appears; "Start learning" dismisses it and it doesn't return on reload. Click a node → panel slides in → Start → modal scales in on the **Learn** screen with formatted content → "Got it — quiz me" → answer → Submit shows feedback + "+XP" → Continue closes, header XP rises, node masters, next unlocks. Re-open a mastered node → "Skip to quiz" is offered.

---

## Self-Review Notes

- **Spec coverage:** Learn→Test two-phase (Task 3) ✓; rich markdown rendering + content (Tasks 2–3) ✓; skip-to-quiz for review (Task 3) ✓; `isReview` contract addition (Task 3) ✓; answer feedback + XP float (Task 4) ✓; motion select/panel/modal/hover (Task 5) ✓; first-run welcome persisted via ProgressStore (Tasks 1, 6) ✓. Non-goals (cosmos theme, World Map, global level/badges, AI CLI, deploy) correctly excluded.
- **Persistence seam:** intro flag lives in `ProgressData` and is accessed only through `ProgressStore` (Task 1); `TreeScreen` uses the existing `browserStore()` factory — no new `localStorage` touch.
- **Domain isolation:** `react-markdown` and `motion` appear only in `src/components` and the node component — never under `src/domain/**` logic files (`types.ts` only adds an optional boolean and imports no framework runtime).
- **Test integrity:** flow changes (Submit→Continue, intro overlay) are reflected by UPDATING the integration test's interaction steps, never by weakening assertions. Animation tasks add no assertions but must keep the full suite green.
- **Type consistency:** `NodeViewProps.isReview?` (Task 3) is consumed by `LessonQuizNode` and passed by `TreeScreen`; `ProgressData.seenIntro` (Task 1) is read/written only via `hasSeenIntro`/`markIntroSeen`.
```
