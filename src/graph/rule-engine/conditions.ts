import type { PuzzleState, Condition } from './types';

type ConditionChecker = (state: PuzzleState, params: any) => boolean;

const CHECKERS: Record<string, ConditionChecker> = {
  at: (state, nodeId) => state.entity.at === nodeId,
  has: (state, itemId) => state.entity.inventory.includes(itemId),
  always: () => true,
};

/**
 * 주어진 조건이 현재 퍼즐 상태에서 참인지 확인합니다.
 * @param state 현재 퍼즐 상태
 * @param condition 확인할 조건
 * @returns 조건 충족 여부
 */
export function checkCondition(state: PuzzleState, condition: Condition): boolean {
  const key = Object.keys(condition)[0];
  const checker = CHECKERS[key];
  if (!checker) {
    console.warn(`Unknown condition checker: ${key}`);
    return false;
  }
  return checker(state, condition[key]);
}
