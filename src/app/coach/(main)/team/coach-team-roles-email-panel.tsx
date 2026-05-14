"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { TeamNotificationSettings } from "@/lib/team-notification-settings";

type Props = {
  initialNotifications: TeamNotificationSettings;
};

/** 角色說明 + Email 通知開關（註解：開關先寫入 DB；實際寄信需後端排程接上）。 */
export function CoachTeamRolesEmailPanel({ initialNotifications }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [rPlayers, setRPlayers] = useState(initialNotifications.emailRsvpReminderToPlayers);
  const [digestCoaches, setDigestCoaches] = useState(initialNotifications.emailDigestToCoaches);

  useEffect(() => {
    setRPlayers(initialNotifications.emailRsvpReminderToPlayers);
    setDigestCoaches(initialNotifications.emailDigestToCoaches);
  }, [initialNotifications.emailRsvpReminderToPlayers, initialNotifications.emailDigestToCoaches]);

  async function saveNotifications() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/team/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationSettings: {
            emailRsvpReminderToPlayers: rPlayers,
            emailDigestToCoaches: digestCoaches,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `儲存失敗 (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setPending(false);
      setError("網路錯誤");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">角色與權限</h3>
        <p className="mt-1 text-xs text-zinc-500">
          編輯個別成員角色請在下方名單點「編輯」。僅「管理員」可指派或調整管理員。
        </p>
        <dl className="mt-3 space-y-2 text-sm text-zinc-700">
          <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900">管理員</dt>
            <dd>隊伍設定、成員角色（含管理員）、敏感操作；建議至少一人。</dd>
          </div>
          <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900">教練</dt>
            <dd>事件、行事曆、訓練計畫、點名與身體回饋彙總；不可指派管理員。</dd>
          </div>
          <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900">隊務</dt>
            <dd>預留擴充（目前教練端以管理員／教練為主）。</dd>
          </div>
          <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900">球員</dt>
            <dd>球員端行程、RSVP、訓練內容與身體回饋。</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-zinc-100 pt-4">
        <h3 className="text-sm font-semibold text-zinc-900">Email 通知（偏好）</h3>
        <p className="mt-1 text-xs text-zinc-500">以下選項僅儲存隊伍偏好；實際寄信需接上郵件服務與排程後才會生效。</p>
        {error ?
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        : null}
        <ul className="mt-3 space-y-3">
          <li className="flex items-start gap-3">
            <input
              id="notif-rsvp-players"
              type="checkbox"
              checked={rPlayers}
              onChange={(e) => setRPlayers(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="notif-rsvp-players" className="text-sm text-zinc-800">
              <span className="font-medium">RSVP 截止前提醒球員</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-500">（預留：依事件截止寄送）</span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="notif-digest-coaches"
              type="checkbox"
              checked={digestCoaches}
              onChange={(e) => setDigestCoaches(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300"
            />
            <label htmlFor="notif-digest-coaches" className="text-sm text-zinc-800">
              <span className="font-medium">教練／管理員摘要信</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-500">（預留：每日或每週彙整）</span>
            </label>
          </li>
        </ul>
        <button
          type="button"
          disabled={pending}
          onClick={() => void saveNotifications()}
          className="mt-4 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
        >
          {pending ? "儲存中…" : "儲存通知設定"}
        </button>
      </div>
    </div>
  );
}
