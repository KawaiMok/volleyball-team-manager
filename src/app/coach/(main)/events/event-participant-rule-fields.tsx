"use client";

import { useCallback, useMemo } from "react";

import type { ParticipantRule } from "@/lib/participant-rule-types";

/** 可選參與者列（註解：僅 ACTIVE；與 Prisma 分離供 client 使用）。 */
export type EventRosterRow = {
  id: string;
  displayName: string;
  squad: string | null;
  role: string;
};

function roleLabel(role: string): string {
  switch (role) {
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
      return role;
  }
}

type Props = {
  squads: string[];
  roster: EventRosterRow[];
  value: ParticipantRule;
  onChange: (next: ParticipantRule) => void;
  disabled?: boolean;
};

/** 建立／編輯事件：參與者規則（全隊／分組／指名）（註解：對應 API `participantRule`）。 */
export function EventParticipantRuleFields({ squads, roster, value, onChange, disabled }: Props) {
  const rosterIds = useMemo(() => roster.map((r) => r.id), [roster]);

  const setKindAll = useCallback(() => {
    onChange({ kind: "ALL" });
  }, [onChange]);

  const setKindSquads = useCallback(() => {
    if (value.kind === "SQUADS") {
      onChange({ kind: "SQUADS", squads: value.squads.length ? value.squads : squads.slice(0, 1) });
      return;
    }
    onChange({ kind: "SQUADS", squads: squads.length > 0 ? [squads[0]] : [] });
  }, [onChange, squads, value]);

  const setKindMembers = useCallback(() => {
    if (value.kind === "MEMBERS") {
      onChange({ kind: "MEMBERS", memberIds: value.memberIds });
      return;
    }
    onChange({ kind: "MEMBERS", memberIds: rosterIds });
  }, [onChange, rosterIds, value]);

  const toggleSquad = (squad: string, checked: boolean) => {
    if (value.kind !== "SQUADS") return;
    const set = new Set(value.squads);
    if (checked) set.add(squad);
    else set.delete(squad);
    onChange({ kind: "SQUADS", squads: [...set] });
  };

  const toggleMember = (memberId: string, checked: boolean) => {
    if (value.kind !== "MEMBERS") return;
    const set = new Set(value.memberIds);
    if (checked) set.add(memberId);
    else set.delete(memberId);
    onChange({ kind: "MEMBERS", memberIds: [...set] });
  };

  const selectAllMembers = () => {
    if (value.kind !== "MEMBERS") return;
    onChange({ kind: "MEMBERS", memberIds: [...rosterIds] });
  };

  const clearMembers = () => {
    if (value.kind !== "MEMBERS") return;
    onChange({ kind: "MEMBERS", memberIds: [] });
  };

  return (
    <fieldset disabled={disabled} className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4">
      <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">參與對象</legend>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        決定哪些在籍隊員會收到出席意願通知；儲存後會同步名單（移除者將刪除該場回饋紀錄）。
      </p>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="radio"
            name="participant-rule-kind"
            checked={value.kind === "ALL"}
            onChange={() => setKindAll()}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">全隊</span>
            <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">所有狀態為在籍的隊員</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="radio"
            name="participant-rule-kind"
            checked={value.kind === "SQUADS"}
            onChange={() => setKindSquads()}
            disabled={squads.length === 0}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">依分組</span>
            <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {squads.length === 0 ?
                "尚未設定分組標籤（請至隊伍／隊員的「分組」欄或隊伍分組設定）"
              : "可複選分組，符合任一分組即在名單內"}
            </span>
          </span>
        </label>

        {value.kind === "SQUADS" && squads.length > 0 ?
          <div className="ml-6 flex flex-wrap gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            {squads.map((sq) => (
              <label key={sq} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.squads.includes(sq)}
                  onChange={(e) => toggleSquad(sq, e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
                {sq}
              </label>
            ))}
          </div>
        : null}

        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="radio"
            name="participant-rule-kind"
            checked={value.kind === "MEMBERS"}
            onChange={() => setKindMembers()}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">指名隊員</span>
            <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">自下列在籍名單勾選（可含教練／隊務）</span>
          </span>
        </label>

        {value.kind === "MEMBERS" ?
          <div className="ml-6 max-h-56 space-y-2 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => selectAllMembers()}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-50 dark:bg-zinc-950"
              >
                全選
              </button>
              <button
                type="button"
                onClick={() => clearMembers()}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 hover:bg-zinc-50 dark:bg-zinc-950"
              >
                全不選
              </button>
            </div>
            <ul className="space-y-1.5">
              {roster.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value.memberIds.includes(m.id)}
                      onChange={(e) => toggleMember(m.id, e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{m.displayName}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {roleLabel(m.role)}
                      {m.squad ? ` · ${m.squad}` : ""}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {roster.length === 0 ?
              <p className="text-xs text-amber-800">目前沒有在籍隊員可選。</p>
            : null}
          </div>
        : null}
      </div>
    </fieldset>
  );
}

/** 送出前檢查（註解：回傳錯誤訊息字串，無誤則 null）。 */
export function validateParticipantRuleForSubmit(
  rule: ParticipantRule,
  squads: string[],
): string | null {
  if (rule.kind === "SQUADS") {
    if (squads.length === 0) return "尚未設定分組，無法使用「依分組」。";
    if (rule.squads.length === 0) return "請至少勾選一個分組。";
  }
  if (rule.kind === "MEMBERS" && rule.memberIds.length === 0) {
    return "指名模式請至少選擇一位隊員。";
  }
  return null;
}
