// BFS 최소 구현: 방문 순서를 반환
export function bfsOrder(adj: Record<string, string[]>, start: string, goal?: string) {
  const visited = new Set<string>();
  const q: string[] = [];
  const order: string[] = [];
  if (!start) return order;
  q.push(start);
  visited.add(start);
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    if (goal && u === goal) break;
    for (const v of (adj[u] || [])) {
      if (!visited.has(v)) {
        visited.add(v);
        q.push(v);
      }
    }
  }
  return order;
}
