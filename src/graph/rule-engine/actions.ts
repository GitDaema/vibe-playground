import type { PuzzleState, Action } from './types';
import { produce } from 'immer';
import type { Graph } from '../model';

type ActionExecutor = (state: PuzzleState, params: any, graph: Graph) => PuzzleState;
type ActionValidator = (state: PuzzleState, params: any, graph: Graph) => boolean;

const EXECUTORS: Record<string, ActionExecutor> = {
  moveTo: produce((draft, nodeId, graph) => {
    const edge = graph.edges.find(e => e.source === draft.entity.at && e.target === nodeId);
    if (edge) {
      if (!edge.requiresItem || draft.entity.inventory.includes(edge.requiresItem)) {
        draft.entity.at = nodeId;
      }
    }
  }),
  pickup: produce((draft, itemId) => {
    const node = draft.nodes[draft.entity.at];
    if (node && node.tags.some(t => t === `item:${itemId}`)) {
      if (!draft.entity.inventory.includes(itemId)) {
        draft.entity.inventory.push(itemId);
      }
      // Remove item from node after pickup
      node.tags = node.tags.filter(t => t !== `item:${itemId}`);
    }
  }),
  drop: produce((draft, itemId) => {
    const index = draft.entity.inventory.indexOf(itemId);
    if (index > -1) {
      draft.entity.inventory.splice(index, 1);
    }
  }),
};

const VALIDATORS: Record<string, ActionValidator> = {
  moveTo: (state, nodeId, graph) => {
    const edge = graph.edges.find(e => e.source === state.entity.at && e.target === nodeId);
    if (!edge) return false; // No direct path
    if (edge.requiresItem && !state.entity.inventory.includes(edge.requiresItem)) {
      return false; // Path is locked
    }
    return true;
  },
  pickup: (state, itemId) => {
    const node = state.nodes[state.entity.at];
    return node?.tags.some(t => t === `item:${itemId}`) || false;
  },
  drop: (state, itemId) => state.entity.inventory.includes(itemId),
};

export function canExecuteAction(state: PuzzleState, action: Action, graph: Graph): boolean {
  const key = Object.keys(action)[0];
  const validator = VALIDATORS[key];
  if (!validator) return true; // Default to true if no validator
  return validator(state, action[key], graph);
}

export function executeAction(state: PuzzleState, action: Action, graph: Graph): PuzzleState {
  const key = Object.keys(action)[0];
  const executor = EXECUTORS[key];
  if (!executor) {
    console.warn(`Unknown action executor: ${key}`);
    return state;
  }
  return executor(state, action[key], graph);
}
