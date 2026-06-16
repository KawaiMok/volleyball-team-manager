/** `datetime-local` 的 step（秒）：15 分鐘一格（註解：減少拖曳選分鐘時間）。 */
export const DATETIME_LOCAL_STEP_SECONDS = 15 * 60;

/** 事件表單時間欄位共用屬性（註解：建立／編輯一致；窄螢幕請用 `DatetimeLocalInput` 元件）。 */
export const datetimeInputProps = {
  type: "datetime-local" as const,
  step: DATETIME_LOCAL_STEP_SECONDS,
};

/** 日期時間輸入框共用樣式（註解：含 min-w-0 避免 iOS 撐破版面）。 */
export const datetimeInputClassName =
  "mt-1 w-full min-w-0 max-w-full box-border rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-600";

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** ISO（UTC）→ `datetime-local` 字串（註解：依使用者裝置本機時區顯示於輸入框）。 */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * `datetime-local` → ISO UTC 字串（註解：明確以本機年月日時分解讀，避免 Safari 將無時區字串當 UTC）。
 */
export function parseDatetimeLocalToIso(value: string): string {
  const m = LOCAL_RE.exec(value.trim());
  if (!m) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) throw new Error("invalid datetime");
    return fallback.toISOString();
  }
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    0,
    0,
  );
  if (Number.isNaN(d.getTime())) throw new Error("invalid datetime");
  return d.toISOString();
}
