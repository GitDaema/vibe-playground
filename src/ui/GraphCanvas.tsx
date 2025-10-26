import type { Graph } from "../graph/model";

type Props = {
  graph: Graph;
  entityPosition?: string;
  goalNodeId?: string;
  inventory?: string[];
  nodeTags?: Record<string, { tags: string[] }>;
};

export default function GraphCanvas({ graph, entityPosition, goalNodeId, inventory, nodeTags }: Props) {
  // Simple circular layout
  const R = 160;
  const cx = 260, cy = 220;
  const n = graph.nodes.length || 1;
  const pos: Record<string, { x: number; y: number }> = {};
  graph.nodes.forEach((node, i) => {
    const ang = (2 * Math.PI * i) / n;
    pos[node.id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });

  return (
    <svg className="w-full h-[480px] bg-white rounded-xl shadow border" viewBox="0 0 520 440">
      {/* edges */}
      {graph.edges.map((edge) => {
        const a = pos[edge.source];
        const b = pos[edge.target];
        if (!a || !b) return null;
        const locked = !!edge.requiresItem;
        const midx = (a.x + b.x) / 2;
        const midy = (a.y + b.y) / 2;
        return (
          <g key={edge.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={locked ? "#f59e0b" : "#cbd5e1"} strokeWidth={2} />
            {locked && (
              <text x={midx} y={midy - 6} textAnchor="middle" fontSize="16">
                🔒{edge.requiresItem ? (
                  <tspan dx="4" fontSize="13" fill="#6b7280">{edge.requiresItem}</tspan>
                ) : null}
              </text>
            )}
          </g>
        );
      })}

      {/* nodes */}
      {graph.nodes.map((node) => {
        const p = pos[node.id];
        if (!p) return null;
        const isEntityAtNode = node.id === entityPosition;
        const isGoal = node.id === goalNodeId;

        let fill = "#e5e7eb"; // Default
        if (isGoal) fill = "#fca5a5"; // Goal node
        if (isEntityAtNode) fill = "#86efac"; // Entity's current position

        return (
          <g key={node.id}>
            <circle cx={p.x} cy={p.y} r={18} fill={fill} stroke="#334155" strokeWidth={2} />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="16" fill="#0f172a" fontWeight={700}>
              {node.id}
            </text>
            {isEntityAtNode && (
              <circle cx={p.x} cy={p.y - 10} r={5} fill="purple" stroke="white" strokeWidth={1} />
            )}
            {/* Item indicator (e.g., key) on the node if present and not already in inventory */}
            {nodeTags && nodeTags[node.id] && nodeTags[node.id].tags.some(t => t.startsWith('item:')) && (
              (() => {
                const items = nodeTags[node.id].tags.filter(t => t.startsWith('item:')).map(t => t.slice(5));
                const visible = items.filter(it => !(inventory || []).includes(it));
                if (visible.length === 0) return null;
                return (
                  <text x={p.x} y={p.y + 22} textAnchor="middle" fontSize="16">
                    🔑<tspan dx="4" fontSize="13" fill="#6b7280">{visible.join(', ')}</tspan>
                  </text>
                );
              })()
            )}
          </g>
        );
      })}
    </svg>
  );
}
