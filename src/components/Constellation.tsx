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
              aria-hidden="true"
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
