import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
