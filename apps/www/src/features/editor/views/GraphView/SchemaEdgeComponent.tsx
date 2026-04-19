import React from "react";
import type { EdgeProps } from "reaflow";
import { Text } from "@mantine/core";
import styled from "styled-components";
import type { SchemaEdgeData } from "../../../../types/schemaModeler";

const StyledPath = styled.path<{ $selected: boolean; $isArrayItem?: boolean }>`
  fill: none;
  stroke: ${({ theme, $selected, $isArrayItem }) => {
    if ($selected) return "#3b82f6";
    if ($isArrayItem) return "#22c55e";
    return theme.BORDER;
  }};
  stroke-width: ${({ $selected }) => ($selected ? "3px" : "2px")};
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 150ms ease, stroke-width 150ms ease;

  &:hover {
    stroke: ${({ $selected }) => ($selected ? "#2563eb" : "#6b7280")};
    stroke-width: 3px;
  }
`;

const StyledArrow = styled.path<{ $selected: boolean; $isArrayItem?: boolean }>`
  fill: ${({ theme, $selected, $isArrayItem }) => {
    if ($selected) return "#3b82f6";
    if ($isArrayItem) return "#22c55e";
    return theme.BORDER;
  }};
  transition: fill 150ms ease;
`;

const StyledLabelGroup = styled.g`
  pointer-events: none;
`;

const StyledLabelRect = styled.rect`
  fill: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  rx: 4;
  ry: 4;
`;

interface SchemaEdgeComponentProps extends EdgeProps {
  selected: boolean;
  onClick: () => void;
}

export const SchemaEdgeComponent: React.FC<SchemaEdgeComponentProps> = ({
  edge,
  selected,
  onClick,
  containerClassName,
}) => {
  const edgeData = edge?.data as SchemaEdgeData | undefined;
  const isArrayItem = edgeData?.isArrayItem || false;
  const propertyName = edgeData?.propertyName;

  const points = edge?.points || [];

  if (points.length < 2) return null;

  const pathData = `M ${points[0].x} ${points[0].y} ${points
    .slice(1)
    .map(p => `L ${p.x} ${p.y}`)
    .join(" ")}`;

  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2] || lastPoint;

  const dx = lastPoint.x - prevPoint.x;
  const dy = lastPoint.y - prevPoint.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const midPointIndex = Math.floor(points.length / 2);
  const midPoint = points[midPointIndex] || { x: 0, y: 0 };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <g className={containerClassName}>
      <StyledPath
        $selected={selected}
        $isArrayItem={isArrayItem}
        d={pathData}
        onClick={handleClick}
      />

      <g
        transform={`translate(${lastPoint.x}, ${lastPoint.y}) rotate(${angle})`}
        onClick={handleClick}
      >
        <StyledArrow
          $selected={selected}
          $isArrayItem={isArrayItem}
          d="M -12 -6 L 0 0 L -12 6 Z"
        />
      </g>

      {propertyName && propertyName !== "items" && (
        <StyledLabelGroup transform={`translate(${midPoint.x}, ${midPoint.y})`}>
          <foreignObject x={-50} y={-12} width={100} height={24}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <StyledLabelRect x={-45} y={-10} width={90} height={20} />
              <Text
                size="11px"
                fw={500}
                style={{
                  position: "relative",
                  zIndex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "85px",
                }}
              >
                {propertyName}
              </Text>
            </div>
          </foreignObject>
        </StyledLabelGroup>
      )}
    </g>
  );
};
