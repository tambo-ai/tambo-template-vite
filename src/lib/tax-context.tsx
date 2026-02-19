"use client";

import type { TaxResult } from "@/services/tax-calculator";
import { createContext, useCallback, useContext, useState } from "react";

type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household";

export interface TaxState {
  income: number;
  filingStatus: FilingStatus;
  contribution401k: number;
  contributionHSA: number;
  useStandardDeduction: boolean;
  result: TaxResult | null;
}

interface TaxContextValue {
  state: TaxState;
  update: (partial: Partial<TaxState>) => void;
}

const DEFAULT_STATE: TaxState = {
  income: 0,
  filingStatus: "single",
  contribution401k: 0,
  contributionHSA: 0,
  useStandardDeduction: true,
  result: null,
};

const TaxContext = createContext<TaxContextValue>({
  state: DEFAULT_STATE,
  update: () => {},
});

export function TaxContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TaxState>(DEFAULT_STATE);

  const update = useCallback((partial: Partial<TaxState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <TaxContext.Provider value={{ state, update }}>
      {children}
    </TaxContext.Provider>
  );
}

export function useTaxContext() {
  return useContext(TaxContext);
}
