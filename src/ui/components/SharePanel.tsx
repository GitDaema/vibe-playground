
import React, { useState, useCallback, useRef } from 'react';
import { usePuzzle } from '../../core/PuzzleContext';
import { encodePuzzle, decodePuzzle } from '../../codec/shareCode';
import { Graph } from '../../graph/model';

export const SharePanel: React.FC = () => {
  const { graph, setGraph, resetSimulation } = usePuzzle();
  const [shareCode, setShareCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopyCode = useCallback(() => {
    if (!graph || isCopying) return;

    setIsCopying(true);
    setMessage(null);

    try {
      const code = encodePuzzle(graph);
      navigator.clipboard.writeText(code);
      setMessage({ type: 'success', text: 'Share code copied to clipboard!' });

      // Reset button text after a delay
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setIsCopying(false), 2000);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate share code.' });
      console.error(error);
      setIsCopying(false);
    }
  }, [graph, isCopying]);

  const handleLoadCode = useCallback(() => {
    if (!shareCode || isLoading) {
      if (!shareCode) setMessage({ type: 'error', text: 'Please paste a share code first.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Simulate a short delay for better UX
    setTimeout(() => {
      try {
        const decoded = decodePuzzle(shareCode.trim());
        const newGraph = new Graph(
          decoded.graph.nodes,
          decoded.graph.edges,
          decoded.graph.startNodeId,
          decoded.graph.goalNodeId
        );
        setGraph(newGraph);
        resetSimulation();
        setMessage({ type: 'success', text: `Puzzle loaded successfully! (${decoded.graph.nodes.length} nodes, ${decoded.graph.edges.length} edges)` });
      } catch (error: any) {
        setMessage({ type: 'error', text: `Failed to load puzzle: ${error.message}` });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms delay
  }, [shareCode, isLoading, setGraph, resetSimulation]);

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Share & Load Puzzle</h3>
      <div className="flex flex-col space-y-2">
        <button
          onClick={handleCopyCode}
          disabled={isCopying}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {isCopying ? 'Copied!' : 'Copy Share Code'}
        </button>
        <textarea
          value={shareCode}
          onChange={(e) => setShareCode(e.target.value)}
          placeholder="Paste share code here..."
          className="w-full p-2 border rounded font-mono text-sm"
          rows={4}
        />
        <button
          onClick={handleLoadCode}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-green-300"
        >
          {isLoading ? 'Loading...' : 'Load from Code'}
        </button>

        {message && (
          <div className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};