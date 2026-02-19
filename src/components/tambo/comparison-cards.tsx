"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod/v3";

export const comparisonCardsSchema = z.object({
  title: z.string().optional().describe("Optional title above the cards"),
  cards: z
    .array(
      z.object({
        label: z
          .string()
          .describe("Card header, e.g. 'What people think'"),
        value: z
          .string()
          .describe("Primary value to display, e.g. '$22,000'"),
        description: z
          .string()
          .optional()
          .describe("Explanation text below the value"),
        variant: z
          .enum(["default", "highlight", "muted"])
          .optional()
          .describe(
            "Visual treatment: 'highlight' for emphasis, 'muted' for the wrong option",
          ),
      }),
    )
    .describe("Cards to compare side by side"),
  delta: z
    .object({
      label: z.string().describe("Delta label, e.g. 'You actually save'"),
      value: z.string().describe("Delta value, e.g. '+$4,600'"),
      positive: z
        .boolean()
        .describe("Whether this delta is positive (green) or negative (red)"),
    })
    .optional()
    .describe("Optional delta badge between the cards"),
});

export type ComparisonCardsProps = z.infer<typeof comparisonCardsSchema>;

export const ComparisonCards = React.forwardRef<
  HTMLDivElement,
  ComparisonCardsProps
>(({ title, cards, delta }, ref) => {
  if (!cards || cards.length === 0) {
    return (
      <div ref={ref} className="w-full rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Awaiting data...</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full">
      {title && (
        <h3 className="text-base font-semibold text-foreground mb-3">
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border p-4 transition-all",
              card.variant === "highlight" &&
                "border-primary/40 bg-primary/5",
              card.variant === "muted" &&
                "border-border/50 bg-muted/30 opacity-70",
              (!card.variant || card.variant === "default") &&
                "border-border bg-card",
            )}
          >
            <p
              className={cn(
                "text-xs font-medium uppercase tracking-wider mb-2",
                card.variant === "highlight"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {card.label}
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                card.variant === "muted"
                  ? "line-through text-muted-foreground"
                  : "text-foreground",
              )}
            >
              {card.value}
            </p>
            {card.description && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {card.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {delta && (
        <div className="flex justify-center mt-3">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
              delta.positive
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            <span>{delta.positive ? "↓" : "↑"}</span>
            <span>{delta.label}:</span>
            <span>{delta.value}</span>
          </div>
        </div>
      )}
    </div>
  );
});

ComparisonCards.displayName = "ComparisonCards";
