/**
 * Vibe Playground: Graph Puzzle Sandbox
 *
 * Korean Constrained Natural Language (CNL) to Graph DSL Parser
 *
 * Action 기반 파서: actions 배열과 함께, 레거시 호환을 위해 Graph/Errors도 함께 반환
 */

import { Graph } from './model';

// 타입 정의
export type AddNodesAction = { action: 'add_nodes'; nodes: string[] };
export type AddEdgesAction = { action: 'add_edges'; edges: [string, string][] };
export type LockEdgeAction = { action: 'lock_edge'; from: string; to: string; requires: string };
export type PlaceItemAction = { action: 'place_item'; node: string; item: string };
export type SetStartGoalAction = { action: 'set_start_goal'; start: string; goal: string };
export type SetStartAction = { action: 'set_start'; start: string };
export type SetGoalAction = { action: 'set_goal'; goal: string };
export type ErrorAction = { action: 'error'; message: string; span: [number, number] };

export type ParserAction =
  | AddNodesAction
  | AddEdgesAction
  | LockEdgeAction
  | PlaceItemAction
  | SetStartGoalAction
  | SetStartAction
  | SetGoalAction
  | ErrorAction;

export class AuthorCnlError extends Error {
  constructor(message: string, public line: number) {
    super(`[Line ${line}] ${message}`);
    this.name = 'AuthorCnlError';
  }
}

// 키워드/정규식 상수
const VERBS = {
  CONNECT: /연결|잇다|이어|연결해|이어줘|연결시켜/,
  CREATE: /생성|추가|만들어|만든다/,
  REQUIRE: /필요(?:하다|함)?|있어야/,
  PLACE: /있다|놓여 있다|배치/,
};

const NOUNS = {
  NODE: /노드|점/,
  EDGE: /간선|엣지|링크|선/,
  START: /시작|출발/,
  GOAL: /목표|도착/,
};

const CONJUNCTIONS = /그리고|및|하고|랑|와|과/g;
const PARTICLE_TAIL = /[은는이가을를에에서로으로]$/;

const KEYWORD_PATTERN = new RegExp(
  [VERBS.CONNECT, VERBS.CREATE, VERBS.REQUIRE, VERBS.PLACE, NOUNS.START, NOUNS.GOAL].map(r => r.source).join('|') + '|->|→|➜|↦'
);

// 유틸
function normalizeNodeId(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function tokenizeList(text: string): string[] {
  const cleaned = text.replace(CONJUNCTIONS, ' ').replace(/, /g, ' ');
  return cleaned
    .split(/[ ,]+/)
    .map(t => t.replace(PARTICLE_TAIL, '').trim())
    .filter(Boolean)
    .map(normalizeNodeId)
    .filter(id => id.length > 0);
}

function containsVerbOrSpecial(s: string): boolean {
  return KEYWORD_PATTERN.test(s);
}

function safeSplitSegments(text: string): string[] {
  const result: string[] = [];
  for (const raw of (text || '').split(/\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // 출발/목표 합성 문장은 쉼표 분할 금지
    if (/(?:시작|출발(?:점)?)\s*(?:은|는)?\s*[A-Za-z0-9]+\s*,\s*(?:목표|도착(?:점)?)\s*(?:은|는)?\s*[A-Za-z0-9]+/.test(line)) {
      result.push(line);
      continue;
    }
    let last = 0;
    const cuts: number[] = [];
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ',') {
        const left = line.slice(last, i).trim();
        const right = line.slice(i + 1).trim();
        if (left && right && containsVerbOrSpecial(left) && containsVerbOrSpecial(right)) {
          cuts.push(i);
          last = i + 1;
        }
      }
    }
    if (cuts.length === 0) {
      result.push(line);
    } else {
      let start = 0;
      for (const c of cuts) {
        result.push(line.slice(start, c).trim());
        start = c + 1;
      }
      if (start < line.length) result.push(line.slice(start).trim());
    }
  }
  return result;
}

function parseSegment(segRaw: string, offset: number): ParserAction[] {
  const seg = segRaw.trim().replace(/[。.]+$/g, '');
  if (!seg) return [];
  const err = (msg: string): ErrorAction => ({ action: 'error', message: msg, span: [offset, offset + seg.length] });

  // 1) 출발/목표 동시 설정
  let m = seg.match(/^(?:시작|출발)(?:점)?(?:은|는)?\s*([A-Za-z0-9]+)\s*,\s*(?:목표|도착)(?:점)?(?:은|는)?\s*([A-Za-z0-9]+)/);
  if (m) return [{ action: 'set_start_goal', start: normalizeNodeId(m[1]), goal: normalizeNodeId(m[2]) }];

  // 2) 잠금(필요) - 화살표 형태 우선
  if (VERBS.REQUIRE.test(seg)) {
    // A->B / A→B
    let arrow = seg.match(/^\s*([A-Za-z0-9]+)\s*(?:->|→|➜|↦)\s*([A-Za-z0-9]+)/);
    if (arrow) {
      const from = normalizeNodeId(arrow[1]);
      const to = normalizeNodeId(arrow[2]);
      let im = seg.match(/[\'“”\"]([^\'“”\"]+)[\'“”\"]\s*(?:이|가)\s*필요(?:하다|함)/) || seg.match(/\s([^\s\'“”\"]+)\s*(?:이|가)\s*필요(?:하다|함)/);
      const item = im ? im[1].trim() : '';
      if (item) return [
        { action: 'add_edges', edges: [[from, to]] },
        { action: 'lock_edge', from, to, requires: item },
      ];
    }
    // A에서 B로 ... 필요..
    m = seg.match(/^\s*([A-Za-z0-9]+)\s*에서\s*([A-Za-z0-9]+)\s*로\s*(?:가려면|가면|가기 위해서는)?\s*'?(.+?)'?\s*(?:이|가)\s*필요(?:하다|함)/);
    if (m) {
      const from = normalizeNodeId(m[1]);
      const to = normalizeNodeId(m[2]);
      const item = m[3].trim();
      return [
        { action: 'add_edges', edges: [[from, to]] },
        { action: 'lock_edge', from, to, requires: item },
      ];
    }
    // "B와 C를 잇는 간선을 지나려면 X가 필요하다"
    m = seg.match(/^\s*([A-Za-z0-9]+)\s*와\s*([A-Za-z0-9]+)\s*를\s*잇는\s*간선을\s*지나려면\s*'?(.+?)'?\s*(?:이|가)\s*필요하다/);
    if (m) {
      const from = normalizeNodeId(m[1]);
      const to = normalizeNodeId(m[2]);
      const item = m[3].trim();
      return [
        { action: 'add_edges', edges: [[from, to]] },
        { action: 'lock_edge', from, to, requires: item },
      ];
    }
  }

  // 3) 노드 생성
  if (NOUNS.NODE.test(seg) && VERBS.CREATE.test(seg)) {
    const listPart = seg.replace(NOUNS.NODE, '').replace(VERBS.CREATE, '');
    const nodes = tokenizeList(listPart);
    if (nodes.length > 0) return [{ action: 'add_nodes', nodes }];
  }

  // 4) 간선 생성
  if (VERBS.CONNECT.test(seg)) {
    if (seg.includes('순서대로')) {
      const ids = tokenizeList(seg.replace(/\s*를\s*순서대로\s*(?:연결|잇다|이어).*/, ''));
      const edges: [string, string][] = [];
      for (let i = 0; i < ids.length - 1; i++) edges.push([ids[i], ids[i + 1]]);
      if (edges.length > 0) return [{ action: 'add_edges', edges }];
    } else {
      const ids = tokenizeList(seg.replace(VERBS.CONNECT, ''));
      if (ids.length === 2) return [{ action: 'add_edges', edges: [[ids[0], ids[1]]] }];
    }
  }
  m = seg.match(/^\s*([A-Za-z0-9]+)\s*에서\s*([A-Za-z0-9]+)\s*로/);
  if (m) return [{ action: 'add_edges', edges: [[normalizeNodeId(m[1]), normalizeNodeId(m[2])]] }];

  // 5) 아이템 배치
  m = seg.match(/^\s*([A-Za-z0-9]+)\s*에\s*'?(.*?)'?\s*(?:이|가)\s*있다/);
  if (m) return [{ action: 'place_item', node: normalizeNodeId(m[1]), item: m[2].trim() }];

  // 6) 시작/목표 단독
  m = seg.match(/^(?:시작|출발)(?:점)?(?:은|는)?\s*([A-Za-z0-9]+)/);
  if (m) return [{ action: 'set_start', start: normalizeNodeId(m[1]) }];
  m = seg.match(/^(?:목표|도착)(?:점)?(?:은|는)?\s*([A-Za-z0-9]+)/);
  if (m) return [{ action: 'set_goal', goal: normalizeNodeId(m[1]) }];

  return [err('해석할 수 없는 구문')];
}

export function parseAuthoringCnl(cnl: string): { actions: ParserAction[]; graph: Graph; errors: AuthorCnlError[] } {
  const segments = safeSplitSegments(cnl);
  const actions: ParserAction[] = [];
  let offset = 0;
  for (const seg of segments) {
    actions.push(...parseSegment(seg, offset));
    offset += seg.length + 1;
  }

  // actions → Graph/Errors (레거시 호환)
  const graph = new Graph();
  const errors: AuthorCnlError[] = [];
  actions.forEach((a, idx) => {
    if (a.action === 'error') {
      errors.push(new AuthorCnlError(a.message, idx + 1));
      return;
    }
    switch (a.action) {
      case 'add_nodes':
        a.nodes.forEach(id => { if (!graph.nodes.some(n => n.id === id)) graph.addNode({ id }); });
        break;
      case 'add_edges':
        a.edges.forEach(([from, to]) => {
          if (!graph.nodes.some(n => n.id === from)) graph.addNode({ id: from });
          if (!graph.nodes.some(n => n.id === to)) graph.addNode({ id: to });
          if (!graph.edges.some(e => e.source === from && e.target === to)) graph.addEdge({ id: `${from}${to}`, source: from, target: to });
        });
        break;
      case 'lock_edge':
        if (!graph.edges.some(e => e.source === a.from && e.target === a.to)) graph.addEdge({ id: `${a.from}${a.to}`, source: a.from, target: a.to });
        graph.lockEdge(a.from, a.to, a.requires);
        break;
      case 'place_item':
        if (!graph.nodes.some(n => n.id === a.node)) graph.addNode({ id: a.node });
        const node = graph.nodes.find(n => n.id === a.node)!;
        node.tags = node.tags || [];
        if (!node.tags.includes(`item:${a.item}`)) node.tags.push(`item:${a.item}`);
        break;
      case 'set_start_goal':
        graph.startNodeId = a.start; graph.goalNodeId = a.goal;
        if (!graph.nodes.some(n => n.id === a.start)) graph.addNode({ id: a.start });
        if (!graph.nodes.some(n => n.id === a.goal)) graph.addNode({ id: a.goal });
        break;
      case 'set_start':
        graph.startNodeId = a.start;
        if (!graph.nodes.some(n => n.id === a.start)) graph.addNode({ id: a.start });
        break;
      case 'set_goal':
        graph.goalNodeId = a.goal;
        if (!graph.nodes.some(n => n.id === a.goal)) graph.addNode({ id: a.goal });
        break;
    }
  });

  return { actions, graph, errors };
}
