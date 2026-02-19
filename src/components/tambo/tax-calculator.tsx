"use client";

import { cn } from "@/lib/utils";
import { useTaxContext } from "@/lib/tax-context";
import {
  calculateFederalTax,
  STANDARD_DEDUCTIONS,
  type TaxResult,
} from "@/services/tax-calculator";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod/v3";

export const taxCalculatorSchema = z.object({
  title: z.string().describe("Form title"),
  income: z
    .number()
    .describe("Pre-filled gross income from conversation context"),
  defaultFilingStatus: z
    .enum(["single", "married_joint", "married_separate", "head_of_household"])
    .optional()
    .describe("Default filing status to pre-select"),
});

export type TaxCalculatorProps = z.infer<typeof taxCalculatorSchema>;

type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household";

export type TaxCalculatorState = {
  income: number;
  filingStatus: FilingStatus;
  contribution401k: number;
  contributionHSA: number;
  useStandardDeduction: boolean;
  result: TaxResult | null;
};

const FILING_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married_joint", label: "Married Joint" },
  { value: "married_separate", label: "Married Sep." },
  { value: "head_of_household", label: "Head of House" },
];

const MAX_401K = 23000;
const MAX_HSA = 4150;

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

export const TaxCalculator = React.forwardRef<
  HTMLDivElement,
  TaxCalculatorProps
>(({ title, income: initialIncome, defaultFilingStatus }, ref) => {
  const taxCtx = useTaxContext();

  const [state, setState] = useTamboComponentState<TaxCalculatorState>(
    "tax-calculator",
    {
      income: initialIncome || 0,
      filingStatus: defaultFilingStatus ?? "single",
      contribution401k: 0,
      contributionHSA: 0,
      useStandardDeduction: true,
      result: null,
    },
  );

  // Sync prop income into state when it arrives during streaming
  React.useEffect(() => {
    if (initialIncome && state && state.income === 0) {
      setState((prev) => (prev ? { ...prev, income: initialIncome } : prev));
    }
  }, [initialIncome]);

  // Compute tax results live
  React.useEffect(() => {
    if (!state || !state.income || state.income <= 0) return;

    const deductions: { label: string; amount: number }[] = [];
    if (state.contribution401k > 0) {
      deductions.push({ label: "401(k)", amount: state.contribution401k });
    }
    if (state.contributionHSA > 0) {
      deductions.push({ label: "HSA", amount: state.contributionHSA });
    }
    if (state.useStandardDeduction) {
      deductions.push({
        label: "Standard Deduction",
        amount: STANDARD_DEDUCTIONS[state.filingStatus],
      });
    }

    calculateFederalTax({
      grossIncome: state.income,
      filingStatus: state.filingStatus,
      deductions,
    }).then((result) => {
      setState((prev) => (prev ? { ...prev, result } : prev));
      // Write to shared context so other components can read it
      taxCtx.update({
        income: state.income,
        filingStatus: state.filingStatus,
        contribution401k: state.contribution401k,
        contributionHSA: state.contributionHSA,
        useStandardDeduction: state.useStandardDeduction,
        result,
      });
    });
  }, [
    state?.income,
    state?.filingStatus,
    state?.contribution401k,
    state?.contributionHSA,
    state?.useStandardDeduction,
  ]);

  if (!state) return null;

  const standardDeduction = STANDARD_DEDUCTIONS[state.filingStatus];
  const result = state.result;

  const updateField = <K extends keyof TaxCalculatorState>(
    key: K,
    value: TaxCalculatorState[K],
  ) => {
    setState({ ...state, [key]: value });
  };

  return (
    <div ref={ref} className="w-full rounded-lg border border-border overflow-visible">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>

      {/* Income Slider */}
      <div className="px-4 pb-3">
        <div className="flex items-baseline justify-between mb-1">
          <label className="text-xs font-medium text-muted-foreground">
            Annual Income
          </label>
          <span className="text-xl font-bold font-mono text-foreground">
            {fmt(state.income || 0)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={500000}
          step={5000}
          value={state.income || 0}
          onChange={(e) => updateField("income", Number(e.target.value) || 0)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-border accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-0.5">
          <span>$0</span>
          <span>$500k</span>
        </div>
      </div>

      {/* Filing Status */}
      <div className="px-4 pb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-2">
          Filing Status
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField("filingStatus", option.value)}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors border",
                state.filingStatus === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contributions */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">401(k)</label>
            <span className="text-xs font-mono text-foreground">{fmt(state.contribution401k)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_401K}
            step={500}
            value={state.contribution401k}
            onChange={(e) => updateField("contribution401k", Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-0.5">
            <span>$0</span>
            <span>{fmt(MAX_401K)}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">HSA</label>
            <span className="text-xs font-mono text-foreground">{fmt(state.contributionHSA)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_HSA}
            step={50}
            value={state.contributionHSA}
            onChange={(e) => updateField("contributionHSA", Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-0.5">
            <span>$0</span>
            <span>{fmt(MAX_HSA)}</span>
          </div>
        </div>
      </div>

      {/* Deduction toggle */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateField("useStandardDeduction", true)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              state.useStandardDeduction
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40",
            )}
          >
            Standard ({fmt(standardDeduction)})
          </button>
          <button
            type="button"
            onClick={() => updateField("useStandardDeduction", false)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              !state.useStandardDeduction
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40",
            )}
          >
            Itemized
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <>
          {/* Income Flow Bar */}
          <div className="px-4 py-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Income Flow</p>
            <IncomeFlowBar
              gross={state.income}
              deductions={[
                ...(state.contribution401k > 0
                  ? [{ label: "401(k)", amount: state.contribution401k }]
                  : []),
                ...(state.contributionHSA > 0
                  ? [{ label: "HSA", amount: state.contributionHSA }]
                  : []),
                ...(state.useStandardDeduction
                  ? [{ label: "Std. Deduction", amount: standardDeduction }]
                  : []),
              ]}
              taxable={result.taxableIncome}
            />
          </div>

          {/* Bracket Waterfall */}
          {result.bracketBreakdown.length > 0 && (
            <div className="px-4 py-3 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Tax by Bracket</p>
              <BracketChart
                brackets={result.bracketBreakdown}
                taxableIncome={result.taxableIncome}
              />
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50 border-t border-border/50">
            <StatCard label="Federal Tax" value={fmt(result.federalTax)} />
            <StatCard label="FICA" value={fmt(result.ficaTax)} />
            <StatCard label="Effective Rate" value={fmtPct(result.effectiveRate)} />
            <StatCard
              label="Take-Home"
              value={fmt(result.takeHome)}
              sub={`${fmt(Math.round(result.takeHome / 12))}/mo`}
              highlight
            />
          </div>
        </>
      )}
    </div>
  );
});

TaxCalculator.displayName = "TaxCalculator";

// ── Sub-components ──

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("bg-card p-3", highlight && "bg-primary/5")}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className={cn("text-lg font-bold mt-0.5 font-mono", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function IncomeFlowBar({
  gross,
  deductions,
  taxable,
}: {
  gross: number;
  deductions: { label: string; amount: number }[];
  taxable: number;
}) {
  if (gross <= 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground mb-1.5">
        <span className="font-mono font-medium text-foreground">{fmt(gross)}</span>
        {deductions.map((d, i) => (
          <React.Fragment key={i}>
            <span className="text-muted-foreground/40">-</span>
            <span className="text-foreground/60 whitespace-nowrap">
              {fmt(d.amount)}{" "}
              <span className="text-muted-foreground/50">({d.label})</span>
            </span>
          </React.Fragment>
        ))}
        <span className="text-muted-foreground/40">=</span>
        <span className="font-mono font-semibold text-foreground">{fmt(taxable)}</span>
      </div>
      <div className="w-full h-5 rounded-md overflow-hidden flex bg-border/30">
        <div
          className="h-full bg-primary/80 rounded-l-md"
          style={{ width: `${(taxable / gross) * 100}%` }}
          title={`Taxable: ${fmt(taxable)}`}
        />
        {deductions.map((d, i) => (
          <div
            key={i}
            className="h-full"
            style={{
              width: `${(d.amount / gross) * 100}%`,
              backgroundColor: `hsl(${30 + i * 40}, 50%, 55%)`,
              opacity: 0.4,
            }}
            title={`${d.label}: ${fmt(d.amount)}`}
          />
        ))}
      </div>
    </div>
  );
}

function BracketChart({
  brackets,
  taxableIncome,
}: {
  brackets: { rate: number; taxableAmount: number; tax: number }[];
  taxableIncome: number;
}) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const visibleBrackets = brackets.filter((seg) => seg.taxableAmount > 0);

  return (
    <div>
      {/* Stacked bar built with divs for direct hover control */}
      <div
        className="w-full h-12 rounded-md overflow-hidden flex"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {visibleBrackets.map((seg, i) => (
          <div
            key={i}
            className="h-full transition-opacity duration-150 cursor-default"
            style={{
              width: `${(seg.taxableAmount / taxableIncome) * 100}%`,
              backgroundColor: BRACKET_COLORS[i % BRACKET_COLORS.length],
              opacity: activeIndex === null || activeIndex === i ? 1 : 0.3,
              borderRadius:
                i === 0 && i === visibleBrackets.length - 1
                  ? "6px"
                  : i === 0
                    ? "6px 0 0 6px"
                    : i === visibleBrackets.length - 1
                      ? "0 6px 6px 0"
                      : undefined,
            }}
            onMouseEnter={() => setActiveIndex(i)}
          />
        ))}
      </div>
      {/* Legend labels — highlight matches active segment */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {visibleBrackets.map((seg, i) => (
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
              style={{ backgroundColor: BRACKET_COLORS[i % BRACKET_COLORS.length] }}
            />
            {(seg.rate * 100).toFixed(0)}%: {fmt(seg.taxableAmount)} → {fmt(seg.tax)} tax
          </span>
        ))}
      </div>
    </div>
  );
}
