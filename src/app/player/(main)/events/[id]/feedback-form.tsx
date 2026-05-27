"use client";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { sanitizeNonNegativeIntInput } from "@/lib/numeric-input";

type Props = {
  eventId: string;
  /** 初始值（註解：若已有回饋則預填以利修改）。 */
  initial?: {
    rpe: number;
    fatigue: "LOW" | "MED" | "HIGH";
    painLevel: "NONE" | "MILD" | "SEVERE";
    painArea: string | null;
    note: string | null;
  };
  readOnly?: boolean;
};

/** 賽後／訓後回饋（註解：POST /api/events/[id]/feedback；結束後 24 小時內可更新）。 */
export function PlayerFeedbackForm({ eventId, initial, readOnly }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [rpe, setRpe] = useState(String(initial?.rpe ?? 5));
  const [fatigue, setFatigue] = useState<"LOW" | "MED" | "HIGH">(initial?.fatigue ?? "MED");
  const [painLevel, setPainLevel] = useState<"NONE" | "MILD" | "SEVERE">(initial?.painLevel ?? "NONE");
  const [painArea, setPainArea] = useState(initial?.painArea ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const rpeNum = Number(rpe);
    if (!Number.isFinite(rpeNum) || rpeNum < 1 || rpeNum > 10) {
      showError("RPE 請填 1–10");
      return;
    }
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/feedback`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rpe: rpeNum,
        fatigue,
        painLevel,
        painArea: painArea.trim() || null,
        note: note.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      showError((data as { error?: string }).error ?? `失敗 (${res.status})`);
      return;
    }
    showSuccess(initial ? "已更新身體回饋" : "已送出身體回饋");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">身體回饋（RPE／疲勞／疼痛）</h3>
      <label className="block text-xs text-slate-600 dark:text-slate-400">
        RPE 自覺強度（1–10）
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={rpe}
          placeholder="1–10"
          onChange={(e) => setRpe(sanitizeNonNegativeIntInput(e.target.value))}
          disabled={readOnly || pending}
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm tabular-nums"
        />
      </label>
      <fieldset disabled={readOnly || pending} className="space-y-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">疲勞程度</span>
        <div className="flex flex-wrap gap-4 text-sm">
          {(["LOW", "MED", "HIGH"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="fatigue" checked={fatigue === v} onChange={() => setFatigue(v)} />
              {v === "LOW" ? "低" : v === "MED" ? "中" : "高"}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={readOnly || pending} className="space-y-2">
        <span className="text-xs text-slate-600 dark:text-slate-400">疼痛程度</span>
        <div className="flex flex-wrap gap-4 text-sm">
          {(["NONE", "MILD", "SEVERE"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="pain" checked={painLevel === v} onChange={() => setPainLevel(v)} />
              {v === "NONE" ? "無" : v === "MILD" ? "輕微" : "明顯"}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-xs text-slate-600 dark:text-slate-400">
        疼痛部位（選填）
        <input
          value={painArea}
          onChange={(e) => setPainArea(e.target.value)}
          disabled={readOnly || pending}
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs text-slate-600 dark:text-slate-400">
        其他備註（選填）
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          disabled={readOnly || pending}
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
        />
      </label>
      {!readOnly ?
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "送出中…" : initial ? "更新回饋" : "送出回饋"}
        </button>
      : null}
      {readOnly ?
        <p className="text-xs text-slate-500 dark:text-slate-400">已超過可編輯時間（送出後 24 小時內可修改）。</p>
      : null}
    </form>
  );
}
