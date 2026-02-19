"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod/v3";

export const deductionTableSchema = z.object({
  title: z.string().describe("Table title, e.g. 'Found Deductions'"),
  deductions: z
    .array(
      z.object({
        name: z.string().describe("Deduction name"),
        amount: z.number().describe("Deduction amount in dollars"),
        annualSavings: z
          .number()
          .describe("Annual tax savings from this deduction"),
        applicable: z
          .boolean()
          .describe("Whether this deduction applies to the user"),
        reason: z
          .string()
          .optional()
          .describe(
            "Why this deduction does or doesn't apply",
          ),
      }),
    )
    .describe("List of found deductions"),
  totalSavings: z
    .number()
    .optional()
    .describe("Total annual savings from all applicable deductions"),
});

export type DeductionTableProps = z.infer<typeof deductionTableSchema>;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const DeductionTable = React.forwardRef<
  HTMLDivElement,
  DeductionTableProps
>(({ title, deductions, totalSavings }, ref) => {
  if (!deductions || deductions.length === 0) {
    return (
      <div ref={ref} className="w-full rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Awaiting data...</p>
      </div>
    );
  }

  const applicableDeductions = deductions.filter((d) => d.applicable);
  const computedTotal =
    totalSavings ??
    applicableDeductions.reduce((sum, d) => sum + d.annualSavings, 0);

  return (
    <div
      ref={ref}
      className="w-full rounded-lg border border-border overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                Deduction
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                Annual Savings
              </th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((d, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/50 last:border-b-0",
                  !d.applicable && "opacity-50",
                )}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        d.applicable
                          ? "bg-green-500"
                          : "bg-muted-foreground/30",
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-foreground",
                          !d.applicable && "text-muted-foreground",
                        )}
                      >
                        {d.name}
                      </p>
                      {d.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {d.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right font-mono",
                    d.applicable
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {d.amount > 0 ? fmt(d.amount) : "—"}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right font-mono",
                    d.applicable
                      ? "text-green-600 dark:text-green-400 font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {d.applicable && d.annualSavings > 0
                    ? fmt(d.annualSavings)
                    : "—"}
                </td>
              </tr>
            ))}

            {/* Total row */}
            {computedTotal > 0 && (
              <tr className="bg-green-500/5 border-t border-border">
                <td className="px-4 py-2.5 font-semibold text-foreground">
                  Total Savings
                </td>
                <td />
                <td className="px-4 py-2.5 text-right font-mono font-bold text-green-600 dark:text-green-400">
                  {fmt(computedTotal)}/yr
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DeductionTable.displayName = "DeductionTable";
