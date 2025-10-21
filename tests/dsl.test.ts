import { describe, it, expect, vi } from 'vitest';
import { runRule, Rule } from '../src/core/dsl';

// Define a specific state type for testing to leverage generics
interface TestState {
  value: number;
  active: boolean;
}

describe('DSL Rule Runner with Generics', () => {
  it('should run the action if no condition is provided', () => {
    const action = vi.fn<(state: TestState, params?: Record<string, unknown>) => void>();
    const rule: Rule<TestState> = {
      event: 'test',
      action,
    };
    const state: TestState = { value: 1, active: true };

    runRule(rule, state);

    expect(action).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledWith(state, undefined);
  });

  it('should run the action if the condition returns true', () => {
    const action = vi.fn<(state: TestState) => void>();
    const condition = vi.fn((state: TestState) => state.active);
    const rule: Rule<TestState> = {
      event: 'test',
      condition,
      action,
    };
    const state: TestState = { value: 1, active: true };

    runRule(rule, state);

    expect(condition).toHaveBeenCalledOnce();
    expect(condition).toHaveBeenCalledWith(state);
    expect(action).toHaveBeenCalledOnce();
  });

  it('should not run the action if the condition returns false', () => {
    const action = vi.fn();
    const condition = vi.fn((state: TestState) => state.active);
    const rule: Rule<TestState> = {
      event: 'test',
      condition,
      action,
    };
    const state: TestState = { value: 1, active: false };

    runRule(rule, state);

    expect(condition).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
  });

  it('should pass typed params to the action', () => {
    interface ActionParams { amount: number; }
    const action = vi.fn<(state: TestState, params?: ActionParams) => void>();
    const rule: Rule<TestState, ActionParams> = {
      event: 'test',
      action,
      params: { amount: 10 },
    };
    const state: TestState = { value: 1, active: true };

    runRule(rule, state);

    expect(action).toHaveBeenCalledWith(state, { amount: 10 });
  });

  it('should reflect state changes made by the action', () => {
    const action = (state: TestState) => {
      state.value += 1;
    };
    const rule: Rule<TestState> = {
      event: 'test',
      action,
    };
    const state: TestState = { value: 1, active: true };

    const newState = runRule(rule, state);

    expect(newState.value).toBe(2);
    expect(state.value).toBe(2); // Ensure it modifies the original state object
  });
});
