import { describe, expect, it } from 'vitest';
import { ACTIVE_RULE_PACK, isRulePackEffectiveOn } from './ruleEngineService';

describe('rule-pack effective dates', () => {
  it('accepts dates inside the approved rule-pack window', () => {
    expect(isRulePackEffectiveOn(ACTIVE_RULE_PACK.effectiveFrom)).toBe(true);
  });

  it('rejects dates before the approved rule-pack effective date', () => {
    expect(isRulePackEffectiveOn('2025-12-31')).toBe(false);
  });
});
