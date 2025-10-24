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
  addToQueue: produce((draft, nodeId: string) => {
    if (!draft.ds.queue.includes(nodeId)) {
      draft.ds.queue.push(nodeId);
    }
  }),
  popFromQueue: produce((draft) => {
    if (draft.ds.queue.length > 0) {
      const nextNode = draft.ds.queue.shift();
      if (nextNode) {
        draft.entity.at = nextNode;
      }
    }
  }),
  addToStack: produce((draft, nodeId: string) => {
    if (!draft.ds.stack.includes(nodeId)) {
      draft.ds.stack.push(nodeId);
    }
  }),
  popFromStack: produce((draft) => {
    if (draft.ds.stack.length > 0) {
      const nextNode = draft.ds.stack.pop();
      if (nextNode) {
        draft.entity.at = nextNode;
      }
    }
  }),
  markVisited: produce((draft, nodeId: string | 'current') => {
    const targetNodeId = nodeId === 'current' ? draft.entity.at : nodeId;
    if (draft.nodes[targetNodeId]) {
      if (!draft.nodes[targetNodeId].tags.includes('visited')) {
        draft.nodes[targetNodeId].tags.push('visited');
      }
    }
  }),
  enqueueNeighbors: produce((draft, options: { onlyUnvisited?: boolean; avoidDuplicates?: boolean; target?: 'queue' | 'stack' }, graph: Graph) => {
    const currentAt = draft.entity.at;
    const neighbors = graph.edges.filter(e => e.source === currentAt).map(e => e.target);

    const effectiveOptions = {
      onlyUnvisited: true,
      avoidDuplicates: true,
      target: 'queue',
      ...options,
    };

    let nodesToAdd = neighbors;

    if (effectiveOptions.onlyUnvisited) {
      nodesToAdd = nodesToAdd.filter(nodeId => !draft.nodes[nodeId]?.tags.includes('visited'));
    }

    if (effectiveOptions.avoidDuplicates) {
      if (effectiveOptions.target === 'queue') {
        nodesToAdd = nodesToAdd.filter(nodeId => !draft.ds.queue.includes(nodeId));
      } else if (effectiveOptions.target === 'stack') {
        nodesToAdd = nodesToAdd.filter(nodeId => !draft.ds.stack.includes(nodeId));
      }
    }

    for (const nodeId of nodesToAdd) {
      if (effectiveOptions.target === 'queue') {
        draft.ds.queue.push(nodeId);
      } else if (effectiveOptions.target === 'stack') {
        draft.ds.stack.push(nodeId);
      }
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
  popFromQueue: (state) => state.ds.queue.length > 0,
  popFromStack: (state) => state.ds.stack.length > 0,
  // For other new actions, default to true if no specific validation is needed beyond existence
  // addToQueue, addToStack, markVisited, enqueueNeighbors are generally always executable if parameters are valid
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
