import React from "react";
import {
  Text,
  TextInput,
  Select,
  Switch,
  NumberInput,
  TagsInput,
  Textarea,
  Group,
  Stack,
  Box,
  Divider,
  Button,
} from "@mantine/core";
import styled from "styled-components";
import type {
  SchemaNodeData,
  SchemaEdgeData,
  SchemaType,
  StringFormat,
} from "../../../../types/schemaModeler";
import useSchemaModeler from "./stores/useSchemaModeler";

const StyledPanelWrapper = styled(Box)`
  flex: 1;
  padding: 16px;
`;

const StyledSectionTitle = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.TEXT_SECONDARY};
  margin-bottom: 8px;
`;

const StyledEmptyState = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.TEXT_SECONDARY};
  text-align: center;
`;

interface SchemaPropertyPanelProps {
  selectedNode: SchemaNodeData | null;
  selectedEdge: SchemaEdgeData | null;
  nodes: SchemaNodeData[];
  edges: SchemaEdgeData[];
  onAddEdge: (from: string, to: string, propertyName?: string, isArrayItem?: boolean) => void;
}

const schemaTypes: { value: SchemaType; label: string }[] = [
  { value: "object", label: "Object" },
  { value: "array", label: "Array" },
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Boolean" },
  { value: "null", label: "Null" },
];

const stringFormats: { value: StringFormat; label: string }[] = [
  { value: null, label: "None" },
  { value: "date-time", label: "Date-Time" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "email", label: "Email" },
  { value: "hostname", label: "Hostname" },
  { value: "ipv4", label: "IPv4" },
  { value: "ipv6", label: "IPv6" },
  { value: "uri", label: "URI" },
  { value: "uuid", label: "UUID" },
  { value: "regex", label: "Regex" },
];

export const SchemaPropertyPanel: React.FC<SchemaPropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onAddEdge,
}) => {
  const { updateNode, updateNodeConstraints, removeNode, removeEdge } = useSchemaModeler();
  const [newPropertyName, setNewPropertyName] = React.useState("");
  const [targetNodeId, setTargetNodeId] = React.useState("");
  const [isArrayItem, setIsArrayItem] = React.useState(false);

  if (!selectedNode && !selectedEdge) {
    return (
      <StyledEmptyState>
        <Stack gap="xs" align="center">
          <Text size="sm" fw={500}>
            No Selection
          </Text>
          <Text size="xs" c="dimmed">
            Click on a node or edge to edit its properties
          </Text>
        </Stack>
      </StyledEmptyState>
    );
  }

  if (selectedEdge) {
    return (
      <StyledPanelWrapper>
        <Stack gap="md">
          <Box>
            <StyledSectionTitle>Edge Properties</StyledSectionTitle>
            <Stack gap="xs">
              <Text size="xs">
                <strong>From:</strong> {nodes.find(n => n.id === selectedEdge.from)?.name || selectedEdge.from}
              </Text>
              <Text size="xs">
                <strong>To:</strong> {nodes.find(n => n.id === selectedEdge.to)?.name || selectedEdge.to}
              </Text>
              {selectedEdge.propertyName && (
                <Text size="xs">
                  <strong>Property:</strong> {selectedEdge.propertyName}
                </Text>
              )}
              {selectedEdge.isArrayItem && (
                <Text size="xs" c="green">
                  <strong>Array Item</strong>
                </Text>
              )}
            </Stack>
          </Box>

          <Divider />

          <Button
            size="xs"
            variant="light"
            color="red"
            onClick={() => removeEdge(selectedEdge.id)}
            fullWidth
          >
            Delete Edge
          </Button>
        </Stack>
      </StyledPanelWrapper>
    );
  }

  const handleNameChange = (value: string) => {
    updateNode(selectedNode.id, { name: value });
  };

  const handleTypeChange = (value: string) => {
    updateNode(selectedNode.id, { type: value as SchemaType });
  };

  const handleDescriptionChange = (value: string) => {
    updateNodeConstraints(selectedNode.id, { description: value });
  };

  const handleRequiredChange = (checked: boolean) => {
    updateNodeConstraints(selectedNode.id, { required: checked });
  };

  const handleDefaultChange = (value: string) => {
    updateNodeConstraints(selectedNode.id, { default: value });
  };

  const handleEnumChange = (values: string[]) => {
    updateNodeConstraints(selectedNode.id, { enumValues: values });
  };

  const handleAddConnection = () => {
    if (targetNodeId) {
      onAddEdge(selectedNode.id, targetNodeId, newPropertyName || undefined, isArrayItem);
      setNewPropertyName("");
      setTargetNodeId("");
      setIsArrayItem(false);
    }
  };

  const availableTargetNodes = nodes.filter(
    n => n.id !== selectedNode.id && !edges.some(e => e.from === selectedNode.id && e.to === n.id)
  );

  return (
    <StyledPanelWrapper>
      <Stack gap="md">
        <Box>
          <StyledSectionTitle>Basic Properties</StyledSectionTitle>
          <Stack gap="xs">
            <TextInput
              label="Name"
              size="xs"
              value={selectedNode.name}
              onChange={e => handleNameChange(e.currentTarget.value)}
            />
            <Select
              label="Type"
              size="xs"
              data={schemaTypes}
              value={selectedNode.type}
              onChange={value => value && handleTypeChange(value)}
            />
            <Textarea
              label="Description"
              size="xs"
              value={selectedNode.constraints.description || ""}
              onChange={e => handleDescriptionChange(e.currentTarget.value)}
              autosize
              minRows={2}
              placeholder="Add a description..."
            />
          </Stack>
        </Box>

        <Divider />

        <Box>
          <StyledSectionTitle>Constraints</StyledSectionTitle>
          <Stack gap="xs">
            <Switch
              size="xs"
              label="Required"
              checked={selectedNode.constraints.required || false}
              onChange={e => handleRequiredChange(e.currentTarget.checked)}
            />

            <TextInput
              label="Default Value"
              size="xs"
              value={selectedNode.constraints.default || ""}
              onChange={e => handleDefaultChange(e.currentTarget.value)}
              placeholder={`JSON value (e.g., "hello", 42, true)`}
            />

            <TagsInput
              label="Enum Values"
              size="xs"
              value={selectedNode.constraints.enumValues || []}
              onChange={handleEnumChange}
              placeholder="Add allowed values..."
              splitChars={[","]}
            />
          </Stack>
        </Box>

        {selectedNode.type === "string" && (
          <>
            <Divider />
            <Box>
              <StyledSectionTitle>String Constraints</StyledSectionTitle>
              <Stack gap="xs">
                <Select
                  label="Format"
                  size="xs"
                  data={stringFormats}
                  value={selectedNode.constraints.stringFormat || null}
                  onChange={value =>
                    updateNodeConstraints(selectedNode.id, {
                      stringFormat: (value as StringFormat) || null,
                    })
                  }
                />
                <Group grow>
                  <NumberInput
                    label="Min Length"
                    size="xs"
                    value={selectedNode.constraints.stringMinLength}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { stringMinLength: value as number })
                    }
                    min={0}
                  />
                  <NumberInput
                    label="Max Length"
                    size="xs"
                    value={selectedNode.constraints.stringMaxLength}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { stringMaxLength: value as number })
                    }
                    min={0}
                  />
                </Group>
                <TextInput
                  label="Pattern (Regex)"
                  size="xs"
                  value={selectedNode.constraints.stringPattern || ""}
                  onChange={e =>
                    updateNodeConstraints(selectedNode.id, { stringPattern: e.currentTarget.value })
                  }
                  placeholder="e.g., ^[a-zA-Z]+$"
                />
              </Stack>
            </Box>
          </>
        )}

        {(selectedNode.type === "number" || selectedNode.type === "integer") && (
          <>
            <Divider />
            <Box>
              <StyledSectionTitle>Number Constraints</StyledSectionTitle>
              <Stack gap="xs">
                <Group grow>
                  <NumberInput
                    label="Minimum"
                    size="xs"
                    value={selectedNode.constraints.numberMinimum}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { numberMinimum: value as number })
                    }
                    step={selectedNode.type === "integer" ? 1 : 0.01}
                  />
                  <NumberInput
                    label="Maximum"
                    size="xs"
                    value={selectedNode.constraints.numberMaximum}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { numberMaximum: value as number })
                    }
                    step={selectedNode.type === "integer" ? 1 : 0.01}
                  />
                </Group>
                <Group grow>
                  <NumberInput
                    label="Exclusive Min"
                    size="xs"
                    value={selectedNode.constraints.numberExclusiveMinimum}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, {
                        numberExclusiveMinimum: value as number,
                      })
                    }
                  />
                  <NumberInput
                    label="Exclusive Max"
                    size="xs"
                    value={selectedNode.constraints.numberExclusiveMaximum}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, {
                        numberExclusiveMaximum: value as number,
                      })
                    }
                  />
                </Group>
                <NumberInput
                  label="Multiple Of"
                  size="xs"
                  value={selectedNode.constraints.numberMultipleOf}
                  onChange={value =>
                    updateNodeConstraints(selectedNode.id, { numberMultipleOf: value as number })
                  }
                  min={1}
                />
              </Stack>
            </Box>
          </>
        )}

        {selectedNode.type === "array" && (
          <>
            <Divider />
            <Box>
              <StyledSectionTitle>Array Constraints</StyledSectionTitle>
              <Stack gap="xs">
                <Group grow>
                  <NumberInput
                    label="Min Items"
                    size="xs"
                    value={selectedNode.constraints.arrayMinItems}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { arrayMinItems: value as number })
                    }
                    min={0}
                  />
                  <NumberInput
                    label="Max Items"
                    size="xs"
                    value={selectedNode.constraints.arrayMaxItems}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { arrayMaxItems: value as number })
                    }
                    min={0}
                  />
                </Group>
                <Switch
                  size="xs"
                  label="Unique Items"
                  checked={selectedNode.constraints.arrayUniqueItems || false}
                  onChange={e =>
                    updateNodeConstraints(selectedNode.id, { arrayUniqueItems: e.currentTarget.checked })
                  }
                />
              </Stack>
            </Box>
          </>
        )}

        {selectedNode.type === "object" && (
          <>
            <Divider />
            <Box>
              <StyledSectionTitle>Object Constraints</StyledSectionTitle>
              <Stack gap="xs">
                <Group grow>
                  <NumberInput
                    label="Min Properties"
                    size="xs"
                    value={selectedNode.constraints.objectMinProperties}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { objectMinProperties: value as number })
                    }
                    min={0}
                  />
                  <NumberInput
                    label="Max Properties"
                    size="xs"
                    value={selectedNode.constraints.objectMaxProperties}
                    onChange={value =>
                      updateNodeConstraints(selectedNode.id, { objectMaxProperties: value as number })
                    }
                    min={0}
                  />
                </Group>
              </Stack>
            </Box>
          </>
        )}

        {(selectedNode.type === "object" || selectedNode.type === "array") && availableTargetNodes.length > 0 && (
          <>
            <Divider />
            <Box>
              <StyledSectionTitle>Add Connection</StyledSectionTitle>
              <Stack gap="xs">
                <Select
                  label="Target Node"
                  size="xs"
                  data={availableTargetNodes.map(n => ({ value: n.id, label: `${n.name} (${n.type})` }))}
                  value={targetNodeId}
                  onChange={value => setTargetNodeId(value || "")}
                  placeholder="Select a node..."
                />
                {selectedNode.type === "object" && (
                  <TextInput
                    label="Property Name"
                    size="xs"
                    value={newPropertyName}
                    onChange={e => setNewPropertyName(e.currentTarget.value)}
                    placeholder="e.g., userId"
                  />
                )}
                {selectedNode.type === "array" && (
                  <Switch
                    size="xs"
                    label="Array Item Type"
                    checked={isArrayItem}
                    onChange={e => setIsArrayItem(e.currentTarget.checked)}
                  />
                )}
                <Button
                  size="xs"
                  onClick={handleAddConnection}
                  disabled={!targetNodeId}
                  fullWidth
                >
                  Connect
                </Button>
              </Stack>
            </Box>
          </>
        )}

        <Divider />

        <Button
          size="xs"
          variant="light"
          color="red"
          onClick={() => removeNode(selectedNode.id)}
          fullWidth
        >
          Delete Node
        </Button>
      </Stack>
    </StyledPanelWrapper>
  );
};
