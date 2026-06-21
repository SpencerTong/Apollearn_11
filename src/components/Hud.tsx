import type { Badge } from '@/domain/progress/badges';

export function Hud({
  level,
  xp,
  streak,
  badges,
}: {
  level: { level: number; title: string };
  xp: number;
  streak: number;
  badges: Badge[];
}) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-amber-400">🔥 {streak}</span>
      <span className="text-indigo-200">◇ {xp} XP</span>
      <span className="text-amber-300">{level.title} · Lv {level.level}</span>
      <span className="flex items-center gap-1">
        {badges.map((b) => (
          <span key={b.id} title={b.label} className={b.earned ? 'opacity-100' : 'opacity-30'}>
            {b.icon}
          </span>
        ))}
      </span>
    </div>
  );
}
