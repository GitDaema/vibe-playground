import React from "react";
import { usePuzzle } from "../core/PuzzleContext";

const exampleKeyLock = `A에 도착하면, B로 이동한다.
B에 도착하면, 열쇠를 줍는다.
열쇠를 가지고 있고 B에 도착하면, C로 이동한다.
C에 도착하면, D로 이동한다.`;

const exampleBfsSolution = `아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다
큐가 비어있지 않다면, 큐에서 다음 노드를 꺼낸다`;

const exampleDfsSolution = `아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 스택에 추가한다
스택이 빌 때까지, 스택에서 다음 노드를 뺀다`;

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
          <button onClick={() => setCnl(exampleBfsSolution)} className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">예시 풀이: BFS</button>
          <button onClick={() => setCnl(exampleDfsSolution)} className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">예시 풀이: DFS</button>
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
