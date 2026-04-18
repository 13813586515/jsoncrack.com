import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Box, Table, ScrollArea, TextInput, Button, Group, Text, Pagination } from "@mantine/core";
import { useTheme } from "styled-components";
import useJson from "../../../../store/useJson";
import { flattenObject } from "../../../../lib/utils/helpers";

const isObjectArray = (data: unknown): data is Record<string, unknown>[] => {
  return Array.isArray(data) && data.every(item => typeof item === "object" && item !== null && !Array.isArray(item));
};

const getAllKeys = (data: Record<string, unknown>[]): string[] => {
  const keysSet = new Set<string>();
  data.forEach(item => {
    const flattened = flattenObject(item);
    Object.keys(flattened).forEach(key => keysSet.add(key));
  });
  return Array.from(keysSet);
};

const formatValue = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const TableView = () => {
  const theme = useTheme();
  const json = useJson(state => state.json);
  const [globalFilter, setGlobalFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsedData = useMemo(() => {
    try {
      setError(null);
      const parsed = JSON.parse(json);
      if (isObjectArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return [parsed];
      }
      setError("当前数据格式不支持表格视图，请使用对象数组格式的 JSON 数据");
      return [];
    } catch (e) {
      setError("JSON 解析失败，请检查数据格式");
      return [];
    }
  }, [json]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (parsedData.length === 0) return [];

    const keys = getAllKeys(parsedData);
    return keys.map(key => ({
      id: key,
      accessorKey: key,
      header: () => (
        <Text size="sm" fw={600}>
          {key}
        </Text>
      ),
      cell: info => {
        const value = info.getValue();
        return (
          <Text size="sm" c={typeof value === "number" ? "blue" : "inherit"}>
            {formatValue(value)}
          </Text>
        );
      },
    }));
  }, [parsedData]);

  const table = useReactTable({
    data: parsedData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (error) {
    return (
      <Box p="xl" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text size="lg" c="dimmed" ta="center">
          {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box h="100%" p="md" style={{ background: theme.BACKGROUND_SECONDARY }}>
      <Group mb="md" justify="space-between">
        <TextInput
          placeholder="搜索过滤..."
          value={globalFilter ?? ""}
          onChange={e => setGlobalFilter(e.target.value)}
          style={{ width: 300 }}
        />
        <Text size="sm" c="dimmed">
          共 {parsedData.length} 条记录
        </Text>
      </Group>

      <ScrollArea h="calc(100% - 140px)" type="auto">
        <Table
          striped
          highlightOnHover
          withTableBorder
          withColumnBorders
          style={{
            background: theme.BACKGROUND_PRIMARY,
          }}
        >
          <Table.Thead>
            {table.getHeaderGroups().map(headerGroup => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <Table.Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.map(row => (
              <Table.Tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <Table.Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group mt="md" justify="space-between">
        <Group>
          <Button
            variant="light"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            size="sm"
          >
            上一页
          </Button>
          <Button
            variant="light"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            size="sm"
          >
            下一页
          </Button>
        </Group>
        <Text size="sm" c="dimmed">
          第 {table.getState().pagination.pageIndex + 1} 页 / 共 {table.getPageCount()} 页
        </Text>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value));
          }}
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            border: `1px solid ${theme.GRID_COLOR_PRIMARY}`,
            background: theme.BACKGROUND_PRIMARY,
            color: theme.TEXT_NORMAL,
          }}
        >
          {[10, 20, 50, 100].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              显示 {pageSize} 条
            </option>
          ))}
        </select>
      </Group>
    </Box>
  );
};
