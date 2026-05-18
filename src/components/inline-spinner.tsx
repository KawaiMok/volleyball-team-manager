/** 按鈕內嵌轉圈（註解：取代文字，表示導覽／重整進行中）。 */
export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}
