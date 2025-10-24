import type { Rule, RuleSet } from './rule-engine/types';

export class CnlParsingError extends Error {
  public line: number;
  constructor(message: string, line: number) {
    super(`[Line ${line}] ${message}`);
    this.name = 'CnlParsingError';
    this.line = line;
  }
}

// 안정적인 CNL 정규식 (Unicode 플래그 사용)
const RE_WHEN_COMBINED = /^(.+?)를\s*가지고\s*있고\s*(.+?)에\s*도착하면$/u; // "열쇠를 가지고 있고 B에 도착하면"
const RE_WHEN_AT = /^(.+?)에\s*도착하면$/u; // "A에 도착하면"
const RE_WHEN_QUEUE_NOT_EMPTY = /^큐가\s*비어있지\s*않다면$/u; // "큐가 비어있지 않다면"
const RE_WHEN_STACK_NOT_EMPTY = /^스택이\s*빌\s*때까지$/u; // "스택이 빌 때까지"
const RE_WHEN_NOT_VISITED_CURRENT = /^아직\s*방문하지\s*않았다면$/u; // "아직 방문하지 않았다면"
const RE_WHEN_NOT_VISITED_NODE = /^(.+?)를\s*아직\s*방문하지\s*않았다면$/u; // "X를 아직 방문하지 않았다면"

const RE_THEN_MOVE = /^(.+?)로\s*이동한다$/u; // "B로 이동한다"
const RE_THEN_MOVE_SH = /^이동\s*:\s*(.+)$/u; // "이동: B"
const RE_THEN_PICKUP = /^(.+?)를\s*줍는다$/u; // "열쇠를 줍는다"
const RE_THEN_DROP = /^(.+?)를\s*(?:버린다|사용한다)$/u; // "열쇠를 버린다/사용한다"
const RE_THEN_ADD_TO_QUEUE = /^큐에\s*(.+?)를\s*추가한다$/u; // "큐에 X를 추가한다"
const RE_THEN_POP_FROM_QUEUE = /^큐에서\s*다음\s*노드를\s*꺼낸다$/u; // "큐에서 다음 노드를 꺼낸다"
const RE_THEN_ADD_TO_STACK = /^스택에\s*(.+?)를\s*(?:넣는다|추가한다)$/u; // "스택에 X를 넣는다/추가한다"
const RE_THEN_POP_FROM_STACK = /^스택에서\s*다음\s*노드를\s*뺀다$/u; // "스택에서 다음 노드를 뺀다"
const RE_THEN_MARK_VISITED_CURRENT = /^방문\s*표시를\s*한다$/u; // "방문 표시를 한다"
const RE_THEN_MARK_VISITED_NODE = /^(.+?)를\s*방문\s*표시한다$/u; // "X를 방문 표시한다"
const RE_THEN_ENQUEUE_NEIGHBORS_QUEUE = /^이웃을\s*큐에\s*추가한다$/u; // "이웃을 큐에 추가한다"
const RE_THEN_ENQUEUE_NEIGHBORS_STACK = /^이웃을\s*스택에\s*추가한다$/u; // "이웃을 스택에 추가한다"

export function parseCnl(cnlText: string): { rules: RuleSet; errors: CnlParsingError[] } {
  const lines = cnlText.split('\n').filter(line => line.trim() !== '');
  const rules: RuleSet = [];
  const errors: CnlParsingError[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    try {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) return;

      const rule: Rule = { when: [], then: [], sourceLine: lineNumber };

      const clauses = trimmed
        .replace(/[\.\s]+$/u, '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let thenClauseFound = false;

      for (const clause of clauses) {
        let matched = false;
        let m: RegExpMatchArray | null;

        // WHEN: 결합형 (열쇠를 가지고 있고 B에 도착하면)
        m = clause.match(RE_WHEN_COMBINED);
        if (m) {
          if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
          rule.when.push({ has: m[1].trim() });
          rule.when.push({ at: m[2].trim() });
          matched = true;
        }

        // WHEN: 단일 위치 (A에 도착하면)
        if (!matched) {
          m = clause.match(RE_WHEN_AT);
          if (m) {
            if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
            rule.when.push({ at: m[1].trim() });
            matched = true;
          }
        }

        // WHEN: 큐가 빌 때까지
        if (!matched) {
          m = clause.match(RE_WHEN_QUEUE_NOT_EMPTY);
          if (m) {
            if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
            rule.when.push({ queueNotEmpty: true });
            matched = true;
          }
        }

        // WHEN: 스택이 빌 때까지
        if (!matched) {
          m = clause.match(RE_WHEN_STACK_NOT_EMPTY);
          if (m) {
            if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
            rule.when.push({ stackNotEmpty: true });
            matched = true;
          }
        }

        // WHEN: 아직 방문하지 않았다면 (현재 노드)
        if (!matched) {
          m = clause.match(RE_WHEN_NOT_VISITED_CURRENT);
          if (m) {
            if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
            rule.when.push({ notVisited: 'current' });
            matched = true;
          }
        }

        // WHEN: X를 아직 방문하지 않았다면
        if (!matched) {
          m = clause.match(RE_WHEN_NOT_VISITED_NODE);
          if (m) {
            if (thenClauseFound) throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
            rule.when.push({ notVisited: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 이동 (정식/축약)
        if (!matched) {
          m = clause.match(RE_THEN_MOVE) || clause.match(RE_THEN_MOVE_SH);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ moveTo: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 줍는다
        if (!matched) {
          m = clause.match(RE_THEN_PICKUP);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ pickup: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 버린다/사용한다
        if (!matched) {
          m = clause.match(RE_THEN_DROP);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ drop: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 큐에 X를 추가한다
        if (!matched) {
          m = clause.match(RE_THEN_ADD_TO_QUEUE);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ addToQueue: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 큐에서 다음 노드를 꺼낸다
        if (!matched) {
          m = clause.match(RE_THEN_POP_FROM_QUEUE);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ popFromQueue: true });
            matched = true;
          }
        }

        // THEN: 스택에 X를 넣는다/추가한다
        if (!matched) {
          m = clause.match(RE_THEN_ADD_TO_STACK);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ addToStack: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 스택에서 다음 노드를 뺀다
        if (!matched) {
          m = clause.match(RE_THEN_POP_FROM_STACK);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ popFromStack: true });
            matched = true;
          }
        }

        // THEN: 방문 표시를 한다 (현재 노드)
        if (!matched) {
          m = clause.match(RE_THEN_MARK_VISITED_CURRENT);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ markVisited: 'current' });
            matched = true;
          }
        }

        // THEN: X를 방문 표시한다
        if (!matched) {
          m = clause.match(RE_THEN_MARK_VISITED_NODE);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ markVisited: m[1].trim() });
            matched = true;
          }
        }

        // THEN: 이웃을 큐에 추가한다
        if (!matched) {
          m = clause.match(RE_THEN_ENQUEUE_NEIGHBORS_QUEUE);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'queue' } });
            matched = true;
          }
        }

        // THEN: 이웃을 스택에 추가한다
        if (!matched) {
          m = clause.match(RE_THEN_ENQUEUE_NEIGHBORS_STACK);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'stack' } });
            matched = true;
          }
        }

        if (!matched) {
          throw new CnlParsingError(`'${clause}' 절을 해석할 수 없습니다.`, lineNumber);
        }
      }

      // then이 하나도 없으면 오류
      if (rule.then.length === 0) {
        throw new CnlParsingError('규칙에 동작(then)이 없습니다.', lineNumber);
      }

      // 조건이 비어 있으면 always 추가
      if (rule.when.length === 0) {
        rule.when.push({ always: true });
      }

      // 중복 제거
      const uniq = <T,>(arr: T[]) => Array.from(new Map(arr.map(a => [JSON.stringify(a), a])).values());
      rule.when = uniq(rule.when);
      rule.then = uniq(rule.then);

      rules.push(rule);
    } catch (e) {
      if (e instanceof CnlParsingError) {
        errors.push(e);
      } else {
        errors.push(new CnlParsingError('알 수 없는 오류가 발생했습니다.', lineNumber));
      }
    }
  });

  return { rules, errors };
}
