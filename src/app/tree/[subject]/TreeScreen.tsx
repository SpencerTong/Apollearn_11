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
          <div className="flex-1" aria-hidden="true"><SkillTree tree={tree} states={states} onSelect={setSelectedId} /></div>
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
