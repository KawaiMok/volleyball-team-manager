import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7：必須透過 Postgres driver adapter 建立 Client（註解：連線字串讀 DATABASE_URL）。
 * 延遲建立：避免 `next build` 在未設定環境變數時就連線失敗。
 */
/** 變更 Prisma schema 後遞增，強制重建 Client（註解：避免 dev 熱重載仍沿用舊 singleton 而報 Unknown argument）。 */
const PRISMA_CLIENT_SCHEMA_VERSION = 6;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  prismaSchemaVersion: number | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少環境變數 DATABASE_URL");
  }
  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prismaSchemaVersion !== PRISMA_CLIENT_SCHEMA_VERSION) {
    void globalForPrisma.prisma?.$disconnect();
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaSchemaVersion = PRISMA_CLIENT_SCHEMA_VERSION;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}
