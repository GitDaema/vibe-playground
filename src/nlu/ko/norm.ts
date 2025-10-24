import { VERBS, NOUNS, PARTICLES, CONJUNCTIONS } from './dict';

/**
 * 텍스트를 표준 형식으로 정규화합니다.
 * - 다중 공백을 단일 공백으로 변경
 * - 문장 부호(쉼표, 마침표) 주변 공백 정리
 * - 불필요한 조사 제거
 * - 동의어를 대표 키워드로 치환
 * @param text 입력 텍스트
 * @returns 정규화된 텍스트
 */
export function normalizeText(text: string): string {
  let normalized = text.trim().replace(/\s+/g, ' ');

  // 동의어 치환 (가장 긴 단어부터 매칭하여 오류 방지)
  const allVerbs = Object.entries(VERBS).flatMap(([key, synonyms]) =>
    synonyms.map(synonym => ({ key, synonym }))
  ).sort((a, b) => b.synonym.length - a.synonym.length);

  for (const { key, synonym } of allVerbs) {
    // 동의어를 대표 키워드로 치환 (단순 포함치환)
    normalized = normalized.replace(new RegExp(synonym, 'g'), ` ${key} `);
  }

  // 조사 제거 (토큰 경계 + 문장부호/공백/문장끝 기준)
  const allParticles = Object.values(PARTICLES).flat();
  for (const particle of allParticles) {
    // 1) 독립 토큰 형태: " 단어 를 " → 공백으로 축약
    normalized = normalized.replace(new RegExp(`\\s*${particle}\\s+`, 'g'), ' ');
    // 2) 어말 첨가 형태: "D를." / "D를," / "D를"(문장끝)
    normalized = normalized.replace(new RegExp(`(${particle})(?=\\s|$|[.,!?])`, 'g'), '');
  }

  // 알파뉴메릭 뒤에 붙은 조사를 제거 (최종 보정)
  normalized = normalized.replace(/\b([A-Za-z0-9]+)(?:은|는|이|가|을|를|에|에서|로|으로)(?=\s|$|[.,!?])/g, '$1');

  return normalized.trim().replace(/\s+/g, ' ');
}

/**
 * 쉼표, 공백, 접속사로 구분된 문자열을 토큰 배열로 분리합니다.
 * 예: "A, B C 그리고 D" -> ["A", "B", "C", "D"]
 * @param text 입력 텍스트
 * @returns 토큰 배열
 */
export function tokenizeList(text: string): string[] {
  const delimiters = [ ',', ' ', ...CONJUNCTIONS.AND ];
  const regex = new RegExp(delimiters.join('|'), 'g');
  return text
    .split(regex)
    .map(s => s.trim())
    .map(s => s.replace(/(?:은|는|이|가|을|를|에|에서|로|으로)$/u, '')) // 토큰 말미의 조사 제거
    .filter(s => s.length > 0);
}

/**
 * 노드 ID를 표준 형식(대문자)으로 변환합니다.
 * @param s 입력 문자열
 * @returns 표준화된 노드 ID
 */
export function normalizeNodeId(s: string): string {
  return s.trim().toUpperCase();
}
