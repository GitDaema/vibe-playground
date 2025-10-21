import React, { useEffect, useMemo, useState } from "react";
import GraphCanvas from "./GraphCanvas";
import RuleEditor from "./RuleEditor";
import { bfsOrder } from "../graph/bfs";

type GraphState = { nodes: string[]; edges: [string, string][]; start?: string; goal?: string };

export default function Playground() {
  const [graph, setGraph] = useState<GraphState>({ nodes: [], edges: [] });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [order, setOrder] = useState<string[]>([]);
  const adj = useMemo(() => {
    const a: Record<string, string[]> = {};
    graph.nodes.forEach((n) => (a[n] = []));
    graph.edges.forEach(([u, v]) => {
      if (!a[u].includes(v)) a[u].push(v);
      // 기본을 무방향 그래프로 취급하여 사용자 기대와 일치시킴
      if (!a[v].includes(u)) a[v].push(u);
    });
    return a;
  }, [graph]);

  const applyCmd = (cmd: any) => {
    if (!cmd || !cmd.action) return;
    setVisited(new Set());
    setOrder([]);
    if (cmd.action === "add_nodes") {
      setGraph((prevGraph) => {
        const newNodes = (cmd.nodes || []).filter((n: string) => !prevGraph.nodes.includes(n));
        return { ...prevGraph, nodes: [...prevGraph.nodes, ...newNodes] };
      });
    } else if (cmd.action === "add_edges") {
      setGraph((prevGraph) => {
        const newEdges: [string, string][] = cmd.edges || [];
        // 간선에 등장한 노드는 자동 추가
        const nodesFromEdges = Array.from(new Set(newEdges.flat()));
        const addNodes = nodesFromEdges.filter((n) => !prevGraph.nodes.includes(n));
        // 중복 간선 방지
        const filteredNewEdges = newEdges.filter(
          ([u, v]) => !prevGraph.edges.some(([exU, exV]) => exU === u && exV === v)
        );
        return {
          ...prevGraph,
          nodes: [...prevGraph.nodes, ...addNodes],
          edges: [...prevGraph.edges, ...filteredNewEdges],
        };
      });
    } else if (cmd.action === "set_goal") {
      setGraph((prevGraph) => {
        const toEnsure = [cmd.start, cmd.goal].filter(Boolean) as string[];
        const addNodes = toEnsure.filter((n) => !prevGraph.nodes.includes(n));
        return { ...prevGraph, nodes: [...prevGraph.nodes, ...addNodes], start: cmd.start, goal: cmd.goal };
      });
    }
  };

  const runBfs = () => {
    if (!graph.start) return;
    const seq = bfsOrder(adj, graph.start!, graph.goal);
    setOrder(seq);
    // 간단 방문 애니메이션
    let i = 0;
    const vis = new Set<string>();
    setVisited(new Set()); // 애니메이션 시작 전 초기화
    // 중복 실행 시 이전 타이머가 겹치지 않도록 정리
    if ((window as any).__bfsTimer) {
      clearInterval((window as any).__bfsTimer);
    }
    const timer = setInterval(() => {
      if (i < seq.length) {
        vis.add(seq[i]);
        setVisited(new Set(vis));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 500);
    (window as any).__bfsTimer = timer;
  };

  // 시작/목표(또는 그래프 구조)가 바뀌면 자동으로 BFS 실행
  useEffect(() => {
    if (graph.start) {
      runBfs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.start, graph.goal, adj]);

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h2 className="font-bold text-lg mb-2">Graph</h2>
        <GraphCanvas graph={{ nodes: graph.nodes, edges: graph.edges }} visited={visited} start={graph.start} goal={graph.goal} />
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={runBfs} disabled={!graph.start}>
            너비우선 실행(BFS)
          </button>
          <button className="px-3 py-2 rounded bg-slate-200" onClick={() => { setVisited(new Set()); setOrder([]); }}>
            방문 초기화
          </button>
        </div>
        <div className="mt-2 text-sm text-slate-700">방문 순서: {order.join(" → ") || "-"}</div>
      </div>

      <div>
        <h2 className="font-bold text-lg mb-2">자연어 규칙 입력</h2>
        <RuleEditor onCommand={applyCmd} />
        <div className="text-sm text-slate-600 mt-2">
          예시: <code>노드 A, B, C 만들어줘.</code> → <code>A에서 B, C로 연결해줘.</code> → <code>A를 시작, C를 목표로 해줘.</code>
        </div>
      </div>
    </div>
  );
}
