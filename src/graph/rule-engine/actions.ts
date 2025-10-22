import type { PuzzleState, Action } from './types';
import type { Graph } from '../model';
import { produce } from 'immer';

type ActionExecutor = (state: PuzzleState, params: any, ctx: { graph: Graph }) => PuzzleState;

const EXECUTORS: Record<string, ActionExecutor> = {
  moveTo: (state, nodeId, ctx) => {
    const edge = ctx.graph.edges.find(e => e.source === state.entity.at && e.target === nodeId);
    if (!edge) {
      return state;
    }
    if (edge.requiresItem && !state.entity.inventory.includes(edge.requiresItem)) {
      return state;
    }
    return produce(state, (draft) => {
      draft.entity.at = nodeId;
    });
  },
  pickup: produce((draft, itemId) => {
    if (!draft.entity.inventory.includes(itemId)) {
      draft.entity.inventory.push(itemId);
    }
    const nodeTags = draft.nodes[draft.entity.at]?.tags;
    if (nodeTags) {
      const tag = `item:${itemId}`;
      const idx = nodeTags.indexOf(tag);
      if (idx > -1) nodeTags.splice(idx, 1);
    }
  }),
  drop: produce((draft, itemId) => {
    const index = draft.entity.inventory.indexOf(itemId);
    if (index > -1) {
      draft.entity.inventory.splice(index, 1);
    }
    const nodeTags = draft.nodes[draft.entity.at]?.tags;
    if (nodeTags) {
      const tag = `item:${itemId}`;
      if (!nodeTags.includes(tag)) nodeTags.push(tag);
    }
  }),
};

/**
 * 주어진 행동을 현재 퍼즐 상태에 적용하여 새로운 상태를 반환합니다.
 * @param state 현재 퍼즐 상태
 * @param action 적용할 행동
 * @returns 행동이 적용된 새로운 퍼즐 상태
 */
export function executeAction(state: PuzzleState, action: Action, ctx: { graph: Graph }): PuzzleState {
  const key = Object.keys(action)[0];
  const executor = EXECUTORS[key];
  if (!executor) {
    console.warn(`Unknown action executor: ${key}`);
    return state; // Return original state if action is unknown
  }
  return executor(state, action[key], ctx);
}
