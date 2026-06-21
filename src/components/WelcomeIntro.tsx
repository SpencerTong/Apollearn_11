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
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-intro-title"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-200"
      >
        <h2 id="welcome-intro-title" className="mb-1 text-2xl font-bold text-white">Welcome to Apollearn 11</h2>
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
