import type { PuzzleState, Condition } from './types';

type ConditionChecker = (state: PuzzleState, params: any) => boolean;

const CHECKERS: Record<string, ConditionChecker> = {
  at: (state, nodeId) => state.entity.at === nodeId,
  has: (state, itemId) => state.entity.inventory.includes(itemId),
  always: () => true,
  queueIsEmpty: (state) => state.ds.queue.length === 0,
  queueNotEmpty: (state) => state.ds.queue.length > 0,
  stackIsEmpty: (state) => state.ds.stack.length === 0,
  stackNotEmpty: (state) => state.ds.stack.length > 0,
  queueContainsNode: (state, nodeId: string) => state.ds.queue.includes(nodeId),
  stackContainsNode: (state, nodeId: string) => state.ds.stack.includes(nodeId),
  visited: (state, nodeId: string | 'current') => {
    const targetNodeId = nodeId === 'current' ? state.entity.at : nodeId;
    return state.nodes[targetNodeId]?.tags.includes('visited') || false;
  },
  notVisited: (state, nodeId: string | 'current') => {
    const targetNodeId = nodeId === 'current' ? state.entity.at : nodeId;
    const node = state.nodes[targetNodeId];
    if (!node) return false; // 존재하지 않는 노드는 조건 판정하지 않음
    return !node.tags.includes('visited');
  },
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
