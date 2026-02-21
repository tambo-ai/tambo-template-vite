"use client";

import { DATE_RANGE_OPTIONS, FilterSelect } from "@/components/dashboard/filter-select";
import { getFunnelData, type FunnelStep } from "@/services/dashboard-data";
import { useTamboComponentState } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v3";

export const funnelChartSchema = z.object({
  title: z.string().optional().describe("Chart title"),
  dateRange: z
    .enum(["7d", "30d", "90d", "12m", "all"])
    .describe("Time range"),
  steps: z
    .array(z.string())
    .optional()
    .describe("Custom funnel step names. Default: signup funnel"),
});

export const funnelChartStateSchema = z.object({
  dateRange: funnelChartSchema.shape.dateRange,
  steps: funnelChartSchema.shape.steps,
  title: funnelChartSchema.shape.title,
});

export type FunnelChartProps = z.infer<typeof funnelChartSchema>;

const FUNNEL_COLORS = [
  "bg-blue-500",
  "bg-blue-400",
  "bg-blue-300",
  "bg-blue-200",
  "bg-blue-100",
];

function Skeleton({ title }: { title?: string }) {
  return (
    <div className="p-4 h-64">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="animate-pulse space-y-2 mt-4">
        {[100, 70, 45, 25].map((w, i) => (
          <div
            key={i}
            className="h-10 bg-muted rounded mx-auto"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function FunnelChartBase(props: FunnelChartProps) {
  const [data, setData] = useState<FunnelStep[] | null>(null);
  const [dateRange, setDateRange] = useTamboComponentState("dateRange", props.dateRange);
  const [steps] = useTamboComponentState("steps", props.steps);
  const [title, setTitle] = useTamboComponentState("title", props.title);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (props.dateRange) setDateRange(props.dateRange);
    if (props.title !== undefined) setTitle(props.title);
  }, [props.dateRange, props.title, setDateRange, setTitle]);

  const canFetch = Boolean(dateRange);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    getFunnelData({ dateRange: dateRange!, steps }).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [dateRange, steps, canFetch]);

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
        <FilterSelect
          value={dateRange!}
          options={DATE_RANGE_OPTIONS}
          onChange={(v) => setDateRange(v as typeof dateRange)}
          className="ml-auto"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        {data.map((step, i) => (
          <div key={step.name} className="relative">
            <div className="flex items-center gap-3">
              {/* Bar */}
              <div className="flex-1 relative">
                <div
                  className={`h-10 rounded-md ${FUNNEL_COLORS[i % FUNNEL_COLORS.length]} transition-all duration-500 flex items-center px-3`}
                  style={{ width: `${Math.max(step.percent, 8)}%` }}
                >
                  <span className="text-xs font-medium text-white truncate">
                    {step.name}
                  </span>
                </div>
              </div>
              {/* Stats */}
              <div className="text-right min-w-[80px] shrink-0">
                <span className="text-sm font-mono font-medium text-foreground">
                  {new Intl.NumberFormat("en-US").format(step.value)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({step.percent}%)
                </span>
              </div>
            </div>
            {/* Dropoff arrow */}
            {step.dropoff > 0 && (
              <div className="absolute -right-0 top-full text-[10px] text-red-400 font-mono mt-[-2px] mr-[80px] text-right">
                ↓{step.dropoff}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
