import React from 'react';
import { usePuzzle } from '../core/PuzzleContext';

export const PreviewPanel: React.FC = () => {
  const { parsedRules, parsingErrors, validationErrors } = usePuzzle();

  const hasErrors = parsingErrors.length > 0 || validationErrors.length > 0;

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold border-b pb-2 mb-2">Rule Preview & Errors</h3>
      {hasErrors ? (
        <div className="text-red-500 p-2 bg-red-50 rounded-md overflow-y-auto">
          <h4 className="font-bold">Errors Detected:</h4>
          <ul>
            {parsingErrors.map((error, i) => (
              <li key={`p-${i}`}>{error.message}</li>
            ))}
            {validationErrors.map((error, i) => (
              <li key={`v-${i}`}>[Validation] {error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex-grow p-2 bg-gray-50 rounded-md overflow-y-auto">
          <h4 className="font-bold text-green-700">Validation OK</h4>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(parsedRules, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
