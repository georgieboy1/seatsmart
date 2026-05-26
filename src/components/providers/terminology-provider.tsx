"use client";

import { createContext, useContext, ReactNode } from "react";
import { getTerminology, type Terminology } from "@/lib/utils/terminology";

const TerminologyContext = createContext<Terminology | null>(null);

export function TerminologyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const terminology = getTerminology();
  return (
    <TerminologyContext.Provider value={terminology}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminology() {
  const context = useContext(TerminologyContext);
  if (!context) {
    throw new Error("useTerminology must be used within a TerminologyProvider");
  }
  return context;
}
