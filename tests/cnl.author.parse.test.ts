import { describe, it, expect } from 'vitest';
import { parseAuthoringCnl } from '../src/graph/author.cnl';

describe('Authoring CNL Parser - Flexible Syntax', () => {
  it('should parse "노드 A, B 생성"', () => {
    const cnl = '노드 A, B 생성';
    const { graph } = parseAuthoringCnl(cnl);
    expect(graph.nodes.map(n => n.id).sort()).toEqual(['A', 'B']);
  });

  it('should parse "A B 연결"', () => {
    const cnl = 'A B 연결';
    const { graph } = parseAuthoringCnl(cnl);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({ source: 'A', target: 'B' });
  });

  it('should parse "A에서 B로 연결"', () => {
    const cnl = 'A에서 B로 연결';
    const { graph } = parseAuthoringCnl(cnl);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({ source: 'A', target: 'B' });
  });

  it('should parse "B와 C를 잇는 간선을 지나려면 열쇠가 필요하다"', () => {
    const cnl = 'B와 C를 잇는 간선을 지나려면 열쇠가 필요하다';
    const { graph } = parseAuthoringCnl(cnl);
    const edge = graph.edges.find(e => e.source === 'B' && e.target === 'C');
    expect(edge).toBeDefined();
    expect(edge?.requiresItem).toBe('열쇠');
  });

  it('should parse "B에 열쇠가 있다"', () => {
    const cnl = 'B에 열쇠가 있다';
    const { graph } = parseAuthoringCnl(cnl);
    const node = graph.nodes.find(n => n.id === 'B');
    expect(node).toBeDefined();
    expect(node?.tags).toContain('item:열쇠');
  });

  it('should parse a mix of commands', () => {
    const cnl = '노드 A, B, C 생성\nA B 연결\nB와 C 연결';
    const { graph } = parseAuthoringCnl(cnl);
    expect(graph.nodes.map(n => n.id).sort()).toEqual(['A', 'B', 'C']);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'A', target: 'B' }),
      expect.objectContaining({ source: 'B', target: 'C' }),
    ]));
  });
});
