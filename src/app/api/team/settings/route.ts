import { NextResponse } from "next/server";
import { z } from "zod";

import { getDebugTeamMember } from "@/lib/debug-session";
import { normalizeGroupConfigLabels } from "@/lib/group-config";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { parseTeamNotificationSettings, type TeamNotificationSettings } from "@/lib/team-notification-settings";

const notificationBodySchema = z.object({
  emailRsvpReminderToPlayers: z.boolean(),
  emailDigestToCoaches: z.boolean(),
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    season: z.union([z.string().max(64), z.null()]).optional(),
    groupLabels: z.array(z.string()).max(25).optional(),
    notificationSettings: notificationBodySchema.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "至少需要一個欄位" });

/** 更新隊伍名稱、賽季、分組標籤、通知偏好（註解：教練／管理員；`groupLabels` 整包覆寫 `groupConfig`）。 */
export async function PATCH(req: Request) {
  const actor = await getDebugTeamMember();
  if (!actor) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(actor)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.team.findUnique({
    where: { id: actor.teamId },
    select: { notificationSettings: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "找不到隊伍" }, { status: 404 });
  }

  const data: {
    name?: string;
    season?: string | null;
    groupConfig?: string[];
    notificationSettings?: TeamNotificationSettings;
  } = {};

  if (body.name != null) {
    data.name = body.name.trim();
  }
  if (body.season !== undefined) {
    data.season = body.season === null ? null : body.season.trim() || null;
  }
  if (body.groupLabels !== undefined) {
    data.groupConfig = normalizeGroupConfigLabels(body.groupLabels);
  }
  if (body.notificationSettings !== undefined) {
    const prev = parseTeamNotificationSettings(existing.notificationSettings);
    data.notificationSettings = {
      ...prev,
      ...body.notificationSettings,
    };
  }

  const team = await prisma.team.update({
    where: { id: actor.teamId },
    data,
    select: {
      id: true,
      name: true,
      season: true,
      timezone: true,
      groupConfig: true,
      notificationSettings: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(team);
}
