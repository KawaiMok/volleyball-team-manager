import Link from "next/link";

import { PlayerFeedbackHistoryList } from "@/components/player-feedback-history-list";
import { getTeamMember } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { formatDateTimeZh } from "@/lib/format-datetime";

/** 依提交時間起算 24 小時內可再編輯（註解：與 POST /api/events/[id]/feedback 一致）。 */
function canEditUntil(submittedAt: Date): Date {
  return new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000);
}

/** 我的回饋歷史：依場次列出已提交資料；檢視以 popup 顯示圖表（註解：對應規格 B4）。 */
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

  const items = rows.map((fb) => {
    const editDeadline = canEditUntil(fb.submittedAt);
    const editable = now.getTime() <= editDeadline.getTime();
    return {
      id: fb.id,
      eventId: fb.event.id,
      eventTitle: fb.event.title,
      eventStartsAt: fb.event.startsAt.toISOString(),
      rpe: fb.rpe,
      fatigue: fb.fatigue,
      painLevel: fb.painLevel,
      painArea: fb.painArea,
      note: fb.note,
      submittedAt: fb.submittedAt.toISOString(),
      editable,
      editDeadlineLabel: editable ?
        formatDateTimeZh(editDeadline, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">我的回饋</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          列出你已提交的身體回饋；送出後 24 小時內可於該場事件頁修改。點「檢視」可見圖表與詳情。
        </p>
      </div>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-zinc-900">
        <PlayerFeedbackHistoryList items={items} />
      </ul>
    </div>
  );
}
