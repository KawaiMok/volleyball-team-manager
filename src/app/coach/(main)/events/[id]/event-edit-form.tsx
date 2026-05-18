"use client";
import { useToast } from "@/components/toast-provider";

import {
  EventParticipantRuleFields,
  type EventRosterRow,
  validateParticipantRuleForSubmit,
} from "@/app/coach/(main)/events/event-participant-rule-fields";
import type { ParticipantRule } from "@/lib/participant-rule-types";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** 與 Prisma EventType 一致（註解：client 不直接 import generated prisma）。 */
const EVENT_TYPES = ["TRAINING", "MATCH", "OTHER"] as const;

type Props = {
  eventId: string;
  initial: {
    title: string;
    type: string;
    description: string | null;
    startsAtIso: string;
    endsAtIso: string;
    meetAtIso: string | null;
    locationName: string | null;
    rsvpDeadlineIso: string | null;
  };
  squads: string[];
  roster: EventRosterRow[];
  initialParticipantRule: ParticipantRule;
};

/** ISO → datetime-local 字串（註解：依使用者本機時區）。 */
function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 教練編輯事件（註解：PATCH /api/events/[id]，含 RSVP 截止與參與者規則）。 */
export function EventEditForm({ eventId, initial, squads, roster, initialParticipantRule }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [participantRule, setParticipantRule] = useState<ParticipantRule>(initialParticipantRule);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const vr = validateParticipantRuleForSubmit(participantRule, squads);
    if (vr) {
      showError(vr);
      return;
    }

    setPending(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const type = String(fd.get("type") ?? "");
    const descriptionRaw = String(fd.get("description") ?? "").trim();
    const startsAt = String(fd.get("startsAt") ?? "");
    const endsAt = String(fd.get("endsAt") ?? "");
    const meetAtRaw = String(fd.get("meetAt") ?? "").trim();
    const locationName = String(fd.get("locationName") ?? "").trim();
    const rsvpDeadlineRaw = String(fd.get("rsvpDeadlineAt") ?? "").trim();

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "未命名事件",
          type,
          description: descriptionRaw || null,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          meetAt: meetAtRaw ? new Date(meetAtRaw).toISOString() : null,
          locationName: locationName || null,
          rsvpDeadlineAt: rsvpDeadlineRaw ? new Date(rsvpDeadlineRaw).toISOString() : null,
          participantRule,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        showError((data as { error?: string }).error ?? `更新失敗 (${res.status})`);
        return;
      }
      showSuccess("已更新活動");
      router.refresh();
    } catch {
      setPending(false);
      showError("網路錯誤");
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <div>
        <label htmlFor={`edit-title-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          標題
        </label>
        <input
          id={`edit-title-${eventId}`}
          name="title"
          type="text"
          required
          defaultValue={initial.title}
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor={`edit-type-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          類型
        </label>
        <select
          id={`edit-type-${eventId}`}
          name="type"
          defaultValue={initial.type}
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "TRAINING" ? "訓練" : t === "MATCH" ? "比賽" : "其他"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`edit-desc-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          說明（選填）
        </label>
        <textarea
          id={`edit-desc-${eventId}`}
          name="description"
          rows={3}
          defaultValue={initial.description ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`edit-starts-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            開始
          </label>
          <input
            id={`edit-starts-${eventId}`}
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={isoToDatetimeLocal(initial.startsAtIso)}
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label htmlFor={`edit-ends-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            結束
          </label>
          <input
            id={`edit-ends-${eventId}`}
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={isoToDatetimeLocal(initial.endsAtIso)}
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`edit-meet-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          集合（選填）
        </label>
        <input
          id={`edit-meet-${eventId}`}
          name="meetAt"
          type="datetime-local"
          defaultValue={initial.meetAtIso ? isoToDatetimeLocal(initial.meetAtIso) : ""}
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor={`edit-loc-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          場館（選填）
        </label>
        <input
          id={`edit-loc-${eventId}`}
          name="locationName"
          type="text"
          defaultValue={initial.locationName ?? ""}
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor={`edit-rsvp-${eventId}`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          RSVP 截止（選填）
        </label>
        <input
          id={`edit-rsvp-${eventId}`}
          name="rsvpDeadlineAt"
          type="datetime-local"
          defaultValue={initial.rsvpDeadlineIso ? isoToDatetimeLocal(initial.rsvpDeadlineIso) : ""}
          className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">須早於或等於「開始」時間；清空表示不強制截止。</p>
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
        className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60"
      >
        {pending ? "儲存中…" : "儲存變更"}
      </button>
    </form>
  );
}
