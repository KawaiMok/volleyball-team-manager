/** 數據檢視模式（註解：表格 vs 圖表）。 */
export type DataViewMode = "table" | "chart";

export const DATA_VIEW_STORAGE_KEY = "vtm-data-view-mode";

export const DATA_VIEW_EVENT = "vtm-data-view-change";

export function parseDataViewMode(v: string | null | undefined): DataViewMode | null {
  if (v === "table" || v === "chart") return v;
  return null;
}

export const DATA_VIEW_LABELS: Record<DataViewMode, string> = {
  table: "表格",
  chart: "圖表",
};
