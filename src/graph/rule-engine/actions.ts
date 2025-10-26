import type { PuzzleState, Action } from './types';
import { produce } from 'immer';
import type { Graph } from '../model';

// 여러 액션을 조합하는 헬퍼 함수
// const applySequentialActions = (state: PuzzleState, graph: Graph, actions: Action[]): PuzzleState => {
//   return produce(state, draft => {
//     for (const action of actions) {
//       const key = Object.keys(action)[0];
//       const executor = EXECUTORS[key];
//       if (executor) {
//         Object.assign(draft, executor(draft, action[key], graph));
//       }
//     }
//   });
// };

type ActionExecutor = (state: PuzzleState, params: any, graph: Graph) => PuzzleState;
type ActionValidator = (state: PuzzleState, params: any, graph: Graph) => boolean;

const EXECUTORS: Record<string, ActionExecutor> = {
  moveTo: produce((draft, nodeId, graph) => {
    const edge = graph.edges.find(e => e.source === draft.entity.at && e.target === nodeId);
    if (edge && (!edge.requiresItem || draft.entity.inventory.includes(edge.requiresItem))) {
      draft.entity.at = nodeId;
    }
  }),
  pickup: produce((draft, itemId) => {
    const node = draft.nodes[draft.entity.at];
    if (node && node.tags.some(t => t === `item:${itemId}`)) {
      if (!draft.entity.inventory.includes(itemId)) { draft.entity.inventory.push(itemId); }
      node.tags = node.tags.filter(t => t !== `item:${itemId}`);
    }
  }),
  drop: produce((draft, itemId) => {
    const index = draft.entity.inventory.indexOf(itemId);
    if (index > -1) { draft.entity.inventory.splice(index, 1); }
  }),
  addToQueue: produce((draft, nodeId: string) => {
    if (!draft.ds.queue.includes(nodeId)) { draft.ds.queue.push(nodeId); }
  }),
  popFromQueue: produce((draft, _params, graph) => {
    if (draft.ds.queue.length > 0) {
      const nodeId = draft.ds.queue.shift()!;
      draft.entity.at = nodeId;

      // 현재 노드가 미방문 상태인 경우, 즉시 방문 처리 및 이웃 추가
      const nodeState = draft.nodes[nodeId];
      if (nodeState && !nodeState.tags.includes('visited')) {
        nodeState.tags.push('visited');
        // enqueueNeighbors 로직을 여기에 통합
        const neighbors = graph.edges.filter(e => e.source === nodeId).map(e => e.target);
        const nodesToAdd = neighbors.filter(neighborId => 
          !draft.nodes[neighborId]?.tags.includes('visited') && 
          !draft.ds.queue.includes(neighborId)
        );
        draft.ds.queue.push(...nodesToAdd);
      }
    }
  }),
  addToStack: produce((draft, nodeId: string) => {
    if (!draft.ds.stack.includes(nodeId)) { draft.ds.stack.push(nodeId); }
  }),
  popFromStack: produce((draft, _params, graph) => {
    if (draft.ds.stack.length > 0) {
      const nodeId = draft.ds.stack.pop()!;
      draft.entity.at = nodeId;

      const nodeState = draft.nodes[nodeId];
      if (nodeState && !nodeState.tags.includes('visited')) {
        nodeState.tags.push('visited');
        const neighbors = graph.edges.filter(e => e.source === nodeId).map(e => e.target);
        const nodesToAdd = neighbors.filter(neighborId => 
          !draft.nodes[neighborId]?.tags.includes('visited') && 
          !draft.ds.stack.includes(neighborId)
        );
        draft.ds.stack.push(...nodesToAdd);
      }
    }
  }),
  markVisited: produce((draft, nodeId: string | 'current') => {
    const targetNodeId = nodeId === 'current' ? draft.entity.at : nodeId;
    if (draft.nodes[targetNodeId] && !draft.nodes[targetNodeId].tags.includes('visited')) {
      draft.nodes[targetNodeId].tags.push('visited');
    }
  }),
  enqueueNeighbors: produce((draft, options: { onlyUnvisited?: boolean; avoidDuplicates?: boolean; target?: 'queue' | 'stack' }, graph: Graph) => {
    const currentAt = draft.entity.at;
    const neighbors = graph.edges.filter(e => e.source === currentAt).map(e => e.target);
    const effectiveOptions = { onlyUnvisited: true, avoidDuplicates: true, target: 'queue', ...options };
    let nodesToAdd = neighbors;
    if (effectiveOptions.onlyUnvisited) {
      nodesToAdd = nodesToAdd.filter(nodeId => !draft.nodes[nodeId]?.tags.includes('visited'));
    }
    if (effectiveOptions.avoidDuplicates) {
      const dataStructure = effectiveOptions.target === 'queue' ? draft.ds.queue : draft.ds.stack;
      nodesToAdd = nodesToAdd.filter(nodeId => !dataStructure.includes(nodeId));
    }
    for (const nodeId of nodesToAdd) {
      if (effectiveOptions.target === 'queue') { draft.ds.queue.push(nodeId); } 
      else if (effectiveOptions.target === 'stack') { draft.ds.stack.push(nodeId); }
    }
  }),
};

const VALIDATORS: Record<string, ActionValidator> = {
  moveTo: (state, nodeId, graph) => {
    const edge = graph.edges.find(e => e.source === state.entity.at && e.target === nodeId);
    if (!edge) return false;
    return !edge.requiresItem || state.entity.inventory.includes(edge.requiresItem);
  },
  pickup: (state, itemId) => state.nodes[state.entity.at]?.tags.some(t => t === `item:${itemId}`) || false,
  drop: (state, itemId) => state.entity.inventory.includes(itemId),
  popFromQueue: (state) => state.ds.queue.length > 0,
  popFromStack: (state) => state.ds.stack.length > 0,
};

export function canExecuteAction(state: PuzzleState, action: Action, graph: Graph): boolean {
  const key = Object.keys(action)[0];
  const validator = VALIDATORS[key];
  if (!validator) return true;
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
