import { describe, it, expect } from 'vitest';
import { Engine } from '../src/core/engine';
import { runRule, type Rule } from '../src/core/dsl';

describe('Day3 smoke: Engine × DSL minimal integration', () => {
  it('단일 규칙으로 score를 0 → 1로 증가시키고, 엔진 tick이 시간 누적되는지 확인', () => {
    // 1) 엔진 준비(시드 고정 → 결정론적)
    const engine = new Engine(123);
    expect(engine.getState().time).toBe(0);
    expect(engine.getState().running).toBe(true);

    // 2) 상태 & 규칙 정의
    const state = { score: 0 };
    const rule: Rule<typeof state> = {
      event: 'onStart', // 간단한 이벤트 태그(필터링은 현재 미사용)
      action: (s) => { s.score += 1; }, // 조건 없이 score 증가
    };

    // 3) 규칙 실행(조건 없음 → 즉시 action 수행)
    runRule(rule, state);
    expect(state.score).toBe(1);

    // 4) 엔진 tick 진행(running=true일 때만 누적)
    // 현재 엔진은 단위 제한이 없어 단순 가산만 수행
    engine.update(0.016); // 약 1프레임(60fps 가정)
    engine.update(0.016);
    const afterTicks = engine.getState();
    expect(afterTicks.time).toBeGreaterThan(0);

    // 5) 일시정지/재개 확인
    engine.pause();
    const tPaused = engine.getState().time;
    engine.update(1000); // pause 상태이므로 누적 안 됨
    expect(engine.getState().time).toBe(tPaused);

    engine.resume();
    engine.update(0.033);
    expect(engine.getState().time).toBeGreaterThan(tPaused);
  });
});