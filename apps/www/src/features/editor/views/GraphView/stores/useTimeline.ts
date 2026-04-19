import { create } from "zustand";
import type { TimelineSnapshot, TimelineState, TimelineActions } from "../../../../../types/timeline";
import { computeDiff } from "../../../../../types/timeline";
import useFile from "../../../../../store/useFile";

let snapshotIdCounter = 1;
const generateSnapshotId = () => `snapshot-${snapshotIdCounter++}`;

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const initialState: TimelineState = {
  snapshots: [],
  currentIndex: -1,
  isPlaying: false,
  playSpeed: 1000,
  isOpen: false,
  isRecording: true,
  autoRecordThreshold: 500,
};

let playInterval: ReturnType<typeof setInterval> | null = null;

const useTimeline = create<TimelineState & TimelineActions>()((set, get) => ({
  ...initialState,

  addSnapshot: (json, source = "manual", label) => {
    const { snapshots, currentIndex } = get();

    const lastSnapshot = snapshots[snapshots.length - 1];

    if (lastSnapshot && lastSnapshot.json === json) {
      return;
    }

    const diff = computeDiff(lastSnapshot?.json || null, json);

    const parsedJson = JSON.parse(json);
    const nodeCount = countNodes(parsedJson);
    const edgeCount = countEdges(parsedJson);

    const newSnapshot: TimelineSnapshot = {
      id: generateSnapshotId(),
      timestamp: Date.now(),
      label: label || `Snapshot ${snapshots.length + 1} (${formatTime(Date.now())})`,
      json,
      nodeCount,
      edgeCount,
      source,
      diff,
    };

    const newIndex = snapshots.length;

    set({
      snapshots: [...snapshots, newSnapshot],
      currentIndex: currentIndex === -1 ? newIndex : currentIndex,
    });
  },

  removeSnapshot: id => {
    const { snapshots, currentIndex } = get();
    const index = snapshots.findIndex(s => s.id === id);

    if (index === -1) return;

    const newSnapshots = snapshots.filter(s => s.id !== id);
    let newIndex = currentIndex;

    if (index === currentIndex) {
      newIndex = Math.min(index, newSnapshots.length - 1);
    } else if (index < currentIndex) {
      newIndex = currentIndex - 1;
    }

    set({
      snapshots: newSnapshots,
      currentIndex: newSnapshots.length > 0 ? Math.max(0, newIndex) : -1,
    });
  },

  clearAll: () => {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    set({
      snapshots: [],
      currentIndex: -1,
      isPlaying: false,
    });
  },

  setCurrentIndex: index => {
    const { snapshots } = get();
    if (index < 0 || index >= snapshots.length) return;

    const snapshot = snapshots[index];
    if (snapshot) {
      useFile.getState().setContents({
        contents: snapshot.json,
        hasChanges: false,
      });
    }

    set({ currentIndex: index });
  },

  goToPrevious: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      get().setCurrentIndex(currentIndex - 1);
    }
  },

  goToNext: () => {
    const { currentIndex, snapshots } = get();
    if (currentIndex < snapshots.length - 1) {
      get().setCurrentIndex(currentIndex + 1);
    }
  },

  togglePlay: () => {
    const { isPlaying, snapshots, currentIndex, playSpeed } = get();

    if (isPlaying) {
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
      set({ isPlaying: false });
    } else {
      if (snapshots.length < 2) return;

      let current = currentIndex;
      if (current >= snapshots.length - 1) {
        current = 0;
        get().setCurrentIndex(0);
      }

      playInterval = setInterval(() => {
        const state = get();
        if (!state.isPlaying) {
          if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
          }
          return;
        }

        const nextIndex = state.currentIndex + 1;
        if (nextIndex >= state.snapshots.length) {
          if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
          }
          set({ isPlaying: false });
          return;
        }

        state.setCurrentIndex(nextIndex);
      }, playSpeed);

      set({ isPlaying: true });
    }
  },

  setPlaySpeed: speed => set({ playSpeed: speed }),

  toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),

  toggleRecording: () => set(state => ({ isRecording: !state.isRecording })),

  setAutoRecordThreshold: threshold => set({ autoRecordThreshold: threshold }),

  updateSnapshotLabel: (id, label) => {
    set(state => ({
      snapshots: state.snapshots.map(s => (s.id === id ? { ...s, label } : s)),
    }));
  },
}));

function countNodes(obj: unknown): number {
  if (obj === null || typeof obj !== "object") {
    return 1;
  }

  if (Array.isArray(obj)) {
    return 1 + obj.reduce((sum, item) => sum + countNodes(item), 0);
  }

  const objRecord = obj as Record<string, unknown>;
  return (
    1 +
    Object.values(objRecord).reduce((sum, value) => sum + countNodes(value), 0)
  );
}

function countEdges(obj: unknown): number {
  if (obj === null || typeof obj !== "object") {
    return 0;
  }

  if (Array.isArray(obj)) {
    return (
      obj.length + obj.reduce((sum, item) => sum + countEdges(item), 0)
    );
  }

  const objRecord = obj as Record<string, unknown>;
  const keys = Object.keys(objRecord);
  return (
    keys.length +
    Object.values(objRecord).reduce((sum, value) => sum + countEdges(value), 0)
  );
}

export default useTimeline;
