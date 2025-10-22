import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Graph } from '../graph/model';
import { parseCnl, CnlParsingError } from '../graph/mapper.cnl';
import type { RuleSet, PuzzleState } from '../graph/rule-engine/types';
import { RuleEngine } from '../graph/rule-engine/RuleEngine';
import type { StepResult } from '../graph/rule-engine/RuleEngine';
import Ajv from 'ajv';
import ruleSchema from '../graph/validation/rule.schema.json';

// Setup AJV validator
const ajv = new Ajv();
const validate = ajv.compile(ruleSchema);

interface PuzzleContextType {
  graph: Graph;
  setGraph: (graph: Graph) => void;
  cnl: string;
  setCnl: (cnl: string) => void;
  parsedRules: RuleSet;
  parsingErrors: CnlParsingError[];
  validationErrors: string[];
  puzzleState: PuzzleState | null;
  simulationHistory: StepResult[];
  runSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
}

const PuzzleContext = createContext<PuzzleContextType | undefined>(undefined);

export const usePuzzle = () => {
  const context = useContext(PuzzleContext);
  if (!context) {
    throw new Error('usePuzzle must be used within a PuzzleProvider');
  }
  return context;
};

interface PuzzleProviderProps {
  children: ReactNode;
  initialGraph: Graph;
}

export const PuzzleProvider: React.FC<PuzzleProviderProps> = ({ children, initialGraph }) => {
  const [graph, setGraph] = useState<Graph>(initialGraph);
  const [cnl, setCnlText] = useState<string>('');
  const [parsedRules, setParsedRules] = useState<RuleSet>([]);
  const [parsingErrors, setParsingErrors] = useState<CnlParsingError[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<StepResult[]>([]);

  const createInitialState = useCallback((startNodeId: string): PuzzleState => {
    const nodesMap: PuzzleState['nodes'] = Object.fromEntries(
      graph.nodes.map(n => [n.id, { tags: [] }])
    );
    // Seed items on nodes based on edge requirements (place item at the 'from' node)
    for (const e of graph.edges) {
      if (e.requiresItem && nodesMap[e.from]) {
        const tag = `item:${e.requiresItem}`;
        if (!nodesMap[e.from].tags.includes(tag)) nodesMap[e.from].tags.push(tag);
      }
    }
    return {
      entity: { at: startNodeId, inventory: [] },
      nodes: nodesMap,
    };
  }, [graph]);

  const setCnl = useCallback((text: string) => {
    setCnlText(text);
    const { rules, errors } = parseCnl(text);
    setParsedRules(rules);
    setParsingErrors(errors);

    // AJV Validation
    const isValid = validate(rules);
    if (!isValid) {
      setValidationErrors(validate.errors?.map(e => e.message || 'Unknown validation error') || []);
    } else {
      setValidationErrors([]);
    }
  }, []);

  const resetSimulation = useCallback(() => {
    const startNode = graph.nodes.find(n => n.id === graph.startNodeId);
    if (startNode) {
      const initialState = createInitialState(startNode.id);
      setPuzzleState(initialState);
      setSimulationHistory([]);
    } else {
      setPuzzleState(null);
      setSimulationHistory([]);
    }
  }, [graph, createInitialState]);

  const stepSimulation = useCallback(() => {
    if (!puzzleState || !graph.goalNodeId) return;
    if (validationErrors.length > 0 || parsingErrors.length > 0) return;

    // We need a fresh engine for each step if we want the simulation to be driven by the UI state
    const engine = new RuleEngine(parsedRules, puzzleState, graph.goalNodeId!, graph);
    const result = engine.step();

    if (result) {
      setPuzzleState(result.newState);
      setSimulationHistory(prev => [...prev, result]);
    } else {
      // No rule applied
      console.log("Simulation stopped: No applicable rule found.");
    }
  }, [puzzleState, graph.goalNodeId, parsedRules, validationErrors, parsingErrors]);

  const runSimulation = useCallback(() => {
    // A full run would use a loop with requestAnimationFrame for visualization
    // For now, just take one step.
    stepSimulation();
  }, [stepSimulation]);

  // Reset state when graph or rules change
  useEffect(() => {
    resetSimulation();
  }, [graph, parsedRules, resetSimulation]);

  const value = {
    graph,
    setGraph,
    cnl,
    setCnl,
    parsedRules,
    parsingErrors,
    validationErrors,
    puzzleState,
    simulationHistory,
    runSimulation,
    stepSimulation,
    resetSimulation,
  };

  return <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>;
};
