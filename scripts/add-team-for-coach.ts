/**
 * 為指定使用者新增一筆球隊並設為教練（COACH）（註解：本機維運用，須 .env 有 DATABASE_URL）。
 *
 * 用法：
 *   npx tsx scripts/add-team-for-coach.ts
 *   npx tsx scripts/add-team-for-coach.ts "KAwAI MOK" "我的排球隊"
 *
 * 若找不到使用者：請確認 Clerk 登入過且 User.name／email 與資料庫一致，或先用 bootstrap／claim。
 */

import path from "path";
import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { MemberStatus, PrismaClient, TeamRole } from "../src/generated/prisma/client";

config({ path: path.join(__dirname, "..", ".env") });

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少 DATABASE_URL");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

async function findCoachUser(prisma: PrismaClient, nameHint: string) {
  const exact = await prisma.user.findFirst({
    where: { name: { equals: nameHint, mode: "insensitive" } },
  });
  if (exact) return exact;

  const parts = nameHint.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const u = await prisma.user.findFirst({
      where: {
        AND: parts.map((p) => ({
          name: { contains: p, mode: "insensitive" as const },
        })),
      },
    });
    if (u) return u;
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: parts[0] ?? nameHint, mode: "insensitive" } },
        { email: { contains: (parts[0] ?? nameHint).toLowerCase(), mode: "insensitive" } },
      ],
    },
  });
}

async function main() {
  const nameHint = process.argv[2] ?? "KAwAI MOK";
  const teamName =
    process.argv[3] ?? `${nameHint.trim()} 球隊 (${new Date().getFullYear()})`;

  const prisma = createPrisma();

  const coach = await findCoachUser(prisma, nameHint);
  if (!coach) {
    console.error(
      `找不到姓名／Email 符合「${nameHint}」的使用者。請先以 Clerk 登入過讓系統建立 User，或調整關鍵字。`,
    );
    process.exit(1);
  }

  const defaultOrg = await prisma.organization.findUnique({ where: { slug: "aaaism" } });
  if (!defaultOrg) {
    console.error("找不到預設組織（slug: aaaism），請先執行 migration。");
    process.exit(1);
  }

  const team = await prisma.team.create({
    data: {
      organizationId: defaultOrg.id,
      name: teamName,
      season: String(new Date().getFullYear()),
      groupConfig: ["A", "B"],
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: coach.id,
      role: TeamRole.COACH,
      status: MemberStatus.ACTIVE,
      jerseyNumber: null,
      squad: "A",
    },
  });

  console.log("已建立球隊並指派教練：");
  console.log(`  隊伍：${team.name} (${team.id})`);
  console.log(`  使用者：${coach.name ?? coach.email ?? coach.id} (${coach.id})`);
  console.log(`  提示：多隊時請在頂部「切換隊伍」選取此隊，或使用 cookie active-team-id = ${team.id}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
