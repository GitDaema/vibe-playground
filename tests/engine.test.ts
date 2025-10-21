import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../src/core/engine';

describe('Engine', () => {
    const seed = 12345;
    let engine: Engine;

    beforeEach(() => {
        engine = new Engine(seed);
    });

    it('should initialize with a given seed and default state', () => {
        const state = engine.getState();
        expect(state.seed).toBe(seed);
        expect(state.time).toBe(0);
        expect(state.running).toBe(true);
    });

    it('should produce a deterministic sequence of random numbers', () => {
        const engine1 = new Engine(seed);
        const engine2 = new Engine(seed);

        const sequence1 = Array.from({ length: 5 }, () => engine1.nextRandom());
        const sequence2 = Array.from({ length: 5 }, () => engine2.nextRandom());

        expect(sequence1).toEqual(sequence2);
    });

    it('should accumulate time correctly when running', () => {
        engine.update(0.1);
        expect(engine.getState().time).toBeCloseTo(0.1);
        engine.update(0.2);
        expect(engine.getState().time).toBeCloseTo(0.3);
    });

    it('should not accumulate time when paused', () => {
        engine.update(0.1);
        engine.pause();
        engine.update(0.2);

        expect(engine.getState().running).toBe(false);
        expect(engine.getState().time).toBeCloseTo(0.1);
    });

    it('should resume accumulating time after being paused', () => {
        engine.pause();
        engine.update(0.1);
        engine.resume();
        engine.update(0.2);

        expect(engine.getState().running).toBe(true);
        expect(engine.getState().time).toBeCloseTo(0.2);
    });

    it('should reset to the initial state but keep the seed', () => {
        const firstRandom = engine.nextRandom();

        engine.update(1.0);
        engine.pause();
        engine.reset();

        const state = engine.getState();
        expect(state.time).toBe(0);
        expect(state.running).toBe(true);
        expect(state.seed).toBe(seed);

        const afterResetRandom = engine.nextRandom();
        expect(afterResetRandom).toBe(firstRandom);
    });

    it('should not update time with non-positive delta time values', () => {
        engine.update(-1.0);
        expect(engine.getState().time).toBe(0);

        engine.update(0.0);
        expect(engine.getState().time).toBe(0);
    });
});