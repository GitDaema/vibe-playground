import React from "react";
import { usePuzzle } from "../core/PuzzleContext";

const example1 = `A에 도착하면, B로 이동한다.
B에 도착하면, 열쇠를 줍는다.
열쇠를 가지고 있고 B에 도착하면, C로 이동한다.
C에 도착하면, D로 이동한다.`;

const example2 = `# 너비 우선 탐색(BFS)의 기본 아이디어 스케치입니다.
# 큐(Queue)와 방문 기록(Set)은 엔진에 내장되어 있다고 가정합니다.

# 1. 시작 노드를 큐에 넣고 방문 표시를 한다.
# (이 작업은 시뮬레이션 시작 시 자동으로 수행됩니다.)

# 2. 큐가 비어있지 않은 동안 반복한다.
# 현재 노드에서 갈 수 있는 모든 인접 노드를 확인한다.
# 만약 방문하지 않은 노드라면, 큐에 추가하고 방문 표시를 한다.`;

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
            <button onClick={() => setCnl(example1)} className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">예시1: 락/아이템</button>
            <button onClick={() => setCnl(example2)} className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">예시2: BFS 스케치</button>
        </div>
      </div>
      <textarea
        className="w-full h-48 border rounded-md p-2 text-sm font-mono"
        placeholder={`예시:\n# 규칙은 한 줄에 하나씩 작성합니다.\n# 주석은 #으로 시작합니다.\n\nA에 도착하면, B로 이동한다.\nB에 도착하면, 열쇠를 줍는다.`}
        value={cnl}
        onChange={handleChange}
      />
    </div>
  );
}