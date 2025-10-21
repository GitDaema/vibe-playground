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

프로젝트 방향이 **그래프 퍼즐 샌드박스**로 재정립되었습니다. 현재 Day3 개발 단계에 있습니다.

**Completed Milestones:**
-   **Day 1:** Vite, React, TypeScript, Tailwind CSS 초기 프로젝트 환경 설정.
-   **Day 2:** 결정론적 시뮬레이션을 위한 코어 엔진(`Engine`) 및 DSL(`Rule`) 실행기 초안 구현.

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
