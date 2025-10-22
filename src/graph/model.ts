export interface Node {
  id: string;
  x: number; // UI positioning
  y: number; // UI positioning
  tags?: string[]; // Optional tags (e.g., item:열쇠)
}

export interface Edge {
  id: string; // Added for unique key in UI
  source: string; // Renamed from 'from'
  target: string; // Renamed from 'to'
  requiresItem?: string;
}

export class Graph {
  public nodes: Node[] = [];
  public edges: Edge[] = [];
  public startNodeId?: string;
  public goalNodeId?: string;

  constructor(initialNodes: Node[] = [], initialEdges: Edge[] = [], startNodeId?: string, goalNodeId?: string) {
    this.nodes = initialNodes;
    this.edges = initialEdges;
    this.startNodeId = startNodeId;
    this.goalNodeId = goalNodeId;
  }

  /**
   * 그래프에 노드를 추가합니다. 이미 노드가 존재하면 아무 작업도 수행하지 않습니다.
   * @param newNode 추가할 노드 객체
   */
  addNode(newNode: Node): void {
    if (!this.nodes.some(node => node.id === newNode.id)) {
      this.nodes.push(newNode);
    }
  }

  /**
   * 그래프에 여러 노드를 한 번에 추가합니다.
   * @param newNodes 추가할 노드 객체 배열
   */
  addNodes(newNodes: Node[]): void {
    newNodes.forEach(node => this.addNode(node));
  }

  /**
   * 그래프에 방향성 있는 간선을 추가합니다.
   * @param newEdge 추가할 간선 객체
   */
  addEdge(newEdge: Edge): void {
    // 간선이 이미 존재하는지 확인합니다.
    if (!this.edges.some(edge => edge.id === newEdge.id)) { // Check by id
      this.edges.push(newEdge);
    }
  }

  /**
   * Lock an edge so that moving from `source` to `target` requires the given item.
   */
  lockEdge(source: string, target: string, item: string): void {
    const edge = this.edges.find(e => e.source === source && e.target === target);
    if (edge) edge.requiresItem = item;
  }

  /**
   * 특정 노드의 모든 인접 노드(자식 노드)를 반환합니다.
   * (이 메서드는 adj 리스트가 Graph 클래스 내부에 유지될 경우에만 유효합니다.)
   * @param id 인접 노드를 찾을 노드의 ID
   * @returns 인접 노드 ID 배열
   */
  getNeighbors(id: string): string[] {
    // If adj list is not kept internally, this method would need to iterate through edges
    return this.edges.filter(edge => edge.source === id).map(edge => edge.target);
  }

  /**
   * 그래프를 초기 상태로 리셋합니다.
   */
  clear(): void {
    this.nodes = [];
    this.edges = [];
  }
}
