import Link from "next/link";

import { getTeamMember } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";

function fatigueLabel(f: FatigueLevel) {
  switch (f) {
    case "LOW":
      return "低";
    case "MED":
      return "中";
    case "HIGH":
      return "高";
    default:
      return f;
  }
}

function painLabel(p: PainLevel) {
  switch (p) {
    case "NONE":
      return "無";
    case "MILD":
      return "輕微";
    case "SEVERE":
      return "明顯";
    default:
      return p;
  }
}

/** 依提交時間起算 24 小時內可再編輯（註解：與 POST /api/events/[id]/feedback 一致）。 */
function canEditUntil(submittedAt: Date): Date {
  return new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000);
}

/** 我的回饋歷史：依場次列出已提交資料與是否仍可編輯（註解：對應規格 B4）。 */
export default async function PlayerFeedbackHistoryPage() {
  const member = await getTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const now = new Date();

  const rows = await prisma.feedback.findMany({
    where: {
      memberId: member.id,
      event: { teamId: member.teamId },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">我的回饋</h1>
        <p className="mt-1 text-sm text-slate-600">
          列出你已提交的身體回饋；送出後 24 小時內可於該場事件頁修改。
        </p>
      </div>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ?
          <li className="px-4 py-12 text-center text-sm text-slate-500">
            尚無回饋紀錄。事件結束後可在該場「身體回饋」區填寫。
          </li>
        : rows.map((fb) => {
            const editDeadline = canEditUntil(fb.submittedAt);
            const editable = now.getTime() <= editDeadline.getTime();
            return (
              <li key={fb.id} className="px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/player/events/${fb.event.id}`}
                      className="font-medium text-slate-900 hover:text-blue-700 hover:underline"
                    >
                      {fb.event.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      場次：{fb.event.startsAt.toLocaleString("zh-TW", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      RPE {fb.rpe} · 疲勞 {fatigueLabel(fb.fatigue)} · 疼痛 {painLabel(fb.painLevel)}
                      {fb.painArea ?
                        <span className="text-slate-600">（{fb.painArea}）</span>
                      : null}
                    </p>
                    {fb.note ?
                      <p className="mt-1 text-sm text-slate-600">備註：{fb.note}</p>
                    : null}
                    <p className="mt-2 text-xs text-slate-500">
                      送出時間：{fb.submittedAt.toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                    {editable ?
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                        可編輯至 {editDeadline.toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        已鎖定
                      </span>
                    )}
                    <Link
                      href={`/player/events/${fb.event.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      前往場次詳情 →
                    </Link>
                  </div>
                </div>
              </li>
            );
          })
        }
      </ul>
    </div>
  );
}
