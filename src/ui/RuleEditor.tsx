import React, { useState, useEffect } from "react";

// Day3의 간단 매퍼를 그대로 사용한다고 가정 (parseKoreanCommand)
import { parseKoreanCommand } from "../nlu/mapper.ko";

type Props = {
  onCommand: (cmd: any) => void;
};

export default function RuleEditor({ onCommand }: Props) {
  const [text, setText] = useState("");
  const [json, setJson] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  // text가 변경될 때마다 json과 err 상태를 초기화
  useEffect(() => {
    setJson(null);
    setErr("");
  }, [text]);

  const handleParse = () => {
    try {
      const cmd = parseKoreanCommand(text.trim());
      setJson(cmd);
      setErr("");
    } catch (e: any) {
      setErr(e?.message || "파싱 실패");
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full h-24 border rounded-md p-2 text-sm"
        placeholder={`예) 노드 A, B, C 만들어줘.
A에서 B, C로 연결해줘.
A를 시작, C를 목표로 해줘.`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={handleParse}>분석</button>
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white"
          onClick={() => json && onCommand(json)}
          disabled={!json}
        >
          적용
        </button>
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <pre className="bg-slate-50 border rounded p-2 text-xs">{json ? JSON.stringify(json, null, 2) : "[분석 결과 대기]"}</pre>
    </div>
  );
}
