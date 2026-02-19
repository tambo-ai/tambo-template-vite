"use client";

import { cn } from "@/lib/utils";
import { useTaxContext } from "@/lib/tax-context";
import * as React from "react";
import { z } from "zod/v3";

export const stateSummaryCardSchema = z.object({
  title: z.string().describe("Card title"),
  stateName: z.string().describe("Full state name"),
  stateAbbreviation: z.string().describe("Two-letter state abbreviation"),
  taxType: z
    .enum(["none", "flat", "progressive"])
    .describe("Type of state income tax"),
  stateTax: z.number().describe("Calculated state income tax amount"),
  stateEffectiveRate: z
    .number()
    .describe("State effective tax rate as decimal"),
  topRate: z.number().optional().describe("Top marginal state rate as decimal"),
  brackets: z
    .array(
      z.object({
        min: z.number(),
        max: z.number(),
        rate: z.number(),
        taxableAmount: z.number(),
        tax: z.number(),
      }),
    )
    .optional()
    .describe("Bracket breakdown for progressive states"),
  federalTax: z
    .number()
    .optional()
    .describe(
      "Override federal tax. If omitted, reads from shared TaxCalculator context.",
    ),
  grossIncome: z
    .number()
    .optional()
    .describe(
      "Override gross income. If omitted, reads from shared TaxCalculator context.",
    ),
  standardDeduction: z
    .number()
    .optional()
    .describe("State standard deduction applied"),
  notableCredits: z
    .array(z.string())
    .optional()
    .describe("Notable state tax credits or notes"),
});

export type StateSummaryCardProps = z.infer<typeof stateSummaryCardSchema>;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const StateSummaryCard = React.forwardRef<
  HTMLDivElement,
  StateSummaryCardProps
>(
  (
    {
      title,
      stateName,
      stateAbbreviation,
      taxType,
      stateTax,
      stateEffectiveRate,
      topRate,
      brackets,
      federalTax: propFederalTax,
      grossIncome: propGrossIncome,
      standardDeduction,
      notableCredits,
    },
    ref,
  ) => {
    const taxCtx = useTaxContext();

    if (!stateName || !taxType) {
      return (
        <div ref={ref} className="w-full rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Awaiting data...</p>
        </div>
      );
    }

    const resolvedFederalTax =
      propFederalTax ??
      taxCtx.state.result?.federalTax ??
      0;
    const resolvedIncome =
      propGrossIncome ??
      (taxCtx.state.income > 0 ? taxCtx.state.income : 0);

    const combinedTax = resolvedFederalTax + stateTax;
    const combinedRate =
      resolvedIncome > 0
        ? Math.round((combinedTax / resolvedIncome) * 10000) / 10000
        : 0;

    const TAX_TYPE_BADGE: Record<string, { label: string; className: string }> = {
      none: {
        label: "No Income Tax",
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      },
      flat: {
        label: "Flat Rate",
        className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      },
      progressive: {
        label: "Progressive",
        className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      },
    };

    const badge = TAX_TYPE_BADGE[taxType];

    return (
      <div
        ref={ref}
        className="w-full rounded-lg border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-medium text-foreground">
              {stateName}
            </span>
            <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {stateAbbreviation}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </div>
        </div>

        {/* No-tax callout */}
        {taxType === "none" && (
          <div className="mx-4 mb-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-sm font-medium text-emerald-500">
              {stateName} does not levy a state income tax
            </p>
            <p className="text-xs text-emerald-500/70 mt-0.5">
              You only owe federal income tax and FICA
            </p>
          </div>
        )}

        {/* Flat rate display */}
        {taxType === "flat" && topRate !== undefined && (
          <div className="px-4 pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-foreground">
                {fmtPct(topRate)}
              </span>
              <span className="text-sm text-muted-foreground">flat rate</span>
            </div>
            {standardDeduction !== undefined && standardDeduction > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                After {fmt(standardDeduction)} standard deduction
              </p>
            )}
          </div>
        )}

        {/* Progressive bracket table */}
        {taxType === "progressive" && brackets && brackets.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Tax Brackets
            </p>
            <div className="rounded-md border border-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">
                      Rate
                    </th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">
                      Taxable
                    </th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">
                      Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {brackets.map((b, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border/30 last:border-0",
                        b.taxableAmount === 0 && "opacity-40",
                      )}
                    >
                      <td className="px-3 py-1.5 font-mono">
                        {fmtPct(b.rate)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {fmt(b.taxableAmount)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        {fmt(b.tax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {standardDeduction !== undefined && standardDeduction > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                After {fmt(standardDeduction)} state standard deduction
              </p>
            )}
          </div>
        )}

        {/* State tax amount + effective rate */}
        {taxType !== "none" && (
          <div className="grid grid-cols-2 gap-px bg-border/30 border-t border-border/50">
            <div className="bg-card p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                State Tax
              </p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {fmt(stateTax)}
              </p>
            </div>
            <div className="bg-card p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                State Eff. Rate
              </p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {fmtPct(stateEffectiveRate)}
              </p>
            </div>
          </div>
        )}

        {/* Combined federal + state */}
        {(resolvedFederalTax > 0 || taxType === "none") && (
          <div className="border-t border-border/50 px-4 py-3 bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Combined Federal + State
            </p>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xl font-bold font-mono text-foreground">
                  {fmt(combinedTax)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  total income tax
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-foreground">
                  {fmtPct(combinedRate)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  combined eff. rate
                </p>
              </div>
            </div>
            {resolvedFederalTax > 0 && taxType !== "none" && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-border/30 flex">
                  <div
                    className="h-full bg-primary/70"
                    style={{
                      width:
                        combinedTax > 0
                          ? `${(resolvedFederalTax / combinedTax) * 100}%`
                          : "0%",
                    }}
                    title={`Federal: ${fmt(resolvedFederalTax)}`}
                  />
                  <div
                    className="h-full bg-purple-500/70"
                    style={{
                      width:
                        combinedTax > 0
                          ? `${(stateTax / combinedTax) * 100}%`
                          : "0%",
                    }}
                    title={`State: ${fmt(stateTax)}`}
                  />
                </div>
              </div>
            )}
            {resolvedFederalTax > 0 && taxType !== "none" && (
              <div className="flex gap-4 mt-1.5">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary/70" />
                  <span className="text-muted-foreground">
                    Federal: {fmt(resolvedFederalTax)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm bg-purple-500/70" />
                  <span className="text-muted-foreground">
                    State: {fmt(stateTax)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notable credits */}
        {notableCredits && notableCredits.length > 0 && (
          <div className="border-t border-border/50 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Notable Credits & Notes
            </p>
            <ul className="space-y-1">
              {notableCredits.map((credit, i) => (
                <li
                  key={i}
                  className="text-xs text-foreground/80 flex items-start gap-1.5"
                >
                  <span className="text-muted-foreground mt-0.5 shrink-0">
                    &bull;
                  </span>
                  {credit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

StateSummaryCard.displayName = "StateSummaryCard";
