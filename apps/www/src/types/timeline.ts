import type { NodeData, EdgeData } from "jsoncrack-react";

export interface TimelineSnapshot {
  id: string;
  timestamp: number;
  label: string;
  json: string;
  nodeCount: number;
  edgeCount: number;
  source: "paste" | "import" | "manual" | "auto";
  diff: {
    addedNodes: string[];
    removedNodes: string[];
    modifiedNodes: string[];
    addedEdges: string[];
    removedEdges: string[];
  };
}

export interface TimelineState {
  snapshots: TimelineSnapshot[];
  currentIndex: number;
  isPlaying: boolean;
  playSpeed: number;
  isOpen: boolean;
  isRecording: boolean;
  autoRecordThreshold: number;
}

export interface TimelineActions {
  addSnapshot: (json: string, source?: TimelineSnapshot["source"], label?: string) => void;
  removeSnapshot: (id: string) => void;
  clearAll: () => void;
  setCurrentIndex: (index: number) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  togglePlay: () => void;
  setPlaySpeed: (speed: number) => void;
  toggleOpen: () => void;
  toggleRecording: () => void;
  setAutoRecordThreshold: (threshold: number) => void;
  updateSnapshotLabel: (id: string, label: string) => void;
}

export const computeDiff = (
  prevJson: string | null,
  currentJson: string
): TimelineSnapshot["diff"] => {
  const defaultDiff = {
    addedNodes: [],
    removedNodes: [],
    modifiedNodes: [],
    addedEdges: [],
    removedEdges: [],
  };

  if (!prevJson) return defaultDiff;

  try {
    const prev = JSON.parse(prevJson);
    const current = JSON.parse(currentJson);

    const getPaths = (obj: unknown, prefix = "$"): string[] => {
      const paths: string[] = [prefix];

      if (obj !== null && typeof obj === "object") {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            paths.push(...getPaths(item, `${prefix}[${index}]`));
          });
        } else {
          Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
            paths.push(...getPaths(value, `${prefix}["${key}"]`));
          });
        }
      }

      return paths;
    };

    const prevPaths = new Set(getPaths(prev));
    const currentPaths = new Set(getPaths(current));

    const addedNodes: string[] = [];
    const removedNodes: string[] = [];
    const modifiedNodes: string[] = [];

    currentPaths.forEach(path => {
      if (!prevPaths.has(path)) {
        addedNodes.push(path);
      } else {
        try {
          const { JSONPath } = require("jsonpath-plus");
          const prevValue = JSONPath({ path: path, json: prev, wrap: false });
          const currentValue = JSONPath({ path: path, json: current, wrap: false });
          if (JSON.stringify(prevValue) !== JSON.stringify(currentValue)) {
            modifiedNodes.push(path);
          }
        } catch {
          // Ignore errors
        }
      }
    });

    prevPaths.forEach(path => {
      if (!currentPaths.has(path)) {
        removedNodes.push(path);
      }
    });

    return {
      ...defaultDiff,
      addedNodes,
      removedNodes,
      modifiedNodes,
    };
  } catch {
    return defaultDiff;
  }
};
