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
  Chip,
  Group,
  Divider,
  Badge,
  ActionIcon,
  MultiSelect,
  Textarea,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { FiX, FiPlus, FiDownload } from "react-icons/fi";
import { useTranslation } from "../../../store/useI18n";
import useFile from "../../../store/useFile";
import { getAllJsonKeys } from "../../../lib/utils/jsonMutator";
import { parse } from "jsonc-parser";

const commonSensitiveFields = [
  "password",
  "pwd",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "Authorization",
  "creditCard",
  "credit_card",
  "cardNumber",
  "card_number",
  "cvv",
  "ssn",
  "socialSecurity",
  "social_security",
  "email",
  "phone",
  "phoneNumber",
  "phone_number",
  "mobile",
  "address",
  "ip",
  "ipAddress",
  "ip_address",
];

function redactJson(obj: unknown, fieldsToRedact: Set<string>): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactJson(item, fieldsToRedact));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (fieldsToRedact.has(key)) {
        result[key] = "***";
      } else {
        result[key] = redactJson(value, fieldsToRedact);
      }
    }
    return result;
  }

  return obj;
}

export const RedactModal = ({ opened, onClose }: ModalProps) => {
  const { t } = useTranslation();
  const contents = useFile(state => state.contents);
  const getFormat = useFile(state => state.getFormat);

  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [customField, setCustomField] = React.useState("");
  const [customFields, setCustomFields] = React.useState<string[]>([]);
  const [allFields, setAllFields] = React.useState<string[]>([]);
  const [redactedPreview, setRedactedPreview] = React.useState<string>("");

  React.useEffect(() => {
    if (opened && contents) {
      try {
        const parsed = parse(contents);
        const fields = getAllJsonKeys(parsed);
        setAllFields(fields);
      } catch {
        setAllFields([]);
      }
    }
  }, [opened, contents]);

  React.useEffect(() => {
    if (!contents) {
      setRedactedPreview("");
      return;
    }

    try {
      const allSelectedFields = new Set([...selectedFields, ...customFields]);
      if (allSelectedFields.size === 0) {
        setRedactedPreview("");
        return;
      }

      const parsed = parse(contents);
      const redacted = redactJson(parsed, allSelectedFields);
      setRedactedPreview(JSON.stringify(redacted, null, 2));
    } catch {
      setRedactedPreview("");
    }
  }, [contents, selectedFields, customFields]);

  const addCustomField = () => {
    const field = customField.trim();
    if (field && !customFields.includes(field) && !selectedFields.includes(field)) {
      setCustomFields(prev => [...prev, field]);
    }
    setCustomField("");
  };

  const removeCustomField = (field: string) => {
    setCustomFields(prev => prev.filter(f => f !== field));
    setSelectedFields(prev => prev.filter(f => f !== field));
  };

  const handleExport = () => {
    const a = document.createElement("a");
    const file = new Blob([redactedPreview], { type: "text/plain" });

    a.href = window.URL.createObjectURL(file);
    a.download = `jsoncrack-redacted.${getFormat()}`;
    a.click();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addCustomField();
    }
  };

  const commonFieldsInJson = commonSensitiveFields.filter(f => allFields.includes(f));

  return (
    <Modal size="xl" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="md">
        <Flex justify="space-between" align="center">
          <Text fz="md" fw={500}>
            {t("redactSensitiveFields")}
          </Text>
          <CloseButton onClick={onClose} />
        </Flex>

        {commonFieldsInJson.length > 0 && (
          <>
            <Divider my="xs" label={t("commonSensitiveFields")} labelPosition="left" />
            <Chip.Group
              multiple
              value={selectedFields}
              onChange={setSelectedFields}
            >
              <Group gap="xs">
                {commonFieldsInJson.map(field => (
                  <Chip key={field} value={field} size="sm">
                    {field}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </>
        )}

        <Divider my="xs" label={t("allFields")} labelPosition="left" />
        <MultiSelect
          data={allFields.map(f => ({ value: f, label: f }))}
          value={selectedFields.filter(f => !customFields.includes(f))}
          onChange={vals => {
            const newVals = [...vals, ...customFields];
            setSelectedFields(newVals);
          }}
          placeholder={t("selectFieldsToRedact")}
          searchable
          clearable
          maxDropdownHeight={200}
        />

        <Divider my="xs" label={t("addField")} labelPosition="left" />
        <Flex gap="xs" align="center">
          <TextInput
            value={customField}
            onChange={e => setCustomField(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("enterFieldName")}
            style={{ flex: 1 }}
          />
          <Button size="sm" leftSection={<FiPlus size={14} />} onClick={addCustomField}>
            {t("add")}
          </Button>
        </Flex>

        {customFields.length > 0 && (
          <Group gap="xs">
            {customFields.map(field => (
              <Badge
                key={field}
                variant="light"
                rightSection={
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    c="gray"
                    onClick={() => removeCustomField(field)}
                  >
                    <FiX size={10} />
                  </ActionIcon>
                }
              >
                {field}
              </Badge>
            ))}
          </Group>
        )}

        {redactedPreview && (
          <>
            <Divider my="xs" label={t("redactedPreview")} labelPosition="left" />
            <ScrollArea.Autosize mah={250}>
              <CodeHighlight
                code={redactedPreview}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          </>
        )}

        <Divider my="xs" />

        <Flex justify="flex-end" gap="xs">
          <Button variant="subtle" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            color="green"
            leftSection={<FiDownload size={16} />}
            onClick={handleExport}
            disabled={!redactedPreview}
          >
            {t("exportWithRedaction")}
          </Button>
        </Flex>
      </Stack>
    </Modal>
  );
};
