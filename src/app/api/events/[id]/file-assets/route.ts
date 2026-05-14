import { FileAssetCategory, FileAssetKind } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const postSchema = z.object({
  url: z.string().min(1).max(2000),
  name: z.string().max(200).optional().nullable(),
  category: z
    .nativeEnum(FileAssetCategory)
    .refine(
      (c) => c === FileAssetCategory.TACTICAL_BOARD || c === FileAssetCategory.VIDEO,
      { message: "category 須為戰術板或影片" },
    ),
});

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 新增事件連結（戰術板／影片）（註解：寫入 FileAsset，僅教練端）。 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const urlTrim = body.url.trim();
  if (!isValidHttpUrl(urlTrim)) {
    return NextResponse.json({ error: "須為有效的 http 或 https 網址" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  const nameTrim = body.name?.trim() || null;

  const row = await prisma.fileAsset.create({
    data: {
      teamId: member.teamId,
      eventId,
      uploadedByMemberId: member.id,
      kind: FileAssetKind.LINK,
      category: body.category,
      url: urlTrim,
      name: nameTrim,
    },
  });

  return NextResponse.json(row, { status: 201 });
}
