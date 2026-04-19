import { create } from "zustand";
import type { JSONPath } from "jsonc-parser";
import type { NodeData, EdgeData, GraphData } from "jsoncrack-react";
import type { PredicateSearchResult, SearchHistoryItem } from "../../../../../../types/predicateSearch";

interface PredicateSearchState {
  isOpen: boolean;
  query: string;
  isValid: boolean;
  error: string | null;
  isSearching: boolean;
  result: PredicateSearchResult | null;
  history: SearchHistoryItem[];
  selectedMatchIndex: number;
  dimMode: "dim" | "collapse" | "none";
}

interface PredicateSearchActions {
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  executeSearch: (json: unknown, graphData: GraphData) => void;
  clearSearch: () => void;
  setSelectedMatchIndex: (index: number) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  setDimMode: (mode: "dim" | "collapse" | "none") => void;
  addToHistory: (query: string, resultCount: number) => void;
  clearHistory: () => void;
}

const initialState: PredicateSearchState = {
  isOpen: false,
  query: "",
  isValid: true,
  error: null,
  isSearching: false,
  result: null,
  history: [],
  selectedMatchIndex: 0,
  dimMode: "dim",
};

const pathToString = (path: JSONPath | undefined): string => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

const matchesPathPattern = (nodePath: JSONPath | undefined, matchedPaths: string[]): boolean => {
  if (!nodePath) return false;
  const nodePathStr = pathToString(nodePath);

  return matchedPaths.some(matchedPath => {
    if (matchedPath === nodePathStr) return true;
    if (nodePathStr.startsWith(matchedPath + "[")) return true;
    if (matchedPath.startsWith(nodePathStr + "[")) return true;
    return false;
  });
};

const findConnectedNodes = (
  startNodeIds: Set<string>,
  nodes: NodeData[],
  edges: EdgeData[]
): Set<string> => {
  const connected = new Set<string>(startNodeIds);
  let changed = true;

  while (changed) {
    changed = false;
    edges.forEach(edge => {
      if (connected.has(edge.from) && !connected.has(edge.to)) {
        connected.add(edge.to);
        changed = true;
      }
      if (connected.has(edge.to) && !connected.has(edge.from)) {
        connected.add(edge.from);
        changed = true;
      }
    });
  }

  return connected;
};

const findAllMatchingNodes = (
  nodes: NodeData[],
  edges: EdgeData[],
  matchedPaths: string[]
): { matchedNodeIds: Set<string>; connectedEdgeIds: Set<string> } => {
  const matchedNodeIds = new Set<string>();

  nodes.forEach(node => {
    if (matchesPathPattern(node.path, matchedPaths)) {
      matchedNodeIds.add(node.id);
    }
  });

  const connectedEdgeIds = new Set<string>();
  edges.forEach(edge => {
    if (matchedNodeIds.has(edge.from) && matchedNodeIds.has(edge.to)) {
      connectedEdgeIds.add(edge.id);
    }
  });

  return { matchedNodeIds, connectedEdgeIds };
};

const executeJsonPathQuery = (json: unknown, query: string): string[] => {
  try {
    const { JSONPath } = require("jsonpath-plus");

    const result: unknown[] = JSONPath({
      path: query,
      json,
      resultType: "all",
    });

    if (!result || result.length === 0) {
      return [];
    }

    const matchedPaths: string[] = [];

    result.forEach((item: unknown) => {
      if (item && typeof item === "object" && "path" in item) {
        const pathItems = (item as { path: (string | number)[] }).path;
        if (Array.isArray(pathItems)) {
          const segments = pathItems.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
          matchedPaths.push(`$[${segments.join("][")}]`);
        }
      }
    });

    return matchedPaths;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Invalid JSONPath expression");
  }
};

const usePredicateSearch = create<PredicateSearchState & PredicateSearchActions>()((set, get) => ({
  ...initialState,

  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false }),

  setQuery: query => set({ query }),

  executeSearch: (json, graphData) => {
    const { query } = get();
    if (!query.trim()) {
      set({
        result: null,
        isValid: true,
        error: null,
        isSearching: false,
      });
      return;
    }

    set({ isSearching: true });

    try {
      const matchedPaths = executeJsonPathQuery(json, query);

      const { matchedNodeIds, connectedEdgeIds } = findAllMatchingNodes(
        graphData.nodes,
        graphData.edges,
        matchedPaths
      );

      const allNodeIds = new Set(graphData.nodes.map(n => n.id));
      const dimmedNodeIds = new Set(
        [...allNodeIds].filter(id => !matchedNodeIds.has(id))
      );

      const result: PredicateSearchResult = {
        matchedNodeIds,
        matchedPaths,
        highlightedNodeIds: matchedNodeIds,
        connectedEdgeIds,
        dimmedNodeIds,
        query,
        isValid: true,
      };

      set({
        result,
        isValid: true,
        error: null,
        isSearching: false,
        selectedMatchIndex: 0,
      });

      if (matchedNodeIds.size > 0) {
        get().addToHistory(query, matchedNodeIds.size);
      }
    } catch (error) {
      set({
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid query",
        isSearching: false,
        result: null,
      });
    }
  },

  clearSearch: () => {
    set({
      query: "",
      result: null,
      isValid: true,
      error: null,
      selectedMatchIndex: 0,
    });
  },

  setSelectedMatchIndex: index => set({ selectedMatchIndex: index }),

  nextMatch: () => {
    const { result, selectedMatchIndex } = get();
    if (!result) return;
    const total = result.matchedNodeIds.size;
    if (total === 0) return;
    set({ selectedMatchIndex: (selectedMatchIndex + 1) % total });
  },

  prevMatch: () => {
    const { result, selectedMatchIndex } = get();
    if (!result) return;
    const total = result.matchedNodeIds.size;
    if (total === 0) return;
    set({ selectedMatchIndex: (selectedMatchIndex - 1 + total) % total });
  },

  setDimMode: mode => set({ dimMode: mode }),

  addToHistory: (query, resultCount) => {
    const { history } = get();
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
    };

    const filteredHistory = history.filter(h => h.query !== query);
    set({
      history: [newItem, ...filteredHistory].slice(0, 20),
    });
  },

  clearHistory: () => set({ history: [] }),
}));

export default usePredicateSearch;
