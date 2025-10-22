import React from "react";
import { usePuzzle } from "../core/PuzzleContext";

const exampleKeyLock = `A에 도착하면, B로 이동한다.
B에 도착하면, 열쇠를 줍는다.
열쇠를 가지고 있고 B에 도착하면, C로 이동한다.
C에 도착하면, D로 이동한다.`;

const exampleBfsHint = `# BFS 힌트 (주석으로 제공)
# 시작 노드를 큐에 넣는다.
# 큐가 비어 있지 않으면, 큐에서 꺼낸 노드를 현재로 한다.
# 현재가 방문되지 않았다면, 방문으로 표시한다.
# 현재의 모든 이웃 v에 대해, 방문되지 않았으면 큐에 넣는다.
# 현재가 목표라면 종료한다.`;

export default function RuleEditor() {
  const { cnl, setCnl } = usePuzzle();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCnl(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rule Editor (CNL)</h3>
        <div className="flex gap-2">
          <button onClick={() => setCnl(exampleKeyLock)} className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">예시 풀이: 열쇠-자물쇠</button>
          <button onClick={() => setCnl(exampleBfsHint)} className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">예시 풀이: BFS(힌트)</button>
        </div>
      </div>
      <textarea
        className="w-full h-48 border rounded-md p-2 text-sm font-mono"
        placeholder={`예시:\n# 규칙은 한 줄에 하나씩 작성하세요\n# 주석은 # 으로 시작합니다\n\nA에 도착하면, B로 이동한다.`}
        value={cnl}
        onChange={handleChange}
      />
    </div>
  );
}

