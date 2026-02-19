"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod/v3";

export const bracketWaterfallSchema = z.object({
  title: z.string().describe("Chart title"),
  income: z.number().describe("Total income to visualize"),
  segments: z
    .array(
      z.object({
        label: z.string().describe("Bracket label like '10% bracket'"),
        amount: z
          .number()
          .describe("Amount of income taxed at this rate"),
        tax: z.number().describe("Tax paid on this segment"),
        rate: z.number().describe("Tax rate as decimal, e.g. 0.10"),
        color: z.string().optional().describe("Optional color for segment"),
      }),
    )
    .describe("Income segments by bracket"),
  marker: z
    .number()
    .optional()
    .describe("Income level to mark with an indicator line"),
});

export type BracketWaterfallProps = z.infer<typeof bracketWaterfallSchema>;

const BRACKET_COLORS = [
  "hsl(142, 76%, 46%)", // Green - 10%
  "hsl(160, 64%, 43%)", // Teal - 12%
  "hsl(200, 80%, 50%)", // Blue - 22%
  "hsl(230, 70%, 56%)", // Indigo - 24%
  "hsl(262, 60%, 55%)", // Purple - 32%
  "hsl(330, 65%, 52%)", // Pink - 35%
  "hsl(0, 72%, 51%)",   // Red - 37%
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

export const BracketWaterfall = React.forwardRef<
  HTMLDivElement,
  BracketWaterfallProps
>(({ title, income, segments, marker }, ref) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (!segments || segments.length === 0) {
    return (
      <div ref={ref} className="w-full rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Building chart...</p>
      </div>
    );
  }

  const totalTax = segments.reduce((sum, s) => sum + s.tax, 0);

  return (
    <div ref={ref} className="w-full rounded-lg border border-border p-4">
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Total income: {fmt(income)} · Total tax: {fmt(totalTax)}
      </p>

      {/* Stacked bar built with divs for direct hover control */}
      <div
        className="w-full h-16 rounded-md overflow-hidden flex mb-4"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {segments.map((seg, i) => {
          const color = seg.color ?? BRACKET_COLORS[i % BRACKET_COLORS.length];
          return (
            <div
              key={i}
              className="h-full transition-opacity duration-150 cursor-default relative"
              style={{
                width: `${(seg.amount / income) * 100}%`,
                backgroundColor: color,
                opacity: activeIndex === null || activeIndex === i ? 1 : 0.3,
                borderRadius:
                  i === 0 && i === segments.length - 1
                    ? "6px"
                    : i === 0
                      ? "6px 0 0 6px"
                      : i === segments.length - 1
                        ? "0 6px 6px 0"
                        : undefined,
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {/* Marker line */}
              {marker !== undefined && (() => {
                const segStart = segments.slice(0, i).reduce((s, seg) => s + seg.amount, 0);
                const segEnd = segStart + seg.amount;
                if (marker >= segStart && marker <= segEnd) {
                  const pct = ((marker - segStart) / seg.amount) * 100;
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                      style={{ left: `${pct}%`, opacity: 0.6 }}
                    />
                  );
                }
                return null;
              })()}
            </div>
          );
        })}
      </div>

      {/* Legend — highlight matches active segment */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-150 cursor-default",
              activeIndex === null || activeIndex === i
                ? "text-foreground"
                : "text-muted-foreground/40",
            )}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{
                backgroundColor:
                  seg.color ?? BRACKET_COLORS[i % BRACKET_COLORS.length],
              }}
            />
            <span>
              {fmtPct(seg.rate)}: {fmt(seg.amount)}
              <span className="opacity-60"> → {fmt(seg.tax)} tax</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

BracketWaterfall.displayName = "BracketWaterfall";
