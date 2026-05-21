"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "volleyball-coach-dashboard-widgets-v1";

/** 可切換的總覽區塊 ID（註解：與 localStorage JSON 鍵一致）。 */
export type CoachDashboardWidgetId = "stats" | "todayTraining" | "rsvp" | "upcoming" | "trends";

type Prefs = Record<CoachDashboardWidgetId, boolean>;

const DEFAULT_PREFS: Prefs = {
  stats: true,
  todayTraining: true,
  rsvp: true,
  upcoming: true,
  trends: true,
};

function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

type Ctx = {
  prefs: Prefs;
  setWidget: (id: CoachDashboardWidgetId, visible: boolean) => void;
};

const DashboardCtx = createContext<Ctx | null>(null);

/** 儀表板顯示偏好（註解：仅存本機，不寫後端）。 */
export function CoachDashboardProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  const setWidget = useCallback((id: CoachDashboardWidgetId, visible: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: visible };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ prefs, setWidget }), [prefs, setWidget]);

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useCoachDashboardPrefs(): Ctx {
  const v = useContext(DashboardCtx);
  if (!v) throw new Error("CoachDashboardProvider 必須包住總覽內容");
  return v;
}

const WIDGET_LABELS: Record<CoachDashboardWidgetId, string> = {
  stats: "統計卡（草稿／7 天場次／待回覆出席意願）",
  todayTraining: "今日訓練 · 身體回饋",
  rsvp: "出席意願待追蹤列表",
  upcoming: "未來 7 天行程",
  trends: "近 30 天 RPE 趨勢圖",
};

/** 依偏好顯示／隱藏區塊（註解：首屏與伺服端一致，hydrate 後再套用 localStorage）。 */
export function CoachDashboardSection({
  id,
  children,
}: {
  id: CoachDashboardWidgetId;
  children: ReactNode;
}) {
  const { prefs } = useCoachDashboardPrefs();
  if (!prefs[id]) return null;
  return <div data-coach-dash-widget={id}>{children}</div>;
}

/** 自訂總覽區塊顯示（註解：摺疊面板 + checkbox）。 */
export function CoachDashboardSettingsPanel() {
  const { prefs, setWidget } = useCoachDashboardPrefs();
  const [open, setOpen] = useState(false);
  const ids = Object.keys(WIDGET_LABELS) as CoachDashboardWidgetId[];

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">儀表板配置</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950"
        >
          {open ? "收合" : "顯示項目"}
        </button>
      </div>
      {open ?
        <ul className="mt-3 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
          {ids.map((wid) => (
            <li key={wid}>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-zinc-300 dark:border-zinc-600"
                  checked={prefs[wid]}
                  onChange={(e) => setWidget(wid, e.target.checked)}
                />
                <span>{WIDGET_LABELS[wid]}</span>
              </label>
            </li>
          ))}
        </ul>
      : (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">勾選要顯示的區塊；設定僅存在此瀏覽器。</p>
      )}
    </div>
  );
}
