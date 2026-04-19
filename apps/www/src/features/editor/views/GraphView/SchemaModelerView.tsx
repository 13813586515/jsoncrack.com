import React, { useCallback, useMemo, useRef } from "react";
import { Box, Button, Group, ActionIcon, Tooltip, Text } from "@mantine/core";
import styled from "styled-components";
import type { NodeProps, EdgeProps } from "reaflow";
import { Canvas } from "reaflow";
import { Space } from "react-zoomable-ui";
import { event as gaEvent } from "nextjs-google-analytics";
import { toast } from "react-hot-toast";
import { MdOutlineSaveAlt } from "react-icons/md";
import { VscAdd, VscTrash, VscClearAll } from "react-icons/vsc";
import type { SchemaNodeData, SchemaEdgeData, SchemaType } from "../../../../types/schemaModeler";
import useSchemaModeler from "./stores/useSchemaModeler";
import { SchemaNodeComponent } from "./SchemaNodeComponent";
import { SchemaEdgeComponent } from "./SchemaEdgeComponent";
import { SchemaPropertyPanel } from "./SchemaPropertyPanel";
import { SchemaNodePalette } from "./SchemaNodePalette";

const layoutOptions = {
  "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
  "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  "elk.spacing.edgeLabel": "15",
};

const StyledModelerWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  background: ${({ theme }) => theme.BACKGROUND_PRIMARY};

  .jsoncrack-space {
    cursor: default;
  }

  .jsoncrack-space:active {
    cursor: grabbing;
  }
`;

const StyledCanvasArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const StyledToolbar = styled(Group)`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  padding: 8px 12px;
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.BORDER};
`;

const StyledPropertyPanel = styled.div`
  width: 320px;
  border-left: 1px solid ${({ theme }) => theme.BORDER};
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const StyledPalette = styled.div`
  position: absolute;
  top: 16px;
  right: 336px;
  z-index: 10;
`;

const StyledEmptyState = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: ${({ theme }) => theme.TEXT_SECONDARY};
`;

interface SchemaModelerViewProps {
  onExport?: (schema: string) => void;
}

export const SchemaModelerView = ({ onExport }: SchemaModelerViewProps) => {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    addNode,
    removeNode,
    removeEdge,
    selectNode,
    selectEdge,
    updateNode,
    addEdge,
    clearSchema,
    exportSchema,
  } = useSchemaModeler();

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewPort, setViewPort] = React.useState<unknown>(null);
  const [draggedType, setDraggedType] = React.useState<SchemaType | null>(null);
  const [paneWidth, setPaneWidth] = React.useState(2000);
  const [paneHeight, setPaneHeight] = React.useState(2000);

  const canvasNodes = useMemo(() => {
    return nodes.map(node => ({
      id: node.id,
      text: node.name,
      data: node,
    }));
  }, [nodes]);

  const canvasEdges = useMemo(() => {
    return edges.map(edge => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      text: edge.propertyName || "",
      data: edge,
    }));
  }, [edges]);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const selectedEdge = useMemo(() => {
    return edges.find(e => e.id === selectedEdgeId) || null;
  }, [edges, selectedEdgeId]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedType || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const name = `New ${draggedType.charAt(0).toUpperCase() + draggedType.slice(1)}`;
      addNode(name, draggedType);

      const lastNode = nodes[nodes.length - 1];
      if (lastNode) {
        updateNode(lastNode.id, { x, y });
      }

      setDraggedType(null);
    },
    [draggedType, nodes, addNode, updateNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDragStart = useCallback((type: SchemaType) => {
    setDraggedType(type);
  }, []);

  const handleNodeClick = useCallback(
    (nodeData: SchemaNodeData) => {
      selectNode(nodeData.id);
      gaEvent("schema_node_click");
    },
    [selectNode]
  );

  const handleEdgeClick = useCallback(
    (edgeData: SchemaEdgeData) => {
      selectEdge(edgeData.id);
    },
    [selectEdge]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
    }
    if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
    }
  }, [selectedNodeId, selectedEdgeId, removeNode, removeEdge]);

  const handleExport = useCallback(() => {
    const schema = exportSchema();
    const schemaStr = JSON.stringify(schema, null, 2);
    onExport?.(schemaStr);
    toast.success("Schema exported successfully!");
    gaEvent("export_schema");

    const blob = new Blob([schemaStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSchema, onExport]);

  const handleCanvasClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  const renderNode = useCallback(
    (props: NodeProps) => (
      <SchemaNodeComponent
        {...props}
        selected={props.id === selectedNodeId}
        onClick={() => {
          const nodeData = nodes.find(n => n.id === props.id);
          if (nodeData) handleNodeClick(nodeData);
        }}
      />
    ),
    [selectedNodeId, nodes, handleNodeClick]
  );

  const renderEdge = useCallback(
    (props: EdgeProps) => (
      <SchemaEdgeComponent
        {...props}
        selected={props.id === selectedEdgeId}
        onClick={() => {
          const edgeData = edges.find(e => e.id === props.id);
          if (edgeData) handleEdgeClick(edgeData);
        }}
      />
    ),
    [selectedEdgeId, edges, handleEdgeClick]
  );

  const handleLayoutChange = useCallback((layout: { width?: number; height?: number }) => {
    if (layout.width && layout.height) {
      setPaneWidth(layout.width + 100);
      setPaneHeight(layout.height + 100);
    }
  }, []);

  return (
    <StyledModelerWrapper>
      <StyledCanvasArea
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleCanvasClick}
      >
        <StyledToolbar gap="xs">
          <Tooltip label="Add Object" position="bottom">
            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => {
                addNode("New Object", "object");
              }}
            >
              <VscAdd size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Clear All" position="bottom">
            <ActionIcon size="sm" variant="light" color="red" onClick={clearSchema}>
              <VscClearAll size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Delete Selected" position="bottom">
            <ActionIcon
              size="sm"
              variant="light"
              color="red"
              onClick={handleDeleteSelected}
              disabled={!selectedNodeId && !selectedEdgeId}
            >
              <VscTrash size={14} />
            </ActionIcon>
          </Tooltip>

          <Button
            size="xs"
            variant="light"
            leftSection={<MdOutlineSaveAlt size={14} />}
            onClick={handleExport}
            disabled={nodes.length === 0}
          >
            Export Schema
          </Button>
        </StyledToolbar>

        <StyledPalette>
          <SchemaNodePalette onDragStart={handleDragStart} />
        </StyledPalette>

        {nodes.length === 0 ? (
          <StyledEmptyState>
            <Text size="lg" fw={500} mb="sm">
              Schema Modeler
            </Text>
            <Text size="sm">Drag nodes from the palette to start building your schema</Text>
          </StyledEmptyState>
        ) : (
          <Space
            onCreate={nextViewPort => {
              setViewPort(nextViewPort);
            }}
            onContextMenu={event => event.preventDefault()}
            treatTwoFingerTrackPadGesturesLikeTouch={false}
            className="jsoncrack-space"
          >
            <Canvas
              className="jsoncrack-canvas"
              onLayoutChange={handleLayoutChange}
              node={renderNode}
              edge={renderEdge}
              nodes={canvasNodes}
              edges={canvasEdges}
              arrow={null}
              maxHeight={paneHeight}
              maxWidth={paneWidth}
              height={paneHeight}
              width={paneWidth}
              direction="RIGHT"
              layoutOptions={layoutOptions}
              key="RIGHT"
              pannable={false}
              zoomable={false}
              animated={false}
              readonly
              dragEdge={null}
              dragNode={null}
              defaultPosition={null as unknown as undefined}
            />
          </Space>
        )}
      </StyledCanvasArea>

      <StyledPropertyPanel>
        <SchemaPropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          edges={edges}
          onAddEdge={addEdge}
        />
      </StyledPropertyPanel>
    </StyledModelerWrapper>
  );
};
