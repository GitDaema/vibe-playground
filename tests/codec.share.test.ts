import { describe, it, expect, vi } from 'vitest';
import { Graph } from '../src/graph/model';
import { encodePuzzle, decodePuzzle, SHARE_SCHEMA_VERSION } from '../src/codec/shareCode';
import { compressToBase64, decompressFromBase64 } from 'lz-string'; // Import for testing version mismatch
import { str as crc32 } from 'crc-32'; // Import crc32 for testing version mismatch

describe('Puzzle Sharing Codec', () => {
  it('should successfully perform a round-trip (encode -> decode)', () => {
    const originalGraph = new Graph(
      [{ id: 'A', x: 50, y: 50, tags: ['item:key'] }, { id: 'B', x: 150, y: 150 }],
      [{ id: 'e1', source: 'A', target: 'B', requiresItem: 'key' }],
      'A',
      'B'
    );

    const code = encodePuzzle(originalGraph, { author: 'tester' });
    const decoded = decodePuzzle(code);

    // Reconstruct the graph from decoded data
    const reconstructedGraph = new Graph(
      decoded.graph.nodes,
      decoded.graph.edges,
      decoded.graph.startNodeId,
      decoded.graph.goalNodeId
    );

    // Sort arrays for consistent comparison
    reconstructedGraph.nodes.sort((a, b) => a.id.localeCompare(b.id));
    originalGraph.nodes.sort((a, b) => a.id.localeCompare(b.id));
    reconstructedGraph.edges.sort((a, b) => a.id.localeCompare(b.id));
    originalGraph.edges.sort((a, b) => a.id.localeCompare(b.id));

    expect(decoded.v).toBe(SHARE_SCHEMA_VERSION);
    expect(decoded.meta?.author).toBe('tester');
    expect(reconstructedGraph).toEqual(originalGraph);
  });

  it('should fail decoding if the checksum is tampered with', () => {
    const graph = new Graph([ { id: 'A', x: 0, y: 0 }], [], 'A', 'A');
    const code = encodePuzzle(graph);
    
    // Tamper with the checksum
    const tamperedCode = `00000000.${code.split('.')[1]}`;

    expect(() => decodePuzzle(tamperedCode)).toThrow('Data integrity check failed');
  });

  it('should fail decoding if the data payload is tampered with', () => {
    const graph = new Graph([{ id: 'A', x: 0, y: 0 }], [], 'A', 'A');
    const code = encodePuzzle(graph);
    
    // Tamper with the data
    const tamperedCode = `${code.split('.')[0]}.tampered-data`;

    expect(() => decodePuzzle(tamperedCode)).toThrow('Data integrity check failed. The puzzle data may be corrupted or tampered with.');
  });

  it('should fail decoding with an invalid format', () => {
    const invalidCode = 'this-is-not-a-valid-code';
    expect(() => decodePuzzle(invalidCode)).toThrow('Invalid share code format');
  });

  it('should handle minimal graphs (single node)', () => {
    const minimalGraph = new Graph([{ id: 'lonely', x: 10, y: 10 }], [], 'lonely', 'lonely');
    const code = encodePuzzle(minimalGraph);
    const decoded = decodePuzzle(code);
    const reconstructedGraph = new Graph(
      decoded.graph.nodes,
      decoded.graph.edges,
      decoded.graph.startNodeId,
      decoded.graph.goalNodeId
    );
    expect(reconstructedGraph).toEqual(minimalGraph);
  });

  it('should handle graphs with no start or goal node', () => {
    const graph = new Graph([{ id: 'A', x: 1, y: 1 }, { id: 'B', x: 2, y: 2 }], [{id: 'e1', source: 'A', target: 'B'}]);
    const code = encodePuzzle(graph);
    const decoded = decodePuzzle(code);
    const reconstructedGraph = new Graph(
      decoded.graph.nodes,
      decoded.graph.edges,
      decoded.graph.startNodeId,
      decoded.graph.goalNodeId
    );
    expect(reconstructedGraph.startNodeId).toBeUndefined();
    expect(reconstructedGraph.goalNodeId).toBeUndefined();
    expect(reconstructedGraph.nodes.length).toBe(2);
  });

  it('should warn on version mismatch but still attempt to decode', () => {
    const graph = new Graph([{ id: 'A', x: 0, y: 0 }], [], 'A', 'A');
    const code = encodePuzzle(graph);
    const parts = code.split('.');
    const originalJson = decompressFromBase64(parts[1]);
    const oldVersionData = JSON.parse(originalJson);
    oldVersionData.v = 'v0'; // Simulate an older version
    const oldVersionJson = JSON.stringify(oldVersionData);
    const oldVersionCompressed = compressToBase64(oldVersionJson);
    const oldVersionChecksum = crc32(oldVersionCompressed).toString(16).padStart(8, '0');
    const oldVersionCode = `${oldVersionChecksum}.${oldVersionCompressed}`;

    // Mock console.warn to capture the warning
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const decoded = decodePuzzle(oldVersionCode);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Schema version mismatch: The provided code is version 'v0', but this app uses '${SHARE_SCHEMA_VERSION}'. Attempting to load anyway.`
    );
    expect(decoded.v).toBe('v0');

    consoleWarnSpy.mockRestore(); // Restore original console.warn
  });
});