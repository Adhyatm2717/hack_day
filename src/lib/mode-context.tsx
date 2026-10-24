"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Mode = "charge" | "host";

interface ModeContextValue {
  mode: Mode;
  toggle: () => void;
  setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

export function ModeProvider({
  children,
  defaultMode = "charge",
}: {
  children: ReactNode;
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "charge" ? "host" : "charge"));
  }, []);

  return (
    <ModeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
