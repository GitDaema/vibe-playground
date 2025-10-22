import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Graph } from '../graph/model';
import { parseCnl, CnlParsingError } from '../graph/mapper.cnl';
import type { RuleSet, PuzzleState } from '../graph/rule-engine/types';
import { RuleEngine } from '../graph/rule-engine/RuleEngine';
import type { StepResult } from '../graph/rule-engine/RuleEngine';
import Ajv from 'ajv';
import ruleSchema from '../graph/validation/rule.schema.json';

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
  feedbackMessage: string;
  setFeedbackMessage: (message: string) => void;
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
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const createInitialState = useCallback((startNodeId: string): PuzzleState => ({
    entity: { at: startNodeId, inventory: [] },
    nodes: Object.fromEntries(graph.nodes.map(n => [n.id, { tags: n.tags || [] }])),
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
  }, []);

  const resetSimulation = useCallback(() => {
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
  }, [graph, createInitialState]);

  const stepSimulation = useCallback(() => {
    if (!puzzleState || !graph.goalNodeId) return;
    if (validationErrors.length > 0 || parsingErrors.length > 0) return;

    const engine = new RuleEngine(parsedRules, puzzleState, graph);
    const result = engine.step();

    if (result) {
      setPuzzleState(result.newState);
      setSimulationHistory(prev => [...prev, result]);
      if (result.isFinished) {
        setFeedbackMessage('Goal Reached!');
      }
    } else {
      const feedback = engine.getNoRuleApplicableFeedback();
      setFeedbackMessage(feedback || "ê·œì¹™ ?ìš© ?¤íŒ¨: ???´ìƒ ?ìš©??ê·œì¹™???†ìŠµ?ˆë‹¤.");
      console.log(feedback);
    }
  }, [puzzleState, graph, parsedRules, validationErrors, parsingErrors]);

  const runSimulation = useCallback(() => {
    stepSimulation();
  }, [stepSimulation]);

  useEffect(() => {
    resetSimulation();
  }, [graph, resetSimulation]);

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
    runSimulation,
    stepSimulation,
    resetSimulation,
  };

  return <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>;
};
