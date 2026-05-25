"use client";

import { createContext, useContext, ReactNode } from "react";
import { getTerminology, type Terminology, type WorkspaceType } from "@/lib/utils/terminology";

const TerminologyContext = createContext<Terminology | null>(null);

export function TerminologyProvider({
  workspaceType,
  children,
}: {
  workspaceType: WorkspaceType;
  children: ReactNode;
}) {
  const terminology = getTerminology(workspaceType);
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
