import type { PuzzleState, RuleSet, Rule } from './types';
import type { Graph } from '../model';
import { checkCondition } from './conditions';
import { executeAction } from './actions';

export interface StepResult {
  newState: PuzzleState;
  appliedRule: Rule;
  isFinished: boolean;
  log: string;
}

export class RuleEngine {
  private state: PuzzleState;
  private readonly rules: RuleSet;
  private readonly goalNodeId: string;
  private readonly graph: Graph;

  constructor(rules: RuleSet, initialState: PuzzleState, goalNodeId: string, graph: Graph) {
    this.rules = rules;
    this.state = initialState;
    this.goalNodeId = goalNodeId;
    this.graph = graph;
  }

  public getCurrentState(): PuzzleState {
    return this.state;
  }

  /**
   * Executes a single step of the puzzle logic.
   * It finds the first matching rule and applies its actions.
   * @returns A StepResult if a rule was applied, otherwise null.
   */
  public step(): StepResult | null {
    for (const rule of this.rules) {
      const allConditionsMet = rule.when.every(condition =>
        checkCondition(this.state, condition)
      );
      if (!allConditionsMet) continue;

      // Simulate applying the rule; if it produces no state change, skip it
      let candidate = this.state;
      for (const action of rule.then) {
        candidate = executeAction(candidate, action, { graph: this.graph });
      }
      if (candidate === this.state) {
        // no-op; try next rule
        continue;
      }

      this.state = candidate;
      const isFinished = this.checkIsFinished();
      return {
        newState: this.state,
        appliedRule: rule,
        isFinished,
        log: `[Line ${rule.sourceLine}] Rule applied. Entity at: ${this.state.entity.at}${isFinished ? ' (Goal Reached!)' : ''}`,
      };
    }

    return null; // No applicable rule that changes state
  }

  // Note: selection logic is handled directly in step() to allow skipping no-op rules

  private checkIsFinished(): boolean {
    return this.state.entity.at === this.goalNodeId;
  }
}
