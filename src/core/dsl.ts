/**
 * Represents the state that the rules will operate on.
 * This is a generic placeholder and will be replaced by a more specific type.
 */
export type RuleState<T extends object = Record<string, unknown>> = T;

/**
 * Defines a rule that can be executed by the DSL runtime.
 */
export interface Rule<TState extends object
  = Record<string, unknown>, TParams extends object = Record<string, unknown>> {
  description?: string;
  event: string;
  condition?: (state: TState) => boolean;
  action: (state: TState, params?: TParams) => void;
  params?: TParams;
}

/**
 * Executes a given rule against a state object.
 * The action is only performed if the rule has no condition or if the condition returns true.
 *
 * @param rule The rule to execute.
 * @param state The current state to pass to the rule's condition and action.
 * @returns The (potentially) modified state.
 */
export function runRule<TState extends object
  = Record<string, unknown>, TParams extends object = Record<string, unknown>>(
    rule: Rule<TState, TParams>,
    state: TState): TState {
  if (!rule.condition || rule.condition(state)) {
    rule.action(state, rule.params);
  }
  return state;
}