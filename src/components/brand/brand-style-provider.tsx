"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  applyDomBrandStyle,
  setBrandStylePreference,
} from "@/lib/brand-style-preference";
import type { BrandStyleId } from "@/lib/brand-style";

type BrandStyleContextValue = {
  style: BrandStyleId;
  setStyle: (next: BrandStyleId) => void;
};

const BrandStyleContext = createContext<BrandStyleContextValue | null>(null);

type Props = {
  initialStyle: BrandStyleId;
  children: React.ReactNode;
};

/** 全站 Logo（註解：固定慈青；切換 UI 已隱藏）。 */
export function BrandStyleProvider({ initialStyle, children }: Props) {
  const lockedStyle: BrandStyleId = "ciqing";
  const [style, setStyleState] = useState<BrandStyleId>(lockedStyle);

  useEffect(() => {
    applyDomBrandStyle(lockedStyle);
    setBrandStylePreference(lockedStyle);
    setStyleState(lockedStyle);
  }, [initialStyle]);

  const value = useMemo(
    () => ({
      style,
      setStyle: (_next: BrandStyleId) => {
        setBrandStylePreference(lockedStyle);
        setStyleState(lockedStyle);
      },
    }),
    [style],
  );

  return <BrandStyleContext.Provider value={value}>{children}</BrandStyleContext.Provider>;
}

export function useBrandStyle(): BrandStyleContextValue {
  const ctx = useContext(BrandStyleContext);
  if (!ctx) {
    return {
      style: "ciqing",
      setStyle: () => {},
    };
  }
  return ctx;
}
