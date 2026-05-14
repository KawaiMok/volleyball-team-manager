import { MemberStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { ACTIVE_TEAM_COOKIE_NAME, getTeamMember } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  teamId: z.string().min(1),
});

/**
 * 設定作用中隊伍（註解：寫入 httpOnly cookie；僅能選自己 ACTIVE 隊籍內的 teamId）。
 */
export async function POST(req: Request) {
  const member = await getTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  if (body.teamId === member.teamId) {
    const res = NextResponse.json({ ok: true, teamId: body.teamId });
    return res;
  }

  const prisma = getPrisma();
  const allowed = await prisma.teamMember.findFirst({
    where: {
      userId: member.userId,
      teamId: body.teamId,
      status: MemberStatus.ACTIVE,
    },
  });
  if (!allowed) {
    return NextResponse.json({ error: "無權限切換至該隊伍" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, teamId: body.teamId });
  res.cookies.set(ACTIVE_TEAM_COOKIE_NAME, body.teamId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
