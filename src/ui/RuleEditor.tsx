import React from "react";
import { usePuzzle } from "../core/PuzzleContext";

export default function RuleEditor() {
  const { cnl, setCnl } = usePuzzle();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCnl(e.target.value);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold border-b pb-2 mb-2">Rule Editor (CNL)</h3>
      <textarea
        className="w-full h-48 border rounded-md p-2 text-sm font-mono"
        placeholder={`예시:\n# 규칙은 한 줄에 하나씩 작성합니다.\n# 주석은 #으로 시작합니다.\n\n\nA에 도착하면, B로 이동한다.\nB에 도착하면, 열쇠를 줍는다.\n열쇠를 가지고 있고 B에 도착하면, 문을 연다.\n이동 → A`}
        value={cnl}
        onChange={handleChange}
      />
      {/* "분석" 버튼은 실시간 파싱으로 대체되므로 제거. "적용" 버튼도 제거. */}
    </div>
  );
}