"use client";

import {
  EventParticipantRuleFields,
  type EventRosterRow,
  validateParticipantRuleForSubmit,
} from "@/app/coach/(main)/events/event-participant-rule-fields";
import type { ParticipantRule } from "@/lib/participant-rule-types";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { teamId: string; squads: string[]; roster: EventRosterRow[] };

/** 與 Prisma EventType 一致（註解：client 不直接 import generated prisma）。 */
const EVENT_TYPES = ["TRAINING", "MATCH", "OTHER"] as const;

/** 建立草稿事件表單（註解：含完整參與者規則 ALL／SQUADS／MEMBERS）。 */
export function EventCreateForm({ teamId, squads, roster }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [participantRule, setParticipantRule] = useState<ParticipantRule>({ kind: "ALL" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const vr = validateParticipantRuleForSubmit(participantRule, squads);
    if (vr) {
      setError(vr);
      return;
    }

    setPending(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const type = fd.get("type") as string;
    const startsAt = String(fd.get("startsAt") ?? "");
    const endsAt = String(fd.get("endsAt") ?? "");
    const locationName = String(fd.get("locationName") ?? "").trim() || null;
    const rsvpDeadlineRaw = String(fd.get("rsvpDeadlineAt") ?? "").trim();

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          type,
          title: title || "未命名事件",
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          locationName,
          rsvpDeadlineAt: rsvpDeadlineRaw ? new Date(rsvpDeadlineRaw).toISOString() : null,
          participantRule,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `建立失敗 (${res.status})`);
        setPending(false);
        return;
      }
      router.push(`/coach/events/${(data as { id: string }).id}`);
      router.refresh();
    } catch {
      setError("網路錯誤");
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="max-w-lg space-y-5">
      {error ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      : null}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          標題
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          placeholder="例如：接發球專項訓練"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          類型
        </label>
        <select
          id="type"
          name="type"
          defaultValue="TRAINING"
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "TRAINING" ? "訓練" : t === "MATCH" ? "比賽" : "其他"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            開始
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            結束
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rsvpDeadlineAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          RSVP 截止（選填）
        </label>
        <input
          id="rsvpDeadlineAt"
          name="rsvpDeadlineAt"
          type="datetime-local"
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          須早於或等於「開始」時間；未填則球員可隨時更新 RSVP（至事件結束前皆無強制截止）。
        </p>
      </div>

      <div>
        <label htmlFor="locationName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          場館（選填）
        </label>
        <input
          id="locationName"
          name="locationName"
          type="text"
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <EventParticipantRuleFields
        squads={squads}
        roster={roster}
        value={participantRule}
        onChange={setParticipantRule}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "建立中…" : "建立草稿"}
      </button>
    </form>
  );
}
