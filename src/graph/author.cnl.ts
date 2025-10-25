import { Graph } from './model';
import { normalizeText, tokenizeList, normalizeNodeId } from '../nlu/ko/norm';
import { NOUNS } from '../nlu/ko/dict';

export class AuthorCnlError extends Error {
  constructor(message: string, public line: number) {
    super(`[Line ${line}] ${message}`);
    this.name = 'AuthorCnlError';
  }
}

// Helper to ensure a node exists, adding it if it doesn't.
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

// Helper to ensure an edge exists, adding it if it doesn't.
function ensureEdge(graph: Graph, from: string, to: string, nodePositions: Map<string, {x: number, y: number}>): void {
  ensureNode(graph, from, nodePositions);
  ensureNode(graph, to, nodePositions);
  if (!graph.edges.some(e => e.source === from && e.target === to)) {
    graph.addEdge({ id: `${from}${to}`, source: from, target: to });
  }
}

export function parseAuthoringCnl(cnl: string): { graph: Graph; errors: AuthorCnlError[] } {
  const graph = new Graph();
  const errors: AuthorCnlError[] = [];
  const lines = cnl.split('\n').map(l => l.trim()).filter(Boolean);
  const nodePositions = new Map<string, {x: number, y: number}>();

  lines.forEach((originalLine, index) => {
    const lineNumber = index + 1;
    const line = originalLine.replace(/\.$/, '').trim();
    if (!line) return;

    try {
      // Try new flexible parsing first
      const normalized = normalizeText(line);
      const tokens = normalized.split(' ');

      // Intent: Add Nodes ("노드 A, B 생성")
      if (tokens.includes('CREATE') && (tokens.includes('노드') || tokens.includes('점'))) {
        const nodeIds = tokenizeList(
          normalized
            .replace(/\bCREATE\b/g, ' ')
            .replace(/\b(?:노드|점)\b/g, ' ')
        ).filter(t => /[A-Za-z0-9]/.test(t));
        nodeIds.map(normalizeNodeId).forEach(id => ensureNode(graph, id, nodePositions));
        return;
      }

      // Intent: Add Edges ("A B 연결", "A에서 B로 연결", "A에서 B로 간선을 잇는다")
      if (tokens.includes('CONNECT') || /연결|잇|이어/.test(line)) {
        // 1) 패턴: "A에서 B로 ..."
        let pairs: Array<[string, string]> = [];
        const viaMatches = [...line.matchAll(/\b([A-Za-z0-9]+)\s*에서\s*([A-Za-z0-9]+)\s*로\b/g)];
        if (viaMatches.length > 0) {
          pairs = viaMatches.map(m => [normalizeNodeId(m[1]), normalizeNodeId(m[2])]);
        } else {
          // 2) 패턴: "A B 연결" 형태 - 간선/조사/동사를 제거하고 나열로 처리
          const edgeWords = (NOUNS.EDGE || []).join('|');
          const cleaned = normalized
            .replace(/\bCONNECT\b/g, ' ')
            .replace(new RegExp(`\b(?:${edgeWords})\b`, 'g'), ' ')
            .replace(/에서|로/g, ' ')
            .replace(/잇\S*|연결\S*|이어\S*/g, ' ');
          const nodeIds = tokenizeList(cleaned).filter(t => /^[A-Za-z0-9]+$/.test(t));
          for (let i = 0; i < nodeIds.length - 1; i++) {
            pairs.push([normalizeNodeId(nodeIds[i]), normalizeNodeId(nodeIds[i + 1])]);
          }
        }

        if (pairs.length > 0) {
          for (const [from, to] of pairs) {
            ensureNode(graph, from, nodePositions);
            ensureNode(graph, to, nodePositions);
            graph.addEdge({ id: `${from}${to}`, source: from, target: to });
          }
          return;
        }
        // else: fall through to legacy regex
      }

      // Fallback to old regex-based parsing for compatibility
      let match;

      // "A에서 B로 간선을 잇는다."
      match = line.match(/^\s*([A-Za-z0-9]+)\s*에서\s*([A-Za-z0-9]+)\s*로\s*(?:간선|엣지|링크|선)?(?:을|를)?\s*(?:잇는다|연결한다)/);
      if (match) {
        const from = match[1].trim();
        const to = match[2].trim();
        ensureNode(graph, from, nodePositions);
        ensureNode(graph, to, nodePositions);
        graph.addEdge({ id: `${from}${to}`, source: from, target: to });
        return;
      }

      // "A B 연결" (간단형)
      match = line.match(/^\s*([A-Za-z0-9]+)\s+([A-Za-z0-9]+)\s*(?:을|를)?\s*(?:연결|잇(?:는다|는|어)?|이어|연결해|이어줘|연결시켜)/);
      if (match) {
        const from = normalizeNodeId(match[1]);
        const to = normalizeNodeId(match[2]);
        ensureNode(graph, from, nodePositions);
        ensureNode(graph, to, nodePositions);
        graph.addEdge({ id: `${from}${to}`, source: from, target: to });
        return;
      }

      // "B→C는 '열쇠'가 필요하다."
      match = line.match(/^\s*([A-Za-z0-9]+)\s*[→\-\u2192]\s*([A-Za-z0-9]+)\s*(?:는|은)?\s*'?(.*?)'?\s*가\s*필요하다/);
      if (match) {
        const from = normalizeNodeId(match[1]);
        const to = normalizeNodeId(match[2]);
        const item = match[3].trim();
        ensureEdge(graph, from, to, nodePositions);
        graph.lockEdge(from, to, item);
        return;
      }

      // "B와 C를 잇는 간선을 지나려면 열쇠가 필요하다"
      match = line.match(/(.+?)와\s*(.+?)를\s*잇는\s*간선을\s*지나려면\s*(.+?)가\s*필요하다/);
      if (match) {
        const from = normalizeNodeId(match[1]);
        const to = normalizeNodeId(match[2]);
        const item = match[3].trim();
        ensureEdge(graph, from, to, nodePositions);
        graph.lockEdge(from, to, item);
        return;
      }

      // "B에서 C로 가려면 '열쇠'가 필요하다"
      match = line.match(/^\s*([A-Za-z0-9]+)\s*에서\s*([A-Za-z0-9]+)\s*로\s*(?:가려면|가면|가기 위해서는)\s*'?(.*?)'?\s*가\s*필요하다/);
      if (match) {
        const from = normalizeNodeId(match[1]);
        const to = normalizeNodeId(match[2]);
        const item = match[3].trim();
        ensureEdge(graph, from, to, nodePositions);
        graph.lockEdge(from, to, item);
        return;
      }

      // "B에 열쇠가 있다"
      match = line.match(/^(.+?)에\s*'?(.+?)'?가\s*있다/);
      if (match) {
        const nodeId = normalizeNodeId(match[1]);
        const item = match[2].trim();
        ensureNode(graph, nodeId, nodePositions);
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) {
          if (!node.tags) node.tags = [];
          if (!node.tags.includes(`item:${item}`)) node.tags.push(`item:${item}`);
        }
        return;
      }

      // "시작은 A, 목표는 D."
      match = line.match(/^시작은\s+(.+?),\s*목표는\s+(.+)/);
      if (match) {
        graph.startNodeId = match[1].trim();
        graph.goalNodeId = match[2].trim();
        ensureNode(graph, graph.startNodeId, nodePositions);
        ensureNode(graph, graph.goalNodeId, nodePositions);
        return;
      }

      // "시작은 A"
      match = line.match(/^시작은\s+(.+)/);
      if (match) {
        graph.startNodeId = match[1].trim();
        ensureNode(graph, graph.startNodeId, nodePositions);
        return;
      }

      // "목표는 D"
      match = line.match(/^목표는\s+(.+)/);
      if (match) {
        graph.goalNodeId = match[1].trim();
        ensureNode(graph, graph.goalNodeId, nodePositions);
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
