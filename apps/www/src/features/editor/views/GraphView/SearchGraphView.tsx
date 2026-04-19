import React, { useMemo } from "react";
import { Box } from "@mantine/core";
import styled from "styled-components";
import type { GraphData, NodeData, EdgeData } from "jsoncrack-react";
import usePredicateSearch from "./stores/usePredicateSearch";
import { PredicateSearchInput } from "./PredicateSearchInput";

const StyledSearchWrapper = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const StyledGraphContainer = styled(Box)<{
  $dimmedNodeIds: string;
  $highlightedNodeIds: string;
  $connectedEdgeIds: string;
  $dimMode: "dim" | "collapse" | "none";
}>`
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;

  ${({ $dimmedNodeIds, $highlightedNodeIds, $connectedEdgeIds, $dimMode }) => {
    if ($dimMode === "none") return "";

    let styles = "";

    const dimmedIds = $dimmedNodeIds ? $dimmedNodeIds.split(",") : [];
    const highlightedIds = $highlightedNodeIds ? $highlightedNodeIds.split(",") : [];
    const connectedEdgeIdList = $connectedEdgeIds ? $connectedEdgeIds.split(",") : [];

    if ($dimMode === "dim") {
      dimmedIds.forEach(id => {
        styles += `
          [data-id="node-${id}"] {
            opacity: 0.3 !important;
          }
        `;
      });

      highlightedIds.forEach(id => {
        styles += `
          [data-id="node-${id}"] {
            opacity: 1 !important;
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6)) !important;
          }
        `;
      });
    }

    if ($dimMode === "collapse") {
      dimmedIds.forEach(id => {
        styles += `
          [data-id="node-${id}"] {
            display: none !important;
          }
        `;
      });
    }

    connectedEdgeIdList.forEach(edgeId => {
      styles += `
        .edge-${edgeId} path {
          stroke: #3b82f6 !important;
          stroke-width: 2.5 !important;
        }
      `;
    });

    return styles;
  }}
`;

interface SearchGraphViewProps {
  children: React.ReactNode;
  graphData?: GraphData;
}

export const SearchGraphView: React.FC<SearchGraphViewProps> = ({ children, graphData }) => {
  const { isOpen, openSearch, result, dimMode, selectedMatchIndex } = usePredicateSearch();

  const dimmedNodeIds = useMemo(() => {
    if (!result || dimMode === "none") return "";
    return [...result.dimmedNodeIds].join(",");
  }, [result, dimMode]);

  const highlightedNodeIds = useMemo(() => {
    if (!result) return "";
    return [...result.highlightedNodeIds].join(",");
  }, [result]);

  const connectedEdgeIds = useMemo(() => {
    if (!result) return "";
    return [...result.connectedEdgeIds].join(",");
  }, [result]);

  const nodes = graphData?.nodes || [];
  const matchedNodes = useMemo(() => {
    if (!result) return [];
    return nodes.filter(n => result.matchedNodeIds.has(n.id));
  }, [nodes, result]);

  React.useEffect(() => {
    if (result && matchedNodes.length > 0 && selectedMatchIndex < matchedNodes.length) {
      const targetNode = matchedNodes[selectedMatchIndex];
      if (targetNode) {
        const nodeElement = document.querySelector(`[data-id="node-${targetNode.id}"]`);
        if (nodeElement?.parentElement) {
          const container = document.querySelector(".jsoncrack-space");
          if (container) {
            nodeElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });
          }
        }
      }
    }
  }, [result, matchedNodes, selectedMatchIndex]);

  return (
    <StyledSearchWrapper>
      {isOpen && <PredicateSearchInput graphData={graphData} onClose={usePredicateSearch.getState().closeSearch} />}

      <StyledGraphContainer
        $dimmedNodeIds={dimmedNodeIds}
        $highlightedNodeIds={highlightedNodeIds}
        $connectedEdgeIds={connectedEdgeIds}
        $dimMode={dimMode}
      >
        {children}
      </StyledGraphContainer>
    </StyledSearchWrapper>
  );
};
