/**
 * 從 API 回應解析錯誤訊息（註解：搭配 toast 顯示）。
 */
export async function readApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? `${fallback} (${res.status})`;
}
