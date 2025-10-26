import { describe, it, expect } from 'vitest';
import { parseCnl } from '../src/graph/mapper.cnl';

describe('CNL Parser - Colon style (…이면: …)', () => {
  it('parses key-lock rules written in simpler colon style', () => {
    const cnl = [
      'B에 처음 도착했다면: 방문 처리하고 열쇠를 줍는다',
      '열쇠가 있고 B에 도착했다면: C로 이동한다',
      'A에 도착했다면: B로 이동한다',
      'C에 도착했다면: D로 이동한다',
    ].join('\n');

    const { rules, errors } = parseCnl(cnl);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(4);

    // Rule 1
    expect(rules[0].when).toEqual(
      expect.arrayContaining([{ at: 'B' }, { notVisited: 'B' }])
    );
    expect(rules[0].then).toEqual(
      expect.arrayContaining([{ markVisited: 'current' }, { pickup: '열쇠' }])
    );

    // Rule 2
    expect(rules[1].when).toEqual(
      expect.arrayContaining([{ has: '열쇠' }, { at: 'B' }])
    );
    expect(rules[1].then).toEqual(
      expect.arrayContaining([{ moveTo: 'C' }])
    );

    // Rule 3
    expect(rules[2].when).toEqual(
      expect.arrayContaining([{ at: 'A' }])
    );
    expect(rules[2].then).toEqual(
      expect.arrayContaining([{ moveTo: 'B' }])
    );

    // Rule 4
    expect(rules[3].when).toEqual(
      expect.arrayContaining([{ at: 'C' }])
    );
    expect(rules[3].then).toEqual(
      expect.arrayContaining([{ moveTo: 'D' }])
    );
  });

  it('parses the same rules without a colon after …이면', () => {
    const cnl = [
      'B에 처음 도착했다면 방문 처리하고 열쇠를 줍는다',
      '열쇠가 있고 B에 도착했다면 C로 이동한다',
      'A에 도착했다면 B로 이동한다',
      'C에 도착했다면 D로 이동한다',
    ].join('\n');

    const { rules, errors } = parseCnl(cnl);
    expect(errors).toHaveLength(0);
    expect(rules).toHaveLength(4);

    expect(rules[0].when).toEqual(
      expect.arrayContaining([{ at: 'B' }, { notVisited: 'B' }])
    );
    expect(rules[0].then).toEqual(
      expect.arrayContaining([{ markVisited: 'current' }, { pickup: '열쇠' }])
    );
  });
});
