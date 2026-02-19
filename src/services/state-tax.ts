type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household";

interface Bracket {
  min: number;
  max: number | null;
  rate: number;
}

interface StateTaxInfo {
  name: string;
  abbreviation: string;
  taxType: "none" | "flat" | "progressive";
  flatRate?: number;
  brackets?: Bracket[];
  standardDeduction?: number;
  notableCredits?: string[];
}

interface StateTaxInput {
  stateAbbreviation: string;
  grossIncome: number;
  filingStatus: FilingStatus;
}

interface StateTaxResult {
  stateName: string;
  stateAbbreviation: string;
  taxType: "none" | "flat" | "progressive";
  stateTax: number;
  stateEffectiveRate: number;
  topRate: number;
  brackets: { min: number; max: number; rate: number; taxableAmount: number; tax: number }[];
  standardDeduction: number;
  notableCredits: string[];
}

const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  // No income tax states
  AK: { name: "Alaska", abbreviation: "AK", taxType: "none" },
  FL: { name: "Florida", abbreviation: "FL", taxType: "none" },
  NV: { name: "Nevada", abbreviation: "NV", taxType: "none" },
  NH: { name: "New Hampshire", abbreviation: "NH", taxType: "none", notableCredits: ["Interest & dividends tax repealed as of 2025"] },
  SD: { name: "South Dakota", abbreviation: "SD", taxType: "none" },
  TN: { name: "Tennessee", abbreviation: "TN", taxType: "none" },
  TX: { name: "Texas", abbreviation: "TX", taxType: "none" },
  WA: { name: "Washington", abbreviation: "WA", taxType: "none", notableCredits: ["Working Families Tax Credit"] },
  WY: { name: "Wyoming", abbreviation: "WY", taxType: "none" },

  // Flat-rate states
  AZ: { name: "Arizona", abbreviation: "AZ", taxType: "flat", flatRate: 0.025, standardDeduction: 14600, notableCredits: ["Family tax credit", "School tax credit"] },
  CO: { name: "Colorado", abbreviation: "CO", taxType: "flat", flatRate: 0.044, standardDeduction: 14600, notableCredits: ["Earned income tax credit (25% of federal)", "Child tax credit"] },
  GA: { name: "Georgia", abbreviation: "GA", taxType: "flat", flatRate: 0.0549, standardDeduction: 12000, notableCredits: ["Low-income credit"] },
  ID: { name: "Idaho", abbreviation: "ID", taxType: "flat", flatRate: 0.058, standardDeduction: 14600, notableCredits: ["Grocery credit"] },
  IL: { name: "Illinois", abbreviation: "IL", taxType: "flat", flatRate: 0.0495, standardDeduction: 0, notableCredits: ["Earned income credit (20% of federal)", "Property tax credit"] },
  IN: { name: "Indiana", abbreviation: "IN", taxType: "flat", flatRate: 0.0305, standardDeduction: 0, notableCredits: ["Unified tax credit", "County taxes may apply"] },
  KY: { name: "Kentucky", abbreviation: "KY", taxType: "flat", flatRate: 0.04, standardDeduction: 3160, notableCredits: ["Family size tax credit"] },
  MI: { name: "Michigan", abbreviation: "MI", taxType: "flat", flatRate: 0.0425, standardDeduction: 0, notableCredits: ["Home heating credit", "Earned income credit (30% of federal)"] },
  MS: { name: "Mississippi", abbreviation: "MS", taxType: "flat", flatRate: 0.05, standardDeduction: 2300, notableCredits: ["First $10,000 exempt"] },
  NC: { name: "North Carolina", abbreviation: "NC", taxType: "flat", flatRate: 0.045, standardDeduction: 12750, notableCredits: ["Child deduction"] },
  PA: { name: "Pennsylvania", abbreviation: "PA", taxType: "flat", flatRate: 0.0307, standardDeduction: 0, notableCredits: ["Tax forgiveness credit", "Local taxes may apply"] },
  UT: { name: "Utah", abbreviation: "UT", taxType: "flat", flatRate: 0.0465, standardDeduction: 0, notableCredits: ["Taxpayer tax credit (effectively reduces rate)", "At-home parent credit"] },

  // Progressive states
  AL: {
    name: "Alabama", abbreviation: "AL", taxType: "progressive", standardDeduction: 2500,
    brackets: [
      { min: 0, max: 500, rate: 0.02 },
      { min: 500, max: 3000, rate: 0.04 },
      { min: 3000, max: null, rate: 0.05 },
    ],
    notableCredits: ["Federal tax deduction allowed"],
  },
  AR: {
    name: "Arkansas", abbreviation: "AR", taxType: "progressive", standardDeduction: 2270,
    brackets: [
      { min: 0, max: 4300, rate: 0.02 },
      { min: 4300, max: 8500, rate: 0.04 },
      { min: 8500, max: null, rate: 0.044 },
    ],
  },
  CA: {
    name: "California", abbreviation: "CA", taxType: "progressive", standardDeduction: 5540,
    brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: null, rate: 0.123 },
    ],
    notableCredits: ["Renter's credit", "Earned income tax credit"],
  },
  CT: {
    name: "Connecticut", abbreviation: "CT", taxType: "progressive", standardDeduction: 0,
    brackets: [
      { min: 0, max: 10000, rate: 0.03 },
      { min: 10000, max: 50000, rate: 0.05 },
      { min: 50000, max: 100000, rate: 0.055 },
      { min: 100000, max: 200000, rate: 0.06 },
      { min: 200000, max: 250000, rate: 0.065 },
      { min: 250000, max: null, rate: 0.069 },
    ],
    notableCredits: ["Personal tax credit"],
  },
  DE: {
    name: "Delaware", abbreviation: "DE", taxType: "progressive", standardDeduction: 3250,
    brackets: [
      { min: 0, max: 2000, rate: 0.0 },
      { min: 2000, max: 5000, rate: 0.022 },
      { min: 5000, max: 10000, rate: 0.039 },
      { min: 10000, max: 20000, rate: 0.048 },
      { min: 20000, max: 25000, rate: 0.052 },
      { min: 25000, max: 60000, rate: 0.055 },
      { min: 60000, max: null, rate: 0.066 },
    ],
    notableCredits: ["Earned income credit"],
  },
  DC: {
    name: "District of Columbia", abbreviation: "DC", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 10000, rate: 0.04 },
      { min: 10000, max: 40000, rate: 0.06 },
      { min: 40000, max: 60000, rate: 0.065 },
      { min: 60000, max: 250000, rate: 0.085 },
      { min: 250000, max: 500000, rate: 0.0925 },
      { min: 500000, max: null, rate: 0.1075 },
    ],
    notableCredits: ["Earned income credit (70% of federal)"],
  },
  HI: {
    name: "Hawaii", abbreviation: "HI", taxType: "progressive", standardDeduction: 2200,
    brackets: [
      { min: 0, max: 2400, rate: 0.014 },
      { min: 2400, max: 4800, rate: 0.032 },
      { min: 4800, max: 9600, rate: 0.055 },
      { min: 9600, max: 14400, rate: 0.064 },
      { min: 14400, max: 19200, rate: 0.068 },
      { min: 19200, max: 24000, rate: 0.072 },
      { min: 24000, max: 36000, rate: 0.076 },
      { min: 36000, max: 48000, rate: 0.079 },
      { min: 48000, max: 150000, rate: 0.0825 },
      { min: 150000, max: 175000, rate: 0.09 },
      { min: 175000, max: 200000, rate: 0.10 },
      { min: 200000, max: null, rate: 0.11 },
    ],
    notableCredits: ["Low-income household renters credit"],
  },
  IA: {
    name: "Iowa", abbreviation: "IA", taxType: "progressive", standardDeduction: 2210,
    brackets: [
      { min: 0, max: 6210, rate: 0.044 },
      { min: 6210, max: 31050, rate: 0.0482 },
      { min: 31050, max: null, rate: 0.057 },
    ],
  },
  KS: {
    name: "Kansas", abbreviation: "KS", taxType: "progressive", standardDeduction: 3500,
    brackets: [
      { min: 0, max: 15000, rate: 0.031 },
      { min: 15000, max: 30000, rate: 0.0525 },
      { min: 30000, max: null, rate: 0.057 },
    ],
    notableCredits: ["Earned income credit (17% of federal)", "Food sales tax credit"],
  },
  LA: {
    name: "Louisiana", abbreviation: "LA", taxType: "progressive", standardDeduction: 4500,
    brackets: [
      { min: 0, max: 12500, rate: 0.0185 },
      { min: 12500, max: 50000, rate: 0.035 },
      { min: 50000, max: null, rate: 0.0425 },
    ],
    notableCredits: ["Earned income credit"],
  },
  ME: {
    name: "Maine", abbreviation: "ME", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 24500, rate: 0.058 },
      { min: 24500, max: 58050, rate: 0.0675 },
      { min: 58050, max: null, rate: 0.0715 },
    ],
    notableCredits: ["Property tax fairness credit"],
  },
  MD: {
    name: "Maryland", abbreviation: "MD", taxType: "progressive", standardDeduction: 2550,
    brackets: [
      { min: 0, max: 1000, rate: 0.02 },
      { min: 1000, max: 2000, rate: 0.03 },
      { min: 2000, max: 3000, rate: 0.04 },
      { min: 3000, max: 100000, rate: 0.0475 },
      { min: 100000, max: 125000, rate: 0.05 },
      { min: 125000, max: 150000, rate: 0.0525 },
      { min: 150000, max: 250000, rate: 0.055 },
      { min: 250000, max: null, rate: 0.0575 },
    ],
    notableCredits: ["Earned income credit (45% of federal)", "Local piggyback taxes apply"],
  },
  MA: {
    name: "Massachusetts", abbreviation: "MA", taxType: "progressive", standardDeduction: 0,
    brackets: [
      { min: 0, max: 1000000, rate: 0.05 },
      { min: 1000000, max: null, rate: 0.09 },
    ],
    notableCredits: ["No-tax status for low incomes", "Millionaire's surtax above $1M"],
  },
  MN: {
    name: "Minnesota", abbreviation: "MN", taxType: "progressive", standardDeduction: 14575,
    brackets: [
      { min: 0, max: 30070, rate: 0.0535 },
      { min: 30070, max: 98760, rate: 0.068 },
      { min: 98760, max: 183340, rate: 0.0785 },
      { min: 183340, max: null, rate: 0.0985 },
    ],
    notableCredits: ["Working family credit", "K-12 education credit"],
  },
  MO: {
    name: "Missouri", abbreviation: "MO", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 1207, rate: 0.02 },
      { min: 1207, max: 2414, rate: 0.025 },
      { min: 2414, max: 3621, rate: 0.03 },
      { min: 3621, max: 4828, rate: 0.035 },
      { min: 4828, max: 6035, rate: 0.04 },
      { min: 6035, max: 7242, rate: 0.045 },
      { min: 7242, max: 8449, rate: 0.05 },
      { min: 8449, max: null, rate: 0.048 },
    ],
  },
  MT: {
    name: "Montana", abbreviation: "MT", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 20500, rate: 0.047 },
      { min: 20500, max: null, rate: 0.059 },
    ],
  },
  NE: {
    name: "Nebraska", abbreviation: "NE", taxType: "progressive", standardDeduction: 7900,
    brackets: [
      { min: 0, max: 3700, rate: 0.0246 },
      { min: 3700, max: 22170, rate: 0.0351 },
      { min: 22170, max: 35730, rate: 0.0501 },
      { min: 35730, max: null, rate: 0.0584 },
    ],
    notableCredits: ["Earned income credit (10% of federal)"],
  },
  NJ: {
    name: "New Jersey", abbreviation: "NJ", taxType: "progressive", standardDeduction: 0,
    brackets: [
      { min: 0, max: 20000, rate: 0.014 },
      { min: 20000, max: 35000, rate: 0.0175 },
      { min: 35000, max: 40000, rate: 0.035 },
      { min: 40000, max: 75000, rate: 0.05525 },
      { min: 75000, max: 500000, rate: 0.0637 },
      { min: 500000, max: 1000000, rate: 0.0897 },
      { min: 1000000, max: null, rate: 0.1075 },
    ],
    notableCredits: ["Earned income credit (40% of federal)", "Property tax deduction up to $15,000"],
  },
  NM: {
    name: "New Mexico", abbreviation: "NM", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 5500, rate: 0.017 },
      { min: 5500, max: 11000, rate: 0.032 },
      { min: 11000, max: 16000, rate: 0.047 },
      { min: 16000, max: 210000, rate: 0.049 },
      { min: 210000, max: null, rate: 0.059 },
    ],
    notableCredits: ["Low-income comprehensive tax rebate", "Working families tax credit"],
  },
  NY: {
    name: "New York", abbreviation: "NY", taxType: "progressive", standardDeduction: 8000,
    brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.055 },
      { min: 80650, max: 215400, rate: 0.06 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: null, rate: 0.109 },
    ],
    notableCredits: ["Earned income credit (30% of federal)", "NYC residents pay additional city tax"],
  },
  ND: {
    name: "North Dakota", abbreviation: "ND", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 44725, rate: 0.0195 },
      { min: 44725, max: null, rate: 0.025 },
    ],
  },
  OH: {
    name: "Ohio", abbreviation: "OH", taxType: "progressive", standardDeduction: 0,
    brackets: [
      { min: 0, max: 26050, rate: 0.0 },
      { min: 26050, max: 100000, rate: 0.0275 },
      { min: 100000, max: null, rate: 0.035 },
    ],
    notableCredits: ["Personal exemption credit", "Joint filing credit", "Local taxes may apply"],
  },
  OK: {
    name: "Oklahoma", abbreviation: "OK", taxType: "progressive", standardDeduction: 6350,
    brackets: [
      { min: 0, max: 1000, rate: 0.0025 },
      { min: 1000, max: 2500, rate: 0.0075 },
      { min: 2500, max: 3750, rate: 0.0175 },
      { min: 3750, max: 4900, rate: 0.0275 },
      { min: 4900, max: 7200, rate: 0.0375 },
      { min: 7200, max: null, rate: 0.0475 },
    ],
    notableCredits: ["Earned income credit (5% of federal)"],
  },
  OR: {
    name: "Oregon", abbreviation: "OR", taxType: "progressive", standardDeduction: 2745,
    brackets: [
      { min: 0, max: 4050, rate: 0.0475 },
      { min: 4050, max: 10200, rate: 0.0675 },
      { min: 10200, max: 125000, rate: 0.0875 },
      { min: 125000, max: null, rate: 0.099 },
    ],
    notableCredits: ["Earned income credit (12% of federal)", "No sales tax"],
  },
  RI: {
    name: "Rhode Island", abbreviation: "RI", taxType: "progressive", standardDeduction: 10550,
    brackets: [
      { min: 0, max: 73450, rate: 0.0375 },
      { min: 73450, max: 166950, rate: 0.0475 },
      { min: 166950, max: null, rate: 0.0599 },
    ],
    notableCredits: ["Earned income credit (15% of federal)"],
  },
  SC: {
    name: "South Carolina", abbreviation: "SC", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 3460, rate: 0.0 },
      { min: 3460, max: 17330, rate: 0.03 },
      { min: 17330, max: null, rate: 0.064 },
    ],
    notableCredits: ["Two-earner credit"],
  },
  VT: {
    name: "Vermont", abbreviation: "VT", taxType: "progressive", standardDeduction: 14600,
    brackets: [
      { min: 0, max: 45400, rate: 0.0335 },
      { min: 45400, max: 110050, rate: 0.066 },
      { min: 110050, max: 229550, rate: 0.076 },
      { min: 229550, max: null, rate: 0.0875 },
    ],
    notableCredits: ["Earned income credit (38% of federal)"],
  },
  VA: {
    name: "Virginia", abbreviation: "VA", taxType: "progressive", standardDeduction: 8000,
    brackets: [
      { min: 0, max: 3000, rate: 0.02 },
      { min: 3000, max: 5000, rate: 0.03 },
      { min: 5000, max: 17000, rate: 0.05 },
      { min: 17000, max: null, rate: 0.0575 },
    ],
    notableCredits: ["Low-income tax credit"],
  },
  WV: {
    name: "West Virginia", abbreviation: "WV", taxType: "progressive", standardDeduction: 0,
    brackets: [
      { min: 0, max: 10000, rate: 0.0236 },
      { min: 10000, max: 25000, rate: 0.0315 },
      { min: 25000, max: 40000, rate: 0.0354 },
      { min: 40000, max: 60000, rate: 0.0472 },
      { min: 60000, max: null, rate: 0.0512 },
    ],
  },
  WI: {
    name: "Wisconsin", abbreviation: "WI", taxType: "progressive", standardDeduction: 12760,
    brackets: [
      { min: 0, max: 14320, rate: 0.035 },
      { min: 14320, max: 28640, rate: 0.044 },
      { min: 28640, max: 315310, rate: 0.053 },
      { min: 315310, max: null, rate: 0.0765 },
    ],
    notableCredits: ["Earned income credit", "Homestead credit"],
  },
};

export const calculateStateTax = async (
  input: StateTaxInput,
): Promise<StateTaxResult> => {
  const abbr = input.stateAbbreviation.toUpperCase();
  const stateInfo = STATE_TAX_DATA[abbr];

  if (!stateInfo) {
    throw new Error(`Unknown state abbreviation: ${abbr}`);
  }

  const deduction = stateInfo.standardDeduction ?? 0;
  const taxableIncome = Math.max(0, input.grossIncome - deduction);

  if (stateInfo.taxType === "none") {
    return {
      stateName: stateInfo.name,
      stateAbbreviation: abbr,
      taxType: "none",
      stateTax: 0,
      stateEffectiveRate: 0,
      topRate: 0,
      brackets: [],
      standardDeduction: 0,
      notableCredits: stateInfo.notableCredits ?? [],
    };
  }

  if (stateInfo.taxType === "flat") {
    const rate = stateInfo.flatRate ?? 0;
    const tax = Math.round(taxableIncome * rate);
    return {
      stateName: stateInfo.name,
      stateAbbreviation: abbr,
      taxType: "flat",
      stateTax: tax,
      stateEffectiveRate: input.grossIncome > 0 ? Math.round((tax / input.grossIncome) * 10000) / 10000 : 0,
      topRate: rate,
      brackets: [{ min: 0, max: taxableIncome, rate, taxableAmount: taxableIncome, tax }],
      standardDeduction: deduction,
      notableCredits: stateInfo.notableCredits ?? [],
    };
  }

  // Progressive
  const brackets = stateInfo.brackets ?? [];
  let remaining = taxableIncome;
  let totalTax = 0;
  let topRate = 0;
  const breakdownBrackets: StateTaxResult["brackets"] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const bracketWidth = (bracket.max ?? Infinity) - bracket.min;
    const taxableAmount = Math.min(remaining, bracketWidth);
    const bracketTax = Math.round(taxableAmount * bracket.rate * 100) / 100;

    breakdownBrackets.push({
      min: bracket.min,
      max: bracket.max ?? taxableIncome,
      rate: bracket.rate,
      taxableAmount,
      tax: bracketTax,
    });

    totalTax += bracketTax;
    topRate = bracket.rate;
    remaining -= taxableAmount;
  }

  const stateTax = Math.round(totalTax);

  return {
    stateName: stateInfo.name,
    stateAbbreviation: abbr,
    taxType: "progressive",
    stateTax,
    stateEffectiveRate: input.grossIncome > 0 ? Math.round((stateTax / input.grossIncome) * 10000) / 10000 : 0,
    topRate,
    brackets: breakdownBrackets,
    standardDeduction: deduction,
    notableCredits: stateInfo.notableCredits ?? [],
  };
};

export type { StateTaxInput, StateTaxResult, StateTaxInfo, FilingStatus };
