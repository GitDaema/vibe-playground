# Vibe Playground (바이브 플레이그라운드)

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss)](https://tailwindcss.com/)

A serverless sandbox web application for creating, sharing, and solving problems using natural language rules.
<br>
자연어 규칙을 사용하여 문제를 만들고, 공유하고, 해결하는 서버리스 샌드박스 웹 애플리케이션입니다.

---

## 🚀 About Vibe Playground (프로젝트 소개)

This project is a web-based application that allows users to create their own sandbox puzzles (Challenges) and share them with others via a simple hash code. Other users can then load these challenges and attempt to solve them by designing rules in natural language, which are then translated by an AI (Gemini) into a domain-specific language (DSL) to run in a simulation. All data is stored locally in the browser, requiring no server-side infrastructure.

본 프로젝트는 사용자가 직접 샌드박스형 퍼즐(Challenge)을 제작하고, 간단한 해시 코드를 통해 다른 사람과 공유할 수 있는 웹 애플리케이션입니다. 다른 사용자는 이 코드를 불러와, 자연어로 규칙을 설계하여 문제를 해결할 수 있습니다. 작성된 자연어 규칙은 AI(Gemini)를 통해 DSL(Domain-Specific Language)로 변환되어 시뮬레이션에서 실행됩니다. 모든 데이터는 브라우저에 로컬로 저장되어 서버가 필요 없습니다.

## ✨ Core Features (핵심 기능)

-   **Build Mode (문제 제작):** Edit graphs or physics-based worlds and set objectives and constraints.
-   **Share (문제 공유):** Generate a compressed, shareable hash code from the created challenge.
-   **Play Mode (문제 풀이):** Load a challenge from a hash code and write rules in natural language to solve it.
-   **Proof (해결 검증):** Automatically generate a 'Proof' code upon successful completion, allowing the solution to be replayed.

## 🛠️ Tech Stack (기술 스택)

-   **Frontend:** React, TypeScript
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS
-   **State Management:** Zustand
-   **Serialization:** LZ-String, Base64url, CRC32
-   **Storage:** LocalStorage
-   **Testing:** Vitest, Zod
-   **AI Collaboration:** Gemini CLI

## 📈 Project Status (프로젝트 현황)

This project is currently in the initial development phase.

**Completed Milestones:**
-   **Day 1:** Initial project setup with Vite, React, TypeScript, and Tailwind CSS.
-   **Day 2:** Implemented the core sandbox engine (`Engine`) with a deterministic RNG and the basic structure for the Domain-Specific Language (`DSL`) rule runner.

## 🚀 Getting Started (시작하기)

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/GitDaema/vibe-playground.git
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