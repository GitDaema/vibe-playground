import type { GraphCommand } from "./types.ts"; // type-only import to avoid runtime error

/**
 * 간단한 한국어 자연어 명령을 파싱하여 구조화된 JSON 객체로 변환합니다.
 * @param text 사용자가 입력한 자연어 명령
 * @returns 파싱된 GraphCommand 객체
 */
export function parseKoreanCommand(text: string): GraphCommand {
  // "노드 A, B, C 만들어줘" 또는 "A, B 노드 추가"
  if (/노드|추가/.test(text) && /[A-Z]/.test(text)) {
    const nodes = text.match(/[A-Z]/g) || [];
    if (nodes.length > 0) {
      return { action: "add_nodes", nodes };
    }
  }

  // "A에서 B, C로 연결해줘" 또는 "A를 B와 연결"
  if (/에서|와|과|연결/.test(text)) {
    const pairs = [...text.matchAll(/([A-Z])\s*(?:에서|와|과)\s*([A-Z,\s]+)/g)];
    if (pairs.length > 0) {
      const edges = pairs.flatMap(p => {
        const from = p[1];
        const toNodes = p[2].split(/,|와|과|\s+/).filter(s => s && /[A-Z]/.test(s));
        return toNodes.map(to => [from, to.trim()]);
      });
      if (edges.length > 0) {
        return { action: "add_edges", edges };
      }
    }
  }

  // "A를 시작, F를 목표로 해줘"
  if (/시작|목표/.test(text)) {
    // 두 형태 모두 지원:
    // 1) "A를 시작" / "E를 목표"
    // 2) "시작은 A" / "목표는 E"
    const startBefore = text.match(/([A-Z])\s*(?:를|을)?\s*(?:시작|출발)/i);
    const startAfter = text.match(/(?:시작|출발)[^A-Z]*([A-Z])/i);
    const goalBefore = text.match(/([A-Z])\s*(?:를|을)?\s*목표/i);
    const goalAfter = text.match(/목표[^A-Z]*([A-Z])/i);

    const start = (startBefore && startBefore[1]) || (startAfter && startAfter[1]) || undefined;
    const goal = (goalBefore && goalBefore[1]) || (goalAfter && goalAfter[1]) || undefined;

    if (start || goal) {
      return { action: "set_goal", start, goal };
    }
  }

  return { action: "unknown", text };
}
