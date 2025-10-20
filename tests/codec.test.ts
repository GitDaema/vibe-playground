import { describe, it, expect } from 'vitest';
import { encode, decode } from '../src/codec/shareCode';

describe('shareCode codec', () => {
  const testData = {
    message: 'Hello Vibe Playground!',
    version: 1.0,
    settings: {
      isPublic: true,
      nodes: [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 100, y: 100 },
      ],
    },
  };

  it('should encode and decode an object without data loss (roundtrip)', () => {
    const encoded = encode(testData);
    const decoded = decode(encoded);
    expect(decoded).toEqual(testData);
  });

  it('should throw an error if the decoded data is corrupted (integrity check)', () => {
    const encoded = encode(testData);
    // 데이터의 일부를 의도적으로 손상시킴
    const tamperedCode = encoded.substring(0, encoded.length - 5) + 'xxxxx';
    
    // 손상된 코드를 디코딩할 때 에러가 발생하는지 확인
    expect(() => decode(tamperedCode)).toThrow('Data integrity check failed');
  });

  it('should throw an error for a completely invalid code format', () => {
    const invalidCode = 'this-is-just-a-random-string';
    
    // 유효하지 않은 형식의 코드를 디코딩할 때 에러가 발생하는지 확인
    expect(() => decode(invalidCode)).toThrow();
  });
});
