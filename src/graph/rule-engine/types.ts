/**
 * 조건절을 나타내는 타입.
 * 예: { "at": "A" }, { "has": "key" }
 */
export interface Condition {
  [key: string]: any;
}

/**
 * 행동절을 나타내는 타입.
 * 예: { "moveTo": "B" }, { "open": "door" }
 */
export interface Action {
  [key: string]: any;
}

/**
 * 하나의 완전한 규칙.
 * 'when'의 모든 조건이 참일 때 'then'의 모든 행동을 실행.
 */
export interface Rule {
  when: Condition[];
  then: Action[];
  sourceLine: number; // 이 규칙이 파생된 원본 CNL 라인 번호
}

/**
 * 전체 규칙 세트.
 */
export type RuleSet = Rule[];

/**
 * 퍼즐의 현재 상태.
 * 개체의 위치, 인벤토리, 노드 상태 등을 포함.
 */
export interface PuzzleState {
  entity: {
    at: string; // 현재 위치
    inventory: string[]; // 보유 아이템
    target?: string; // 이동 목표(옵션)
  };
  nodes: {
    [nodeId: string]: {
      tags: string[]; // 'start', 'goal', 'visited' 등
    };
  };
  ds: {
    queue: string[];
    stack: string[];
  };
}
