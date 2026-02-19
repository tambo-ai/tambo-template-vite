"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Check } from "lucide-react";
import { z } from "zod/v3";

const deadlineSchema = z.object({
  date: z.string().describe("Date string, e.g. 'January 15, 2025'"),
  label: z.string().describe("Short deadline label"),
  description: z.string().optional().describe("Additional detail"),
  category: z
    .enum(["filing", "estimated", "extension", "other"])
    .describe("Category determines dot color"),
  isPast: z
    .boolean()
    .optional()
    .describe("Whether this deadline has already passed"),
});

export const taxTimelineSchema = z.object({
  title: z.string().describe("Timeline title"),
  deadlines: z.array(deadlineSchema).describe("Ordered list of deadlines"),
  highlightNext: z
    .boolean()
    .optional()
    .describe("Whether to highlight the next upcoming deadline"),
});

export type TaxTimelineProps = z.infer<typeof taxTimelineSchema>;

const CATEGORY_COLORS: Record<string, { dot: string; ring: string; text: string }> = {
  filing: {
    dot: "bg-primary",
    ring: "ring-primary/30",
    text: "text-primary",
  },
  estimated: {
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    text: "text-blue-500",
  },
  extension: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-500",
  },
  other: {
    dot: "bg-muted-foreground",
    ring: "ring-muted-foreground/30",
    text: "text-muted-foreground",
  },
};

export const TaxTimeline = React.forwardRef<HTMLDivElement, TaxTimelineProps>(
  ({ title, deadlines, highlightNext = true }, ref) => {
    if (!deadlines || deadlines.length === 0) {
      return (
        <div ref={ref} className="w-full rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Awaiting data...</p>
        </div>
      );
    }

    // Find the first non-past deadline
    const nextIndex = highlightNext
      ? deadlines.findIndex((d) => !d.isPast)
      : -1;

    return (
      <div
        ref={ref}
        className="w-full rounded-lg border border-border overflow-hidden"
      >
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>

        {/* Legend */}
        <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
          {(["filing", "estimated", "extension", "other"] as const).map(
            (cat) => {
              const colors = CATEGORY_COLORS[cat];
              const hasCategory = deadlines.some((d) => d.category === cat);
              if (!hasCategory) return null;
              return (
                <div key={cat} className="flex items-center gap-1.5 text-xs">
                  <div
                    className={cn("w-2 h-2 rounded-full", colors.dot)}
                  />
                  <span className="text-muted-foreground capitalize">
                    {cat}
                  </span>
                </div>
              );
            },
          )}
        </div>

        {/* Timeline */}
        <div className="px-4 pb-4">
          <div className="relative">
            {deadlines.map((deadline, i) => {
              const colors = CATEGORY_COLORS[deadline.category] ?? CATEGORY_COLORS.other;
              const isPast = deadline.isPast ?? false;
              const isNext = i === nextIndex;

              return (
                <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Vertical line */}
                  {i < deadlines.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-[9px] top-5 bottom-0 w-px",
                        isPast
                          ? "bg-border"
                          : "bg-border/50",
                      )}
                    />
                  )}

                  {/* Dot */}
                  <div className="relative shrink-0 mt-0.5">
                    {isPast ? (
                      <div className="w-[18px] h-[18px] rounded-full bg-muted flex items-center justify-center">
                        <Check className="w-3 h-3 text-muted-foreground" />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "w-[18px] h-[18px] rounded-full flex items-center justify-center",
                          isNext && "ring-4 animate-pulse",
                          isNext && colors.ring,
                        )}
                      >
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            colors.dot,
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 min-w-0 rounded-md px-3 py-2 -mt-0.5",
                      isNext && "bg-accent/50 border border-border/50",
                      isPast && "opacity-60",
                    )}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className={cn(
                          "font-mono text-xs shrink-0",
                          isPast
                            ? "text-muted-foreground line-through"
                            : colors.text,
                        )}
                      >
                        {deadline.date}
                      </span>
                      {isNext && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Next
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-medium mt-0.5",
                        isPast
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {deadline.label}
                    </p>
                    {deadline.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {deadline.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);

TaxTimeline.displayName = "TaxTimeline";
