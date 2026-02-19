interface TaxRulesSearchInput {
  query: string;
}

interface TaxRulesSearchResult {
  query: string;
  results: {
    title: string;
    content: string;
    source: string;
  }[];
  taxYear: number;
}

const TAX_RULES_2025: Record<string, { title: string; content: string; source: string }[]> = {
  brackets: [
    {
      title: "2025 Federal Income Tax Brackets (Single Filer)",
      content:
        "10%: $0–$11,925 | 12%: $11,926–$48,475 | 22%: $48,476–$103,350 | 24%: $103,351–$197,300 | 32%: $197,301–$250,525 | 35%: $250,526–$626,350 | 37%: Over $626,350",
      source: "IRS Revenue Procedure 2024-40",
    },
    {
      title: "2025 Federal Income Tax Brackets (Married Filing Jointly)",
      content:
        "10%: $0–$23,850 | 12%: $23,851–$96,950 | 22%: $96,951–$206,700 | 24%: $206,701–$394,600 | 32%: $394,601–$501,050 | 35%: $501,051–$751,600 | 37%: Over $751,600",
      source: "IRS Revenue Procedure 2024-40",
    },
  ],
  "standard deduction": [
    {
      title: "2025 Standard Deduction Amounts",
      content:
        "Single: $15,000 | Married Filing Jointly: $30,000 | Head of Household: $22,500 | Married Filing Separately: $15,000. Additional deduction for age 65+/blind: $1,600 (single) or $1,300 (married).",
      source: "IRS Revenue Procedure 2024-40",
    },
  ],
  fica: [
    {
      title: "2025 FICA Tax Rates",
      content:
        "Social Security: 6.2% on wages up to $176,100 (up from $168,600 in 2024). Medicare: 1.45% on all wages. Additional Medicare Tax: 0.9% on wages over $200,000 (single) or $250,000 (married filing jointly).",
      source: "SSA Fact Sheet 2025",
    },
  ],
  "401k": [
    {
      title: "2025 401(k) Contribution Limits",
      content:
        "Employee elective deferral: $23,500 (up from $23,000 in 2024). Catch-up contribution (age 50+): $7,500. NEW: Super catch-up (ages 60–63): $11,250. Total annual additions limit: $70,000.",
      source: "IRS Notice 2024-80",
    },
  ],
  hsa: [
    {
      title: "2025 HSA Contribution Limits",
      content:
        "Self-only coverage: $4,300 (up from $4,150 in 2024). Family coverage: $8,550 (up from $8,300 in 2024). Catch-up contribution (age 55+): $1,000. Minimum deductible: $1,650 (self) / $3,300 (family).",
      source: "IRS Revenue Procedure 2024-25",
    },
  ],
  ira: [
    {
      title: "2025 IRA Contribution Limits",
      content:
        "Traditional and Roth IRA limit: $7,000 (same as 2024). Catch-up (age 50+): $1,000. Roth IRA income phase-out: $150,000–$165,000 (single), $236,000–$246,000 (MFJ). Traditional IRA deductibility phase-out (with employer plan): $79,000–$89,000 (single), $126,000–$146,000 (MFJ).",
      source: "IRS Notice 2024-80",
    },
  ],
  "capital gains": [
    {
      title: "2025 Capital Gains Tax Rates",
      content:
        "0% rate: Up to $48,350 (single) / $96,700 (MFJ). 15% rate: $48,351–$533,400 (single) / $96,701–$600,050 (MFJ). 20% rate: Above $533,400 (single) / $600,050 (MFJ). Net Investment Income Tax: Additional 3.8% for high earners.",
      source: "IRS Revenue Procedure 2024-40",
    },
  ],
  "child tax credit": [
    {
      title: "2025 Child Tax Credit",
      content:
        "Child Tax Credit: $2,000 per qualifying child under 17. Refundable portion (ACTC): up to $1,700. Phase-out begins at $200,000 AGI (single) / $400,000 (MFJ). Dependent care credit: Up to $3,000 for one dependent, $6,000 for two or more.",
      source: "IRS Publication 972",
    },
  ],
  "earned income credit": [
    {
      title: "2025 Earned Income Tax Credit (EITC)",
      content:
        "Maximum credit: $649 (no children), $4,328 (1 child), $7,152 (2 children), $8,046 (3+ children). Investment income limit: $11,950. AGI limits vary by filing status and number of children.",
      source: "IRS Revenue Procedure 2024-40",
    },
  ],
  "estate tax": [
    {
      title: "2025 Estate and Gift Tax",
      content:
        "Estate tax exemption: $13,990,000 per individual (up from $13,610,000 in 2024). Annual gift tax exclusion: $19,000 per recipient (up from $18,000 in 2024). Top estate tax rate: 40%.",
      source: "IRS Revenue Procedure 2024-40",
    },
  ],
  deadlines: [
    {
      title: "Key Tax Deadlines for 2025-2026 Tax Season",
      content:
        "Jan 15, 2026: Q4 2025 estimated tax due. Jan 31, 2026: W-2s and 1099s must be sent. Apr 15, 2026: 2025 federal return due + Q1 2026 estimated tax. Jun 15, 2026: Q2 2026 estimated tax due. Sep 15, 2026: Q3 2026 estimated tax due. Oct 15, 2026: Extended return deadline.",
      source: "IRS Tax Calendar 2026",
    },
  ],
  amt: [
    {
      title: "2025 Alternative Minimum Tax (AMT)",
      content:
        "AMT exemption: $88,100 (single) / $137,000 (MFJ). Phase-out begins: $626,350 (single) / $1,252,700 (MFJ). AMT rates: 26% on first $239,100, 28% thereafter.",
      source: "IRS Revenue Procedure 2024-40",
    },
  ],
};

const KEYWORD_MAP: [string[], string][] = [
  [["bracket", "rate", "income tax", "tax rate", "marginal"], "brackets"],
  [["standard deduction", "deduction amount"], "standard deduction"],
  [["fica", "social security", "medicare", "payroll"], "fica"],
  [["401k", "401(k)", "retirement contribution"], "401k"],
  [["hsa", "health savings"], "hsa"],
  [["ira", "individual retirement", "roth"], "ira"],
  [["capital gain", "long term", "short term", "investment tax"], "capital gains"],
  [["child tax credit", "ctc", "dependent credit", "child credit"], "child tax credit"],
  [["eitc", "earned income", "eic"], "earned income credit"],
  [["estate", "gift tax", "inheritance"], "estate tax"],
  [["deadline", "due date", "when", "calendar", "filing date"], "deadlines"],
  [["amt", "alternative minimum"], "amt"],
];

export const searchTaxRules = async (
  input: TaxRulesSearchInput,
): Promise<TaxRulesSearchResult> => {
  const query = input.query.toLowerCase();

  const matchedCategories = new Set<string>();
  for (const [keywords, category] of KEYWORD_MAP) {
    if (keywords.some((kw) => query.includes(kw))) {
      matchedCategories.add(category);
    }
  }

  // If no specific match, return brackets + standard deduction as defaults
  if (matchedCategories.size === 0) {
    matchedCategories.add("brackets");
    matchedCategories.add("standard deduction");
    matchedCategories.add("fica");
  }

  const results: TaxRulesSearchResult["results"] = [];
  for (const category of matchedCategories) {
    const entries = TAX_RULES_2025[category];
    if (entries) {
      results.push(...entries);
    }
  }

  return {
    query: input.query,
    results,
    taxYear: 2025,
  };
};

export type { TaxRulesSearchInput, TaxRulesSearchResult };
