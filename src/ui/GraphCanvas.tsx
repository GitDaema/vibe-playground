import React from "react";

type Graph = { nodes: string[]; edges: [string, string][] };
type Props = {
  graph: Graph;
  visited?: Set<string>;
  start?: string;
  goal?: string;
};

export default function GraphCanvas({ graph, visited = new Set(), start, goal }: Props) {
  // 간단한 원형 배치
  const R = 160;
  const cx = 260, cy = 220;
  const n = graph.nodes.length || 1;
  const pos: Record<string, { x: number; y: number }> = {};
  graph.nodes.forEach((id, i) => {
    const ang = (2 * Math.PI * i) / n;
    pos[id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });

  return (
    <svg className="w-full h-[480px] bg-white rounded-xl shadow border" viewBox="0 0 520 440">
      {/* edges */}
      {graph.edges.map(([u, v], i) => {
        const a = pos[u], b = pos[v];
        if (!a || !b) return null;
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={2} />
        );
      })}
      {/* nodes */}
      {graph.nodes.map((id) => {
        const p = pos[id];
        if (!p) return null;
        const isVisited = visited.has(id);
        const isStart = id === start;
        const isGoal = id === goal;
        const fill = isStart ? "#86efac" : isGoal ? "#fca5a5" : isVisited ? "#93c5fd" : "#e5e7eb";
        return (
          <g key={id}>
            <circle cx={p.x} cy={p.y} r={18} fill={fill} stroke="#334155" strokeWidth={2} />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight={700}>
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
