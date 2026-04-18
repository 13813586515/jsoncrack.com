import React from "react";
import type { ModalProps } from "@mantine/core";
import {
  Modal,
  Stack,
  Text,
  ScrollArea,
  Flex,
  CloseButton,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Group,
  Divider,
  Badge,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData, NodeRow } from "jsoncrack-react";
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from "react-icons/fi";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useFile from "../../../store/useFile";
import { useTranslation } from "../../../store/useI18n";
import { updateJsonByPath, deleteJsonByPath, addJsonField } from "../../../lib/utils/jsonMutator";

interface EditableRow extends NodeRow {
  id: string;
  isEditing: boolean;
}

const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

const parseValue = (value: string, type: string): string | number | boolean | null => {
  switch (type) {
    case "number":
      return Number(value) || 0;
    case "boolean":
      return value.toLowerCase() === "true";
    case "null":
      return null;
    default:
      return value;
  }
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const contents = useFile(state => state.contents);
  const setContents = useFile(state => state.setContents);
  const { t } = useTranslation();

  const [editableRows, setEditableRows] = React.useState<EditableRow[]>([]);
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [newType, setNewType] = React.useState<string>("string");
  const [showAddField, setShowAddField] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>("");
  const [editType, setEditType] = React.useState<string>("string");

  const hasPrimitiveValues = React.useMemo(() => {
    return (
      nodeData?.text?.some(
        row => row.type !== "array" && row.type !== "object" && row.key !== null
      ) || false
    );
  }, [nodeData]);

  React.useEffect(() => {
    if (nodeData?.text) {
      const rows: EditableRow[] = nodeData.text
        .filter(row => row.type !== "array" && row.type !== "object" && row.key !== null)
        .map((row, index) => ({
          ...row,
          id: `row-${index}`,
          isEditing: false,
        }));
      setEditableRows(rows);
    }
  }, [nodeData, opened]);

  const startEdit = (row: EditableRow) => {
    setEditableRows(prev => prev.map(r => (r.id === row.id ? { ...r, isEditing: true } : r)));
    setEditValue(String(row.value ?? ""));
    setEditType(row.type);
  };

  const cancelEdit = (rowId: string) => {
    setEditableRows(prev => prev.map(r => (r.id === rowId ? { ...r, isEditing: false } : r)));
  };

  const saveEdit = (row: EditableRow) => {
    if (!nodeData?.path || row.key === null) return;

    const parsedValue = parseValue(editValue, editType);
    const newContents = updateJsonByPath(
      contents,
      nodeData.path,
      row.key,
      parsedValue
    );

    if (newContents !== contents) {
      setContents({ contents: newContents });
      setEditableRows(prev =>
        prev.map(r =>
          r.id === row.id
            ? { ...r, value: parsedValue as string | number | boolean | null, isEditing: false, type: editType as any }
            : r
        )
      );
    }
  };

  const deleteRow = (row: EditableRow) => {
    if (!nodeData?.path || row.key === null) return;

    const newContents = deleteJsonByPath(contents, nodeData.path, row.key);
    if (newContents !== contents) {
      setContents({ contents: newContents });
      setEditableRows(prev => prev.filter(r => r.id !== row.id));
    }
  };

  const addNewField = () => {
    if (!nodeData?.path || !newKey.trim()) return;

    const parsedValue = parseValue(newValue, newType);
    const newContents = addJsonField(contents, nodeData.path, newKey.trim(), parsedValue);

    if (newContents !== contents) {
      setContents({ contents: newContents });
      const newRow: EditableRow = {
        id: `row-${editableRows.length}`,
        key: newKey.trim(),
        value: parsedValue as string | number | boolean | null,
        type: newType as any,
        isEditing: false,
      };
      setEditableRows(prev => [...prev, newRow]);
      setNewKey("");
      setNewValue("");
      setShowAddField(false);
    }
  };

  return (
    <Modal size="lg" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              {t("editNode")}
            </Text>
            <CloseButton onClick={onClose} />
          </Flex>

          {hasPrimitiveValues ? (
            <ScrollArea.Autosize mah={300} maw={600}>
              <Stack gap="xs">
                {editableRows.map(row => (
                  <Flex key={row.id} gap="xs" align="center">
                    {row.isEditing ? (
                      <>
                        <Badge size="lg" variant="light" w={120}>
                          {row.key}
                        </Badge>
                        <Select
                          value={editType}
                          onChange={val => setEditType(val || "string")}
                          data={[
                            { value: "string", label: "string" },
                            { value: "number", label: "number" },
                            { value: "boolean", label: "boolean" },
                            { value: "null", label: "null" },
                          ]}
                          size="xs"
                          w={90}
                        />
                        {editType !== "null" && (
                          <TextInput
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            placeholder={t("value")}
                            size="xs"
                            style={{ flex: 1 }}
                          />
                        )}
                        <ActionIcon size="sm" color="green" onClick={() => saveEdit(row)}>
                          <FiCheck size={14} />
                        </ActionIcon>
                        <ActionIcon size="sm" color="gray" onClick={() => cancelEdit(row.id)}>
                          <FiX size={14} />
                        </ActionIcon>
                      </>
                    ) : (
                      <>
                        <Badge size="lg" variant="light" w={120}>
                          {row.key}
                        </Badge>
                        <Badge size="xs" variant="outline">
                          {row.type}
                        </Badge>
                        <Text size="sm" style={{ flex: 1 }} truncate>
                          {String(row.value)}
                        </Text>
                        <ActionIcon size="sm" variant="subtle" onClick={() => startEdit(row)}>
                          <FiEdit2 size={14} />
                        </ActionIcon>
                        <ActionIcon size="sm" variant="subtle" color="red" onClick={() => deleteRow(row)}>
                          <FiTrash2 size={14} />
                        </ActionIcon>
                      </>
                    )}
                  </Flex>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          ) : (
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          )}

          {hasPrimitiveValues && (
            <>
              <Divider my="xs" />
              {!showAddField ? (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<FiPlus size={14} />}
                  onClick={() => setShowAddField(true)}
                >
                  {t("addField")}
                </Button>
              ) : (
                <Stack gap="xs">
                  <Flex gap="xs" align="center">
                    <TextInput
                      value={newKey}
                      onChange={e => setNewKey(e.target.value)}
                      placeholder={t("key")}
                      size="xs"
                      style={{ flex: 1 }}
                    />
                    <Select
                      value={newType}
                      onChange={val => setNewType(val || "string")}
                      data={[
                        { value: "string", label: "string" },
                        { value: "number", label: "number" },
                        { value: "boolean", label: "boolean" },
                        { value: "null", label: "null" },
                      ]}
                      size="xs"
                      w={90}
                    />
                    {newType !== "null" && (
                      <TextInput
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        placeholder={t("value")}
                        size="xs"
                        style={{ flex: 1 }}
                      />
                    )}
                    <ActionIcon size="sm" color="green" onClick={addNewField}>
                      <FiCheck size={14} />
                    </ActionIcon>
                    <ActionIcon size="sm" color="gray" onClick={() => setShowAddField(false)}>
                      <FiX size={14} />
                    </ActionIcon>
                  </Flex>
                </Stack>
              )}
            </>
          )}
        </Stack>

        <Divider my="xs" />

        <Text fz="xs" fw={500}>
          {t("jsonPath")}
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={100}
            language="json"
            copyLabel={t("copyToClipboard")}
            copiedLabel={t("copiedToClipboardLabel")}
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
