import{ useState, useCallback, useRef, useEffect } from 'react';
import { usePuzzle } from '../../core/PuzzleContext';
import { encodePuzzle, decodePuzzle } from '../../codec/shareCode';
import { Graph } from '../../graph/model';

// LocalStorage helpers (scoped & versioned)
const LS_KEYS = {
  graph: 'vibe/v1/graph',
} as const;

function persistGraph(graph: Graph) {
  try {
    if (typeof window === 'undefined') return;
    const data = {
      nodes: graph.nodes,
      edges: graph.edges,
      startNodeId: graph.startNodeId,
      goalNodeId: graph.goalNodeId,
    };
    window.localStorage.setItem(LS_KEYS.graph, JSON.stringify(data));
  } catch {
    // ignore failures
  }
}

export default function SharePanel() {
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
      const base = (import.meta as any).env?.BASE_URL || '/';
      // 정규형: 리포 루트 + 해시 라우팅 경로에 쿼리 파라미터로 코드 포함
      const fullUrl = `${window.location.origin}${base}#/playground?share=${encodeURIComponent(code)}`;
      navigator.clipboard.writeText(fullUrl);
      setShareCode(fullUrl);
      setMessage({ type: 'success', text: '전체 URL이 클립보드에 복사되었습니다!' });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setIsCopying(false), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: '공유 코드 생성 실패' });
      console.error(error);
      setIsCopying(false);
    }
  }, [graph, isCopying]);

  function extractShareCode(input: string): string | null {
    if (!input) return null;
    const s = input.trim();
    // URL 내 해시가 포함된 경우 우선 해시만 분리
    const hash = s.includes('#') ? s.slice(s.indexOf('#') + 1) : s;
    const h = hash.startsWith('#') ? hash.slice(1) : hash;
    // 1) #/playground?share=...
    if (h.startsWith('/playground')) {
      const qIdx = h.indexOf('?');
      if (qIdx >= 0) {
        const qs = new URLSearchParams(h.slice(qIdx + 1));
        return qs.get('share') || qs.get('restore');
      }
      return null;
    }
    // 2) #share=... 또는 #restore=...
    if (h.startsWith('share=') || h.startsWith('restore=')) {
      const qs = new URLSearchParams(h);
      return qs.get('share') || qs.get('restore');
    }
    // 3) 과거 포맷: 해시 전체가 코드
    if (h && !h.startsWith('/')) return h;
    return null;
  }

  const handleLoadCode = useCallback(() => {
    if (!shareCode || isLoading) {
      if (!shareCode) setMessage({ type: 'error', text: '코드를 먼저 붙여넣어 주세요.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    setTimeout(() => {
      try {
        const code = extractShareCode(shareCode);
        if (!code) throw new Error('유효한 공유 코드가 아닙니다.');
        const decoded = decodePuzzle(code.trim());
        const newGraph = new Graph(
          decoded.graph.nodes,
          decoded.graph.edges,
          decoded.graph.startNodeId,
          decoded.graph.goalNodeId
        );
        setGraph(newGraph);
        resetSimulation();
        persistGraph(newGraph);
        setMessage({ type: 'success', text: `퍼즐 복원 완료! (${decoded.graph.nodes.length} 노드, ${decoded.graph.edges.length} 간선)` });
      } catch (error: any) {
        setMessage({ type: 'error', text: `복원 실패: ${error.message}` });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, [shareCode, isLoading, setGraph, resetSimulation]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">퍼즐 공유하기</h3>
        <button
          onClick={handleCopyCode}
          disabled={isCopying}
          className="h-9 px-4 rounded-lg font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition w-full disabled:bg-indigo-300"
        >
          {isCopying ? '복사 완료!' : '공유 URL 복사'}
        </button>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">퍼즐 복원하기</h3>
        <textarea
          value={shareCode}
          onChange={(e) => setShareCode(e.target.value)}
          placeholder="공유받은 코드 또는 URL을 여기에 붙여넣으세요..."
          className="w-full min-h-[100px] p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 bg-white/80 font-mono text-sm resize-y"
        />
        <button
          onClick={handleLoadCode}
          disabled={isLoading}
          className="h-9 mt-2 px-4 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition w-full disabled:bg-gray-200"
        >
          {isLoading ? '복원 중...' : '불러오기'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
