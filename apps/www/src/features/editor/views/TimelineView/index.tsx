import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, Text, ScrollArea, Group, Badge, SegmentedControl } from "@mantine/core";
import { useTheme } from "styled-components";
import useJson from "../../../../store/useJson";

interface TimelineEvent {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  color: string;
  rawData: Record<string, unknown>;
}

type TimelineMode = "gantt" | "waterfall";

const extractTimeValue = (obj: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
        const num = Number(value);
        if (!isNaN(num)) {
          return num;
        }
      }
    }
  }
  return null;
};

const extractEventName = (obj: Record<string, unknown>, index: number): string => {
  const nameKeys = ["name", "event", "operation", "action", "method", "service", "spanName", "type"];
  for (const key of nameKeys) {
    const value = obj[key];
    if (value !== undefined && value !== null && typeof value === "string") {
      return value;
    }
  }
  return `Event ${index + 1}`;
};

const hasTimelineData = (data: unknown): data is Record<string, unknown>[] => {
  if (!Array.isArray(data) || data.length === 0) return false;

  const timeKeys = ["timestamp", "time", "startTime", "start_time", "start", "endTime", "end_time", "end", "duration"];

  return data.some(item => {
    if (typeof item !== "object" || item === null) return false;
    return timeKeys.some(key => (item as Record<string, unknown>)[key] !== undefined);
  });
};

const colors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export const TimelineView = () => {
  const theme = useTheme();
  const json = useJson(state => state.json);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<TimelineMode>("gantt");
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const events = useMemo<TimelineEvent[]>(() => {
    try {
      setError(null);
      const parsed = JSON.parse(json);

      if (!hasTimelineData(parsed)) {
        setError("当前数据不包含时间戳信息，无法展示时序视图。请确保数据包含 timestamp、time、startTime 或 duration 等时间字段。");
        return [];
      }

      const events: TimelineEvent[] = parsed.map((item: Record<string, unknown>, index: number) => {
        const startTime = extractTimeValue(item, ["startTime", "start_time", "start", "timestamp", "time"]);
        const endTime = extractTimeValue(item, ["endTime", "end_time", "end"]);
        const duration = extractTimeValue(item, ["duration", "elapsed"]);

        let actualStartTime = startTime ?? Date.now();
        let actualEndTime = endTime ?? actualStartTime + (duration ?? 1000);

        if (duration !== null && endTime === null) {
          actualEndTime = actualStartTime + duration;
        }

        if (startTime === null && endTime !== null && duration !== null) {
          actualStartTime = actualEndTime - duration;
        }

        return {
          id: `event-${index}`,
          name: extractEventName(item, index),
          startTime: actualStartTime,
          endTime: actualEndTime,
          duration: actualEndTime - actualStartTime,
          color: colors[index % colors.length],
          rawData: item,
        };
      });

      return events.sort((a, b) => a.startTime - b.startTime);
    } catch (e) {
      setError("JSON 解析失败，请检查数据格式");
      return [];
    }
  }, [json]);

  useEffect(() => {
    if (!svgRef.current || events.length === 0 || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth - 40;
    const containerHeight = Math.max(events.length * 60 + 100, 400);
    const margin = { top: 40, right: 20, bottom: 60, left: 150 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    svg.attr("width", containerWidth).attr("height", containerHeight);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const minTime = d3.min(events, d => d.startTime) || 0;
    const maxTime = d3.max(events, d => d.endTime) || 0;
    const timePadding = (maxTime - minTime) * 0.05;

    const xScale = d3
      .scaleLinear()
      .domain([minTime - timePadding, maxTime + timePadding])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(events.map(d => d.id))
      .range([0, height])
      .padding(0.3);

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat(d => {
        const date = new Date(d as number);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        const ms = date.getMilliseconds().toString().padStart(3, "0");
        return `${hours}:${minutes}:${seconds}.${ms}`;
      })
      .ticks(5);

    g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", theme.TEXT_NORMAL)
      .style("font-size", "11px");

    g.selectAll(".domain, .tick line").attr("stroke", theme.GRID_COLOR_PRIMARY);

    if (mode === "gantt") {
      events.forEach((event, i) => {
        const barWidth = xScale(event.endTime) - xScale(event.startTime);
        const barHeight = yScale.bandwidth();

        g
          .append("rect")
          .attr("x", xScale(event.startTime))
          .attr("y", yScale(event.id))
          .attr("width", Math.max(barWidth, 2))
          .attr("height", barHeight)
          .attr("rx", 4)
          .attr("fill", event.color)
          .attr("opacity", 0.8)
          .style("cursor", "pointer")
          .on("mouseover", function (this: SVGElement) {
            d3.select(this).attr("opacity", 1);
          })
          .on("mouseout", function (this: SVGElement) {
            d3.select(this).attr("opacity", 0.8);
          });

        g
          .append("text")
          .attr("x", -10)
          .attr("y", (yScale(event.id) || 0) + barHeight / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .attr("fill", theme.TEXT_NORMAL)
          .style("font-size", "12px")
          .text(event.name.length > 18 ? event.name.substring(0, 18) + "..." : event.name);

        if (barWidth > 60) {
          g
            .append("text")
            .attr("x", xScale(event.startTime) + barWidth / 2)
            .attr("y", (yScale(event.id) || 0) + barHeight / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .text(formatDuration(event.duration));
        }
      });
    } else {
      const waterfallScale = d3
        .scaleLinear()
        .domain([0, events.length])
        .range([0, width]);

      events.forEach((event, i) => {
        const barHeight = Math.min((event.duration / (d3.max(events, d => d.duration) || 1)) * 150, 150);
        const xPos = waterfallScale(i) + waterfallScale(0.5) / 2;
        const barWidth = waterfallScale(1) * 0.7;

        g
          .append("rect")
          .attr("x", xPos)
          .attr("y", height - barHeight)
          .attr("width", barWidth)
          .attr("height", barHeight)
          .attr("rx", 4)
          .attr("fill", event.color)
          .attr("opacity", 0.8)
          .style("cursor", "pointer");

        g
          .append("text")
          .attr("x", xPos + barWidth / 2)
          .attr("y", height - barHeight - 5)
          .attr("text-anchor", "middle")
          .attr("fill", theme.TEXT_NORMAL)
          .style("font-size", "10px")
          .text(formatDuration(event.duration));

        g
          .append("text")
          .attr("x", xPos + barWidth / 2)
          .attr("y", height + 20)
          .attr("text-anchor", "middle")
          .attr("fill", theme.TEXT_NORMAL)
          .style("font-size", "11px")
          .text(event.name.length > 10 ? event.name.substring(0, 10) + "..." : event.name);
      });
    }
  }, [events, mode, theme, json]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

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
        <Group>
          <Text fw={600}>时序视图</Text>
          {events.length > 0 && (
            <Badge variant="light">
              {events.length} 个事件，总时长: {formatDuration(events[events.length - 1].endTime - events[0].startTime)}
            </Badge>
          )}
        </Group>
        <SegmentedControl
          value={mode}
          onChange={e => setMode(e as TimelineMode)}
          data={[
            { value: "gantt", label: "甘特图" },
            { value: "waterfall", label: "瀑布图" },
          ]}
          size="sm"
        />
      </Group>

      <ScrollArea h="calc(100% - 80px)" type="auto">
        <div ref={containerRef} style={{ minHeight: 400 }}>
          <svg ref={svgRef} style={{ width: "100%", minHeight: 400 }} />
        </div>
      </ScrollArea>
    </Box>
  );
};
