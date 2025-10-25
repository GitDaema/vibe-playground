import type { Graph } from "../graph/model";

type Props = {
  graph: Graph;
  entityPosition?: string;
  goalNodeId?: string;
  inventory?: string[];
  nodeTags?: Record<string, { tags: string[] }>;
};

const PADDING = 40; // px

export default function GraphCanvas({ graph, entityPosition, goalNodeId, inventory, nodeTags }: Props) {
  const { nodes } = graph;
  const viewWidth = 520;
  const viewHeight = 440;

  let positions: Record<string, { x: number; y: number }> = {};

  // If nodes have no coordinates, calculate a circular layout first.
  const hasCoordinates = nodes.every(node => node.x !== undefined && node.y !== undefined);

  if (!hasCoordinates && nodes.length > 0) {
    const R = 150;
    const cx = viewWidth / 2;
    const cy = viewHeight / 2;
    const n = nodes.length;
    nodes.forEach((node, i) => {
      const ang = (2 * Math.PI * i) / n;
      positions[node.id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
    });
  } else {
    nodes.forEach(node => {
      // Fallback for nodes that might be missing coordinates
      positions[node.id] = { x: node.x ?? 0, y: node.y ?? 0 };
    });
  }

  // Calculate bounding box of the graph
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  if (nodes.length > 0) {
    Object.values(positions).forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
  } else {
    minX = 0; minY = 0; maxX = viewWidth; maxY = viewHeight;
  }
  
  const graphWidth = (maxX - minX) === 0 ? 1 : maxX - minX;
  const graphHeight = (maxY - minY) === 0 ? 1 : maxY - minY;

  // Calculate scale and offset to fit the graph in the view
  const scaleX = (viewWidth - PADDING * 2) / graphWidth;
  const scaleY = (viewHeight - PADDING * 2) / graphHeight;
  const scale = Math.min(scaleX, scaleY, 5); // Add a max scale to prevent tiny graphs from becoming huge

  const offsetX = (viewWidth - (minX + maxX) * scale) / 2;
  const offsetY = (viewHeight - (minY + maxY) * scale) / 2;

  // Apply transformation
  const finalPositions: Record<string, { x: number; y: number }> = {};
  Object.keys(positions).forEach(id => {
    const p = positions[id];
    finalPositions[id] = {
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
    };
  });
  
  const pos = finalPositions;

  return (
    <svg className="w-full h-[480px] bg-white rounded-xl shadow border" viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
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
              <text x={midx} y={midy - 6} textAnchor="middle" fontSize="12">
                🔒
                {edge.requiresItem ? <tspan dx="4" fontSize="10" fill="#6b7280">{edge.requiresItem}</tspan> : null}
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
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight={700}>
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
                  <text x={p.x} y={p.y + 22} textAnchor="middle" fontSize="12">🔑<tspan dx="4" fontSize="10" fill="#6b7280">{visible.join(', ')}</tspan></text>
                );
              })()
            )}
          </g>
        );
      })}
    </svg>
  );
}