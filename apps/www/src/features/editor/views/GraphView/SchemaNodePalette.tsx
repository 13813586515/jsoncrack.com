import React from "react";
import { Paper, Text, Group, Box } from "@mantine/core";
import styled from "styled-components";
import { VscSymbolObject, VscSymbolArray, VscSymbolString, VscSymbolBoolean, VscSymbolNumeric } from "react-icons/vsc";
import { FaHashtag } from "react-icons/fa6";
import type { SchemaType } from "../../../../types/schemaModeler";

const StyledPaletteWrapper = styled(Paper)`
  padding: 12px;
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  border: 1px solid ${({ theme }) => theme.BORDER};
  border-radius: 8px;
  width: 160px;
`;

const StyledPaletteItem = styled(Group)`
  padding: 8px 10px;
  border-radius: 6px;
  cursor: grab;
  transition: background-color 150ms ease;

  &:hover {
    background: ${({ theme }) =>
      theme.BACKGROUND_SECONDARY === "#f2f3f5" ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)"};
  }

  &:active {
    cursor: grabbing;
  }
`;

const StyledIconWrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: ${({ theme }) =>
    theme.BACKGROUND_SECONDARY === "#f2f3f5" ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"};
  color: ${({ theme }) => theme.TEXT_PRIMARY};
`;

interface PaletteItemProps {
  type: SchemaType;
  label: string;
  icon: React.ReactNode;
  onDragStart: (type: SchemaType) => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, label, icon, onDragStart }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", type);
    onDragStart(type);
  };

  return (
    <StyledPaletteItem
      gap="sm"
      draggable
      onDragStart={handleDragStart}
      align="center"
    >
      <StyledIconWrapper>{icon}</StyledIconWrapper>
      <Text size="xs" fw={500}>
        {label}
      </Text>
    </StyledPaletteItem>
  );
};

interface SchemaNodePaletteProps {
  onDragStart: (type: SchemaType) => void;
}

export const SchemaNodePalette: React.FC<SchemaNodePaletteProps> = ({ onDragStart }) => {
  const nodeTypes: { type: SchemaType; label: string; icon: React.ReactNode }[] = [
    { type: "object", label: "Object", icon: <VscSymbolObject size={14} /> },
    { type: "array", label: "Array", icon: <VscSymbolArray size={14} /> },
    { type: "string", label: "String", icon: <VscSymbolString size={14} /> },
    { type: "number", label: "Number", icon: <VscSymbolNumeric size={14} /> },
    { type: "integer", label: "Integer", icon: <FaHashtag size={14} /> },
    { type: "boolean", label: "Boolean", icon: <VscSymbolBoolean size={14} /> },
    { type: "null", label: "Null", icon: <Text size={12}>∅</Text> },
  ];

  return (
    <StyledPaletteWrapper withBorder shadow="sm">
      <Text size="xs" fw={600} mb="xs" c="dimmed">
        Node Types
      </Text>
      <Box style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {nodeTypes.map(item => (
          <PaletteItem
            key={item.type}
            type={item.type}
            label={item.label}
            icon={item.icon}
            onDragStart={onDragStart}
          />
        ))}
      </Box>
    </StyledPaletteWrapper>
  );
};
