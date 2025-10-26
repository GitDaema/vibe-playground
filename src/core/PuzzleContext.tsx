import { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Graph } from '../graph/model';
import { parseCnl, type CnlParsingError } from '../graph/mapper.cnl';
import type { RuleSet, PuzzleState } from '../graph/rule-engine/types';
import { RuleEngine, type StepResult } from '../graph/rule-engine/RuleEngine';
import Ajv from 'ajv';
import ruleSchema from '../graph/validation/rule.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(ruleSchema);

// LocalStorage key for solving CNL
const LS_KEYS = {
  solveCnl: 'vibe/v1/solveCnl',
} as const;

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
  feedbackMessage: string;
  setFeedbackMessage: (message: string) => void;
  isRunning: boolean;
  runSimulation: () => void;
  stepSimulation: () => void;
  stopSimulation: () => void;
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
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const puzzleStateRef = useRef<PuzzleState | null>(null);
  const TICK_MS = 600; // Slow down run interval slightly for better visibility
  const saveSolveCnlTimerRef = useRef<number | null>(null);

  // Keep a ref to the latest puzzleState to avoid stale-closure issues in intervals
  useEffect(() => {
    puzzleStateRef.current = puzzleState;
  }, [puzzleState]);

  const createInitialState = useCallback((startNodeId: string): PuzzleState => ({
    entity: { at: startNodeId, inventory: [] },
    nodes: Object.fromEntries(graph.nodes.map(n => [n.id, { tags: n.tags || [] }])),
    ds: {
      // BFS/DFS 초기 상태에서 큐/스택을 비워두고,
      // 첫 규칙에서 이웃을 추가(큐/스택) → 다음 규칙에서 pop하여 이동하는 흐름을 보장
      queue: [],
      stack: [],
    },
  }), [graph]);

  const setCnl = useCallback((text: string) => {
    setCnlText(text);
    const { rules, errors } = parseCnl(text);
    setParsedRules(rules);
    setParsingErrors(errors);

    const isValid = validate(rules);
    if (!isValid) {
      setValidationErrors(validate.errors?.map(e => e.message || 'Unknown validation error') || []);
    } else {
      setValidationErrors([]);
    }
    // Persist solve CNL (debounced, best effort)
    if (saveSolveCnlTimerRef.current) {
      clearTimeout(saveSolveCnlTimerRef.current);
    }
    saveSolveCnlTimerRef.current = window.setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LS_KEYS.solveCnl, text);
        }
      } catch {
        // ignore persistence failures
      }
    }, 300);
  }, []);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    const startNode = graph.nodes.find(n => n.id === graph.startNodeId);
    if (startNode) {
      const initialState = createInitialState(startNode.id);
      setPuzzleState(initialState);
      setSimulationHistory([]);
      setFeedbackMessage('');
    } else {
      setPuzzleState(null);
      setSimulationHistory([]);
    }
  }, [graph, createInitialState, stopSimulation]);

  const stepSimulation = useCallback((fromRun = false) => {
    const currentState = puzzleStateRef.current;
    if (!currentState || !graph.goalNodeId) {
      stopSimulation();
      return;
    }
    if (validationErrors.length > 0 || parsingErrors.length > 0) {
      stopSimulation();
      return;
    }

    const engine = new RuleEngine(parsedRules, currentState, graph);
    const result = engine.step();

    if (result) {
      setPuzzleState(result.newState);
      setSimulationHistory(prev => [...prev, result]);
      if (result.isFinished) {
        setFeedbackMessage('목표에 도달했습니다! 🎉');
        stopSimulation();
      }
    } else {
      const feedback = engine.getNoRuleApplicableFeedback();
      setFeedbackMessage(feedback || "더 이상 적용할 규칙이 없습니다.");
      stopSimulation();
      console.log(feedback);
    }
  }, [puzzleState, graph, parsedRules, validationErrors, parsingErrors, stopSimulation]);

  const runSimulation = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    // 첫 스텝은 즉시 실행
    stepSimulation(true);
    intervalRef.current = window.setInterval(() => stepSimulation(true), TICK_MS);
  }, [isRunning, stepSimulation]);

  useEffect(() => {
    resetSimulation();
  }, [graph, resetSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSimulation();
      if (saveSolveCnlTimerRef.current) {
        clearTimeout(saveSolveCnlTimerRef.current);
        saveSolveCnlTimerRef.current = null;
      }
    };
  }, [stopSimulation]);

  // Restore last solving CNL from LocalStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = window.localStorage.getItem(LS_KEYS.solveCnl);
      if (saved) setCnl(saved);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    feedbackMessage,
    setFeedbackMessage,
    isRunning,
    runSimulation,
    stepSimulation,
    stopSimulation,
    resetSimulation,
  };

  return <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>;
};
