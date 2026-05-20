/** 事件是否已結束（註解：以 `endsAt` 與目前時間比較）。 */
export function isEventEnded(endsAt: Date, now: Date = new Date()): boolean {
  return endsAt.getTime() <= now.getTime();
}
