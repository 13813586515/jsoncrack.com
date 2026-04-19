import React from "react";
import {
  Box,
  Group,
  ActionIcon,
  Tooltip,
  Text,
  Badge,
  Slider,
  Select,
  Button,
  Menu,
  Divider,
  ScrollArea,
  Stack,
  Popover,
} from "@mantine/core";
import styled from "styled-components";
import {
  AiOutlinePlayCircle,
  AiOutlinePauseCircle,
  AiOutlineStepBackward,
  AiOutlineStepForward,
  AiOutlineDelete,
  AiOutlineClockCircle,
  AiOutlinePlus,
} from "react-icons/ai";
import {
  LuSettings,
  LuTrash2,
  LuPlus,
  LuPlay,
  LuPause,
  LuChevronLeft,
  LuChevronRight,
  LuEdit3,
} from "react-icons/lu";
import { VscDiffAdded, VscDiffRemoved, VscDiffModified } from "react-icons/vsc";
import { event as gaEvent } from "nextjs-google-analytics";
import type { TimelineSnapshot } from "../../../../types/timeline";
import useTimeline from "./stores/useTimeline";
import useFile from "../../../../store/useFile";

const StyledTimelineWrapper = styled(Box)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  border-top: 1px solid ${({ theme }) => theme.BORDER};
  z-index: 100;
  transition: transform 200ms ease;
`;

const StyledTimelineHeader = styled(Group)`
  padding: 8px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.BORDER};
  justify-content: space-between;
  align-items: center;
`;

const StyledTimelineContent = styled(Box)`
  padding: 12px 16px;
  max-height: 180px;
`;

const StyledSnapshotMarker = styled(Box)<{
  $active: boolean;
  $hasChanges: boolean;
}>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ theme, $active, $hasChanges }) => {
    if ($active) return "#3b82f6";
    if ($hasChanges) return "#22c55e";
    return theme.BORDER;
  }};
  border: 2px solid
    ${({ theme, $active }) => ($active ? "#3b82f6" : theme.BORDER)};
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    transform: scale(1.2);
    background: ${({ $active }) => ($active ? "#2563eb" : "#3b82f6")};
  }
`;

const StyledMarkerContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  top: -6px;
  left: 0;
  right: 0;
  pointer-events: none;
`;

const StyledSliderWrapper = styled(Box)`
  position: relative;
  padding-top: 20px;
`;

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

interface SnapshotPopoverProps {
  snapshot: TimelineSnapshot;
  index: number;
  isActive: boolean;
}

const SnapshotPopover: React.FC<SnapshotPopoverProps> = ({
  snapshot,
  index,
  isActive,
}) => {
  const { setCurrentIndex, removeSnapshot, updateSnapshotLabel } = useTimeline();
  const [editingLabel, setEditingLabel] = React.useState(false);
  const [labelValue, setLabelValue] = React.useState(snapshot.label);

  const hasChanges =
    snapshot.diff.addedNodes.length > 0 ||
    snapshot.diff.removedNodes.length > 0 ||
    snapshot.diff.modifiedNodes.length > 0;

  const handleSaveLabel = () => {
    updateSnapshotLabel(snapshot.id, labelValue);
    setEditingLabel(false);
  };

  return (
    <Popover shadow="md" width={280} position="top">
      <Popover.Target>
        <StyledSnapshotMarker
          $active={isActive}
          $hasChanges={hasChanges}
          onClick={() => {
            setCurrentIndex(index);
            gaEvent("timeline_jump_to_snapshot");
          }}
          style={{ pointerEvents: "auto" }}
        />
      </Popover.Target>
      <Popover.Dropdown style={{ padding: 0 }}>
        <Stack gap={0}>
          <Box p="sm" style={{ borderBottom: "1px solid var(--border-color, #e5e7eb)" }}>
            {editingLabel ? (
              <Group gap="xs">
                <TextInput
                  value={labelValue}
                  onChange={e => setLabelValue(e.currentTarget.value)}
                  size="xs"
                  style={{ flex: 1 }}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSaveLabel();
                    if (e.key === "Escape") {
                      setEditingLabel(false);
                      setLabelValue(snapshot.label);
                    }
                  }}
                />
                <ActionIcon size="sm" variant="light" onClick={handleSaveLabel}>
                  ✓
                </ActionIcon>
              </Group>
            ) : (
              <Group justify="space-between" align="center">
                <Text size="xs" fw={600} style={{ maxWidth: 200 }} truncate="end">
                  {snapshot.label}
                </Text>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => setEditingLabel(true)}
                >
                  <LuEdit3 size={12} />
                </ActionIcon>
              </Group>
            )}
          </Box>

          <Box p="sm">
            <Group gap="xs" mb="sm">
              <Badge size="xs" variant="light">
                {formatTime(snapshot.timestamp)}
              </Badge>
              <Badge size="xs" variant="outline">
                {snapshot.source}
              </Badge>
            </Group>

            <Group gap="sm" mb="xs">
              <Text size="xs" c="dimmed">
                Nodes: <strong>{snapshot.nodeCount}</strong>
              </Text>
              <Text size="xs" c="dimmed">
                Edges: <strong>{snapshot.edgeCount}</strong>
              </Text>
            </Group>

            {hasChanges && (
              <>
                <Divider my="xs" />
                <Text size="xs" fw={600} mb="xs">
                  Changes:
                </Text>
                <Group gap="md">
                  {snapshot.diff.addedNodes.length > 0 && (
                    <Group gap="xs">
                      <VscDiffAdded size={14} style={{ color: "#22c55e" }} />
                      <Text size="xs" c="green">
                        +{snapshot.diff.addedNodes.length}
                      </Text>
                    </Group>
                  )}
                  {snapshot.diff.removedNodes.length > 0 && (
                    <Group gap="xs">
                      <VscDiffRemoved size={14} style={{ color: "#ef4444" }} />
                      <Text size="xs" c="red">
                        -{snapshot.diff.removedNodes.length}
                      </Text>
                    </Group>
                  )}
                  {snapshot.diff.modifiedNodes.length > 0 && (
                    <Group gap="xs">
                      <VscDiffModified size={14} style={{ color: "#f59e0b" }} />
                      <Text size="xs" c="orange">
                        ~{snapshot.diff.modifiedNodes.length}
                      </Text>
                    </Group>
                  )}
                </Group>
              </>
            )}
          </Box>

          <Box p="xs" style={{ borderTop: "1px solid var(--border-color, #e5e7eb)" }}>
            <Button
              size="xs"
              variant="light"
              color="red"
              fullWidth
              leftSection={<LuTrash2 size={14} />}
              onClick={() => removeSnapshot(snapshot.id)}
            >
              Delete Snapshot
            </Button>
          </Box>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export const DebugTimeline: React.FC = () => {
  const {
    snapshots,
    currentIndex,
    isPlaying,
    playSpeed,
    isOpen,
    isRecording,
    setCurrentIndex,
    goToPrevious,
    goToNext,
    togglePlay,
    setPlaySpeed,
    toggleOpen,
    toggleRecording,
    clearAll,
    addSnapshot,
  } = useTimeline();

  const json = useFile(state => state.contents);

  const handleAddManualSnapshot = () => {
    addSnapshot(json, "manual", `Manual (${formatTime(Date.now())})`);
    gaEvent("timeline_add_manual_snapshot");
  };

  const playSpeedOptions = [
    { value: "500", label: "0.5x" },
    { value: "1000", label: "1x" },
    { value: "2000", label: "2x" },
    { value: "3000", label: "3x" },
  ];

  if (!isOpen) {
    return (
      <Tooltip label="Open Debug Timeline" position="top">
        <ActionIcon
          size="lg"
          variant="light"
          onClick={() => {
            toggleOpen();
            gaEvent("timeline_open");
          }}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 100,
            background: "var(--bg-secondary, #1f2937)",
            border: "1px solid var(--border, #374151)",
          }}
        >
          <AiOutlineClockCircle size={20} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <StyledTimelineWrapper>
      <StyledTimelineHeader>
        <Group gap="sm" align="center">
          <Text size="sm" fw={600}>
            Debug Timeline
          </Text>
          <Badge size="xs" variant={isRecording ? "filled" : "outline"} color={isRecording ? "green" : "gray"}>
            {isRecording ? "Recording" : "Paused"}
          </Badge>
          <Text size="xs" c="dimmed">
            {snapshots.length} snapshots
          </Text>
        </Group>

        <Group gap="xs" align="center">
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={handleAddManualSnapshot}
            title="Add Manual Snapshot"
          >
            <LuPlus size={14} />
          </ActionIcon>

          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={toggleRecording}
            color={isRecording ? "green" : "gray"}
            title={isRecording ? "Pause Recording" : "Start Recording"}
          >
            {isRecording ? "⏸" : "▶"}
          </ActionIcon>

          <Menu shadow="md">
            <Menu.Target>
              <ActionIcon size="sm" variant="subtle" title="Settings">
                <LuSettings size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<AiOutlineDelete size={14} />}
                color="red"
                onClick={clearAll}
              >
                Clear All Snapshots
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={toggleOpen}
            title="Close Timeline"
          >
            ✕
          </ActionIcon>
        </Group>
      </StyledTimelineHeader>

      <StyledTimelineContent>
        <Stack gap="md">
          <StyledSliderWrapper>
            <StyledMarkerContainer>
              {snapshots.map((snapshot, index) => (
                <Box
                  key={snapshot.id}
                  style={{
                    position: "absolute",
                    left: `${snapshots.length > 1 ? (index / (snapshots.length - 1)) * 100 : 50}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <SnapshotPopover
                    snapshot={snapshot}
                    index={index}
                    isActive={index === currentIndex}
                  />
                </Box>
              ))}
            </StyledMarkerContainer>

            <Slider
              value={currentIndex >= 0 ? currentIndex : 0}
              min={0}
              max={Math.max(0, snapshots.length - 1)}
              step={1}
              onChange={value => {
                setCurrentIndex(value as number);
              }}
              disabled={snapshots.length === 0}
              styles={{
                track: {
                  height: 4,
                },
                thumb: {
                  width: 16,
                  height: 16,
                },
                mark: {
                  display: "none",
                },
              }}
            />
          </StyledSliderWrapper>

          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <Tooltip label="Previous Snapshot" position="top">
                <ActionIcon
                  size="lg"
                  variant="light"
                  onClick={goToPrevious}
                  disabled={currentIndex <= 0}
                >
                  <LuChevronLeft size={18} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={isPlaying ? "Pause" : "Play"} position="top">
                <ActionIcon
                  size="lg"
                  variant="light"
                  onClick={togglePlay}
                  disabled={snapshots.length < 2}
                  color={isPlaying ? "blue" : "gray"}
                >
                  {isPlaying ? <LuPause size={18} /> : <LuPlay size={18} />}
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Next Snapshot" position="top">
                <ActionIcon
                  size="lg"
                  variant="light"
                  onClick={goToNext}
                  disabled={currentIndex >= snapshots.length - 1}
                >
                  <LuChevronRight size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>

            <Group gap="xs" align="center">
              <Select
                size="xs"
                data={playSpeedOptions}
                value={String(playSpeed)}
                onChange={value => setPlaySpeed(Number(value))}
                style={{ width: 80 }}
              />

              <Text size="xs" c="dimmed">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${snapshots.length}` : "0 / 0"}
              </Text>
            </Group>
          </Group>
        </Stack>
      </StyledTimelineContent>
    </StyledTimelineWrapper>
  );
};
