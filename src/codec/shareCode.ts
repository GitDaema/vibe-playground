import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { crc32 } from 'crc';

const SEPARATOR = '.';

// Base64url 인코딩/디코딩 헬퍼 함수
function toBase64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(input: string): string {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  while (input.length % 4) {
    input += '=';
  }
  return atob(input);
}

/**
 * 객체를 압축하고 체크섬을 포함하는 공유 코드로 인코딩합니다.
 * @param data 인코딩할 객체
 * @returns Base64url로 인코딩된 공유 코드
 */
export function encode(data: unknown): string {
  const jsonString = JSON.stringify(data);
  const compressed = compressToEncodedURIComponent(jsonString);
  const checksum = crc32(jsonString).toString(16).padStart(8, '0');
  
  const payload = [compressed, checksum].join(SEPARATOR);
  
  return toBase64url(payload);
}

/**
 * 공유 코드를 디코딩하여 원본 객체로 복원하고 무결성을 검증합니다.
 * @param code 디코딩할 공유 코드
 * @returns 복원된 객체
 * @throws 데이터가 변조되었거나 형식이 잘못된 경우 에러 발생
 */
export function decode<T>(code: string): T {
  const payload = fromBase64url(code);
  const parts = payload.split(SEPARATOR);

  if (parts.length !== 2) {
    throw new Error('Invalid share code format.');
  }

  const [compressed, checksum] = parts;
  const jsonString = decompressFromEncodedURIComponent(compressed);

  if (!jsonString) {
    throw new Error('Failed to decompress data.');
  }

  const calculatedChecksum = crc32(jsonString).toString(16).padStart(8, '0');

  if (calculatedChecksum !== checksum) {
    throw new Error('Data integrity check failed. The code may be corrupted.');
  }

  return JSON.parse(jsonString) as T;
}