'use client';
import { motion } from 'motion/react';
import type { LoadedNode } from '@/domain/content/types';
import type { NodeUiState } from '@/domain/tree/treeState';

export function NodeDetailPanel({
  node,
  state,
  onStart,
}: {
  node: LoadedNode | null;
  state: NodeUiState | undefined;
  onStart: () => void;
}) {
  if (!node) return null;
  const canStart = state === 'available' || state === 'in-progress' || state === 'mastered';
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="w-64 border-l border-slate-800 bg-slate-900/80 p-5 text-slate-200"
    >
      <div className="mb-3 inline-block rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
        {node.meta.type}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{node.meta.title}</h3>
      <p className="mb-4 text-xs text-slate-400">
        +{node.meta.xp} XP · ~{node.meta.estMinutes}m
      </p>
      <button
        type="button"
        disabled={!canStart}
        onClick={onStart}
        className="w-full rounded-xl bg-amber-400 px-4 py-2 font-bold text-amber-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === 'mastered' ? 'Review' : 'Start ▸'}
      </button>
    </motion.aside>
  );
}
