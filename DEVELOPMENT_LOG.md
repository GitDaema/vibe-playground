# 개발 일지

## 프로젝트 개요
- **프로젝트명**: 바이브 플레이그라운드
- **목표**: Gemini CLI를 활용한 서버 없는 샌드박스형 문제 제작, 공유, 풀이 웹 애플리케이션 개발
- **개발 기간**: 2025.10.20 ~ 2025.10.27

---

## 개발 과정

### Day 1 - 환경 세팅 및 codec 모듈 구현

#### GEMINI CLI 사용 프롬프트

- **역할**: Day 1 페어 프로그래밍 어시스턴트.
- **목표**: '서버 없는 샌드박스형 문제 제작·공유·풀이 웹앱'의 1일차 개발 수행.
- **작업 단계**:
    1. Vite + React + TypeScript + Tailwind 초기 세팅 명령어 제시.
    2. `src/`, `public/`, `tests/` 기본 폴더 생성 스크립트.
    3. `App.tsx`, `main.tsx`, `routes.tsx`의 기본 스텁 생성.
    4. `codec/shareCode.ts` 구현 (Base64url + LZ 압축 + CRC32 검증)
    5. `tests/codec.test.ts` 작성 (encode/decode roundtrip 테스트)
    6. `README.md`에 ‘Day 1 완료’ 상태 요약 추가.
- **출력 형식**:
    1. 각 파일의 상대경로와 코드 전문
    2. 실행 명령어 (pnpm 기준)
    3. 커밋 메시지 제안 (Conventional Commit 1~2줄)
    4. AI 관여 표시: `[ai-assist]`

[Day 1 Gemini 전체 대화 로그 보기](./gemini_cli_logs/Day1-Log.md)

#### 프롬프트 적용 결과
- 스펙에 명시된 초기 개발 환경 구축
- 기본 스텁 생성 및 홈페이지 텍스트 출력
- 문제 데이터 인코딩 및 디코딩을 위한 `shareCode` 모듈 구현 (서버 대체용 공유 코드 생성기)
- `shareCode` 모듈의 왕복, 무결성, 형식 검증 테스트 완료

#### 문제 및 해결 과정
1.  **MCP를 이용한 github 연동 과정에서 Gemini CLI 접근 권한 문제 발생**
    -   토큰 생성 후 `.gemini/settings.json`에 명시하여 해결
2.  **푸시 과정에서 보안 문제 발생**
    -   보안에 민감한 토큰이 포함된 `.gemini/settings.json`에 대해 `.gitignore` 업데이트 및 추적 제거
3.  **추적 제거 후에도 이전 커밋에 포함된 토큰으로 인한 푸시 보안 문제 해결 실패**
    -   수동으로 깃 저장소 초기화 후 재커밋 요청

#### 학습 내용
- 프롬프트를 큰 틀과 작은 틀로 분할하여 접근하는 기법 활용 및 효율성을 확인.
- MCP는 LLM이 외부와의 표준 통신을 돕는 서버일 뿐, 권한과 보안 측면에서 위험성이 존재하다는 점을 이해.
- Gemini CLI로 생성된 인코딩과 디코딩 함수를 분석하여 직렬화, 압축, 복원 과정의 중요성 학습.

---

### Day 2 - 환경 세팅 및 codec 모듈 구현

#### GEMINI CLI 사용 프롬프트

- **역할**: Day 2 페어 프로그래밍 어시스턴트.  
- **목표**: ‘서버 없는 샌드박스형 문제 제작·공유·풀이 웹앱’의 **엔진(Core)** & **DSL(Runtime)** 2일차 개발 수행.  

- **작업 단계**:  
    1. `src/core/engine.ts` 생성 — 결정론적 RNG(mulberry32) + tick 기반 `Engine` 클래스 스텁  
        - **API**: `constructor(seed?: number)`, `update(dt:number)`, `pause()`, `resume()`, `reset()`, `getState()`  
        - **기능**: running일 때만 time 누적, seed 변경 시 RNG 재생성 가능 구조  
        - **커밋**: `feat(core): add deterministic RNG and Engine skeleton [ai-assist]`  

    2. `tests/engine.test.ts` 작성 — RNG 일관성 & tick 누적 동작 1차 검증  
        - 동일 seed 재현성, update 누적, pause/resume, reset 기본 시나리오  
        - **커밋**: `test(core): add engine RNG and tick behavior tests [ai-assist]`  

    3. `src/core/dsl.ts` 생성 — 최소한의 규칙 실행기(조건/액션) 스펙 정의  
        - **타입**:  
          ```ts
          export interface Rule {  
            event: string;  
            condition?: (state:any)=>boolean;  
            action:(state:any, params?:any)=>void;  
            params?:Record<string,any>;  
          }  
          export function runRule(rule: Rule, state: any): any  
          ```  
        - condition 없거나 true → action(state, params) 실행 후 state 반환  
        - **커밋**: `feat(core): implement minimal DSL Rule and runRule [ai-assist]`  

    4. `tests/dsl.test.ts` 작성 — DSL 규칙 실행 검증  
        - 조건 없음 / 불일치 / 일치, state 변경 반영, params 전달  
        - **커밋**: `test(core): cover DSL rule execution and condition filtering [ai-assist]`  

    5. 엔진×DSL 통합 지점 스텁(확장 포인트만)  
        - `src/core/index.ts`에 재노출(`export * from './engine'; export * from './dsl';`)  
        - `src/challenge/schema.ts` 스텁(향후 JSON 룰 매핑용 인터페이스 초안만)  
        - **커밋**: `chore(core): re-export core modules and add challenge schema stub [ai-assist]`  

    6. 문서 업데이트  
        - `GEMINI.md`에 "Day2 엔진/DSL 협업 프롬프트 패턴" 추가(프롬프트 요약, 생성물, 테스트 방법)  
        - `README.md`에 "엔진·DSL 모듈 초안 완성(테스트 통과)" 한 줄 추가  
        - **커밋**: `docs: update GEMINI.md and README for Day2 engine/DSL scope [ai-assist]`  

- **실행 명령어 (pnpm 기준)**:  
    - 테스트 실행: `pnpm test` (또는 `pnpm vitest run --coverage`)  
    - 타입 체크: `pnpm tsc -p .`  
    - 포맷/린트(있다면): `pnpm lint && pnpm format`  

- **출력 형식**:  
    1. 각 파일의 상대경로와 코드 전문  
        - `src/core/engine.ts`  
        - `tests/engine.test.ts`  
        - `src/core/dsl.ts`  
        - `tests/dsl.test.ts`  
        - `src/core/index.ts`  
        - `src/challenge/schema.ts` (스텁)  
        - `GEMINI.md` 변경 diff 또는 섹션 전문  
        - `README.md` 변경 diff 또는 문장 추가  
    2. 실행/검증 명령어 (위 pnpm 명령 포함)  
    3. 커밋 메시지 제안 (Conventional Commit 1~2줄, 단계별 1커밋)  
    4. AI 관여 표시: `[ai-assist]`  

- **검증 기준(자동/수동 혼합 체크를 염두)**:  
    - 동일 seed에서 RNG 시퀀스 동일  
    - `Engine.update(dt)`가 running=true일 때만 time 누적  
    - pause/resume/reset 시나리오가 테스트 통과  
    - DSL: condition 미지정/true 시 action 수행, false 시 skip, state 반영 확인  
    - Day2 결과가 `README.md`/`GEMINI.md`에 반영됨  

- **비고(스케줄 가드)**:  
    - Day3에서 "JSON DSL 스키마 ↔ Rule 바인딩 + UI(빌더/플레이어) 이벤트 훅"으로 확장 예정이므로, Day2에서는 **엔진/DSL 최소 기능 완성과 테스트 통과**에 집중.  
    - 불필요한 옵티마이즈/리팩토링은 Day4로 이월.  

[Day 2 Gemini 전체 대화 로그 보기](./gemini_cli_logs/Day2-Log.md)

#### 프롬프트 적용 결과
- 결정론적 RNG(mulberry32)와 tick 기반 `Engine` 추가 (`src/core/engine.ts`)
- 최소 규칙 실행용 DSL 러너 초안 구현 (`src/core/dsl.ts`)
- 코어 재노출 및 챌린지 스키마 스텁 추가 (`src/core/index.ts`, `src/challenge/schema.ts`)
- 엔진/DSL 동작 검증 테스트 작성 및 통과 (`tests/engine.test.ts`, `tests/dsl.test.ts`)

#### 문제 및 해결 과정
1.  **엔진의 시간 갱신 `update(dt)` 엣지 케이스 발견 및 수정**
    - AI 초안: `running`일 때 `time += dt` (검증/가드 부재)
    - 수정: `Number.isFinite(dt)`가 아니거나 `dt < 0`이면 갱신 중단 처리 추가
    - 테스트 보강: `-1.0`과 `0.0` 입력에서 시간이 증가하지 않는지 확인
    - 근거: 결정론적 시뮬레이션에서 음수·무한 `dt` 허용 시 시간 역행/NaN 전파로 상태 오염 위험

2.  **DSL 설계의 타입 안정성 강화**
    - AI 초안: 상태/파라미터에 범용 타입 any 사용 제안
    - 수정: `Rule<TState, TParams>` 제네릭으로 상태/파라미터를 강타입화, `action(state, params)` 시그니처 고정
    - 테스트 보강: 
      - 조건 없음/불일치/일치 분기별 액션 호출 검증
      - `params` 전달 및 상태 변경 반영 확인
    - 효과: 규칙 작성 시 IDE 인텔리센스와 타입 오류 조기 발견
    - 근거: any는 타입 오류가 컴파일 과정을 통과하고 런타임 에러의 원인이 되므로 지양해야 함

3.  **스텁 테스트 파일 내 unknown 타입 추론 오류**
    - 문제 해결 방법: Gemini CLI의 빌트인 MCP인 files를 이용해 `@파일 이름` 형식으로 수정 요청
    - 원인: 제네릭으로 변경된 Rule 타입에 기본값인 unknown이 특정 파라미터의 타입 추론에 영향
    - 수정: 함께 사용할 state 타입을 제네릭으로 명시

#### 학습 내용
- any 타입을 남용하는 예시처럼 AI는 당장의 구현 목표 달성에만 특화되어 있으므로 검토 필수.
- 엔진과 DSL을 스텁 형태로 구분하면 잦은 정책 변경에도 엔진의 안정성을 확보하며 독립적인 개발이 가능.
- files:// MCP를 이용해 @로 파일에 접근하면 명시적 컨텍스트로 인식해 정확도 상승.

### Day 3