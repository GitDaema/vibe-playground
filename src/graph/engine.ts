import { Graph } from "./model";

/**
 * 그래프 탐색 시뮬레이션을 관리하는 엔진 스텁입니다.
 * Day4에서 실제 탐색 로직(BFS/DFS)과 이벤트 훅이 구현될 예정입니다.
 */
export class GraphEngine {
  private visited = new Set<string>();
  private tickCount = 0;

  constructor(public graph: Graph) {}

  /**
   * 특정 노드를 방문 처리하고 관련 로그를 출력합니다.
   * @param nodeId 방문할 노드의 ID
   */
  visit(nodeId: string) {
    if (!this.visited.has(nodeId)) {
      this.visited.add(nodeId);
      console.log(`[Tick ${this.tickCount}] Visited: ${nodeId}`);
      // Day4: 여기서 'visit' 이벤트를 발생시킬 예정입니다.
    }
  }

  /**
   * 시뮬레이션 루프를 실행합니다. (현재는 스텁)
   */
  run() {
    console.log("Graph simulation started...");
    // Day4: 여기에 BFS/DFS와 같은 실제 탐색 로직이 들어갑니다.
    // 예시: 시작 노드부터 탐색 시작
    const startNode = this.graph.nodes[0]?.id;
    if (startNode) {
      this.tickCount = 1;
      this.visit(startNode);
    }
    console.log("Graph simulation finished.");
  }

  /**
   * 엔진의 상태(방문 기록, 틱 카운트)를 초기화합니다.
   */
  reset() {
    this.visited.clear();
    this.tickCount = 0;
    console.log("GraphEngine state has been reset.");
  }
}
