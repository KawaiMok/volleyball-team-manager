import Link from "next/link";

import { CourtFormationEditor } from "@/app/coach/(main)/events/[id]/court-formation-editor";
import { getDebugTeamMember } from "@/lib/debug-session";
import { parseCourtSketch } from "@/lib/court-sketch-schema";
import { getPrisma } from "@/lib/prisma";

/** 即時戰術版：與事件「場上企位」相同編輯能力，資料存 Team.liveTacticalSketch（註解：自總覽進入）。 */
export default async function CoachLiveTacticalPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const team = await getPrisma().team.findUnique({
    where: { id: member.teamId },
    select: { liveTacticalSketch: true },
  });

  const initial = parseCourtSketch(team?.liveTacticalSketch ?? null);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/coach" className="text-sm text-blue-600 hover:underline">
          ← 總覽
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">即時戰術版</h1>
        <p className="mt-1 text-sm text-zinc-600">
          與「場上企位」相同工具（球員／球標記、畫線、備註）；適合場邊即時講解，儲存後僅影響此白板，與各事件企位圖分開。
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <CourtFormationEditor variant="liveTactical" initial={initial} disabled={false} />
      </section>
    </div>
  );
}
