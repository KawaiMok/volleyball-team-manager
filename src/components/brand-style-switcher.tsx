"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppLogo } from "@/components/brand/app-logo";
import { useBrandStyle } from "@/components/brand/brand-style-provider";
import {
  BRAND_STYLE_DESCRIPTIONS,
  BRAND_STYLE_LABELS,
  type BrandStyleId,
} from "@/lib/brand-style";
import { setBrandStylePreference } from "@/lib/brand-style-preference";

type Variant = "coach" | "player";

const options: BrandStyleId[] = ["default", "ciqing"];

type Props = {
  variant: Variant;
};

/**
 * Logo／Avatar 風格切換（註解：預設 vs 慈青；寫入 localStorage + API + cookie）。
 */
export function BrandStyleSwitcher({ variant }: Props) {
  const { style, setStyle } = useBrandStyle();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/me/brand-style")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { style?: BrandStyleId } | null) => {
        if (data?.style && data.style !== style) {
          setBrandStylePreference(data.style);
          setStyle(data.style);
        }
      })
      .catch(() => {});
    // 註解：僅 mount 時與伺服端同步一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrap =
    variant === "coach" ?
      "inline-flex shrink-0 flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100/90 p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80"
    : "inline-flex shrink-0 flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/90 p-1 shadow-sm dark:border-slate-600 dark:bg-slate-800/80";

  async function select(next: BrandStyleId) {
    if (next === style || saving) return;
    setSaving(true);
    setBrandStylePreference(next);
    setStyle(next);
    try {
      await fetch("/api/me/brand-style", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function btnClass(active: boolean) {
    if (active) {
      return variant === "coach" ?
          "rounded-md bg-zinc-900 px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
        : "rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm dark:bg-slate-100 dark:text-slate-900";
    }
    return variant === "coach" ?
        "rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-white/80 dark:text-zinc-300 dark:hover:bg-zinc-700/50"
      : "rounded-md px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-700/50";
  }

  return (
    <div className={wrap} role="group" aria-label="Logo 與 Avatar 風格">
      {options.map((id) => {
        const active = style === id;
        return (
          <button
            key={id}
            type="button"
            title={BRAND_STYLE_DESCRIPTIONS[id]}
            className={`flex flex-col items-center gap-1 ${btnClass(active)}`}
            aria-pressed={active}
            disabled={saving}
            onClick={() => void select(id)}
          >
            <AppLogo variant="badge" size={28} style={id} />
            <span>{BRAND_STYLE_LABELS[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
