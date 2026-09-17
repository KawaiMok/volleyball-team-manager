"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";
import { formatDateTimeZh } from "@/lib/format-datetime";
import type { MemberFitnessPromptPreview } from "@/lib/ai/generate-member-fitness-assessment";
import type { MemberFitnessAiReport } from "@/lib/member-fitness-ai-schema";

type Props = {
  memberId: string;
  report: MemberFitnessAiReport | null;
  /** 成功後更新父層名單列（註解：立即顯示新報告）。 */
  onReportUpdated: (report: MemberFitnessAiReport) => void;
  /** 開啟時自動展開補充輸入（註解：從表格「AI」按鈕進入）。 */
  initialExpanded?: boolean;
};

/** 隊員詳情內 AI 體能評估：補充 → 預覽 prompt → 確認後呼叫 DeepSeek（註解：每次覆寫）。 */
export function MemberFitnessAiPanel({
  memberId,
  report,
  onReportUpdated,
  initialExpanded = false,
}: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [expanded, setExpanded] = useState(initialExpanded);
  const [supplement, setSupplement] = useState("");
  const [preview, setPreview] = useState<MemberFitnessPromptPreview | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [generatePending, setGeneratePending] = useState(false);

  function resetPreview() {
    setPreview(null);
  }

  function onSupplementChange(value: string) {
    setSupplement(value);
    resetPreview();
  }

  async function loadPreview() {
    setPreviewPending(true);
    try {
      const res = await fetch(`/api/team/members/${memberId}/fitness-ai/preview`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplement: supplement.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        preview?: MemberFitnessPromptPreview;
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

  async function confirmGenerate() {
    setGeneratePending(true);
    try {
      const res = await fetch(`/api/team/members/${memberId}/fitness-ai`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplement: supplement.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        report?: MemberFitnessAiReport;
      };
      if (!res.ok) {
        showError(data.error ?? `產生失敗 (${res.status})`);
        return;
      }
      if (!data.report) {
        showError("回應格式錯誤");
        return;
      }
      onReportUpdated(data.report);
      showSuccess("AI 體能評估已更新");
      setExpanded(false);
      resetPreview();
      router.refresh();
    } catch {
      showError("網路錯誤");
    } finally {
      setGeneratePending(false);
    }
  }

  const busy = previewPending || generatePending;

  return (
    <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-200">AI 體能評估</h4>
        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            if (expanded) resetPreview();
          }}
          disabled={busy}
          className="rounded-md bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800 disabled:opacity-60 sm:text-sm"
        >
          {expanded ? "收起" : "Call DeepSeek"}
        </button>
      </div>

      {expanded ?
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900 dark:bg-violet-950/30">
          {!preview ?
            <>
              <label className="block text-xs font-medium text-violet-900 dark:text-violet-200">
                教練補充（選填）
                <textarea
                  value={supplement}
                  onChange={(e) => onSupplementChange(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="例如：右肩舊傷、賽季前強化爆發力、每週可訓練 3 次…"
                  className="mt-1.5 w-full rounded-md border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600 dark:border-violet-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <p className="text-xs text-violet-800/80 dark:text-violet-300/80">
                先預覽將送 DeepSeek 的 prompt，確認後才會呼叫 API；每次呼叫會覆寫前次結果。
              </p>
              <button
                type="button"
                onClick={() => void loadPreview()}
                disabled={busy}
                className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
              >
                {previewPending ? "組裝中…" : "產生體能評價與課表"}
              </button>
            </>
          : (
            <>
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
                <h5 className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
                  System
                </h5>
                <pre className="mt-1.5 max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {preview.system}
                </pre>
              </section>
              <section>
                <h5 className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
                  User
                </h5>
                <pre className="mt-1.5 max-h-56 overflow-auto rounded-md border border-zinc-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {preview.user}
                </pre>
              </section>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetPreview}
                  disabled={busy}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  返回修改
                </button>
                <button
                  type="button"
                  onClick={() => void confirmGenerate()}
                  disabled={busy}
                  className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
                >
                  {generatePending ? "呼叫 DeepSeek 中…" : "確認呼叫 DeepSeek"}
                </button>
              </div>
            </>
          )}
        </div>
      : null}

      {report ?
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            產生於{" "}
            {formatDateTimeZh(new Date(report.generatedAt), {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {report.model ? ` · ${report.model}` : null}
          </p>
          {report.supplement ?
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">教練補充：</span>
              {report.supplement}
            </p>
          : null}
          <section>
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">體能評價</h5>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {report.evaluation}
            </div>
          </section>
          <section>
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">體能訓練課表</h5>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {report.trainingPlan}
            </div>
          </section>
        </div>
      : (
        !expanded && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            尚無 AI 評估。按「Call DeepSeek」輸入補充資料後產生。
          </p>
        )
      )}
    </div>
  );
}
