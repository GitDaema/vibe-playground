/**
 * CNL 파싱을 위한 동의어 및 키워드 사전.
 */

// 동사 및 액션 관련 동의어
export const VERBS = {
  CONNECT: ['연결', '잇다', '이어', '연결해', '이어줘', '연결시켜'],
  CREATE: ['생성', '추가', '만들어', '만든다'],
  REQUIRE: ['필요', '필요하다', '있어야', '갖고', '가지고', '있으면'],
  PLACE: ['있다', '놓여 있다', '배치'],
  ADD_TO_QUEUE: ['큐에 추가', '큐에 넣어'],
  POP_FROM_QUEUE: ['큐에서 꺼내', '큐에서 다음'],
  ADD_TO_STACK: ['스택에 추가', '스택에 넣어'],
  POP_FROM_STACK: ['스택에서 빼', '스택에서 다음'],
  MARK_VISITED: ['방문 표시'],
  ENQUEUE_NEIGHBORS: ['이웃을 큐에 추가', '이웃을 큐에 넣어'],
  ENQUEUE_NEIGHBORS_STACK: ['이웃을 스택에 추가', '이웃을 스택에 넣어'],
};

// 명사 및 엔티티 관련 동의어
export const NOUNS = {
  NODE: ['노드', '점'],
  EDGE: ['간선', '엣지', '링크', '선'],
  ITEM: ['열쇠', '키', '아이템'],
  START: ['시작', '출발'],
  GOAL: ['목표', '도착'],
};

// 조건 및 접속사
export const CONJUNCTIONS = {
  AND: ['그리고', '및', '하고', '랑', '와', '과'],
  IF: ['만약', '라면'],
  UNTIL: ['때까지'],
};

// 조사 (제거 대상)
export const PARTICLES = {
  SUBJECT: ['은', '는', '이', '가'],
  OBJECT: ['을', '를'],
  LOCATION: ['에', '에서'],
  INSTRUMENT: ['로', '으로'],
};
