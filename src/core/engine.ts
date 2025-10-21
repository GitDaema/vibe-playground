/**
 * Creates a deterministic random number generator.
 * @param seed The seed for the random number generator.
 * @returns A function that returns a random number between 0 and 1.
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Represents the state of the simulation engine.
 */
export interface EngineState {
  time: number;
  running: boolean;
  seed: number;
}

/**
 * A deterministic simulation engine with a tick-based loop.
 */
export class Engine {
  private time: number;
  private running: boolean;
  private seed: number;
  private rng: () => number;

  /**
   * @param seed The initial seed for the deterministic random number generator.
   */
  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.time = 0;
    this.running = true;
    this.rng = mulberry32(this.seed);
  }

  /**
   * Advances the engine's state by a given time delta.
   * Time only accumulates if the engine is running.
   * @param dt The time delta in seconds.
   */
  update(dt: number): void {
    // dt가 유한하지 않거나 음수일 경우 update 갱신 중단
    if (!Number.isFinite(dt) || dt < 0) 
      return;

    if (this.running) {
      this.time += dt;
    }
  }

  /**
   * Pauses the engine.
   */
  pause(): void {
    this.running = false;
  }

  /**
   * Resumes the engine.
   */
  resume(): void {
    this.running = true;
  }

  /**
   * Resets the engine to its initial state.
   * The seed is preserved, and the RNG is re-initialized to ensure determinism.
   */
  reset(): void {
    this.time = 0;
    this.running = true;
    this.rng = mulberry32(this.seed);
  }

  /**
   * Returns the current state of the engine.
   * @returns The current engine state.
   */
  getState(): EngineState {
    return {
      time: this.time,
      running: this.running,
      seed: this.seed,
    };
  }

  /**
   * Returns the next random number from the deterministic RNG.
   * @returns A random number.
   */
  nextRandom(): number {
    return this.rng();
  }
}
