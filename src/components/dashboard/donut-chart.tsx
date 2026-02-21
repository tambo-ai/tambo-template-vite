"use client";

import { DATE_RANGE_OPTIONS, FilterSelect } from "@/components/dashboard/filter-select";
import { getBreakdown, type BreakdownSegment } from "@/services/dashboard-data";
import { useTamboComponentState } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { z } from "zod/v3";

export const donutChartSchema = z.object({
  title: z.string().optional().describe("Chart title"),
  groupBy: z
    .enum(["plan", "country", "channel", "device", "referrer"])
    .describe("Dimension to group by"),
  metric: z
    .enum(["revenue", "users"])
    .optional()
    .describe("What to measure. Default: revenue"),
  dateRange: z
    .enum(["7d", "30d", "90d", "12m", "all"])
    .describe("Time range"),
  limit: z
    .number()
    .optional()
    .describe("Max segments. Remainder grouped as 'Other'. Default 5"),
});

export const donutChartStateSchema = z.object({
  groupBy: donutChartSchema.shape.groupBy,
  metric: donutChartSchema.shape.metric,
  dateRange: donutChartSchema.shape.dateRange,
  limit: donutChartSchema.shape.limit,
  title: donutChartSchema.shape.title,
});

export type DonutChartProps = z.infer<typeof donutChartSchema>;

const GROUP_BY_OPTIONS = [
  { value: "plan", label: "Plan" },
  { value: "country", label: "Country" },
  { value: "channel", label: "Channel" },
  { value: "device", label: "Device" },
  { value: "referrer", label: "Referrer" },
];

function Skeleton({ title }: { title?: string }) {
  return (
    <div className="p-4 h-64">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="flex items-center justify-center h-[calc(100%-2rem)]">
        <div className="animate-pulse w-36 h-36 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function DonutChartBase(props: DonutChartProps) {
  const [data, setData] = useState<BreakdownSegment[] | null>(null);
  const [groupBy, setGroupBy] = useTamboComponentState("groupBy", props.groupBy);
  const [metric, setMetric] = useTamboComponentState("metric", props.metric);
  const [dateRange, setDateRange] = useTamboComponentState("dateRange", props.dateRange);
  const [limit] = useTamboComponentState("limit", props.limit);
  const [title, setTitle] = useTamboComponentState("title", props.title);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (props.groupBy) setGroupBy(props.groupBy);
    if (props.metric) setMetric(props.metric);
    if (props.dateRange) setDateRange(props.dateRange);
    if (props.title !== undefined) setTitle(props.title);
  }, [props.groupBy, props.metric, props.dateRange, props.title, setGroupBy, setMetric, setDateRange, setTitle]);

  const canFetch = Boolean(groupBy && dateRange);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    getBreakdown({ groupBy: groupBy!, metric, dateRange: dateRange!, limit }).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [groupBy, metric, dateRange, limit, canFetch]);

  if (!canFetch || !data) {
    return <Skeleton title={title} />;
  }

  const total = data.reduce((sum, s) => sum + s.value, 0);

  // Transform to plain objects for Recharts compatibility
  const pieData = data.map((d) => ({
    name: d.name,
    value: d.value,
    color: d.color,
    percent: d.percent,
  }));

  return (
    <div className="p-4 h-64">
      <div className="flex items-center justify-between mb-3">
        {title && (
          <h3 className="text-sm font-semibold text-foreground">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <FilterSelect
            value={groupBy!}
            options={GROUP_BY_OPTIONS}
            onChange={(v) => setGroupBy(v as typeof groupBy)}
          />
          <FilterSelect
            value={dateRange!}
            options={DATE_RANGE_OPTIONS}
            onChange={(v) => setDateRange(v as typeof dateRange)}
          />
        </div>
      </div>
      <div className="flex h-[calc(100%-2.5rem)]">
        {/* Chart */}
        <div className="flex-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(value: number) =>
                  new Intl.NumberFormat("en-US").format(value)
                }
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-foreground">
                {new Intl.NumberFormat("en-US", { notation: "compact" }).format(total)}
              </p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-col justify-center gap-1.5 ml-2 min-w-[100px]">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {entry.name}
              </span>
              <span className="text-xs font-mono text-foreground ml-auto">
                {entry.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
