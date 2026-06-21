'use client';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import type { LoadedTree } from '@/domain/content/types';
import { computeNodeStates, computeGlobalXp, computeLevel } from '@/domain/tree/treeState';
import { computeBadges } from '@/domain/progress/badges';
import { getNodeType } from '@/domain/nodes/registry';
import { Constellation } from '@/components/Constellation';
import { NodeDetailPanel } from '@/components/NodeDetailPanel';
import { WelcomeIntro } from '@/components/WelcomeIntro';
import { Hud } from '@/components/Hud';
import { browserStore } from '@/lib/browserStore';

export function TreeScreen({ tree, todayISO, nodeCountBySubject }: { tree: LoadedTree; todayISO: string; nodeCountBySubject: Record<string, number> }) {
  const store = useMemo(browserStore, []);
  const [progress, setProgress] = useState(() => store.getSubject(tree.subject));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !store.hasSeenIntro());

  function dismissIntro() {
    store.markIntroSeen();
    setShowIntro(false);
  }

  const states = useMemo(() => computeNodeStates(tree, progress), [tree, progress]);
  const globalData = store.load();
  const globalXp = computeGlobalXp(globalData);
  const selected = tree.nodes.find((n) => n.id === selectedId) ?? null;

  function start() {
    if (selected) setRunning(true);
  }

  function closeModal() {
    setRunning(false);
  }

  function complete(result: { score: number; passed: boolean; xp: number }) {
    if (!selected) return;
    store.recordCompletion(tree.subject, selected.id, { score: result.score, xp: result.xp, passed: result.passed, todayISO });
    setProgress(store.getSubject(tree.subject));
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running]);

  const RunComponent = selected ? getNodeType(selected.meta.type).Component : null;

  return (
    <div className="flex h-screen flex-col bg-[#080a18] text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-100">← World</Link>
          <span className="font-semibold">{tree.title}</span>
        </div>
        <Hud
          level={computeLevel(globalXp)}
          xp={globalXp}
          streak={globalData.streak.count}
          badges={computeBadges(globalData, nodeCountBySubject)}
        />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <Constellation tree={tree} states={states} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <NodeDetailPanel node={selected} state={selected ? states[selected.id] : undefined} onStart={start} />
      </div>

      {showIntro && <WelcomeIntro onDismiss={dismissIntro} />}

      <AnimatePresence>
        {running && selected && RunComponent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="quiz-modal-title"
              className="relative max-h-[85vh] w-full max-w-xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
              initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={closeModal}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
              <h2 id="quiz-modal-title" className="mb-4 text-xl font-bold">{selected.meta.title}</h2>
              <RunComponent node={selected.meta} onComplete={complete} isReview={states[selected.id] === 'mastered'} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
