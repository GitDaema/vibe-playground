import { describe, it, expect } from 'vitest';
import { parseCnl } from '../src/graph/mapper.cnl';

describe('Rules CNL Parser - Flexible Syntax', () => {
  it('should parse "큐에 X 추가"', () => {
    const cnl = '큐에 X를 추가한다';
    const { rules } = parseCnl(cnl);
    expect(rules[0].then).toContainEqual({ addToQueue: 'X' });
  });

  it('should parse "큐에서 다음 꺼내"', () => {
    const cnl = '큐에서 다음 노드를 꺼낸다';
    const { rules } = parseCnl(cnl);
    expect(rules[0].then).toContainEqual({ popFromQueue: true });
  });

  it('should parse "큐가 비어있지 않다면"', () => {
    const cnl = '큐가 비어있지 않다면';
    const { rules } = parseCnl(cnl);
    expect(rules[0].when).toContainEqual({ queueNotEmpty: true });
  });

  it('should parse "이웃을 큐에 추가"', () => {
    const cnl = '이웃을 큐에 추가한다';
    const { rules } = parseCnl(cnl);
    expect(rules[0].then).toContainEqual({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'queue' } });
  });

  it('should parse a full BFS rule', () => {
    const cnl = '아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다
큐가 비어있지 않다면, 큐에서 다음 노드를 꺼낸다';
    const { rules, errors } = parseCnl(cnl);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(2);
    // Rule 1
    expect(rules[0].when).toContainEqual({ notVisited: 'current' });
    expect(rules[0].then).toContainEqual({ markVisited: 'current' });
    expect(rules[0].then).toContainEqual({ enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'queue' } });
    // Rule 2
    expect(rules[1].when).toContainEqual({ queueNotEmpty: true });
    expect(rules[1].then).toContainEqual({ popFromQueue: true });
  });
});
