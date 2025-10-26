import type { PuzzleState, RuleSet, Rule } from './types';
import { checkCondition } from './conditions';
import { executeAction, canExecuteAction } from './actions';
import type { Graph } from '../model';

export interface StepResult {
  newState: PuzzleState;
  appliedRule: Rule;
  isFinished: boolean;
  log: string;
}

export class RuleEngine {
  private state: PuzzleState;
  private readonly rules: RuleSet;
  private readonly graph: Graph;

  constructor(rules: RuleSet, initialState: PuzzleState, graph: Graph) {
    this.rules = rules;
    this.state = initialState;
    this.graph = graph;
  }

  public getCurrentState(): PuzzleState {
    return this.state;
  }

  public step(): StepResult | null {
    // Safety: ensure any items at current node are auto-picked before rule evaluation
    this.state = autoPickupAtCurrent(this.state);
    const applicableRule = this.findApplicableRule();
    if (!applicableRule) return null;

    const prevAt = this.state.entity.at;
    let nextState = this.state;
    for (const action of applicableRule.then) {
      nextState = executeAction(nextState, action, this.graph);
    }
    this.state = nextState;

    const isFinished = this.checkIsFinished();
    return {
      newState: this.state,
      appliedRule: applicableRule,
      isFinished,
      log: `[L${applicableRule.sourceLine}] ${this.getRuleLog(applicableRule, prevAt)}`,
    };
  }

  private findApplicableRule(): Rule | undefined {
    for (const rule of this.rules) {
      const allConditionsMet = rule.when.every(condition => checkCondition(this.state, condition, this.graph));
      if (!allConditionsMet) continue;
      const allActionsCanExecute = rule.then.every(action => canExecuteAction(this.state, action, this.graph));
      if (allActionsCanExecute) return rule;
    }
    return undefined;
  }

  public getNoRuleApplicableFeedback(): string {
    for (const rule of this.rules) {
      const allConditionsMet = rule.when.every(condition => checkCondition(this.state, condition, this.graph));
      if (allConditionsMet) {
        for (const action of rule.then) {
          if (!canExecuteAction(this.state, action, this.graph)) {
            const actionKey = Object.keys(action)[0];
            if (actionKey === 'moveTo') {
              const targetNode = (action as any)[actionKey];
              const edge = this.graph.edges.find(e => e.source === this.state.entity.at && e.target === targetNode);
              if (edge?.requiresItem) {
                return `이동 불가: ${edge.source}→${edge.target} 경로는 '${edge.requiresItem}' 아이템이 필요합니다.`;
              }
              if (!edge) {
                return `이동 불가: ${this.state.entity.at}에서 ${targetNode}로 가는 간선이 없습니다.`;
              }
            }
            return `규칙 ${rule.sourceLine}의 동작(${actionKey})을 실행할 수 없습니다.`;
          }
        }
      }
    }
    return '적용 가능한 규칙이 없습니다.';
  }

  private checkIsFinished(): boolean {
    return this.state.entity.at === this.graph.goalNodeId;
  }

  private getRuleLog(rule: Rule, prevAt: string): string {
    const conditionStr = rule.when.map(c => Object.keys(c)[0]).join(', ');
    const actionStr = rule.then.map(a => {
      const key = Object.keys(a)[0];
      const value = (a as any)[key];
      return `${key}(${value})`;
    }).join(', ');

    // If this step performed a queue/stack pop (BFS/DFS), show a plausible move route
    const didPop = rule.then.some(a => 'popFromQueue' in a || 'popFromStack' in a);
    let routeInfo = '';
    if (didPop) {
      const from = prevAt;
      const to = this.state.entity.at;
      const start = this.graph.startNodeId;

      const pieces: string[] = [];
      const pushPathOrHop = (a: string, b: string) => {
        if (a === b) { pieces.push(a); return; }
        const path = this.shortestPath(a, b);
        if (path) {
          for (let i = 0; i < path.length; i++) {
            if (i === 0 && pieces.length > 0) {
              // add edge separators for continuity
              pieces.push('->', path[i]);
            } else if (i === 0) {
              pieces.push(path[i]);
            } else {
              pieces.push('->', path[i]);
            }
          }
        } else {
          if (pieces.length === 0) pieces.push(a);
          pieces.push(' ~> ', b); // denote non-edge reposition
        }
      };

      if (start) {
        // Return-to-start concept between pops, but never forge edges
        if (from !== start) pushPathOrHop(from, start);
        else pieces.push(from);
        pushPathOrHop(start, to);
        if (to !== start) pushPathOrHop(to, start);
      } else {
        // No start defined: just describe from→to with real path or reposition
        pushPathOrHop(from, to);
      }

      // Collapse to string
      const routeStr = pieces.join('');
      routeInfo = ` Route: ${routeStr}`;
    }

    return `(${conditionStr}) → ${actionStr}.${routeInfo} Entity at: ${this.state.entity.at}`;
  }

  private hasTraversableEdge(from: string | undefined, to: string): boolean {
    if (!from) return false;
    const edge = this.graph.edges.find(e => e.source === from && e.target === to);
    if (!edge) return false;
    return !edge.requiresItem || this.state.entity.inventory.includes(edge.requiresItem);
  }

  // Compute a shortest directed path from 'from' to 'to' obeying item requirements.
  // Returns array of node ids including both endpoints, or null if unreachable.
  private shortestPath(from: string, to: string): string[] | null {
    if (from === to) return [from];
    const q: string[] = [from];
    const visited = new Set<string>([from]);
    const prev = new Map<string, string>();
    while (q.length > 0) {
      const cur = q.shift()!;
      const neighbors = this.graph.edges
        .filter(e => e.source === cur && (!e.requiresItem || this.state.entity.inventory.includes(e.requiresItem)))
        .map(e => e.target);
      for (const nb of neighbors) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        prev.set(nb, cur);
        if (nb === to) {
          // reconstruct
          const path: string[] = [to];
          let p = cur;
          while (p !== undefined) {
            path.push(p);
            const pp = prev.get(p);
            if (!pp) break;
            p = pp;
          }
          path.reverse();
          return path;
        }
        q.push(nb);
      }
    }
    return null;
  }
}

// Helper: auto-pickup items at the current node (idempotent)
function autoPickupAtCurrent(state: PuzzleState): PuzzleState {
  const current = state.entity.at;
  const node = state.nodes[current];
  if (!node || !node.tags || node.tags.length === 0) return state;
  const items = node.tags
    .filter(t => t.startsWith('item:'))
    .map(t => t.slice('item:'.length))
    .filter(Boolean);
  if (items.length === 0) return state;

  // clone shallow structures to keep referential stability expectations reasonable
  const newState: PuzzleState = {
    entity: {
      at: state.entity.at,
      inventory: [...state.entity.inventory],
    },
    nodes: { ...state.nodes },
    ds: {
      queue: [...state.ds.queue],
      stack: [...state.ds.stack],
    },
  };

  const nodeCopy = { ...node, tags: [...node.tags] };
  newState.nodes[current] = nodeCopy;

  for (const item of items) {
    if (!newState.entity.inventory.includes(item)) {
      newState.entity.inventory.push(item);
    }
  }
  nodeCopy.tags = nodeCopy.tags.filter(t => !t.startsWith('item:'));

  return newState;
}
