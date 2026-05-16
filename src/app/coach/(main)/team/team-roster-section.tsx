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

/** 隊員表格 + 編輯用全螢幕對話框（註解：避免表單擠在 td 內難以操作）。 */
export function TeamRosterSection({ squads, currentMemberId, rows, actorIsAdmin }: Props) {
  const [editing, setEditing] = useState<TeamRosterRow | null>(null);

  const close = useCallback(() => setEditing(null), []);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, close]);

  useEffect(() => {
    if (!editing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editing]);

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
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">姓名</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">背號</th>
              <th className="px-4 py-3 font-medium">位置</th>
              <th className="px-4 py-3 font-medium">分組</th>
              <th className="px-4 py-3 font-medium">電話</th>
              <th className="px-4 py-3 font-medium">狀態</th>
              <th className="px-4 py-3 font-medium">Clerk</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={
                  r.status === "INACTIVE" ?
                    "bg-zinc-50 text-zinc-600 hover:bg-zinc-100/80"
                  : "hover:bg-zinc-50/80"
                }
              >
                <td className="px-4 py-3 font-medium text-zinc-900">{r.displayName ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-700">{r.email ?? "—"}</td>
                <td className="px-4 py-3">{roleLabel(r.role)}</td>
                <td className="px-4 py-3 tabular-nums">{r.jerseyNumber ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-700">{r.position ?? "—"}</td>
                <td className="px-4 py-3">{r.squad ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums text-zinc-600">{r.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      r.status === "INACTIVE" ?
                        "rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-800"
                      : "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900"
                    }
                  >
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{r.clerkLinked ? "已連結" : "待登入合併"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="text-blue-600 hover:underline"
                  >
                    編輯
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ?
          <p className="px-4 py-8 text-center text-sm text-zinc-500">尚無成員</p>
        : null}
      </div>

      {editing && initial ?
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="roster-edit-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="關閉編輯"
            onClick={close}
          />
          <div className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
              <div className="min-w-0">
                <h3 id="roster-edit-title" className="text-lg font-semibold text-zinc-900">
                  編輯隊員
                </h3>
                <p className="mt-1 truncate text-sm text-zinc-600">{editing.email ?? editing.id}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
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
                onSaved={close}
                onCancel={close}
              />
            </div>
          </div>
        </div>
      : null}
    </>
  );
}
