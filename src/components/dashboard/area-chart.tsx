"use client";

import { DATE_RANGE_OPTIONS, FilterSelect } from "@/components/dashboard/filter-select";
import { getTimeSeries, type TimeSeriesPoint } from "@/services/dashboard-data";
import { useTamboComponentState } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod/v3";

export const areaChartSchema = z.object({
  title: z.string().optional().describe("Chart title"),
  metric: z
    .enum(["revenue", "users", "signups", "churn", "arpu"])
    .describe("Which metric to plot over time"),
  dateRange: z
    .enum(["7d", "30d", "90d", "12m", "all"])
    .describe("Time range"),
  granularity: z
    .enum(["hourly", "daily", "weekly", "monthly"])
    .optional()
    .describe("Data granularity. Auto-selected if omitted"),
  compareToLast: z
    .boolean()
    .optional()
    .describe("Overlay the previous period as a dashed line"),
});

export const areaChartStateSchema = z.object({
  metric: areaChartSchema.shape.metric,
  dateRange: areaChartSchema.shape.dateRange,
  granularity: areaChartSchema.shape.granularity,
  title: areaChartSchema.shape.title,
});

export type DashboardAreaChartProps = z.infer<typeof areaChartSchema>;

const METRIC_OPTIONS = [
  { value: "revenue", label: "Revenue" },
  { value: "users", label: "Users" },
  { value: "signups", label: "Signups" },
  { value: "churn", label: "Churn" },
  { value: "arpu", label: "ARPU" },
];

function Skeleton({ title }: { title?: string }) {
  return (
    <div className="p-4 h-64">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="animate-pulse h-[calc(100%-2rem)] bg-muted rounded" />
    </div>
  );
}

export function DashboardAreaChartBase(props: DashboardAreaChartProps) {
  const [data, setData] = useState<TimeSeriesPoint[] | null>(null);
  const [metric, setMetric] = useTamboComponentState("metric", props.metric);
  const [dateRange, setDateRange] = useTamboComponentState("dateRange", props.dateRange);
  const [granularity, setGranularity] = useTamboComponentState("granularity", props.granularity);
  const [title, setTitle] = useTamboComponentState("title", props.title);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (props.metric) setMetric(props.metric);
    if (props.dateRange) setDateRange(props.dateRange);
    if (props.granularity) setGranularity(props.granularity);
    if (props.title !== undefined) setTitle(props.title);
  }, [props.metric, props.dateRange, props.granularity, props.title, setMetric, setDateRange, setGranularity, setTitle]);

  const canFetch = Boolean(metric && dateRange);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    getTimeSeries({ metric: metric!, dateRange: dateRange!, granularity }).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [metric, dateRange, granularity, canFetch]);

  if (!canFetch || !data) {
    return <Skeleton title={title} />;
  }

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
            value={metric!}
            options={METRIC_OPTIONS}
            onChange={(v) => setMetric(v as typeof metric)}
          />
          <FilterSelect
            value={dateRange!}
            options={DATE_RANGE_OPTIONS}
            onChange={(v) => setDateRange(v as typeof dateRange)}
          />
        </div>
      </div>
      <div className="h-[calc(100%-2.5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 100%, 62%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 100%, 62%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 100%, 62%)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="hsl(220, 100%, 62%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="date"
              stroke="var(--muted-foreground)"
              fontSize={10}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={10}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--foreground)",
              }}
            />
            {props.compareToLast && (
              <Area
                type="monotone"
                dataKey="previousValue"
                stroke="hsl(220, 100%, 62%)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                fill="url(#prevGradient)"
                name="Previous"
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(220, 100%, 62%)"
              strokeWidth={2}
              fill="url(#areaGradient)"
              name="Current"
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
