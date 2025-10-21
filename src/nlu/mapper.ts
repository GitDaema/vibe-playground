import type { Rule } from '@core/dsl';
import { cnlPatterns } from '@nlu/patterns.ko';
import type { PhysicsRuleState } from '@dsl-physics/bridge';

/**
 * Maps a Korean Natural Language (CNL) string to a Rule JSON object.
 * @param cnlText The CNL string to map.
 * @returns A Rule object if a matching pattern is found, otherwise null.
 */
export function mapCnlToRuleJson(cnlText: string): Rule<PhysicsRuleState> | null {
  for (const pattern of cnlPatterns) {
    const match = pattern.regex.exec(cnlText);
    if (match) {
      return pattern.template(match);
    }
  }
  return null;
}
