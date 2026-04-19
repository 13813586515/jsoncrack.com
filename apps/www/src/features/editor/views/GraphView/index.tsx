import React from "react";
import { Box, ActionIcon, Tooltip, Group } from "@mantine/core";
import styled from "styled-components";
import { JSONCrack } from "jsoncrack-react";
import type { JSONCrackRef, NodeData, GraphData } from "jsoncrack-react";
import { SUPPORTED_LIMIT } from "../../../../constants/graph";
import { pruneInvalidPaths } from "../../../../lib/utils/collapse";
import useConfig from "../../../../store/useConfig";
import useJson from "../../../../store/useJson";
import { useModal } from "../../../../store/useModal";
import { NotSupported } from "./NotSupported";
import { SecureInfo } from "./SecureInfo";
import { Toolbar } from "./Toolbar";
import useGraph, { ViewMode } from "./stores/useGraph";
import { SearchGraphView } from "./SearchGraphView";
import { DebugTimeline } from "./DebugTimeline";
import useTimeline from "./stores/useTimeline";
import useSchemaModeler from "./stores/useSchemaModeler";
import { SchemaModelerView } from "./SchemaModelerView";
import { VscSymbolSnippet, VscGraph } from "react-icons/vsc";

const StyledEditorWrapper = styled.div<{ $widget: boolean }>`
  width: 100%;
  height: 100%;

  .jsoncrack-space {
    cursor: url("/assets/cursor.svg"), auto;
  }

  .jsoncrack-space:active {
    cursor: grabbing;
  }

  .jsoncrack-space rect {
    rx: 5;
    ry: 5;
    stroke-width: 1;
    filter: drop-shadow(
      2px 2px 0
        ${({ theme }) =>
          theme.BACKGROUND_SECONDARY === "#f2f3f5"
            ? "rgba(15, 23, 42, 0.25)"
            : "rgba(0, 0, 0, 0.6)"}
    );
  }

  .jsoncrack-space path {
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const StyledViewToggle = styled(Group)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  padding: 4px;
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.BORDER};
`;

interface GraphProps {
  isWidget?: boolean;
}

export const GraphView = ({ isWidget = false }: GraphProps) => {
  const setViewPort = useGraph(state => state.setViewPort);
  const setJsonCrackRef = useGraph(state => state.setJsonCrackRef);
  const direction = useGraph(state => state.direction);
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const collapsedPaths = useGraph(state => state.collapsedPaths);
  const toggleCollapse = useGraph(state => state.toggleCollapse);
  const setCollapsedPaths = useGraph(state => state.setCollapsedPaths);
  const viewMode = useGraph(state => state.viewMode);
  const setViewMode = useGraph(state => state.setViewMode);
  const gesturesEnabled = useConfig(state => state.gesturesEnabled);
  const rulersEnabled = useConfig(state => state.rulersEnabled);
  const darkmodeEnabled = useConfig(state => state.darkmodeEnabled);
  const json = useJson(state => state.json);
  const setVisible = useModal(state => state.setVisible);
  const jsonCrackRef = React.useRef<JSONCrackRef>(null);

  const [graphData, setGraphData] = React.useState<GraphData | undefined>(undefined);

  const { isRecording, addSnapshot } = useTimeline();
  const prevJsonRef = React.useRef<string | null>(null);

  const { isOpen: isSchemaModelerOpen, closeModeler } = useSchemaModeler();

  React.useEffect(() => {
    if (isSchemaModelerOpen) {
      setViewMode("schemaModeler");
    }
  }, [isSchemaModelerOpen, setViewMode]);

  React.useEffect(() => {
    if (viewMode === "visualizer") {
      closeModeler();
    }
  }, [viewMode, closeModeler]);

  React.useEffect(() => {
    setJsonCrackRef(jsonCrackRef);
  }, [setJsonCrackRef]);

  React.useEffect(() => {
    if (!collapsedPaths.length) return;
    const pruned = pruneInvalidPaths(json, collapsedPaths);
    if (pruned.length !== collapsedPaths.length) setCollapsedPaths(pruned);
  }, [json, collapsedPaths, setCollapsedPaths]);

  React.useEffect(() => {
    if (!isRecording || !json || json === "{}" || json === "") return;
    if (prevJsonRef.current === json) return;

    const shouldRecord = prevJsonRef.current !== null && prevJsonRef.current !== json;
    prevJsonRef.current = json;

    if (shouldRecord) {
      addSnapshot(json, "auto");
    }
  }, [json, isRecording, addSnapshot]);

  const blurOnClick = React.useCallback(() => {
    if ("activeElement" in document) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
  }, []);

  const handleNodeClick = React.useCallback(
    (node: NodeData) => {
      setSelectedNode(node);
      setVisible("NodeModal", true);
    },
    [setSelectedNode, setVisible]
  );

  const handleParse = React.useCallback((data: GraphData) => {
    setGraphData(data);
  }, []);

  const maxVisibleNodes = Number.isFinite(SUPPORTED_LIMIT) ? SUPPORTED_LIMIT : 1500;

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const jsonCrackElement = (
    <JSONCrack
      ref={jsonCrackRef}
      key={[direction, gesturesEnabled, rulersEnabled].join("-")}
      json={json}
      theme={darkmodeEnabled ? "dark" : "light"}
      layoutDirection={direction}
      showControls={false}
      showGrid={rulersEnabled}
      trackpadZoom={gesturesEnabled}
      maxRenderableNodes={maxVisibleNodes}
      centerOnLayout
      onViewportCreate={setViewPort}
      onNodeClick={handleNodeClick}
      collapsedPaths={collapsedPaths}
      onToggleCollapse={toggleCollapse}
      onParse={handleParse}
      renderNodeLimitExceeded={() => <NotSupported />}
    />
  );

  return (
    <Box pos="relative" h="100%" w="100%">
      {!isWidget && <SecureInfo />}
      {!isWidget && <Toolbar />}

      {!isWidget && (
        <StyledViewToggle gap="xs">
          <Tooltip label="JSON Visualizer" position="bottom">
            <ActionIcon
              size="sm"
              variant={viewMode === "visualizer" ? "filled" : "subtle"}
              color={viewMode === "visualizer" ? "blue" : "gray"}
              onClick={() => handleToggleView("visualizer")}
            >
              <VscGraph size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Schema Modeler" position="bottom">
            <ActionIcon
              size="sm"
              variant={viewMode === "schemaModeler" ? "filled" : "subtle"}
              color={viewMode === "schemaModeler" ? "blue" : "gray"}
              onClick={() => handleToggleView("schemaModeler")}
            >
              <VscSymbolSnippet size={14} />
            </ActionIcon>
          </Tooltip>
        </StyledViewToggle>
      )}

      <StyledEditorWrapper
        $widget={isWidget}
        onContextMenu={event => event.preventDefault()}
        onClick={blurOnClick}
      >
        {viewMode === "schemaModeler" && !isWidget ? (
          <SchemaModelerView />
        ) : !isWidget ? (
          <SearchGraphView graphData={graphData}>
            {jsonCrackElement}
          </SearchGraphView>
        ) : (
          jsonCrackElement
        )}
      </StyledEditorWrapper>

      {!isWidget && viewMode === "visualizer" && <DebugTimeline />}
    </Box>
  );
};
