/**
 * 登入／註冊後 fallback 路徑（註解：首頁落地選端 → `?dest=coach`|`player`）。
 */
export function postAuthPathFromDest(dest: string | undefined): string {
  if (dest === "coach") return "/coach";
  if (dest === "player") return "/player";
  return "/";
}
