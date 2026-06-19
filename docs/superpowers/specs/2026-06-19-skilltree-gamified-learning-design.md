# Apollearn 11 — Gamified Learning App · Design Spec

**Date:** 2026-06-19
**Status:** Draft for review
**Name:** Apollearn 11 (Apollo + learn; "11" nods to Apollo 11 — fits the cosmos theme)

---

## 1. Summary

Apollearn 11 is a single-player, web-based learning app that turns topics the user
wants to learn (starting with **Networking**) into **RPG-style skill trees** you
level up. Each subject is a tree of nodes; completing a node earns XP, raises the
subject's level, and unlocks neighboring nodes. New subjects are added over time.

The app is designed to be **genuinely useful to the user first**, with enough
craft and polish to be a **portfolio-worthy** showcase.

**Primary goal:** "Good enough that I'd actually open it at night to learn,
polished enough that I'd be proud to show it."

---

## 2. Goals & Non-Goals

### Goals
- A mastery/RPG progression experience: XP, levels, skill trees, unlock gating.
- An **extensible content engine** — adding a new topic is dropping in content
  files, not changing code.
- A **pluggable node-type system** so most nodes use a reliable default loop, but
  special nodes (interactive sims, AI tutor) can slot in for variety.
- An **AI-assisted authoring pipeline** that drafts content files for the user to
  edit (the user stays editor-in-chief).
- A distinctive, polished **"cosmos" aesthetic** with game-like motion.
- Deployed to a live, shareable URL.

### Non-Goals (deferred, not part of v1)
- Multi-user accounts, auth, cloud sync, leaderboards (the "real product" path).
- `flashcards` and `ai-tutor` node types (architecture supports them; built later).
- In-app content editor GUI.
- Mobile-native apps (responsive web is enough).

---

## 3. Core Concept & Information Architecture

Three nested levels, each with the same "travel between glowing nodes" metaphor:

```
World Map  (universe of subjects, each a "galaxy")
   └── Skill Tree  (one subject, a "constellation" you climb)
          └── Node  (one typed learning activity)
```

- **World Map** — every subject is a galaxy. Started subjects are full, glowing
  galaxies with a progress ring + mini-constellation preview; backlog subjects
  are dormant stars that "ignite" into a galaxy when begun. A faint "+ new
  subject" nebula hints at growth.
- **Skill Tree** — a constellation you climb from the bottom (first node) up to a
  **Boss node** at the top that tests the whole tree. Nodes show state via color.
- **Node** — a typed learning activity (see §5).

---

## 4. Architecture & Stack

**Approach:** Polished single-player, file-based (no backend in v1).

- **Framework:** Next.js (App Router) + TypeScript
- **Styling/components:** Tailwind CSS + shadcn/ui (assemble polished components
  rather than hand-rolling CSS)
- **Skill-tree rendering:** React Flow (pan/zoom node graph, animated edges,
  node state) — or an equivalent custom SVG canvas if React Flow proves limiting
  for the constellation styling. React Flow is the default starting point.
- **Content:** MDX + JSON files committed to the repo (see §6)
- **Persistence:** browser local storage, behind a single `ProgressStore` module
  (see §7)
- **AI authoring:** offline CLI script (see §8)
- **Deploy:** Vercel (free tier), live URL

**Why this stack:** maximal polish and "wow" with minimal moving parts; meets the
"frontend shouldn't be a slog" constraint via shadcn; every deferred feature
(database, auth, more node types) slots in without rework.

---

## 5. The Pluggable Node-Type System

Every node type implements the same contract, so the tree/XP machinery never
cares which type it is:

```ts
interface NodeType {
  render(props): ReactNode;        // draws the node's learning experience
  isComplete(state): boolean;      // has the learner mastered it?
  xpAwarded(state): number;        // XP earned for this attempt
}
```

A node's content file declares its `type` in frontmatter; the body is its content.

### Node types

| Type          | Role                                              | v1?     |
|---------------|---------------------------------------------------|---------|
| `lesson-quiz` | **Default.** MDX explainer → a few recall questions → pass to complete. | ✅ Yes |
| `interactive` | Hand-built React mini-experience (e.g. order the TCP handshake steps). The "wow" node. | ✅ Yes (1 showpiece) |
| `flashcards`  | Spaced-recall deck; "learn elsewhere, prove it here." | ⏳ Later |
| `ai-tutor`    | Adaptive chat session; tutor signals mastery.     | ⏳ Later |

Adding a new node type later = write one component satisfying the contract.

---

## 6. Content Model (source of truth)

Content lives as files in the repo. Adding a topic = adding a folder.

```
/content
  /networking
    tree.json            # graph: nodes, positions, prerequisites, XP values
    /nodes
      packets.mdx
      ip-addressing.mdx
      subnetting.mdx
      tcp-handshake.mdx  # type: interactive (showpiece)
      dns.mdx
      routing.mdx
      http.mdx           # type: lesson-quiz, isBoss: true
  /finance
    tree.json
    /nodes
      ...
```

- **`tree.json`** describes the graph: which nodes exist, prerequisite edges
  (what unlocks what), visual positions, XP per node, and which node is the Boss.
- **`*.mdx`** is one node's content; frontmatter declares `type`, `title`,
  `xp`, `estMinutes`, and type-specific fields (e.g. quiz questions).

This gives full control, version history, and zero runtime content cost.

---

## 7. Progression & Persistence

### Progression (the RPG shell)
- **Per-tree levels** with escalating titles (e.g. *Networking: Apprentice III*).
- **Global level** from total XP across all trees (rewards breadth).
- **Unlock gating:** a node is `locked` until prerequisites are `complete`.
- **Node states:** `locked` (dim) → `available` (glowing) → `in-progress` →
  `mastered` (gold).
- **Streak:** daily streak counter.
- **Badges:** a few (e.g. "Completed a whole tree," "7-day streak").
- **Boss node:** crowns each tree; tests the whole subject.
- **No leaderboards** (deferred multiplayer path).

### Persistence
- v1 uses **browser local storage**, accessed only through a typed
  `ProgressStore` module (get/set progress, XP, streak, completions).
- `ProgressStore` is the single seam: swapping it for a database later (the
  deferred "real product" path) changes nothing else.

---

## 8. AI-Assisted Authoring Pipeline

A **local CLI** the user runs from the terminal — a drafting accelerator, not a
runtime feature.

```
npm run author -- "Subnetting basics"   # optionally pointing at source material
```

- Calls an LLM to **draft** a `tree.json` + a set of `*.mdx` node files into the
  content folder, using structured output to match the content schema.
- The user **reviews, edits, and commits** the result. The user is
  editor-in-chief; the AI does the grunt drafting.
- It **never** writes to the live app at runtime → no per-use API cost, no
  unpredictable in-game quality.
- Portfolio talking point: "structured-output LLM pipeline that generates a typed
  content graph."

---

## 9. Visual & Motion Design

**Direction:** elegant-leaning **"cosmos"** — deep space, **indigo + gold**
accents, soft glow, rounded/chunky-but-refined nodes. Premium and warm; not
childish, not cold. (Chosen from a B×C blend of "cozy/playful" and "premium
constellation.")

### Skill Tree screen
- A **constellation you climb**: bottom = first node, winding upward to a **Boss
  node** at the top.
- **State language:** gold = mastered, glowing indigo = available, dim = locked.
- **Right-side detail panel** (not a popup) when a node is selected: type badge,
  description, mastery stars, XP + time estimate, chunky gold **Start** button.
- **Top bar:** subject, rank/title, streak, total XP, avatar.

### World Map screen
- A **universe of galaxies**, one per subject.
- **Started** subjects: full glowing galaxy + progress ring + mini-constellation
  preview. **Backlog** subjects: dormant stars that "ignite" when begun.
- A faint **"+ new subject"** nebula.
- **Inter-galaxy paths:** **aurora ribbon** (soft shimmering nebula band) as the
  resting state, with an **occasional comet** streaking a lane for life.
- Top HUD: global level, total XP, streak.

### Motion language
- **Traveled routes:** solid gold.
- **Active route (on select):** flowing indigo dashes with a glowing **token that
  glides along the actual path geometry** from one node to the next, then the
  detail panel slides in.
- **Available nodes:** gentle pulse.
- **Locked:** faint, inert.
- Room to grow: camera pan to selected node, "level up" burst when a node turns
  gold.

---

## 10. v1 Scope (the vertical slice)

A tight, fully-working first version that proves the whole concept end-to-end:

- **World Map** with the Networking galaxy live + Finance / AWS / Linear
  Optimization as dormant backlog stars.
- **One fully built tree — Networking**, ~6–8 nodes
  (e.g. Packets → IP Addressing → Subnetting → TCP Handshake → DNS → Routing →
  HTTP[Boss]).
- **Two working node types:** `lesson-quiz` (default) + one `interactive`
  showpiece (drag the TCP handshake steps into order).
- **Full RPG shell:** XP, per-tree + global levels, unlock gating, streak, a
  couple of badges.
- **Local-storage persistence** via `ProgressStore`.
- **AI authoring CLI**, used to draft the Finance tree as proof it works.
- **Deployed to a live Vercel URL.**

**Explicitly deferred:** `flashcards` + `ai-tutor` node types, accounts/database,
leaderboards, in-app content editor.

---

## 11. Topic Backlog

Trees to build over time (open-ended; user adds more):

1. **Networking** — first, fully built in v1.
2. Finance / stock market topics.
3. Cloud / AWS topics.
4. Linear optimization.

---

## 12. Risks & Open Questions

- **React Flow vs. custom SVG canvas** for the constellation look — start with
  React Flow; fall back to custom if its styling fights the cosmos aesthetic.
- **Interactive node authoring cost** — each `interactive` node is bespoke code;
  keep v1 to a single showpiece to bound effort.
- **AI authoring quality** — drafts will need human editing; the CLI is an
  accelerator, not an autopilot.
- **Local-storage only** — progress is per-browser/per-device in v1; acceptable
  given the single-player goal, and the `ProgressStore` seam makes sync a later
  add.
```
