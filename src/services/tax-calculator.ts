// 2024 Federal Income Tax Bracket Tables
// Source: IRS Revenue Procedure 2023-34

type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household";

interface Bracket {
  rate: number;
  min: number;
  max: number | null;
}

const BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 0.1, min: 0, max: 11600 },
    { rate: 0.12, min: 11600, max: 47150 },
    { rate: 0.22, min: 47150, max: 100525 },
    { rate: 0.24, min: 100525, max: 191950 },
    { rate: 0.32, min: 191950, max: 243725 },
    { rate: 0.35, min: 243725, max: 609350 },
    { rate: 0.37, min: 609350, max: null },
  ],
  married_joint: [
    { rate: 0.1, min: 0, max: 23200 },
    { rate: 0.12, min: 23200, max: 94300 },
    { rate: 0.22, min: 94300, max: 201050 },
    { rate: 0.24, min: 201050, max: 383900 },
    { rate: 0.32, min: 383900, max: 487450 },
    { rate: 0.35, min: 487450, max: 731200 },
    { rate: 0.37, min: 731200, max: null },
  ],
  married_separate: [
    { rate: 0.1, min: 0, max: 11600 },
    { rate: 0.12, min: 11600, max: 47150 },
    { rate: 0.22, min: 47150, max: 100525 },
    { rate: 0.24, min: 100525, max: 191950 },
    { rate: 0.32, min: 191950, max: 243725 },
    { rate: 0.35, min: 243725, max: 365600 },
    { rate: 0.37, min: 365600, max: null },
  ],
  head_of_household: [
    { rate: 0.1, min: 0, max: 16550 },
    { rate: 0.12, min: 16550, max: 63100 },
    { rate: 0.22, min: 63100, max: 100500 },
    { rate: 0.24, min: 100500, max: 191950 },
    { rate: 0.32, min: 191950, max: 243700 },
    { rate: 0.35, min: 243700, max: 609350 },
    { rate: 0.37, min: 609350, max: null },
  ],
};

export const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 14600,
  married_joint: 29200,
  married_separate: 14600,
  head_of_household: 21900,
};

// FICA constants (2024)
const SS_RATE = 0.062;
const SS_WAGE_BASE = 168600;
const MEDICARE_RATE = 0.0145;
const MEDICARE_SURTAX_RATE = 0.009;
const MEDICARE_SURTAX_THRESHOLD: Record<FilingStatus, number> = {
  single: 200000,
  married_joint: 250000,
  married_separate: 125000,
  head_of_household: 200000,
};

// HSA limits (2024)
const HSA_LIMIT_SELF = 4150;

// 401k limit (2024)
const LIMIT_401K = 23000;

// Traditional IRA limit (2024)
const IRA_LIMIT = 7000;
const IRA_INCOME_LIMIT_SINGLE = 87000; // MAGI phase-out start for single w/ employer plan
const IRA_INCOME_LIMIT_JOINT = 143000; // MAGI phase-out start for MFJ w/ employer plan

interface Deduction {
  label: string;
  amount: number;
}

interface TaxInput {
  grossIncome: number;
  filingStatus: FilingStatus;
  deductions: Deduction[];
}

interface BracketBreakdown {
  rate: number;
  min: number;
  max: number;
  taxableAmount: number;
  tax: number;
}

interface TaxResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  federalTax: number;
  ficaTax: number;
  effectiveRate: number;
  marginalRate: number;
  takeHome: number;
  bracketBreakdown: BracketBreakdown[];
}

function computeFederalTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
): { tax: number; marginalRate: number; breakdown: BracketBreakdown[] } {
  const brackets = BRACKETS[filingStatus];
  let remaining = Math.max(0, taxableIncome);
  let tax = 0;
  let marginalRate = 0;
  const breakdown: BracketBreakdown[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const bracketMax = bracket.max ?? Infinity;
    const bracketWidth = bracketMax - bracket.min;
    const taxableAmount = Math.min(remaining, bracketWidth);
    const bracketTax = taxableAmount * bracket.rate;

    breakdown.push({
      rate: bracket.rate,
      min: bracket.min,
      max: bracket.max ?? taxableIncome,
      taxableAmount,
      tax: Math.round(bracketTax * 100) / 100,
    });

    tax += bracketTax;
    marginalRate = bracket.rate;
    remaining -= taxableAmount;
  }

  return { tax: Math.round(tax * 100) / 100, marginalRate, breakdown };
}

function computeFICA(grossIncome: number, filingStatus: FilingStatus): number {
  const ssTax = Math.min(grossIncome, SS_WAGE_BASE) * SS_RATE;
  const medicareTax = grossIncome * MEDICARE_RATE;
  const surtaxThreshold = MEDICARE_SURTAX_THRESHOLD[filingStatus];
  const surtax =
    grossIncome > surtaxThreshold
      ? (grossIncome - surtaxThreshold) * MEDICARE_SURTAX_RATE
      : 0;
  return Math.round((ssTax + medicareTax + surtax) * 100) / 100;
}

export const calculateFederalTax = async (
  input: TaxInput,
): Promise<TaxResult> => {
  const { grossIncome, filingStatus, deductions } = input;

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  const { tax: federalTax, marginalRate, breakdown } = computeFederalTax(
    taxableIncome,
    filingStatus,
  );

  const ficaTax = computeFICA(grossIncome, filingStatus);
  const totalTax = federalTax + ficaTax;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  // Take-home: gross minus federal tax, FICA, and pre-tax deductions (401k, HSA)
  const preTaxDeductions = deductions
    .filter(
      (d) =>
        d.label.toLowerCase().includes("401k") ||
        d.label.toLowerCase().includes("hsa"),
    )
    .reduce((sum, d) => sum + d.amount, 0);

  const takeHome = grossIncome - federalTax - ficaTax - preTaxDeductions;

  return {
    grossIncome,
    totalDeductions,
    taxableIncome,
    federalTax: Math.round(federalTax),
    ficaTax: Math.round(ficaTax),
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    marginalRate,
    takeHome: Math.round(takeHome),
    bracketBreakdown: breakdown,
  };
};

// Deduction finder types
interface DeductionFinderInput {
  grossIncome: number;
  filingStatus: string;
  currentFederalTax: number;
  currentDeductions: Deduction[];
  hasStudentLoans: boolean;
  loanBalance?: number;
  hasHSA: boolean;
  currentHSAContribution?: number;
  wantsIRA: boolean;
  currentIRAContribution?: number;
  donatesCharity: boolean;
  charityAmount?: number;
  hasDependents: boolean;
  dependentCount?: number;
}

interface FoundDeduction {
  name: string;
  amount: number;
  annualSavings: number;
  applicable: boolean;
  reason?: string;
}

interface DeductionResult {
  deductions: FoundDeduction[];
  totalAnnualSavings: number;
  totalMonthlySavings: number;
  newFederalTax: number;
  newEffectiveRate: number;
  newTakeHome: number;
}

export const findDeductions = async (
  input: DeductionFinderInput,
): Promise<DeductionResult> => {
  const filingStatus = input.filingStatus as FilingStatus;
  const foundDeductions: FoundDeduction[] = [];

  // Track new deductions to add
  const newDeductions = [...input.currentDeductions];

  // 1. Student loan interest deduction (up to $2,500)
  if (input.hasStudentLoans && input.loanBalance) {
    // Rough estimate: ~5% of balance as annual interest, capped at $2,500
    const estimatedInterest = Math.min(input.loanBalance * 0.05, 2500);
    const incomeLimit = filingStatus === "married_joint" ? 185000 : 90000;

    if (input.grossIncome <= incomeLimit) {
      foundDeductions.push({
        name: "Student Loan Interest",
        amount: Math.round(estimatedInterest),
        annualSavings: 0, // computed later
        applicable: true,
      });
      newDeductions.push({
        label: "Student Loan Interest",
        amount: Math.round(estimatedInterest),
      });
    } else {
      foundDeductions.push({
        name: "Student Loan Interest",
        amount: 0,
        annualSavings: 0,
        applicable: false,
        reason: `Income exceeds the $${incomeLimit.toLocaleString()} phase-out limit`,
      });
    }
  }

  // 2. HSA contribution increase
  if (input.hasHSA) {
    const currentContribution = input.currentHSAContribution ?? 0;
    const maxContribution = HSA_LIMIT_SELF; // Simplified: use self-only limit
    const additionalContribution = Math.max(
      0,
      maxContribution - currentContribution,
    );

    if (additionalContribution > 0) {
      foundDeductions.push({
        name: `Max Out HSA ($${maxContribution.toLocaleString()})`,
        amount: additionalContribution,
        annualSavings: 0,
        applicable: true,
      });
      // Find and update or add HSA deduction
      const hsaIdx = newDeductions.findIndex((d) =>
        d.label.toLowerCase().includes("hsa"),
      );
      if (hsaIdx >= 0) {
        newDeductions[hsaIdx] = {
          label: "HSA Contribution",
          amount: maxContribution,
        };
      } else {
        newDeductions.push({
          label: "HSA Contribution",
          amount: maxContribution,
        });
      }
    } else {
      foundDeductions.push({
        name: "HSA Contribution",
        amount: 0,
        annualSavings: 0,
        applicable: false,
        reason: "Already at maximum contribution",
      });
    }
  }

  // 3. Traditional IRA contribution
  if (input.wantsIRA) {
    const currentContribution = input.currentIRAContribution ?? 0;
    const additionalIRA = Math.max(0, IRA_LIMIT - currentContribution);
    const incomeLimit =
      filingStatus === "married_joint"
        ? IRA_INCOME_LIMIT_JOINT
        : IRA_INCOME_LIMIT_SINGLE;

    if (additionalIRA > 0 && input.grossIncome <= incomeLimit) {
      foundDeductions.push({
        name: `Traditional IRA ($${IRA_LIMIT.toLocaleString()} max)`,
        amount: additionalIRA,
        annualSavings: 0,
        applicable: true,
      });
      newDeductions.push({
        label: "Traditional IRA",
        amount: IRA_LIMIT,
      });
    } else if (input.grossIncome > incomeLimit) {
      foundDeductions.push({
        name: "Traditional IRA",
        amount: 0,
        annualSavings: 0,
        applicable: false,
        reason: `Income exceeds $${incomeLimit.toLocaleString()} deductibility phase-out`,
      });
    } else {
      foundDeductions.push({
        name: "Traditional IRA",
        amount: 0,
        annualSavings: 0,
        applicable: false,
        reason: "Already at maximum contribution",
      });
    }
  }

  // 4. Charitable donations
  if (input.donatesCharity && input.charityAmount) {
    const standardDeduction = STANDARD_DEDUCTIONS[filingStatus];
    const currentItemized = input.currentDeductions
      .filter(
        (d) =>
          !d.label.toLowerCase().includes("401k") &&
          !d.label.toLowerCase().includes("hsa") &&
          !d.label.toLowerCase().includes("standard"),
      )
      .reduce((sum, d) => sum + d.amount, 0);

    const totalItemized = currentItemized + input.charityAmount;

    if (totalItemized > standardDeduction) {
      foundDeductions.push({
        name: "Charitable Donations (Itemized)",
        amount: input.charityAmount,
        annualSavings: 0,
        applicable: true,
      });
    } else {
      foundDeductions.push({
        name: "Charitable Donations",
        amount: input.charityAmount,
        annualSavings: 0,
        applicable: false,
        reason: `Total itemized deductions ($${totalItemized.toLocaleString()}) don't exceed the standard deduction ($${standardDeduction.toLocaleString()})`,
      });
    }
  }

  // 4. 401k increase (if not already maxed)
  const current401k =
    input.currentDeductions.find((d) =>
      d.label.toLowerCase().includes("401k"),
    )?.amount ?? 0;
  const additional401k = Math.max(0, LIMIT_401K - current401k);

  if (additional401k > 0) {
    foundDeductions.push({
      name: `Increase 401(k) to $${LIMIT_401K.toLocaleString()} max`,
      amount: additional401k,
      annualSavings: 0,
      applicable: true,
    });
    const k401Idx = newDeductions.findIndex((d) =>
      d.label.toLowerCase().includes("401k"),
    );
    if (k401Idx >= 0) {
      newDeductions[k401Idx] = {
        label: "401(k) Contribution",
        amount: LIMIT_401K,
      };
    } else {
      newDeductions.push({ label: "401(k) Contribution", amount: LIMIT_401K });
    }
  }

  // 5. Dependents (Child Tax Credit info)
  if (input.hasDependents && input.dependentCount) {
    const creditPerChild = 2000;
    const totalCredit = input.dependentCount * creditPerChild;
    foundDeductions.push({
      name: `Child Tax Credit (${input.dependentCount} dependent${input.dependentCount > 1 ? "s" : ""})`,
      amount: totalCredit,
      annualSavings: totalCredit,
      applicable: true,
      reason:
        "This is a tax credit, not a deduction — it reduces your tax bill directly",
    });
  }

  // Compute new tax situation with all applicable deductions
  const applicableDeductions = newDeductions;
  const newResult = await calculateFederalTax({
    grossIncome: input.grossIncome,
    filingStatus,
    deductions: applicableDeductions,
  });

  // Subtract child tax credit if applicable
  const childCredit = input.hasDependents
    ? (input.dependentCount ?? 0) * 2000
    : 0;
  const adjustedNewTax = Math.max(0, newResult.federalTax - childCredit);

  // Compute savings for each applicable deduction
  const taxSavings = input.currentFederalTax - adjustedNewTax;
  const applicableCount = foundDeductions.filter(
    (d) => d.applicable && d.name !== `Child Tax Credit (${input.dependentCount} dependent${(input.dependentCount ?? 0) > 1 ? "s" : ""})`,
  ).length;

  // Distribute savings proportionally
  if (applicableCount > 0 && taxSavings > 0) {
    const totalApplicableAmount = foundDeductions
      .filter(
        (d) =>
          d.applicable &&
          !d.name.startsWith("Child Tax Credit"),
      )
      .reduce((sum, d) => sum + d.amount, 0);

    for (const deduction of foundDeductions) {
      if (deduction.applicable && !deduction.name.startsWith("Child Tax Credit")) {
        deduction.annualSavings =
          totalApplicableAmount > 0
            ? Math.round(
                (deduction.amount / totalApplicableAmount) * (taxSavings - childCredit),
              )
            : 0;
      }
    }
  }

  const totalAnnualSavings = Math.max(0, Math.round(input.currentFederalTax - adjustedNewTax));

  // Compute new pre-tax deductions
  const newPreTax = applicableDeductions
    .filter(
      (d) =>
        d.label.toLowerCase().includes("401k") ||
        d.label.toLowerCase().includes("hsa"),
    )
    .reduce((sum, d) => sum + d.amount, 0);

  const newTakeHome =
    input.grossIncome -
    adjustedNewTax -
    computeFICA(input.grossIncome, filingStatus) -
    newPreTax;

  const totalTaxNew =
    adjustedNewTax + computeFICA(input.grossIncome, filingStatus);

  return {
    deductions: foundDeductions,
    totalAnnualSavings,
    totalMonthlySavings: Math.round(totalAnnualSavings / 12),
    newFederalTax: adjustedNewTax,
    newEffectiveRate:
      input.grossIncome > 0
        ? Math.round((totalTaxNew / input.grossIncome) * 10000) / 10000
        : 0,
    newTakeHome: Math.round(newTakeHome),
  };
};

export type {
  FilingStatus,
  TaxInput,
  TaxResult,
  BracketBreakdown,
  DeductionFinderInput,
  DeductionResult,
  FoundDeduction,
  Deduction,
};
