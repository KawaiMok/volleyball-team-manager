import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isDebugAuthEnabled } from "@/lib/debug-auth-access";

function cookieOpts() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}

/** 寫入 debug 身分 cookie（註解：僅開發；正式環境由 isDebugAuthEnabled 強制關閉）。 */
export async function POST(req: Request) {
  if (!isDebugAuthEnabled()) {
    return NextResponse.json({ error: "Debug 身分未開放" }, { status: 403 });
  }

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
  const opts = cookieOpts();
  store.set("debug-user-id", userId, opts);
  store.set("debug-team-id", teamId, opts);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  if (!isDebugAuthEnabled()) {
    return NextResponse.json({ error: "Debug 身分未開放" }, { status: 403 });
  }

  const store = await cookies();
  store.delete("debug-user-id");
  store.delete("debug-team-id");
  return NextResponse.json({ ok: true });
}
