import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isDebugAuthEnabled } from "@/lib/debug-auth-access";

/** 不需 Clerk session 的 API（註解：其餘 /api/* 在 middleware 層強制 auth.protect）。 */
const PUBLIC_API_PATHS = new Set(["/api/bootstrap"]);

function isPublicApiPath(path: string): boolean {
  if (PUBLIC_API_PATHS.has(path)) return true;
  if (path.startsWith("/api/debug/") && isDebugAuthEnabled()) return true;
  return false;
}

/**
 * Clerk session 需套用在大部分路由，`auth()` 才能在 API／Server Component 讀取（註解：`/coach`、`/player`、`/onboarding` 強制登入，`/coach/login` 除外）。
 */
export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  if (path === "/coach/login" || path.startsWith("/coach/login/")) {
    return NextResponse.next();
  }
  if (path.startsWith("/coach")) {
    await auth.protect();
  }
  if (path.startsWith("/player")) {
    await auth.protect();
  }
  if (path === "/onboarding" || path.startsWith("/onboarding/")) {
    await auth.protect();
  }
  /** 平台／組織後台需登入（註解：細粒度 RBAC 在 layout／API）。 */
  if (path.startsWith("/platform") || path.startsWith("/org")) {
    await auth.protect();
  }
  if (path.startsWith("/api/") && !isPublicApiPath(path)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
