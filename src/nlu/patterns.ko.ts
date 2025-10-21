import type { Rule } from '@core/dsl';
import type { PhysicsRuleState } from '@dsl-physics/bridge';

// Define a type for the pattern configuration
export interface CNLPattern {
  regex: RegExp;
  template: (match: RegExpExecArray) => Rule<PhysicsRuleState>;
}

// 간단한 한글 → 오브젝트 ID 매핑
function normalizeObjectName(name: string): string {
  const trimmed = name.trim();
  const map: Record<string, string> = {
    '바닥': 'floor',
    '왼쪽 벽': 'wallL',
    '왼쪽벽': 'wallL',
    '오른쪽 벽': 'wallR',
    '오른쪽벽': 'wallR',
    '골': 'goal',
    '골대': 'goal',
    '골문': 'goal',
    '목표': 'goal',
  };
  return map[trimmed] ?? trimmed;
}

export const cnlPatterns: CNLPattern[] = [
  {
    regex: /공이 (.+)에 닿으면 더 높이 튕겨 (\d+\.?\d*)배\./,
    template: (match) => ({
      event: 'collision',
      action: 'bounce',
      params: {
        a: 'ball1', // Assuming 'ball1' for now, will need to be dynamic
        b: normalizeObjectName(match[1]),
        multiplier: parseFloat(match[2]),
      },
    }),
  },
  {
    regex: /공이 (.+)에 들어가면 성공으로 해\./,
    template: (match) => ({
      event: 'enter',
      action: 'markSuccess',
      params: {
        a: 'ball1', // Assuming 'ball1' for now
        b: normalizeObjectName(match[1]),
      },
    }),
  },
  {
    regex: /공이 바닥 아래로 떨어지면 실패\./,
    template: (match) => ({
      event: 'tick',
      condition: (state: PhysicsRuleState) => {
        const ball = state.objects.find(obj => obj.id === 'ball1' && obj.type === 'ball');
        return ball ? ball.pos.y > 600 : false; // Assuming 600 as a 'fall off' threshold
      },
      action: 'markFail',
      params: {},
    }),
  },
  {
    regex: /(\d+\.?\d*)초마다 위로 힘을 줘\./,
    template: (match) => ({
      event: 'interval',
      action: 'applyForce',
      params: {
        intervalMs: parseFloat(match[1]) * 1000,
        dx: 0,
        dy: -5, // Apply a small upward force
        targetId: 'ball1', // Assuming 'ball1' for now
      },
    }),
  },
  {
    regex: /속도를 (\d+\.?\d*)배로 줄여\./,
    template: (match) => ({
      event: 'tick',
      action: 'scaleVelocity',
      params: {
        factor: parseFloat(match[1]),
        targetId: 'ball1', // Assuming 'ball1' for now
      },
    }),
  },
  {
    regex: /중력을 (\d+\.?\d*)으로 설정해\./,
    template: (match) => ({
      event: 'tick',
      action: 'setGravity',
      params: {
        gy: parseFloat(match[1]),
        targetId: 'gravity', // Assuming 'gravity' for now
      },
    }),
  },
  {
    regex: /공이 (.+)에 닿으면 (.+)으로 힘을 줘\./,
    template: (match) => ({
      event: 'collision',
      action: 'applyForce',
      params: {
        a: 'ball1',
        b: match[1],
        dx: match[2].includes('오른쪽') ? 10 : (match[2].includes('왼쪽') ? -10 : 0),
        dy: match[2].includes('위') ? -10 : (match[2].includes('아래') ? 10 : 0),
        targetId: 'ball1',
      },
    }),
  },
  {
    regex: /공의 속도를 x:(\d+\.?\d*), y:(\d+\.?\d*)로 설정해\./,
    template: (match) => ({
      event: 'tick',
      action: 'setVelocity',
      params: {
        vx: parseFloat(match[1]),
        vy: parseFloat(match[2]),
        targetId: 'ball1',
      },
    }),
  },
];
