"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { DataViewMode } from "@/lib/data-view-mode";
import {
  getDataViewPreference,
  setDataViewPreference,
  subscribeDataViewPreference,
} from "@/lib/data-view-preference";

type ContextValue = {
  mode: DataViewMode;
  setMode: (mode: DataViewMode) => void;
};

const DataViewModeContext = createContext<ContextValue | null>(null);

/** 全站數據檢視模式（註解：表格／圖表；localStorage 持久化）。 */
export function DataViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DataViewMode>("chart");

  useEffect(() => {
    setModeState(getDataViewPreference());
    return subscribeDataViewPreference(() => {
      setModeState(getDataViewPreference());
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode: (next: DataViewMode) => {
        setDataViewPreference(next);
        setModeState(next);
      },
    }),
    [mode],
  );

  return <DataViewModeContext.Provider value={value}>{children}</DataViewModeContext.Provider>;
}

export function useDataViewMode(): ContextValue {
  const ctx = useContext(DataViewModeContext);
  if (!ctx) {
    throw new Error("useDataViewMode 須在 DataViewModeProvider 內使用");
  }
  return ctx;
}
