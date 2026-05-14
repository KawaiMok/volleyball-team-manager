/**
 * 依 .env 的 DATABASE_URL 連到 postgres 資料庫，若目標 DB 不存在則 CREATE DATABASE。
 * 不需互動輸入密碼（密碼已寫在 DATABASE_URL）（註解：密碼含特殊字元請先 URL 編碼）。
 */
const path = require("path");
const pg = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl.includes("johndoe") || dbUrl.includes("randompassword")) {
  console.error(
    "請編輯 .env：將 DATABASE_URL 改為你的 Postgres 帳密與資料庫名 volleyball_team（勿沿用範例假字串）。",
  );
  process.exit(1);
}

let u;
try {
  u = new URL(dbUrl);
} catch {
  console.error("DATABASE_URL 格式無效");
  process.exit(1);
}

const dbName = u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
if (!dbName) {
  console.error("DATABASE_URL 缺少路徑中的資料庫名稱（例如 /volleyball_team）");
  process.exit(1);
}

const client = new pg.Client({
  host: u.hostname || "127.0.0.1",
  port: u.port ? Number(u.port) : 5432,
  user: decodeURIComponent(u.username || "postgres"),
  password: u.password ? decodeURIComponent(u.password) : undefined,
  database: "postgres",
});

async function main() {
  await client.connect();
  const r = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (r.rows.length === 0) {
    const safe = /^[a-zA-Z0-9_]+$/.test(dbName) ? dbName : null;
    if (!safe) {
      console.error("資料庫名稱僅允許英數與底線");
      process.exit(1);
    }
    await client.query(`CREATE DATABASE "${safe}"`);
    console.log(`已建立資料庫: ${safe}`);
  } else {
    console.log(`資料庫已存在，略過建立: ${dbName}`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
