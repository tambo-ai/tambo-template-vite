"use client";

import { cn } from "@/lib/utils";
import { useTaxContext } from "@/lib/tax-context";
import {
  calculateFederalTax,
  findDeductions,
  STANDARD_DEDUCTIONS,
  type DeductionResult,
} from "@/services/tax-calculator";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { GraduationCap, Landmark, Heart, Users } from "lucide-react";
import { z } from "zod/v3";

export const deductionFinderSchema = z.object({
  title: z.string().describe("Card title"),
  grossIncome: z
    .number()
    .optional()
    .describe(
      "Override income. If omitted, reads from shared TaxCalculator context automatically.",
    ),
  filingStatus: z
    .string()
    .optional()
    .describe(
      "Override filing status. If omitted, reads from shared TaxCalculator context automatically.",
    ),
});

export type DeductionFinderProps = z.infer<typeof deductionFinderSchema>;

type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household";

type Answers = {
  studentLoans: { enabled: boolean; amount: number };
  ira: { enabled: boolean; amount: number };
  charity: { enabled: boolean; amount: number };
  dependents: { enabled: boolean; count: number };
};

export type DeductionFinderState = {
  incomeOverride: number | null;
  answers: Answers;
  result: DeductionResult | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const QUESTIONS = [
  {
    key: "studentLoans" as const,
    icon: GraduationCap,
    question: "Student loans?",
    followUp: { label: "Loan balance", prefix: "$", placeholder: "30,000" },
  },
  {
    key: "ira" as const,
    icon: Landmark,
    question: "Contribute to a Traditional IRA?",
    followUp: { label: "Current contribution", prefix: "$", placeholder: "3,500" },
  },
  {
    key: "charity" as const,
    icon: Heart,
    question: "Donate to charity?",
    followUp: { label: "Annual donations", prefix: "$", placeholder: "2,000" },
  },
  {
    key: "dependents" as const,
    icon: Users,
    question: "Have dependents?",
    followUp: { label: "How many?", prefix: "", placeholder: "1" },
  },
];

export const DeductionFinder = React.forwardRef<
  HTMLDivElement,
  DeductionFinderProps
>(({ title, grossIncome: propIncome, filingStatus: propFiling }, ref) => {
  const taxCtx = useTaxContext();

  const [state, setState] = useTamboComponentState<DeductionFinderState>(
    "deduction-finder",
    {
      incomeOverride: null,
      answers: {
        studentLoans: { enabled: false, amount: 0 },
        ira: { enabled: false, amount: 0 },
        charity: { enabled: false, amount: 0 },
        dependents: { enabled: false, count: 0 },
      },
      result: null,
    },
  );

  // Resolve income: local override > shared context > AI prop
  const resolvedIncome =
    state?.incomeOverride ??
    (taxCtx.state.income > 0 ? taxCtx.state.income : null) ??
    propIncome ??
    0;
  const resolvedFiling =
    (taxCtx.state.income > 0 ? taxCtx.state.filingStatus : null) ??
    (propFiling as FilingStatus) ??
    "single";

  // Build current deductions from shared context
  const currentDeductions = React.useMemo(() => {
    const deductions: { label: string; amount: number }[] = [];
    if (taxCtx.state.contribution401k > 0) {
      deductions.push({
        label: "401(k)",
        amount: taxCtx.state.contribution401k,
      });
    }
    if (taxCtx.state.contributionHSA > 0) {
      deductions.push({ label: "HSA", amount: taxCtx.state.contributionHSA });
    }
    if (taxCtx.state.useStandardDeduction) {
      deductions.push({
        label: "Standard Deduction",
        amount: STANDARD_DEDUCTIONS[resolvedFiling],
      });
    }
    return deductions;
  }, [
    taxCtx.state.contribution401k,
    taxCtx.state.contributionHSA,
    taxCtx.state.useStandardDeduction,
    resolvedFiling,
  ]);

  // Get current federal tax from context or compute it
  const [currentFederalTax, setCurrentFederalTax] = React.useState(0);
  React.useEffect(() => {
    if (taxCtx.state.result) {
      setCurrentFederalTax(taxCtx.state.result.federalTax);
    } else if (resolvedIncome > 0) {
      calculateFederalTax({
        grossIncome: resolvedIncome,
        filingStatus: resolvedFiling,
        deductions: currentDeductions,
      }).then((r) => setCurrentFederalTax(r.federalTax));
    }
  }, [taxCtx.state.result, resolvedIncome, resolvedFiling, currentDeductions]);

  // Live-compute deductions
  React.useEffect(() => {
    if (!state || resolvedIncome <= 0 || currentFederalTax <= 0) return;
    const { answers } = state;

    const hasAny = Object.values(answers).some(
      (a) => "enabled" in a && a.enabled,
    );
    if (!hasAny) {
      if (state.result !== null) {
        setState((prev) => (prev ? { ...prev, result: null } : prev));
      }
      return;
    }

    findDeductions({
      grossIncome: resolvedIncome,
      filingStatus: resolvedFiling,
      currentFederalTax,
      currentDeductions,
      hasStudentLoans: answers.studentLoans.enabled,
      loanBalance: answers.studentLoans.amount || undefined,
      hasHSA: taxCtx.state.contributionHSA > 0,
      currentHSAContribution: taxCtx.state.contributionHSA || undefined,
      wantsIRA: answers.ira.enabled,
      currentIRAContribution: answers.ira.amount || undefined,
      donatesCharity: answers.charity.enabled,
      charityAmount: answers.charity.amount || undefined,
      hasDependents: answers.dependents.enabled,
      dependentCount: answers.dependents.count || undefined,
    }).then((result) => {
      setState((prev) => (prev ? { ...prev, result } : prev));
    });
  }, [
    state?.answers.studentLoans.enabled,
    state?.answers.studentLoans.amount,
    state?.answers.ira.enabled,
    state?.answers.ira.amount,
    taxCtx.state.contributionHSA,
    state?.answers.charity.enabled,
    state?.answers.charity.amount,
    state?.answers.dependents.enabled,
    state?.answers.dependents.count,
    resolvedIncome,
    resolvedFiling,
    currentFederalTax,
  ]);

  if (!state) return null;

  const { answers, result } = state;

  const setEnabled = (key: keyof Answers, enabled: boolean) => {
    setState({
      ...state,
      answers: { ...state.answers, [key]: { ...state.answers[key], enabled } },
    });
  };

  const setAmount = (key: "studentLoans" | "ira" | "charity", amount: number) => {
    setState({
      ...state,
      answers: { ...state.answers, [key]: { ...state.answers[key], amount } },
    });
  };

  const setCount = (count: number) => {
    setState({
      ...state,
      answers: {
        ...state.answers,
        dependents: { ...state.answers.dependents, count },
      },
    });
  };

  const applicableDeductions = result?.deductions.filter((d) => d.applicable) ?? [];

  return (
    <div
      ref={ref}
      className="w-full rounded-lg border border-border overflow-hidden"
    >
      {/* Header + income display */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Income:</span>
          <input
            type="number"
            value={resolvedIncome || ""}
            onChange={(e) =>
              setState({
                ...state,
                incomeOverride: Number(e.target.value) || null,
              })
            }
            className="font-mono text-sm font-medium text-foreground bg-transparent border-b border-border/50 focus:border-primary outline-none w-28 py-0.5"
            placeholder="$120,000"
          />
          {state.incomeOverride !== null && taxCtx.state.income > 0 && (
            <button
              type="button"
              onClick={() => setState({ ...state, incomeOverride: null })}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              (reset)
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="px-4 pb-3 space-y-2">
        {QUESTIONS.map((q) => {
          const answer = answers[q.key];
          const isEnabled = answer.enabled;
          const value =
            q.key === "dependents"
              ? (answer as Answers["dependents"]).count
              : (answer as Answers["studentLoans"]).amount;

          // Find matching deduction result for this question
          const deductionResult = result?.deductions.find((d) => {
            const name = d.name.toLowerCase();
            if (q.key === "studentLoans") return name.includes("student");
            if (q.key === "ira") return name.includes("ira");
            if (q.key === "charity") return name.includes("charit");
            if (q.key === "dependents") return name.includes("child") || name.includes("dependent");
            return false;
          });

          return (
            <div
              key={q.key}
              className={cn(
                "rounded-lg p-3 transition-colors",
                isEnabled && deductionResult?.applicable
                  ? "border border-emerald-500/30 bg-emerald-500/5"
                  : isEnabled && deductionResult && !deductionResult.applicable
                    ? "border border-border/50 bg-muted/30"
                    : "border border-border/50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <q.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground">{q.question}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEnabled(q.key, true)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                      isEnabled
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/40",
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnabled(q.key, false)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                      !isEnabled && answer !== undefined
                        ? "bg-muted text-foreground border-muted"
                        : "bg-card text-foreground border-border hover:border-muted",
                    )}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Follow-up input */}
              {isEnabled && q.followUp && (
                <div className="mt-2 ml-7">
                  <label className="block text-xs text-muted-foreground mb-1">
                    {q.followUp.label}
                  </label>
                  <div className="relative">
                    {q.followUp.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {q.followUp.prefix}
                      </span>
                    )}
                    <input
                      type="number"
                      min={0}
                      value={value || ""}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        if (q.key === "dependents") setCount(v);
                        else setAmount(q.key, v);
                      }}
                      placeholder={q.followUp.placeholder}
                      className={cn(
                        "w-full pr-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40",
                        q.followUp.prefix ? "pl-7" : "pl-3",
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Inline savings indicator */}
              {isEnabled && deductionResult && (
                <div className="mt-2 ml-7">
                  {deductionResult.applicable ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (deductionResult.annualSavings / Math.max(1, result?.totalAnnualSavings ?? 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-emerald-500 whitespace-nowrap">
                        {deductionResult.annualSavings > 0
                          ? fmt(deductionResult.annualSavings) + "/yr"
                          : "included"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">
                      {deductionResult.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Summary ── */}
      {result && applicableDeductions.length > 0 && result.totalAnnualSavings > 0 && (
        <div className="border-t border-border/50">
          {/* Before / After mini comparison */}
          <div className="grid grid-cols-2 gap-px bg-border/30">
            <div className="bg-card p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Current
              </p>
              <p className="text-lg font-bold font-mono text-foreground mt-0.5">
                {fmt(currentFederalTax)}
              </p>
              <p className="text-xs text-muted-foreground">federal tax</p>
            </div>
            <div className="bg-card p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Optimized
              </p>
              <p className="text-lg font-bold font-mono text-emerald-500 mt-0.5">
                {fmt(result.newFederalTax)}
              </p>
              <p className="text-xs text-muted-foreground">
                federal tax ({fmtPct(result.newEffectiveRate)} eff.)
              </p>
            </div>
          </div>

          {/* Total savings banner */}
          <div className="px-4 py-3 bg-emerald-500/10 border-t border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Total savings
                </p>
                <p className="text-xs text-muted-foreground">
                  {applicableDeductions.length} deduction
                  {applicableDeductions.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold font-mono text-emerald-500">
                  {fmt(result.totalAnnualSavings)}/yr
                </p>
                <p className="text-xs text-emerald-500/70">
                  {fmt(result.totalMonthlySavings)}/mo
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DeductionFinder.displayName = "DeductionFinder";
