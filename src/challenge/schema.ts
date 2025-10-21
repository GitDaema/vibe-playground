import type { Rule } from '../core';

/**
 * Defines the structure of a challenge, including its world, goals, and rules.
 * This is a preliminary stub for future development.
 */
export interface Challenge {
  id: string;
  name: string;
  description: string;
  world: Record<string, any>; // Placeholder for world data (e.g., physics, graph)
  rules: Rule<any, any>[]; // Array of DSL rules
}
