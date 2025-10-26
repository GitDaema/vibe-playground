import type { Rule, RuleSet } from './rule-engine/types';

export class CnlParsingError extends Error {
  public line: number;
  constructor(message: string, line: number) {
    super(`[Line ${line}] ${message}`);
    this.name = 'CnlParsingError';
    this.line = line;
  }
}

const RE_WHEN_COMBINED = /^(.+?)를\s*가지고\s*있고\s*(.+?)에\s*도착하면$/u;
const RE_WHEN_AT = /^(.+?)에\s*도착하면$/u;
const RE_WHEN_QUEUE_NOT_EMPTY = /^큐가\s*비어있지\s*않다면$/u;
const RE_WHEN_STACK_NOT_EMPTY = /^스택이\s*빌\s*때까지$/u;
const RE_WHEN_NOT_VISITED_CURRENT = /^아직\s*방문하지\s*않았다면$/u;
const RE_WHEN_NOT_VISITED_NODE = /^(.+?)를\s*아직\s*방문하지\s*않았다면$/u;

const RE_THEN_MOVE = /^(.+?)로\s*이동한다$/u;
const RE_THEN_MOVE_SH = /^이동\s*:\s*(.+)$/u;
const RE_THEN_PICKUP = /^(.+?)를\s*줍는다$/u;
const RE_THEN_DROP = /^(.+?)를\s*(?:버린다|사용한다)$/u;
const RE_THEN_ADD_TO_QUEUE = /^큐에\s*(.+?)를\s*추가한다$/u;
const RE_THEN_POP_FROM_QUEUE = /^큐에서\s*다음\s*노드를\s*꺼낸다$/u;
const RE_THEN_ADD_TO_STACK = /^스택에\s*(.+?)를\s*(?:넣는다|추가한다)$/u;
const RE_THEN_POP_FROM_STACK = /^스택에서\s*다음\s*노드를\s*뺀다$/u;
const RE_THEN_MARK_VISITED_CURRENT = /^방문\s*표시를\s*한다$/u;
const RE_THEN_MARK_VISITED_NODE = /^(.+?)를\s*방문\s*표시한다$/u;
const RE_THEN_ENQUEUE_NEIGHBORS_QUEUE = /^이웃을\s*큐에\s*추가한다$/u;
const RE_THEN_ENQUEUE_NEIGHBORS_STACK = /^이웃을\s*스택에\s*추가한다$/u;

export function parseCnl(cnlText: string): { rules: RuleSet; errors: CnlParsingError[] } {
  const lines = cnlText.split('\n').filter(line => line.trim() !== '');
  const rules: RuleSet = [];
  const errors: CnlParsingError[] = [];
  let pendingWhen: Rule['when'] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    try {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) return;

      // New colon-style grammar: "…이면: 동작1하고 동작2"
      const colonParsed = parseColonStyleSafe(trimmed, lineNumber);
      if (colonParsed) {
        const finalRule: Rule = { when: colonParsed.when, then: colonParsed.then, sourceLine: lineNumber };
        rules.push(finalRule);
        return;
      }

      const clauses = trimmed.replace(/[\.\s]+$/u, '').split(',').map(s => s.trim()).filter(s => s.length > 0);
      let thenClauseFound = false;
      let lineWhen: Rule['when'] = [];
      let lineThen: Rule['then'] = [];

      for (const clause of clauses) {
        let matched = false;
        let m: RegExpMatchArray | null;

        m = clause.match(RE_WHEN_COMBINED);
        if (m) { if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber); lineWhen.push({ has: m[1].trim() }); lineWhen.push({ at: m[2].trim() }); matched = true; }

        if (!matched) { m = clause.match(RE_WHEN_AT); if (m) { if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber); lineWhen.push({ at: m[1].trim() }); matched = true; } }
        if (!matched) { m = clause.match(RE_WHEN_QUEUE_NOT_EMPTY); if (m) { if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber); lineWhen.push({ queueNotEmpty: true }); matched = true; } }
        if (!matched) { m = clause.match(RE_WHEN_STACK_NOT_EMPTY); if (m) { if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber); lineWhen.push({ stackNotEmpty: true }); matched = true; } }
        if (!matched) { m = clause.match(RE_WHEN_NOT_VISITED_CURRENT); if (m) { if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber); lineWhen.push({ notVisited: 'current' }); matched = true; } }
        if (!matched) { m = clause.match(RE_WHEN_NOT_VISITED_NODE); if (m) { if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber); lineWhen.push({ notVisited: m[1].trim() }); matched = true; } }

        if (matched) continue;

        m = clause.match(RE_THEN_MOVE) || clause.match(RE_THEN_MOVE_SH); if (m) { thenClauseFound = true; lineThen.push({ moveTo: m[1].trim() }); matched = true; }

        if (!matched) { m = clause.match(RE_THEN_PICKUP); if (m) { thenClauseFound = true; lineThen.push({ pickup: m[1].trim() }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_DROP); if (m) { thenClauseFound = true; lineThen.push({ drop: m[1].trim() }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_ADD_TO_QUEUE); if (m) { thenClauseFound = true; lineThen.push({ addToQueue: m[1].trim() }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_POP_FROM_QUEUE); if (m) { thenClauseFound = true; lineThen.push({ popFromQueue: true }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_ADD_TO_STACK); if (m) { thenClauseFound = true; lineThen.push({ addToStack: m[1].trim() }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_POP_FROM_STACK); if (m) { thenClauseFound = true; lineThen.push({ popFromStack: true }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_MARK_VISITED_CURRENT); if (m) { thenClauseFound = true; lineThen.push({ markVisited: 'current' }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_MARK_VISITED_NODE); if (m) { thenClauseFound = true; lineThen.push({ markVisited: m[1].trim() }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_ENQUEUE_NEIGHBORS_QUEUE); if (m) { thenClauseFound = true; lineThen.push({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'queue' } }); matched = true; } }
        if (!matched) { m = clause.match(RE_THEN_ENQUEUE_NEIGHBORS_STACK); if (m) { thenClauseFound = true; lineThen.push({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'stack' } }); matched = true; } }

        if (!matched) throw new CnlParsingError(`'${clause}' 절을 해석할 수 없습니다.`, lineNumber);
      }

      const uniq = <T,>(arr: T[]) => Array.from(new Map(arr.map(a => [JSON.stringify(a), a])).values());
      lineWhen = uniq(lineWhen);
      lineThen = uniq(lineThen);

      if (lineThen.length === 0) {
        if (lineWhen.length > 0) { pendingWhen = uniq([...pendingWhen, ...lineWhen]); return; }
        throw new CnlParsingError('규칙에 동작(then)이 없습니다.', lineNumber);
      }

      const finalWhen = (pendingWhen.length > 0 || lineWhen.length > 0) ? uniq([...pendingWhen, ...lineWhen]) : [{ always: true }];
      const finalRule: Rule = { when: finalWhen, then: lineThen, sourceLine: lineNumber };
      rules.push(finalRule);
      pendingWhen = [];
    } catch (e) {
      if (e instanceof CnlParsingError) { errors.push(e); } else { errors.push(new CnlParsingError('알 수 없는 오류가 발생했습니다.', lineNumber)); }
    }
  });

  if (pendingWhen.length > 0) {
    errors.push(new CnlParsingError('조건 절 뒤에 동작(then) 절이 필요합니다. 예: "..., 이동: B"', lines.length));
  }

  return { rules, errors };
}

// ---------------
// Colon-style CNL
// ---------------

// Split "…이면 …" or "…이면: …"; colon is optional for readability
const RE_COLON_SPLIT = /^(?<left>.+?(?:이면|라면|하면|였다면|었다면|했다면|다면))\s*(?::)?\s*(?<right>.+)$/u;
const RE_COND_FIRST_AT_NODE = /([A-Za-z0-9]+)\s*에\s*처음\s*도착/u;
const RE_COND_AT_NODE = /([A-Za-z0-9]+)\s*에\s*도착/u;
const RE_COND_HAS_ITEM = /(?:'(?<qitem>[^']+)'|(?<item>[가-힣A-Za-z0-9]+))\s*(?:를|을|이|가)?\s*(?:가지고\s*있|있)(?:\s*고|\s*이며|\s*면|\b)/gu;
const RE_COND_NOT_VISITED_ANY = /아직\s*방문\s*하지\s*않았/u;

// Actions: accept more natural "방문 처리" w/ or w/o explicit verb
const RE_THEN_MARK_VISITED_FLEX = /^(?:방문\s*(?:표시|처리))(?:\s*(?:를)?\s*(?:한다|합니다))?$/u;

function uniqColon<T>(arr: T[]): T[] { return Array.from(new Map(arr.map(a => [JSON.stringify(a), a])).values()); }

function parseColonStyleSafe(line: string, lineNumber: number): { when: Rule['when']; then: Rule['then'] } | null {
  const m = line.match(RE_COLON_SPLIT);
  if (!m || !m.groups) return null;
  const left = m.groups.left.trim();
  const right = m.groups.right.trim().replace(/[.\s]+$/u, '');

  const when: Rule['when'] = [];

  // "B에 처음 도착했다면"
  const firstAt = left.match(RE_COND_FIRST_AT_NODE);
  if (firstAt) {
    const nodeId = firstAt[1].trim();
    when.push({ at: nodeId }, { notVisited: nodeId });
  }

  // "B에 도착했다면"
  if (!firstAt) {
    const atM = left.match(RE_COND_AT_NODE);
    if (atM) when.push({ at: atM[1].trim() });
  }

  // "열쇠가 있고" / "'열쇠'를 가지고 있고"
  let hm: RegExpExecArray | null;
  const hasRe = new RegExp(RE_COND_HAS_ITEM, 'gu');
  while ((hm = hasRe.exec(left)) !== null) {
    const item = (hm.groups?.qitem || hm.groups?.item || '').trim().replace(/(?:을|를|이|가)$/u, '');
    if (item) when.push({ has: item });
  }

  // "아직 방문하지 않았다면" (노드 미지정이면 current)
  if (RE_COND_NOT_VISITED_ANY.test(left)) {
    const nodeCond = when.find(c => 'at' in c) as { at?: string } | undefined;
    if (nodeCond?.at) when.push({ notVisited: nodeCond.at }); else when.push({ notVisited: 'current' });
  }

  const then: Rule['then'] = [];
  // Split actions on natural connectors
  const actionParts = right
    .split(/\s*(?:하고|한\s*뒤|그리고|그\s*다음|그리고\s*나서|,)+\s*/u)
    .map(s => s.trim())
    .filter(Boolean);

  for (const part of actionParts) {
    let matched = false;
    let am: RegExpMatchArray | null;

    am = part.match(/^(.+?)\S*이동한다$/u) || part.match(/^이동\s*:\s*(.+)$/u);
    if (am) { const node = am[1].trim().replace(/(?:으로|로|에)$/u, ''); then.push({ moveTo: node }); matched = true; }

    if (!matched) { am = part.match(/^(.+?)\S*줍는\S*$/u); if (am) { const item = am[1].trim().replace(/(?:을|를|이|가)$/u, ''); then.push({ pickup: item }); matched = true; } }
    if (!matched) { am = part.match(/^(.+?)\S*(?:버린\S*|사용한다)$/u); if (am) { const item = am[1].trim().replace(/(?:을|를|이|가)$/u, ''); then.push({ drop: item }); matched = true; } }
    if (!matched) { am = part.match(/^큐에\s*(.+?)\S*추\S*한다$/u); if (am) { then.push({ addToQueue: am[1].trim() }); matched = true; } }
    if (!matched) { am = part.match(RE_THEN_POP_FROM_QUEUE); if (am) { then.push({ popFromQueue: true }); matched = true; } }
    if (!matched) { am = part.match(/^스택\S*(.+?)\S*(?:에\s*추\S*한다)$/u); if (am) { then.push({ addToStack: am[1].trim() }); matched = true; } }
    if (!matched) { am = part.match(RE_THEN_POP_FROM_STACK); if (am) { then.push({ popFromStack: true }); matched = true; } }
    if (!matched) { am = part.match(RE_THEN_MARK_VISITED_FLEX); if (am) { then.push({ markVisited: 'current' }); matched = true; } }
    if (!matched) { am = part.match(/^(.+?)\S*방문\s*표시한다$/u); if (am) { then.push({ markVisited: am[1].trim() }); matched = true; } }
    if (!matched) { am = part.match(RE_THEN_ENQUEUE_NEIGHBORS_QUEUE); if (am) { then.push({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'queue' } }); matched = true; } }
    if (!matched) { am = part.match(RE_THEN_ENQUEUE_NEIGHBORS_STACK); if (am) { then.push({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'stack' } }); matched = true; } }

    if (!matched) {
      throw new CnlParsingError(`'${part}' 를 해석할 수 없습니다.`, lineNumber);
    }
  }

  if (then.length === 0) {
    throw new CnlParsingError('규칙에 동작(then)이 없습니다.', lineNumber);
  }

  return { when: uniqColon(when.length > 0 ? when : [{ always: true }]), then: uniqColon(then) };
}
