import React from "react";
import {
  TextInput,
  ActionIcon,
  Tooltip,
  Select,
  Group,
  Stack,
  Text,
  Menu,
  Badge,
  Box,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import styled from "styled-components";
import {
  AiOutlineSearch,
  AiOutlineClose,
} from "react-icons/ai";
import {
  LuChevronDown,
  LuChevronUp,
  LuHistory,
  LuFilter,
} from "react-icons/lu";
import { event as gaEvent } from "nextjs-google-analytics";
import type { GraphData } from "jsoncrack-react";
import usePredicateSearch from "./stores/usePredicateSearch";
import useJson from "../../../../store/useJson";

const StyledSearchWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.BACKGROUND_SECONDARY};
  border-bottom: 1px solid ${({ theme }) => theme.BORDER};
`;

const StyledRow = styled(Group)`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const StyledCounter = styled(Badge)<{ $none?: boolean }>`
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
  color: ${({ theme, $none }) =>
    $none
      ? theme.BACKGROUND_SECONDARY === "#f2f3f5"
        ? "#dc2626"
        : "#f87171"
      : theme.BACKGROUND_SECONDARY === "#f2f3f5"
        ? "rgba(15, 23, 42, 0.55)"
        : "rgba(255, 255, 255, 0.55)"};
  background: ${({ theme, $none }) =>
    $none
      ? theme.BACKGROUND_SECONDARY === "#f2f3f5"
        ? "rgba(220, 38, 38, 0.1)"
        : "rgba(248, 113, 113, 0.1)"
      : "transparent"};
`;

const StyledModeSelect = styled(Select)`
  width: 120px;
  .mantine-Select-input {
    font-size: 11px;
    padding: 4px 8px;
    min-height: 26px;
  }
`;

interface PredicateSearchInputProps {
  graphData?: GraphData;
  onClose?: () => void;
}

const modeOptions = [
  { value: "dim", label: "Dim Others" },
  { value: "collapse", label: "Collapse Others" },
  { value: "none", label: "No Dim" },
];

export const PredicateSearchInput = ({ graphData, onClose }: PredicateSearchInputProps) => {
  const json = useJson(state => state.json);
  const {
    query,
    setQuery,
    executeSearch,
    clearSearch,
    result,
    isValid,
    error,
    selectedMatchIndex,
    nextMatch,
    prevMatch,
    dimMode,
    setDimMode,
    history,
    addToHistory,
  } = usePredicateSearch();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [debouncedQuery] = useDebouncedValue(query, 500);

  const hasValue = query.length > 0;
  const hasMatches = result && result.matchedNodeIds.size > 0;
  const noResults = hasValue && !hasMatches;
  const matchCount = result?.matchedNodeIds.size ?? 0;

  React.useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  React.useEffect(() => {
    if (!debouncedQuery) {
      clearSearch();
      return;
    }

    if (graphData) {
      try {
        const parsedJson = JSON.parse(json);
        executeSearch(parsedJson, graphData);
        gaEvent("predicate_search");
      } catch {
        // JSON parsing error handled separately
      }
    }
  }, [debouncedQuery, graphData, json, executeSearch, clearSearch]);

  const handleClose = () => {
    clearSearch();
    onClose?.();
  };

  const handleHistorySelect = (historicalQuery: string) => {
    setQuery(historicalQuery);
  };

  return (
    <StyledSearchWrapper>
      <Stack gap="xs">
        <StyledRow>
          <Menu shadow="md" width={240} position="bottom-start">
            <Menu.Target>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                title="Search History"
              >
                <LuHistory size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Recent Searches</Menu.Label>
              {history.length === 0 ? (
                <Menu.Item disabled>No recent searches</Menu.Item>
              ) : (
                history.map((item, index) => (
                  <Menu.Item
                    key={index}
                    onClick={() => handleHistorySelect(item.query)}
                    rightSection={<Badge size="xs">{item.resultCount}</Badge>}
                  >
                    <Text size="xs" truncate="end" style={{ maxWidth: 180 }}>
                      {item.query}
                    </Text>
                  </Menu.Item>
                ))
              )}
            </Menu.Dropdown>
          </Menu>

          <AiOutlineSearch size={14} opacity={0.6} />

          <TextInput
            ref={inputRef}
            variant="unstyled"
            size="xs"
            flex={1}
            value={query}
            onChange={e => setQuery(e.currentTarget.value)}
            placeholder="Enter JSONPath (e.g., $.orders[?(@.price > 100)])"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            error={!isValid}
            styles={{
              input: {
                minHeight: 26,
                height: 26,
                padding: "0 4px",
                color: isValid ? undefined : "#ef4444",
              },
            }}
          />

          {hasValue && (
            <StyledCounter $none={noResults}>
              {noResults
                ? "No matches"
                : hasMatches
                  ? `${selectedMatchIndex + 1} / ${matchCount}`
                  : "Searching..."}
            </StyledCounter>
          )}

          {hasMatches && (
            <>
              <Tooltip label="Previous Match (⇧⏎)" position="top">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={prevMatch}
                >
                  <LuChevronUp size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Next Match (⏎)" position="top">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={nextMatch}
                >
                  <LuChevronDown size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}

          <Tooltip label="Close (Esc)" position="top">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={handleClose}
            >
              <AiOutlineClose size={14} />
            </ActionIcon>
          </Tooltip>
        </StyledRow>

        {error && (
          <Text size="xs" c="red" style={{ paddingLeft: 28 }}>
            {error}
          </Text>
        )}

        <StyledRow style={{ paddingLeft: 28 }}>
          <Group gap="xs" align="center">
            <LuFilter size={12} style={{ opacity: 0.6 }} />
            <StyledModeSelect
              size="xs"
              data={modeOptions}
              value={dimMode}
              onChange={value => setDimMode(value as "dim" | "collapse" | "none")}
              variant="unstyled"
            />
          </Group>
          <Text size="10px" c="dimmed" style={{ marginLeft: "auto" }}>
            Examples: $.users[?(@.age >= 18)], $..[?(@.status == \"active\")]
          </Text>
        </StyledRow>
      </Stack>
    </StyledSearchWrapper>
  );
};
