import {
  DATA_VIEW_EVENT,
  DATA_VIEW_STORAGE_KEY,
  type DataViewMode,
  parseDataViewMode,
} from "@/lib/data-view-mode";

/** 讀取數據檢視偏好（註解：預設圖表）。 */
export function getDataViewPreference(): DataViewMode {
  if (typeof window === "undefined") return "chart";
  const v = localStorage.getItem(DATA_VIEW_STORAGE_KEY);
  return parseDataViewMode(v) ?? "chart";
}

export function setDataViewPreference(mode: DataViewMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DATA_VIEW_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(DATA_VIEW_EVENT, { detail: mode }));
}

export function subscribeDataViewPreference(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === DATA_VIEW_STORAGE_KEY) cb();
  };
  const onCustom = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(DATA_VIEW_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DATA_VIEW_EVENT, onCustom);
  };
}
