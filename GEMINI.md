[ai-assist] auto-update
# Vibe Playground: Graph Puzzle Sandbox - AI 협업 가이드

**최종 업데이트: 2025-10-25**

# 역할
너는 “Vibe Playground” 프로젝트의 AI 협업 파트너로,  
현재 Day1~2까지의 개발 결과를 기반으로  
프로젝트 방향을 **그래프 기반 퍼즐 샌드박스**로 재정립하고 개발을 지원한다.

# 🎯 프로젝트 개요 (갱신 목표)

### 프로젝트명
**Vibe Playground: Graph Puzzle Sandbox**

### 핵심 목표
1. **서버 없는 환경**: 모든 데이터는 LocalStorage와 Base64 해시 코드를 통해 처리되며, 별도의 백엔드 서버를 사용하지 않는다.
2. **AI 협업**: Gemini CLI가 사용자의 자연어 입력을 구조화된 Graph DSL(JSON)으로 변환한다.  
   - 예: “A B 연결” → `{ "action":"add_edges","edges":[["A","B"]] }`
3. **문제 제작과 공유**: 사용자는 자연어로 그래프 구조를 만들고 시작(start)과 목표(goal) 노드를 설정한 뒤, 이를 **도전 코드(Challenge Code)**로 압축하여 공유한다.
4. **문제 풀이와 검증**: 다른 사용자는 공유 코드를 입력해 그래프를 복원하고, 자연어로 탐색 규칙(예: BFS, DFS)을 설계한다. Gemini가 이를 JSON Rule로 변환하여 시뮬레이션을 실행하며, 성공 시 **Proof Code**를 생성해 풀이 과정을 공유할 수 있다.

---

## ⚙️ 기술 구조 (Day5 기준)

| 구분 | 주요 파일 | 역할 |
|---|---|---|
| **A. Core Layer** | `src/core/engine.ts`<br>`src/core/dsl.ts`<br>`src/core/PuzzleContext.tsx` | Tick 기반 결정론적 시뮬레이터 및 이벤트/액션 기반 Rule 실행기, 퍼즐 상태 통합 관리 |
| **B. Graph Layer** | `src/graph/model.ts`<br>`src/graph/author.cnl.ts`<br>`src/graph/mapper.cnl.ts`<br>`src/graph/rule-engine/...` | Node, Edge, Graph 구조 정의, 저자용/규칙 CNL 파서 (고도화), 규칙 엔진, 조건/행동 정의 |
| **C. AI & NLU Layer** | `src/nlu/ko/dict.ts`<br>`src/nlu/ko/norm.ts`<br>`src/codec/shareCode.ts` | 한국어 동의어 사전 및 정규화 유틸리티, 퍼즐 공유 코드 직렬화/복원 |
| **D. UI Layer** | `src/ui/Playground2.tsx`<br>`src/ui/RuleEditor.tsx`<br>`src/ui/components/SharePanel.tsx` | 메인 퍼즐 실행 화면, 자연어 규칙 입력기, 퍼즐 공유/로드 UI |

---

## 💬 자연어 → DSL 변환 예시 (한국어 CNL)

| 사용자 입력 | Gemini 해석 결과 (JSON) |
|---|---|
| “노드 A, B 생성” | `{ "action":"add_nodes","nodes":["A","B"] }` |
| “A B 연결” | `{ "action":"add_edges","edges":[["A","B"]] }` |
| “B와 C를 잇는 간선을 지나려면 열쇠가 필요하다” | `{ "action":"lock_edge","from":"B","to":"C","requires":"열쇠" }` |
| “B에 열쇠가 있다” | `{ "action":"place_item","node":"B","item":"열쇠" }` |
| “큐가 비어있지 않다면” | `{ "when": [{ "queueNotEmpty": true }] }` |
| “방문 표시를 한다” | `{ "then": [{ "markVisited": "current" }] }` |
| “이웃을 큐에 추가한다” | `{ "then": [{ "enqueueNeighbors": { "target": "queue" } }] }` |

---

## 🧠 AI 협업 구조

| 단계 | AI 역할 | 설명 |
|---|---|---|
| 1 | **자연어 정규화 및 DSL 변환** | 사용자의 명령을 정규화(동의어, 조사 처리)하고, 의도를 분석하여 구조화된 JSON으로 변환한다. |
| 2 | **Rule 템플릿 추천** | "너비 우선 탐색"과 같은 복합 명령에 대해 BFS, DFS 등 사전 정의된 Rule 템플릿을 자동으로 생성 및 제안한다. |
| 3 | **JSON 스키마 검증** | 생성된 Rule이 Ajv 스키마에 맞는지 실시간으로 검증하여 유효성을 보장한다. |
| 4 | **직렬화 및 복원** | 생성된 그래프(Challenge) 또는 풀이(Proof)를 LZ-String, Base64url, CRC32를 통해 압축된 공유 코드로 변환하거나 복원한다. |

---

## 5. 마스터 프롬프트 (Master Prompt)

**역할:** AI 페어 프로그래밍 어시스턴트.

**목표:** '서버 없는 AI 기반 그래프 퍼즐 샌드박스'를 7일 내 완성.

**제약 조건:**
1. 한 번에 완성하지 말고, 각 기능 단위를 독립적으로 제시.
2. 커밋은 최소 30회로 분할.
3. 모든 출력은 파일 경로와 타입 포함.
4. 프롬프트와 응답은 DEVELOPMENT_LOG.md에 기록.
5. 각 단계가 완료된 후, 변경 사항을 검증하거나 테스트할 수 있는 방법을 제안하고 사용자 확인을 기다립니다.
6. 커밋 메시지를 추천할 때는 Conventional Commits 양식을 지켜 영어로 작성하고 제목 뒤에는 `with Gemini CLI`와 같이 인공지능 사용 여부를 명시. 커밋 본문에는 AI와 사용자 간의 협업 내용을 구체적으로 명시. `git commit` 실행 시에는 제목과 본문 각 단락에 `-m` 플래그를 개별적으로 사용하여 전체 메시지가 누락되지 않도록 주의한다.
7. 사용자와의 모든 상호작용은 한국어로 진행한다.

**출력 순서 (그래프 중심으로 재구성):**
1) `src/graph/model.ts` (Node, Edge, Graph 타입 정의)
2) `src/codec/shareCode.ts` (압축+Base64url+CRC32) - 기존 모듈 활용
3) `src/graph/engine.ts` (탐색 루프 및 상태 관리)
4) `src/graph/actions.ts` & `rules.ts` (액션 및 BFS/DFS 템플릿)
5) `src/nlu/mapper.ko.ts` & `schemas/graph-rule.schema.json` (자연어→DSL 변환)
6) UI (`BuildMode`, `PlayMode`, `GraphCanvas` 등)
7. CRUD 및 Proof 시스템
8. 결정론 테스트
9. `README.md`, `GEMINI.md`, `DEVELOPMENT_LOG.md` 최종 갱신

---

## ✅ 현재 개발 진행 상황

Day6 목표였던 **UI/UX 전면 개편 및 시뮬레이션 엔진 안정화**를 성공적으로 마쳤습니다.

-   **UI/UX 전면 개편**:
    -   **중앙 정렬 레이아웃**: 와이드 스크린에서 콘텐츠가 중앙에 위치하도록 전체 레이아웃 구조를 변경하여 시각적 안정성을 확보했습니다.
    -   **고정 헤더 적용**: 앱 타이틀과 메인 탭을 포함하는 헤더를 상단에 고정하여 탐색 편의성을 높였습니다.
    -   **컨트롤 패널 재구성**: '퍼즐 풀기' 모드의 우측 패널에서 내부 탭을 제거하고, `규칙 편집기`, `실행 기록`, `공유` 패널이 항상 함께 보이도록 UX 흐름을 개선했습니다.
    -   **디자인 시스템 통일**: 일관된 색상 팔레트, 버튼, 폼 스타일을 적용하여 전체적인 디자인 완성도를 높였습니다.

-   **시뮬레이션 엔진 안정화 및 버그 수정**:
    -   **BFS/DFS 실행 오류 해결**: `popFromQueue`/`popFromStack` 액션이 '꺼내기→이동→방문처리→이웃추가'를 원자적으로 수행하도록 강화하여, 시뮬레이션이 중간에 멈추는 치명적인 버그를 수정했습니다.
    -   **'Run' 기능 정상화**: `runSimulation` 함수가 `setInterval`을 사용하도록 수정하여, 'Step'과 동일하게 동작하던 버그를 해결하고 의도된 자동 실행 기능으로 복원했습니다.
    -   **그래프 렌더링 오류 수정**: `GraphCanvas`의 좌표 처리 로직을 개선하여, 퍼즐 로드 시 레이아웃이 깨지거나 아이콘이 잘못 표시되던 문제를 해결했습니다.

-   **CNL 파서 안정화**:
    -   `tests/cnl.author.parse.test.ts`에 다양한 엣지 케이스를 포함한 단위 테스트를 추가했습니다.
    -   테스트를 기반으로 파서의 정규식과 로직을 수정하여, 여러 구문 변형과 동의어를 안정적으로 처리하도록 개선했습니다.

## 🧠 개발 로드맵 (완료)
| 일차 | 주요 목표 | 상세 설명 |
|------|------------|-----------|
| **Day4** | ✅ 규칙 기반 퍼즐 시스템 기초 완성 | CNL 파서 + RuleEngine + 미리보기 UI 구축 |
| **Day5** | ✅ 퍼즐 공유/복원 시스템 및 CNL 고도화 | 해시 코드 공유, BFS/DFS 엔진 로직 및 자연어 파서 확장 |
| **Day6** | ✅ UI/UX 전면 개편 및 엔진 안정화 | 사용자 흐름 개선, 디자인 시스템 통일, 시뮬레이션 핵심 버그 수정 |

**검증 기준:**
- 자동평가 조건(파일, 커밋, 문서, 테스트) 충족.
- AI 협업 과정이 기록으로 증명됨.
- 그래프 생성/규칙 적용/Proof 생성 3개 핵심 기능 동작.

---

## ⚠️ 타입/값 Import 오류 방지 가이드 (필독)

본 프로젝트는 `tsconfig.app.json`에서 `verbatimModuleSyntax: true`와 `moduleResolution: bundler`를 사용합니다. 이 설정에서는 타입을 값처럼 import하면 런타임까지 그대로 보존되어 브라우저/번들 단계에서 다음과 같은 오류가 발생합니다:

> The requested module '...' does not provide an export named 'Edge'

이 문제를 방지하기 위한 지침은 아래와 같습니다.

### 반드시 지킬 것
- 타입(인터페이스, 타입 별칭 등)은 `import type`으로만 가져온다.
- 값(클래스, 함수, 상수 등)만 일반 `import`로 가져온다.
- 타입을 재수출할 때는 `export type { ... }`를 사용한다. 값은 `export { ... }`를 사용한다.
- 한 모듈에서 값과 타입을 동시에 가져올 때는 다음 두 형태 중 하나를 사용한다.
  - 분리형: `import { Graph } from '../graph/model';` + `import type { Node, Edge } from '../graph/model';`
  - 한 줄형: `import { Graph, type Edge, type Node } from '../graph/model';`

### 올바른/잘못된 예시

잘못된 예시 (런타임 오류 유발):

```ts
// ❌ 인터페이스를 값처럼 import 함
import { Graph, Node, Edge } from '../graph/model';
```

올바른 예시:

```ts
// ✅ 값은 값으로
import { Graph } from '../graph/model';
// ✅ 타입은 타입으로
import type { Node, Edge } from '../graph/model';
```

재수출 시:

```ts
// ✅ 값 재수출
export { Graph } from './model';
// ✅ 타입 재수출
export type { Node, Edge } from './model';
```

### 체크리스트 (Gemini CLI 코드 생성 전)
- 타입 심볼을 일반 `import { ... }`에 포함시키지 않았는가?
- `import { type ... }` 또는 별도의 `import type { ... }`로 분리했는가?
- 재수출 시 `export type`과 `export`를 혼용하지 않았는가?
- 오류 메시지에 “does not provide an export named”가 보이면, 타입/값 구분을 먼저 점검한다.

### 관련 맥락
- 해당 설정에서는 타입 전용이 아닌 import가 번들에 그대로 남아 실제 ESM import로 시도됩니다. 인터페이스/타입은 런타임에 존재하지 않으므로 위와 같은 네임드 export 미존재 오류가 발생합니다.
- 예: `src/codec/shareCode.ts`는 `Graph`만 런타임 값으로 import하고, `Node`/`Edge`가 필요하면 `import type`으로 가져와야 합니다.

이 섹션은 가이드라인 추가일 뿐, 기존 지침에는 변경을 가하지 않습니다.

**검증 기준:**
- 자동평가 조건(파일, 커밋, 문서, 테스트) 충족.
- AI 협업 과정이 기록으로 증명됨.
- 그래프 생성/규칙 적용/Proof 생성 3개 핵심 기능 동작.
