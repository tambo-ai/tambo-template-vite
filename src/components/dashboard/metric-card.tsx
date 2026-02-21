"use client";

import { DATE_RANGE_OPTIONS, FilterSelect } from "@/components/dashboard/filter-select";
import { getMetricsSummary, type MetricData } from "@/services/dashboard-data";
import { useTamboComponentState } from "@tambo-ai/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v3";

export const metricCardSchema = z.object({
  title: z.string().optional().describe("Override metric display name"),
  metric: z
    .enum(["mrr", "activeUsers", "churnRate", "arpu", "signups", "nps"])
    .describe("Which metric to display"),
  dateRange: z
    .enum(["7d", "30d", "90d", "12m", "all"])
    .describe("Time range for the metric"),
});

export const metricCardStateSchema = z.object({
  metric: metricCardSchema.shape.metric,
  dateRange: metricCardSchema.shape.dateRange,
  title: metricCardSchema.shape.title,
});

export type MetricCardProps = z.infer<typeof metricCardSchema>;

function formatValue(value: number, format: MetricData["format"]): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  }
}

function Skeleton({ title }: { title?: string }) {
  return (
    <div className="p-4 min-h-[120px]">
      {title && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </p>
      )}
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="h-6 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

export function MetricCardBase(props: MetricCardProps) {
  const [data, setData] = useState<MetricData | null>(null);
  const [metric, setMetric] = useTamboComponentState("metric", props.metric);
  const [dateRange, setDateRange] = useTamboComponentState("dateRange", props.dateRange);
  const [title, setTitle] = useTamboComponentState("title", props.title);

  // Sync props → state (skip first mount to avoid render cascade)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (props.metric) setMetric(props.metric);
    if (props.dateRange) setDateRange(props.dateRange);
    if (props.title !== undefined) setTitle(props.title);
  }, [props.metric, props.dateRange, props.title, setMetric, setDateRange, setTitle]);

  const canFetch = Boolean(metric && dateRange);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    getMetricsSummary({ metric: metric!, dateRange: dateRange! }).then(
      (d) => {
        if (!cancelled) setData(d);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [metric, dateRange, canFetch]);

  if (!canFetch || !data) {
    return <Skeleton title={title} />;
  }

  const isPositive = data.changePercent >= 0;
  const isGood = metric === "churnRate" ? !isPositive : isPositive;

  const sparkMin = Math.min(...data.sparkline);
  const sparkMax = Math.max(...data.sparkline);
  const sparkRange = sparkMax - sparkMin || 1;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title ?? data.label}
        </p>
        <FilterSelect
          value={dateRange!}
          options={DATE_RANGE_OPTIONS}
          onChange={(v) => setDateRange(v as typeof dateRange)}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-foreground">
          {formatValue(data.value, data.format)}
        </span>
        <span
          className={`flex items-center gap-0.5 text-xs font-medium ${
            isGood ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(data.changePercent).toFixed(1)}%
        </span>
      </div>
      {/* Sparkline */}
      <div className="mt-3 h-8 flex items-end gap-[2px]">
        {data.sparkline.map((v, i) => {
          const height = ((v - sparkMin) / sparkRange) * 100;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${isGood ? "bg-emerald-500/30" : "bg-red-500/30"}`}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
