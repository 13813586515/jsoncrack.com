import type { NodeData } from "jsoncrack-react";

export interface PredicateSearchResult {
  matchedNodeIds: Set<string>;
  matchedPaths: string[];
  highlightedNodeIds: Set<string>;
  connectedEdgeIds: Set<string>;
  dimmedNodeIds: Set<string>;
  query: string;
  isValid: boolean;
  error?: string;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}
