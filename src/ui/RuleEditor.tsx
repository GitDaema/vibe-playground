import React, { useEffect, useMemo, useState } from 'react';
import { usePuzzle } from '../core/PuzzleContext';
import { debounce } from '../utils/debounce';

export default function RuleEditor() {
  const { cnl, setCnl, parsingErrors, validationErrors } = usePuzzle();
  const hasError = parsingErrors.length > 0 || validationErrors.length > 0;

  // 입력 즉시 반영을 위한 로컬 버퍼, 실제 파싱/검증은 디바운스로 Context에 전달
  const [localText, setLocalText] = useState(cnl);

  useEffect(() => {
    setLocalText(cnl);
  }, [cnl]);

  const onChangeDebounced = useMemo(
    () => debounce((v: string) => setCnl(v), 200),
    [setCnl]
  );

  return (
    <div className="flex flex-col space-y-2">
      <h3 className="text-base font-semibold text-gray-800">규칙 편집기 (CNL)</h3>
      <textarea
        className={`w-full min-h-[140px] p-3 rounded-lg border font-mono text-sm resize-y ${hasError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-indigo-400'} bg-white/80`}
        value={localText}
        onChange={(e) => {
          const v = e.target.value;
          setLocalText(v);
          onChangeDebounced(v);
        }}
        placeholder="예: 큐가 비어있지 않다면, 큐에서 다음 노드를 꺼낸다"
      />
    </div>
  );
}
