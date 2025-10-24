import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { str as crc32 } from 'crc-32';
import { Graph } from '../graph/model';

/**
 * Share Code Schema Version.
 * v1: Initial schema.
 */
export const SHARE_SCHEMA_VERSION = 'v1';

/**
 * Defines the data structure for a shareable puzzle.
 * This structure is serialized to a compact, URL-friendly string.
 */
export interface ShareablePuzzle {
  v: string; // Schema version for compatibility.
  graph: {
    nodes: { id: string; x: number; y: number; tags?: string[] }[];
    edges: { id: string; source: string; target: string; requiresItem?: string }[];
    startNodeId?: string;
    goalNodeId?: string;
  };
  meta?: {
    author?: string;
    createdAt?: string;
    desc?: string;
  };
}

/**
 * Sanitizes and prepares the graph data for serialization.
 * It sorts keys and arrays to ensure consistent output for the same graph.
 * @param graph The Graph instance to process.
 * @param meta Optional metadata for the puzzle.
 * @returns A stable, serializable object.
 */
const toSerializableObject = (graph: Graph, meta?: ShareablePuzzle['meta']): ShareablePuzzle => {
  // Sort nodes and edges by ID for consistent JSON output
  const sortedNodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const sortedEdges = [...graph.edges].sort((a, b) => a.id.localeCompare(b.id));

  return {
    v: SHARE_SCHEMA_VERSION,
    graph: {
      nodes: sortedNodes.map(({ id, x, y, tags }) => ({ id, x, y, ...(tags && { tags }) })),
      edges: sortedEdges.map(({ id, source, target, requiresItem }) => ({
        id,
        source,
        target,
        ...(requiresItem && { requiresItem }),
      })),
      startNodeId: graph.startNodeId,
      goalNodeId: graph.goalNodeId,
    },
    ...(meta && { meta }),
  };
};

/**
 * Encodes a puzzle graph and metadata into a compact, URL-friendly "hash slug".
 * The process: Graph -> JSON -> LZ-String (Base64) -> CRC32 Checksum.
 * @param graph The Graph instance to encode.
 * @param meta Optional metadata.
 * @returns The encoded share code.
 */
export const encodePuzzle = (graph: Graph, meta?: ShareablePuzzle['meta']): string => {
  const serializableObject = toSerializableObject(graph, meta);
  const json = JSON.stringify(serializableObject);

  // Using compressToBase64 for a more URL-friendly character set.
  const compressed = compressToBase64(json);
  
  // CRC32 checksum for basic data integrity.
  const checksum = crc32(compressed).toString(16).padStart(8, '0');

  // Format: <checksum>.<compressed_data>
  return `${checksum}.${compressed}`;
};

/**
 * Decodes a "hash slug" back into a puzzle data structure.
 * It validates the format, checksum, and essential data structure.
 * @param code The share code to decode.
 * @returns The decoded puzzle data.
 * @throws If the code is invalid, corrupted, or fails to parse.
 */
export const decodePuzzle = (code: string): ShareablePuzzle => {
  const parts = code.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid share code format. Expected <checksum>.<data>.');
  }
  const [checksum, compressed] = parts;

  const calculatedChecksum = crc32(compressed).toString(16).padStart(8, '0');
  if (checksum !== calculatedChecksum) {
    throw new Error('Data integrity check failed. The puzzle data may be corrupted or tampered with.');
  }

  const json = decompressFromBase64(compressed);
  if (!json) {
    throw new Error('Failed to decompress puzzle data. The code may be invalid.');
  }

  const data = JSON.parse(json) as ShareablePuzzle;

  // Basic structural validation
  if (!data.v || !data.graph || !Array.isArray(data.graph.nodes) || !Array.isArray(data.graph.edges)) {
    throw new Error('Invalid puzzle data structure: missing essential fields (v, graph, nodes, edges).');
  }
  
  if (data.v !== SHARE_SCHEMA_VERSION) {
    // For now, we'll just warn. In the future, we might handle migrations.
    console.warn(`Schema version mismatch: The provided code is version '${data.v}', but this app uses '${SHARE_SCHEMA_VERSION}'. Attempting to load anyway.`);
  }

  return data;
};
