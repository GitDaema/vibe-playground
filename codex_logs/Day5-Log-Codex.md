# 현재 프로젝트는 Day 5 목표대로 브라우저 환경 내에서 그래프 퍼즐을 제작한 뒤, 그 퍼즐의 공유 코드를 생성하고 공유 코드만으로도 다시 퍼즐을 복원해서 풀 수 있는 구조를 구현하는 중이야. 다음과 같은 오류가 발생했으니 수정해줘.

shareCode.ts:3 Uncaught SyntaxError: The requested module '/src/graph/model.ts' does not provide an export named 'Edge' (at shareCode.ts:3:23)


Fixed the runtime import error by removing type-only imports from a value import.


---

What happened

- With tsconfig verbatimModuleSyntax: true, TypeScript preserves import specifiers unless marked as type-only.
  - src/codec/shareCode.ts imported Node and Edge as values from ../graph/model, but those are interfaces (erased at runtime). The browser then tried to import non-existent exports, causing the error.

---

Change made

- Updated src/codec/shareCode.ts:3 to import only the runtime value:
  - Before: import { Graph, Node, Edge } from '../graph/model';
  - After: import { Graph } from '../graph/model';

---

Notes

- If you need to reference types in this or other files, use import type { Node, Edge } from '../graph/model'; to keep them type-only and avoid runtime imports.
- Your current tsconfig.app.json intentionally requires this pattern due to verbatimModuleSyntax: true.
- Want me to scan for any other type-only imports mixed with value imports and fix them similarly?

- 한국어로 답변해줘.


- 문제 원인과 수정 내역을 정리했어요.

- 원인

- tsconfig.app.json에서 verbatimModuleSyntax: true라 타입 전용이 아닌 import는 런타임까지 그대로 유지됩니다.
- Edge, Node는 TypeScript 인터페이스(타입)라 번들 시 런타임 export가 생성되지 않습니다.
- 그런데 src/codec/shareCode.ts가 Edge, Node를 값처럼 가져오며 ESM에서 “해당 export 없음” 오류가 발생했습니다.
- 수정 사항

- 타입 전용이 아닌 심볼을 제거해 런타임 import만 남겼습니다.
- 변경 파일: src/codec/shareCode.ts:3
- 이전: import { Graph, Node, Edge } from '../graph/model';
- 이후: import { Graph } from '../graph/model';
- 권장 사항

- 타입이 필요할 땐 다음처럼 가져오세요:
- import type { Node, Edge } from '../graph/model';
- 추가 참고

- 제가 로컬에서 빌드 검증을 시도했지만, 현재 환경의 Node.js(18.x)로는 Vite(7.x) 요구사항(20.19+ 또는 22.12+)을 충족하지 않아 실패했습니다. 로컬에서 재확인 시 Node를 업그레이드한 뒤 npm run dev 또는 npm run build로 검증해 주세요.
- 원하시면 레포 전체에서 비슷한 타입/값 혼합 import 패턴이 있는지 추가 점검해 드릴게요.

- 이번 오류와 비슷한 오류를 Gemini CLI가 자주 범하고 있어. 앞으로 이런 오류가 일어나지 않도록 지침을 GEMINI.md에 추가해줄 수 있을까? 다른 지침은 수정하지 말고 그대로 보존해줘.


- 변경 없이 지침만 추가해, 타입/값 import 오류 방지 가이드를 GEMINI.md에 반영했어요.

- 수정 파일: GEMINI.md:끝
- 추가 내용: “타입/값 Import 오류 방지 가이드 (필독)” 섹션
- verbatimModuleSyntax: true 환경에서의 원인 설명
- import/export 올바른 패턴
- 잘못된/올바른 예시 코드
- Gemini CLI 코드 생성 전 체크리스트
- 프로젝트 맥락 예시(src/codec/shareCode.ts)
- 핵심 요약

- 타입은 import type { ... }, 값은 import { ... }.
- 재수출 시 타입은 export type { ... }, 값은 export { ... }.
- 혼합 시 import { Graph, type Edge, type Node } from '...' 형태 허용.
- 원하시면 ESLint 규칙(@typescript-eslint/consistent-type-imports) 적용 제안도 드릴게요.

- 현재 BFS/DFS 퍼즐을 제작하거나 푸는 것은 제한된 기능 측면에서 불가능해. 다음과 같은 [피드백]이 올바른지 충분히 검토한 뒤, Gemini CLI에게 전달할 프롬프트를 작성해줘.

- 피드백
- BFS(및 잠재적으로 DFS) 예제 퍼즐을 의미 있고 자연어 규칙을 통해 해결 가능하게 만들려면 NLU 및 규칙 엔진 계층을 추상
- 자료구조를 지원하도록 개선해야 합니다.

- 해결책은 다음과 같습니다.

  - src/graph/rule-engine/types.ts에 추상 자료구조 정의:

- RuleEngine의 상태 내에 Queue 및 Stack에 대한 새로운 유형을 도입합니다. 이들은 초기에는 간단한 배열 기반 구현이 될 것입니다.
- 일반적인 연산(예: push, pop, isEmpty, peek, contains)을 이러한 유형의 일부로 또는 규칙 엔진에서 액세스할 수 있는 유틸리티 함수로 정의합니다.
  - src/graph/rule-engine/actions.ts 및 src/graph/rule-engine/conditions.ts에 자료구조 연산 구현:

- 액션: addToQueue, popFromQueue, addToStack, popFromStack과 같은 새로운 액션을 추가합니다. 이러한 액션은 puzzleState의 Queue 또는 Stack 인스턴스를 수정합니다.
- 조건: queueIsEmpty, stackIsEmpty, queueContainsNode, stackContainsNode와 같은 새로운 조건을 추가합니다. 이러한 조건은 자료구조의 상태를 확인합니다.
- NLU 매퍼 확장 (src/nlu/mapper.ko.ts 및 src/nlu/patterns.ko.ts):

- 패턴: 새로운 액션 및 조건에 매핑되는 새로운 자연어 패턴(한국어)을 생성합니다.
- 큐의 경우: "큐에 [노드]를 추가해", "큐에서 다음 노드를 꺼내", "큐가 빌 때까지", "큐에 [노드]가 있다면"
- 스택의 경우: "스택에 [노드]를 넣어", "스택에서 다음 노드를 빼", "스택이 빌 때까지", "스택에 [노드]가 있다면"
- 매핑 로직: mapper.ko.ts를 업데이트하여 이러한 패턴을 구문 분석하고 RuleEngine이 이해할 수 있는 해당 JSON 규칙 구조를 생성합니다. 여기에는 "큐", "스택", "추가", "꺼내", "빌
- 때까지"와 같은 키워드를 식별하고 이를 새로운 액션/조건 유형에 매핑하는 작업이 포함됩니다.
  - src/core/PuzzleContext.tsx 및 src/ui/Playground2.tsx 업데이트 (필요한 경우):

- PuzzleContext는 상태의 일부로 빈 Queue 및 Stack 인스턴스로 초기화해야 할 수 있습니다.
- Playground2.tsx(또는 RuleEditor.tsx)는 이러한 새로운 자연어 명령을 사용하는 방법에 대한 몇 가지 초기 예제 또는 힌트를 제공해야 할 수 있습니다.
- BFS/DFS 예제 규칙 개선:

- NLU 및 규칙 엔진이 이러한 자료구조를 지원하게 되면 authorExampleBfs(및 잠재적으로 새로운 DFS 예제)의 BFS 예제를 이러한 새로운 자연어 명령을 사용하도록 업데이트하여 사용자의
- 자연어 입력으로 실제로 해결할 수 있도록 만들 수 있습니다.
- 이 접근 방식을 통해 사용자는 BFS 및 DFS와 같은 그래프 탐색 알고리즘을 자연어를 사용하여 표현할 수 있으며, 이는 시스템에 의해 실행 가능한 규칙으로 변환되어 BFS 예제를 의미 있게 만들
- 것입니다.


- 피드백을 검토했고, 방향은 대체로 정확합니다. 다만 적용 위치와 몇 가지 보완이 필요합니다.

- 검토 결과

- 자료구조(Queue/Stack)를 퍼즐 상태로 도입하고, 이를 조작하는 액션/조건을 규칙 엔진에 추가해야 BFS/DFS가 자연어로 표현 및 실행 가능합니다. 이 부분은 올바릅니다.
- NLU 적용 위치는 src/nlu/*가 아니라 그래프용 CNL 파서인 src/graph/mapper.cnl.ts를 확장하는 것이 일관됩니다. 현재 src/nlu/*는 물리 엔진용 패턴이라 그래프 도메인과 분리되어 있습니다.
- 방문 여부(visited) 관리, 이웃 노드 일괄 추가(enqueueNeighbors) 같은 BFS 필수 연산이 누락되어 있어 함께 포함해야 자연어만으로 실질적인 BFS/DFS가 성립합니다.
- UI 파일명은 src/ui/Playground.tsx, src/ui/RuleEditor.tsx를 사용하는 편이 레포와 맞습니다. Playground2.tsx는 존재하지 않습니다.
- 스키마(src/graph/validation/rule.schema.json)는 액션/조건 키를 제한하지 않아 추가 변경 없이도 확장이 가능합니다.
- 보완 권장 사항

- 방문 관리: visited 플래그(또는 nodes[*].tags에 ‘visited’)를 쓰는 액션/조건(markVisited, visited, notVisited)을 추가.
- 이웃 탐색: 현재 노드의 인접 노드를 큐/스택에 넣는 enqueueNeighbors(중복/방문 제외 옵션 포함)를 추가.
- 루프 표현: “큐가 빌 때까지/스택이 빌 때까지”를 WHEN 조건(queueNotEmpty/stackNotEmpty)으로 매핑.
- 초기화: PuzzleContext에서 시작 시점에 queue=[start], stack=[]로 초기화해 BFS/DFS가 자연스럽게 시작되도록 함.
- 타입/값 import 원칙: 인터페이스는 반드시 import type으로만 가져오도록 유지.
- 아래는 Gemini CLI에게 전달할 구체 프롬프트입니다.

- Gemini 작업 프롬프트

- 목표: 그래프 퍼즐에서 자연어(CNL)로 BFS/DFS를 의미 있게 표현하고 실행할 수 있도록 규칙 엔진과 CNL 파서를 확장한다. 기존 기능은 보존하며 타입/값 import 오류가 나지 않게 구현한다.

- 변경 파일

  - src/graph/rule-engine/types.ts
- PuzzleState에 자료구조와 방문 상태를 추가한다.
- ds.queue: string[], ds.stack: string[]
- 방문 관리는 nodes[id].tags의 'visited' 사용 또는 visited: Record<string, boolean> 중 하나로 일관되게 유지. 권장: 기존 tags를 재사용.
  - src/graph/rule-engine/actions.ts
- 새 액션(및 필요 시 Validator) 추가:
- addToQueue: string — 노드 ID를 큐 뒤에 추가.
- popFromQueue: true — 큐 앞에서 꺼내 entity.at으로 이동. 큐가 비면 no-op 또는 검증 실패.
- addToStack: string — 노드 ID를 스택에 push.
- popFromStack: true — 스택에서 pop하여 entity.at으로 이동. 스택이 비면 no-op 또는 검증 실패.
- markVisited: 'current' | string — 현재 노드 또는 지정 노드에 방문 표시(tags에 'visited' 추가).
- enqueueNeighbors: { onlyUnvisited?: boolean; avoidDuplicates?: boolean; target?: 'queue'|'stack' }
- 기본값: onlyUnvisited=true, avoidDuplicates=true, target='queue'
- entity.at의 이웃을 그래프 간선 기준으로 수집 후 대상 자료구조에 추가.
- 기존 액션(moveTo, pickup, drop)과 공존하도록 구현.
  - src/graph/rule-engine/conditions.ts
- 새 조건 추가:
- queueIsEmpty: true, queueNotEmpty: true
- stackIsEmpty: true, stackNotEmpty: true
- queueContainsNode: string, stackContainsNode: string
- visited: 'current' | string, notVisited: 'current' | string
- 기존 조건(at, has, always)과 공존.
  - src/graph/mapper.cnl.ts
- 한국어 CNL 패턴 확장. 쉼표로 절을 나누는 기존 파서 흐름을 유지하며 아래 문구를 WHEN/THEN에 매핑:
- 큐 관련:
- “큐에 X를 추가한다” → { addToQueue: 'X' }
- “큐에서 다음 노드를 꺼낸다” → { popFromQueue: true }
- “큐가 빌 때까지” → WHEN { queueNotEmpty: true }
- “이웃을 큐에 추가한다” → { enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'queue' } }
- 스택 관련(DFS):
- “스택에 X를 넣는다/추가한다” → { addToStack: 'X' }
- “스택에서 다음 노드를 뺀다” → { popFromStack: true }
- “스택이 빌 때까지” → WHEN { stackNotEmpty: true }
- “이웃을 스택에 추가한다” → { enqueueNeighbors: { onlyUnvisited: true, avoidDuplicates: true, target: 'stack' } }
- 방문 표시:
- “방문 표시를 한다” → { markVisited: 'current' }
- “X를 방문 표시한다” → { markVisited: 'X' }
- 방문 여부 조건:
- “아직 방문하지 않았다면” → WHEN { notVisited: 'current' }
- “X를 아직 방문하지 않았다면” → WHEN { notVisited: 'X' }
- 기존 정규식 패턴과 충돌하지 않도록, 새로운 패턴을 분기 처리하며 ‘조건 절이 동작 이후에 나옴’ 검증은 유지.
  - src/core/PuzzleContext.tsx
- createInitialState에서 ds.queue = [graph.startNodeId], ds.stack = []로 초기화.
- 나머지 로직과 호환되도록 타입만 확장(엔진은 RuleEngine가 각 step마다 사용).
- 타입/값 import 주의
- 인터페이스/타입은 반드시 import type으로만 가져온다.
- 예: import { Graph } from '../graph/model'; import type { Node, Edge } from '../graph/model';
- 수용 기준

- 큐/스택 조작 액션과 조건이 정상 동작한다.
- 아래 CNL로 BFS가 실행된다(시작 노드가 큐에 이미 초기화된 상태).
- 예시 CNL:
- “방문 표시를 한다, 이웃을 큐에 추가한다, 큐가 빌 때까지, 큐에서 다음 노드를 꺼낸다, 아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다”
- 기대 동작: 시작 노드 방문 표시 및 이웃 enqueue → 큐가 빌 때까지 pop→visit→enqueue를 반복 → entity.at === goal이 되면 RuleEngine의 isFinished가 true.
- 유사한 문구로 DFS도 동작한다(큐→스택 교체).
- 기존 규칙(위치 기반 이동, 아이템 줍기/사용)은 영향 없이 동작한다.
- 브라우저 런타임 import 오류가 없다(타입은 모두 import type).
- 노트

- 규칙 스키마는 키를 제한하지 않아 갱신 불필요.
- 루프는 “큐/스택이 빌 때까지”를 WHEN 조건으로 표현하여 step() 반복 호출로 자연스럽게 진행된다.
- 중복 방지는 enqueueNeighbors 옵션과 queueContainsNode/stackContainsNode 조건으로 보완 가능.
- 이 프롬프트로 작업하면 BFS/DFS가 자연어 규칙으로 구현 가능해지고, 현재 아키텍처를 크게 흔들지 않으면서 단계적으로 확장할 수 있습니다. 필요하면 예제 CNL과 해당 규칙 JSON의 정확한 샘플도 추가로 제시해 드릴게요.

- 다음과 같이 작업을 마쳤어. 이제 CNL을 개선하고 싶어. 현재 CNL은 LLM처럼 자연어를 처리하는 것이 아닌, 고정된 문법대로 처리하고 있어. 그래서 "A B 연결"이나 "노드 A, B 생성", "B와 C를 잇는 간선을 지나려면 열쇠가 필요하다", "B에 열쇠가 있다" 등 대부분의 자연스러운 말이 전부 해석할 수 없는 구문이 돼. 코드는 수정하지 말고, 해결 방안을 말로만 설명해줘.

- 끝마친 작업
  - src/graph/rule-engine/conditions.ts에서 notVisited 조건이 항상 true를 반환하여 노드가 올바르게 방문으로 표시되지 않고 BFS 시뮬레이션이 반복되는 치명적인 버그를 수정했습니다.
* src/graph/mapper.cnl.ts를 업데이트하여 queueNotEmpty 조건에 대한 자연어 구문 "큐가 비어있지 않다면"을 올바르게 파싱하도록 했습니다.
* src/ui/Playground2.tsx 및 src/ui/RuleEditor.tsx를 수정하여 규칙 편집기에 올바른 BFS CNL 솔루션을 채우는 "BFS 예시" 버튼을 추가하여 BFS 테스트를 위한 사용자 경험을 개선했습니다.
* src/core/PuzzleContext.tsx의 PuzzleState 초기화가 BFS/DFS를 위한 큐와 스택을 올바르게 설정하도록 했습니다.

- 다음 단계는 “고정 규칙 → 유연한 CNL”로의 전환입니다. 코드는 건드리지 않고, 설계·절차만 정리합니다.

- 문제 요약

- 현재 CNL은 엄격한 정규식 기반이라 어순·조사·동의어·불완전 문장에 취약합니다.
- 저자용(그래프 제작)과 풀이용(규칙) 문법이 뒤섞여 있고, 다양한 표현의도에 대응할 추상화가 부족합니다.
- 핵심 전략

- 이원화: 저자 CNL(src/graph/author.cnl.ts)과 규칙 CNL(src/graph/mapper.cnl.ts)을 분리 유지하되, 공통 전처리/사전/토크나이저를 공유.
- 3단 하이브리드 파이프라인:
- 정규화 단계: 띄어쓰기·조사·문장부호·동의어 표준화
- 의도/슬롯 추출: 의도 사전 + 다중 패턴 뱅크(정규식/구문 템플릿)
- 구조화/검증: 스키마에 맞춘 JSON으로 조립 후 경고·수정 제안
- 1) 정규화 레이어(전처리)

- 공백/문장부호 표준화: “A B 연결”, “A, B 연결” 모두 “A와 B 연결”로 정규화.
- 조사/어미 제거/치환: 를/을/에/은/는/이/가, “-게”, “-도록” 등 제거해 핵심 어구만 남김.
- 동의어 사전:
- 연결: 연결/잇다/이어/연결해/이어줘/연결시켜
- 간선: 간선/엣지/링크/선
- 필요: 필요/필요하다/있어야/갖고/가지고/있으면
- 아이템: 열쇠/키, 문: 문/문1/door
- 엔티티 정규화:
- 노드 ID: 대문자 1자뿐 아니라 “A1, B2” 등 다문자 지원
- 나열: “A, B, C”, “A B C”, “A와 B와 C”
- 아이템 토큰: “열쇠/키”, “item:열쇠”로 매핑
- 2) 의도/슬롯 추출(패턴 뱅크)

- 저자 CNL(그래프 제작) 주요 의도
- add_nodes: “노드 A, B 생성/추가/만들어”
- add_edges: “A B 연결/잇다”, “A에서 B로 연결”, “A-B, B-C를 연결”
- lock_edge: “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”, “B→C는 열쇠 있어야 통과”
- place_item: “B에 열쇠가 있다/놓여 있다/배치”
- set_start/goal: “시작은 A”, “목표는 F”
- 규칙 CNL(풀이) 주요 의도
- BFS/DFS 자료구조: 큐/스택 추가/꺼내기/비었는지
- 방문/비방문 조건: 방문 표시/아직 방문 안 했으면
- 이웃 처리: 이웃을 큐/스택에 추가(중복/방문 제외)
- 다형 패턴 설계
- “A B 연결” → { action: "add_edges", edges: [["A","B"]] }
- “노드 A, B 생성” → { action: "add_nodes", nodes: ["A","B"] }
- “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”
- → { action: "lock_edge", from:"B", to:"C", requires:"열쇠" }
- “B에 열쇠가 있다”
- → { action: "place_item", node:"B", item:"열쇠" }
- 조합 문장 처리
- 쉼표/“그리고/및/그리고나서”로 절 분할 후 각 절을 독립 매칭
- 순서 자유도: “A와 B를 잇는 간선” ↔ “A에서 B로 가는 간선”
- 3) 구조화/검증

- 저자 CNL → 그래프 변경 명령(노드/간선/락/아이템)으로 변환 후 도메인 검증
- 존재하지 않는 노드 자동 생성 여부 옵션화
- 간선 중복/역방향 규칙 확인
- 규칙 CNL → RuleSet(JSON) 변환 후 Ajv 스키마 검증
- 불완전 문장에 대한 제안
- 예: “연결해”만 있으면 “무엇과 무엇을 연결할까요?” 보정 프롬프트 생성
- 의도는 맞는데 슬롯 일부 누락 시 자동추정(최근 언급 노드) + 경고
- 테스트 우선 시나리오

- 파서 유닛 테스트 케이스 추가(문장 다양화)
- “A B 연결” → add_edges
- “노드 A, B 생성” → add_nodes
- “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다” → lock_edge
- “B에 열쇠가 있다” → place_item
- 섞인 문장: “노드 A, B 생성, A B 연결, B와 C 연결”
- 회귀 테스트: 기존 CNL 예제·BFS/DFS 예제가 모두 통과
- 권장 아키텍처 변화(점진)

- 공통 유틸
  - src/nlu/ko/norm.ts: 정규화(띄어쓰기, 조사, 동의어, 나열 파서)
  - src/nlu/ko/patterns.author.ts: 저자용 패턴 테이블
  - src/nlu/ko/patterns.rules.ts: 규칙용 패턴 테이블
- 각 패턴은 “regex | predicate + projector(슬롯 추출)” 구조
- 고급화 옵션(선택)
- 경량 형태소 보정기(사전 기반 토크나이저) 추가해 붙임표현 대응력 강화
- 문법 기반 파서(nearley/ohm-js)로 마이그레이션하여 어순 자유도/동의어를 문법 수준에서 흡수
- 런타임 LLM 미사용 원칙 유지. 단, 개발·작성 시 Gemini CLI를 이용해 문장-슬롯 후보를 생성하고 스키마로 검증하는 보조 워크플로 구성
- UX 개선

- 규칙/저자 에디터에 “허용 표현 예시” 힌트 제공
- 파싱 실패 시 구체적 원인과 대체 표현 제안
- 최근 참조 엔티티 히스토리(마지막 언급 노드/아이템)를 활용한 자동완성/슬롯 채우기
- 적용 순서 제안

- 정규화 레이어 + 동의어 사전 도입
- 저자 CNL 패턴 확장(위 4문장 우선) → 테스트 추가
- 규칙 CNL 패턴 확장(BFS/DFS 핵심 표현) → 테스트 추가
- 조합 문장/순서 자유도 확대 → 회귀 테스트
- 문법 파서 도입 여부 검토(필요 시)
- 이 접근으로 “자연스러운 한국어”를 최대한 규칙적이고 안전한 방식으로 수용하면서, 기존 구조(저자용/규칙용 분리, Ajv 검증, RuleEngine 실행)를 그대로 활용할 수 있습니다.

- 이 내용을 토대로 Gemini CLI에게 전달할 추가 Day5 프롬프트를 작성해줘. 반드시 Gemini CLI에게 적합한 프롬프트 기법을 사용해줘.


- 아래 프롬프트를 Day5 추가 작업으로 Gemini CLI에 그대로 전달하세요. 기존 코드 스타일과 문서 지침을 유지하고, 자연어 CNL 해석력을 단계적으로 확장하는 데 초점을 맞춥니다.

- 역할

- 그래프 퍼즐 샌드박스의 CNL(한국어 제약 자연어) 해석 엔진을 고도화한다.
- 저자용 CNL(그래프 제작)과 규칙 CNL(퍼즐 풀이)을 모두 다룬다.
- 목표

- 고정 문형 기반 파싱에서 벗어나, 자연스러운 표현(어순·조사·동의어·나열 변형)을 안정적으로 해석한다.
- “A B 연결”, “노드 A, B 생성”, “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”, “B에 열쇠가 있다” 같은 문장을 정확히 구조화된 명령 JSON으로 변환한다.
- 기존 CNL 및 규칙 엔진과 100% 호환되며 회귀 없이 동작한다.
- 제약 조건

- 타입/값 import 분리 엄수: 타입은 import type, 값은 import. 혼합 시 import { Graph, type Edge } from ... 허용.
- 불필요한 리팩터링/파일명 변경 금지. 기존 API, 스키마, 테스트를 깨지 않는다.
- 스키마(src/graph/validation/rule.schema.json)는 그대로 사용하고, 규칙 JSON 구조만 확장한다.
- 한국어로 커밋 메시지 본문 가능하나 제목은 Conventional Commits 형식으로 영어 사용.
- 변경 파일(추가/수정)

- 공통 정규화/패턴 유틸 추가
  - src/nlu/ko/norm.ts 新: 전처리/정규화 유틸
- normalizeText(text): 공백/문장부호 표준화, 조사 제거(을/를/에/은/는/이/가), 간단 동의어 치환
- tokenizeList(text): “A, B C” → [“A”, “B”, “C”]
- normalizeNodeId(s): “A1, B2” 형태 포함 대소문자 표준화
  - src/nlu/ko/dict.ts 新: 동의어/키워드 사전
- 연결: 연결/잇다/이어/연결해/이어줘/연결시켜
- 간선: 간선/엣지/링크/선
- 필요: 필요/필요하다/있어야/갖고/가지고/있으면
- 아이템: 열쇠/키
- 접속사: 그리고/및/그리고나서
- 저자용 CNL(그래프 제작)
  - src/graph/author.cnl.ts 追: norm/dict를 사용해 다음 의도를 지원
- add_nodes: “노드 A, B 생성/추가/만들어”
- add_edges: “A B 연결/잇다”, “A에서 B로 연결”, “A-B, B-C 연결”
- lock_edge: “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”, “B→C는 열쇠 있어야 통과”
- place_item: “B에 열쇠가 있다/놓여 있다/배치”
- set_start/goal: “시작은 A”, “목표는 F”
- 절 분할: 쉼표/접속사(그리고/및) 기준으로 분리 후 각 절을 독립 매칭
- 규칙 CNL(퍼즐 풀이)
  - src/graph/mapper.cnl.ts 修: norm/dict 적용, 기존 패턴 유지
- 큐/스택: “큐에 X 추가/넣어”, “큐에서 다음 꺼내”, “큐가 비어있지 않다면/빌 때까지”
- 방문: “방문 표시(현재/노드명)”, “아직 방문 안 했다면”
- 이웃: “이웃을 큐/스택에 추가(중복/방문 제외)”
- 순서 자유도를 다루되, ‘조건 절이 동작 이후’ 검증은 유지
- 테스트
- tests/cnl.author.parse.test.ts 新: 저자 CNL 유닛 테스트 추가
- tests/cnl.rules.parse.test.ts 新: 규칙 CNL 유닛 테스트 추가
- 케이스(샘플, 반드시 통과)
- “A B 연결” → { action: "add_edges", edges: [["A","B"]] }
- “노드 A, B 생성” → { action: "add_nodes", nodes: ["A","B"] }
- “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다” → { action: "lock_edge", from:"B", to:"C", requires:"열쇠" }
- “B에 열쇠가 있다” → { action: "place_item", node:"B", item:"열쇠" }
- 혼합: “노드 A, B 생성, A B 연결, B와 C 연결”
- 문서
- README.md 追: 허용 표현 예시 5~8개 추가(저자/규칙 각각)
- 파싱 실패 시 대체 표현 안내 메시지 예시 추가
- 구현 지침

- 파이프라인 3단계 적용
- 정규화: normalizeText → 동의어/조사 치환 → 절/토큰 분리
- 의도/슬롯 추출: 간단한 다형 정규식 + projector로 슬롯 채우기
- 구조화/검증: 누락 슬롯은 최근 언급 노드/기본값으로 보정하고 경고 메시지 생성
- 나열/범위
- “A, B, C” | “A B C” | “A와 B와 C” 모두 동일 처리
- 안전장치
- 불완전 문장: 의도는 식별되나 슬롯이 부족하면 보정 제안 메시지 반환(예: “무엇과 무엇을 연결할까요?”)
- 중복 간선, 미존재 노드 자동 생성 여부는 옵션화(기본: 자동 생성)
- 수용 기준(Definition of Done)

- 위 테스트 케이스 전부 통과. 기존 테스트/기능 회귀 없음.
- 저자 CNL과 규칙 CNL 모두 정규화 레이어를 공통으로 사용하고, 기존 파서와 공존.
- 타입/값 import 오류 없음(verbatimModuleSyntax: true 환경).
- 기존 BFS/DFS 규칙 예시와 새 자연어 구문이 함께 동작.
- 문서에 새 예시가 추가되어 사용자가 자연어 입력을 쉽게 이해 가능.
- 검증 방법

- 유닛 테스트: npm run test로 새 테스트 파일 통과 확인.
- 수동 검증: Playground의 에디터에 아래 문장 입력 후 파싱 결과 확인
- “노드 A, B 생성”
- “A B 연결”
- “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”
- “B에 열쇠가 있다”
- 규칙 CNL 혼합 사용 예시
- “방문 표시를 한다, 이웃을 큐에 추가한다, 큐가 비어있지 않다면, 큐에서 다음 노드를 꺼낸다, 아직 방문 안 했다면, 방문 표시를 한다, 이웃을 큐에 추가한다”
- 커밋 가이드(예시)

- feat(cnl): add Korean normalization utilities and synonym dictionary with Gemini CLI
- feat(cnl-author): support “A B 연결”, “노드 A, B 생성”, edge lock and item placement with Gemini CLI
- feat(cnl-rules): extend BFS/DFS phrases and neighbor enqueue with Gemini CLI
- docs(readme): add accepted CNL examples and fallback suggestions with Gemini CLI
- test(cnl): add author/rules parsing tests for natural Korean phrases with Gemini CLI
- 주의사항

- 기존 로직 삭제/대체 금지. 새로운 정규화/패턴 레이어는 선택적으로 적용하되 기본 경로로 사용.
- 오류 메시지는 사용자에게 대체 표현을 제안하는 톤으로 한국어 제공.
- 성능보다 안정성/명확성을 우선. 정규식 남용 대신 전처리+단순 패턴 조합으로 관리.
- 이 프롬프트를 기준으로, 자연스러운 한국어 입력을 폭넓게 수용하면서도 현재 구조(저자/규칙 분리, Ajv 검증, RuleEngine 실행)를 유지하는 방향으로 Day5 작업을 진행해 주세요.

- 다음과 같은 수정을 진행하던 도중 작업이 중단되었어. 수정 문맥을 파악한 뒤 이어서 작업해줘.

- 열쇠-자물쇠 퍼즐 예시에서 다음과 같이 구문 해석 불가 오류가 발생했어.

- [Line 2] 해석할 수 없는 구문입니다: "A에서 B로 간선을 잇는다"
- [Line 3] 해석할 수 없는 구문입니다: "B에서 C로 간선을 잇는다"
- [Line 4] 해석할 수 없는 구문입니다: "C에서 D로 간선을 잇는다"
- [Line 5] 해석할 수 없는 구문입니다: "B→C는 '열쇠'가 필요하다"

- ✦ 사용자께서 "열쇠-자물쇠" 퍼즐 예시에서 구문 해석 불가 오류를 보고하셨습니다. 이는 src/graph/author.cnl.ts의 새로운 파싱 로직이 기존의 정규식 기반 파싱을 올바르게 대체하지 못했거나,
- 폴백(fallback) 로직이 제대로 작동하지 않았음을 의미합니다.

- 오류 메시지를 보면, 새로운 유연한 파싱 로직이 "A에서 B로 간선을 잇는다"와 같은 구문을 처리하지 못하고, 기존의 정규식 기반 파싱으로 넘어가지도 못하는 것으로 보입니다.

  - src/graph/author.cnl.ts의 parseAuthoringCnl 함수를 다시 살펴보겠습니다.

- 1 // Intent: Add Edges ("A B 연결")
- 2 if (tokens.includes('CONNECT')) {
- 3   const nodeIds = tokenizeList(line.replace(/에서|로|연결|잇다|이어|연결해|이어줘|연결시켜/g, ' '));
- 4   for (let i = 0; i < nodeIds.length - 1; i++) {
- 5     const from = normalizeNodeId(nodeIds[i]);
- 6     const to = normalizeNodeId(nodeIds[i+1]);
- 7     ensureNode(graph, from, nodePositions);
- 8     ensureNode(graph, to, nodePositions);
- 9     graph.addEdge({ id: `${from}${to}`, source: from, target: to });
- 10 }
- 11 return;
- 12 }

- "A에서 B로 간선을 잇는다"는 normalizeText를 거치면 "A B CONNECT"와 유사한 형태로 변환될 것입니다. tokenizeList는 "A"와 "B"를 추출해야 합니다. 하지만 replace 호출이 너무 광범위하여
- "간선"과 같은 다른 중요한 키워드를 제거할 수 있습니다.

- 또한, "B→C는 '열쇠'가 필요하다"와 같은 구문은 현재의 유연한 파싱 로직에서 전혀 처리되지 않고 있습니다.

- 수정 계획:

  - src/graph/author.cnl.ts의 parseAuthoringCnl 함수를 수정하여, 새로운 유연한 파싱 로직과 기존의 정규식 기반 파싱 로직이 올바르게 공존하고, 모든 케이스를 처리할 수 있도록 보장합니다.
- 각 의도(intent)에 대한 처리가 실패하면, 다음 의도 또는 기존의 정규식 매칭으로 넘어가도록 로직을 수정합니다.
  - src/graph/author.cnl.ts를 수정하겠습니다.


- 수정 중단 지점에서 파싱 실패 케이스를 모두 수용하도록 src/graph/author.cnl.ts의 CNL 파서를 강화해 이어서 작업했습니다.

- 핵심 수정

- 유연 파싱 + 레거시 정규식 폴백이 공존하도록 재구성.
- 연결 구문 전방위 지원
- “A에서 B로 간선을 잇는다/연결한다”
- “A B 연결/잇는다/이어”
- 동사 활용형 대응(“잇는다/잇는/연결해/연결시켜/이어줘” 등)
- 요구 아이템(열쇠) 구문 확장
- “B→C는 '열쇠'가 필요하다”
- “B에서 C로 가려면 '열쇠'가 필요하다”
- “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”
- 시작/목표 지정 확장
- “시작은 A, 목표는 D”
- “시작은 A” / “목표는 D” 단독 구문 허용
- 토큰 정리 로직 개선
- 과도한 replace로 유효 토큰이 삭제되는 문제 방지
- NOUNS.EDGE(간선/엣지/링크/선)만 선택적으로 제거
- 노드 ID는 /^[A-Za-z0-9]+$/ 기준으로 추출
- 변경 파일

  - src/graph/author.cnl.ts
- 검증 방법(예시 입력)

- 아래 각 라인이 오류 없이 해석되어야 합니다.
- “A에서 B로 간선을 잇는다”
- “B에서 C로 간선을 잇는다”
- “C에서 D로 간선을 잇는다”
- “B→C는 '열쇠'가 필요하다”
- “시작은 A, 목표는 D”
- “A B 연결”
- “B에서 C로 가려면 '열쇠'가 필요하다”
- 그래프 상태 확인: 간선 추가, lockEdge(B,C,'열쇠') 적용, 시작/목표 노드 생성.
- 비고

- 로컬 빌드/테스트는 현재 Node 18 환경 제약으로 실패할 수 있습니다. Node 20.19+ 또는 22.12+로 올린 뒤 npm run test 또는 앱에서 직접 CNL 입력으로 확인해 주세요.
- 추가로 허용할 표현이 있다면 예시 문장과 함께 알려주시면 패턴을 확장해 드리겠습니다.
- 노드 A, B, C, D를 만든다. 이 문장이 A, B, C, D 말고도 'D를'이라는 엉뚱한 노드를 생성하는 문제가 발생했어. 이때 '를'을 빼면 사라지고 정상적으로 그래프가 만들어져.

- 이 현상을 포함해서, 현재 CNL 시스템에 있는 잠재적인 문제를 파악하고 수정해줘.


- 문제를 재현·분석 후 CNL 파이프라인의 취약 지점을 보완하고, 관련 버그들을 함께 수정했습니다.

- 핵심 원인

- 조사 처리 취약: “노드 A, B, C, D를 만든다.”에서 ‘D를’처럼 조사(을/를/은/는/이/가/에/에서/로/으로)가 토큰 끝에 붙은 경우가 완전히 제거되지 않아 노드 ID로 남을 수 있었습니다.
- 파싱 공존성: 저자 CNL 파서가 유연 파싱 실패 시 레거시 정규식 폴백으로 제대로 넘어가지 않는 경우가 있었고, 잠금(열쇠) 구문에서 간선이 미리 없으면 lock이 무시되는 잠재 이슈가 있었습니다.
- 중복 태그: 아이템 태그가 중복으로 들어갈 수 있었습니다.
- 수정 사항

- 조사 제거 로직 강화
- 파일: src/nlu/ko/norm.ts
- 변경: 조사 제거를 공백 기반뿐 아니라, 문장부호/문장끝 앞, 알파뉴메릭 토큰 뒤에 붙은 경우까지 제거하도록 확장.
- 토큰화 시 토큰 말미의 조사를 한 번 더 제거해 “D를” → “D”로 안정화.
- 저자 CNL 파서 보강
- 파일: src/graph/author.cnl.ts
- 노드 생성
- 정규화된 문자열에서 CREATE와 노드|점만 제거 후, 알파뉴메릭 노드만 추출하도록 개선. 조사 결합으로 인한 오염 토큰 방지.
- 간선 연결
- “A에서 B로 간선을 잇는다/연결한다”, “A B 연결” 모두 지원 범위를 확장하고, 과도한 replace로 정보가 삭제되지 않게 정리.
- 잠금(열쇠) 구문
- “B→C는 '열쇠'가 필요하다”, “B에서 C로 가려면 '열쇠'가 필요하다”, “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다”를 모두 처리.
- 신규 ensureEdge 도입으로 lock 전에 간선이 없으면 자동 생성 후 lock 적용.
- 아이템 배치
- item:열쇠 태그 중복 추가 방지.
- 시작/목표
- “시작은 A, 목표는 D” + 단독 문장(“시작은 A”/“목표는 D”)도 허용.
- 수정된 파일

  - src/nlu/ko/norm.ts:1
  - src/graph/author.cnl.ts:1
- 잠재 이슈와 예방 조치

- 붙임표현/말끝 변화에 대한 회복력 부족 → 정규화 레이어에서 조사 제거 케이스 확장, 토큰화 후 말미 조사 제거 재보정.
- 잠금 구문이 간선 존재에 의존 → ensureEdge로 자동 보완.
- 중복 태그 → 삽입 전 존재 여부 체크.
- 타입/값 import 문제는 기존 가이드 준수 유지.
- 검증 방법

- 저자 예시 입력(모두 정상 해석되어야 함)
- “노드 A, B, C, D를 만든다.”
- “A에서 B로 간선을 잇는다”
- “B에서 C로 간선을 잇는다”
- “C에서 D로 간선을 잇는다”
- “B→C는 '열쇠'가 필요하다”
- “시작은 A, 목표는 D”
- 결과 확인
- 노드: A, B, C, D만 생성(“D를” 없음)
- 간선: A→B, B→C, C→D 생성
- 잠금: B→C에 requiresItem='열쇠'
- 시작/목표: start=A, goal=D
- 비고

- 로컬 테스트/빌드는 Node 20.19+ 또는 22.12+로 업그레이드 후 npm run test 추천. 현재 환경(Node 18)에서는 Vite/rollup 의존성 문제로 실패합니다.
- 더 확장하고 싶은 자연어 표현이 있으면 문장 예시를 주시면 패턴을 안전하게 늘리겠습니다.
- 그래프 퍼즐 생성 CNL은 큰 문제가 없지만, 퍼즐을 풀 때 쓰는 CNL은 시도해 본 모든 문장의 해석이 실패했어. 이번 오류만 수정하지 말고 근본적인 원인을 찾아 시스템을 안정적으로 구현해줘.

- [Line 1] 'A에 도착하면' 절을 해석할 수 없습니다.
- [Line 2] 'B에 도착하면' 절을 해석할 수 없습니다.
- [Line 3] '열쇠를 가지고 있고 B에 도착하면' 절을 해석할 수 없습니다.
- [Line 4] 'C에 도착하면' 절을 해석할 수 없습니다.


- 근본 원인을 파악했고, 퍼즐 풀이용 CNL 전체가 안정적으로 동작하도록 파서를 수정했습니다.

- 근본 원인

- 규칙(CNL) 파서가 전처리(normalizeText)를 거치면서 조사를 제거했습니다. 이로 인해 핵심 패턴이 망가졌습니다.
- 예: “A에 도착하면” → “A 도착하면”으로 변형되어 ^(.+?)에\s*도착하면$ 정규식이 매칭되지 않음.
- “열쇠를 가지고 있고 B에 도착하면” → “열쇠 가지고 있고 B 도착하면”으로 변형되어 결합 패턴이 실패.
- 규칙 한 줄에 WHEN과 THEN이 모두 있어야만 유효하다는 현재 파서 구조도 사용자 경험을 저해했습니다. WHEN만 있는 줄을 연속으로 쓰면 즉시 오류가 나거나(혹은 마지막에 누락 오류) 문맥을 이월하지 못했습니다.
- 핵심 수정 사항

- 퍼즐 풀이 CNL 파서에서 전처리를 제거하여 조사(에/를 등)를 보존하고, 기존 정규식이 안정적으로 매칭되도록 수정.
- 변경: src/graph/mapper.cnl.ts:1에서 normalizeText import 제거.
- 변경: src/graph/mapper.cnl.ts:~44에서 normalizedClause = clause.trim()으로 교체해 원문 기반 매칭.
- 멀티라인 문맥(WHEN 누적 → THEN 등장 시 규칙 확정) 지원 추가.
- 한 줄이 조건만 포함하면 내부 버퍼에 조건을 누적하고, 다음 줄에서 동작이 나오면 누적된 조건 + 현재 조건을 결합해 하나의 규칙을 구성합니다.
- 파일 끝까지 THEN이 한 번도 나오지 않으면 의미 있는 오류를 한 번만 반환해 사용자에게 수정 힌트를 제공합니다.
- 변경 파일: src/graph/mapper.cnl.ts:1, src/graph/mapper.cnl.ts:~40, src/graph/mapper.cnl.ts:~94, src/graph/mapper.cnl.ts:~208
- 생성 CNL의 잔여 문제도 함께 보완
- ‘D를’처럼 조사가 붙은 토큰을 노드로 잘못 인식하지 않도록 전처리·토크나이저 보강.
- 변경: src/nlu/ko/norm.ts:1 조사 제거 로직 강화(문장부호/문장끝/토큰 말미 케이스), tokenizeList에서 토큰 말미 조사 제거 추가.
- 변경: src/graph/author.cnl.ts:1 간선/잠금 처리 보강, ensureEdge 도입, 아이템 태그 중복 방지.
- 이제 되는 것

- “A에 도착하면” 같은 WHEN-only 라인이 들어와도 즉시 실패하지 않고 버퍼링합니다.
- 다음 줄에 “이동: B” 같은 THEN이 나오면 누적된 WHEN과 함께 하나의 규칙으로 컴파일합니다.
- 기존 문법(“열쇠를 가지고 있고 B에 도착하면, 이동: C”, “이동: D”)도 그대로 동작합니다.
- 생성 CNL에서 “노드 A, B, C, D를 만든다.”가 A,B,C,D 네 개만 생성되고, ‘D를’ 같은 엉뚱한 노드가 생성되지 않습니다.
- 사용 예시

- 규칙 CNL(멀티라인 작성)
- A에 도착하면
- 이동: B
- B에 도착하면
- 이동: C
- 열쇠를 가지고 있고 C에 도착하면
- 이동: D
- 위와 같이 WHEN → THEN 순으로 이어가면 각 2줄이 하나의 규칙으로 묶여 컴파일됩니다. 마지막 줄이 WHEN으로 끝나면 “조건 뒤에 동작(then) 절이 필요합니다” 오류 1건만 안내합니다.
- 파일 변경 요약

  - src/graph/mapper.cnl.ts:45
- 전처리 제거, 멀티라인 WHEN 누적 → THEN 결합 로직 추가, 친절한 누락 오류 메시지 추가.
  - src/nlu/ko/norm.ts:1
- 조사 제거 강화, 리스트 토큰 말미 조사 제거.
  - src/graph/author.cnl.ts:1
- 연결/잠금 구문 안정화, 간선 자동 생성(ensureEdge), 아이템 태그 중복 방지.
- 안정성 메모

- 현재 조건/동작(‘at’, ‘has’, ‘moveTo’, ‘pickup’, ‘drop’)은 그대로 동작합니다.
- 큐/스택 기반 BFS/DFS 용 신규 키(예: ‘queueNotEmpty’, ‘markVisited’)는 파서에서 인식만 하며, 조건/액션 구현은 아직 미흡합니다. 이 부분을 쓰려면 src/graph/rule-engine/conditions.ts와 actions.ts에 해당 키를 실제 로직으로 추가해야 합니다. 원하시면 이어서 구현해 드릴게요.
- 검증 안내

- Node 20.19+ 또는 22.12+로 업데이트 후 npm run test 또는 앱에서 규칙 에디터에 위 예시를 입력해 파싱 결과가 규칙 세트로 잘 나오고, 시뮬레이션이 진행되는지 확인해 주세요.
- 추가로, BFS/DFS 규칙(큐/스택, 방문표시, 이웃 enqueue 등)을 실제로 사용하려면 조건/동작 실행 로직을 이어서 넣어야 합니다. 계속 진행할까요?

- 실제 조건/동작 실행 로직 구현을 계속 진행해줘.

- 그리고 CNL 방식의 단점을 보완하기 위해 엄청난 양의 단어 분류 방법을 미리 정의해 놓은 파일을 관리하는 것에 대해 어떻게 생각해? 절대 바로 수정하지 말고, 아이디어의 장단점을 명확하게 설명해줘.


- 다음 두 가지를 진행했습니다.

- 퍼즐 풀이용 규칙 엔진에 큐/스택·방문 관련 조건/동작을 실제로 구현했습니다.
- “방대한 단어 분류 사전” 접근의 장단점을 분석했습니다. 코드는 수정하지 않고 설명만 했습니다.
- 엔진 구현 결과

- 큐/스택 조작, 방문 표시, 이웃 추가 등 BFS/DFS 핵심 로직을 실행 가능
- 새 동작
- addToQueue, popFromQueue, addToStack, popFromStack
- markVisited(현재/지정 노드), enqueueNeighbors(옵션: onlyUnvisited, avoidDuplicates, target)
- 새 조건
- queueNotEmpty, stackNotEmpty
- visited, notVisited(현재/지정 노드)
- 보조: queueIsEmpty, stackIsEmpty, queueContainsNode, stackContainsNode
- 상태 타입 확장
- ds.queue, ds.stack를 PuzzleState에 추가
- notVisited 판정 안정화
- 존재하지 않는 노드에 대해 무조건 true가 되는 문제 방지
- 변경 파일

- 큐/스택과 방문/이웃 동작 실행 로직
  - src/graph/rule-engine/actions.ts:1
- 큐/스택, 방문/비방문 등 조건 평가 로직
  - src/graph/rule-engine/conditions.ts:1
- 퍼즐 상태 타입에 자료구조 필드 추가
  - src/graph/rule-engine/types.ts:1
- 초기 상태에 큐/스택 포함
  - src/core/PuzzleContext.tsx:18
- 사용 예시(CNL)

- 라인 단위 규칙(멀티라인 WHEN → THEN 결합)
- A에 도착하면
- 방문 표시를 한다, 이웃을 큐에 추가한다
- 큐가 비어있지 않다면
- 큐에서 다음 노드를 꺼낸다, 아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다
- 위 문장들이 파싱되어 다음을 실행
- 현재 노드 방문 표시 → 현재 노드의 이웃을 큐에 추가(중복/방문 제외)
- 큐가 빌 때까지 다음 노드 꺼내 방문 → 이웃 다시 추가
- 검증 팁

- 에디터에 위 예시를 입력하고 step/step으로 진행해 방문 표식과 큐 동작을 확인하세요.
- 로컬 테스트 실행은 Node 20.19+ 또는 22.12+에서 npm run test 권장.
- 사전(대규모 단어 분류 파일) 접근의 장단점

- 장점
- 일관성/재현성: 동일 입력에 대해 항상 같은 결과. 테스트가 용이.
- 오프라인·결정론: LLM 없이 브라우저에서 빠르게 동작.
- 보안/안정성: 예측 가능한 규칙만 허용, 경계 조건 통제 수월.
- 점진 확장: 도메인 용어·동의어를 필요할 때 단위적으로 추가 가능.
- 단점
- 유지보수 비용: 단어/표현 폭발에 따라 사전 크기와 복잡도가 기하급수적 증가.
- 도메인 편향/구멍: 미리 정의하지 않은 표현은 계속 누락 → “해석 불가” 빈발.
- 다의성/문맥 처리 한계: “잇다(동사)/이웃(명사)” 같은 동음/다의 처리 어려움.
- 국제화 비용: 한국어 내 변형만으로도 크고, 다국어 확장은 더욱 부담.
- 권장 전략

- 얕은 사전 + 정규화 레이어 최소화
- 핵심 동사/명사만 엄선해 소형 사전을 유지하고, 조사/띄어쓰기/기호 정규화로 표현 다양성 흡수.
- 구문 템플릿(패턴) 중심
- “A에 도착하면”, “이웃을 큐에 추가한다”, “큐가 비어있지 않다면”처럼 핵심 구문을 템플릿화.
- 사전은 템플릿 내 키워드 소수만 매핑(연결/잇다/이어 등).
- 점진적 커버리지 확대
- 실패 로그에서 상위 빈도 표현만 선별해 사전/패턴 보강.
- 실패 시 대체 표현 제안(UX)으로 사용자 학습 유도.
- 필요 시 문법 파서로 단계적 이행
- ohm-js/nearley 등으로 경량 문법을 도입해 어순 자유도/부사어 삽입을 수용.
- 문법 파서 도입 후에도 소형 사전은 유지(동의어/관용구 매핑용).
- 장기적으로 LLM 보조는 “개발/저작 시”에만
- 런타임은 규칙 파서(결정론), 개발 시에만 LLM로 후보 패턴 생성 → 인간 검토 → 사전/패턴에 반영.
- 다음 단계 제안

- 규칙 엔진에 enqueueNeighbors의 옵션 노출을 CNL로 확장할지 여부 결정(중복/방문 제외 토글).
- UI에 “파싱 실패 → 대체 표현 안내” 표시를 추가해 학습 비용 감소.
- 필요한 경우, ohm-js 기반의 미니 문법으로 “도착하면/이면/이면” 등 변형을 포괄.
- 이어서 큐/스택/방문 관련 동작을 이용한 DFS도 예시 CNL과 함께 검증할까요?

- 현재 브라우저에서 'BFS 퍼즐 예시' 그래프 생성 버튼과 그 그래프의 풀이 버튼은 제대로 구현되지 않은 상태야. BFS, DFS 둘 다 예시 문제와 그에 대한 풀이 버튼이 정상적으로 텍스트 박스에 CNL 구문을 작성할 수 있도록 구현해줘. 열쇠-자물쇠 퍼즐은 이 부분이 잘 구현되어 있으니 참고해줘.


- 요구한 대로 브라우저 UI에서 BFS/DFS 예시 퍼즐과 예시 풀이를 텍스트 박스에 자동으로 채워주는 버튼들을 구현했고, 클릭 즉시 그래프를 생성하는 “빠른 생성” 버튼도 추가했습니다. 열쇠-자물쇠 예시의 UX 패턴을 참고해 일관되게 구성했습니다.

- 구현 내용

- 예시 퍼즐 버튼
  - src/ui/Playground2.tsx:20에 BFS/DFS 저자용 CNL 상수 추가
  - src/ui/Playground2.tsx:142의 AuthoringPanel에 예시 버튼 확장
- “예시 퍼즐: BFS”, “예시 퍼즐: DFS” → 저자 텍스트박스에 CNL 채우기
- “BFS 퍼즐 생성”, “DFS 퍼즐 생성” → CNL을 즉시 파싱해 그래프 생성 + 풀이 탭으로 전환
- 내부 핸들러
  - src/ui/Playground2.tsx:72 기본 생성 handleCreateGraph
  - src/ui/Playground2.tsx:86 빠른 생성 handleQuickCreate(그래프 생성+탭 전환)
- 예시 풀이 버튼
  - src/ui/RuleEditor.tsx:1에 DFS 예시 풀이 CNL 추가, 버튼 “예시 풀이: DFS” 추가
  - src/ui/Playground2.tsx:174의 SolvingPanel에 “BFS 예시”와 대칭되는 “DFS 예시” 버튼 추가
- 각 버튼 클릭 시 규칙 편집기의 텍스트박스에 해당 CNL이 채워짐
- 예시 CNL

- BFS 풀이
- “아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다”
- “큐가 비어있지 않다면, 큐에서 다음 노드를 꺼낸다”
- DFS 풀이
- “아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 스택에 추가한다”
- “스택이 빌 때까지, 스택에서 다음 노드를 뺀다”
- 파일 변경

- 그래프/풀이 UI
  - src/ui/Playground2.tsx:20, 72, 86, 110, 142, 146, 148, 152, 174, 200
- 규칙 편집기
  - src/ui/RuleEditor.tsx:1, 10, 14
- 동작 요약

- 우측 “퍼즐 만들기 (CNL)” 패널
- “예시 퍼즐: BFS/DFS” → 저자 CNL을 텍스트 박스에 채움
- “BFS/DFS 퍼즐 생성” → 해당 CNL로 즉시 그래프 생성 + “퍼즐 풀기” 탭으로 전환
- 우측 “퍼즐 풀기” 패널
- “BFS 예시”, “DFS 예시” → 규칙 편집기 텍스트 박스에 풀이 CNL 채움
- RuleEditor 상단의 “예시 풀이: BFS/DFS/열쇠-자물쇠”도 그대로 사용 가능
- 사전 조건

- BFS/DFS 동작은 큐/스택·방문 관련 조건/동작 구현에 의존합니다. 이미 다음 파일에 반영했습니다:
  - src/graph/rule-engine/actions.ts:1 (addToQueue/popFromQueue/addToStack/popFromStack/markVisited/enqueueNeighbors)
  - src/graph/rule-engine/conditions.ts:1 (queueNotEmpty/stackNotEmpty/visited/notVisited 등)
  - src/core/PuzzleContext.tsx:18 (초기 상태에 queue/stack 포함)
- 검증 방법

- /playground 진입 → “예시 퍼즐: BFS/DFS” 누르고 “BFS/DFS 퍼즐 생성”으로 그래프 생성 → “퍼즐 풀기” 탭에서 “BFS 예시/DFS 예시” 또는 RuleEditor의 예시 풀이 버튼을 눌러 CNL 채움 → Step/Run로 동작 확인
- Node 20.19+ 또는 22.12+에서 실행 권장
- 추가로 버튼 레이블/전환 동작(예: 자동 탭 전환 여부)을 더 조절하고 싶다면 알려주세요.


---