"use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod/v3";

export const actionItemsSchema = z.object({
  title: z
    .string()
    .describe("Card title, e.g. 'Recommended Next Steps'"),
  items: z
    .array(
      z.object({
        action: z.string().describe("What to do"),
        savings: z
          .string()
          .optional()
          .describe("How much this saves, e.g. '$912/yr'"),
        note: z
          .string()
          .optional()
          .describe("Additional context or tradeoff note"),
        priority: z
          .enum(["high", "medium", "low"])
          .optional()
          .describe("Visual priority indicator"),
      }),
    )
    .describe("List of action items"),
});

export type ActionItemsProps = z.infer<typeof actionItemsSchema>;

type ActionItemsState = {
  checked: Record<number, boolean>;
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-l-green-500",
  medium: "border-l-yellow-500",
  low: "border-l-muted-foreground/30",
};

export const ActionItems = React.forwardRef<HTMLDivElement, ActionItemsProps>(
  ({ title, items }, ref) => {
    const [state, setState] = useTamboComponentState<ActionItemsState>(
      "action-items",
      { checked: {} },
    );

    if (!items || items.length === 0) {
      return (
        <div ref={ref} className="w-full rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Awaiting data...</p>
        </div>
      );
    }

    const toggleItem = (index: number) => {
      if (!state) return;
      setState({
        checked: {
          ...state.checked,
          [index]: !state.checked[index],
        },
      });
    };

    return (
      <div ref={ref} className="w-full rounded-lg border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {items.map((item, i) => {
            const isChecked = state?.checked[i] ?? false;
            const priorityClass =
              PRIORITY_STYLES[item.priority ?? "medium"];

            return (
              <div
                key={i}
                className={cn(
                  "border border-border/50 rounded-lg p-3 border-l-[3px] transition-all cursor-pointer",
                  priorityClass,
                  isChecked && "opacity-60",
                )}
                onClick={() => toggleItem(i)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={cn(
                        "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isChecked
                          ? "bg-primary border-primary"
                          : "border-border",
                      )}
                    >
                      {isChecked && (
                        <svg
                          className="w-2.5 h-2.5 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm text-foreground",
                          isChecked && "line-through",
                        )}
                      >
                        {item.action}
                      </p>
                      {item.savings && (
                        <span className="shrink-0 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                          {item.savings}
                        </span>
                      )}
                    </div>
                    {item.note && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

ActionItems.displayName = "ActionItems";
