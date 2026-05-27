import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

/** 寫入平台審計 log（註解：Phase 2 可接 UI）。 */
export async function writePlatformAuditLog(input: {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const prisma = getPrisma();
  await prisma.platformAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? undefined,
    },
  });
}

/** 組織 slug 正規化（註解：小寫英數與連字號）。 */
export function normalizeOrgSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 驗證 slug 格式是否合法。 */
export function isValidOrgSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 48 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
