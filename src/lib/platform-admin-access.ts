/**
 * 平台超管 Email 白名單（註解：逗號分隔；與 PlatformAdmin 表互補，方便首次開通）。
 */
export function getPlatformAdminEmailsFromEnv(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** 判斷 Email 是否在環境變數白名單（註解：大小寫不敏感）。 */
export function isEmailInPlatformAdminEnv(email: string | null | undefined): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  return getPlatformAdminEmailsFromEnv().includes(norm);
}
