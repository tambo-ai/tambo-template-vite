"use client";

import { DATE_RANGE_OPTIONS, FilterSelect } from "@/components/dashboard/filter-select";
import { getBarRanking, type RankingItem } from "@/services/dashboard-data";
import { useTamboComponentState } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v3";

export const barChartSchema = z.object({
  title: z.string().optional().describe("Chart title"),
  dimension: z
    .enum(["feature", "page", "country", "plan", "referrer"])
    .describe("What to rank"),
  metric: z
    .enum(["usage", "revenue", "users", "sessions"])
    .optional()
    .describe("Metric to rank by. Default: usage"),
  dateRange: z
    .enum(["7d", "30d", "90d", "12m", "all"])
    .describe("Time range"),
  limit: z.number().optional().describe("How many items. Default 5"),
  sortDirection: z
    .enum(["desc", "asc"])
    .optional()
    .describe("Sort order. Default desc"),
});

export const barChartStateSchema = z.object({
  dimension: barChartSchema.shape.dimension,
  metric: barChartSchema.shape.metric,
  dateRange: barChartSchema.shape.dateRange,
  limit: barChartSchema.shape.limit,
  sortDirection: barChartSchema.shape.sortDirection,
  title: barChartSchema.shape.title,
});

export type DashboardBarChartProps = z.infer<typeof barChartSchema>;

const DIMENSION_OPTIONS = [
  { value: "feature", label: "Feature" },
  { value: "page", label: "Page" },
  { value: "country", label: "Country" },
  { value: "plan", label: "Plan" },
  { value: "referrer", label: "Referrer" },
];

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
];

function Skeleton({ title }: { title?: string }) {
  return (
    <div className="p-4 h-64">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="animate-pulse space-y-3 mt-4">
        {[80, 60, 45, 30, 20].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-4 bg-muted rounded" />
            <div className="flex-1 h-6 bg-muted rounded" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardBarChartBase(props: DashboardBarChartProps) {
  const [data, setData] = useState<RankingItem[] | null>(null);
  const [dimension, setDimension] = useTamboComponentState("dimension", props.dimension);
  const [metric] = useTamboComponentState("metric", props.metric);
  const [dateRange, setDateRange] = useTamboComponentState("dateRange", props.dateRange);
  const [limit] = useTamboComponentState("limit", props.limit);
  const [sortDirection] = useTamboComponentState("sortDirection", props.sortDirection);
  const [title, setTitle] = useTamboComponentState("title", props.title);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (props.dimension) setDimension(props.dimension);
    if (props.dateRange) setDateRange(props.dateRange);
    if (props.title !== undefined) setTitle(props.title);
  }, [props.dimension, props.dateRange, props.title, setDimension, setDateRange, setTitle]);

  const canFetch = Boolean(dimension && dateRange);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    getBarRanking({ dimension: dimension!, metric, dateRange: dateRange!, limit, sortDirection }).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [dimension, metric, dateRange, limit, sortDirection, canFetch]);

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
            value={dimension!}
            options={DIMENSION_OPTIONS}
            onChange={(v) => setDimension(v as typeof dimension)}
          />
          <FilterSelect
            value={dateRange!}
            options={DATE_RANGE_OPTIONS}
            onChange={(v) => setDateRange(v as typeof dateRange)}
          />
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground w-4 text-right shrink-0">
              {item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-foreground truncate">
                  {item.name}
                </span>
                <span className="text-xs font-mono text-muted-foreground ml-2 shrink-0">
                  {new Intl.NumberFormat("en-US", { notation: "compact" }).format(
                    item.value,
                  )}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${item.percentOfMax}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
