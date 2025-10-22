import type { Rule, Condition, Action, RuleSet } from './rule-engine/types';

// 오류 정보를 담는 클래스
export class CnlParsingError extends Error {
  public line: number;
  constructor(message: string, line: number) {
    super(`[Line ${line}] ${message}`);
    this.name = 'CnlParsingError';
    this.line = line;
  }
}

// CNL의 각 절(clause)을 파싱하는 템플릿
interface ClauseTemplate {
  regex: RegExp;
  type: 'when' | 'then';
  factory: (match: RegExpMatchArray) => Condition | Action;
}

// 지원할 CNL 패턴 정의
const CLAUSE_PATTERNS: ClauseTemplate[] = [
  // 조건 (when)
  {
    regex: /(.+?)에 (?:도착하면|있으면)/,
    type: 'when',
    factory: (m) => ({ at: m[1].trim() }),
  },
  {
    regex: /(.+?)를 가지고 있으면/,
    type: 'when',
    factory: (m) => ({ has: m[1].trim() }),
  },
  // 행동 (then)
  {
    regex: /(.+?)(?:로|으로) 이동(?:한다)?/,
    type: 'then',
    factory: (m) => ({ moveTo: m[1].trim() }),
  },
  {
    regex: /(.+?)를 (?:줍는다|얻는다)/,
    type: 'then',
    factory: (m) => ({ pickup: m[1].trim() }),
  },
  {
    regex: /(.+?)를 (?:사용한다|버린다)/,
    type: 'then',
    factory: (m) => ({ drop: m[1].trim() }),
  },
  // 약식 표현 (Shorthand)
  {
    regex: /이동\s*→\s*(.+)/,
    type: 'then',
    factory: (m) => ({ moveTo: m[1].trim() }),
  },
];

/**
 * 제어된 자연어(CNL) 텍스트를 파싱하여 규칙 세트(RuleSet) JSON으로 변환합니다.
 * @param cnlText 사용자가 입력한 여러 줄의 CNL
 * @returns 파싱된 규칙 세트와 발생한 오류 목록
 */
export function parseCnl(cnlText: string): { rules: RuleSet; errors: CnlParsingError[] } {
  const lines = cnlText.split('\n').filter(line => line.trim() !== '');
  const rules: RuleSet = [];
  const errors: CnlParsingError[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    try {
      // 주석은 무시
      if (line.trim().startsWith('#')) {
        return;
      }
      
      const rule: Rule = {
        when: [],
        then: [],
        sourceLine: lineNumber,
      };

      // "A하면, B하고, C한다" -> ["A하면", "B하고", "C한다"]
      const clauses = line.replace(/[\.\s]+$/u, '').split(',').map(s => s.trim());
      let thenClauseFound = false;

      for (const clause of clauses) {
        let matched = false;
        // Pre-parse common Korean CNL patterns (Unicode-aware)
        let m: RegExpMatchArray | null;
        // WHEN: combined ("열쇠를 가지고 있고 B에 도착하면")
        m = clause.match(/^(.+?)를\s*가지고\s*있고\s*(.+?)에\s*도착하면$/u);
        if (m) {
          if (thenClauseFound) {
            throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
          }
          rule.when.push({ has: m[1].trim() });
          rule.when.push({ at: m[2].trim() });
          matched = true;
        }
        // WHEN: at ("A에 도착하면")
        if (!matched) {
          m = clause.match(/^(.+?)에\s*도착하면$/u);
          if (m) {
            if (thenClauseFound) {
              throw new CnlParsingError('조건 절이 동작 이후에 나왔습니다.', lineNumber);
            }
            rule.when.push({ at: m[1].trim() });
            matched = true;
          }
        }
        // THEN: move or shorthand
        if (!matched) {
          m = clause.match(/^(.+?)로\s*이동한다$/u) || clause.match(/^이동\s*:\s*(.+)$/u);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ moveTo: m[1].trim() });
            matched = true;
          }
        }
        // THEN: pickup
        if (!matched) {
          m = clause.match(/^(.+?)를\s*줍는다$/u);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ pickup: m[1].trim() });
            matched = true;
          }
        }
        // THEN: drop/use
        if (!matched) {
          m = clause.match(/^(.+?)를\s*(?:버린다|사용한다)$/u);
          if (m) {
            thenClauseFound = true;
            rule.then.push({ drop: m[1].trim() });
            matched = true;
          }
        }
        if (!matched) {
        for (const pattern of CLAUSE_PATTERNS) {
          const match = clause.match(pattern.regex);
          if (match) {
            const part = pattern.factory(match);
            if (pattern.type === 'when') {
              if (thenClauseFound) {
                throw new CnlParsingError('조건절은 행동절 뒤에 올 수 없습니다.', lineNumber);
              }
              rule.when.push(part as Condition);
            } else {
              thenClauseFound = true;
              rule.then.push(part as Action);
            }
            matched = true;
            break;
          }
        }
        }
        if (!matched) {
          throw new CnlParsingError(`'${clause}' 절을 해석할 수 없습니다.`, lineNumber);
        }
      }

      if (rule.then.length === 0) {
        throw new CnlParsingError('규칙에 행동(then)이 없습니다.', lineNumber);
      }
      
      // 조건이 없는 경우, 항상 참인 조건 추가 (암시적)
      if (rule.when.length === 0) {
        rule.when.push({ always: true });
      }

      // 중복 제거 (동일한 조건/동작이 여러 번 파싱된 경우)
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
