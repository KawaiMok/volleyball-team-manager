"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  applyDomBrandStyle,
  getBrandStylePreference,
  setBrandStylePreference,
  subscribeBrandStylePreference,
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

/** 全站 Logo／Avatar 風格（註解：SSR initialStyle + localStorage 同步）。 */
export function BrandStyleProvider({ initialStyle, children }: Props) {
  const [style, setStyleState] = useState<BrandStyleId>(initialStyle);

  useEffect(() => {
    const stored = getBrandStylePreference();
    if (stored !== initialStyle) {
      setStyleState(stored);
      applyDomBrandStyle(stored);
    } else {
      applyDomBrandStyle(initialStyle);
      if (typeof window !== "undefined" && !localStorage.getItem("vtm-brand-style")) {
        localStorage.setItem("vtm-brand-style", initialStyle);
      }
    }
    return subscribeBrandStylePreference(() => {
      setStyleState(getBrandStylePreference());
    });
  }, [initialStyle]);

  const value = useMemo(
    () => ({
      style,
      setStyle: (next: BrandStyleId) => {
        setBrandStylePreference(next);
        setStyleState(next);
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
      style: "default",
      setStyle: () => {},
    };
  }
  return ctx;
}
