'use client';
import React from 'react';
import Link from 'next/link';
import type { Subject } from '@/domain/content/subjects';

const POSITIONS = ['left-[36%] top-[52%]', 'left-[72%] top-[32%]', 'left-[74%] top-[76%]', 'left-[20%] top-[80%]'];

function Galaxy({ subject, mastered }: { subject: Subject; mastered: number }) {
  if (subject.status === 'available') {
    return (
      <Link
        href={`/tree/${subject.id}`}
        className="group flex flex-col items-center text-center"
      >
        <span
          className="flex h-28 w-28 items-center justify-center rounded-full text-4xl transition-transform group-hover:scale-105"
          style={{
            background: 'radial-gradient(circle at 40% 35%,#3730a3,#1e1b4b 70%)',
            boxShadow: '0 0 38px rgba(129,140,248,0.6)',
          }}
        >
          {subject.icon}
        </span>
        <span className="mt-2 font-semibold text-slate-100">{subject.title}</span>
        <span className="text-xs text-indigo-300">{mastered} / {subject.nodeCount} stars</span>
      </Link>
    );
  }
  return (
    <div data-dormant="true" className="flex flex-col items-center text-center opacity-70">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full text-2xl"
        style={{ background: 'radial-gradient(circle at 40% 35%,#1b2347,#0c1124 70%)', border: '1px solid #2a3566' }}
      >
        {subject.icon}
      </span>
      <span className="mt-2 text-sm font-medium text-slate-300">{subject.title}</span>
      <span className="text-[10px] text-slate-500">Tap to ignite ✦</span>
    </div>
  );
}

export function WorldMap({ subjects, masteredBySubject, hud }: { subjects: Subject[]; masteredBySubject: Record<string, number>; hud?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_50%,#0d1030,#05060f_75%)] text-slate-100">
      {/* starfield */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 20%,#ffffff77 50%,transparent),radial-gradient(1px 1px at 30% 70%,#ffffff55 50%,transparent),radial-gradient(1.5px 1.5px at 65% 30%,#ffffff88 50%,transparent),radial-gradient(1px 1px at 80% 75%,#ffffff66 50%,transparent),radial-gradient(1.5px 1.5px at 90% 15%,#ffffff77 50%,transparent)',
        }}
      />
      {/* aurora-ribbon paths */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="aurora" x1="0" x2="1">
            <stop offset="0" stopColor="#a5b4fc" stopOpacity="0" />
            <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f0abfc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 36 52 C 50 40, 62 36, 72 32" stroke="url(#aurora)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
        <path d="M 36 52 C 50 64, 62 72, 74 76" stroke="url(#aurora)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
        <path d="M 36 52 C 28 64, 24 72, 20 80" stroke="url(#aurora)" strokeWidth="2" fill="none" style={{ filter: 'blur(1px)' }} />
      </svg>

      <header className="relative flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-xl font-bold">Apollearn 11</h1>
          <p className="text-xs text-slate-400">Your learning universe</p>
        </div>
        {hud}
      </header>

      {subjects.map((s, i) => (
        <div key={s.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${POSITIONS[i % POSITIONS.length]}`}>
          <Galaxy subject={s} mastered={masteredBySubject[s.id] ?? 0} />
        </div>
      ))}

      <div className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center opacity-50">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-600 text-slate-500">+</div>
        <div className="mt-1 text-[10px] text-slate-500">new subject</div>
      </div>
    </div>
  );
}
