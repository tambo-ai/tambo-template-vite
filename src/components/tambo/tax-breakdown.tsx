"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod/v3";

export const taxBreakdownSchema = z.object({
  title: z.string().describe("Dashboard title"),
  grossIncome: z.number().describe("Gross annual income"),
  deductions: z
    .array(
      z.object({
        label: z.string().describe("Deduction name"),
        amount: z.number().describe("Deduction amount"),
      }),
    )
    .describe("List of deductions applied"),
  taxableIncome: z.number().describe("Income after deductions"),
  federalTax: z.number().describe("Total federal income tax"),
  ficaTax: z.number().describe("FICA taxes (Social Security + Medicare)"),
  effectiveRate: z.number().describe("Effective tax rate as decimal"),
  marginalRate: z.number().describe("Marginal tax rate as decimal"),
  takeHome: z.number().describe("Annual take-home pay"),
  brackets: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number(),
        tax: z.number(),
        rate: z.number(),
      }),
    )
    .describe("Bracket breakdown for the waterfall chart"),
});

export type TaxBreakdownProps = z.infer<typeof taxBreakdownSchema>;

const BRACKET_COLORS = [
  "hsl(142, 76%, 46%)",
  "hsl(160, 64%, 43%)",
  "hsl(200, 80%, 50%)",
  "hsl(230, 70%, 56%)",
  "hsl(262, 60%, 55%)",
  "hsl(330, 65%, 52%)",
  "hsl(0, 72%, 51%)",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const TaxBreakdown = React.forwardRef<HTMLDivElement, TaxBreakdownProps>(
  (
    {
      title,
      grossIncome,
      deductions,
      taxableIncome,
      federalTax,
      ficaTax,
      effectiveRate,
      marginalRate,
      takeHome,
      brackets,
    },
    ref,
  ) => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    if (!grossIncome) {
      return (
        <div ref={ref} className="w-full rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Awaiting data...</p>
        </div>
      );
    }

    // Income flow bar data
    const flowSegments = [
      { name: "Taxable Income", value: taxableIncome, color: "hsl(200, 80%, 50%)" },
      ...deductions.map((d, i) => ({
        name: d.label,
        value: d.amount,
        color: `hsl(${30 + i * 25}, 60%, 55%)`,
      })),
    ];

    const monthlyTakeHome = Math.round(takeHome / 12);

    return (
      <div ref={ref} className="w-full rounded-lg border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>

        {/* Income Flow Bar */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Income Flow
          </p>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground mb-1.5">
            <span className="font-mono">{fmt(grossIncome)}</span>
            {deductions.map((d, i) => (
              <React.Fragment key={i}>
                <span>→</span>
                <span className="text-foreground/60 whitespace-nowrap">-{fmt(d.amount)} <span className="text-muted-foreground/60">({d.label})</span></span>
              </React.Fragment>
            ))}
            <span>→</span>
            <span className="font-mono font-semibold text-foreground">
              {fmt(taxableIncome)}
            </span>
          </div>
          <div className="w-full h-6 rounded-md overflow-hidden flex">
            {flowSegments.map((seg, i) => (
              <div
                key={i}
                className="h-full relative group"
                style={{
                  width: `${(seg.value / grossIncome) * 100}%`,
                  backgroundColor: seg.color,
                  opacity: i === 0 ? 1 : 0.5,
                }}
                title={`${seg.name}: ${fmt(seg.value)}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(200, 80%, 50%)" }} />
              <span className="text-muted-foreground">Taxable: {fmt(taxableIncome)}</span>
            </div>
            {deductions.map((d, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: `hsl(${30 + i * 25}, 60%, 55%)`, opacity: 0.5 }}
                />
                <span className="text-muted-foreground">{d.label}: {fmt(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bracket Waterfall */}
        {brackets.length > 0 && (
          <div className="px-4 py-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Tax by Bracket
            </p>
            <div
              className="w-full h-14 rounded-md overflow-hidden flex"
              onMouseLeave={() => setActiveIndex(null)}
            >
              {brackets.map((seg, i) => (
                <div
                  key={i}
                  className="h-full transition-opacity duration-150 cursor-default"
                  style={{
                    width: `${(seg.amount / taxableIncome) * 100}%`,
                    backgroundColor: BRACKET_COLORS[i % BRACKET_COLORS.length],
                    opacity: activeIndex === null || activeIndex === i ? 1 : 0.3,
                    borderRadius:
                      i === 0 && i === brackets.length - 1
                        ? "6px"
                        : i === 0
                          ? "6px 0 0 6px"
                          : i === brackets.length - 1
                            ? "0 6px 6px 0"
                            : undefined,
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {brackets.map((seg, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-[10px] transition-colors duration-150 cursor-default",
                    activeIndex === null || activeIndex === i
                      ? "text-foreground"
                      : "text-muted-foreground/40",
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-sm mr-1 align-middle"
                    style={{
                      backgroundColor: BRACKET_COLORS[i % BRACKET_COLORS.length],
                    }}
                  />
                  {(seg.rate * 100).toFixed(0)}%: {fmt(seg.amount)} → {fmt(seg.tax)} tax
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50 border-t border-border/50">
          <StatCard label="Federal Tax" value={fmt(federalTax)} />
          <StatCard label="FICA" value={fmt(ficaTax)} />
          <StatCard label="Effective Rate" value={fmtPct(effectiveRate)} />
          <StatCard
            label="Take-Home"
            value={fmt(takeHome)}
            sub={`${fmt(monthlyTakeHome)}/mo`}
          />
        </div>
      </div>
    );
  },
);

TaxBreakdown.displayName = "TaxBreakdown";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-card p-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold text-foreground mt-0.5 font-mono">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}
