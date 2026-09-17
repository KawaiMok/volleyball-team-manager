"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";
import { formatDateTimeZh } from "@/lib/format-datetime";

type PromptPreview = {
  modelId: string;
  system: string;
  user: string;
  temperature: number;
};

type Props = {
  title: string;
  description: string;
  actionLabel: string;
  previewUrl: string;
  runUrl: string;
  disabled?: boolean;
  disabledHint?: string;
  /** 已存結果摘要（註解：分析後／建議後顯示）。 */
  storedSummary?: React.ReactNode;
  /** 教練補充 placeholder（註解：訓練建議可自訂時段提示）。 */
  supplementPlaceholder?: string;
  /** 教練補充說明（註解：顯示於 textarea 下方）。 */
  supplementHint?: string;
  onSuccess?: () => void;
};

/** 團隊體能 AI：補充 → 預覽 prompt → 確認呼叫（註解：共用元件）。 */
export function TeamFitnessAiWorkflowPanel({
  title,
  description,
  actionLabel,
  previewUrl,
  runUrl,
  disabled = false,
  disabledHint,
  storedSummary,
  supplementPlaceholder = "例如：賽季前強化、主力與替補分組、器材限制…",
  supplementHint = "先預覽 prompt，確認後才呼叫 DeepSeek；不含選手姓名、隊名、事件名。",
  onSuccess,
}: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [supplement, setSupplement] = useState("");
  const [preview, setPreview] = useState<PromptPreview | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [runPending, setRunPending] = useState(false);

  const busy = previewPending || runPending;

  function resetPreview() {
    setPreview(null);
  }

  function onSupplementChange(value: string) {
    setSupplement(value);
    resetPreview();
  }

  async function loadPreview() {
    if (disabled) return;
    setPreviewPending(true);
    try {
      const res = await fetch(previewUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplement: supplement.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        preview?: PromptPreview;
      };
      if (!res.ok) {
        showError(data.error ?? `預覽失敗 (${res.status})`);
        return;
      }
      if (!data.preview) {
        showError("預覽回應格式錯誤");
        return;
      }
      setPreview(data.preview);
    } catch {
      showError("網路錯誤");
    } finally {
      setPreviewPending(false);
    }
  }

  async function confirmRun() {
    setRunPending(true);
    try {
      const res = await fetch(runUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplement: supplement.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showError(data.error ?? `產生失敗 (${res.status})`);
        return;
      }
      showSuccess(`${title}已更新`);
      resetPreview();
      onSuccess?.();
      router.refresh();
    } catch {
      showError("網路錯誤");
    } finally {
      setRunPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        {disabled && disabledHint ?
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">{disabledHint}</p>
        : null}
      </div>

      {!preview ?
        <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900 dark:bg-violet-950/30">
          <label className="block text-xs font-medium text-violet-900 dark:text-violet-200">
            教練補充（選填）
            <textarea
              value={supplement}
              onChange={(e) => onSupplementChange(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={disabled || busy}
              placeholder={supplementPlaceholder}
              className="mt-1.5 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 disabled:opacity-60 dark:border-violet-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
          <p className="mt-1 text-xs text-violet-800/80 dark:text-violet-300/80">{supplementHint}</p>
          <button
            type="button"
            onClick={() => void loadPreview()}
            disabled={disabled || busy}
            className="mt-3 rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {previewPending ? "組裝中…" : actionLabel}
          </button>
        </div>
      : (
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-3 dark:border-violet-900 dark:bg-violet-950/20">
          <div className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Debug：將送 DeepSeek 的 Prompt（尚未呼叫）
            </p>
            <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90">
              模型：<span className="font-mono">{preview.modelId}</span>
              {" · "}
              temperature：<span className="font-mono">{preview.temperature}</span>
            </p>
          </div>
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
              System
            </h4>
            <pre className="mt-1.5 max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {preview.system}
            </pre>
          </section>
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
              User
            </h4>
            <pre className="mt-1.5 max-h-56 overflow-auto rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {preview.user}
            </pre>
          </section>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetPreview}
              disabled={busy}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
            >
              返回修改
            </button>
            <button
              type="button"
              onClick={() => void confirmRun()}
              disabled={busy}
              className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
            >
              {runPending ? "呼叫 DeepSeek 中…" : "確認呼叫 DeepSeek"}
            </button>
          </div>
        </div>
      )}

      {storedSummary ?
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {storedSummary}
        </div>
      : null}
    </div>
  );
}

/** 格式化已存時間戳（註解：結果區塊用）。 */
export function formatAiGeneratedAt(iso: string, model?: string) {
  const when = formatDateTimeZh(new Date(iso), { dateStyle: "medium", timeStyle: "short" });
  return model ? `${when} · ${model}` : when;
}
