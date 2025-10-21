export interface Node {
  id: string;
  // 추가 속성 (예: color, visited)은 Day4에서 상태 관리의 일부로 다룹니다.
}

export interface Edge {
  from: string;
  to: string;
}

export class Graph {
  public nodes: Node[] = [];
  public edges: Edge[] = [];
  private adj: Map<string, string[]> = new Map();

  /**
   * 그래프에 노드를 추가합니다. 이미 노드가 존재하면 아무 작업도 수행하지 않습니다.
   * @param id 추가할 노드의 ID
   */
  addNode(id: string): void {
    if (!this.nodes.some(node => node.id === id)) {
      this.nodes.push({ id });
      this.adj.set(id, []);
    }
  }

  /**
   * 그래프에 여러 노드를 한 번에 추가합니다.
   * @param ids 추가할 노드 ID 배열
   */
  addNodes(ids: string[]): void {
    ids.forEach(id => this.addNode(id));
  }

  /**
   * 그래프에 방향성 있는 간선을 추가합니다.
   * @param from 시작 노드 ID
   * @param to 도착 노드 ID
   */
  addEdge(from: string, to: string): void {
    // 출발 및 도착 노드가 존재하는지 확인하고, 없으면 추가합니다.
    this.addNode(from);
    this.addNode(to);

    // 간선이 이미 존재하는지 확인합니다.
    if (!this.edges.some(edge => edge.from === from && edge.to === to)) {
      this.edges.push({ from, to });
      this.adj.get(from)?.push(to);
    }
  }

  /**
   * 특정 노드의 모든 인접 노드(자식 노드)를 반환합니다.
   * @param id 인접 노드를 찾을 노드의 ID
   * @returns 인접 노드 ID 배열
   */
  getNeighbors(id: string): string[] {
    return this.adj.get(id) || [];
  }

  /**
   * 그래프를 초기 상태로 리셋합니다.
   */
  clear(): void {
    this.nodes = [];
    this.edges = [];
    this.adj.clear();
  }
}
