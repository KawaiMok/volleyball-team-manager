import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "lax" as const,
  httpOnly: true,
};

/** 寫入 debug 身分 cookie（註解：僅開發／內網；上線請改正式 Auth）。 */
export async function POST(req: Request) {
  let body: { userId?: string; teamId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "無效的 JSON" }, { status: 400 });
  }
  const { userId, teamId } = body;
  if (!userId || !teamId) {
    return NextResponse.json({ error: "需要 userId 與 teamId" }, { status: 400 });
  }

  const store = await cookies();
  store.set("debug-user-id", userId, COOKIE_OPTS);
  store.set("debug-team-id", teamId, COOKIE_OPTS);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete("debug-user-id");
  store.delete("debug-team-id");
  return NextResponse.json({ ok: true });
}
