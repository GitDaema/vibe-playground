import React, { useEffect, useState, useCallback } from "react";
import GraphCanvas from "./GraphCanvas2";
import RuleEditor from "./RuleEditor";
import { PreviewPanel } from "./PreviewPanel";
import { PuzzleProvider, usePuzzle } from "../core/PuzzleContext";
import { Graph } from "../graph/model";
import { parseAuthoringCnl, AuthorCnlError } from "../graph/author.cnl";
import { SharePanel } from "./components/SharePanel";
import { decodePuzzle } from "../codec/shareCode";

// 예시 퍼즐: 열쇠-자물쇠 (락을 우회하지 못하도록 구성)
const authorExampleKeyLock = `노드 A, B, C, D를 만든다.
A에서 B로 간선을 잇는다.
B에서 C로 간선을 잇는다.
C에서 D로 간선을 잇는다.
B→C는 '열쇠'가 필요하다.
B에 '열쇠'가 있다.
시작은 A, 목표는 D.`;

// 예시 퍼즐: BFS(비가중 최단 경로)
const authorExampleBfs = `노드 A, B, C, D, E를 만든다.
A에서 B로 간선을 잇는다.
A에서 C로 간선을 잇는다.
B에서 D로 간선을 잇는다.
C에서 E로 간선을 잇는다.
D에서 E로 간선을 잇는다.
시작은 A, 목표는 E.`;

const PlaygroundContent: React.FC = () => {
  const {
    graph,
    setGraph,
    puzzleState,
    stepSimulation,
    resetSimulation,
    runSimulation,
    parsingErrors,
    validationErrors,
    simulationHistory,
    feedbackMessage,
  } = usePuzzle();

  const [activeTab, setActiveTab] = useState<'create' | 'solve'>('create');
  const [authorCnl, setAuthorCnl] = useState(authorExampleKeyLock);
  const [authorErrors, setAuthorErrors] = useState<AuthorCnlError[]>([]);

  // Load from URL hash on initial mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = decodePuzzle(hash);
        const newGraph = new Graph(
          decoded.graph.nodes,
          decoded.graph.edges,
          decoded.graph.startNodeId,
          decoded.graph.goalNodeId
        );
        setGraph(newGraph);
        resetSimulation();
        // Switch to solve tab for immediate interaction
        setActiveTab('solve'); 
        alert(`Puzzle loaded from URL! Switch to "Solve" tab to begin.`);
      } catch (error: any) {
        alert(`Failed to load puzzle from URL hash: ${error.message}`);
        console.error(error);
      }
    }
  }, [setGraph, resetSimulation]);


  const handleCreateGraph = useCallback(() => {
    const { graph: newGraph, errors } = parseAuthoringCnl(authorCnl);
    setAuthorErrors(errors);
    if (errors.length === 0) {
      setGraph(newGraph);
      // 자동 전환하지 않음: 제작 → 확인/수정 → 풀이 흐름을 지원
    }
  }, [authorCnl, setGraph]);

  const hasSolveErrors = parsingErrors.length > 0 || validationErrors.length > 0;

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen">
      {/* 좌측: 그래프 */}
      <div className="col-span-2 flex flex-col">
        <div className="flex border-b mb-4">
          <TabButton name="create" current={activeTab} set={setActiveTab}>1. 퍼즐 만들기</TabButton>
          <TabButton name="solve" current={activeTab} set={setActiveTab}>2. 퍼즐 풀기</TabButton>
        </div>

        <div className="flex-grow border rounded-md p-2">
          <GraphCanvas
            graph={graph}
            entityPosition={puzzleState?.entity.at}
            goalNodeId={graph.goalNodeId}
            inventory={puzzleState?.entity.inventory}
            nodeTags={puzzleState?.nodes}
          />
        </div>
        <div className="mt-2 text-xs text-slate-600">
          <span className="mr-4">Legend: 🔑 item on node</span>
          <span>🔒 locked edge (requires item)</span>
        </div>
      </div>

      {/* 우측: 패널들 */}
      <div className="col-span-1 flex flex-col space-y-4">
        {activeTab === 'create' ? (
          <AuthoringPanel
            cnl={authorCnl}
            setCnl={setAuthorCnl}
            errors={authorErrors}
            onCreate={handleCreateGraph}
          />
        ) : (
          <SolvingPanel
            hasErrors={hasSolveErrors}
            step={stepSimulation}
            run={runSimulation}
            reset={resetSimulation}
            history={simulationHistory}
            feedback={feedbackMessage}
            puzzleState={puzzleState}
            goalNodeId={graph.goalNodeId}
          />
        )}
        <SharePanel />
      </div>
    </div>
  );
};

const TabButton: React.FC<{name: 'create' | 'solve', current: string, set: (tab: 'create' | 'solve') => void, children: React.ReactNode}> = ({name, current, set, children}) => (
  <button
    onClick={() => set(name)}
    className={`px-4 py-2 -mb-px border-b-2 ${current === name ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {children}
  </button>
);

const AuthoringPanel: React.FC<{cnl: string, setCnl: (c: string) => void, errors: AuthorCnlError[], onCreate: () => void}> = ({cnl, setCnl, errors, onCreate}) => (
  <>
    <h3 className="text-lg font-semibold">퍼즐 만들기 (CNL)</h3>
    <div className="flex gap-2 mb-2">
      <button className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" onClick={() => setCnl(authorExampleKeyLock)}>예시 퍼즐: 열쇠-자물쇠</button>
      <button className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" onClick={() => setCnl(authorExampleBfs)}>예시 퍼즐: BFS</button>
    </div>
    <textarea
      className="w-full h-64 border rounded-md p-2 text-sm font-mono"
      value={cnl}
      onChange={(e) => setCnl(e.target.value)}
    />
    <button className="mt-2 px-4 py-2 rounded bg-blue-600 text-white w-full" onClick={onCreate}>그래프 생성</button>
    {errors.length > 0 && (
      <div className="mt-2 text-red-500 p-2 bg-red-50 rounded-md overflow-y-auto">
        <h4 className="font-bold">Errors:</h4>
        <ul>{errors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
      </div>
    )}
  </>
);

const SolvingPanel: React.FC<{
  hasErrors: boolean;
  step: () => void;
  run: () => void;
  reset: () => void;
  history: any[];
  feedback: string;
  puzzleState: any;
  goalNodeId?: string;
}> = ({hasErrors, step, run, reset, history, feedback, puzzleState, goalNodeId}) => {
  const [actionLog, setActionLog] = useState<string[]>([]);
  const { setCnl } = usePuzzle(); // Get setCnl directly from context

  const bfsExampleCnl = `아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다
큐가 비어있지 않다면, 큐에서 다음 노드를 꺼낸다`;

  // 성공 로그 수집
  useEffect(() => {
    if (history && history.length > 0) {
      const last = history[history.length - 1];
      setActionLog(prev => [...prev, last.log + (last.isFinished ? ' (Goal Reached!)' : '')]);
    }
  }, [history]);

  // 실패 피드백 로그 수집
  useEffect(() => {
    if (feedback) {
      setActionLog(prev => [...prev, feedback]);
    }
  }, [feedback]);

  const onReset = useCallback(() => {
    setActionLog([]);
    reset();
  }, [reset]);

  return (
    <>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50" onClick={step} disabled={hasErrors || !puzzleState || puzzleState.entity.at === goalNodeId}>Step</button>
        <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={run} disabled={hasErrors || !puzzleState || puzzleState.entity.at === goalNodeId}>Run</button>
        <button className="px-3 py-2 rounded bg-slate-200 disabled:opacity-50" onClick={onReset} disabled={!puzzleState}>Reset</button>
        <button className="px-3 py-2 rounded bg-purple-600 text-white" onClick={() => setCnl(bfsExampleCnl)}>BFS 예시</button>
      </div>
      {/* Action Log: 성공/실패 모두 별도 패널에 표시 */}
      <div className="p-2 border rounded-md bg-gray-50 h-64 overflow-y-auto text-sm mt-2">
        <h3 className="font-semibold">Action Log</h3>
        {actionLog.length === 0 ? (
          <p className="text-gray-500">아직 로그가 없습니다.</p>
        ) : (
          <ul>
            {actionLog.map((line, i) => (
              <li key={i} className="mb-1">{line}</li>
            ))}
          </ul>
        )}
      </div>
      <RuleEditor />
      <div className="flex-grow"><PreviewPanel /></div>
    </>
  );
};

export default function Playground() {
  return (
    <PuzzleProvider initialGraph={new Graph()}>
      <PlaygroundContent />
    </PuzzleProvider>
  );
}

