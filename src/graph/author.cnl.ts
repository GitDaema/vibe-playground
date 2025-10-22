import { Graph } from './model';

export class AuthorCnlError extends Error {
  constructor(message: string, public line: number) {
    super(`[Line ${line}] ${message}`);
    this.name = 'AuthorCnlError';
  }
}

// Helper to ensure a node exists, adding it if it doesn't.
// A simple layout algorithm is used to position new nodes.
function ensureNode(graph: Graph, nodeId: string, nodePositions: Map<string, {x: number, y: number}>): void {
  if (!graph.nodes.some(n => n.id === nodeId)) {
    const existingPositions = new Set(graph.nodes.map(n => `${n.x},${n.y}`));
    let x = 100, y = 100;
    let i = 0;
    while(existingPositions.has(`${x},${y}`)) {
      x += 50 * (i % 5);
      y += 50 * Math.floor(i / 5);
      i++;
    }
    graph.addNode({ id: nodeId, x, y });
    nodePositions.set(nodeId, { x, y });
  }
}

export function parseAuthoringCnl(cnl: string): { graph: Graph; errors: AuthorCnlError[] } {
  const graph = new Graph();
  const errors: AuthorCnlError[] = [];
  // Split only by newline, then clean up each line.
  const lines = cnl.split('\n').map(l => l.trim()).filter(Boolean);
  const nodePositions = new Map<string, {x: number, y: number}>();

  lines.forEach((originalLine, index) => {
    const lineNumber = index + 1;
    const line = originalLine.replace(/\.$/, '').trim(); // Remove trailing period
    if (!line) return;

    try {
      // "노드 A, B, C, D를 만든다."
      let match = line.match(/^노드 (.+)를 만든다/);
      if (match) {
        const nodeIds = match[1].split(/, ?/);
        nodeIds.forEach(id => ensureNode(graph, id, nodePositions));
        return;
      }

      // "A에서 B로 간선을 잇는다."
      match = line.match(/^(.+)에서 (.+)로 간선을 잇는다/);
      if (match) {
        const from = match[1].trim();
        const to = match[2].trim();
        ensureNode(graph, from, nodePositions);
        ensureNode(graph, to, nodePositions);
        graph.addEdge({ id: `${from}${to}`, source: from, target: to });
        return;
      }
      
      // "간선 A→B의 가중치는 3." (Label storage only)
      match = line.match(/^간선 (.+?)→(.+?)의 가중치는 (.+)/);
      if (match) {
        // Currently, we just parse this but don't use the weight.
        // This can be extended later.
        return;
      }

      // "시작은 A, 목표는 D."
      match = line.match(/^시작은 (.+?), 목표는 (.+)/);
      if (match) {
        graph.startNodeId = match[1].trim();
        graph.goalNodeId = match[2].trim();
        ensureNode(graph, graph.startNodeId, nodePositions);
        ensureNode(graph, graph.goalNodeId, nodePositions);
        return;
      }

      // "B→C는 '열쇠'가 필요하다."
      match = line.match(/^(.+?)→(.+?)는 '(.+?)'가 필요하다/);
      if (match) {
        const from = match[1].trim();
        const to = match[2].trim();
        const item = match[3].trim();
        graph.lockEdge(from, to, item);
        return;
      }

      // "B에 '열쇠'가 있다."
      match = line.match(/^(.+)에 '(.+?)'가 있다/);
      if (match) {
        const nodeId = match[1].trim();
        const item = match[2].trim();
        ensureNode(graph, nodeId, nodePositions);
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) {
          if (!node.tags) node.tags = [];
          node.tags.push(`item:${item}`);
        }
        return;
      }

      throw new AuthorCnlError(`해석할 수 없는 구문입니다: "${line}"`, lineNumber);
    } catch (e) {
      if (e instanceof AuthorCnlError) {
        errors.push(e);
      } else {
        errors.push(new AuthorCnlError((e as Error).message, lineNumber));
      }
    }
  });

  return { graph, errors };
}
