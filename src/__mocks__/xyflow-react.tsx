// Stub for @xyflow/react — replaces the real library in jsdom tests
// so canvas rendering does not interfere with accessible queries.
import React from 'react';

export function ReactFlow({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
export function Background() { return null; }

// Re-export types needed by consuming components
export type Node = { id: string; position: { x: number; y: number }; data: Record<string, unknown>; style?: Record<string, unknown> };
export type Edge = { id: string; source: string; target: string };
