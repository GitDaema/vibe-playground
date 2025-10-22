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
    const applicableRule = this.findApplicableRule();
    if (!applicableRule) return null;

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
      log: `[L${applicableRule.sourceLine}] ${this.getRuleLog(applicableRule)}`,
    };
  }

  private findApplicableRule(): Rule | undefined {
    for (const rule of this.rules) {
      const allConditionsMet = rule.when.every(condition => checkCondition(this.state, condition));
      if (!allConditionsMet) continue;
      const allActionsCanExecute = rule.then.every(action => canExecuteAction(this.state, action, this.graph));
      if (allActionsCanExecute) return rule;
    }
    return undefined;
  }

  public getNoRuleApplicableFeedback(): string {
    for (const rule of this.rules) {
      const allConditionsMet = rule.when.every(condition => checkCondition(this.state, condition));
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

  private getRuleLog(rule: Rule): string {
    const conditionStr = rule.when.map(c => Object.keys(c)[0]).join(', ');
    const actionStr = rule.then.map(a => {
      const key = Object.keys(a)[0];
      const value = (a as any)[key];
      return `${key}(${value})`;
    }).join(', ');
    return `(${conditionStr}) → ${actionStr}. Entity at: ${this.state.entity.at}`;
  }
}
