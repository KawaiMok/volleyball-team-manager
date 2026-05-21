"use client";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { TeamNotificationSettings } from "@/lib/team-notification-settings";

/** 是否顯示 Email 通知區塊（註解：郵件排程未就緒前先關閉；下方邏輯與 UI 仍保留）。 */
const SHOW_EMAIL_NOTIFICATION_SETTINGS = false;

type Props = {
  initialNotifications: TeamNotificationSettings;
};

/** 角色說明 + Email 通知開關（註解：開關先寫入 DB；實際寄信需後端排程接上）。 */
export function CoachTeamRolesEmailPanel({ initialNotifications }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [rPlayers, setRPlayers] = useState(initialNotifications.emailRsvpReminderToPlayers);
  const [digestCoaches, setDigestCoaches] = useState(initialNotifications.emailDigestToCoaches);

  useEffect(() => {
    setRPlayers(initialNotifications.emailRsvpReminderToPlayers);
    setDigestCoaches(initialNotifications.emailDigestToCoaches);
  }, [initialNotifications.emailRsvpReminderToPlayers, initialNotifications.emailDigestToCoaches]);

  async function saveNotifications() {
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
        showError((data as { error?: string }).error ?? `儲存失敗 (${res.status})`);
        return;
      }
      showSuccess("已儲存通知設定");
      router.refresh();
    } catch {
      setPending(false);
      showError("網路錯誤");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">角色與權限</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          編輯個別成員角色請在下方名單點「編輯」。僅「管理員」可指派或調整管理員。
        </p>
        <dl className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <div className="flex gap-2 rounded-md bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900 dark:text-zinc-50">管理員</dt>
            <dd>隊伍設定、成員角色（含管理員）、敏感操作；建議至少一人。</dd>
          </div>
          <div className="flex gap-2 rounded-md bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900 dark:text-zinc-50">教練</dt>
            <dd>事件、行事曆、訓練計畫、點名與身體回饋彙總；不可指派管理員。</dd>
          </div>
          <div className="flex gap-2 rounded-md bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900 dark:text-zinc-50">隊務</dt>
            <dd>預留擴充（目前教練端以管理員／教練為主）。</dd>
          </div>
          <div className="flex gap-2 rounded-md bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
            <dt className="w-20 shrink-0 font-medium text-zinc-900 dark:text-zinc-50">球員</dt>
            <dd>球員端行程、RSVP、訓練內容與身體回饋。</dd>
          </div>
        </dl>
      </div>

      {SHOW_EMAIL_NOTIFICATION_SETTINGS ?
        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Email 通知（偏好）</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">以下選項僅儲存隊伍偏好；實際寄信需接上郵件服務與排程後才會生效。</p>
          <ul className="mt-3 space-y-3">
            <li className="flex items-start gap-3">
              <input
                id="notif-rsvp-players"
                type="checkbox"
                checked={rPlayers}
                onChange={(e) => setRPlayers(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <label htmlFor="notif-rsvp-players" className="text-sm text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">RSVP 截止前提醒球員</span>
                <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">（預留：依事件截止寄送）</span>
              </label>
            </li>
            <li className="flex items-start gap-3">
              <input
                id="notif-digest-coaches"
                type="checkbox"
                checked={digestCoaches}
                onChange={(e) => setDigestCoaches(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <label htmlFor="notif-digest-coaches" className="text-sm text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">教練／管理員摘要信</span>
                <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">（預留：每日或每週彙整）</span>
              </label>
            </li>
          </ul>
          <button
            type="button"
            disabled={pending}
            onClick={() => void saveNotifications()}
            className="mt-4 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-950"
          >
            {pending ? "儲存中…" : "儲存通知設定"}
          </button>
        </div>
      : null}
    </div>
  );
}
