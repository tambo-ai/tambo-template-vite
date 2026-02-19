/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { ActionItems, actionItemsSchema } from "@/components/tambo/action-items";
import { BracketTable, bracketTableSchema } from "@/components/tambo/bracket-table";
import { BracketWaterfall, bracketWaterfallSchema } from "@/components/tambo/bracket-waterfall";
import { ComparisonCards, comparisonCardsSchema } from "@/components/tambo/comparison-cards";
import { DeductionFinder, deductionFinderSchema } from "@/components/tambo/deduction-finder";
import { DeductionTable, deductionTableSchema } from "@/components/tambo/deduction-table";
import { StateSummaryCard, stateSummaryCardSchema } from "@/components/tambo/state-summary-card";
import { TaxBreakdown, taxBreakdownSchema } from "@/components/tambo/tax-breakdown";
import { TaxCalculator, taxCalculatorSchema } from "@/components/tambo/tax-calculator";
import { TaxComparison, taxComparisonSchema } from "@/components/tambo/tax-comparison";
import { TaxTimeline, taxTimelineSchema } from "@/components/tambo/tax-timeline";
import { getUserLocation } from "@/services/geolocation";
import { calculateStateTax } from "@/services/state-tax";
import {
  calculateFederalTax,
  findDeductions,
} from "@/services/tax-calculator";
import { searchTaxRules } from "@/services/tax-rules-search";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "calculateFederalTax",
    description:
      "Calculate federal income tax, FICA, effective rate, and take-home pay for a given income, filing status, and deductions. Returns a full bracket breakdown. Always use this tool for tax calculations — do not estimate.",
    tool: calculateFederalTax,
    inputSchema: z.object({
      grossIncome: z.number(),
      filingStatus: z.enum([
        "single",
        "married_joint",
        "married_separate",
        "head_of_household",
      ]),
      deductions: z.array(
        z.object({ label: z.string(), amount: z.number() }),
      ),
    }),
    outputSchema: z.object({
      grossIncome: z.number(),
      totalDeductions: z.number(),
      taxableIncome: z.number(),
      federalTax: z.number(),
      ficaTax: z.number(),
      effectiveRate: z.number(),
      marginalRate: z.number(),
      takeHome: z.number(),
      bracketBreakdown: z.array(
        z.object({
          rate: z.number(),
          min: z.number(),
          max: z.number(),
          taxableAmount: z.number(),
          tax: z.number(),
        }),
      ),
    }),
  },
  {
    name: "findDeductions",
    description:
      "Analyze a user's tax situation and identify applicable deductions with savings calculations. Returns which deductions apply and why, plus updated tax numbers.",
    tool: findDeductions,
    inputSchema: z.object({
      grossIncome: z.number(),
      filingStatus: z.string(),
      currentFederalTax: z.number(),
      currentDeductions: z.array(
        z.object({ label: z.string(), amount: z.number() }),
      ),
      hasStudentLoans: z.boolean(),
      loanBalance: z.number().optional(),
      hasHSA: z.boolean(),
      currentHSAContribution: z.number().optional(),
      wantsIRA: z.boolean(),
      currentIRAContribution: z.number().optional(),
      donatesCharity: z.boolean(),
      charityAmount: z.number().optional(),
      hasDependents: z.boolean(),
      dependentCount: z.number().optional(),
    }),
    outputSchema: z.object({
      deductions: z.array(
        z.object({
          name: z.string(),
          amount: z.number(),
          annualSavings: z.number(),
          applicable: z.boolean(),
          reason: z.string().optional(),
        }),
      ),
      totalAnnualSavings: z.number(),
      totalMonthlySavings: z.number(),
      newFederalTax: z.number(),
      newEffectiveRate: z.number(),
      newTakeHome: z.number(),
    }),
  },
  {
    name: "getUserLocation",
    description:
      "Detect the user's US state from their IP address. No input needed. Use this to auto-detect their state, then call calculateStateTax with the result. Only call once per conversation.",
    tool: getUserLocation,
    inputSchema: z.object({}),
    outputSchema: z.object({
      stateName: z.string(),
      stateAbbreviation: z.string(),
      city: z.string(),
    }),
  },
  {
    name: "calculateStateTax",
    description:
      "Calculate state income tax for a given state, income, and filing status. Returns tax amount, effective rate, brackets, and notable credits. Use this when the user asks about state taxes.",
    tool: calculateStateTax,
    inputSchema: z.object({
      stateAbbreviation: z.string(),
      grossIncome: z.number(),
      filingStatus: z.enum([
        "single",
        "married_joint",
        "married_separate",
        "head_of_household",
      ]),
    }),
    outputSchema: z.object({
      stateName: z.string(),
      stateAbbreviation: z.string(),
      taxType: z.enum(["none", "flat", "progressive"]),
      stateTax: z.number(),
      stateEffectiveRate: z.number(),
      topRate: z.number(),
      brackets: z.array(
        z.object({
          min: z.number(),
          max: z.number(),
          rate: z.number(),
          taxableAmount: z.number(),
          tax: z.number(),
        }),
      ),
      standardDeduction: z.number(),
      notableCredits: z.array(z.string()),
    }),
  },
  {
    name: "searchTaxRules",
    description:
      "Search for current 2025 tax rules, limits, rates, and deadlines. Use this when the user asks about current tax law, contribution limits, filing deadlines, or any tax rules. Returns authoritative IRS-sourced data for the 2025 tax year.",
    tool: searchTaxRules,
    inputSchema: z.object({
      query: z.string().describe("Search query about tax rules, e.g. '401k limits' or 'capital gains rates'"),
    }),
    outputSchema: z.object({
      query: z.string(),
      results: z.array(
        z.object({
          title: z.string(),
          content: z.string(),
          source: z.string(),
        }),
      ),
      taxYear: z.number(),
    }),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "BracketTable",
    description:
      "Displays 2024 US federal income tax brackets as a clean reference table (rate, income range, cumulative tax). Use when explaining how income taxes work — render this alongside BracketWaterfall and ComparisonCards to teach progressive taxation. Can optionally highlight the user's bracket if their income is known.",
    component: BracketTable,
    propsSchema: bracketTableSchema,
  },
  {
    name: "BracketWaterfall",
    description:
      "Stacked bar chart showing how income fills up tax brackets — each segment is color-coded by rate and labeled with the dollar amount taxed at that rate. This is the key 'aha' visual for progressive taxation. Use alongside BracketTable and ComparisonCards when explaining how taxes work. For the initial explainer, use ~$100k as a default income. When showing a personalized breakdown, use the user's actual taxable income.",
    component: BracketWaterfall,
    propsSchema: bracketWaterfallSchema,
  },
  {
    name: "ComparisonCards",
    description:
      "Side-by-side comparison cards with an optional delta badge. When explaining how taxes work, use this to contrast 'What people think' (flat rate on all income) vs 'How it actually works' (progressive brackets) — showing the dollar difference as a green delta. Can also be used for any A vs B comparison (plans, products, strategies).",
    component: ComparisonCards,
    propsSchema: comparisonCardsSchema,
  },
  {
    name: "TaxCalculator",
    description:
      "Full interactive tax dashboard with income slider, filing status, 401k/HSA sliders, deduction toggle, income flow bar, bracket waterfall chart, and stat cards — all live-updating with no submit button. Render this when the user asks about their personal tax situation (e.g. 'how much would I owe if I make $X?'). Pre-fill the income from the conversation. This component writes to shared context so DeductionFinder can automatically read the user's income, filing status, and current tax. You do NOT need to call the calculateFederalTax tool or render TaxBreakdown separately — this component handles everything.",
    component: TaxCalculator,
    propsSchema: taxCalculatorSchema,
  },
  {
    name: "TaxBreakdown",
    description:
      "Standalone tax results dashboard — use only when you need to show a breakdown for a hypothetical scenario WITHOUT user interaction (e.g. 'what if someone makes $200k?'). For interactive personal calculations, use TaxCalculator instead which includes this visualization built-in. Takes pre-computed numbers from the calculateFederalTax tool.",
    component: TaxBreakdown,
    propsSchema: taxBreakdownSchema,
  },
  {
    name: "DeductionFinder",
    description:
      "Interactive deduction finder with built-in questions (student loans, Traditional IRA, charity, dependents), inline savings bars per deduction, and a before/after tax comparison at the bottom — all live-updating. Automatically reads income, filing status, and current tax from TaxCalculator via shared context — you can pass grossIncome/filingStatus as optional overrides but usually just omit them. Render this when the user asks how to pay less in taxes or find deductions. You do NOT need to call the findDeductions tool separately.",
    component: DeductionFinder,
    propsSchema: deductionFinderSchema,
  },
  {
    name: "DeductionTable",
    description:
      "Table listing each discovered deduction with its name, amount, and annual tax savings. Non-applicable deductions are shown dimmed with a note explaining why they don't help. Includes a total savings row. Render this after the findDeductions tool returns results — show it alongside TaxComparison and ActionItems.",
    component: DeductionTable,
    propsSchema: deductionTableSchema,
  },
  {
    name: "TaxComparison",
    description:
      "Before/after tax comparison with two side-by-side cards showing federal tax, effective rate, and take-home pay. Changed values are highlighted in green. A large delta badge shows annual and monthly savings. Render this after the findDeductions tool returns results — show it alongside DeductionTable and ActionItems.",
    component: TaxComparison,
    propsSchema: taxComparisonSchema,
  },
  {
    name: "ActionItems",
    description:
      "Checklist of concrete next steps the user can take to save money, each with an action description, savings amount, and priority level (e.g. 'Max out HSA ($4,150) → saves $912/yr'). Include tradeoff notes where relevant (e.g. impact on take-home pay). Render this after the findDeductions tool returns results — show it alongside TaxComparison and DeductionTable as the final optimization output.",
    component: ActionItems,
    propsSchema: actionItemsSchema,
  },
  {
    name: "TaxTimeline",
    description:
      "Visual vertical timeline of tax deadlines with color-coded categories. Use today's date from context to determine which deadlines are past (set isPast=true). Render when the user asks about tax deadlines, when things are due, or needs a tax calendar.",
    component: TaxTimeline,
    propsSchema: taxTimelineSchema,
  },
  {
    name: "StateSummaryCard",
    description:
      "State tax summary card showing tax type, rate(s), calculated state tax, and combined federal+state effective rate. Reads income and federal tax from shared TaxCalculator context automatically. Render after calculateStateTax returns results.",
    component: StateSummaryCard,
    propsSchema: stateSummaryCardSchema,
  },
];
