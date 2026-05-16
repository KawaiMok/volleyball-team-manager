"use client";

import { useCallback, useEffect, useState } from "react";

import {
  TeamMemberEditForm,
  type TeamMemberEditInitial,
} from "@/app/coach/(main)/team/team-member-edit-form";

/** 名單列（註解：由伺服端序列化後傳入，避免 client 直接拿 Date）。 */
export type TeamRosterRow = {
  id: string;
  updatedAt: string;
  displayName: string | null;
  email: string | null;
  clerkLinked: boolean;
  role: string;
  status: string;
  jerseyNumber: number | null;
  position: string | null;
  squad: string | null;
  phone: string | null;
  notes: string | null;
};

type Props = {
  squads: string[];
  currentMemberId: string;
  rows: TeamRosterRow[];
  actorIsAdmin: boolean;
};

function roleLabel(r: string) {
  switch (r) {
    case "ADMIN":
      return "管理員";
    case "COACH":
      return "教練";
    case "COACH_PLAYER":
      return "教練兼球員";
    case "STAFF":
      return "隊務";
    case "PLAYER":
      return "球員";
    default:
      return r;
  }
}

function statusLabel(s: string) {
  switch (s) {
    case "ACTIVE":
      return "在籍";
    case "INACTIVE":
      return "停用";
    default:
      return s;
  }
}

/** 隊員表格 + 詳情唯讀彈窗 + 編輯對話框（註解：主表僅列必要欄，其餘於「詳情」查看）。 */
export function TeamRosterSection({ squads, currentMemberId, rows, actorIsAdmin }: Props) {
  const [editing, setEditing] = useState<TeamRosterRow | null>(null);
  const [detail, setDetail] = useState<TeamRosterRow | null>(null);

  const closeEdit = useCallback(() => setEditing(null), []);
  const closeDetail = useCallback(() => setDetail(null), []);
  const closeAll = useCallback(() => {
    setEditing(null);
    setDetail(null);
  }, []);

  const modalOpen = Boolean(editing) || Boolean(detail);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeAll]);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const initial: TeamMemberEditInitial | null =
    editing ?
      {
        displayName: editing.displayName ?? "",
        role: editing.role,
        status: editing.status,
        jerseyNumber: editing.jerseyNumber,
        squad: editing.squad,
        position: editing.position,
        phone: editing.phone,
        notes: editing.notes,
      }
    : null;

  return (
    <>
      {/** 註解：`w-full` ＋表身 `w-full` 讓桌機列滿寬；手機仍保留 `min-w` 避免擠爆。 */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[20rem] border-collapse text-left text-sm md:text-[0.9375rem]">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 md:text-[11px]">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium sm:px-4 sm:py-3 md:min-w-[12rem] md:px-5 md:py-3.5">姓名</th>
              <th className="px-3 py-2.5 text-left font-medium sm:px-4 sm:py-3 md:whitespace-nowrap md:px-4 md:py-3.5">角色</th>
              <th className="px-3 py-2.5 text-center font-medium sm:px-4 sm:py-3 md:w-[4.5rem] md:px-3 md:py-3.5">背號</th>
              <th className="px-3 py-2.5 text-left font-medium sm:px-4 sm:py-3 md:w-[6.5rem] md:py-3.5">狀態</th>
              <th className="px-3 py-2.5 text-right font-medium sm:px-4 sm:py-3 md:min-w-[10rem] md:pl-2 md:pr-5 md:py-3.5">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={
                  r.status === "INACTIVE" ?
                    "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-950/80"
                }
              >
                <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-50 sm:px-4 sm:py-3 md:px-5 md:py-3.5">{r.displayName ?? "—"}</td>
                <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200 sm:px-4 sm:py-3 md:px-4 md:py-3.5">{roleLabel(r.role)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-center tabular-nums text-zinc-800 dark:text-zinc-200 sm:px-4 sm:py-3 md:px-3 md:py-3.5">{r.jerseyNumber ?? "—"}</td>
                <td className="px-3 py-2.5 sm:px-4 sm:py-3 md:py-3.5">
                  <span
                    className={
                      r.status === "INACTIVE" ?
                        "rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-800 dark:text-zinc-200"
                      : "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900"
                    }
                  >
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right sm:px-4 sm:py-3 md:pl-2 md:pr-5 md:py-3.5">
                  <div className="inline-flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setDetail(r);
                      }}
                      className="rounded-md px-1 py-0.5 text-blue-600 hover:bg-blue-50 hover:underline dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      詳情
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetail(null);
                        setEditing(r);
                      }}
                      className="rounded-md px-1 py-0.5 text-blue-600 hover:bg-blue-50 hover:underline dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      編輯
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ?
          <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">尚無成員</p>
        : null}
      </div>

      {detail ?
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="roster-detail-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="關閉詳情"
            onClick={closeDetail}
          />
          <div className="relative z-10 flex max-h-[min(88vh,640px)] w-full max-w-md flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-h-[min(85vh,560px)] sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <h3 id="roster-detail-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  隊員詳情
                </h3>
                <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{detail.displayName ?? "—"}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="關閉"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm">
              <dl className="space-y-3 text-zinc-800 dark:text-zinc-200">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">角色</dt>
                  <dd>{roleLabel(detail.role)}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">狀態</dt>
                  <dd>
                    <span
                      className={
                        detail.status === "INACTIVE" ?
                          "rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-800 dark:text-zinc-200"
                        : "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900"
                      }
                    >
                      {statusLabel(detail.status)}
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Email</dt>
                  <dd className="min-w-0 break-all">{detail.email ?? "—"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">電話</dt>
                  <dd className="tabular-nums">{detail.phone ?? "—"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">位置</dt>
                  <dd>{detail.position ?? "—"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">分組</dt>
                  <dd>{detail.squad ?? "—"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">背號</dt>
                  <dd className="tabular-nums">{detail.jerseyNumber ?? "—"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Clerk</dt>
                  <dd>{detail.clerkLinked ? "已與登入帳號連結" : "待對方首次登入合併"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">備註</dt>
                  <dd className="whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
                    {detail.notes?.trim() ? detail.notes : "—"}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 border-t border-zinc-100 pt-3 dark:border-zinc-800 sm:flex-row sm:gap-3">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">更新時間</dt>
                  <dd className="text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(detail.updatedAt).toLocaleString("zh-TW", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                關閉
              </button>
              <button
                type="button"
                onClick={() => {
                  const row = detail;
                  closeDetail();
                  setEditing(row);
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                編輯此隊員
              </button>
            </div>
          </div>
        </div>
      : null}

      {editing && initial ?
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="roster-edit-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="關閉編輯"
            onClick={closeEdit}
          />
          <div className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
              <div className="min-w-0">
                <h3 id="roster-edit-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  編輯隊員
                </h3>
                <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">{editing.email ?? editing.id}</p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-800 dark:text-zinc-200"
                aria-label="關閉"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <TeamMemberEditForm
                key={`${editing.id}-${editing.updatedAt}`}
                memberId={editing.id}
                squads={squads}
                isSelf={editing.id === currentMemberId}
                actorIsAdmin={actorIsAdmin}
                initial={initial}
                onSaved={closeEdit}
                onCancel={closeEdit}
              />
            </div>
          </div>
        </div>
      : null}
    </>
  );
}
