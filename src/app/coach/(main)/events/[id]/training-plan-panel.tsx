"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Block = {
  id: string;
  order: number;
  name: string;
  minutes: number;
  goal: string;
  setup: string | null;
  steps: unknown;
};

type Plan = {
  title: string | null;
  summary: string | null;
  safetyNotes: string | null;
  blocks: Block[];
} | null;

type Props = {
  eventId: string;
  /** 由伺服端傳入，避免 client bundle 引入 Prisma enum（註解）。 */
  isTraining: boolean;
  initialPlan: Plan;
};

/** 訓練計畫預覽 + AI 產生（註解：僅訓練事件；需伺服器設定 DEEPSEEK_API_KEY）。 */
export function TrainingPlanPanel({ eventId, isTraining, initialPlan }: Props) {
  const router = useRouter();
  const [headcount, setHeadcount] = useState(12);
  const [duration, setDuration] = useState(90);
  const [skillFocus, setSkillFocus] = useState("");
  const [constraints, setConstraints] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isTraining) {
    return <p className="text-sm text-zinc-500">非訓練事件，無訓練計畫。</p>;
  }

  async function generateAi() {
    setError(null);
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/training-plan/ai`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headcount,
        durationMinutes: duration,
        skillFocus: skillFocus || null,
        constraints: constraints || null,
        replace: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? `失敗 (${res.status})`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
        <h3 className="text-sm font-medium text-violet-900">AI 產生訓練內容</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-600">
            人數
            <input
              type="number"
              min={1}
              max={200}
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-600">
            時長（分鐘）
            <input
              type="number"
              min={15}
              max={600}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-600 sm:col-span-2">
            技術重點（選填）
            <input
              value={skillFocus}
              onChange={(e) => setSkillFocus(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
              placeholder="例如：接發球、攔網"
            />
          </label>
          <label className="text-xs text-zinc-600 sm:col-span-2">
            限制（選填）
            <input
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
              placeholder="場地、球數、傷兵…"
            />
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => void generateAi()}
          disabled={pending}
          className="mt-3 rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {pending ? "產生中…" : "用 AI 產生並寫入"}
        </button>
      </div>

      {initialPlan ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-medium">{initialPlan.title ?? "訓練計畫"}</h3>
          {initialPlan.summary ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{initialPlan.summary}</p>
          ) : null}
          {initialPlan.safetyNotes ? (
            <p className="mt-3 text-sm text-amber-900">
              <span className="font-medium">安全：</span>
              {initialPlan.safetyNotes}
            </p>
          ) : null}
          <ol className="mt-4 space-y-4">
            {initialPlan.blocks.map((b) => (
              <li key={b.id} className="border-l-2 border-zinc-300 pl-3">
                <p className="font-medium">
                  {b.name}{" "}
                  <span className="font-normal text-zinc-500">
                    （{b.minutes} 分鐘）
                  </span>
                </p>
                <p className="mt-1 text-sm text-zinc-700">{b.goal}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">尚無訓練計畫，可用 AI 產生或稍後以 API 建立。</p>
      )}
    </div>
  );
}
