"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod/v3";

export const taxComparisonSchema = z.object({
  title: z.string().describe("Comparison title"),
  before: z
    .object({
      label: z.string().describe("Label for before state, e.g. 'Current'"),
      federalTax: z.number(),
      effectiveRate: z.number(),
      takeHome: z.number(),
    })
    .describe("Before optimization numbers"),
  after: z
    .object({
      label: z.string().describe("Label for after state, e.g. 'Optimized'"),
      federalTax: z.number(),
      effectiveRate: z.number(),
      takeHome: z.number(),
    })
    .describe("After optimization numbers"),
  annualSavings: z.number().describe("Total annual savings"),
  monthlySavings: z.number().describe("Total monthly savings"),
});

export type TaxComparisonProps = z.infer<typeof taxComparisonSchema>;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

function DeltaArrow({
  before,
  after,
  isCurrency,
}: {
  before: number;
  after: number;
  isCurrency?: boolean;
}) {
  const diff = after - before;
  if (Math.abs(diff) < 0.001) return null;

  // For take-home: up is good. For tax/rate: down is good.
  const isGood = isCurrency ? diff > 0 : diff < 0;

  return (
    <span
      className={cn(
        "text-xs font-medium ml-1",
        isGood ? "text-green-600 dark:text-green-400" : "text-red-500",
      )}
    >
      {diff > 0 ? "↑" : "↓"}
    </span>
  );
}

export const TaxComparison = React.forwardRef<
  HTMLDivElement,
  TaxComparisonProps
>(({ title, before, after, annualSavings, monthlySavings }, ref) => {
  if (!before || !after) {
    return (
      <div ref={ref} className="w-full rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Awaiting data...</p>
      </div>
    );
  }

  const rows = [
    {
      label: "Federal Tax",
      beforeVal: fmt(before.federalTax),
      afterVal: fmt(after.federalTax),
      beforeNum: before.federalTax,
      afterNum: after.federalTax,
      isGoodWhenLower: true,
    },
    {
      label: "Effective Rate",
      beforeVal: fmtPct(before.effectiveRate),
      afterVal: fmtPct(after.effectiveRate),
      beforeNum: before.effectiveRate,
      afterNum: after.effectiveRate,
      isGoodWhenLower: true,
    },
    {
      label: "Take-Home",
      beforeVal: fmt(before.takeHome),
      afterVal: fmt(after.takeHome),
      beforeNum: before.takeHome,
      afterNum: after.takeHome,
      isGoodWhenLower: false,
    },
  ];

  return (
    <div ref={ref} className="w-full rounded-lg border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/50 mx-4 rounded-lg overflow-hidden mb-3">
        {/* Before */}
        <div className="bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {before.label}
          </p>
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between items-center py-1">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm font-mono text-foreground">
                {row.beforeVal}
              </span>
            </div>
          ))}
        </div>

        {/* After */}
        <div className="bg-card p-3">
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
            {after.label}
          </p>
          {rows.map((row) => {
            const diff = row.afterNum - row.beforeNum;
            const isChanged = Math.abs(diff) > 0.001;
            const isGood = row.isGoodWhenLower ? diff < 0 : diff > 0;

            return (
              <div key={row.label} className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">{row.label}</span>
                <span
                  className={cn(
                    "text-sm font-mono",
                    isChanged && isGood
                      ? "text-green-600 dark:text-green-400 font-semibold"
                      : "text-foreground",
                  )}
                >
                  {row.afterVal}
                  {isChanged && (
                    <DeltaArrow
                      before={row.beforeNum}
                      after={row.afterNum}
                      isCurrency={!row.isGoodWhenLower}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings badge */}
      <div className="flex justify-center pb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            />
          </svg>
          <span className="text-sm font-semibold">
            +{fmt(annualSavings)}/yr
          </span>
          <span className="text-xs opacity-70">
            (+{fmt(monthlySavings)}/mo)
          </span>
        </div>
      </div>
    </div>
  );
});

TaxComparison.displayName = "TaxComparison";
