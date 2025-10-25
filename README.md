[ai-assist] auto-update
# Vibe Playground: Graph Puzzle Sandbox

**최종 업데이트: 2025-10-22**

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss)](https://tailwindcss.com/)

**서버 없는 AI 기반 그래프 퍼즐 샌드박스**
<br>
A serverless, AI-powered web application for creating, sharing, and solving graph-based puzzles using natural language.

---

## 🚀 About Vibe Playground (프로젝트 소개)

**Vibe Playground**는 사용자가 자연어를 사용해 직접 그래프 퍼즐을 만들고, 알고리즘 탐색 규칙을 설계하여 해결하는 혁신적인 교육용 샌드박스입니다. 모든 과정은 브라우저 내에서 이루어지며, Gemini AI가 사용자의 언어를 실시간으로 분석하여 구조화된 명령으로 변환합니다. 완성된 퍼즐이나 풀이 과정은 간단한 텍스트 코드로 압축하여 친구나 동료와 쉽게 공유할 수 있습니다.

This project allows users to build graph puzzles and design search algorithms using natural language. All operations are handled within the browser, with Gemini AI translating user input into structured commands in real-time. Completed puzzles or solutions can be compressed into a simple text code for easy sharing.

## ✨ Core Features (핵심 기능)

-   **AI-Powered Graph Creation (AI 기반 그래프 생성):** 자연어 명령으로 노드와 간선을 생성하고, 시작/목표 지점을 설정하여 자신만의 퍼즐을 만듭니다.
    -   `"A, B, C 노드를 만들고 A에서 B로 연결해줘."`
-   **Algorithmic Rule Design (알고리즘 규칙 설계):** 너비 우선 탐색(BFS), 깊이 우선 탐색(DFS) 등 그래프 탐색 규칙을 자연어로 설계하고, 시뮬레이션을 통해 동작을 시각적으로 확인합니다.
    -   `"방문한 노드는 초록색으로 칠하고, 인접 노드는 큐에 추가해."`
-   **Challenge & Proof Sharing (도전과 증명 공유):** 생성한 퍼즐(Challenge)이나 성공한 풀이 과정(Proof)을 고유한 해시 코드로 변환하여 어디서든 공유하고 재현할 수 있습니다.
-   **Serverless Architecture (서버 없는 구조):** 모든 데이터는 브라우저의 LocalStorage와 URL 해시를 통해 관리되므로, 별도의 서버나 데이터베이스가 필요 없습니다.

## 🌊 Core User Flow (핵심 사용자 흐름)

1.  **퍼즐 제작 (Create):**
    -   `퍼즐 만들기` 탭에서 자연어(CNL)로 그래프 구조를 설계합니다. (예: `노드 A, B 생성`, `A B 연결`)
    -   `그래프 생성` 버튼을 눌러 퍼즐을 시각적으로 확인하고 수정합니다.

2.  **공유 (Share):**
    -   완성된 퍼즐을 다른 사람에게 공유하기 위해 `Copy Share Code` 버튼을 클릭합니다.
    -   클립보드에 복사된 코드를 친구나 동료에게 전달합니다.

3.  **복원 (Load):**
    -   공유받은 코드를 `Paste share code here...` 영역에 붙여넣고 `Load from Code` 버튼을 클릭합니다.
    -   또는, URL 주소 뒤에 `#`과 함께 코드를 붙여넣어 (`.../#<share_code>`) 바로 퍼즐을 로드할 수 있습니다.

4.  **풀이 (Solve):**
    -   `퍼즐 풀기` 탭으로 이동하여, 로드된 퍼즐을 해결할 규칙을 자연어로 작성합니다.
    -   `Step` 또는 `Run` 버튼으로 시뮬레이션을 실행하며 해결 과정을 시각적으로 확인합니다.

## 🛠️ Tech Stack (기술 스택)

-   **Frontend:** React, TypeScript
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS
-   **AI Collaboration:** Gemini CLI
-   **Serialization:** LZ-String, Base64url, CRC32
-   **Schema Validation:** Ajv
-   **Storage:** LocalStorage
-   **Testing:** Vitest

## 📈 Project Status (프로젝트 현황)

프로젝트 방향이 **규칙 기반 그래프 퍼즐 샌드박스**로 재정립되었으며, 현재 Day5 개발 단계에 있습니다.

**Completed Milestones:**
-   **Day 1:** Vite, React, TypeScript, Tailwind CSS 초기 프로젝트 환경 설정.
-   **Day 2:** 결정론적 시뮬레이션을 위한 코어 엔진(`Engine`) 및 DSL(`Rule`) 실행기 초안 구현.
-   **Day 3:** 그래프 시각화 및 탐색 시스템 완성.
-   **Day 4:** 규칙 기반 퍼즐 시스템 기초 완성 (CNL 파서, RuleEngine, 미리보기 UI 구축).
-   **Day 5:** 퍼즐 공유/복원 시스템 구현 및 BFS/DFS 지원을 위한 CNL 해석 엔진 고도화.

---

## 🔗 Share Code (퍼즐 공유 코드)

Vibe Playground는 서버 없이 퍼즐을 공유할 수 있는 "Share Code" 기능을 제공합니다. 현재 제작 중인 퍼즐의 그래프 구조와 메타데이터를 압축된 텍스트 코드로 변환하여 쉽게 공유하고, 다른 사용자는 이 코드를 통해 동일한 퍼즐을 복원하여 플레이할 수 있습니다.

### 사용 방법

1.  **퍼즐 생성 및 복사:**
    -   "퍼즐 만들기" 탭에서 자연어로 그래프를 생성합니다.
    -   우측 패널 하단의 "Share & Load Puzzle" 섹션에서 "Copy Share Code" 버튼을 클릭합니다.
    -   현재 퍼즐의 해시 코드가 클립보드에 복사됩니다.

2.  **퍼즐 로드:**
    -   복사한 Share Code를 "Paste share code here..." 텍스트 영역에 붙여넣습니다.
    -   "Load from Code" 버튼을 클릭하면 해당 퍼즐이 로드됩니다.
    -   **URL을 통한 로드:** `http://localhost:5173/#<share_code>` 형식으로 URL에 직접 Share Code를 추가하여 접속하면, 앱이 시작될 때 자동으로 퍼즐을 로드합니다.

### 기술적 특징

-   **압축:** `lz-string` 라이브러리를 사용하여 퍼즐 데이터를 효율적으로 압축합니다.
-   **URL-Safe 인코딩:** 압축된 데이터를 Base64로 인코딩하여 URL에 포함될 수 있도록 합니다.
-   **데이터 무결성:** `CRC32` 체크섬을 포함하여 데이터 변조 여부를 간단하게 검증합니다.
-   **버전 관리:** `SHARE_SCHEMA_VERSION`을 통해 퍼즐 데이터 스키마의 호환성을 관리합니다. 버전 불일치 시 경고 메시지를 표시합니다.

### 보안 고려사항

Share Code는 퍼즐의 구조를 인코딩한 것이므로, 민감한 정보는 포함하지 않습니다. 그러나 공유된 코드를 통해 로드된 퍼즐은 사용자의 브라우저 환경에서 실행되므로, 신뢰할 수 있는 출처의 코드만 로드하는 것이 좋습니다.

---

## 🧠 Enhanced CNL & BFS/DFS Support (고도화된 CNL 및 BFS/DFS 지원)

Vibe Playground의 CNL(한국어 제약 자연어) 해석 엔진이 고도화되어, 더욱 자연스러운 한국어 표현으로 그래프를 제작하고 퍼즐 풀이 규칙을 설계할 수 있게 되었습니다. BFS(너비 우선 탐색) 및 DFS(깊이 우선 탐색)와 같은 알고리즘을 자연어로 직접 구현하고 시뮬레이션할 수 있습니다.

### 허용 표현 예시

**그래프 제작 (저자용 CNL):**
-   `노드 A, B 생성` (기존: `노드 A, B를 만든다.`) - 동의어, 어순, 조사 유연성
-   `A B 연결` (기존: `A에서 B로 간선을 잇는다.`) - 간결한 표현
-   `B와 C를 잇는 간선을 지나려면 열쇠가 필요하다` (기존: `B→C는 '열쇠'가 필요하다.`) - 자연스러운 문장 구조
-   `B에 열쇠가 있다` (기존: `B에 '열쇠'가 있다.`) - 간결한 표현

**퍼즐 풀이 (규칙 CNL):**
-   `큐에 X 추가` (기존: `큐에 X를 추가한다.`) - 동의어, 조사 유연성
-   `큐가 비어있지 않다면` (기존: `큐가 빌 때까지.`) - 조건 표현 유연성
-   `아직 방문하지 않았다면, 방문 표시를 한다, 이웃을 큐에 추가한다` - 복합 규칙 표현

### 파싱 실패 시 대체 표현 안내

만약 입력한 자연어 구문이 해석에 실패하면, 시스템은 가능한 대체 표현이나 구문 가이드를 제공하여 사용자가 규칙을 쉽게 수정할 수 있도록 돕습니다.

---

## 🚀 Getting Started (시작하기)

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/vibe-playground.git
    cd vibe-playground
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
