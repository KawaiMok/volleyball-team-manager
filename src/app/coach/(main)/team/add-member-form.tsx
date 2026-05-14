"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** 隊伍分組標籤（註解：來自 `Team.groupConfig`，與行事曆／事件篩選一致）。 */
  squads: string[];
  /** 是否可選「管理員」（註解：與 API 僅管理員可指派 ADMIN 一致）。 */
  actorIsAdmin: boolean;
};

/** 與 Prisma TeamRole 一致（註解：client 不 import generated enum）。 */
const ROLES = ["ADMIN", "COACH", "STAFF", "PLAYER"] as const;

function roleLabel(r: string) {
  switch (r) {
    case "ADMIN":
      return "管理員";
    case "COACH":
      return "教練";
    case "STAFF":
      return "隊務";
    case "PLAYER":
      return "球員";
    default:
      return r;
  }
}

/** 依 Email 新增隊員／隊務（註解：POST /api/team/members；含預備姓名、位置、分組、聯絡與備註）。 */
export function AddTeamMemberForm({ squads, actorIsAdmin }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [squadChoice, setSquadChoice] = useState("");
  const [squadCustom, setSquadCustom] = useState("");
  const rolesForInvite = actorIsAdmin ? ROLES : ROLES.filter((r) => r !== "ADMIN");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const role = String(fd.get("role") ?? "PLAYER");
    const displayName = String(fd.get("displayName") ?? "").trim();
    const position = String(fd.get("position") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();
    const jerseyRaw = String(fd.get("jerseyNumber") ?? "").trim();

    const squad =
      squads.length === 0 ? squadCustom.trim()
      : squadChoice === "__custom" ? squadCustom.trim()
      : squadChoice.trim();

    const jerseyNumber =
      jerseyRaw === "" ? null : Number.parseInt(jerseyRaw, 10);
    if (jerseyRaw !== "" && Number.isNaN(jerseyNumber)) {
      setError("背號請填數字");
      setPending(false);
      return;
    }

    if (squads.length > 0 && squadChoice === "__custom" && !squadCustom.trim()) {
      setError("已選「其他分組」時請填寫分組名稱");
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          jerseyNumber,
          squad: squad || null,
          displayName: displayName || null,
          position: position || null,
          phone: phone || null,
          notes: notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `失敗 (${res.status})`);
        return;
      }
      setDone(`已加入：${email}`);
      e.currentTarget.reset();
      setSquadChoice("");
      setSquadCustom("");
      router.refresh();
    } catch {
      setPending(false);
      setError("網路錯誤");
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {error ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      : null}
      {done ?
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{done}</p>
      : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="invite-email" className="block text-sm font-medium text-zinc-700">
            對方登入信箱（Clerk 主要 Email）<span className="text-red-600">*</span>
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@example.com"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            須與對方 Clerk 帳號信箱一致，首次登入才能自動合併至此使用者。
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="invite-display" className="block text-sm font-medium text-zinc-700">
            預備顯示姓名（選填）
          </label>
          <input
            id="invite-display"
            name="displayName"
            type="text"
            maxLength={120}
            placeholder="例如：王小明（尚未登入時可先顯示於名單）"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            若對方 User 尚無姓名，會寫入顯示名；已有 Clerk 姓名則不覆蓋。
          </p>
        </div>

        <div>
          <label htmlFor="invite-role" className="block text-sm font-medium text-zinc-700">
            角色
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="PLAYER"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          >
            {rolesForInvite.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="invite-jersey" className="block text-sm font-medium text-zinc-700">
            背號（選填）
          </label>
          <input
            id="invite-jersey"
            name="jerseyNumber"
            type="number"
            min={0}
            max={999}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="invite-position" className="block text-sm font-medium text-zinc-700">
            位置（選填）
          </label>
          <input
            id="invite-position"
            name="position"
            type="text"
            maxLength={64}
            placeholder="例如：舉球員、自由球員"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="invite-squad-select" className="block text-sm font-medium text-zinc-700">
            分組
          </label>
          {squads.length > 0 ?
            <>
              <select
                id="invite-squad-select"
                value={squadChoice}
                onChange={(e) => setSquadChoice(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
                  placeholder="自訂分組名稱"
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  aria-label="自訂分組"
                />
              : null}
            </>
          : (
            <input
              id="invite-squad-free"
              type="text"
              maxLength={32}
              value={squadCustom}
              onChange={(e) => setSquadCustom(e.target.value)}
              placeholder="例如：A（尚未設定隊伍分組標籤時可自由填寫）"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          )}
          {squads.length === 0 ?
            <p className="mt-1 text-xs text-zinc-500">
              隊伍尚未設定分組清單時可直接填寫；送出時會帶入「分組」欄位。
            </p>
          : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="invite-phone" className="block text-sm font-medium text-zinc-700">
            聯絡電話（選填）
          </label>
          <input
            id="invite-phone"
            name="phone"
            type="tel"
            maxLength={32}
            autoComplete="tel"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="invite-notes" className="block text-sm font-medium text-zinc-700">
            備註（選填）
          </label>
          <textarea
            id="invite-notes"
            name="notes"
            rows={2}
            maxLength={2000}
            placeholder="隊內備註（僅教練端可見）"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "送出中…" : "加入隊伍"}
      </button>
    </form>
  );
}
