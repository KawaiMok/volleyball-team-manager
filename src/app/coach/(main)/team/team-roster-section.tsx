"use client";
import { formatDateTimeZh } from "@/lib/format-datetime";

import { useCallback, useEffect, useState } from "react";

import {
  TeamMemberEditForm,
  type TeamMemberEditInitial,
} from "@/app/coach/(main)/team/team-member-edit-form";
import { TeamMemberStatusIndicator } from "@/components/domain-status-indicators";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { HorizontalScrollHint } from "@/components/ui/horizontal-scroll-hint";

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

/** 編輯表單 id（註解：footer 按鈕以 form 屬性關聯）。 */
const ROSTER_EDIT_FORM_ID = "roster-edit-form";

/** 隊員表格 + 詳情唯讀彈窗 + 編輯對話框（註解：主表僅列必要欄，其餘於「詳情」查看）。 */
export function TeamRosterSection({ squads, currentMemberId, rows, actorIsAdmin }: Props) {
  const [editing, setEditing] = useState<TeamRosterRow | null>(null);
  const [detail, setDetail] = useState<TeamRosterRow | null>(null);
  const [editPending, setEditPending] = useState(false);

  const closeEdit = useCallback(() => {
    setEditPending(false);
    setEditing(null);
  }, []);
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

  const initial: TeamMemberEditInitial | null =
    editing ?
      {
        displayName: editing.displayName ?? "",
        email: editing.email ?? "",
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
      {/** 註解：手機加寬 min-w；HorizontalScrollHint 提示右側還有「操作」欄。 */}
      <HorizontalScrollHint hint="右滑查看操作">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm md:min-w-[40rem] md:text-[0.9375rem]">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 md:text-[11px]">
            <tr>
              <th className="min-w-[5.5rem] px-3 py-2.5 text-left font-medium sm:px-4 sm:py-3 md:min-w-[12rem] md:px-5 md:py-3.5">姓名</th>
              <th className="min-w-[4.5rem] whitespace-nowrap px-3 py-2.5 text-left font-medium sm:px-4 sm:py-3 md:px-4 md:py-3.5">角色</th>
              <th className="w-[3.25rem] whitespace-nowrap px-2 py-2.5 text-center font-medium sm:px-3 sm:py-3 md:w-[4.5rem] md:py-3.5">背號</th>
              <th className="w-[3rem] whitespace-nowrap px-2 py-2.5 text-center font-medium sm:px-3 sm:py-3 md:w-[4.5rem] md:py-3.5">狀態</th>
              <th className="min-w-[7.5rem] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4 sm:py-3 md:min-w-[10rem] md:pl-2 md:pr-5 md:py-3.5">操作</th>
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
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-800 dark:text-zinc-200 sm:px-4 sm:py-3 md:px-4 md:py-3.5">{roleLabel(r.role)}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-center tabular-nums text-zinc-800 dark:text-zinc-200 sm:px-3 sm:py-3 md:px-3 md:py-3.5">{r.jerseyNumber ?? "—"}</td>
                <td className="whitespace-nowrap px-2 py-2.5 text-center sm:px-3 sm:py-3 md:py-3.5">
                  <TeamMemberStatusIndicator status={r.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right sm:px-4 sm:py-3 md:pl-2 md:pr-5 md:py-3.5">
                  <div className="inline-flex flex-row items-center justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setDetail(r);
                      }}
                      className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 hover:underline dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      詳情
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetail(null);
                        setEditPending(false);
                        setEditing(r);
                      }}
                      className="shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 hover:underline dark:text-blue-400 dark:hover:bg-blue-950/40"
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
      </HorizontalScrollHint>

      {detail ?
        <BottomSheet
          open
          onClose={closeDetail}
          title="隊員詳情"
          subtitle={detail.displayName ?? "—"}
          titleId="roster-detail-title"
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          }
        >
          <dl className="space-y-3 text-sm text-zinc-800 dark:text-zinc-200">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">角色</dt>
              <dd>{roleLabel(detail.role)}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
              <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">狀態</dt>
              <dd>
                <TeamMemberStatusIndicator status={detail.status} />
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
                {formatDateTimeZh(new Date(detail.updatedAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          </dl>
        </BottomSheet>
      : null}

      {editing && initial ?
        <BottomSheet
          open
          onClose={closeEdit}
          title="編輯隊員"
          subtitle={editing.email ?? editing.id}
          titleId="roster-edit-title"
          tall
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEdit}
                disabled={editPending}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                type="submit"
                form={ROSTER_EDIT_FORM_ID}
                disabled={editPending}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {editPending ? "儲存中…" : "儲存變更"}
              </button>
            </div>
          }
        >
          <TeamMemberEditForm
            key={`${editing.id}-${editing.updatedAt}`}
            memberId={editing.id}
            squads={squads}
            isSelf={editing.id === currentMemberId}
            actorIsAdmin={actorIsAdmin}
            clerkLinked={editing.clerkLinked}
            initial={initial}
            formId={ROSTER_EDIT_FORM_ID}
            externalActions
            onPendingChange={setEditPending}
            onSaved={closeEdit}
            onCancel={closeEdit}
          />
        </BottomSheet>
      : null}
    </>
  );
}
