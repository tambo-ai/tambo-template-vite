"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod/v3";

export const bracketTableSchema = z.object({
  title: z.string().describe("Title for the table"),
  brackets: z
    .array(
      z.object({
        rate: z.string().describe("Tax rate as a string like '10%'"),
        min: z.number().describe("Minimum income for this bracket"),
        max: z
          .number()
          .nullable()
          .describe("Maximum income for this bracket, null for top bracket"),
        tax: z
          .number()
          .describe("Tax owed at the top of this bracket (cumulative)"),
      }),
    )
    .describe("Array of tax bracket data"),
  filingStatus: z
    .string()
    .optional()
    .describe("Filing status label, e.g. 'Single'"),
  highlightBracket: z
    .number()
    .optional()
    .describe("Index of bracket to highlight (the user's bracket)"),
});

export type BracketTableProps = z.infer<typeof bracketTableSchema>;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const BracketTable = React.forwardRef<HTMLDivElement, BracketTableProps>(
  ({ title, brackets, filingStatus, highlightBracket }, ref) => {
    if (!brackets || brackets.length === 0) {
      return (
        <div ref={ref} className="w-full rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Awaiting data...</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="w-full rounded-lg border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {filingStatus && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {filingStatus}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Rate
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Income Range
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Cumulative Tax
                </th>
              </tr>
            </thead>
            <tbody>
              {brackets.map((bracket, i) => {
                const isHighlighted = highlightBracket === i;
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border/50 last:border-b-0 transition-colors",
                      isHighlighted && "bg-primary/5",
                    )}
                  >
                    <td
                      className={cn(
                        "px-4 py-2.5 font-mono font-semibold",
                        isHighlighted
                          ? "text-primary border-l-2 border-l-primary"
                          : "border-l-2 border-l-transparent",
                      )}
                    >
                      {bracket.rate}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">
                      {fmt(bracket.min)}
                      {" — "}
                      {bracket.max !== null ? fmt(bracket.max) : "and above"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">
                      {fmt(bracket.tax)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

BracketTable.displayName = "BracketTable";
