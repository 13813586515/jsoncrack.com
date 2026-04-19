import React, { useMemo } from "react";
import { Text, Group, Box } from "@mantine/core";
import styled from "styled-components";
import { VscSymbolObject, VscSymbolArray, VscSymbolString, VscSymbolBoolean, VscSymbolNumeric } from "react-icons/vsc";
import { FaHashtag } from "react-icons/fa6";
import type { NodeProps } from "reaflow";
import type { SchemaType, SchemaNodeData } from "../../../../types/schemaModeler";

const StyledNodeWrapper = styled(Box)<{ $selected: boolean; $type: SchemaType }>`
  min-width: 140px;
  min-height: 48px;
  padding: 10px 14px;
  background: ${({ theme, $type, $selected }) => {
    const colors: Record<SchemaType, { light: string; dark: string }> = {
      object: { light: "#dbeafe", dark: "#1e3a5f" },
      array: { light: "#dcfce7", dark: "#14532d" },
      string: { light: "#fef3c7", dark: "#78350f" },
      number: { light: "#fce7f3", dark: "#831843" },
      integer: { light: "#f3e8ff", dark: "#581c87" },
      boolean: { light: "#e0e7ff", dark: "#312e81" },
      null: { light: "#f3f4f6", dark: "#374151" },
    };
    const isDark = theme.BACKGROUND_SECONDARY !== "#f2f3f5";
    const baseColor = colors[$type][isDark ? "dark" : "light"];
    return $selected ? baseColor : theme.BACKGROUND_SECONDARY;
  }};
  border: 2px solid
    ${({ theme, $type, $selected }) => {
      const borderColors: Record<SchemaType, string> = {
        object: "#3b82f6",
        array: "#22c55e",
        string: "#f59e0b",
        number: "#ec4899",
        integer: "#a855f7",
        boolean: "#6366f1",
        null: "#6b7280",
      };
      return $selected ? borderColors[$type] : theme.BORDER;
    }};
  border-radius: 8px;
  box-shadow: ${({ $selected }) =>
    $selected ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.1)"};
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: ${({ theme, $type }) => {
      const borderColors: Record<SchemaType, string> = {
        object: "#3b82f6",
        array: "#22c55e",
        string: "#f59e0b",
        number: "#ec4899",
        integer: "#a855f7",
        boolean: "#6366f1",
        null: "#6b7280",
      };
      return borderColors[$type];
    }};
    transform: translateY(-1px);
  }
`;

const StyledIconWrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${({ theme }) =>
    theme.BACKGROUND_SECONDARY === "#f2f3f5" ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.1)"};
`;

const getTypeIcon = (type: SchemaType): React.ReactNode => {
  switch (type) {
    case "object":
      return <VscSymbolObject size={16} />;
    case "array":
      return <VscSymbolArray size={16} />;
    case "string":
      return <VscSymbolString size={16} />;
    case "number":
      return <VscSymbolNumeric size={16} />;
    case "integer":
      return <FaHashtag size={14} />;
    case "boolean":
      return <VscSymbolBoolean size={16} />;
    case "null":
      return <Text size={14} fw={700}>∅</Text>;
    default:
      return null;
  }
};

const getTypeColor = (type: SchemaType): string => {
  const colors: Record<SchemaType, string> = {
    object: "#3b82f6",
    array: "#22c55e",
    string: "#f59e0b",
    number: "#ec4899",
    integer: "#a855f7",
    boolean: "#6366f1",
    null: "#6b7280",
  };
  return colors[type] || "#6b7280";
};

interface SchemaNodeComponentProps extends NodeProps {
  selected: boolean;
  onClick: () => void;
}

export const SchemaNodeComponent: React.FC<SchemaNodeComponentProps> = ({
  x,
  y,
  node,
  selected,
  onClick,
}) => {
  const nodeData = node?.data as SchemaNodeData | undefined;
  const type = nodeData?.type || "object";
  const name = nodeData?.name || node?.text?.toString() || "Untitled";
  const constraints = nodeData?.constraints;

  const hasConstraints = useMemo(() => {
    if (!constraints) return false;
    return (
      constraints.required ||
      constraints.stringFormat ||
      constraints.stringMinLength !== undefined ||
      constraints.stringMaxLength !== undefined ||
      constraints.numberMinimum !== undefined ||
      constraints.numberMaximum !== undefined ||
      constraints.arrayMinItems !== undefined ||
      constraints.arrayMaxItems !== undefined ||
      (constraints.enumValues && constraints.enumValues.length > 0)
    );
  }, [constraints]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={200}
      height={hasConstraints ? 80 : 56}
      style={{ overflow: "visible" }}
    >
      <StyledNodeWrapper
        $selected={selected}
        $type={type}
        onClick={handleClick}
        style={{ width: "100%", height: "100%" }}
      >
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <StyledIconWrapper style={{ color: getTypeColor(type) }}>
            {getTypeIcon(type)}
          </StyledIconWrapper>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={600} truncate="end">
              {name}
            </Text>
            <Text size="10px" c="dimmed" fw={500} tt="uppercase">
              {type}
            </Text>
            {hasConstraints && constraints && (
              <Text size="9px" c="dimmed" mt="4px" truncate="end">
                {constraints.required && "required"}
                {constraints.required && constraints.stringFormat && " • "}
                {constraints.stringFormat}
                {!constraints.stringFormat && constraints.numberMinimum !== undefined && `≥${constraints.numberMinimum}`}
                {!constraints.stringFormat && constraints.numberMaximum !== undefined && ` ≤${constraints.numberMaximum}`}
              </Text>
            )}
          </Box>
        </Group>
      </StyledNodeWrapper>
    </foreignObject>
  );
};
