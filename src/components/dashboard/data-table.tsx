"use client";

import { DATE_RANGE_OPTIONS, FilterSelect } from "@/components/dashboard/filter-select";
import { getTableRows, type TableData } from "@/services/dashboard-data";
import { useTamboComponentState } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v3";

export const dataTableSchema = z.object({
  title: z.string().optional().describe("Table title"),
  entity: z
    .enum(["signups", "transactions", "events", "users"])
    .describe("What data to show"),
  dateRange: z
    .enum(["7d", "30d", "90d", "12m", "all"])
    .describe("Time range"),
  sortBy: z.string().optional().describe("Column to sort by"),
  sortDirection: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction"),
  limit: z.number().optional().describe("Rows to display. Default 10"),
  columns: z
    .array(z.string())
    .optional()
    .describe("Which columns to show. Default: all for entity"),
});

export const dataTableStateSchema = z.object({
  entity: dataTableSchema.shape.entity,
  dateRange: dataTableSchema.shape.dateRange,
  sortBy: dataTableSchema.shape.sortBy,
  sortDirection: dataTableSchema.shape.sortDirection,
  limit: dataTableSchema.shape.limit,
  columns: dataTableSchema.shape.columns,
  title: dataTableSchema.shape.title,
});

export type DataTableProps = z.infer<typeof dataTableSchema>;

const ENTITY_OPTIONS = [
  { value: "signups", label: "Signups" },
  { value: "transactions", label: "Transactions" },
  { value: "events", label: "Events" },
  { value: "users", label: "Users" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500",
  trial: "bg-blue-500/10 text-blue-500",
  churned: "bg-red-500/10 text-red-500",
  pending: "bg-amber-500/10 text-amber-500",
};

function Skeleton({ title }: { title?: string }) {
  return (
    <div className="p-4">
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-muted rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted/50 rounded" />
        ))}
      </div>
    </div>
  );
}

function CellValue({ value, columnKey }: { value: string | number; columnKey: string }) {
  if (columnKey === "status" && typeof value === "string" && STATUS_BADGE[value]) {
    return (
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[value]}`}
      >
        {value}
      </span>
    );
  }

  if (columnKey === "amount" && typeof value === "number") {
    return (
      <span className="font-mono">
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)}
      </span>
    );
  }

  return <>{String(value)}</>;
}

export function DataTableBase(props: DataTableProps) {
  const [data, setData] = useState<TableData | null>(null);
  const [entity, setEntity] = useTamboComponentState("entity", props.entity);
  const [dateRange, setDateRange] = useTamboComponentState("dateRange", props.dateRange);
  const [sortBy] = useTamboComponentState("sortBy", props.sortBy);
  const [sortDirection] = useTamboComponentState("sortDirection", props.sortDirection);
  const [limit] = useTamboComponentState("limit", props.limit);
  const [columns] = useTamboComponentState("columns", props.columns);
  const [title, setTitle] = useTamboComponentState("title", props.title);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (props.entity) setEntity(props.entity);
    if (props.dateRange) setDateRange(props.dateRange);
    if (props.title !== undefined) setTitle(props.title);
  }, [props.entity, props.dateRange, props.title, setEntity, setDateRange, setTitle]);

  const canFetch = Boolean(entity && dateRange);

  useEffect(() => {
    if (!canFetch) return;
    let cancelled = false;
    getTableRows({ entity: entity!, dateRange: dateRange!, sortBy, sortDirection, limit, columns }).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [entity, dateRange, sortBy, sortDirection, limit, columns, canFetch]);

  if (!canFetch || !data) {
    return <Skeleton title={title} />;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          {title && (
            <h3 className="text-sm font-semibold text-foreground">
              {title}
            </h3>
          )}
          <span className="text-xs text-muted-foreground">
            {data.total} total
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FilterSelect
            value={entity!}
            options={ENTITY_OPTIONS}
            onChange={(v) => setEntity(v as typeof entity)}
          />
          <FilterSelect
            value={dateRange!}
            options={DATE_RANGE_OPTIONS}
            onChange={(v) => setDateRange(v as typeof dateRange)}
          />
        </div>
      </div>
      <div className="rounded-md border border-border/50 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {data.columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-3 py-2 font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
              >
                {data.columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 text-foreground/80"
                  >
                    <CellValue value={row[col.key]} columnKey={col.key} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
