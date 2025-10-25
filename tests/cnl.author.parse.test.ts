import { describe, it, expect } from 'vitest';
import { parseAuthoringCnl } from '../src/graph/author.cnl';

describe('New CNL Parser (Action-based)', () => {
  it('should parse "노드 A, B 생성"', () => {
    const { actions } = parseAuthoringCnl('노드 A, B 생성');
    expect(actions).toEqual([{ action: 'add_nodes', nodes: ['A', 'B'] }]);
  });

  it('should parse "점 X, Y, Z를 만든다"', () => {
    const { actions } = parseAuthoringCnl('점 X, Y, Z를 만든다');
    expect(actions).toEqual([{ action: 'add_nodes', nodes: ['X', 'Y', 'Z'] }]);
  });

  it('should parse "A, B, C를 순서대로 연결"', () => {
    const { actions } = parseAuthoringCnl('A, B, C를 순서대로 연결');
    expect(actions).toEqual([{ action: 'add_edges', edges: [['A', 'B'], ['B', 'C']] }]);
  });

  it('should parse "A B 연결"', () => {
    const { actions } = parseAuthoringCnl('A B 연결');
    expect(actions).toEqual([{ action: 'add_edges', edges: [['A', 'B']] }]);
  });

  it('should parse comma-separated commands on one line', () => {
    const cnl = 'A에서 B로 연결, B에서 C로 연결';
    const { actions } = parseAuthoringCnl(cnl);
    expect(actions).toEqual([
      { action: 'add_edges', edges: [['A', 'B']] },
      { action: 'add_edges', edges: [['B', 'C']] },
    ]);
  });

  it('should parse "A->B는 \'키\'가 필요함"', () => {
    const { actions } = parseAuthoringCnl("A->B는 '키'가 필요함");
    expect(actions).toEqual([
      { action: 'add_edges', edges: [['A', 'B']] },
      { action: 'lock_edge', from: 'A', to: 'B', requires: '키' },
    ]);
  });

  it('should parse "B와 C를 잇는 간선을 지나려면 열쇠가 필요하다"', () => {
    const { actions } = parseAuthoringCnl('B와 C를 잇는 간선을 지나려면 열쇠가 필요하다');
    expect(actions).toEqual([
      { action: 'add_edges', edges: [['B', 'C']] },
      { action: 'lock_edge', from: 'B', to: 'C', requires: '열쇠' },
    ]);
  });

  it('should parse "B에 열쇠가 있다"', () => {
    const { actions } = parseAuthoringCnl('B에 열쇠가 있다');
    expect(actions).toEqual([{ action: 'place_item', node: 'B', item: '열쇠' }]);
  });

  it('should parse "출발점은 S, 도착점은 G"', () => {
    const { actions } = parseAuthoringCnl('출발점은 S, 도착점은 G');
    expect(actions).toEqual([{ action: 'set_start_goal', start: 'S', goal: 'G' }]);
  });

  it('should parse mixed commands with comma separation', () => {
    const cnl = '노드 A, B 생성, A에서 B로 연결';
    const { actions } = parseAuthoringCnl(cnl);
    expect(actions).toEqual([
      { action: 'add_nodes', nodes: ['A', 'B'] },
      { action: 'add_edges', edges: [['A', 'B']] },
    ]);
  });

  it('should return an error for invalid sentences', () => {
    const cnl = '이것은 잘못된 문장이다';
    const { actions } = parseAuthoringCnl(cnl);
    expect(actions).toEqual([
      { action: 'error', message: '해석할 수 없는 구문', span: [0, cnl.length] },
    ]);
  });
});