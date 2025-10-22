import { useEffect } from "react";
import GraphCanvas from "./GraphCanvas2";
import RuleEditor from "./RuleEditor";
import { PreviewPanel } from "./PreviewPanel"; // New import
import { PuzzleProvider, usePuzzle } from "../core/PuzzleContext"; // New import
import { Graph } from "../graph/model";
import type { Node, Edge } from "../graph/model";

// Define a dummy initial graph for now. This would eventually come from a challenge code or build mode.
// This graph should match the Graph type defined in src/graph/model.ts
const initialGraphData: Graph = (() => {
  const g = new Graph();

  // Define nodes with positions
  const nodes: Node[] = [
    { id: "A", x: 100, y: 100 },
    { id: "B", x: 300, y: 100 },
    { id: "C", x: 200, y: 250 },
    { id: "D", x: 400, y: 250 },
  ];
  g.addNodes(nodes);

  // Define edges with IDs
  const edges: Edge[] = [
    { id: "AB", source: "A", target: "B" },
    { id: "AC", source: "A", target: "C" },
    { id: "BC", source: "B", target: "C" }, // Added ID for BC edge
    { id: "CD", source: "C", target: "D" },
  ];
  edges.forEach(edge => g.addEdge(edge)); // Add edges as objects

  // Lock the path from B to C requiring the key
  g.lockEdge("B", "C", "열쇠");
  g.startNodeId = "A";
  g.goalNodeId = "D";
  return g;
})();

// This is the main component that will be wrapped by PuzzleProvider
const PlaygroundContent: React.FC = () => {
  const {
    graph,
    puzzleState,
    stepSimulation,
    resetSimulation,
    runSimulation,
    parsingErrors,
    validationErrors,
    simulationHistory,
  } = usePuzzle();

  const hasErrors = parsingErrors.length > 0 || validationErrors.length > 0;

  // Effect to reset simulation when graph or rules change
  useEffect(() => {
    resetSimulation();
  }, [graph, resetSimulation]); // Depend on graph to reset when it changes

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen">
      {/* Graph Visualization */}
      <div className="col-span-2 flex flex-col">
        <h2 className="font-bold text-lg mb-2">Graph Puzzle</h2>
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
              onClick={stepSimulation}
              disabled={hasErrors || !puzzleState || puzzleState.entity.at === graph.goalNodeId}
            >
              Step
            </button>
            <button
              className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              onClick={runSimulation}
              disabled={hasErrors || !puzzleState || puzzleState.entity.at === graph.goalNodeId}
            >
              Run
            </button>
            <button
              className="px-3 py-2 rounded bg-slate-200 disabled:opacity-50"
              onClick={resetSimulation}
              disabled={!puzzleState}
            >
              Reset
            </button>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-semibold mr-2">Inventory:</span>
            {puzzleState && puzzleState.entity.inventory.length > 0 ? (
              <span>{puzzleState.entity.inventory.join(', ')}</span>
            ) : (
              <span>(empty)</span>
            )}
          </div>
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
        {/* Simulation History/Log */}
        <div className="mt-4 p-2 border rounded-md bg-gray-50 h-32 overflow-y-auto text-sm">
          <h3 className="font-semibold">Simulation Log:</h3>
          {simulationHistory.length === 0 ? (
            <p className="text-gray-500">No steps yet.</p>
          ) : (
            <ul>
              {simulationHistory.map((entry, index) => (
                <li key={index} className="mb-1">
                  {entry.log}
                  {entry.isFinished && <span className="font-bold text-green-700 ml-2"> (Goal Reached!)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Rule Editor and Preview */}
      <div className="col-span-1 flex flex-col space-y-4">
        <RuleEditor />
        <div className="flex-grow">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
};

// The actual default export, wrapping PlaygroundContent with PuzzleProvider
export default function Playground() {
  return (
    <PuzzleProvider initialGraph={initialGraphData}>
      <PlaygroundContent />
    </PuzzleProvider>
  );
}
