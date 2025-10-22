[ai-assist] auto-update
# Vibe Playground: Graph Puzzle Sandbox - AI 협업 가이드

**최종 업데이트: 2025-10-22**

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
   - 예: “A에서 B로 연결해줘.” → `{ "action":"add_edge","from":"A","to":"B" }`
3. **문제 제작과 공유**: 사용자는 자연어로 그래프 구조를 만들고 시작(start)과 목표(goal) 노드를 설정한 뒤, 이를 **도전 코드(Challenge Code)**로 압축하여 공유한다.
4. **문제 풀이와 검증**: 다른 사용자는 공유 코드를 입력해 그래프를 복원하고, 자연어로 탐색 규칙(예: BFS, DFS)을 설계한다. Gemini가 이를 JSON Rule로 변환하여 시뮬레이션을 실행하며, 성공 시 **Proof Code**를 생성해 풀이 과정을 공유할 수 있다.

---

## ⚙️ 기술 구조 (Day4 기준)

| 구분 | 주요 파일 | 역할 |
|---|---|---|
| **A. Core Layer** | `src/core/engine.ts`<br>`src/core/dsl.ts`<br>`src/core/PuzzleContext.tsx` | Tick 기반 결정론적 시뮬레이터 및 이벤트/액션 기반 Rule 실행기, 퍼즐 상태 통합 관리 |
| **B. Graph Layer** | `src/graph/model.ts`<br>`src/graph/engine.ts`<br>`src/graph/mapper.cnl.ts`<br>`src/graph/rule-engine/RuleEngine.ts`<br>`src/graph/rule-engine/conditions.ts`<br>`src/graph/rule-engine/actions.ts`<br>`src/graph/rule-engine/types.ts`<br>`src/graph/validation/rule.schema.json` | Node, Edge, Graph 구조 정의, CNL 파서, 규칙 엔진, 조건/행동 정의, 규칙 스키마 |
| **C. AI & NLU Layer** | `src/nlu/mapper.ko.ts`<br>`src/schemas/graph-rule.schema.json`<br>`src/codec/shareCode.ts` | (기존) 제한된 한국어(CNL) → Rule JSON 변환, Ajv 스키마 검증, LZ-String + Base64url 직렬화/복원 |
| **D. UI Layer** | `src/ui/BuildMode.tsx`<br>`src/ui/PlayMode.tsx`<br>`src/ui/GraphCanvas.tsx`<br>`src/ui/RuleEditor.tsx`<br>`src/ui/PreviewPanel.tsx`<br>`src/ui/Playground.tsx` | 그래프 제작/도전 모드, 그래프 시각화, 자연어 규칙 입력 및 미리보기, 메인 퍼즐 실행 화면 |

---

## 💬 자연어 → DSL 변환 예시 (한국어 CNL)

| 사용자 입력 | Gemini 해석 결과 (JSON) |
|---|---|
| “노드 A, B, C를 만들어줘.” | `{"action":"add_nodes","nodes":["A","B","C"]}` |
| “A에서 B, C로 연결해줘.” | `{"action":"add_edges","edges":[["A","B"],["A","C"]]}` |
| “A를 시작, F를 목표로 해줘.” | `{"action":"set_goal","start":"A","goal":"F"}` |
| “너비 우선 탐색으로 실행해.” | BFS 규칙 JSON 템플릿 자동 생성 |
| “결과를 공유 코드로 만들어줘.” | `{"action":"export_challenge"}` |
| “방문한 노드는 초록색으로 표시해.” | `{"event":"visit","action":"markColor","params":{"color":"green"}}` |
| “큐가 빌 때까지 다음 노드 방문을 반복해.” | `{"event":"tick","condition":"!queue.empty","action":"visitNext"}` |

---

## 🧠 AI 협업 구조

| 단계 | AI 역할 | 설명 |
|---|---|---|
| 1 | **자연어 → DSL(JSON) 변환** | 사용자의 명령 의도를 분석하여 그래프 구조 및 규칙을 JSON 형식으로 변환한다. |
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
6. 커밋 메시지를 추천할 때는 Conventional Commits 양식을 지켜 영어로 작성하고 제목 뒤에는 `with Gemini CLI`와 같이 인공지능 사용 여부를 명시. 커밋 본문에는 AI와 사용자 간의 협업 내용을 구체적으로 명시.

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

## ✅ Day4 개발 완료

Day4 목표였던 **규칙 기반 퍼즐 시스템 기초 완성**을 성공적으로 마쳤습니다.

-   **CNL 파이프라인 고도화**:
    -   `src/graph/rule-engine/types.ts`: 규칙, 조건, 행동 타입 정의
    -   `src/graph/validation/rule.schema.json`: 규칙 JSON 스키마 정의
    -   `src/graph/mapper.cnl.ts`: CNL 템플릿 파서 구현 (정규식 → 토큰 → JSON 변환 및 에러 처리)
-   **규칙 기반 엔진(RuleEngine.ts) 구현**:
    -   `src/graph/rule-engine/conditions.ts`: 조건 평가 로직 구현
    -   `src/graph/rule-engine/actions.ts`: 행동 실행 로직 구현
    -   `src/graph/rule-engine/RuleEngine.ts`: 규칙 실행 루프 및 상태 관리 엔진 구현
-   **UI 통합**:
    -   `src/core/PuzzleContext.tsx`: 퍼즐 상태 통합 관리 Context 구현
    -   `src/ui/PreviewPanel.tsx`: CNL 파싱 결과 및 오류 미리보기 UI 추가
    -   `src/ui/RuleEditor.tsx`: `PuzzleContext`와 연동하여 CNL 입력 및 실시간 파싱
    -   `src/ui/Playground.tsx`: 메인 퍼즐 실행 화면으로 재구성, 시뮬레이션 제어 및 로그 표시
    -   `src/ui/GraphCanvas.tsx`: 개체(Entity) 움직임 및 목표 노드 시각화 확장
-   **의존성 설치**: `immer`, `ajv` 설치 완료.

이제 사용자는 자연어로 규칙을 작성하고, 실시간으로 파싱 결과를 확인하며, 규칙 엔진을 통해 그래프 퍼즐을 단계별로 시뮬레이션할 수 있습니다.

## 🧠 향후 계획 명시 (Day4~Day6 로드맵)
| 일차 | 주요 목표 | 상세 설명 |
|------|------------|-----------|
| **Day4** | ✅ 규칙 기반 퍼즐 시스템 기초 완성 | CNL 파서 + RuleEngine + 미리보기 UI 구축 |
| **Day5** | 퍼즐 공유/복원 시스템 구현 | 제작자 성공 시 최소 규칙 수 기록 및 해시 생성 |
| **Day6** | ✅ **최종 완성 — ‘규칙 기반 그래프 퍼즐’ 완전 구현** | <br>1. 제작자: 그래프 제작 → 규칙 작성 → 직접 성공 → 공유 코드 생성<br>2. 도전자: 공유 코드 불러오기 → 규칙 작성 → 실행 → 성공 시 비교(규칙 수)<br>3. ‘규칙으로 사고하는 코딩 퍼즐 환경’ 완성 |

**검증 기준:**
- 자동평가 조건(파일, 커밋, 문서, 테스트) 충족.
- AI 협업 과정이 기록으로 증명됨.
- 그래프 생성/규칙 적용/Proof 생성 3개 핵심 기능 동작.