import { describe, it, expect } from 'vitest';
import { parseAuthoringCnl } from '../src/graph/author.cnl';

describe('parseAuthoringCnl', () => {
  it('should parse node creation', () => {
    const cnl = '노드 A, B를 만든다.';
    const { graph, errors } = parseAuthoringCnl(cnl);
    expect(errors.length).toBe(0);
    expect(graph.nodes.length).toBe(2);
    expect(graph.nodes.map(n => n.id)).toEqual(['A', 'B']);
  });

  it('should parse edge creation', () => {
    const cnl = 'A에서 B로 간선을 잇는다.';
    const { graph, errors } = parseAuthoringCnl(cnl);
    expect(errors.length).toBe(0);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0]).toEqual({ id: 'AB', source: 'A', target: 'B' });
    expect(graph.nodes.length).toBe(2); // Nodes should be created implicitly
  });

  it('should set start and goal nodes', () => {
    const cnl = '시작은 A, 목표는 D.';
    const { graph, errors } = parseAuthoringCnl(cnl);
    expect(errors.length).toBe(0);
    expect(graph.startNodeId).toBe('A');
    expect(graph.goalNodeId).toBe('D');
    expect(graph.nodes.map(n => n.id)).toContain('A');
    expect(graph.nodes.map(n => n.id)).toContain('D');
  });

  it('should lock an edge with an item requirement', () => {
    const cnl = 'B→C는 \'열쇠\'가 필요하다.';
    const { graph, errors } = parseAuthoringCnl(cnl);
    expect(errors.length).toBe(0);
    // Note: lockEdge modifies an existing edge. Let's create it first.
    const cnl2 = `
      B에서 C로 간선을 잇는다.
      B→C는 '열쇠'가 필요하다.
    `;
    const { graph: graph2, errors: errors2 } = parseAuthoringCnl(cnl2);
    expect(errors2.length).toBe(0);
    expect(graph2.edges.length).toBe(1);
    expect(graph2.edges[0].requiresItem).toBe('열쇠');
  });

  it('should place an item on a node', () => {
    const cnl = 'B에 \'열쇠\'가 있다.';
    const { graph, errors } = parseAuthoringCnl(cnl);
    expect(errors.length).toBe(0);
    const nodeB = graph.nodes.find(n => n.id === 'B');
    expect(nodeB).toBeDefined();
    expect(nodeB?.tags).toContain('item:열쇠');
  });
});
