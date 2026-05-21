"use client";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["ADMIN", "COACH", "COACH_PLAYER", "STAFF", "PLAYER"] as const;

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

export type TeamMemberEditInitial = {
  displayName: string;
  role: string;
  status: string;
  jerseyNumber: number | null;
  squad: string | null;
  position: string | null;
  phone: string | null;
  notes: string | null;
};

type Props = {
  memberId: string;
  squads: string[];
  isSelf: boolean;
  /** 目前登入者是否為隊伍管理員（註解：非管理員不可變更「管理員」角色）。 */
  actorIsAdmin: boolean;
  initial: TeamMemberEditInitial;
  /** 表單 id（註解：供 BottomSheet footer 以 form 屬性提交）。 */
  formId?: string;
  /** 按鈕改由父層 footer 渲染（註解：避免被原生底欄遮擋）。 */
  externalActions?: boolean;
  /** 儲存中狀態回報（註解：footer 按鈕 disabled 用）。 */
  onPendingChange?: (pending: boolean) => void;
  /** 儲存成功後關閉對話框等（註解：由父層 `TeamRosterSection` 傳入）。 */
  onSaved?: () => void;
  onCancel?: () => void;
};

/** 分組 UI 初始狀態（註解：與新增隊員表單邏輯對齊）。 */
function deriveSquadState(squads: string[], squad: string | null) {
  const sq = squad?.trim() || "";
  if (squads.length === 0) {
    return { choice: "", custom: sq };
  }
  if (!sq) return { choice: "", custom: "" };
  if (squads.includes(sq)) return { choice: sq, custom: "" };
  return { choice: "__custom", custom: sq };
}

/** 單一隊員編輯／停用（註解：PATCH /api/team/members/[id]）。 */
export function TeamMemberEditForm({
  memberId,
  squads,
  isSelf,
  actorIsAdmin,
  initial,
  formId = "team-member-edit-form",
  externalActions = false,
  onPendingChange,
  onSaved,
  onCancel,
}: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);

  const squadInit = deriveSquadState(squads, initial.squad);
  const [squadChoice, setSquadChoice] = useState(squadInit.choice);
  const [squadCustom, setSquadCustom] = useState(squadInit.custom);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    onPendingChange?.(true);

    const fd = new FormData(e.currentTarget);
    const displayName = String(fd.get("displayName") ?? "");
    const role = String(fd.get("role") ?? "PLAYER");
    const status = String(fd.get("status") ?? "ACTIVE");
    const position = String(fd.get("position") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();
    const jerseyRaw = String(fd.get("jerseyNumber") ?? "").trim();

    if (isSelf && status === "INACTIVE") {
      showError("不可將自己的隊籍設為停用");
      setPending(false);
      onPendingChange?.(false);
      return;
    }

    const squad =
      squads.length === 0 ? squadCustom.trim()
      : squadChoice === "__custom" ? squadCustom.trim()
      : squadChoice.trim();

    if (squads.length > 0 && squadChoice === "__custom" && !squadCustom.trim()) {
      showError("已選「其他分組」時請填寫分組名稱");
      setPending(false);
      onPendingChange?.(false);
      return;
    }

    const jerseyNumber =
      jerseyRaw === "" ? null : Number.parseInt(jerseyRaw, 10);
    if (jerseyRaw !== "" && Number.isNaN(jerseyNumber)) {
      showError("背號請填數字或留空");
      setPending(false);
      onPendingChange?.(false);
      return;
    }

    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          status,
          jerseyNumber,
          squad: squad || null,
          position: position || null,
          phone: phone || null,
          notes: notes || null,
          displayName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      onPendingChange?.(false);
      if (!res.ok) {
        showError((data as { error?: string }).error ?? `更新失敗 (${res.status})`);
        return;
      }
      showSuccess("已儲存成員資料");
      onSaved?.();
      router.refresh();
    } catch {
      setPending(false);
      onPendingChange?.(false);
      showError("網路錯誤");
    }
  }

  return (
    <form id={formId} onSubmit={(e) => void onSubmit(e)} className="space-y-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">顯示姓名</label>
          <input
            name="displayName"
            type="text"
            maxLength={120}
            defaultValue={initial.displayName}
            className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">角色</label>
          {!actorIsAdmin && initial.role === "ADMIN" ?
            <>
              <input type="hidden" name="role" value="ADMIN" />
              <p className="mt-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200">
                管理員（僅管理員可變更此角色）
              </p>
            </>
          : (
            <select
              name="role"
              defaultValue={initial.role}
              className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {(actorIsAdmin ? ROLES : ROLES.filter((r) => r !== "ADMIN")).map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">隊籍狀態</label>
          <select
            name="status"
            defaultValue={initial.status}
            disabled={isSelf}
            className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 dark:bg-zinc-800"
          >
            <option value="ACTIVE">在籍</option>
            <option value="INACTIVE">停用</option>
          </select>
          {isSelf ?
            <p className="mt-1.5 text-xs text-amber-800">無法停用自己的隊籍（請由其他管理員操作）。</p>
          : null}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">背號（留空表示無）</label>
          <input
            name="jerseyNumber"
            type="number"
            min={0}
            max={999}
            defaultValue={initial.jerseyNumber ?? ""}
            className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">位置</label>
          <input
            name="position"
            type="text"
            maxLength={64}
            defaultValue={initial.position ?? ""}
            className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">分組</label>
          {squads.length > 0 ?
            <>
              <select
                value={squadChoice}
                onChange={(e) => setSquadChoice(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="">不指定</option>
                {squads.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="__custom">其他（手填）</option>
              </select>
              {squadChoice === "__custom" ?
                <input
                  type="text"
                  value={squadCustom}
                  onChange={(e) => setSquadCustom(e.target.value)}
                  maxLength={32}
                  placeholder="自訂分組"
                  className="mt-2 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  aria-label="自訂分組"
                />
              : null}
            </>
          : (
            <input
              type="text"
              maxLength={32}
              value={squadCustom}
              onChange={(e) => setSquadCustom(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">電話</label>
          <input
            name="phone"
            type="tel"
            maxLength={32}
            defaultValue={initial.phone ?? ""}
            className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">備註</label>
          <textarea
            name="notes"
            rows={3}
            maxLength={2000}
            defaultValue={initial.notes ?? ""}
            className="mt-1.5 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>
      {!externalActions ?
        <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "儲存中…" : "儲存變更"}
          </button>
          {onCancel ?
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-950"
            >
              取消
            </button>
          : null}
        </div>
      : null}
    </form>
  );
}
