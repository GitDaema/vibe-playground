import React, { useEffect, useState, useCallback } from "react";
import GraphCanvas from "./GraphCanvas2";
import RuleEditor from "./RuleEditor";
import { PreviewPanel } from "./PreviewPanel";
import { PuzzleProvider, usePuzzle } from "../core/PuzzleContext";
import { Graph } from "../graph/model";
import { parseAuthoringCnl, AuthorCnlError } from "../graph/author.cnl";

const initialAuthorCnl = `노드 A, B, C, D를 만든다.
A에서 B로 간선을 잇는다.
A에서 C로 간선을 잇는다.
B에서 C로 간선을 잇는다.
C에서 D로 간선을 잇는다.
B→C는 '열쇠'가 필요하다.
B에 '열쇠'가 있다.
시작은 A, 목표는 D.`;

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
    setFeedbackMessage,
  } = usePuzzle();

  const [activeTab, setActiveTab] = useState<'create' | 'solve'>('create');
  const [authorCnl, setAuthorCnl] = useState(initialAuthorCnl);
  const [authorErrors, setAuthorErrors] = useState<AuthorCnlError[]>([]);

  const handleCreateGraph = useCallback(() => {
    const { graph: newGraph, errors } = parseAuthoringCnl(authorCnl);
    setAuthorErrors(errors);
    if (errors.length === 0) {
      setGraph(newGraph);
      setActiveTab('solve'); // Switch to solve tab on success
    }
  }, [authorCnl, setGraph]);

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, setFeedbackMessage]);

  const hasSolveErrors = parsingErrors.length > 0 || validationErrors.length > 0;

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen">
      <div className="col-span-2 flex flex-col">
        <div className="flex border-b mb-4">
          <TabButton name="create" current={activeTab} set={setActiveTab}>1. 퍼즐 만들기</TabButton>
          <TabButton name="solve" current={activeTab} set={setActiveTab}>2. 퍼즐 풀기</TabButton>
        </div>

        <div className="flex-grow border rounded-md p-2 relative">
          <GraphCanvas
            graph={graph}
            entityPosition={puzzleState?.entity.at}
            goalNodeId={graph.goalNodeId}
            inventory={puzzleState?.entity.inventory}
            nodeTags={puzzleState?.nodes}
          />
          {feedbackMessage && (
            <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-sm p-2 rounded shadow-lg">
              {feedbackMessage}
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-600">
          <span className="mr-4">Legend: 🔑 item on node</span>
          <span>🔒 locked edge (requires item)</span>
        </div>
      </div>

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
            puzzleState={puzzleState} 
            goalNodeId={graph.goalNodeId}
          />
        )}
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
    <h3 className="text-lg font-semibold">퍼즐 저작 (CNL)</h3>
    <textarea
      className="w-full h-64 border rounded-md p-2 text-sm font-mono"
      value={cnl}
      onChange={(e) => setCnl(e.target.value)}
    />
    <button className="px-4 py-2 rounded bg-blue-600 text-white w-full" onClick={onCreate}>그래프 생성</button>
    {errors.length > 0 && (
      <div className="text-red-500 p-2 bg-red-50 rounded-md overflow-y-auto">
        <h4 className="font-bold">Errors:</h4>
        <ul>{errors.map((e, i) => <li key={i}>{e.message}</li>)}</ul>
      </div>
    )}
  </>
);

const SolvingPanel: React.FC<any> = ({hasErrors, step, run, reset, history, puzzleState, goalNodeId}) => (
  <>
    <div className="flex gap-2">
      <button className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50" onClick={step} disabled={hasErrors || !puzzleState || puzzleState.entity.at === goalNodeId}>Step</button>
      <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={run} disabled={hasErrors || !puzzleState || puzzleState.entity.at === goalNodeId}>Run</button>
      <button className="px-3 py-2 rounded bg-slate-200 disabled:opacity-50" onClick={reset} disabled={!puzzleState}>Reset</button>
    </div>
    <RuleEditor />
    <div className="flex-grow"><PreviewPanel /></div>
    <div className="p-2 border rounded-md bg-gray-50 h-32 overflow-y-auto text-sm">
      <h3 className="font-semibold">Simulation Log:</h3>
      {history.length === 0 ? <p className="text-gray-500">No steps yet.</p> : 
        <ul>{history.map((entry: any, i: number) => <li key={i} className="mb-1">{entry.log}{entry.isFinished && <span className="font-bold text-green-700 ml-2">(Goal Reached!)</span>}</li>)}</ul>
      }
    </div>
  </>
);

export default function Playground() {
  // Initial graph is now empty, created by the user.
  return (
    <PuzzleProvider initialGraph={new Graph()}>
      <PlaygroundContent />
    </PuzzleProvider>
  );
}
